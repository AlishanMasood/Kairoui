import { getCellValue } from "@kairoui/core/components";
import type { ExpansionState, RowId } from "@kairoui/core/components";
import type { DataGridColumnDef } from "./column-types";
import { computeAggregates, computeFooterAggregates } from "./aggregation";

// ─── Grouping state ────────────────────────────────────────────────

/**
 * Grouping selection — an ordered list of column IDs. Depth `0` is the
 * outermost group; each subsequent entry nests inside the previous.
 * Empty array = ungrouped (leaf nodes only).
 */
export interface GroupingState {
  readonly groupBy: readonly string[];
}

/** Suggested prefix for synthesized group IDs. Public so consumers can grep it. */
export const GROUP_ID_PREFIX = "__grp__";

/** Suggested ID of the grand-total footer node. */
export const FOOTER_NODE_ID = "__footer__";

// ─── Row-node discriminated union ──────────────────────────────────

export interface GridLeafRowNode<TRow> {
  readonly kind: "leaf";
  readonly id: RowId;
  readonly row: TRow;
  readonly depth: number;
  readonly parentGroupId: string | null;
}

export interface GridGroupRowNode {
  readonly kind: "group";
  readonly id: string;
  readonly columnId: string;
  readonly key: unknown;
  readonly depth: number;
  /** Leaf row count under this group (recursive, including nested groups). */
  readonly count: number;
  /** Aggregates for the leaves under this group, keyed by column ID. */
  readonly aggregates: Readonly<Record<string, unknown>>;
  readonly parentGroupId: string | null;
  /** `true` when the group is currently expanded and its children render. */
  readonly expanded: boolean;
}

export interface GridFooterRowNode {
  readonly kind: "footer";
  readonly id: typeof FOOTER_NODE_ID;
  readonly aggregates: Readonly<Record<string, unknown>>;
}

export type GridRowNode<TRow> = GridLeafRowNode<TRow> | GridGroupRowNode | GridFooterRowNode;

// ─── Row state ─────────────────────────────────────────────────────

export interface RowState<TRow> {
  readonly nodes: readonly GridRowNode<TRow>[];
  readonly totalLeafCount: number;
  readonly filteredLeafCount: number;
  readonly indexById: ReadonlyMap<string, number>;
}

// ─── Options ───────────────────────────────────────────────────────

export interface BuildRowNodesOptions<TRow> {
  readonly data: readonly TRow[];
  readonly columns: readonly DataGridColumnDef<TRow>[];
  readonly groupBy: readonly string[];
  readonly expanded: ExpansionState;
  readonly getRowId: (row: TRow) => RowId;
  /** When `true`, appends a footer node with the grand-total aggregates. */
  readonly includeFooter?: boolean;
  /**
   * Optional pre-filter leaf count when the caller already ran the filter
   * stage upstream. Falls back to `data.length` so the ungrouped case does
   * not require the caller to specify it.
   */
  readonly totalLeafCount?: number;
}

// ─── Group ID helpers ──────────────────────────────────────────────

/** Convert an arbitrary key to a deterministic, human-readable string. */
export function stableKeyString(key: unknown): string {
  if (key === null) return "null";
  if (key === undefined) return "undefined";
  if (typeof key === "string" || typeof key === "number" || typeof key === "boolean") {
    return String(key);
  }
  if (key instanceof Date) return `d:${String(key.getTime())}`;
  try {
    return JSON.stringify(key);
  } catch {
    return "[unstringifiable]";
  }
}

/**
 * Deterministic group ID for a chain of `(columnId, key)` segments.
 * The result is stable across data mutations for identical group paths.
 */
export function groupNodeId(
  path: readonly { readonly columnId: string; readonly key: unknown }[],
): string {
  const parts = path.map((seg) => `${seg.columnId}=${stableKeyString(seg.key)}`);
  return `${GROUP_ID_PREFIX}${parts.join("/")}`;
}

// ─── Column-def validation ─────────────────────────────────────────

/**
 * Filter a requested `groupBy` list down to the columns that actually
 * support grouping: the column must exist and its def must not carry
 * `groupable: false`. Unknown or forbidden IDs are dropped silently so
 * callers can wire persistence layers without runtime crashes.
 */
export function filterGroupableColumns<TRow>(
  columns: readonly DataGridColumnDef<TRow>[],
  groupBy: readonly string[],
): readonly string[] {
  const byId = new Map<string, DataGridColumnDef<TRow>>();
  for (const column of columns) byId.set(column.id, column);
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const id of groupBy) {
    if (seen.has(id)) continue;
    const column = byId.get(id);
    if (!column) continue;
    if (column.groupable === false) continue;
    seen.add(id);
    kept.push(id);
  }
  return kept;
}

// ─── Group key derivation ──────────────────────────────────────────

function getGroupKey<TRow>(column: DataGridColumnDef<TRow>, row: TRow): unknown {
  if (column.groupFn) return column.groupFn(row);
  return getCellValue(column, row);
}

interface GroupBucket<TRow> {
  readonly key: unknown;
  readonly rows: TRow[];
}

function groupRowsByColumn<TRow>(
  column: DataGridColumnDef<TRow>,
  rows: readonly TRow[],
): readonly GroupBucket<TRow>[] {
  // Preserve first-seen order deterministically, matching the input row order.
  const buckets = new Map<string, GroupBucket<TRow>>();
  for (const row of rows) {
    const key = getGroupKey(column, row);
    const bucketKey = stableKeyString(key);
    const existing = buckets.get(bucketKey);
    if (existing) {
      existing.rows.push(row);
    } else {
      buckets.set(bucketKey, { key, rows: [row] });
    }
  }
  return Array.from(buckets.values());
}

// ─── Row-node builder ──────────────────────────────────────────────

/**
 * Build the flat list of `GridRowNode` entries for a data set. This is
 * the group + aggregate stage of the DataGrid row-model pipeline:
 *
 * 1. Filter the requested `groupBy` down to columns that support grouping.
 * 2. When `groupBy` is empty, emit one leaf per row and return.
 * 3. Recursively partition rows by the group columns, emitting group
 *    header nodes with per-column aggregates. Descend into a group only
 *    when `expanded.expandedIds.has(id)`.
 * 4. When `includeFooter` is `true`, append the grand-total footer node.
 *
 * Never mutates the input rows or column defs.
 */
export function buildRowNodes<TRow>(
  options: BuildRowNodesOptions<TRow>,
): readonly GridRowNode<TRow>[] {
  const { data, columns, groupBy, expanded, getRowId, includeFooter = false } = options;

  const validGroupBy = filterGroupableColumns(columns, groupBy);

  const nodes: GridRowNode<TRow>[] = [];

  if (validGroupBy.length === 0) {
    for (const row of data) {
      nodes.push({
        kind: "leaf",
        id: getRowId(row),
        row,
        depth: 0,
        parentGroupId: null,
      });
    }
  } else {
    buildGroupLevel(nodes, data, columns, validGroupBy, 0, null, [], expanded, getRowId);
  }

  if (includeFooter) {
    nodes.push({
      kind: "footer",
      id: FOOTER_NODE_ID,
      aggregates: computeFooterAggregates(columns, data),
    });
  }

  return nodes;
}

interface PathSegment {
  readonly columnId: string;
  readonly key: unknown;
}

function buildGroupLevel<TRow>(
  out: GridRowNode<TRow>[],
  rows: readonly TRow[],
  columns: readonly DataGridColumnDef<TRow>[],
  groupBy: readonly string[],
  depth: number,
  parentGroupId: string | null,
  parentPath: readonly PathSegment[],
  expanded: ExpansionState,
  getRowId: (row: TRow) => RowId,
): void {
  const columnId = groupBy[depth];
  if (columnId === undefined) return;
  const column = columns.find((c) => c.id === columnId);
  if (!column) return;

  const buckets = groupRowsByColumn(column, rows);

  for (const bucket of buckets) {
    const path = [...parentPath, { columnId, key: bucket.key }];
    const id = groupNodeId(path);
    const isExpanded = expanded.expandedIds.has(id);
    const aggregates = computeAggregates(columns, bucket.rows);

    out.push({
      kind: "group",
      id,
      columnId,
      key: bucket.key,
      depth,
      count: bucket.rows.length,
      aggregates,
      parentGroupId,
      expanded: isExpanded,
    });

    if (!isExpanded) continue;

    if (depth + 1 < groupBy.length) {
      buildGroupLevel(out, bucket.rows, columns, groupBy, depth + 1, id, path, expanded, getRowId);
    } else {
      for (const row of bucket.rows) {
        out.push({
          kind: "leaf",
          id: getRowId(row),
          row,
          depth: depth + 1,
          parentGroupId: id,
        });
      }
    }
  }
}

// ─── Row-state helper ──────────────────────────────────────────────

/**
 * Build the complete `RowState<TRow>` from the flat node list produced by
 * `buildRowNodes`. `filteredLeafCount` is the leaf count actually reached
 * by the current expansion. `totalLeafCount` defaults to `data.length` —
 * consumers running server-side pagination pass a precomputed value.
 */
export function buildRowState<TRow>(options: BuildRowNodesOptions<TRow>): RowState<TRow> {
  const nodes = buildRowNodes(options);
  const indexById = new Map<string, number>();
  let filteredLeafCount = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;
    if (node.kind === "leaf") filteredLeafCount += 1;
    indexById.set(String(node.id), i);
  }
  return {
    nodes,
    totalLeafCount: options.totalLeafCount ?? options.data.length,
    filteredLeafCount,
    indexById,
  };
}
