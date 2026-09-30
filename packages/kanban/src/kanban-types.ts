// Public types for the KairoUI Kanban. See
// docs/architecture/PHASE14-KANBAN-ARCHITECTURE.md for the contract.

import type { CSSProperties, ReactNode } from "react";

// ─── Identity ────────────────────────────────────────────────────

export type KanbanColumnId = string;
export type KanbanCardId = string;

// ─── Data ────────────────────────────────────────────────────────

export interface KanbanColumn {
  readonly id: KanbanColumnId;
  readonly title: string;
  readonly order?: number;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface KanbanCard {
  readonly id: KanbanCardId;
  readonly columnId: KanbanColumnId;
  readonly title: string;
  readonly description?: string;
  readonly order?: number;
  readonly meta?: Readonly<Record<string, unknown>>;
}

// ─── State ───────────────────────────────────────────────────────

export type KanbanSelection =
  | { readonly kind: "none" }
  | { readonly kind: "card"; readonly cardId: KanbanCardId }
  | { readonly kind: "column"; readonly columnId: KanbanColumnId };

export type KanbanDrag =
  | { readonly kind: "idle" }
  | {
      readonly kind: "card";
      readonly cardId: KanbanCardId;
      readonly fromColumnId: KanbanColumnId;
      readonly overColumnId: KanbanColumnId | null;
      readonly overIndex: number | null;
    }
  | {
      readonly kind: "column";
      readonly columnId: KanbanColumnId;
      readonly overIndex: number | null;
    };

export interface KanbanState {
  readonly selection: KanbanSelection;
  readonly drag: KanbanDrag;
  readonly focusedCardId: KanbanCardId | null;
  readonly focusedColumnId: KanbanColumnId | null;
}

// ─── Callback payloads ───────────────────────────────────────────

export interface KanbanCardClickPayload<TCard extends KanbanCard = KanbanCard> {
  readonly card: TCard;
  readonly column: KanbanColumn;
  readonly nativeEvent: MouseEvent | KeyboardEvent;
}

export interface KanbanCardMovePayload<TCard extends KanbanCard = KanbanCard> {
  readonly card: TCard;
  readonly fromColumnId: KanbanColumnId;
  readonly fromIndex: number;
  readonly toColumnId: KanbanColumnId;
  readonly toIndex: number;
  readonly order: number;
}

export interface KanbanColumnMovePayload {
  readonly column: KanbanColumn;
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly order: number;
}

export interface KanbanDropPayload<TCard extends KanbanCard = KanbanCard> {
  readonly card: TCard;
  readonly fromColumnId: KanbanColumnId;
  readonly fromIndex: number;
  readonly toColumnId: KanbanColumnId;
  readonly toIndex: number;
}

export interface KanbanDropAcceptanceContext<TCard extends KanbanCard = KanbanCard> {
  readonly card: TCard;
  readonly fromColumnId: KanbanColumnId;
  readonly toColumnId: KanbanColumnId;
  readonly toIndex: number;
}

// ─── Localizable messages ────────────────────────────────────────

export interface KanbanMessages {
  readonly boardLabel?: string;
  readonly columnLabel?: (column: KanbanColumn, count: number) => string;
  readonly cardLabel?: (card: KanbanCard, column: KanbanColumn) => string;
  readonly emptyColumnLabel?: (column: KanbanColumn) => string;
  readonly pickupAnnouncement?: (
    card: KanbanCard,
    column: KanbanColumn,
    index: number,
    total: number,
  ) => string;
  readonly overAnnouncement?: (
    card: KanbanCard,
    column: KanbanColumn,
    index: number,
    total: number,
  ) => string;
  readonly dropAnnouncement?: (card: KanbanCard, column: KanbanColumn, index: number) => string;
  readonly cancelAnnouncement?: (card: KanbanCard, column: KanbanColumn, index: number) => string;
  readonly rejectAnnouncement?: (card: KanbanCard, column: KanbanColumn) => string;
  readonly columnPickupAnnouncement?: (
    column: KanbanColumn,
    index: number,
    total: number,
  ) => string;
  readonly columnOverAnnouncement?: (column: KanbanColumn, index: number, total: number) => string;
  readonly columnDropAnnouncement?: (column: KanbanColumn, index: number) => string;
  readonly columnCancelAnnouncement?: (column: KanbanColumn, index: number) => string;
}

// ─── Renderers ───────────────────────────────────────────────────

export type KanbanCardRenderer<TCard extends KanbanCard = KanbanCard> = (context: {
  readonly card: TCard;
  readonly column: KanbanColumn;
  readonly isSelected: boolean;
  readonly isDragging: boolean;
  readonly isKeyboardMoving: boolean;
}) => ReactNode;

export type KanbanColumnRenderer = (context: {
  readonly column: KanbanColumn;
  readonly index: number;
  readonly cardCount: number;
  readonly isSelected: boolean;
  readonly isDragging: boolean;
}) => ReactNode;

export type KanbanEmptyStateRenderer = (context: { readonly column: KanbanColumn }) => ReactNode;

// ─── Accessibility ───────────────────────────────────────────────

export interface KanbanAccessibilityProps {
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly "aria-describedby"?: string;
}

// ─── Root props ──────────────────────────────────────────────────

export interface KanbanRootProps<
  TCard extends KanbanCard = KanbanCard,
> extends KanbanAccessibilityProps {
  // ── Data
  readonly columns: readonly KanbanColumn[];
  readonly cards: readonly TCard[];

  // ── Selection / focus (controllable)
  readonly selection?: KanbanSelection;
  readonly defaultSelection?: KanbanSelection;
  readonly onSelectionChange?: (selection: KanbanSelection) => void;

  readonly focusedCardId?: KanbanCardId | null;
  readonly defaultFocusedCardId?: KanbanCardId | null;
  readonly onFocusedCardChange?: (id: KanbanCardId | null) => void;

  readonly focusedColumnId?: KanbanColumnId | null;
  readonly defaultFocusedColumnId?: KanbanColumnId | null;
  readonly onFocusedColumnChange?: (id: KanbanColumnId | null) => void;

  // ── Movement policy
  readonly cardDraggable?: boolean;
  readonly columnDraggable?: boolean;
  readonly cardDropBoundary?: "board" | "column" | "none";
  readonly columnDropBoundary?: "board" | "none";
  readonly dropAcceptance?: (context: KanbanDropAcceptanceContext<TCard>) => boolean;
  readonly dragDisabled?: boolean;
  readonly dragActivationDistance?: number;
  readonly dragActivationHoldMs?: number;

  // ── Virtualization
  readonly virtualizeCards?: boolean;
  readonly cardHeight?: number;
  readonly virtualizeColumns?: boolean;
  readonly columnWidth?: number;

  // ── Locale
  readonly locale?: string;
  readonly dir?: "ltr" | "rtl";
  readonly messages?: KanbanMessages;

  // ── Callbacks
  readonly onCardClick?: (payload: KanbanCardClickPayload<TCard>) => void;
  readonly onCardMove?: (payload: KanbanCardMovePayload<TCard>) => void | Promise<void>;
  readonly onColumnMove?: (payload: KanbanColumnMovePayload) => void | Promise<void>;
  readonly onDrop?: (payload: KanbanDropPayload<TCard>) => void;
  readonly onCardDelete?: (card: TCard) => void;

  // ── Rendering
  readonly renderCard?: KanbanCardRenderer<TCard>;
  readonly renderColumn?: KanbanColumnRenderer;
  readonly renderEmptyState?: KanbanEmptyStateRenderer;
  readonly children?: ReactNode;

  // ── DOM plumbing
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly id?: string;
}

// ─── Compound subcomponent props ─────────────────────────────────

export interface KanbanBoardProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface KanbanColumnProps {
  readonly columnId: KanbanColumnId;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface KanbanColumnHeaderProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface KanbanColumnBodyProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface KanbanColumnFooterProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface KanbanCardProps<TCard extends KanbanCard = KanbanCard> {
  readonly card: TCard;
  readonly index: number;
  readonly column: KanbanColumn;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface KanbanEmptyStateProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface KanbanCardTemplateProps<TCard extends KanbanCard = KanbanCard> {
  readonly render: KanbanCardRenderer<TCard>;
}

export interface KanbanDragPreviewProps<TCard extends KanbanCard = KanbanCard> {
  readonly render?: KanbanCardRenderer<TCard>;
}
