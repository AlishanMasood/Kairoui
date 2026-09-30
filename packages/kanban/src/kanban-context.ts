import { createContext, useContext } from "react";
import type {
  KanbanCard,
  KanbanCardId,
  KanbanCardRenderer,
  KanbanColumn,
  KanbanColumnId,
  KanbanDropAcceptanceContext,
  KanbanEmptyStateRenderer,
  KanbanSelection,
  KanbanState,
} from "./kanban-types";
import type { KanbanKeymap } from "./keymap";

/** Context surface shared by every Kanban subcomponent. */
export interface KanbanContextValue<TCard extends KanbanCard = KanbanCard> {
  readonly state: KanbanState;
  readonly columns: readonly KanbanColumn[];
  readonly cards: readonly TCard[];
  readonly cardsByColumn: ReadonlyMap<KanbanColumnId, readonly TCard[]>;

  // ── Config
  readonly cardDraggable: boolean;
  readonly columnDraggable: boolean;
  readonly cardDropBoundary: "board" | "column" | "none";
  readonly columnDropBoundary: "board" | "none";
  readonly dragDisabled: boolean;
  readonly dragActivationDistance: number;
  readonly dragActivationHoldMs: number;
  readonly virtualizeCards: boolean;
  readonly cardHeight: number | null;
  readonly virtualizeColumns: boolean;
  readonly columnWidth: number | null;
  readonly locale: string;
  readonly dir: "ltr" | "rtl";
  readonly messages: Required<{
    readonly boardLabel: string;
    readonly columnLabel: (column: KanbanColumn, count: number) => string;
    readonly cardLabel: (card: KanbanCard, column: KanbanColumn) => string;
    readonly emptyColumnLabel: (column: KanbanColumn) => string;
    readonly pickupAnnouncement: (
      card: KanbanCard,
      column: KanbanColumn,
      index: number,
      total: number,
    ) => string;
    readonly overAnnouncement: (
      card: KanbanCard,
      column: KanbanColumn,
      index: number,
      total: number,
    ) => string;
    readonly dropAnnouncement: (card: KanbanCard, column: KanbanColumn, index: number) => string;
    readonly cancelAnnouncement: (card: KanbanCard, column: KanbanColumn, index: number) => string;
    readonly rejectAnnouncement: (card: KanbanCard, column: KanbanColumn) => string;
    readonly columnPickupAnnouncement: (
      column: KanbanColumn,
      index: number,
      total: number,
    ) => string;
    readonly columnOverAnnouncement: (column: KanbanColumn, index: number, total: number) => string;
    readonly columnDropAnnouncement: (column: KanbanColumn, index: number) => string;
    readonly columnCancelAnnouncement: (column: KanbanColumn, index: number) => string;
  }>;
  readonly keymap: KanbanKeymap;
  readonly rootId: string;
  readonly dropAcceptance: ((context: KanbanDropAcceptanceContext) => boolean) | null;

  // ── Renderers
  readonly renderCard: KanbanCardRenderer<TCard> | null;
  readonly renderEmptyState: KanbanEmptyStateRenderer | null;
  readonly registerRenderer: (render: KanbanCardRenderer<TCard>) => () => void;

  // ── Dispatch
  readonly setSelection: (selection: KanbanSelection) => void;
  readonly setFocusedCardId: (id: KanbanCardId | null) => void;
  readonly setFocusedColumnId: (id: KanbanColumnId | null) => void;
  readonly moveCardTo: (params: {
    readonly cardId: KanbanCardId;
    readonly toColumnId: KanbanColumnId;
    readonly toIndex: number;
  }) => void;
  readonly moveColumnTo: (params: {
    readonly columnId: KanbanColumnId;
    readonly toIndex: number;
  }) => void;
  readonly beginCardDrag: (params: {
    readonly cardId: KanbanCardId;
    readonly fromColumnId: KanbanColumnId;
  }) => void;
  readonly updateCardDrag: (params: {
    readonly overColumnId: KanbanColumnId | null;
    readonly overIndex: number | null;
  }) => void;
  readonly commitCardDrag: () => void;
  readonly cancelCardDrag: () => void;
  readonly beginColumnDrag: (columnId: KanbanColumnId) => void;
  readonly updateColumnDrag: (overIndex: number | null) => void;
  readonly commitColumnDrag: () => void;
  readonly cancelColumnDrag: () => void;

  // ── Callbacks
  readonly onCardClick:
    | ((payload: {
        readonly card: TCard;
        readonly column: KanbanColumn;
        readonly nativeEvent: MouseEvent | KeyboardEvent;
      }) => void)
    | null;
  readonly onCardDelete: ((card: TCard) => void) | null;

  // ── DOM plumbing
  readonly announce: (message: string) => void;
}

// Cast erases the generic — every consumer of `useKanban`
// re-casts to their concrete card type.
const KanbanContext = createContext<KanbanContextValue | null>(null);
KanbanContext.displayName = "KanbanContext";

export { KanbanContext };

/**
 * Read the current Kanban context. Throws when used outside
 * `<Kanban>`. Generic parameter selects the card type; the runtime
 * shape is identical.
 */
export function useKanban<TCard extends KanbanCard = KanbanCard>(): KanbanContextValue<TCard> {
  const ctx = useContext(KanbanContext);
  if (!ctx) {
    throw new Error("useKanban must be used inside <Kanban>");
  }
  return ctx as unknown as KanbanContextValue<TCard>;
}
