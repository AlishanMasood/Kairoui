import { useCallback } from "react";
import { useControllableState } from "@kairoui/hooks";
import type { RowId, SelectionMode } from "../data/data-types";
import { toggleRowSelection, toggleSelectAll } from "./selection-utils";

export interface UseRowSelectionOptions {
  readonly selectionMode?: SelectionMode;
  readonly selectedIds?: ReadonlySet<RowId>;
  readonly defaultSelectedIds?: ReadonlySet<RowId>;
  readonly onSelectionChange?: (ids: ReadonlySet<RowId>) => void;
}

export interface UseRowSelectionReturn {
  readonly selectionMode: SelectionMode;
  readonly selectedIds: ReadonlySet<RowId>;
  readonly onSelectionChange: (ids: ReadonlySet<RowId>) => void;
  readonly toggleRow: (rowId: RowId) => void;
  readonly toggleAll: (visibleRowIds: readonly RowId[]) => void;
  readonly isSelected: (rowId: RowId) => boolean;
}

const EMPTY_SET: ReadonlySet<RowId> = new Set<RowId>();

export function useRowSelection(options: UseRowSelectionOptions = {}): UseRowSelectionReturn {
  const {
    selectionMode = "none",
    selectedIds: controlledIds,
    defaultSelectedIds,
    onSelectionChange: onChangeProp,
  } = options;

  const [selectedIds, setSelectedIds] = useControllableState<ReadonlySet<RowId>>({
    value: controlledIds,
    defaultValue: defaultSelectedIds ?? EMPTY_SET,
    ...(onChangeProp ? { onChange: onChangeProp } : undefined),
  });

  const onSelectionChange = useCallback(
    (ids: ReadonlySet<RowId>) => {
      setSelectedIds(ids);
    },
    [setSelectedIds],
  );

  const toggleRow = useCallback(
    (rowId: RowId) => {
      setSelectedIds((prev: ReadonlySet<RowId>) => toggleRowSelection(prev, rowId, selectionMode));
    },
    [setSelectedIds, selectionMode],
  );

  const toggleAll = useCallback(
    (visibleRowIds: readonly RowId[]) => {
      if (selectionMode !== "multiple") return;
      setSelectedIds((prev: ReadonlySet<RowId>) => toggleSelectAll(prev, visibleRowIds));
    },
    [setSelectedIds, selectionMode],
  );

  const isSelected = useCallback((rowId: RowId) => selectedIds.has(rowId), [selectedIds]);

  return { selectionMode, selectedIds, onSelectionChange, toggleRow, toggleAll, isSelected };
}
