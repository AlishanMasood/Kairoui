// @kairoui-pro/kanban — public API surface.
//
// Enterprise Kanban board for KairoUI. See
// docs/architecture/PHASE14-KANBAN-ARCHITECTURE.md for the contract.

export type {
  KanbanAccessibilityProps,
  KanbanBoardProps,
  KanbanCard,
  KanbanCardClickPayload,
  KanbanCardId,
  KanbanCardMovePayload,
  KanbanCardProps,
  KanbanCardRenderer,
  KanbanCardTemplateProps,
  KanbanColumn,
  KanbanColumnBodyProps,
  KanbanColumnFooterProps,
  KanbanColumnHeaderProps,
  KanbanColumnId,
  KanbanColumnMovePayload,
  KanbanColumnProps,
  KanbanColumnRenderer,
  KanbanDrag,
  KanbanDragPreviewProps,
  KanbanDropAcceptanceContext,
  KanbanDropPayload,
  KanbanEmptyStateProps,
  KanbanEmptyStateRenderer,
  KanbanMessages,
  KanbanRootProps,
  KanbanSelection,
  KanbanState,
} from "./kanban-types";

export { assertValidKanbanCard, assertValidKanbanColumn, assertValidKanbanInput } from "./identity";

export {
  computeCardOrder,
  computeColumnOrder,
  nextOrderBetween,
  orderAtIndex,
  partitionCardsByColumn,
} from "./ordering";

export { DEFAULT_KANBAN_KEYMAP, resolveKanbanAction } from "./keymap";
export type { KanbanAction, KanbanKeyBinding, KanbanKeymap } from "./keymap";

export {
  Kanban,
  KanbanBoard,
  KanbanCard as KanbanCardComponent,
  KanbanCardTemplate,
  KanbanColumn as KanbanColumnComponent,
  KanbanColumnBody,
  KanbanColumnFooter,
  KanbanColumnHeader,
  KanbanDragPreview,
  KanbanEmptyState,
  KanbanRoot,
} from "./kanban";

export { KanbanContext, useKanban } from "./kanban-context";
export type { KanbanContextValue } from "./kanban-context";
