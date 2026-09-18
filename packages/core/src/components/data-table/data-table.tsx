import { forwardRef, createElement, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { computeVirtualizedRange } from "@kairoui/utils";
import type { DataTableRootProps } from "./data-table-types";
import { getCellContent, getHeaderContent } from "./column-utils";
import { useSortState } from "./use-sort-state";
import { useRowSelection } from "./use-row-selection";
import { getSelectAllState } from "./selection-utils";
import { useFilterState } from "./use-filter-state";
import { runRowModelPipeline } from "./row-model-pipeline";
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
    filterState: filterStateProp,
    defaultFilterState,
    onFilterStateChange,
    emptyState,
    filteredEmptyState,
    loading = false,
    virtualized = false,
    rowHeight,
    overscan,
    virtualScrollHeight,
    id,
    className,
    children,
    ...rest
  } = props;

  const { sort, toggleSort } = useSortState({
    ...(sortProp !== undefined ? { sort: sortProp } : undefined),
    ...(defaultSort !== undefined ? { defaultSort } : undefined),
    ...(onSortChangeProp ? { onSortChange: onSortChangeProp } : undefined),
  });

  const { filterState } = useFilterState({
    ...(filterStateProp !== undefined ? { filterState: filterStateProp } : undefined),
    ...(defaultFilterState !== undefined ? { defaultFilterState } : undefined),
    ...(onFilterStateChange ? { onFilterStateChange } : undefined),
  });

  const { selectedIds, toggleRow, toggleAll, isSelected } = useRowSelection({
    selectionMode,
    ...(selectedIdsProp !== undefined ? { selectedIds: selectedIdsProp } : undefined),
    ...(defaultSelectedIds !== undefined ? { defaultSelectedIds } : undefined),
    ...(onSelectionChangeProp ? { onSelectionChange: onSelectionChangeProp } : undefined),
  });

  // Pipeline: filter → sort. Pagination is reserved for a future task.
  const pipelineRows = useMemo(
    () =>
      runRowModelPipeline({
        data,
        columns,
        filterState,
        ...(sort !== undefined ? { sort } : undefined),
      }),
    [data, columns, filterState, sort],
  );

  const visibleRowIds = useMemo(
    () => pipelineRows.map((row) => getRowId(row)),
    [pipelineRows, getRowId],
  );

  const selectAllState = useMemo(
    () => (selectionMode === "multiple" ? getSelectAllState(selectedIds, visibleRowIds) : "none"),
    [selectionMode, selectedIds, visibleRowIds],
  );

  const hasSelection = selectionMode !== "none";
  const typedColumns = columns;
  const hasActiveFilters = filterState.globalFilter !== "" || filterState.columnFilters.length > 0;

  // ─── Virtualization ────────────────────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredViewport, setMeasuredViewport] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
  const isVirtualized = virtualized && typeof rowHeight === "number" && rowHeight > 0;
  const virtualRowHeight = isVirtualized && typeof rowHeight === "number" ? rowHeight : 0;

  const rowIndexById = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < visibleRowIds.length; i++) {
      map.set(String(visibleRowIds[i]), i);
    }
    return map;
  }, [visibleRowIds]);

  useEffect(() => {
    if (!isVirtualized) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    // Measure the container once so we can prefer a real DOM value over the
    // consumer-provided `virtualScrollHeight` when the two differ.
    if (el.clientHeight > 0) setMeasuredViewport(el.clientHeight);

    const handleScroll = (): void => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setScrollTop(el.scrollTop);
        if (el.clientHeight > 0) setMeasuredViewport(el.clientHeight);
      });
    };
    el.addEventListener("scroll", handleScroll, { passive: true });

    const handleFocusIn = (event: FocusEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const row = target.closest("[data-row-id]");
      if (!row) return;
      const rowId = row.getAttribute("data-row-id");
      if (rowId === null) return;
      const index = rowIndexById.get(rowId);
      if (index !== undefined) setFocusedRowIndex(index);
    };
    const handleFocusOut = (event: FocusEvent): void => {
      const next = event.relatedTarget;
      if (next instanceof Node && el.contains(next)) return;
      setFocusedRowIndex(null);
    };
    el.addEventListener("focusin", handleFocusIn);
    el.addEventListener("focusout", handleFocusOut);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("focusin", handleFocusIn);
      el.removeEventListener("focusout", handleFocusOut);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isVirtualized, rowIndexById]);

  const effectiveViewport = isVirtualized
    ? (measuredViewport ?? virtualScrollHeight ?? Number.POSITIVE_INFINITY)
    : Number.POSITIVE_INFINITY;

  const virtualizerRange = isVirtualized
    ? computeVirtualizedRange({
        count: pipelineRows.length,
        rowHeight: virtualRowHeight,
        viewportHeight: effectiveViewport,
        scrollTop,
        ...(overscan !== undefined ? { overscan } : undefined),
      })
    : { startIndex: 0, endIndex: pipelineRows.length, paddingTop: 0, paddingBottom: 0 };

  // Extend the render slice on the side containing the focused row so it
  // survives windowing — per the KUI-ADV-013 accessibility policy.
  const renderStart = isVirtualized
    ? focusedRowIndex !== null && focusedRowIndex < virtualizerRange.startIndex
      ? focusedRowIndex
      : virtualizerRange.startIndex
    : 0;
  const renderEnd = isVirtualized
    ? focusedRowIndex !== null && focusedRowIndex >= virtualizerRange.endIndex
      ? focusedRowIndex + 1
      : virtualizerRange.endIndex
    : pipelineRows.length;

  const visibleSlice = isVirtualized ? pipelineRows.slice(renderStart, renderEnd) : pipelineRows;

  const paddingTop = isVirtualized ? renderStart * virtualRowHeight : 0;
  const paddingBottom = isVirtualized
    ? Math.max(0, (pipelineRows.length - renderEnd) * virtualRowHeight)
    : 0;

  // Empty state — original data is empty.
  if (!loading && data.length === 0 && emptyState) {
    return createElement(
      "div",
      {
        ...rest,
        ref: ref as React.Ref<HTMLDivElement>,
        ...(id ? { id } : undefined),
        "data-kui-component": "DataTable",
        "data-empty": "true",
        className,
      },
      emptyState,
    );
  }

  // Filtered-empty state — data has rows but every row is filtered out.
  if (!loading && data.length > 0 && pipelineRows.length === 0) {
    const filteredNode = filteredEmptyState ?? emptyState;
    if (filteredNode) {
      return createElement(
        "div",
        {
          ...rest,
          ref: ref as React.Ref<HTMLDivElement>,
          ...(id ? { id } : undefined),
          "data-kui-component": "DataTable",
          "data-empty": "true",
          ...(hasActiveFilters ? { "data-filtered-empty": "true" } : undefined),
          className,
        },
        filteredNode,
      );
    }
  }

  const tableElement = createElement(
    Table,
    {
      ...(rest as HTMLAttributes<HTMLTableElement>),
      ref,
      ...(id && !isVirtualized ? { id } : undefined),
      "aria-busy": loading || undefined,
      ...(isVirtualized ? { "aria-rowcount": pipelineRows.length + 1 } : undefined),
      "data-kui-component": "DataTable" as never,
      ...(isVirtualized ? { "data-virtualized": "true" } : undefined),
      className: isVirtualized ? undefined : className,
    } as never,
    // Header
    createElement(
      TableHeader,
      null,
      createElement(
        TableRow,
        { ...(isVirtualized ? { "aria-rowindex": 1 } : undefined) } as never,
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
        : [
            isVirtualized && paddingTop > 0
              ? createElement(
                  "tr",
                  {
                    key: "__kui-virtual-top-spacer",
                    "aria-hidden": "true",
                    "data-datatable-role": "virtual-spacer",
                    style: { height: `${String(paddingTop)}px` },
                  } as never,
                  createElement("td", {
                    colSpan: typedColumns.length + (hasSelection ? 1 : 0),
                    style: { padding: 0, border: 0 },
                  }),
                )
              : null,
            ...visibleSlice.map((row, sliceIndex) => {
              const dataIndex = isVirtualized ? renderStart + sliceIndex : sliceIndex;
              const rowId = getRowId(row);
              const selected = isSelected(rowId);
              return createElement(
                TableRow,
                {
                  key: String(rowId),
                  selected,
                  "data-row-id": String(rowId),
                  ...(isVirtualized
                    ? {
                        "aria-rowindex": dataIndex + 2,
                        style: { height: `${String(rowHeight)}px` },
                      }
                    : undefined),
                } as never,
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
            isVirtualized && paddingBottom > 0
              ? createElement(
                  "tr",
                  {
                    key: "__kui-virtual-bottom-spacer",
                    "aria-hidden": "true",
                    "data-datatable-role": "virtual-spacer",
                    style: { height: `${String(paddingBottom)}px` },
                  } as never,
                  createElement("td", {
                    colSpan: typedColumns.length + (hasSelection ? 1 : 0),
                    style: { padding: 0, border: 0 },
                  }),
                )
              : null,
          ].filter(Boolean),
    ),
  );

  if (!isVirtualized) return tableElement;

  const scrollStyle: CSSProperties = {
    overflowY: "auto",
    ...(virtualScrollHeight !== undefined ? { maxHeight: virtualScrollHeight } : undefined),
  };
  return createElement(
    "div",
    {
      ref: scrollContainerRef,
      ...(id ? { id } : undefined),
      className,
      style: scrollStyle,
      "data-kui-part": "datatable-scroll-container",
    },
    tableElement,
  );
}) as <TRow>(
  props: DataTableRootProps<TRow> &
    HTMLAttributes<HTMLTableElement> & { ref?: React.Ref<HTMLTableElement> },
) => React.ReactElement | null;
