import { describe, expect, it } from "vitest";
import {
  computeCardOrder,
  computeColumnOrder,
  nextOrderBetween,
  orderAtIndex,
  partitionCardsByColumn,
} from "./ordering";
import type { KanbanCard, KanbanColumn } from "./kanban-types";

describe("computeColumnOrder", () => {
  it("returns input order when any column lacks an order", () => {
    const cols: readonly KanbanColumn[] = [
      { id: "b", title: "B" },
      { id: "a", title: "A", order: 0 },
    ];
    expect(computeColumnOrder(cols).map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("sorts ascending by order when every column has one", () => {
    const cols: readonly KanbanColumn[] = [
      { id: "b", title: "B", order: 2 },
      { id: "a", title: "A", order: 1 },
      { id: "c", title: "C", order: 3 },
    ];
    expect(computeColumnOrder(cols).map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("breaks ties on order by id ascending", () => {
    const cols: readonly KanbanColumn[] = [
      { id: "b", title: "B", order: 1 },
      { id: "a", title: "A", order: 1 },
    ];
    expect(computeColumnOrder(cols).map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("returns the same empty array when input is empty", () => {
    expect(computeColumnOrder([])).toEqual([]);
  });
});

describe("computeCardOrder", () => {
  it("preserves input order within a column when any card lacks an order", () => {
    const cards: readonly KanbanCard[] = [
      { id: "b", columnId: "c1", title: "B" },
      { id: "a", columnId: "c1", title: "A", order: 0 },
    ];
    expect(computeCardOrder(cards).map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("sorts ascending by order per column when every card has one", () => {
    const cards: readonly KanbanCard[] = [
      { id: "a", columnId: "c1", title: "A", order: 2 },
      { id: "b", columnId: "c2", title: "B", order: 1 },
      { id: "c", columnId: "c1", title: "C", order: 1 },
    ];
    const ordered = computeCardOrder(cards).map((c) => c.id);
    // Within c1: [c, a] (order 1, 2). c2 order preserved as-is: [b].
    // Input column order (c1 first) preserved.
    expect(ordered).toEqual(["c", "a", "b"]);
  });

  it("preserves input column order when partitioning", () => {
    const cards: readonly KanbanCard[] = [
      { id: "a", columnId: "c2", title: "A" },
      { id: "b", columnId: "c1", title: "B" },
      { id: "c", columnId: "c2", title: "C" },
    ];
    expect(computeCardOrder(cards).map((c) => c.id)).toEqual(["a", "c", "b"]);
  });
});

describe("partitionCardsByColumn", () => {
  it("returns a bucket per column id", () => {
    const cards: readonly KanbanCard[] = [
      { id: "a", columnId: "c1", title: "A" },
      { id: "b", columnId: "c2", title: "B" },
      { id: "c", columnId: "c1", title: "C" },
    ];
    const map = partitionCardsByColumn(cards, ["c1", "c2", "c3"]);
    expect(Array.from(map.keys())).toEqual(["c1", "c2", "c3"]);
    expect(map.get("c1")?.map((c) => c.id)).toEqual(["a", "c"]);
    expect(map.get("c2")?.map((c) => c.id)).toEqual(["b"]);
    expect(map.get("c3")).toEqual([]);
  });

  it("drops cards whose columnId is not in the columns list", () => {
    const cards: readonly KanbanCard[] = [
      { id: "a", columnId: "unknown", title: "A" },
      { id: "b", columnId: "c1", title: "B" },
    ];
    const map = partitionCardsByColumn(cards, ["c1"]);
    expect(map.get("c1")?.map((c) => c.id)).toEqual(["b"]);
  });
});

describe("nextOrderBetween", () => {
  it("returns 0 for null / null", () => {
    expect(nextOrderBetween(null, null)).toBe(0);
  });

  it("returns after - 1 when before is null", () => {
    expect(nextOrderBetween(null, 5)).toBe(4);
  });

  it("returns before + 1 when after is null", () => {
    expect(nextOrderBetween(5, null)).toBe(6);
  });

  it("returns the midpoint when both are provided", () => {
    expect(nextOrderBetween(2, 4)).toBe(3);
    expect(nextOrderBetween(0, 1)).toBe(0.5);
  });

  it("throws when before >= after", () => {
    expect(() => nextOrderBetween(5, 5)).toThrow(RangeError);
    expect(() => nextOrderBetween(5, 3)).toThrow(RangeError);
  });
});

describe("orderAtIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(orderAtIndex([], 0)).toBe(0);
  });

  it("returns the midpoint between neighbors", () => {
    expect(orderAtIndex([{ order: 0 }, { order: 2 }], 1)).toBe(1);
  });

  it("returns tail order + 1 at end", () => {
    expect(orderAtIndex([{ order: 3 }], 1)).toBe(4);
  });

  it("returns head order - 1 at start", () => {
    expect(orderAtIndex([{ order: 3 }], 0)).toBe(2);
  });

  it("clamps out-of-range indices", () => {
    expect(orderAtIndex([{ order: 1 }], -5)).toBe(0);
    expect(orderAtIndex([{ order: 1 }], 100)).toBe(2);
  });

  it("handles a corrupted ordering (before >= after) by returning before + 1", () => {
    expect(orderAtIndex([{ order: 5 }, { order: 5 }], 1)).toBe(6);
  });
});
