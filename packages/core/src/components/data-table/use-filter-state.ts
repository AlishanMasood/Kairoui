import { useCallback } from "react";
import { useControllableState } from "@kairoui/hooks";
import type { ColumnFilter, FilterState } from "./filter-utils";
import {
  EMPTY_FILTER_STATE,
  clearAllFilters,
  setColumnFilter as setColumnFilterPure,
  setGlobalFilter as setGlobalFilterPure,
} from "./filter-utils";

export interface UseFilterStateOptions {
  readonly filterState?: FilterState;
  readonly defaultFilterState?: FilterState;
  readonly onFilterStateChange?: (state: FilterState) => void;
}

export interface UseFilterStateReturn {
  readonly filterState: FilterState;
  readonly setFilterState: (next: FilterState) => void;
  readonly setGlobalFilter: (input: string) => void;
  readonly setColumnFilter: (columnId: string, filter: ColumnFilter | undefined) => void;
  readonly clearColumnFilter: (columnId: string) => void;
  readonly clearAll: () => void;
}

export function useFilterState(options: UseFilterStateOptions = {}): UseFilterStateReturn {
  const {
    filterState: controlled,
    defaultFilterState,
    onFilterStateChange: onChangeProp,
  } = options;

  const [filterState, setFilterStateRaw] = useControllableState<FilterState>({
    value: controlled,
    defaultValue: defaultFilterState ?? EMPTY_FILTER_STATE,
    ...(onChangeProp ? { onChange: onChangeProp } : undefined),
  });

  const setFilterState = useCallback(
    (next: FilterState) => {
      setFilterStateRaw(next);
    },
    [setFilterStateRaw],
  );

  const setGlobalFilter = useCallback(
    (input: string) => {
      setFilterStateRaw((prev: FilterState) => setGlobalFilterPure(prev, input));
    },
    [setFilterStateRaw],
  );

  const setColumnFilter = useCallback(
    (columnId: string, filter: ColumnFilter | undefined) => {
      setFilterStateRaw((prev: FilterState) => setColumnFilterPure(prev, columnId, filter));
    },
    [setFilterStateRaw],
  );

  const clearColumnFilter = useCallback(
    (columnId: string) => {
      setFilterStateRaw((prev: FilterState) => setColumnFilterPure(prev, columnId, undefined));
    },
    [setFilterStateRaw],
  );

  const clearAll = useCallback(() => {
    setFilterStateRaw((prev: FilterState) => clearAllFilters(prev));
  }, [setFilterStateRaw]);

  return {
    filterState,
    setFilterState,
    setGlobalFilter,
    setColumnFilter,
    clearColumnFilter,
    clearAll,
  };
}
