// @kairoui-pro/permission-matrix — public API surface.
//
// Backend-agnostic Permission Matrix UI. See
// docs/architecture/PHASE14-PERMISSION-MATRIX-ARCHITECTURE.md.

export type {
  PermissionAction,
  PermissionActionId,
  PermissionCell,
  PermissionCellChange,
  PermissionCellState,
  PermissionMatrixAccessibilityProps,
  PermissionMatrixBulkChangePayload,
  PermissionMatrixBulkSource,
  PermissionMatrixCellChangePayload,
  PermissionMatrixCellClickPayload,
  PermissionMatrixCellProps,
  PermissionMatrixCellRenderer,
  PermissionMatrixColumnHeaderProps,
  PermissionMatrixEmptyStateProps,
  PermissionMatrixEmptyStateRenderer,
  PermissionMatrixHeaderProps,
  PermissionMatrixLegendItemProps,
  PermissionMatrixMessages,
  PermissionMatrixMode,
  PermissionMatrixRootProps,
  PermissionMatrixRowHeaderProps,
  PermissionMatrixSelection,
  PermissionMatrixState,
  PermissionMatrixTableProps,
  PermissionMatrixToggleMode,
  PermissionSubject,
  PermissionSubjectId,
} from "./permission-matrix-types";

export {
  assertValidPermissionAction,
  assertValidPermissionCell,
  assertValidPermissionInput,
  assertValidPermissionSubject,
} from "./identity";

export {
  UNSET_STATE,
  computeBulkChanges,
  filterAxis,
  resolveCell,
  resolveToggleTarget,
  toggleCell,
} from "./cell-state";

export { DEFAULT_PERMISSION_MATRIX_KEYMAP, resolvePermissionMatrixAction } from "./keymap";
export type {
  PermissionMatrixAction,
  PermissionMatrixKeyBinding,
  PermissionMatrixKeymap,
} from "./keymap";

export {
  PermissionMatrix,
  PermissionMatrixCell,
  PermissionMatrixColumnHeader,
  PermissionMatrixEmptyState,
  PermissionMatrixHeader,
  PermissionMatrixLegendItem,
  PermissionMatrixRoot,
  PermissionMatrixRowHeader,
  PermissionMatrixTable,
} from "./permission-matrix";

export { PermissionMatrixContext, usePermissionMatrix } from "./permission-matrix-context";
export type { PermissionMatrixContextValue } from "./permission-matrix-context";
