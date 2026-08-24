import { forwardRef, createElement, useMemo } from "react";
import type { HTMLAttributes } from "react";
import type { DataTableRootProps } from "./data-table-types";
import { getCellContent, getHeaderContent } from "./column-utils";
import { sortRows } from "./sort-utils";
import { useSortState } from "./use-sort-state";
import { useRowSelection } from "./use-row-selection";
import { getSelectAllState } from "./selection-utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../table/table";

// ─── DataTable ──────────────────────────────────────────────────────

export const DataTable = forwardRef<
  HTMLTableElement,
  DataTableRootProps<unknown> & HTMLAttributes<HTMLTableElement>
>(function DataTable(props, ref) {
  const {
    data,
    columns,
    getRowId,
    sort: sortProp,
    defaultSort,
    onSortChange: onSortChangeProp,
    selectionMode = "none",
    selectedIds: selectedIdsProp,
    defaultSelectedIds,
    onSelectionChange: onSelectionChangeProp,
    emptyState,
    loading = false,
    className,
    children,
    ...rest
  } = props;

  const { sort, toggleSort } = useSortState({
    ...(sortProp !== undefined ? { sort: sortProp } : undefined),
    ...(defaultSort !== undefined ? { defaultSort } : undefined),
    ...(onSortChangeProp ? { onSortChange: onSortChangeProp } : undefined),
  });

  const { selectedIds, toggleRow, toggleAll, isSelected } = useRowSelection({
    selectionMode,
    ...(selectedIdsProp !== undefined ? { selectedIds: selectedIdsProp } : undefined),
    ...(defaultSelectedIds !== undefined ? { defaultSelectedIds } : undefined),
    ...(onSelectionChangeProp ? { onSelectionChange: onSelectionChangeProp } : undefined),
  });

  const sortedData = useMemo(
    () => sortRows({ data, sort, columns: columns }),
    [data, sort, columns],
  );

  const visibleRowIds = useMemo(
    () => sortedData.map((row) => getRowId(row)),
    [sortedData, getRowId],
  );

  const selectAllState = useMemo(
    () => (selectionMode === "multiple" ? getSelectAllState(selectedIds, visibleRowIds) : "none"),
    [selectionMode, selectedIds, visibleRowIds],
  );

  const hasSelection = selectionMode !== "none";
  const typedColumns = columns;

  // Empty state
  if (!loading && data.length === 0 && emptyState) {
    return createElement(
      "div",
      {
        ...rest,
        ref: ref as React.Ref<HTMLDivElement>,
        "data-kui-component": "DataTable",
        "data-empty": "true",
        className,
      },
      emptyState,
    );
  }

  return createElement(
    Table,
    {
      ...(rest as HTMLAttributes<HTMLTableElement>),
      ref,
      "aria-busy": loading || undefined,
      "data-kui-component": "DataTable" as never,
      className,
    } as never,
    // Header
    createElement(
      TableHeader,
      null,
      createElement(
        TableRow,
        null,
        hasSelection
          ? createElement(TableHead, {
              "data-datatable-role": "select-all",
              ...(selectionMode === "multiple"
                ? {
                    onClick: () => {
                      toggleAll(visibleRowIds);
                    },
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleAll(visibleRowIds);
                      }
                    },
                    tabIndex: 0,
                    role: "columnheader",
                    "aria-label": "Select all rows",
                    "data-select-all": selectAllState,
                  }
                : { "aria-label": "Selection" }),
            } as never)
          : null,
        ...typedColumns.map((col) =>
          createElement(
            TableHead,
            {
              key: col.id,
              align: col.align,
              sortDirection: sort?.columnId === col.id ? sort.direction : undefined,
              ...(col.sortable !== false && col.sortable !== undefined
                ? {
                    onSort: () => {
                      toggleSort(col.id);
                    },
                  }
                : undefined),
            } as never,
            getHeaderContent(col),
          ),
        ),
      ),
    ),
    // Body
    createElement(
      TableBody,
      null,
      loading
        ? createElement(
            TableRow,
            null,
            createElement(
              TableCell,
              { colSpan: typedColumns.length + (hasSelection ? 1 : 0) } as never,
              children ?? "Loading…",
            ),
          )
        : sortedData.map((row) => {
            const rowId = getRowId(row);
            const selected = isSelected(rowId);
            return createElement(
              TableRow,
              { key: String(rowId), selected } as never,
              hasSelection
                ? createElement(TableCell, {
                    "data-datatable-role": "select-cell",
                    onClick: () => {
                      toggleRow(rowId);
                    },
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleRow(rowId);
                      }
                    },
                    tabIndex: 0,
                    "aria-label": selected ? "Deselect row" : "Select row",
                  } as never)
                : null,
              ...typedColumns.map((col) =>
                createElement(
                  TableCell,
                  { key: col.id, align: col.align } as never,
                  getCellContent(col, row),
                ),
              ),
            );
          }),
    ),
  );
}) as <TRow>(
  props: DataTableRootProps<TRow> &
    HTMLAttributes<HTMLTableElement> & { ref?: React.Ref<HTMLTableElement> },
) => React.ReactElement | null;
