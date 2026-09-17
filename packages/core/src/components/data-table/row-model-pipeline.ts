import type { SortState } from "../data/data-types";
import type { DataTableColumnDef } from "./data-table-types";
import type { FilterState } from "./filter-utils";
import { applyFilters, EMPTY_FILTER_STATE } from "./filter-utils";
import { sortRows } from "./sort-utils";

// ─── Pipeline ──────────────────────────────────────────────────────

export interface RunRowModelPipelineOptions<TRow> {
  readonly data: readonly TRow[];
  readonly columns: readonly DataTableColumnDef<TRow>[];
  readonly filterState?: FilterState;
  readonly sort?: SortState;
  readonly comparator?: (a: unknown, b: unknown) => number;
}

/**
 * Runs the DataTable row-model pipeline in the approved order:
 *
 *   1. Filter (`applyFilters` — global + column filters)
 *   2. Sort   (`sortRows`)
 *   3. Paginate (reserved — no built-in pagination in this task)
 *
 * The pipeline is pure — original rows are never mutated. When both stages
 * are no-ops, the input array is returned by reference so downstream
 * `useMemo` caches remain stable.
 */
export function runRowModelPipeline<TRow>(
  options: RunRowModelPipelineOptions<TRow>,
): readonly TRow[] {
  const { data, columns, filterState = EMPTY_FILTER_STATE, sort, comparator } = options;

  const filtered = applyFilters({ data, state: filterState, columns });
  const sortOptions: Parameters<typeof sortRows<TRow>>[0] = {
    data: filtered,
    sort,
    columns,
    ...(comparator ? { comparator } : undefined),
  };
  return sortRows(sortOptions);
}
