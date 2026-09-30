import { describe, expect, it } from "vitest";
import { assertValidKanbanCard, assertValidKanbanColumn, assertValidKanbanInput } from "./identity";
import type { KanbanCard, KanbanColumn } from "./kanban-types";

describe("assertValidKanbanColumn", () => {
  it("accepts a valid column", () => {
    expect(() => {
      assertValidKanbanColumn({ id: "c1", title: "Todo" });
    }).not.toThrow();
  });

  it("rejects a non-string id", () => {
    expect(() => {
      assertValidKanbanColumn({ id: "", title: "Todo" });
    }).toThrow(TypeError);
    expect(() => {
      assertValidKanbanColumn({ id: 1 as unknown as string, title: "Todo" });
    }).toThrow(TypeError);
  });

  it("rejects a non-string title", () => {
    expect(() => {
      assertValidKanbanColumn({ id: "c1", title: 42 as unknown as string });
    }).toThrow(TypeError);
  });

  it("rejects a non-finite order", () => {
    expect(() => {
      assertValidKanbanColumn({ id: "c1", title: "Todo", order: Number.NaN });
    }).toThrow(TypeError);
  });

  it("accepts a finite integer order", () => {
    expect(() => {
      assertValidKanbanColumn({ id: "c1", title: "Todo", order: 1.5 });
    }).not.toThrow();
  });
});

describe("assertValidKanbanCard", () => {
  it("accepts a valid card", () => {
    expect(() => {
      assertValidKanbanCard({ id: "a", columnId: "c1", title: "Task" });
    }).not.toThrow();
  });

  it("rejects an empty id", () => {
    expect(() => {
      assertValidKanbanCard({ id: "", columnId: "c1", title: "Task" });
    }).toThrow(TypeError);
  });

  it("rejects an empty columnId", () => {
    expect(() => {
      assertValidKanbanCard({ id: "a", columnId: "", title: "Task" });
    }).toThrow(TypeError);
  });

  it("rejects a non-string title", () => {
    expect(() => {
      assertValidKanbanCard({ id: "a", columnId: "c1", title: 1 as unknown as string });
    }).toThrow(TypeError);
  });
});

describe("assertValidKanbanInput", () => {
  const cols: readonly KanbanColumn[] = [
    { id: "c1", title: "Todo" },
    { id: "c2", title: "Doing" },
  ];

  it("accepts a well-formed input", () => {
    const cards: readonly KanbanCard[] = [
      { id: "a", columnId: "c1", title: "A" },
      { id: "b", columnId: "c2", title: "B" },
    ];
    expect(() => {
      assertValidKanbanInput(cols, cards);
    }).not.toThrow();
  });

  it("rejects duplicate column ids", () => {
    const dup: readonly KanbanColumn[] = [
      { id: "c1", title: "Todo" },
      { id: "c1", title: "Other" },
    ];
    expect(() => {
      assertValidKanbanInput(dup, []);
    }).toThrow(RangeError);
  });

  it("rejects duplicate card ids", () => {
    const cards: readonly KanbanCard[] = [
      { id: "a", columnId: "c1", title: "A" },
      { id: "a", columnId: "c2", title: "A2" },
    ];
    expect(() => {
      assertValidKanbanInput(cols, cards);
    }).toThrow(RangeError);
  });

  it("rejects cards referencing unknown columns", () => {
    const cards: readonly KanbanCard[] = [{ id: "a", columnId: "ghost", title: "A" }];
    expect(() => {
      assertValidKanbanInput(cols, cards);
    }).toThrow(RangeError);
  });

  it("accepts empty inputs", () => {
    expect(() => {
      assertValidKanbanInput([], []);
    }).not.toThrow();
  });
});
