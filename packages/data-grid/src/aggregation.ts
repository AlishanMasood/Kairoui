// eslint-disable-next-line import-x/no-internal-modules
import { getCellValue } from "@kairoui/core/components/data-grid";
import type { AggregationBuiltin, AggregationReducer, DataGridColumnDef } from "./column-types";

// ─── Built-in reducers ─────────────────────────────────────────────

/**
 * Number of rows in the aggregated set. Ignores cell values so it is a
 * true row count, not a "non-null values" count.
 */
export function reduceCount(_values: readonly unknown[], rows: readonly unknown[]): number {
  return rows.length;
}

/** Number of distinct cell values. `null` and `undefined` collapse to one bucket each. */
export function reduceCountUnique(values: readonly unknown[]): number {
  const set = new Set<unknown>();
  for (const value of values) set.add(value);
  return set.size;
}

/**
 * Sum of numeric cell values. Non-numeric values are ignored. Returns
 * `null` when the group contains no numeric values so consumers can
 * distinguish "no data" from a genuine `0` sum.
 */
export function reduceSum(values: readonly unknown[]): number | null {
  let total = 0;
  let saw = false;
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      total += value;
      saw = true;
    }
  }
  return saw ? total : null;
}

/** Arithmetic mean of numeric cell values. `null` when no numeric values. */
export function reduceAverage(values: readonly unknown[]): number | null {
  let total = 0;
  let n = 0;
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      total += value;
      n += 1;
    }
  }
  return n === 0 ? null : total / n;
}

/**
 * Minimum comparable cell value. Numbers, strings, and `Date` instances
 * are supported and never mixed within a comparison. Other types are
 * ignored. Returns `null` when no comparable values are present.
 */
export function reduceMin(values: readonly unknown[]): unknown {
  return reduceExtreme(values, "min");
}

/** Maximum comparable cell value. See {@link reduceMin} for the type policy. */
export function reduceMax(values: readonly unknown[]): unknown {
  return reduceExtreme(values, "max");
}

// ─── Extreme helper ────────────────────────────────────────────────

type ExtremeKind = "min" | "max";

function reduceExtreme(values: readonly unknown[], kind: ExtremeKind): unknown {
  let current: unknown = null;
  let hasCurrent = false;
  for (const value of values) {
    if (!isComparable(value)) continue;
    if (!hasCurrent) {
      current = value;
      hasCurrent = true;
      continue;
    }
    const cmp = compareValues(value, current);
    if (kind === "min" ? cmp < 0 : cmp > 0) {
      current = value;
    }
  }
  return hasCurrent ? current : null;
}

function isComparable(value: unknown): value is number | string | Date {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return true;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return false;
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  // Cross-type comparisons return 0 so mixed data leaves the current extreme unchanged.
  return 0;
}

// ─── Dispatch ──────────────────────────────────────────────────────

/**
 * Dispatch a `AggregationReducer<TRow>` for the given cell values and
 * source rows. Built-in string reducers map to the exported functions;
 * function reducers are called with `(values, rows)`.
 */
export function applyReducer<TRow>(
  reducer: AggregationReducer<TRow>,
  values: readonly unknown[],
  rows: readonly TRow[],
): unknown {
  if (typeof reducer === "function") {
    return reducer(values, rows);
  }
  return dispatchBuiltin(reducer, values, rows);
}

function dispatchBuiltin(
  reducer: AggregationBuiltin,
  values: readonly unknown[],
  rows: readonly unknown[],
): unknown {
  switch (reducer) {
    case "count":
      return reduceCount(values, rows);
    case "countUnique":
      return reduceCountUnique(values);
    case "sum":
      return reduceSum(values);
    case "avg":
      return reduceAverage(values);
    case "min":
      return reduceMin(values);
    case "max":
      return reduceMax(values);
  }
}

// ─── Column-scoped aggregation ─────────────────────────────────────

/**
 * Compute per-column aggregates for a set of rows. Only columns whose
 * def carries an `aggregate` spec produce an entry — the returned object
 * has one key per column with a spec, mapping column ID to reducer
 * output. Column keys without a spec are omitted, not set to `null`.
 */
export function computeAggregates<TRow>(
  columns: readonly DataGridColumnDef<TRow>[],
  rows: readonly TRow[],
): Readonly<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const column of columns) {
    const spec = column.aggregate;
    if (!spec) continue;
    const values = rows.map((row) => getCellValue(column, row));
    out[column.id] = applyReducer(spec.reducer, values, rows);
  }
  return out;
}

/** Select the subset of columns whose def carries a footer aggregate spec. */
export function hasFooterAggregate<TRow>(column: DataGridColumnDef<TRow>): boolean {
  return column.aggregate?.footer === true;
}

/**
 * Compute the grand-total aggregate row shape. Only columns with
 * `aggregate.footer === true` contribute. Returns an empty object when
 * no column opts in.
 */
export function computeFooterAggregates<TRow>(
  columns: readonly DataGridColumnDef<TRow>[],
  rows: readonly TRow[],
): Readonly<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const column of columns) {
    if (!hasFooterAggregate(column)) continue;
    const spec = column.aggregate;
    if (!spec) continue;
    const values = rows.map((row) => getCellValue(column, row));
    out[column.id] = applyReducer(spec.reducer, values, rows);
  }
  return out;
}
