import type { DataTableColumnDef } from "./data-table-types";

// ─── Operators ─────────────────────────────────────────────────────

/** Closed set of filter operators. Extend behavior via `filterFn`, not this union. */
export type FilterOp =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "between"
  | "in"
  | "notIn"
  | "isEmpty"
  | "isNotEmpty";

/** UI hint for the intended data type. Does not change evaluator semantics. */
export type FilterKind = "text" | "number" | "date" | "boolean" | "select";

/** How multiple column filters combine. Global search is always AND'd on top. */
export type FilterCombinator = "and" | "or";

// ─── Filter shape ──────────────────────────────────────────────────

export interface ColumnFilter {
  readonly columnId: string;
  readonly op: FilterOp;
  /** Operator-dependent shape: scalar, `[min, max]` tuple, or array. */
  readonly value: unknown;
}

export interface FilterState {
  readonly globalFilter: string;
  readonly columnFilters: readonly ColumnFilter[];
  readonly combinator: FilterCombinator;
}

/** Enumerable choice for `filterKind: "select"` columns. */
export interface FilterOption {
  readonly label: string;
  readonly value: unknown;
}

/** Consumer-supplied custom filter — overrides operator dispatch entirely. */
export type FilterFn<TRow> = (row: TRow, filter: ColumnFilter) => boolean;

// ─── Column metadata additions ─────────────────────────────────────

/**
 * Filter-related metadata attached to a `DataTableColumnDef<TRow>`. Merged
 * into the column def in `data-table-types.ts`.
 */
export interface DataTableColumnFilterMeta<TRow> {
  readonly filterable?: boolean;
  readonly filterKind?: FilterKind;
  readonly filterFn?: FilterFn<TRow>;
  readonly filterOptions?: readonly FilterOption[];
}

// ─── Defaults ──────────────────────────────────────────────────────

export const EMPTY_FILTER_STATE: FilterState = {
  globalFilter: "",
  columnFilters: [],
  combinator: "and",
};

/** Suggested default operator per `filterKind`. Purely advisory. */
export const DEFAULT_OP_FOR_KIND: Readonly<Record<FilterKind, FilterOp>> = {
  text: "contains",
  number: "equals",
  date: "equals",
  boolean: "equals",
  select: "in",
};

// ─── Predicates ────────────────────────────────────────────────────

/**
 * Per-operator predicates. Each takes `(cellValue, filterValue)` and returns
 * `true` when the row should be kept. Null / undefined handling is explicit
 * per operator so consumers can reason about outcomes without surprises.
 */
export const filterPredicates: Readonly<
  Record<FilterOp, (cellValue: unknown, filterValue: unknown) => boolean>
> = {
  equals(cell, filterValue) {
    if (cell instanceof Date && filterValue instanceof Date) {
      return cell.getTime() === filterValue.getTime();
    }
    return Object.is(cell, filterValue);
  },
  notEquals(cell, filterValue) {
    return !filterPredicates.equals(cell, filterValue);
  },
  contains(cell, filterValue) {
    if (cell === null || cell === undefined) return false;
    return safeToString(cell).toLowerCase().includes(safeToString(filterValue).toLowerCase());
  },
  notContains(cell, filterValue) {
    if (cell === null || cell === undefined) return true;
    return !safeToString(cell).toLowerCase().includes(safeToString(filterValue).toLowerCase());
  },
  startsWith(cell, filterValue) {
    if (cell === null || cell === undefined) return false;
    return safeToString(cell).toLowerCase().startsWith(safeToString(filterValue).toLowerCase());
  },
  endsWith(cell, filterValue) {
    if (cell === null || cell === undefined) return false;
    return safeToString(cell).toLowerCase().endsWith(safeToString(filterValue).toLowerCase());
  },
  greaterThan(cell, filterValue) {
    const [a, b] = toComparable(cell, filterValue);
    if (a === null || b === null) return false;
    return a > b;
  },
  greaterThanOrEqual(cell, filterValue) {
    const [a, b] = toComparable(cell, filterValue);
    if (a === null || b === null) return false;
    return a >= b;
  },
  lessThan(cell, filterValue) {
    const [a, b] = toComparable(cell, filterValue);
    if (a === null || b === null) return false;
    return a < b;
  },
  lessThanOrEqual(cell, filterValue) {
    const [a, b] = toComparable(cell, filterValue);
    if (a === null || b === null) return false;
    return a <= b;
  },
  between(cell, filterValue) {
    if (!Array.isArray(filterValue) || filterValue.length !== 2) return false;
    const [rawMin, rawMax] = filterValue as [unknown, unknown];
    const [cellCmp, minCmp] = toComparable(cell, rawMin);
    const [, maxCmp] = toComparable(cell, rawMax);
    if (cellCmp === null || minCmp === null || maxCmp === null) return false;
    const [lo, hi] = minCmp <= maxCmp ? [minCmp, maxCmp] : [maxCmp, minCmp];
    return cellCmp >= lo && cellCmp <= hi;
  },
  in(cell, filterValue) {
    if (!Array.isArray(filterValue)) return false;
    return filterValue.some((v) => filterPredicates.equals(cell, v));
  },
  notIn(cell, filterValue) {
    if (!Array.isArray(filterValue)) return true;
    return !filterValue.some((v) => filterPredicates.equals(cell, v));
  },
  isEmpty(cell) {
    return isEmptyValue(cell);
  },
  isNotEmpty(cell) {
    return !isEmptyValue(cell);
  },
};

function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v === "") return true;
  if (typeof v === "number" && Number.isNaN(v)) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

/**
 * Coerce an unknown value to a comparison-safe string. Objects are JSON-encoded
 * so string operators never produce "[object Object]".
 */
function safeToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") {
    return String(v);
  }
  if (v instanceof Date) return v.toISOString();
  try {
    const encoded = JSON.stringify(v);
    return typeof encoded === "string" ? encoded : "";
  } catch {
    return "";
  }
}

/**
 * Reduce two values to a comparable pair (number, number). Returns
 * `[null, null]` when either side cannot be compared numerically. Dates are
 * coerced to `getTime()`; strings that parse as finite numbers are coerced;
 * otherwise `null` means "not comparable".
 */
function toComparable(a: unknown, b: unknown): [number | null, number | null] {
  return [toNumberOrNull(a), toNumberOrNull(b)];
}

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    const t = v.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof v === "number") return Number.isNaN(v) ? null : v;
  if (typeof v === "string") {
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// ─── Column filter capability ──────────────────────────────────────

/**
 * A column is filterable when either explicitly enabled or, by default, when
 * it exposes an accessor. Presentation-only columns (e.g. action buttons)
 * are excluded.
 */
export function isColumnFilterable<TRow>(col: DataTableColumnDef<TRow>): boolean {
  if (col.filterable !== undefined) return col.filterable;
  return Boolean(col.accessorKey ?? col.accessorFn);
}

// Local re-declaration to avoid an import cycle for `getCellValue`.
function getCellValue<TRow>(col: DataTableColumnDef<TRow>, row: TRow): unknown {
  if (col.accessorFn) return col.accessorFn(row);
  if (col.accessorKey) return row[col.accessorKey];
  return undefined;
}

// ─── Global filter ─────────────────────────────────────────────────

/**
 * True when any filterable column's cell value contains `input` as a
 * case-insensitive substring. An empty `input` matches everything.
 */
export function matchesGlobalFilter<TRow>(
  row: TRow,
  input: string,
  columns: readonly DataTableColumnDef<TRow>[],
): boolean {
  if (input === "") return true;
  const needle = input.toLowerCase();
  for (const col of columns) {
    if (!isColumnFilterable(col)) continue;
    const value = getCellValue(col, row);
    if (value === null || value === undefined) continue;
    if (safeToString(value).toLowerCase().includes(needle)) return true;
  }
  return false;
}

// ─── Column filter evaluation ──────────────────────────────────────

export interface EvaluateColumnFilterOptions<TRow> {
  readonly row: TRow;
  readonly filter: ColumnFilter;
  readonly columns: readonly DataTableColumnDef<TRow>[];
}

/**
 * Evaluates one `ColumnFilter` against one row. Returns `true` when the row
 * should be kept. Unknown / non-filterable columns are silently kept — the
 * state is authoritative and evaluators must never throw for stale IDs.
 */
export function evaluateColumnFilter<TRow>(options: EvaluateColumnFilterOptions<TRow>): boolean {
  const { row, filter, columns } = options;
  const col = columns.find((c) => c.id === filter.columnId);
  if (!col) return true;
  if (!isColumnFilterable(col)) return true;
  if (col.filterFn) return col.filterFn(row, filter);
  const cell = getCellValue(col, row);
  const predicate = filterPredicates[filter.op];
  return predicate(cell, filter.value);
}

// ─── Apply filters ─────────────────────────────────────────────────

export interface ApplyFiltersOptions<TRow> {
  readonly data: readonly TRow[];
  readonly state: FilterState;
  readonly columns: readonly DataTableColumnDef<TRow>[];
}

/**
 * Client-side filter evaluator. Returns a new array — original row references
 * are preserved but the array is never mutated. Passing an empty
 * `FilterState` is a no-op that returns the input array by reference.
 */
export function applyFilters<TRow>(options: ApplyFiltersOptions<TRow>): readonly TRow[] {
  const { data, state, columns } = options;
  const hasGlobal = state.globalFilter !== "";
  const hasColumnFilters = state.columnFilters.length > 0;
  if (!hasGlobal && !hasColumnFilters) return data;

  const combinator = state.combinator;
  return data.filter((row) => {
    if (hasGlobal && !matchesGlobalFilter(row, state.globalFilter, columns)) {
      return false;
    }
    if (!hasColumnFilters) return true;
    if (combinator === "and") {
      return state.columnFilters.every((filter) => evaluateColumnFilter({ row, filter, columns }));
    }
    return state.columnFilters.some((filter) => evaluateColumnFilter({ row, filter, columns }));
  });
}

// ─── State transitions ─────────────────────────────────────────────

/** Returns a new state with `globalFilter` replaced. */
export function setGlobalFilter(state: FilterState, input: string): FilterState {
  if (state.globalFilter === input) return state;
  return { ...state, globalFilter: input };
}

/**
 * Returns a new state with the given column's filter replaced. Passing
 * `undefined` removes the column's filter entirely.
 */
export function setColumnFilter(
  state: FilterState,
  columnId: string,
  filter: ColumnFilter | undefined,
): FilterState {
  const without = state.columnFilters.filter((f) => f.columnId !== columnId);
  if (filter === undefined) {
    if (without.length === state.columnFilters.length) return state;
    return { ...state, columnFilters: without };
  }
  const next: ColumnFilter = { ...filter, columnId };
  return { ...state, columnFilters: [...without, next] };
}

/** Returns a new state with the given column's filter removed. */
export function clearColumnFilter(state: FilterState, columnId: string): FilterState {
  return setColumnFilter(state, columnId, undefined);
}

/** Returns an empty filter state, preserving the current combinator. */
export function clearAllFilters(state: FilterState): FilterState {
  if (state.globalFilter === "" && state.columnFilters.length === 0) return state;
  return { ...EMPTY_FILTER_STATE, combinator: state.combinator };
}
