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
