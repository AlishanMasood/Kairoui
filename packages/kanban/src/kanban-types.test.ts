import { describe, expectTypeOf, it } from "vitest";
import type {
  KanbanCard,
  KanbanCardClickPayload,
  KanbanCardMovePayload,
  KanbanCardRenderer,
  KanbanColumn,
  KanbanColumnMovePayload,
  KanbanDrag,
  KanbanDropPayload,
  KanbanRootProps,
  KanbanSelection,
  KanbanState,
} from "./kanban-types";

describe("Data shape", () => {
  it("KanbanColumn requires id + title, order + meta optional", () => {
    const c: KanbanColumn = { id: "c1", title: "Todo" };
    expectTypeOf(c).toEqualTypeOf<KanbanColumn>();
  });

  it("KanbanCard requires id + columnId + title", () => {
    const c: KanbanCard = { id: "a", columnId: "c1", title: "Task" };
    expectTypeOf(c).toEqualTypeOf<KanbanCard>();
  });
});

describe("State model", () => {
  it("KanbanSelection is a discriminated union of none/card/column", () => {
    const s: KanbanSelection[] = [
      { kind: "none" },
      { kind: "card", cardId: "a" },
      { kind: "column", columnId: "c1" },
    ];
    expectTypeOf(s[0]!.kind).toEqualTypeOf<"none" | "card" | "column">();
  });

  it("KanbanDrag is a discriminated union of idle/card/column", () => {
    const d: KanbanDrag[] = [
      { kind: "idle" },
      { kind: "card", cardId: "a", fromColumnId: "c1", overColumnId: null, overIndex: null },
      { kind: "column", columnId: "c1", overIndex: null },
    ];
    expectTypeOf(d[0]!.kind).toEqualTypeOf<"idle" | "card" | "column">();
  });

  it("KanbanState carries selection/drag/focus slices", () => {
    const s: KanbanState = {
      selection: { kind: "none" },
      drag: { kind: "idle" },
      focusedCardId: null,
      focusedColumnId: null,
    };
    expectTypeOf(s.focusedCardId).toEqualTypeOf<string | null>();
  });
});

describe("Callback payloads propagate the concrete card type", () => {
  interface TaskCard extends KanbanCard {
    readonly priority: "low" | "med" | "high";
  }

  it("KanbanCardClickPayload<TCard> preserves TCard", () => {
    const p: KanbanCardClickPayload<TaskCard> = {
      card: {
        id: "a",
        columnId: "c1",
        title: "Task",
        priority: "high",
      },
      column: { id: "c1", title: "Todo" },
      nativeEvent: new MouseEvent("click"),
    };
    expectTypeOf(p.card.priority).toEqualTypeOf<"low" | "med" | "high">();
  });

  it("KanbanCardMovePayload includes order and toIndex", () => {
    const p: KanbanCardMovePayload = {
      card: { id: "a", columnId: "c1", title: "T" },
      fromColumnId: "c1",
      fromIndex: 0,
      toColumnId: "c2",
      toIndex: 1,
      order: 1.5,
    };
    expectTypeOf(p.order).toBeNumber();
  });

  it("KanbanColumnMovePayload includes order + fromIndex/toIndex", () => {
    const p: KanbanColumnMovePayload = {
      column: { id: "c1", title: "Todo" },
      fromIndex: 0,
      toIndex: 2,
      order: 2.5,
    };
    expectTypeOf(p.column.title).toBeString();
  });

  it("KanbanDropPayload<TCard> preserves TCard", () => {
    const p: KanbanDropPayload<TaskCard> = {
      card: {
        id: "a",
        columnId: "c1",
        title: "T",
        priority: "low",
      },
      fromColumnId: "c1",
      fromIndex: 0,
      toColumnId: "c1",
      toIndex: 0,
    };
    expectTypeOf(p.card.priority).toBeString();
  });
});

describe("KanbanRootProps", () => {
  it("only requires columns + cards; every other field is optional", () => {
    const minimal: KanbanRootProps = { columns: [], cards: [] };
    expectTypeOf(minimal).toExtend<KanbanRootProps>();
  });

  it("carries renderCard as KanbanCardRenderer<TCard>", () => {
    interface CardV extends KanbanCard {
      readonly priority: string;
    }
    const props: KanbanRootProps<CardV> = {
      columns: [],
      cards: [],
      renderCard: ({ card }) => card.priority,
    };
    expectTypeOf(props.renderCard).toEqualTypeOf<KanbanCardRenderer<CardV> | undefined>();
  });
});
