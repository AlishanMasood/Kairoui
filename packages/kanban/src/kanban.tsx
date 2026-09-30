import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useControllableState, useEventCallback } from "@kairoui/hooks";
import { KanbanContext, useKanban } from "./kanban-context";
import type { KanbanContextValue } from "./kanban-context";
import { DEFAULT_KANBAN_KEYMAP, type KanbanAction, resolveKanbanAction } from "./keymap";
import type {
  KanbanBoardProps,
  KanbanCard,
  KanbanCardId,
  KanbanCardProps,
  KanbanCardRenderer,
  KanbanCardTemplateProps,
  KanbanColumn,
  KanbanColumnBodyProps,
  KanbanColumnFooterProps,
  KanbanColumnHeaderProps,
  KanbanColumnId,
  KanbanColumnProps,
  KanbanDragPreviewProps,
  KanbanEmptyStateProps,
  KanbanRootProps,
  KanbanSelection,
} from "./kanban-types";
import { assertValidKanbanInput } from "./identity";
import { computeColumnOrder, orderAtIndex, partitionCardsByColumn } from "./ordering";
import {
  defaultBoardLabel,
  defaultCancelAnnouncement,
  defaultCardLabel,
  defaultColumnCancelAnnouncement,
  defaultColumnDropAnnouncement,
  defaultColumnLabel,
  defaultColumnOverAnnouncement,
  defaultColumnPickupAnnouncement,
  defaultDropAnnouncement,
  defaultEmptyColumnLabel,
  defaultOverAnnouncement,
  defaultPickupAnnouncement,
  defaultRejectAnnouncement,
} from "./kanban-messages";
import { useCardPointerDrag } from "./use-drag-card";

// ─── Constants ────────────────────────────────────────────────────

const DEFAULT_ACTIVATION_DISTANCE = 4;
const DEFAULT_HOLD_MS = 250;
const NONE_SELECTION: KanbanSelection = { kind: "none" };

// ─── Template registry (declarative renderer path) ────────────────

interface RendererRegistryValue<TCard extends KanbanCard = KanbanCard> {
  readonly register: (render: KanbanCardRenderer<TCard>) => () => void;
}

const RendererRegistryContext = createContext<RendererRegistryValue | null>(null);
RendererRegistryContext.displayName = "KanbanRendererRegistry";

// ─── Root ─────────────────────────────────────────────────────────

function KanbanRoot<TCard extends KanbanCard = KanbanCard>(
  props: KanbanRootProps<TCard>,
): ReactNode {
  const {
    columns: columnsProp,
    cards: cardsProp,
    selection: selectionProp,
    defaultSelection,
    onSelectionChange,
    focusedCardId: focusedCardIdProp,
    defaultFocusedCardId,
    onFocusedCardChange,
    focusedColumnId: focusedColumnIdProp,
    defaultFocusedColumnId,
    onFocusedColumnChange,
    cardDraggable = true,
    columnDraggable = true,
    cardDropBoundary = "board",
    columnDropBoundary = "board",
    dropAcceptance,
    dragDisabled = false,
    dragActivationDistance = DEFAULT_ACTIVATION_DISTANCE,
    dragActivationHoldMs = DEFAULT_HOLD_MS,
    virtualizeCards = false,
    cardHeight,
    virtualizeColumns = false,
    columnWidth,
    locale = "en",
    dir = "ltr",
    messages,
    onCardClick,
    onCardMove,
    onColumnMove,
    onDrop,
    onCardDelete,
    renderCard,
    renderColumn: _renderColumn,
    renderEmptyState,
    children,
    className,
    style,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
  } = props;
  void _renderColumn; // reserved for a future custom-column layout hook.

  // ── Input validation
  assertValidKanbanInput(columnsProp, cardsProp);
  const orderedColumns = useMemo(() => computeColumnOrder(columnsProp), [columnsProp]);
  const cardsByColumn = useMemo(
    () =>
      partitionCardsByColumn(
        cardsProp,
        orderedColumns.map((c) => c.id),
      ),
    [cardsProp, orderedColumns],
  );

  // ── State
  const generatedId = useId();
  const rootId = id ?? generatedId;

  const [selection, setSelectionInternal] = useControllableState<KanbanSelection>({
    value: selectionProp,
    defaultValue: defaultSelection ?? NONE_SELECTION,
    ...(onSelectionChange ? { onChange: onSelectionChange } : undefined),
    isEqual: kanbanSelectionEqual,
    name: "Kanban",
    state: "selection",
  });

  const [focusedCardId, setFocusedCardIdInternal] = useControllableState<KanbanCardId | null>({
    value: focusedCardIdProp,
    defaultValue: defaultFocusedCardId ?? null,
    ...(onFocusedCardChange ? { onChange: onFocusedCardChange } : undefined),
    name: "Kanban",
    state: "focusedCardId",
  });

  const [focusedColumnId, setFocusedColumnIdInternal] = useControllableState<KanbanColumnId | null>(
    {
      value: focusedColumnIdProp,
      defaultValue: defaultFocusedColumnId ?? null,
      ...(onFocusedColumnChange ? { onChange: onFocusedColumnChange } : undefined),
      name: "Kanban",
      state: "focusedColumnId",
    },
  );

  // Local drag state — never controllable per ADR.
  const [drag, setDrag] = useState<KanbanContextValue<TCard>["state"]["drag"]>({ kind: "idle" });

  // ── Renderer registry (fallback for <Kanban.CardTemplate>)
  const [registeredRenderer, setRegisteredRenderer] = useState<KanbanCardRenderer | null>(null);
  const registerRenderer = useCallback((render: KanbanCardRenderer<TCard>) => {
    setRegisteredRenderer(() => render as KanbanCardRenderer);
    return () => {
      setRegisteredRenderer(null);
    };
  }, []);
  const effectiveRenderCard: KanbanCardRenderer<TCard> | null =
    renderCard ?? (registeredRenderer as KanbanCardRenderer<TCard> | null) ?? null;

  // ── Announcer
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const announce = useCallback((message: string) => {
    const el = announcerRef.current;
    if (!el) return;
    el.textContent = "";
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        if (el.isConnected) el.textContent = message;
      });
    } else {
      el.textContent = message;
    }
  }, []);

  // ── Callbacks (stable)
  const onCardClickStable = useEventCallback(onCardClick ?? (() => undefined));
  const onCardMoveStable = useEventCallback(onCardMove ?? (() => undefined));
  const onColumnMoveStable = useEventCallback(onColumnMove ?? (() => undefined));
  const onDropStable = useEventCallback(onDrop ?? (() => undefined));
  const onCardDeleteStable = useEventCallback(onCardDelete ?? (() => undefined));

  const setSelection = useCallback(
    (next: KanbanSelection) => {
      setSelectionInternal(next);
    },
    [setSelectionInternal],
  );
  const setFocusedCardId = useCallback(
    (next: KanbanCardId | null) => {
      setFocusedCardIdInternal(next);
    },
    [setFocusedCardIdInternal],
  );
  const setFocusedColumnId = useCallback(
    (next: KanbanColumnId | null) => {
      setFocusedColumnIdInternal(next);
    },
    [setFocusedColumnIdInternal],
  );

  // ── Messages (memoized before callbacks that reference it)
  const mergedMessages = useMemo(
    () => ({
      boardLabel: messages?.boardLabel ?? defaultBoardLabel(),
      columnLabel: messages?.columnLabel ?? defaultColumnLabel,
      cardLabel: messages?.cardLabel ?? defaultCardLabel,
      emptyColumnLabel: messages?.emptyColumnLabel ?? defaultEmptyColumnLabel,
      pickupAnnouncement: messages?.pickupAnnouncement ?? defaultPickupAnnouncement,
      overAnnouncement: messages?.overAnnouncement ?? defaultOverAnnouncement,
      dropAnnouncement: messages?.dropAnnouncement ?? defaultDropAnnouncement,
      cancelAnnouncement: messages?.cancelAnnouncement ?? defaultCancelAnnouncement,
      rejectAnnouncement: messages?.rejectAnnouncement ?? defaultRejectAnnouncement,
      columnPickupAnnouncement:
        messages?.columnPickupAnnouncement ?? defaultColumnPickupAnnouncement,
      columnOverAnnouncement: messages?.columnOverAnnouncement ?? defaultColumnOverAnnouncement,
      columnDropAnnouncement: messages?.columnDropAnnouncement ?? defaultColumnDropAnnouncement,
      columnCancelAnnouncement:
        messages?.columnCancelAnnouncement ?? defaultColumnCancelAnnouncement,
    }),
    [messages],
  );

  // ── Move actions
  const moveCardTo = useCallback(
    ({
      cardId,
      toColumnId,
      toIndex,
    }: {
      readonly cardId: KanbanCardId;
      readonly toColumnId: KanbanColumnId;
      readonly toIndex: number;
    }) => {
      const card = cardsProp.find((c) => c.id === cardId);
      if (!card) return;
      const fromColumnId = card.columnId;
      const fromBucket = cardsByColumn.get(fromColumnId) ?? [];
      const toBucket = cardsByColumn.get(toColumnId) ?? [];
      const fromIndex = fromBucket.findIndex((c) => c.id === cardId);
      const targetBucket = toColumnId === fromColumnId ? fromBucket : toBucket;
      const insertIndex = Math.max(0, Math.min(targetBucket.length, toIndex));
      // Reject when consumer predicate refuses.
      if (dropAcceptance) {
        const ok = dropAcceptance({ card, fromColumnId, toColumnId, toIndex: insertIndex });
        if (!ok) {
          const col = orderedColumns.find((c) => c.id === toColumnId);
          if (col) {
            announce(mergedMessages.rejectAnnouncement(card, col));
          }
          return;
        }
      }
      const neighbors =
        toColumnId === fromColumnId ? targetBucket.filter((c) => c.id !== cardId) : targetBucket;
      const order = orderAtIndex(neighbors, insertIndex);
      void onCardMoveStable({
        card,
        fromColumnId,
        fromIndex,
        toColumnId,
        toIndex: insertIndex,
        order,
      });
      onDropStable({
        card,
        fromColumnId,
        fromIndex,
        toColumnId,
        toIndex: insertIndex,
      });
      const col = orderedColumns.find((c) => c.id === toColumnId);
      if (col) announce(mergedMessages.dropAnnouncement(card, col, insertIndex));
    },
    // messages ref stable; ordering deps captured below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cardsProp, cardsByColumn, dropAcceptance, orderedColumns, announce],
  );

  const moveColumnTo = useCallback(
    ({ columnId, toIndex }: { readonly columnId: KanbanColumnId; readonly toIndex: number }) => {
      const fromIndex = orderedColumns.findIndex((c) => c.id === columnId);
      const column = orderedColumns[fromIndex];
      if (!column) return;
      const clamped = Math.max(0, Math.min(orderedColumns.length - 1, toIndex));
      const neighbors = orderedColumns.filter((c) => c.id !== columnId);
      const order = orderAtIndex(neighbors, clamped);
      void onColumnMoveStable({ column, fromIndex, toIndex: clamped, order });
      announce(mergedMessages.columnDropAnnouncement(column, clamped));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderedColumns, announce],
  );

  // ── Drag lifecycle
  const beginCardDrag = useCallback(
    ({
      cardId,
      fromColumnId,
    }: {
      readonly cardId: KanbanCardId;
      readonly fromColumnId: KanbanColumnId;
    }) => {
      const card = cardsProp.find((c) => c.id === cardId);
      const column = orderedColumns.find((c) => c.id === fromColumnId);
      if (!card || !column) return;
      const bucket = cardsByColumn.get(fromColumnId) ?? [];
      const index = bucket.findIndex((c) => c.id === cardId);
      setDrag({
        kind: "card",
        cardId,
        fromColumnId,
        overColumnId: fromColumnId,
        overIndex: index,
      });
      announce(mergedMessages.pickupAnnouncement(card, column, index, bucket.length));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [announce, cardsByColumn, cardsProp, orderedColumns],
  );

  const updateCardDrag = useCallback(
    ({
      overColumnId,
      overIndex,
    }: {
      readonly overColumnId: KanbanColumnId | null;
      readonly overIndex: number | null;
    }) => {
      setDrag((prev) => {
        if (prev.kind !== "card") return prev;
        if (prev.overColumnId === overColumnId && prev.overIndex === overIndex) return prev;
        const nextState: typeof prev = {
          kind: "card",
          cardId: prev.cardId,
          fromColumnId: prev.fromColumnId,
          overColumnId,
          overIndex,
        };
        if (overColumnId !== null && overIndex !== null) {
          const card = cardsProp.find((c) => c.id === prev.cardId);
          const column = orderedColumns.find((c) => c.id === overColumnId);
          if (card && column) {
            const total = (cardsByColumn.get(overColumnId) ?? []).length;
            announce(mergedMessages.overAnnouncement(card, column, overIndex, total));
          }
        }
        return nextState;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [announce, cardsByColumn, cardsProp, orderedColumns],
  );

  const commitCardDrag = useCallback(() => {
    setDrag((prev) => {
      if (prev.kind !== "card") return prev;
      const { cardId, overColumnId, overIndex } = prev;
      if (overColumnId !== null && overIndex !== null) {
        moveCardTo({ cardId, toColumnId: overColumnId, toIndex: overIndex });
      }
      return { kind: "idle" };
    });
  }, [moveCardTo]);

  const cancelCardDrag = useCallback(() => {
    setDrag((prev) => {
      if (prev.kind !== "card") return prev;
      const card = cardsProp.find((c) => c.id === prev.cardId);
      const column = orderedColumns.find((c) => c.id === prev.fromColumnId);
      if (card && column) {
        const bucket = cardsByColumn.get(prev.fromColumnId) ?? [];
        const idx = bucket.findIndex((c) => c.id === prev.cardId);
        announce(mergedMessages.cancelAnnouncement(card, column, idx));
      }
      return { kind: "idle" };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announce, cardsByColumn, cardsProp, orderedColumns]);

  const beginColumnDrag = useCallback(
    (columnId: KanbanColumnId) => {
      const column = orderedColumns.find((c) => c.id === columnId);
      if (!column) return;
      const index = orderedColumns.findIndex((c) => c.id === columnId);
      setDrag({ kind: "column", columnId, overIndex: index });
      announce(mergedMessages.columnPickupAnnouncement(column, index, orderedColumns.length));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [announce, orderedColumns],
  );

  const updateColumnDrag = useCallback(
    (overIndex: number | null) => {
      setDrag((prev) => {
        if (prev.kind !== "column") return prev;
        if (prev.overIndex === overIndex) return prev;
        const nextState: typeof prev = { kind: "column", columnId: prev.columnId, overIndex };
        if (overIndex !== null) {
          const column = orderedColumns.find((c) => c.id === prev.columnId);
          if (column) {
            announce(
              mergedMessages.columnOverAnnouncement(column, overIndex, orderedColumns.length),
            );
          }
        }
        return nextState;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [announce, orderedColumns],
  );

  const commitColumnDrag = useCallback(() => {
    setDrag((prev) => {
      if (prev.kind !== "column") return prev;
      const { columnId, overIndex } = prev;
      if (overIndex !== null) {
        moveColumnTo({ columnId, toIndex: overIndex });
      }
      return { kind: "idle" };
    });
  }, [moveColumnTo]);

  const cancelColumnDrag = useCallback(() => {
    setDrag((prev) => {
      if (prev.kind !== "column") return prev;
      const column = orderedColumns.find((c) => c.id === prev.columnId);
      if (column) {
        const idx = orderedColumns.findIndex((c) => c.id === prev.columnId);
        announce(mergedMessages.columnCancelAnnouncement(column, idx));
      }
      return { kind: "idle" };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announce, orderedColumns]);

  const contextValue: KanbanContextValue = useMemo(
    () => ({
      state: {
        selection,
        drag,
        focusedCardId,
        focusedColumnId,
      },
      columns: orderedColumns,
      cards: cardsProp,
      cardsByColumn: cardsByColumn,
      cardDraggable,
      columnDraggable,
      cardDropBoundary,
      columnDropBoundary,
      dragDisabled,
      dragActivationDistance,
      dragActivationHoldMs,
      virtualizeCards,
      cardHeight: cardHeight ?? null,
      virtualizeColumns,
      columnWidth: columnWidth ?? null,
      locale,
      dir,
      messages: mergedMessages,
      keymap: DEFAULT_KANBAN_KEYMAP,
      rootId,
      dropAcceptance: (dropAcceptance ?? null) as KanbanContextValue["dropAcceptance"] | null,
      renderCard: effectiveRenderCard as unknown as KanbanCardRenderer | null,
      renderEmptyState: renderEmptyState ?? null,
      registerRenderer: registerRenderer as KanbanContextValue["registerRenderer"],
      setSelection,
      setFocusedCardId,
      setFocusedColumnId,
      moveCardTo,
      moveColumnTo,
      beginCardDrag,
      updateCardDrag,
      commitCardDrag,
      cancelCardDrag,
      beginColumnDrag,
      updateColumnDrag,
      commitColumnDrag,
      cancelColumnDrag,
      onCardClick:
        onCardClick !== undefined ? (onCardClickStable as KanbanContextValue["onCardClick"]) : null,
      onCardDelete:
        onCardDelete !== undefined
          ? (onCardDeleteStable as KanbanContextValue["onCardDelete"])
          : null,
      announce,
    }),
    [
      announce,
      beginCardDrag,
      beginColumnDrag,
      cancelCardDrag,
      cancelColumnDrag,
      cardDraggable,
      cardDropBoundary,
      cardHeight,
      cardsByColumn,
      cardsProp,
      columnDraggable,
      columnDropBoundary,
      columnWidth,
      commitCardDrag,
      commitColumnDrag,
      dir,
      drag,
      dragActivationDistance,
      dragActivationHoldMs,
      dragDisabled,
      dropAcceptance,
      effectiveRenderCard,
      focusedCardId,
      focusedColumnId,
      locale,
      mergedMessages,
      moveCardTo,
      moveColumnTo,
      onCardClick,
      onCardClickStable,
      onCardDelete,
      onCardDeleteStable,
      orderedColumns,
      registerRenderer,
      renderEmptyState,
      rootId,
      selection,
      setFocusedCardId,
      setFocusedColumnId,
      setSelection,
      updateCardDrag,
      updateColumnDrag,
      virtualizeCards,
      virtualizeColumns,
    ],
  );

  return (
    <KanbanContext.Provider value={contextValue}>
      <RendererRegistryContext.Provider
        value={{
          register: registerRenderer as RendererRegistryValue["register"],
        }}
      >
        <div
          id={rootId}
          className={joinClass("kui-kanban", className)}
          style={style}
          role="application"
          aria-roledescription="Kanban board"
          {...(ariaLabel !== undefined
            ? { "aria-label": ariaLabel }
            : ariaLabelledBy === undefined
              ? { "aria-label": mergedMessages.boardLabel }
              : {})}
          {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
          {...(ariaDescribedBy !== undefined ? { "aria-describedby": ariaDescribedBy } : {})}
          dir={dir}
          data-kanban-drag={drag.kind}
        >
          {children ?? <DefaultBoard />}
          <div
            ref={announcerRef}
            aria-live="polite"
            aria-atomic="true"
            className="kui-kanban__announcer"
            data-kanban-announcer=""
          />
        </div>
      </RendererRegistryContext.Provider>
    </KanbanContext.Provider>
  );
}

const nullFn = (): void => undefined;
void nullFn;

function kanbanSelectionEqual(a: KanbanSelection, b: KanbanSelection): boolean {
  if (a === b) return true;
  if (a.kind !== b.kind) return false;
  if (a.kind === "none") return true;
  if (a.kind === "card") {
    return b.kind === "card" && a.cardId === b.cardId;
  }
  return b.kind === "column" && a.columnId === b.columnId;
}

function joinClass(...parts: readonly (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function DefaultBoard(): ReactNode {
  const ctx = useKanban();
  return (
    <KanbanBoard>
      {ctx.columns.map((column) => (
        <KanbanColumnComponent key={column.id} columnId={column.id} />
      ))}
    </KanbanBoard>
  );
}

// ─── Board ────────────────────────────────────────────────────────

function KanbanBoard(props: KanbanBoardProps = {}): ReactNode {
  const ctx = useKanban();
  const { className, style, children } = props;
  return (
    <div
      role="list"
      aria-label={ctx.messages.boardLabel}
      className={joinClass("kui-kanban__board", className)}
      style={style}
      data-kanban-board=""
    >
      {children}
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────

const KanbanColumnContext = createContext<{
  readonly column: KanbanColumn;
  readonly index: number;
} | null>(null);
KanbanColumnContext.displayName = "KanbanColumnContext";

function useKanbanColumnContext(): { readonly column: KanbanColumn; readonly index: number } {
  const value = useContext(KanbanColumnContext);
  if (!value) throw new Error("Kanban.Column subcomponents must be used inside <Kanban.Column>");
  return value;
}

function KanbanColumnComponent(props: KanbanColumnProps): ReactNode {
  const ctx = useKanban();
  const { columnId, className, style, children } = props;
  const index = ctx.columns.findIndex((c) => c.id === columnId);
  const column = ctx.columns[index] ?? null;
  const cards = ctx.cardsByColumn.get(columnId) ?? [];
  const isDraggingThisColumn =
    ctx.state.drag.kind === "column" && ctx.state.drag.columnId === columnId;
  const isSelected =
    ctx.state.selection.kind === "column" && ctx.state.selection.columnId === columnId;

  const columnContext = useMemo(() => (column ? { column, index } : null), [column, index]);

  if (!column || !columnContext) return null;

  return (
    <KanbanColumnContext.Provider value={columnContext}>
      <div
        role="listitem"
        aria-label={ctx.messages.columnLabel(column, cards.length)}
        aria-posinset={index + 1}
        aria-setsize={ctx.columns.length}
        className={joinClass(
          "kui-kanban__column",
          isSelected && "kui-kanban__column--selected",
          isDraggingThisColumn && "kui-kanban__column--dragging",
          className,
        )}
        style={{
          ...(ctx.columnWidth !== null ? { width: `${String(ctx.columnWidth)}px` } : {}),
          ...style,
        }}
        data-kanban-column={columnId}
        data-kanban-column-index={index}
        data-kanban-grabbed={isDraggingThisColumn ? "" : undefined}
      >
        {children ?? (
          <>
            <KanbanColumnHeader />
            <KanbanColumnBody />
          </>
        )}
      </div>
    </KanbanColumnContext.Provider>
  );
}

function KanbanColumnHeader(props: KanbanColumnHeaderProps = {}): ReactNode {
  const ctx = useKanban();
  const { column, index } = useKanbanColumnContext();
  const cards = ctx.cardsByColumn.get(column.id) ?? [];
  const { className, style, children } = props;
  const canDragColumn =
    ctx.columnDraggable && !ctx.dragDisabled && column.meta?.["draggable"] !== false;

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!canDragColumn) return;
      const dragging = ctx.state.drag.kind === "column";
      const currentIndex = dragging ? (ctx.state.drag.overIndex ?? index) : index;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!dragging) {
          ctx.beginColumnDrag(column.id);
        } else {
          ctx.commitColumnDrag();
        }
      } else if (e.key === "Escape" && dragging) {
        e.preventDefault();
        ctx.cancelColumnDrag();
      } else if (dragging && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        const delta = e.key === "ArrowRight" ? 1 : -1;
        const rtlAdjusted = ctx.dir === "rtl" ? -delta : delta;
        const next = Math.max(0, Math.min(ctx.columns.length - 1, currentIndex + rtlAdjusted));
        ctx.updateColumnDrag(next);
      }
    },
    [canDragColumn, column.id, ctx, index],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ctx.messages.columnLabel(column, cards.length)}
      aria-pressed={ctx.state.drag.kind === "column" && ctx.state.drag.columnId === column.id}
      aria-disabled={!canDragColumn || undefined}
      className={joinClass("kui-kanban__column-header", className)}
      style={style}
      data-kanban-column-header={column.id}
      onKeyDown={onKeyDown}
      onFocus={() => {
        ctx.setFocusedColumnId(column.id);
      }}
    >
      {children ?? (
        <>
          <span className="kui-kanban__column-title">{column.title}</span>
          <span className="kui-kanban__column-count">{cards.length}</span>
        </>
      )}
    </div>
  );
}

function KanbanColumnBody(props: KanbanColumnBodyProps = {}): ReactNode {
  const ctx = useKanban();
  const { column } = useKanbanColumnContext();
  const cards = ctx.cardsByColumn.get(column.id) ?? [];
  const { className, style, children } = props;
  const isDragOverColumn =
    ctx.state.drag.kind === "card" && ctx.state.drag.overColumnId === column.id;

  const onPointerEnter = useCallback(() => {
    if (ctx.state.drag.kind !== "card") return;
    if (ctx.cardDropBoundary === "column" && ctx.state.drag.fromColumnId !== column.id) return;
    ctx.updateCardDrag({
      overColumnId: column.id,
      overIndex: ctx.state.drag.overIndex ?? cards.length,
    });
  }, [cards.length, column.id, ctx]);

  if (cards.length === 0) {
    return (
      <div
        role="list"
        aria-label={ctx.messages.emptyColumnLabel(column)}
        className={joinClass(
          "kui-kanban__column-body",
          "kui-kanban__column-body--empty",
          isDragOverColumn && "kui-kanban__column-body--drag-over",
          className,
        )}
        style={style}
        data-kanban-column-body={column.id}
        data-kanban-empty=""
        onPointerEnter={onPointerEnter}
      >
        {children ?? <DefaultEmptyState />}
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label={ctx.messages.columnLabel(column, cards.length)}
      className={joinClass(
        "kui-kanban__column-body",
        isDragOverColumn && "kui-kanban__column-body--drag-over",
        className,
      )}
      style={style}
      data-kanban-column-body={column.id}
      onPointerEnter={onPointerEnter}
    >
      {children ??
        cards.map((card, index) => (
          <KanbanCardComponent key={card.id} card={card} index={index} column={column} />
        ))}
    </div>
  );
}

function KanbanColumnFooter(props: KanbanColumnFooterProps = {}): ReactNode {
  const { className, style, children } = props;
  return (
    <div
      className={joinClass("kui-kanban__column-footer", className)}
      style={style}
      data-kanban-column-footer=""
    >
      {children}
    </div>
  );
}

function DefaultEmptyState(): ReactNode {
  const ctx = useKanban();
  const { column } = useKanbanColumnContext();
  const render = ctx.renderEmptyState;
  if (render) return <>{render({ column })}</>;
  return <span className="kui-kanban__empty">No cards</span>;
}

// ─── Card ─────────────────────────────────────────────────────────

function KanbanCardComponent<TCard extends KanbanCard = KanbanCard>(
  props: KanbanCardProps<TCard>,
): ReactNode {
  const ctx = useKanban<TCard>();
  const { card, index, column, className, style, children } = props;
  const isSelected = ctx.state.selection.kind === "card" && ctx.state.selection.cardId === card.id;
  const isDragging = ctx.state.drag.kind === "card" && ctx.state.drag.cardId === card.id;
  const isKeyboardMoving = isDragging;
  const isDraggableCard =
    ctx.cardDraggable && !ctx.dragDisabled && card.meta?.["draggable"] !== false;
  const cards = ctx.cardsByColumn.get(column.id) ?? [];

  const pointerRef = useRef<HTMLElement | null>(null);

  const pointer = useCardPointerDrag({
    enabled: isDraggableCard,
    activationDistance: ctx.dragActivationDistance,
    onBeginDrag: () => {
      ctx.beginCardDrag({ cardId: card.id, fromColumnId: card.columnId });
    },
    onPointerMove: (clientX, clientY) => {
      const target = document.elementFromPoint(clientX, clientY);
      if (!target) return;
      const columnEl = target.closest<HTMLElement>("[data-kanban-column-body]");
      if (!columnEl) return;
      const columnId = columnEl.dataset["kanbanColumnBody"];
      if (!columnId) return;
      if (ctx.cardDropBoundary === "column" && columnId !== card.columnId) return;
      const cardsInTarget = Array.from(
        columnEl.querySelectorAll<HTMLElement>("[data-kanban-card]"),
      );
      let insertIndex = cardsInTarget.length;
      for (let i = 0; i < cardsInTarget.length; i++) {
        const el = cardsInTarget[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (clientY < mid) {
          insertIndex = i;
          break;
        }
      }
      ctx.updateCardDrag({ overColumnId: columnId, overIndex: insertIndex });
    },
    onCommit: () => {
      ctx.commitCardDrag();
    },
    onCancel: () => {
      ctx.cancelCardDrag();
    },
  });

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      pointerRef.current = e.currentTarget;
      pointer.onPointerDown({
        clientX: e.clientX,
        clientY: e.clientY,
        pointerId: e.pointerId,
        button: e.button,
      });
    },
    [pointer],
  );

  const onClick = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      ctx.setSelection({ kind: "card", cardId: card.id });
      if (ctx.onCardClick) {
        ctx.onCardClick({ card, column, nativeEvent: e.nativeEvent });
      }
    },
    [card, column, ctx],
  );

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      const action = resolveKanbanAction(
        {
          key: e.key,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        },
        ctx.keymap,
      );
      handleCardKeyDown(action, e, card, column, ctx, index, cards.length);
    },
    [card, cards.length, column, ctx, index],
  );

  const onFocus = useCallback(() => {
    ctx.setFocusedCardId(card.id);
    ctx.setFocusedColumnId(card.columnId);
  }, [card.columnId, card.id, ctx]);

  const render = ctx.renderCard;
  const content = render ? (
    render({ card, column, isSelected, isDragging, isKeyboardMoving })
  ) : (
    <div className="kui-kanban__card-default">
      <div className="kui-kanban__card-title">{card.title}</div>
      {card.description !== undefined ? (
        <div className="kui-kanban__card-description">{card.description}</div>
      ) : null}
    </div>
  );

  return (
    <div
      role="listitem"
      aria-posinset={index + 1}
      aria-setsize={cards.length}
      className="kui-kanban__card-slot"
      data-kanban-card-slot={card.id}
    >
      <button
        type="button"
        aria-roledescription="Card"
        aria-label={ctx.messages.cardLabel(card, column)}
        aria-pressed={isSelected}
        aria-disabled={!isDraggableCard || undefined}
        className={joinClass(
          "kui-kanban__card",
          isSelected && "kui-kanban__card--selected",
          isDragging && "kui-kanban__card--dragging",
          !isDraggableCard && "kui-kanban__card--disabled",
          className,
        )}
        style={{
          ...(ctx.cardHeight !== null ? { height: `${String(ctx.cardHeight)}px` } : {}),
          ...style,
        }}
        onPointerDown={onPointerDown}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        tabIndex={0}
        data-kanban-card={card.id}
        data-kanban-card-index={index}
        data-selected={isSelected ? "" : undefined}
        data-dragging={isDragging ? "" : undefined}
      >
        {children ?? content}
      </button>
    </div>
  );
}

function handleCardKeyDown<TCard extends KanbanCard>(
  action: KanbanAction | null,
  e: ReactKeyboardEvent<HTMLButtonElement>,
  card: TCard,
  column: KanbanColumn,
  ctx: KanbanContextValue<TCard>,
  index: number,
  columnCount: number,
): void {
  const drag = ctx.state.drag;
  const isCardDrag = drag.kind === "card" && drag.cardId === card.id;

  // Space is dual-role: activate on tap, pickup on keydown+drag mode.
  if (e.key === " " && !isCardDrag) {
    e.preventDefault();
    ctx.beginCardDrag({ cardId: card.id, fromColumnId: card.columnId });
    return;
  }

  if (drag.kind === "card" && drag.cardId === card.id) {
    if (e.key === " ") {
      e.preventDefault();
      ctx.commitCardDrag();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      ctx.cancelCardDrag();
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const current = drag.overIndex ?? index;
      const overColumnId = drag.overColumnId ?? column.id;
      const bucket = ctx.cardsByColumn.get(overColumnId) ?? [];
      const total = bucket.length;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const next = Math.max(0, Math.min(total, current + delta));
      ctx.updateCardDrag({ overColumnId, overIndex: next });
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (ctx.cardDropBoundary === "column") return;
      const currentColumnId = drag.overColumnId ?? column.id;
      const idx = ctx.columns.findIndex((c) => c.id === currentColumnId);
      const delta = e.key === "ArrowRight" ? 1 : -1;
      const rtlAdjusted = ctx.dir === "rtl" ? -delta : delta;
      const nextIdx = Math.max(0, Math.min(ctx.columns.length - 1, idx + rtlAdjusted));
      const nextColumn = ctx.columns[nextIdx];
      if (!nextColumn) return;
      const nextBucket = ctx.cardsByColumn.get(nextColumn.id) ?? [];
      ctx.updateCardDrag({
        overColumnId: nextColumn.id,
        overIndex: Math.min(drag.overIndex ?? 0, nextBucket.length),
      });
      return;
    }
  }

  if (!action) return;
  switch (action) {
    case "activate":
      e.preventDefault();
      if (ctx.onCardClick) {
        ctx.onCardClick({ card, column, nativeEvent: e.nativeEvent });
      }
      return;
    case "cancel":
      e.preventDefault();
      ctx.setSelection({ kind: "none" });
      return;
    case "delete":
      e.preventDefault();
      if (ctx.onCardDelete) ctx.onCardDelete(card);
      return;
    case "moveFocusUp": {
      e.preventDefault();
      const target = document.querySelector<HTMLElement>(
        `[data-kanban-column-body="${column.id}"] [data-kanban-card-index="${String(Math.max(0, index - 1))}"]`,
      );
      target?.focus();
      return;
    }
    case "moveFocusDown": {
      e.preventDefault();
      const target = document.querySelector<HTMLElement>(
        `[data-kanban-column-body="${column.id}"] [data-kanban-card-index="${String(Math.min(columnCount - 1, index + 1))}"]`,
      );
      target?.focus();
      return;
    }
    case "moveFocusLeft":
    case "moveFocusRight": {
      e.preventDefault();
      const idx = ctx.columns.findIndex((c) => c.id === column.id);
      const delta = action === "moveFocusRight" ? 1 : -1;
      const rtlAdjusted = ctx.dir === "rtl" ? -delta : delta;
      const nextIdx = Math.max(0, Math.min(ctx.columns.length - 1, idx + rtlAdjusted));
      const nextColumn = ctx.columns[nextIdx];
      if (!nextColumn) return;
      const nextBucket = ctx.cardsByColumn.get(nextColumn.id) ?? [];
      const targetIndex = Math.min(index, nextBucket.length - 1);
      const target = document.querySelector<HTMLElement>(
        `[data-kanban-column-body="${nextColumn.id}"] [data-kanban-card-index="${String(Math.max(0, targetIndex))}"]`,
      );
      target?.focus();
      return;
    }
    case "moveFocusHome": {
      e.preventDefault();
      const target = document.querySelector<HTMLElement>(
        `[data-kanban-column-body="${column.id}"] [data-kanban-card-index="0"]`,
      );
      target?.focus();
      return;
    }
    case "moveFocusEnd": {
      e.preventDefault();
      const target = document.querySelector<HTMLElement>(
        `[data-kanban-column-body="${column.id}"] [data-kanban-card-index="${String(columnCount - 1)}"]`,
      );
      target?.focus();
      return;
    }
    case "moveFocusBoardHome": {
      e.preventDefault();
      const first = ctx.columns[0];
      if (!first) return;
      const target = document.querySelector<HTMLElement>(
        `[data-kanban-column-body="${first.id}"] [data-kanban-card-index="0"]`,
      );
      target?.focus();
      return;
    }
    case "moveFocusBoardEnd": {
      e.preventDefault();
      const last = ctx.columns[ctx.columns.length - 1];
      if (!last) return;
      const bucket = ctx.cardsByColumn.get(last.id) ?? [];
      const target = document.querySelector<HTMLElement>(
        `[data-kanban-column-body="${last.id}"] [data-kanban-card-index="${String(Math.max(0, bucket.length - 1))}"]`,
      );
      target?.focus();
      return;
    }
    case "pickup":
    case "commit":
      // Handled by Space dual-role branch above.
      return;
    default:
      return;
  }
}

// ─── EmptyState / CardTemplate / DragPreview ─────────────────────

function KanbanEmptyState(props: KanbanEmptyStateProps = {}): ReactNode {
  const { className, style, children } = props;
  return (
    <div
      className={joinClass("kui-kanban__empty-state", className)}
      style={style}
      data-kanban-empty-state=""
    >
      {children}
    </div>
  );
}

function KanbanCardTemplate<TCard extends KanbanCard = KanbanCard>(
  props: KanbanCardTemplateProps<TCard>,
): ReactNode {
  const registry = useContext(RendererRegistryContext);
  const { render } = props;
  useEffect(() => {
    if (!registry) return;
    return registry.register(render as unknown as KanbanCardRenderer);
  }, [registry, render]);
  return null;
}

function KanbanDragPreview<TCard extends KanbanCard = KanbanCard>(
  props: KanbanDragPreviewProps<TCard>,
): ReactNode {
  void props;
  return null;
}

// ─── Compound component ──────────────────────────────────────────

interface KanbanCompound {
  <TCard extends KanbanCard = KanbanCard>(props: KanbanRootProps<TCard>): ReactNode;
  readonly displayName?: string;
  readonly Root: typeof KanbanRoot;
  readonly Board: typeof KanbanBoard;
  readonly Column: typeof KanbanColumnComponent;
  readonly ColumnHeader: typeof KanbanColumnHeader;
  readonly ColumnBody: typeof KanbanColumnBody;
  readonly ColumnFooter: typeof KanbanColumnFooter;
  readonly Card: typeof KanbanCardComponent;
  readonly CardTemplate: typeof KanbanCardTemplate;
  readonly EmptyState: typeof KanbanEmptyState;
  readonly DragPreview: typeof KanbanDragPreview;
}

const KanbanImpl = KanbanRoot as unknown as KanbanCompound & { displayName: string };
Object.assign(KanbanImpl, {
  Root: KanbanRoot,
  Board: KanbanBoard,
  Column: KanbanColumnComponent,
  ColumnHeader: KanbanColumnHeader,
  ColumnBody: KanbanColumnBody,
  ColumnFooter: KanbanColumnFooter,
  Card: KanbanCardComponent,
  CardTemplate: KanbanCardTemplate,
  EmptyState: KanbanEmptyState,
  DragPreview: KanbanDragPreview,
});
KanbanImpl.displayName = "Kanban";

export const Kanban: KanbanCompound = KanbanImpl;

export {
  KanbanRoot,
  KanbanBoard,
  KanbanColumnComponent as KanbanColumn,
  KanbanColumnHeader,
  KanbanColumnBody,
  KanbanColumnFooter,
  KanbanCardComponent as KanbanCard,
  KanbanCardTemplate,
  KanbanEmptyState,
  KanbanDragPreview,
};
