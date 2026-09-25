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
