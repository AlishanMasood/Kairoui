// @kairoui-pro/data-grid — public API surface.
//
// Enterprise DataGrid state and helpers. See
// docs/architecture/PHASE14-DATAGRID-ARCHITECTURE.md for the full
// contract.

export type {
  AggregationBuiltin,
  AggregationFn,
  AggregationReducer,
  AggregationSpec,
  ColumnMetadata,
  ColumnOrder,
  ColumnPinning,
  ColumnPinSide,
  ColumnRuntime,
  ColumnRuntimeContext,
  ColumnSizing,
  ColumnState,
  ColumnStateInitOptions,
  ColumnVisibility,
  DataGridColumnDef,
  DataGridColumnId,
  EditCellRenderContext,
  EditCellRenderer,
  PinnedColumnGroups,
  ValidationResult,
} from "./column-types";

export {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
  clampColumnWidth,
  clearSort,
  findColumnFilter,
  findSortEntry,
  getColumnDefaultWidth,
  getColumnRuntime,
  getColumnWidth,
  getPinnedColumnIds,
  getTotalWidth,
  getVisibleColumnIds,
  hideColumn,
  initialColumnState,
  isColumnHidden,
  isColumnPinned,
  moveColumn,
  pinColumn,
  resetColumnState,
  setColumnOrder,
  setColumnPinning,
  setColumnSizing,
  setColumnVisibility,
  setColumnWidth,
  toggleColumnSort,
} from "./column-model";
export { useColumnState } from "./use-column-state";
export type { UseColumnStateOptions, UseColumnStateReturn } from "./use-column-state";

export { useColumnResize } from "./use-column-resize";
export type {
  ResizeHandleProps,
  UseColumnResizeOptions,
  UseColumnResizeReturn,
} from "./use-column-resize";

export { REORDER_MIME, useColumnReorder } from "./use-column-reorder";
export type {
  DragHandleProps,
  DropTargetProps,
  UseColumnReorderOptions,
  UseColumnReorderReturn,
} from "./use-column-reorder";

export { useColumnPinning } from "./use-column-pinning";
export type { UseColumnPinningOptions, UseColumnPinningReturn } from "./use-column-pinning";

export {
  applyReducer,
  computeAggregates,
  computeFooterAggregates,
  hasFooterAggregate,
  reduceAverage,
  reduceCount,
  reduceCountUnique,
  reduceMax,
  reduceMin,
  reduceSum,
} from "./aggregation";

export {
  FOOTER_NODE_ID,
  GROUP_ID_PREFIX,
  buildRowNodes,
  buildRowState,
  filterGroupableColumns,
  groupNodeId,
  stableKeyString,
} from "./row-model";
export type {
  BuildRowNodesOptions,
  GridFooterRowNode,
  GridGroupRowNode,
  GridLeafRowNode,
  GridRowNode,
  GroupingState,
  RowState,
} from "./row-model";

export { useGrouping } from "./use-grouping";
export type { UseGroupingOptions, UseGroupingReturn } from "./use-grouping";

export type {
  CellEditEvent,
  EditingCell,
  EditingMode,
  EditingState,
  RowEditEvent,
} from "./editing-types";

export {
  EMPTY_EDITING_STATE,
  beginEdit,
  cancelEdit,
  changeEdit,
  discardAllPending,
  discardPendingRow,
  emptyEditingState,
  getCellError,
  getPendingValue,
  isCellEditing,
  isRowEditing,
  setEditingMode,
  stagePendingValue,
  stageValidationError,
} from "./editing-model";

export { useEditing } from "./use-editing";
export type { UseEditingOptions, UseEditingReturn } from "./use-editing";
