import { useCallback } from "react";
import { useControllableState } from "@kairoui/hooks";
import type { SortState } from "../data/data-types";
import { getNextSortState } from "./sort-utils";

export interface UseSortStateOptions {
  readonly sort?: SortState;
  readonly defaultSort?: SortState;
  readonly onSortChange?: (sort: SortState | undefined) => void;
}

export interface UseSortStateReturn {
  readonly sort: SortState | undefined;
  readonly onSortChange: (sort: SortState | undefined) => void;
  readonly toggleSort: (columnId: string) => void;
}

export function useSortState(options: UseSortStateOptions = {}): UseSortStateReturn {
  const { sort: controlledSort, defaultSort, onSortChange: onSortChangeProp } = options;

  const [sort, setSort] = useControllableState<SortState | undefined>({
    value: controlledSort,
    defaultValue: defaultSort,
    ...(onSortChangeProp ? { onChange: onSortChangeProp } : undefined),
  });

  const onSortChange = useCallback(
    (next: SortState | undefined) => {
      setSort(next);
    },
    [setSort],
  );

  const toggleSort = useCallback(
    (columnId: string) => {
      setSort((prev: SortState | undefined) => getNextSortState(columnId, prev));
    },
    [setSort],
  );

  return { sort, onSortChange, toggleSort };
}
