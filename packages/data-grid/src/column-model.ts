import type { ColumnFilter, FilterState, SortDirection, SortState } from "@kairoui/core/components";
import type {
  ColumnOrder,
  ColumnPinning,
  ColumnPinSide,
  ColumnRuntime,
  ColumnRuntimeContext,
  ColumnSizing,
  ColumnState,
  ColumnStateInitOptions,
  ColumnVisibility,
  DataGridColumnDef,
  PinnedColumnGroups,
} from "./column-types";

// ─── Defaults ──────────────────────────────────────────────────────

export const DEFAULT_COLUMN_WIDTH = 150;
export const DEFAULT_MIN_COLUMN_WIDTH = 40;
export const DEFAULT_MAX_COLUMN_WIDTH = 4096;

const EMPTY_PINNING: ColumnPinning = { left: [], right: [] };

// ─── Column-def helpers ────────────────────────────────────────────

export function getColumnDefaultWidth<TRow>(
  column: DataGridColumnDef<TRow>,
  fallback: number = DEFAULT_COLUMN_WIDTH,
): number {
  if (typeof column.width === "number" && Number.isFinite(column.width)) return column.width;
  if (typeof column.defaultWidth === "number" && Number.isFinite(column.defaultWidth)) {
    return column.defaultWidth;
  }
  return fallback;
}

/** Clamp a requested width to the column's `minWidth` / `maxWidth` envelope. */
export function clampColumnWidth<TRow>(column: DataGridColumnDef<TRow>, width: number): number {
  if (!Number.isFinite(width)) return getColumnDefaultWidth(column);
  const min = typeof column.minWidth === "number" ? column.minWidth : DEFAULT_MIN_COLUMN_WIDTH;
  const max = typeof column.maxWidth === "number" ? column.maxWidth : DEFAULT_MAX_COLUMN_WIDTH;
  if (min > max) return Math.max(min, DEFAULT_MIN_COLUMN_WIDTH);
  return Math.min(Math.max(width, min), max);
}

// ─── Initialization ────────────────────────────────────────────────

/**
 * Build the initial `ColumnState` from the column defs. Options override
 * the defaults derived from the column defs; unknown IDs in any option
 * override are dropped silently (they will never surface in the visible
 * order anyway).
 */
export function initialColumnState<TRow>(
  columns: readonly DataGridColumnDef<TRow>[],
  options: ColumnStateInitOptions = {},
): ColumnState {
  const validIds = new Set(columns.map((c) => c.id));
  const canonicalOrder = columns.map((c) => c.id);

  const order = options.order
    ? normalizeOrder(options.order, canonicalOrder, validIds)
    : canonicalOrder;

  const pinning = options.pinning ? normalizePinning(options.pinning, validIds) : EMPTY_PINNING;

  const fallbackWidth = options.defaultColumnWidth ?? DEFAULT_COLUMN_WIDTH;
  const sizing: Record<string, number> = {};
  for (const column of columns) {
    const override = options.sizing?.[column.id];
    const requested =
      typeof override === "number" ? override : getColumnDefaultWidth(column, fallbackWidth);
    sizing[column.id] = clampColumnWidth(column, requested);
  }

  const visibility: Record<string, boolean> = {};
  for (const column of columns) {
    const override = options.visibility?.[column.id];
    if (typeof override === "boolean") {
      visibility[column.id] = override;
    } else if (column.hideable === false) {
      visibility[column.id] = true;
    } else {
      visibility[column.id] = true;
    }
  }

  return {
    order,
    pinned: pinning,
    sizing,
    visibility,
  };
}

/** Reset state as if the grid was just initialized. */
export function resetColumnState<TRow>(
  columns: readonly DataGridColumnDef<TRow>[],
  options: ColumnStateInitOptions = {},
): ColumnState {
  return initialColumnState(columns, options);
}

// ─── Normalization ─────────────────────────────────────────────────

function normalizeOrder(
  requested: ColumnOrder,
  canonical: readonly string[],
  validIds: ReadonlySet<string>,
): ColumnOrder {
  const seen = new Set<string>();
  const filtered: string[] = [];
  for (const id of requested) {
    if (!validIds.has(id) || seen.has(id)) continue;
    filtered.push(id);
    seen.add(id);
  }
  for (const id of canonical) {
    if (seen.has(id)) continue;
    filtered.push(id);
    seen.add(id);
  }
  return filtered;
}

function normalizePinning(pinning: ColumnPinning, validIds: ReadonlySet<string>): ColumnPinning {
  const left: string[] = [];
  const right: string[] = [];
  const seen = new Set<string>();
  for (const id of pinning.left) {
    if (!validIds.has(id) || seen.has(id)) continue;
    left.push(id);
    seen.add(id);
  }
  for (const id of pinning.right) {
    if (!validIds.has(id) || seen.has(id)) continue;
    right.push(id);
    seen.add(id);
  }
  if (left.length === 0 && right.length === 0) return EMPTY_PINNING;
  return { left, right };
}

// ─── Selectors ─────────────────────────────────────────────────────

/**
 * Visible column IDs in left-to-right render order: pinned-left → center → pinned-right.
 * Hidden columns are omitted. Pin lists override the canonical order within their group.
 */
export function getVisibleColumnIds(state: ColumnState): readonly string[] {
  const { left, center, right } = getPinnedColumnIds(state);
  return [...left, ...center, ...right];
}

/** Partition visible column IDs into pinned-left, center, and pinned-right groups. */
export function getPinnedColumnIds(state: ColumnState): PinnedColumnGroups {
  const leftSet = new Set(state.pinned.left);
  const rightSet = new Set(state.pinned.right);
  const isVisible = (id: string): boolean => state.visibility[id] !== false;

  const left = state.pinned.left.filter(isVisible);
  const right = state.pinned.right.filter(isVisible);
  const center = state.order.filter((id) => !leftSet.has(id) && !rightSet.has(id) && isVisible(id));
  return { left, center, right };
}

export function isColumnHidden(state: ColumnState, columnId: string): boolean {
  return state.visibility[columnId] === false;
}

export function isColumnPinned(state: ColumnState, columnId: string): ColumnPinSide | null {
  if (state.pinned.left.includes(columnId)) return "left";
  if (state.pinned.right.includes(columnId)) return "right";
  return null;
}

export function getColumnWidth(state: ColumnState, columnId: string): number {
  const value = state.sizing[columnId];
  return typeof value === "number" ? value : DEFAULT_COLUMN_WIDTH;
}

/** Sum widths for the given IDs. When `columnIds` is omitted, sums all visible columns. */
export function getTotalWidth(state: ColumnState, columnIds?: readonly string[]): number {
  const ids = columnIds ?? getVisibleColumnIds(state);
  let total = 0;
  for (const id of ids) total += getColumnWidth(state, id);
  return total;
}

/** Locate an entry in a multi-sort array by column ID. */
export function findSortEntry(
  sort: readonly SortState[],
  columnId: string,
): { readonly index: number; readonly entry: SortState } | undefined {
  for (let i = 0; i < sort.length; i++) {
    const entry = sort[i];
    if (entry !== undefined && entry.columnId === columnId) return { index: i, entry };
  }
  return undefined;
}

/** Locate the active column filter for a given column, if any. */
export function findColumnFilter(filterState: FilterState, columnId: string): ColumnFilter | null {
  for (const f of filterState.columnFilters) {
    if (f.columnId === columnId) return f;
  }
  return null;
}

/**
 * Materialize a `ColumnRuntime` for a column ID. Returns `undefined` when
 * the ID is not part of the current `state.order`. Sort/filter projections
 * are computed from the optional `context` — DataGrid callers pass the
 * external multi-sort array and filter state; consumers reading state
 * without those overlays get `sortIndex: null`, `sortDirection: null`,
 * `filter: null` deterministically.
 */
export function getColumnRuntime(
  state: ColumnState,
  columnId: string,
  context: ColumnRuntimeContext = {},
): ColumnRuntime | undefined {
  const orderIndex = state.order.indexOf(columnId);
  if (orderIndex === -1) return undefined;

  const pinned = isColumnPinned(state, columnId);
  const hidden = isColumnHidden(state, columnId);
  const width = getColumnWidth(state, columnId);

  let sortIndex: number | null = null;
  let sortDirection: SortDirection | null = null;
  if (context.sort) {
    const found = findSortEntry(context.sort, columnId);
    if (found) {
      sortIndex = found.index;
      sortDirection = found.entry.direction;
    }
  }

  const filter: ColumnFilter | null = context.filterState
    ? findColumnFilter(context.filterState, columnId)
    : null;

  return {
    id: columnId,
    width,
    hidden,
    pinned,
    orderIndex,
    sortIndex,
    sortDirection,
    filter,
  };
}

// ─── Transitions ───────────────────────────────────────────────────

/**
 * Set the width of one column. The new width is clamped against the
 * column def's `minWidth` / `maxWidth`. Unknown IDs are ignored.
 */
export function setColumnWidth<TRow>(
  columns: readonly DataGridColumnDef<TRow>[],
  state: ColumnState,
  columnId: string,
  width: number,
): ColumnState {
  const column = columns.find((c) => c.id === columnId);
  if (!column) return state;
  const clamped = clampColumnWidth(column, width);
  if (state.sizing[columnId] === clamped) return state;
  return { ...state, sizing: { ...state.sizing, [columnId]: clamped } };
}

/** Replace the sizing map wholesale (typically driven by controlled prop). */
export function setColumnSizing(state: ColumnState, sizing: ColumnSizing): ColumnState {
  return { ...state, sizing };
}

/** Replace the order (typically driven by controlled prop). Unknown IDs are dropped. */
export function setColumnOrder(state: ColumnState, order: ColumnOrder): ColumnState {
  const validIds = new Set(state.order);
  const seen = new Set<string>();
  const next: string[] = [];
  for (const id of order) {
    if (!validIds.has(id) || seen.has(id)) continue;
    next.push(id);
    seen.add(id);
  }
  for (const id of state.order) {
    if (seen.has(id)) continue;
    next.push(id);
    seen.add(id);
  }
  return { ...state, order: next };
}

/** Move a column to a target index in the canonical order. */
export function moveColumn(state: ColumnState, columnId: string, targetIndex: number): ColumnState {
  const current = state.order.indexOf(columnId);
  if (current === -1) return state;
  const clamped = Math.max(0, Math.min(targetIndex, state.order.length - 1));
  if (clamped === current) return state;
  const next = state.order.slice();
  next.splice(current, 1);
  next.splice(clamped, 0, columnId);
  return { ...state, order: next };
}

/** Replace the pinning slice (typically driven by controlled prop). */
export function setColumnPinning(state: ColumnState, pinning: ColumnPinning): ColumnState {
  const validIds = new Set(state.order);
  return { ...state, pinned: normalizePinning(pinning, validIds) };
}

/**
 * Pin a column to a side, or unpin it. Idempotent — repeated calls with the
 * same side are no-ops. Moving between sides removes the column from its
 * previous pin group before adding it to the new one.
 */
export function pinColumn(
  state: ColumnState,
  columnId: string,
  side: ColumnPinSide | null,
): ColumnState {
  if (!state.order.includes(columnId)) return state;

  const leftHas = state.pinned.left.includes(columnId);
  const rightHas = state.pinned.right.includes(columnId);
  if (side === "left" && leftHas) return state;
  if (side === "right" && rightHas) return state;
  if (side === null && !leftHas && !rightHas) return state;

  const left = state.pinned.left.filter((id) => id !== columnId);
  const right = state.pinned.right.filter((id) => id !== columnId);
  if (side === "left") left.push(columnId);
  else if (side === "right") right.push(columnId);

  return { ...state, pinned: { left, right } };
}

/** Replace the visibility map wholesale (typically driven by controlled prop). */
export function setColumnVisibility(state: ColumnState, visibility: ColumnVisibility): ColumnState {
  return { ...state, visibility };
}

/** Show or hide a single column. Idempotent. */
export function hideColumn(state: ColumnState, columnId: string, hidden: boolean): ColumnState {
  if (!state.order.includes(columnId)) return state;
  const nextValue = !hidden;
  if (state.visibility[columnId] === nextValue) return state;
  return {
    ...state,
    visibility: { ...state.visibility, [columnId]: nextValue },
  };
}

// ─── Multi-sort transitions ────────────────────────────────────────

/**
 * Toggle a column in a multi-sort array. Cycles unsorted → ascending →
 * descending → removed. When `additive` is `false` (default), other
 * entries are dropped so this behaves like single-column sort.
 */
export function toggleColumnSort(
  sort: readonly SortState[],
  columnId: string,
  additive: boolean = false,
): readonly SortState[] {
  const existing = findSortEntry(sort, columnId);
  if (!additive) {
    if (!existing) return [{ columnId, direction: "ascending" }];
    if (existing.entry.direction === "ascending") return [{ columnId, direction: "descending" }];
    return [];
  }
  if (!existing) return [...sort, { columnId, direction: "ascending" }];
  if (existing.entry.direction === "ascending") {
    const next = sort.slice();
    next[existing.index] = { columnId, direction: "descending" };
    return next;
  }
  const next = sort.slice();
  next.splice(existing.index, 1);
  return next;
}

/** Clear all sort entries. */
export function clearSort(): readonly SortState[] {
  return [];
}
