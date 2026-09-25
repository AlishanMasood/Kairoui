import {
  Fragment,
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useControllableState } from "@kairoui/hooks";
import {
  applyFilters,
  getCellContent,
  getCellValue,
  getHeaderContent,
  useFilterState,
  useRowSelection,
} from "@kairoui/core/components";
import type { RowId, SortState } from "@kairoui/core/components";
import { computeVirtualizedRange } from "@kairoui/utils";
import type { DataGridColumnDef } from "./column-types";
import type { DataGridRootProps, FocusState } from "./data-grid-types";
import {
  EMPTY_FOCUS_STATE,
  focusCell as reduceFocusCell,
  moveFocus as reduceMoveFocus,
  pageFocus as reducePageFocus,
} from "./data-grid-focus";
import {
  findSortEntry,
  getPinnedColumnIds,
  getVisibleColumnIds,
  toggleColumnSort,
} from "./column-model";
import { useColumnState } from "./use-column-state";
import { useGrouping } from "./use-grouping";
import { useEditing } from "./use-editing";
import { buildRowNodes, type GridRowNode } from "./row-model";
import { computeFooterAggregates } from "./aggregation";

// ─── Constants ─────────────────────────────────────────────────────

const SELECTION_COLUMN_ID = "__kui_select__";

// ─── Helpers ───────────────────────────────────────────────────────

function isRowSelectionEnabled(mode: string | undefined): boolean {
  return mode === "single" || mode === "multiple";
}

function rowKey(nodeId: RowId | string): string {
  return String(nodeId);
}

/** Safely stringify any value for display; falls back to JSON for objects. */
function safeStringify(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

// ─── Component ─────────────────────────────────────────────────────

/**
 * The Enterprise DataGrid — integrates the KUI-ENT-003–006 column /
 * row / editing infrastructure with row virtualization, sorting,
 * filtering, selection, and keyboard cell focus. See
 * `docs/architecture/PHASE14-DATAGRID-ARCHITECTURE.md` for the full
 * contract.
 */
function DataGridInner<TRow>(
  props: DataGridRootProps<TRow>,
  ref: React.ForwardedRef<HTMLDivElement>,
): ReactNode {
  const {
    data,
    columns,
    getRowId,

    sort: sortProp,
    defaultSort,
    onSortChange,
    multiSort = false,
    serverSort = false,

    filterState: filterStateProp,
    defaultFilterState,
    onFilterStateChange,
    serverFilter = false,

    selectionMode = "none",
    selectedIds: selectedIdsProp,
    defaultSelectedIds,
    onSelectionChange,

    columnSizing,
    defaultColumnSizing,
    onColumnSizingChange,
    columnOrder,
    defaultColumnOrder,
    onColumnOrderChange,
    columnPinning,
    defaultColumnPinning,
    onColumnPinningChange,
    columnVisibility,
    defaultColumnVisibility,
    onColumnVisibilityChange,
    defaultColumnWidth,

    groupBy,
    defaultGroupBy,
    onGroupByChange,
    expanded,
    defaultExpanded,
    onExpandChange,

    editMode = "none",
    editingState,
    defaultEditingState,
    onEditingChange,
    onCellEdit,
    onRowEdit,

    focusState: focusStateProp,
    defaultFocusState,
    onFocusChange,

    virtualized = false,
    rowHeight,
    overscan,
    virtualScrollHeight,

    loading = false,
    emptyState,
    filteredEmptyState,
    toolbar,
    footer,
    showAggregatedFooter = false,
    renderGroupSummary,

    dir = "ltr",

    id,
    className,
    style,
    ...rest
  } = props;

  // ─── Column state ────────────────────────────────────────────
  const columnStateProps = useColumnState({
    columns,
    ...(columnSizing !== undefined ? { columnSizing } : undefined),
    ...(defaultColumnSizing !== undefined ? { defaultColumnSizing } : undefined),
    ...(onColumnSizingChange ? { onColumnSizingChange } : undefined),
    ...(columnOrder !== undefined ? { columnOrder } : undefined),
    ...(defaultColumnOrder !== undefined ? { defaultColumnOrder } : undefined),
    ...(onColumnOrderChange ? { onColumnOrderChange } : undefined),
    ...(columnPinning !== undefined ? { columnPinning } : undefined),
    ...(defaultColumnPinning !== undefined ? { defaultColumnPinning } : undefined),
    ...(onColumnPinningChange ? { onColumnPinningChange } : undefined),
    ...(columnVisibility !== undefined ? { columnVisibility } : undefined),
    ...(defaultColumnVisibility !== undefined ? { defaultColumnVisibility } : undefined),
    ...(onColumnVisibilityChange ? { onColumnVisibilityChange } : undefined),
    ...(defaultColumnWidth !== undefined ? { defaultColumnWidth } : undefined),
  });
  const colState = columnStateProps.state;

  // ─── Filter state ────────────────────────────────────────────
  const { filterState } = useFilterState({
    ...(filterStateProp !== undefined ? { filterState: filterStateProp } : undefined),
    ...(defaultFilterState !== undefined ? { defaultFilterState } : undefined),
    ...(onFilterStateChange ? { onFilterStateChange } : undefined),
  });

  // ─── Multi-sort state ────────────────────────────────────────
  const [sort, setSort] = useControllableState<readonly SortState[]>({
    value: sortProp,
    defaultValue: defaultSort ?? [],
    ...(onSortChange ? { onChange: onSortChange } : undefined),
    name: "DataGrid",
    state: "sort",
  });

  // ─── Row selection ───────────────────────────────────────────
  const { selectedIds, toggleRow, toggleAll, isSelected } = useRowSelection({
    selectionMode,
    ...(selectedIdsProp !== undefined ? { selectedIds: selectedIdsProp } : undefined),
    ...(defaultSelectedIds !== undefined ? { defaultSelectedIds } : undefined),
    ...(onSelectionChange ? { onSelectionChange } : undefined),
  });

  // ─── Grouping state ──────────────────────────────────────────
  const grouping = useGrouping({
    columns,
    ...(groupBy !== undefined ? { groupBy } : undefined),
    ...(defaultGroupBy !== undefined ? { defaultGroupBy } : undefined),
    ...(onGroupByChange ? { onGroupByChange } : undefined),
    ...(expanded !== undefined ? { expanded } : undefined),
    ...(defaultExpanded !== undefined ? { defaultExpanded } : undefined),
    ...(onExpandChange ? { onExpandChange } : undefined),
  });

  // ─── Editing state ───────────────────────────────────────────
  const editing = useEditing<TRow>({
    data,
    columns,
    getRowId,
    mode: editMode,
    ...(editingState !== undefined ? { editingState } : undefined),
    ...(defaultEditingState !== undefined ? { defaultEditingState } : undefined),
    ...(onEditingChange ? { onEditingChange } : undefined),
    ...(onCellEdit ? { onCellEdit } : undefined),
    ...(onRowEdit ? { onRowEdit } : undefined),
  });

  // ─── Focus state ─────────────────────────────────────────────
  const [focus, setFocus] = useControllableState<FocusState>({
    value: focusStateProp,
    defaultValue: defaultFocusState ?? EMPTY_FOCUS_STATE,
    ...(onFocusChange ? { onChange: onFocusChange } : undefined),
    name: "DataGrid",
    state: "focusState",
  });

  // ─── Pipeline: filter → sort ─────────────────────────────────
  const filteredData = useMemo(
    () => (serverFilter ? data : applyFilters({ data, state: filterState, columns })),
    [columns, data, filterState, serverFilter],
  );

  const sortedData = useMemo(() => {
    if (serverSort) return filteredData;
    if (sort.length === 0) return filteredData;
    return multiSortRows(filteredData, sort, columns);
  }, [columns, filteredData, serverSort, sort]);

  // ─── Row-model nodes ─────────────────────────────────────────
  const nodes = useMemo(
    () =>
      buildRowNodes({
        data: sortedData,
        columns,
        groupBy: grouping.state.groupBy,
        expanded: grouping.expanded,
        getRowId,
      }),
    [columns, getRowId, grouping.expanded, grouping.state.groupBy, sortedData],
  );

  const grandTotalAggregates = useMemo(
    () => (showAggregatedFooter ? computeFooterAggregates(columns, sortedData) : null),
    [columns, showAggregatedFooter, sortedData],
  );

  // ─── Column layout selectors ─────────────────────────────────
  const centerColumnIds = useMemo(() => getVisibleColumnIds(colState), [colState]);
  const pinnedGroups = useMemo(() => getPinnedColumnIds(colState), [colState]);
  const visibleColumnIds = centerColumnIds;
  const rowSelectionEnabled = isRowSelectionEnabled(selectionMode);
  const renderColumnIds = useMemo(
    () => (rowSelectionEnabled ? [SELECTION_COLUMN_ID, ...visibleColumnIds] : visibleColumnIds),
    [rowSelectionEnabled, visibleColumnIds],
  );

  const columnById = useMemo(() => {
    const map = new Map<string, DataGridColumnDef<TRow>>();
    for (const column of columns) map.set(column.id, column);
    return map;
  }, [columns]);

  // ─── Focus layout ────────────────────────────────────────────
  const focusableRowIds = useMemo(
    () =>
      nodes
        .filter((n): n is Exclude<GridRowNode<TRow>, { kind: "footer" }> => n.kind !== "footer")
        .map((n) => n.id) as readonly RowId[],
    [nodes],
  );
  const focusableColumnIds = renderColumnIds;
  const focusLayout = useMemo(
    () => ({ rowIds: focusableRowIds, columnIds: focusableColumnIds }),
    [focusableColumnIds, focusableRowIds],
  );

  // ─── Virtualization ──────────────────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredViewport, setMeasuredViewport] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const isVirtualized = virtualized && typeof rowHeight === "number" && rowHeight > 0;
  const virtualRowHeight = isVirtualized && typeof rowHeight === "number" ? rowHeight : 0;

  useEffect(() => {
    if (!isVirtualized) return;
    const el = scrollContainerRef.current;
    if (!el) return;
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
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isVirtualized]);

  const effectiveViewport = isVirtualized
    ? (measuredViewport ?? virtualScrollHeight ?? Number.POSITIVE_INFINITY)
    : Number.POSITIVE_INFINITY;

  const range = isVirtualized
    ? computeVirtualizedRange({
        count: nodes.length,
        rowHeight: virtualRowHeight,
        viewportHeight: effectiveViewport,
        scrollTop,
        ...(overscan !== undefined ? { overscan } : undefined),
      })
    : { startIndex: 0, endIndex: nodes.length, paddingTop: 0, paddingBottom: 0 };

  // Force-mount the focused row so it survives windowing.
  const focusedRowIndex = useMemo(() => {
    if (focus.rowId === null) return -1;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node?.id === focus.rowId) return i;
    }
    return -1;
  }, [focus.rowId, nodes]);

  const renderStart =
    isVirtualized && focusedRowIndex !== -1 && focusedRowIndex < range.startIndex
      ? focusedRowIndex
      : range.startIndex;
  const renderEnd =
    isVirtualized && focusedRowIndex !== -1 && focusedRowIndex >= range.endIndex
      ? focusedRowIndex + 1
      : range.endIndex;

  const visibleSlice = isVirtualized ? nodes.slice(renderStart, renderEnd) : nodes;
  const paddingTop = isVirtualized ? renderStart * virtualRowHeight : 0;
  const paddingBottom = isVirtualized
    ? Math.max(0, (nodes.length - renderEnd) * virtualRowHeight)
    : 0;

  // ─── Interaction helpers ─────────────────────────────────────
  const rtlSign = dir === "rtl" ? -1 : 1;

  const handleHeaderClick = useCallback(
    (columnId: string, event: MouseEvent<HTMLElement>) => {
      const column = columnById.get(columnId);
      if (!column) return;
      if (column.sortable === false) return;
      const additive = multiSort || event.shiftKey || event.metaKey || event.ctrlKey;
      setSort((prev) => toggleColumnSort(prev, columnId, additive));
    },
    [columnById, multiSort, setSort],
  );

  const handleGroupToggle = useCallback(
    (groupId: string) => {
      grouping.toggleExpanded(groupId);
    },
    [grouping],
  );

  const handleCellClick = useCallback(
    (rowId: RowId, columnId: string) => {
      setFocus((prev) => reduceFocusCell(prev, focusLayout, rowId, columnId));
    },
    [focusLayout, setFocus],
  );

  const handleCellDoubleClick = useCallback(
    (rowId: RowId, columnId: string) => {
      if (editing.mode === "none") return;
      const column = columnById.get(columnId);
      if (!column || column.editable !== true) return;
      editing.beginEdit(rowId, columnId);
    },
    [columnById, editing],
  );

  const pageSize = useMemo(() => {
    if (!isVirtualized) return 10;
    if (effectiveViewport === Number.POSITIVE_INFINITY) return 10;
    if (virtualRowHeight <= 0) return 10;
    return Math.max(1, Math.floor(effectiveViewport / virtualRowHeight));
  }, [effectiveViewport, isVirtualized, virtualRowHeight]);

  const handleGridKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (editing.state.active) return; // editor owns keys while active
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      // Ignore keys originating from focused editor inputs.
      if (target.matches("input, textarea, select")) return;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          setFocus((prev) => reduceMoveFocus(prev, focusLayout, "up"));
          return;
        case "ArrowDown":
          event.preventDefault();
          setFocus((prev) => reduceMoveFocus(prev, focusLayout, "down"));
          return;
        case "ArrowLeft":
          event.preventDefault();
          setFocus((prev) => reduceMoveFocus(prev, focusLayout, rtlSign === 1 ? "left" : "right"));
          return;
        case "ArrowRight":
          event.preventDefault();
          setFocus((prev) => reduceMoveFocus(prev, focusLayout, rtlSign === 1 ? "right" : "left"));
          return;
        case "Home":
          event.preventDefault();
          setFocus((prev) =>
            reduceMoveFocus(prev, focusLayout, event.ctrlKey ? "gridStart" : "rowStart"),
          );
          return;
        case "End":
          event.preventDefault();
          setFocus((prev) =>
            reduceMoveFocus(prev, focusLayout, event.ctrlKey ? "gridEnd" : "rowEnd"),
          );
          return;
        case "PageUp":
          event.preventDefault();
          setFocus((prev) => reducePageFocus(prev, focusLayout, "pageUp", pageSize));
          return;
        case "PageDown":
          event.preventDefault();
          setFocus((prev) => reducePageFocus(prev, focusLayout, "pageDown", pageSize));
          return;
        case "Enter":
        case "F2": {
          if (focus.rowId === null || focus.columnId === null) return;
          if (focus.columnId === SELECTION_COLUMN_ID) {
            if (selectionMode !== "none") toggleRow(focus.rowId);
            event.preventDefault();
            return;
          }
          const column = columnById.get(focus.columnId);
          if (!column || column.editable !== true) return;
          if (editing.mode === "none") return;
          editing.beginEdit(focus.rowId, focus.columnId);
          event.preventDefault();
          return;
        }
        case " ": {
          if (focus.rowId === null) return;
          if (selectionMode !== "none") {
            toggleRow(focus.rowId);
            event.preventDefault();
          }
          return;
        }
        default:
          return;
      }
    },
    [
      columnById,
      editing,
      focus.columnId,
      focus.rowId,
      focusLayout,
      pageSize,
      rtlSign,
      selectionMode,
      setFocus,
      toggleRow,
    ],
  );

  // ─── Focused-cell DOM focus ──────────────────────────────────
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const registerCell = useCallback((key: string, el: HTMLElement | null) => {
    if (el === null) cellRefs.current.delete(key);
    else cellRefs.current.set(key, el);
  }, []);

  useEffect(() => {
    if (focus.rowId === null || focus.columnId === null) return;
    const key = `${String(focus.rowId)}::${focus.columnId}`;
    const el = cellRefs.current.get(key);
    if (el && el.tabIndex === 0 && document.activeElement !== el) {
      el.focus({ preventScroll: false });
    }
  }, [focus.columnId, focus.rowId]);

  // ─── Empty / filtered-empty ──────────────────────────────────
  const hasActiveFilters = filterState.globalFilter !== "" || filterState.columnFilters.length > 0;
  const dataIsEmpty = !loading && data.length === 0;
  const filteredIsEmpty = !loading && !dataIsEmpty && sortedData.length === 0;

  // ─── Rendering ───────────────────────────────────────────────

  const cellStyle = (
    columnId: string,
    isPinnedLeft: boolean,
    isPinnedRight: boolean,
  ): CSSProperties => {
    const width = colState.sizing[columnId];
    const style: CSSProperties = {};
    if (typeof width === "number") style.width = width;
    if (isPinnedLeft) {
      style.position = "sticky";
      style.left = 0;
      style.zIndex = 1;
    } else if (isPinnedRight) {
      style.position = "sticky";
      style.right = 0;
      style.zIndex = 1;
    }
    return style;
  };

  const renderHeaderCell = (columnId: string): ReactNode => {
    if (columnId === SELECTION_COLUMN_ID) {
      const state = selectAllStateFromSelection(selectedIds, focusableRowIds);
      const checked = state === "all";
      return createElement(
        "th",
        {
          key: SELECTION_COLUMN_ID,
          role: "columnheader",
          "data-kui-column-id": SELECTION_COLUMN_ID,
          "aria-colindex": renderColumnIds.indexOf(SELECTION_COLUMN_ID) + 1,
          style: cellStyle(
            SELECTION_COLUMN_ID,
            pinnedGroups.left.includes(SELECTION_COLUMN_ID),
            pinnedGroups.right.includes(SELECTION_COLUMN_ID),
          ),
        },
        createElement("input", {
          type: "checkbox",
          "aria-label": "Select all rows",
          checked,
          ref: (el: HTMLInputElement | null) => {
            if (el) el.indeterminate = state === "indeterminate";
          },
          onChange: () => {
            toggleAll(focusableRowIds);
          },
        }),
      );
    }
    const column = columnById.get(columnId);
    if (!column) return null;
    const sortEntry = findSortEntry(sort, columnId);
    const ariaSort =
      sortEntry === undefined
        ? "none"
        : sortEntry.entry.direction === "ascending"
          ? "ascending"
          : "descending";
    const canSort = column.sortable !== false;
    const isPinnedLeft = pinnedGroups.left.includes(columnId);
    const isPinnedRight = pinnedGroups.right.includes(columnId);
    return createElement(
      "th",
      {
        key: columnId,
        role: "columnheader",
        "data-kui-column-id": columnId,
        "aria-colindex": renderColumnIds.indexOf(columnId) + 1,
        "aria-sort": canSort ? ariaSort : undefined,
        ...(isPinnedLeft || isPinnedRight
          ? { "data-pinned": isPinnedLeft ? "left" : "right" }
          : undefined),
        style: cellStyle(columnId, isPinnedLeft, isPinnedRight),
      },
      canSort
        ? createElement(
            "button",
            {
              type: "button",
              "data-kui-header-button": "true",
              onClick: (e: MouseEvent<HTMLButtonElement>) => {
                handleHeaderClick(columnId, e);
              },
            },
            getHeaderContent(column),
            sortEntry
              ? createElement(
                  "span",
                  { "aria-hidden": "true", "data-kui-sort-indicator": ariaSort },
                  sortEntry.entry.direction === "ascending" ? " ↑" : " ↓",
                )
              : null,
            multiSort && sortEntry
              ? createElement(
                  "span",
                  { "aria-hidden": "true", "data-kui-sort-priority": String(sortEntry.index + 1) },
                  ` ${String(sortEntry.index + 1)}`,
                )
              : null,
          )
        : getHeaderContent(column),
    );
  };

  const renderLeafCell = (
    node: Extract<GridRowNode<TRow>, { kind: "leaf" }>,
    columnId: string,
    rowIndexInLayout: number,
  ): ReactNode => {
    if (columnId === SELECTION_COLUMN_ID) {
      const checked = isSelected(node.id);
      return createElement(
        "td",
        {
          key: SELECTION_COLUMN_ID,
          role: "gridcell",
          "aria-colindex": 1,
          "data-kui-column-id": SELECTION_COLUMN_ID,
          style: cellStyle(
            SELECTION_COLUMN_ID,
            pinnedGroups.left.includes(SELECTION_COLUMN_ID),
            pinnedGroups.right.includes(SELECTION_COLUMN_ID),
          ),
        },
        createElement("input", {
          type: "checkbox",
          "aria-label": `Select row ${String(node.id)}`,
          checked,
          onChange: () => {
            toggleRow(node.id);
          },
          onClick: (e: MouseEvent<HTMLInputElement>) => {
            e.stopPropagation();
          },
        }),
      );
    }

    const column = columnById.get(columnId);
    if (!column) return null;
    const isPinnedLeft = pinnedGroups.left.includes(columnId);
    const isPinnedRight = pinnedGroups.right.includes(columnId);
    const isFocused = focus.rowId === node.id && focus.columnId === columnId;
    const isEditing = editing.isCellEditing(node.id, columnId);
    const editContext = isEditing ? editing.getCellEditContext(node.id, columnId) : null;
    const cellError = editing.getCellError(node.id, columnId);
    const cellContent =
      isEditing && editContext && column.editCell
        ? column.editCell(editContext)
        : getCellContent(column, node.row);

    return createElement(
      "td",
      {
        key: columnId,
        role: "gridcell",
        "data-kui-column-id": columnId,
        "aria-colindex": renderColumnIds.indexOf(columnId) + 1,
        "aria-rowindex": rowIndexInLayout + 2, // 1-based, +1 for header
        "aria-selected": isRowSelectionEnabled(selectionMode) ? isSelected(node.id) : undefined,
        tabIndex: isFocused ? 0 : -1,
        ...(isPinnedLeft || isPinnedRight
          ? { "data-pinned": isPinnedLeft ? "left" : "right" }
          : undefined),
        "data-editing": isEditing ? "true" : undefined,
        "data-cell-error": cellError,
        onClick: () => {
          handleCellClick(node.id, columnId);
        },
        onDoubleClick: () => {
          handleCellDoubleClick(node.id, columnId);
        },
        onKeyDown: isEditing ? editing.getEditorKeyHandler() : undefined,

        ref: (el: HTMLTableCellElement | null) => {
          registerCell(`${rowKey(node.id)}::${columnId}`, el);
        },
        style: cellStyle(columnId, isPinnedLeft, isPinnedRight),
      },
      cellContent,
    );
  };

  const renderGroupNode = (
    node: Extract<GridRowNode<TRow>, { kind: "group" }>,
    rowIndexInLayout: number,
  ): ReactNode => {
    const cells: ReactNode[] = [];
    for (const columnId of renderColumnIds) {
      const isPinnedLeft = pinnedGroups.left.includes(columnId);
      const isPinnedRight = pinnedGroups.right.includes(columnId);
      const isFocused = focus.rowId === node.id && focus.columnId === columnId;
      let content: ReactNode = null;

      if (columnId === SELECTION_COLUMN_ID) {
        // Selection column becomes a passive placeholder for group rows.
        content = null;
      } else {
        const column = columnById.get(columnId);
        if (!column) continue;
        const aggValue = node.aggregates[columnId];
        if (columnId === node.columnId) {
          const toggle = createElement(
            "button",
            {
              type: "button",
              "aria-label": node.expanded ? "Collapse group" : "Expand group",
              "aria-expanded": node.expanded,
              "data-kui-group-toggle": "true",
              onClick: (e: MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                handleGroupToggle(node.id);
              },
            },
            node.expanded ? "▾" : "▸",
          );
          content = createElement(
            Fragment,
            null,
            toggle,
            " ",
            createElement("strong", null, safeStringify(node.key)),
            ` (${String(node.count)})`,
          );
        } else if (aggValue !== undefined && aggValue !== null) {
          if (renderGroupSummary) {
            content = renderGroupSummary({
              columnId,
              aggregateValue: aggValue,
              column,
              key: node.key,
              count: node.count,
              depth: node.depth,
            });
          } else if (column.aggregate?.formatter) {
            content = column.aggregate.formatter(aggValue);
          } else {
            content = safeStringify(aggValue);
          }
        }
      }

      cells.push(
        createElement(
          "td",
          {
            key: columnId,
            role: "gridcell",
            "data-kui-column-id": columnId,
            "aria-colindex": renderColumnIds.indexOf(columnId) + 1,
            tabIndex: isFocused ? 0 : -1,
            style: cellStyle(columnId, isPinnedLeft, isPinnedRight),
            ...(isPinnedLeft || isPinnedRight
              ? { "data-pinned": isPinnedLeft ? "left" : "right" }
              : undefined),
            onClick: () => {
              handleCellClick(node.id, columnId);
            },

            ref: (el: HTMLTableCellElement | null) => {
              registerCell(`${rowKey(node.id)}::${columnId}`, el);
            },
          },
          content,
        ),
      );
    }

    return createElement(
      "tr",
      {
        key: rowKey(node.id),
        role: "row",
        "data-kui-row-kind": "group",
        "data-kui-group-depth": String(node.depth),
        "aria-expanded": node.expanded,
        "aria-level": node.depth + 1,
        "aria-rowindex": rowIndexInLayout + 2,
        style: isVirtualized ? { height: virtualRowHeight } : undefined,
      },
      cells,
    );
  };

  const renderLeafRow = (
    node: Extract<GridRowNode<TRow>, { kind: "leaf" }>,
    rowIndexInLayout: number,
  ): ReactNode => {
    const cells = renderColumnIds.map((columnId) =>
      renderLeafCell(node, columnId, rowIndexInLayout),
    );
    return createElement(
      "tr",
      {
        key: rowKey(node.id),
        role: "row",
        "data-kui-row-kind": "leaf",
        "data-row-id": String(node.id),
        "aria-selected": isRowSelectionEnabled(selectionMode) ? isSelected(node.id) : undefined,
        "aria-rowindex": rowIndexInLayout + 2,
        style: isVirtualized ? { height: virtualRowHeight } : undefined,
      },
      cells,
    );
  };

  const renderFooterRow = (): ReactNode => {
    if (!grandTotalAggregates) return null;
    const cells = renderColumnIds.map((columnId) => {
      const isPinnedLeft = pinnedGroups.left.includes(columnId);
      const isPinnedRight = pinnedGroups.right.includes(columnId);
      const column = columnById.get(columnId);
      const value = grandTotalAggregates[columnId];
      const content =
        column?.aggregate?.formatter && value !== undefined
          ? column.aggregate.formatter(value)
          : value === undefined
            ? null
            : safeStringify(value);
      return createElement(
        "td",
        {
          key: columnId,
          role: "gridcell",
          "data-kui-column-id": columnId,
          style: cellStyle(columnId, isPinnedLeft, isPinnedRight),
        },
        content,
      );
    });
    return createElement("tr", { role: "row", "data-kui-row-kind": "footer" }, cells);
  };

  // ─── Header row ──────────────────────────────────────────────
  const headerCells = renderColumnIds.map((cid) => renderHeaderCell(cid));

  // ─── Body render ─────────────────────────────────────────────
  const bodyChildren: ReactNode[] = [];
  if (isVirtualized && paddingTop > 0) {
    bodyChildren.push(
      createElement("tr", {
        key: "__pad-top__",
        "aria-hidden": "true",
        style: { height: paddingTop } satisfies CSSProperties,
      }),
    );
  }
  for (let i = 0; i < visibleSlice.length; i++) {
    const node = visibleSlice[i];
    if (!node) continue;
    const logicalIndex = renderStart + i;
    if (node.kind === "footer") continue;
    if (node.kind === "leaf") {
      // eslint-disable-next-line react-hooks/refs
      bodyChildren.push(renderLeafRow(node, logicalIndex));
    } else {
      // eslint-disable-next-line react-hooks/refs
      bodyChildren.push(renderGroupNode(node, logicalIndex));
    }
  }
  if (isVirtualized && paddingBottom > 0) {
    bodyChildren.push(
      createElement("tr", {
        key: "__pad-bot__",
        "aria-hidden": "true",
        style: { height: paddingBottom } satisfies CSSProperties,
      }),
    );
  }

  // ─── Empty-state handling ────────────────────────────────────
  let bodyOrEmpty: ReactNode = createElement("tbody", { role: "rowgroup" }, bodyChildren);
  if (dataIsEmpty && emptyState) {
    bodyOrEmpty = createElement(
      "tbody",
      { role: "rowgroup" },
      createElement(
        "tr",
        { "aria-rowindex": 2 },
        createElement(
          "td",
          {
            role: "gridcell",
            colSpan: renderColumnIds.length,
            "data-kui-empty-state": "true",
          },
          emptyState,
        ),
      ),
    );
  } else if (filteredIsEmpty && (filteredEmptyState ?? emptyState)) {
    bodyOrEmpty = createElement(
      "tbody",
      { role: "rowgroup" },
      createElement(
        "tr",
        { "aria-rowindex": 2 },
        createElement(
          "td",
          {
            role: "gridcell",
            colSpan: renderColumnIds.length,
            "data-kui-filtered-empty-state": "true",
          },
          filteredEmptyState ?? emptyState,
        ),
      ),
    );
  }

  // ─── Root ────────────────────────────────────────────────────
  const rootStyle: CSSProperties = { ...style };
  if (isVirtualized && typeof virtualScrollHeight === "number") {
    rootStyle.height = virtualScrollHeight;
    rootStyle.overflow = "auto";
  }

  return createElement(
    "div",
    // eslint-disable-next-line react-hooks/refs
    {
      ref: (el: HTMLDivElement | null) => {
        scrollContainerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      role: "grid",
      "aria-rowcount": nodes.length + 1,
      "aria-colcount": renderColumnIds.length,
      "aria-multiselectable": selectionMode === "multiple" ? true : undefined,
      "aria-busy": loading ? true : undefined,
      dir,
      id,
      className,
      style: rootStyle,
      onKeyDown: handleGridKeyDown,
      "data-kui-component": "DataGrid",
      "data-loading": loading ? "true" : undefined,
      "data-filtered-empty": filteredIsEmpty ? "true" : undefined,
      "data-editing-mode": editing.mode,
      ...rest,
    },
    toolbar ? createElement("div", { "data-kui-slot": "toolbar" }, toolbar) : null,
    createElement(
      "table",
      { role: "presentation", "data-kui-slot": "table" },
      createElement(
        "thead",
        { role: "rowgroup" },
        createElement("tr", { role: "row", "aria-rowindex": 1 }, headerCells),
      ),
      bodyOrEmpty,
    ),
    hasActiveFilters ? null : null,
    footer ? createElement("div", { "data-kui-slot": "footer" }, footer) : null,
    grandTotalAggregates
      ? createElement(
          "div",
          { "data-kui-slot": "aggregate-footer" },
          createElement(
            "table",
            { role: "presentation" },
            createElement("tbody", { role: "rowgroup" }, renderFooterRow()),
          ),
        )
      : null,
  );
}

/** Compute the select-all checkbox tri-state from the selection set. */
function selectAllStateFromSelection(
  selected: ReadonlySet<RowId>,
  rowIds: readonly RowId[],
): "all" | "none" | "indeterminate" {
  if (rowIds.length === 0) return "none";
  let count = 0;
  for (const id of rowIds) {
    if (selected.has(id)) count += 1;
  }
  if (count === 0) return "none";
  if (count === rowIds.length) return "all";
  return "indeterminate";
}

/** Stable multi-column sort applied at each level in priority order. */
function multiSortRows<TRow>(
  data: readonly TRow[],
  sort: readonly SortState[],
  columns: readonly DataGridColumnDef<TRow>[],
): readonly TRow[] {
  if (data.length <= 1 || sort.length === 0) return data;
  const columnById = new Map<string, DataGridColumnDef<TRow>>();
  for (const c of columns) columnById.set(c.id, c);
  const indexed = data.map((row, i) => ({ row, i }));
  indexed.sort((a, b) => {
    for (const entry of sort) {
      const column = columnById.get(entry.columnId);
      if (!column) continue;
      if (column.sortable === false) continue;
      const cmp = compareRows(column, a.row, b.row) * (entry.direction === "descending" ? -1 : 1);
      if (cmp !== 0) return cmp;
    }
    return a.i - b.i;
  });
  return indexed.map((entry) => entry.row);
}

function compareRows<TRow>(column: DataGridColumnDef<TRow>, a: TRow, b: TRow): number {
  if (column.sortFn) return column.sortFn(a, b);
  const va = getCellValue(column, a);
  const vb = getCellValue(column, b);
  return defaultCompare(va, vb);
}

function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "boolean" && typeof b === "boolean") return a === b ? 0 : a ? -1 : 1;
  return safeStringify(a).localeCompare(safeStringify(b));
}

// ─── Export ────────────────────────────────────────────────────────

export const DataGrid = forwardRef(DataGridInner) as <TRow>(
  props: DataGridRootProps<TRow> & { ref?: React.Ref<HTMLDivElement> },
) => ReactNode;
