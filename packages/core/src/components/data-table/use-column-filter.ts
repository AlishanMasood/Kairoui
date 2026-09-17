import { useCallback } from "react";
import type { ColumnFilter, FilterOp, FilterState } from "./filter-utils";

export interface UseColumnFilterOptions {
  readonly columnId: string;
  readonly filterState: FilterState;
  readonly setColumnFilter: (columnId: string, filter: ColumnFilter | undefined) => void;
  readonly defaultOp: FilterOp;
}

export interface UseColumnFilterReturn {
  readonly filter: ColumnFilter | undefined;
  readonly value: unknown;
  readonly op: FilterOp;
  readonly setValue: (value: unknown) => void;
  readonly setOp: (op: FilterOp) => void;
  readonly clear: () => void;
}

/**
 * Ergonomic helper for binding a single column's filter to an input widget.
 * Consumers own the widget markup — this hook only reads/writes the column's
 * filter entry in the shared `FilterState`.
 *
 * The composable pattern: pair with `useFilterState` and any input component.
 * The `defaultOp` is used when the filter is created for the first time or
 * when a raw value is written without an existing filter entry.
 */
export function useColumnFilter(options: UseColumnFilterOptions): UseColumnFilterReturn {
  const { columnId, filterState, setColumnFilter, defaultOp } = options;

  const filter = filterState.columnFilters.find((f) => f.columnId === columnId);
  const value = filter?.value;
  const op = filter?.op ?? defaultOp;

  const setValue = useCallback(
    (next: unknown) => {
      if (isEmptyFilterValue(next)) {
        setColumnFilter(columnId, undefined);
        return;
      }
      setColumnFilter(columnId, { columnId, op, value: next });
    },
    [columnId, op, setColumnFilter],
  );

  const setOp = useCallback(
    (nextOp: FilterOp) => {
      if (value === undefined || isEmptyFilterValue(value)) {
        setColumnFilter(columnId, undefined);
        return;
      }
      setColumnFilter(columnId, { columnId, op: nextOp, value });
    },
    [columnId, value, setColumnFilter],
  );

  const clear = useCallback(() => {
    setColumnFilter(columnId, undefined);
  }, [columnId, setColumnFilter]);

  return { filter, value, op, setValue, setOp, clear };
}

function isEmptyFilterValue(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}
