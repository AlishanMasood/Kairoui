import type { SortState, SortDirection } from "../data/data-types";
import type { DataTableColumnDef } from "./data-table-types";
import { getCellValue } from "./column-utils";

// ─── Sort cycle ─────────────────────────────────────────────────────

/** Cycle through sort states: unsorted → ascending → descending → unsorted */
export function getNextSortState(
  columnId: string,
  current: SortState | undefined,
): SortState | undefined {
  if (!current || current.columnId !== columnId) {
    return { columnId, direction: "ascending" };
  }
  if (current.direction === "ascending") {
    return { columnId, direction: "descending" };
  }
  return undefined;
}

// ─── Comparator ─────────────────────────────────────────────────────

/** Default comparator for primitive values. */
export function defaultComparator(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b ? 0 : a ? -1 : 1;
  }

  // Fall back to JSON for objects, string coercion for primitives
  /* eslint-disable @typescript-eslint/no-base-to-string -- fallback for unhandled types */
  const sa = typeof a === "object" ? JSON.stringify(a) : String(a);
  const sb = typeof b === "object" ? JSON.stringify(b) : String(b);
  /* eslint-enable @typescript-eslint/no-base-to-string */
  return sa.localeCompare(sb);
}

// ─── Sort rows ──────────────────────────────────────────────────────

export interface SortRowsOptions<TRow> {
  readonly data: readonly TRow[];
  readonly sort: SortState | undefined;
  readonly columns: readonly DataTableColumnDef<TRow>[];
  readonly comparator?: (a: unknown, b: unknown) => number;
}

/** Sorts rows by the active sort column. Returns a new array (never mutates). */
export function sortRows<TRow>(options: SortRowsOptions<TRow>): readonly TRow[] {
  const { data, sort, columns, comparator = defaultComparator } = options;

  if (!sort) return data;

  const col = columns.find((c) => c.id === sort.columnId);
  if (!col) return data;
  if (col.sortable === false) return data;

  const direction: SortDirection = sort.direction;
  const multiplier = direction === "descending" ? -1 : 1;

  // Stable sort: preserve original order for equal elements
  const indexed = data.map((row, i) => ({ row, i }));
  indexed.sort((a, b) => {
    const va = getCellValue(col, a.row);
    const vb = getCellValue(col, b.row);
    const result = comparator(va, vb) * multiplier;
    return result !== 0 ? result : a.i - b.i;
  });

  return indexed.map((entry) => entry.row);
}
