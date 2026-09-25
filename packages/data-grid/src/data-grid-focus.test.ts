import { describe, it, expect } from "vitest";
import {
  EMPTY_FOCUS_STATE,
  blurFocus,
  focusCell,
  locateFocus,
  moveFocus,
  pageFocus,
} from "./data-grid-focus";
import type { FocusLayout } from "./data-grid-focus";

const layout: FocusLayout = {
  rowIds: ["r1", "r2", "r3"],
  columnIds: ["a", "b", "c"],
};

describe("locateFocus", () => {
  it("returns null when focus is unset", () => {
    expect(locateFocus(EMPTY_FOCUS_STATE, layout)).toBeNull();
  });

  it("returns null when the focused cell is not in the layout", () => {
    expect(locateFocus({ rowId: "mystery", columnId: "a" }, layout)).toBeNull();
  });

  it("returns the row and column indices when in layout", () => {
    expect(locateFocus({ rowId: "r2", columnId: "b" }, layout)).toEqual({ row: 1, column: 1 });
  });
});

describe("moveFocus — seeding from empty", () => {
  it("seeds to first cell on 'down'", () => {
    expect(moveFocus(EMPTY_FOCUS_STATE, layout, "down")).toEqual({ rowId: "r1", columnId: "a" });
  });

  it("seeds to first cell on 'right'", () => {
    expect(moveFocus(EMPTY_FOCUS_STATE, layout, "right")).toEqual({ rowId: "r1", columnId: "a" });
  });

  it("seeds to first cell on 'gridStart'", () => {
    expect(moveFocus(EMPTY_FOCUS_STATE, layout, "gridStart")).toEqual({
      rowId: "r1",
      columnId: "a",
    });
  });

  it("is a no-op for other directions when unfocused", () => {
    expect(moveFocus(EMPTY_FOCUS_STATE, layout, "up")).toBe(EMPTY_FOCUS_STATE);
    expect(moveFocus(EMPTY_FOCUS_STATE, layout, "left")).toBe(EMPTY_FOCUS_STATE);
    expect(moveFocus(EMPTY_FOCUS_STATE, layout, "rowStart")).toBe(EMPTY_FOCUS_STATE);
  });
});

describe("moveFocus — cardinal directions", () => {
  const start = { rowId: "r2", columnId: "b" };

  it("left decrements column", () => {
    expect(moveFocus(start, layout, "left")).toEqual({ rowId: "r2", columnId: "a" });
  });

  it("right increments column", () => {
    expect(moveFocus(start, layout, "right")).toEqual({ rowId: "r2", columnId: "c" });
  });

  it("up decrements row", () => {
    expect(moveFocus(start, layout, "up")).toEqual({ rowId: "r1", columnId: "b" });
  });

  it("down increments row", () => {
    expect(moveFocus(start, layout, "down")).toEqual({ rowId: "r3", columnId: "b" });
  });

  it("clamps at edges (does not wrap)", () => {
    const topLeft = { rowId: "r1", columnId: "a" };
    expect(moveFocus(topLeft, layout, "left")).toBe(topLeft);
    expect(moveFocus(topLeft, layout, "up")).toBe(topLeft);
    const botRight = { rowId: "r3", columnId: "c" };
    expect(moveFocus(botRight, layout, "right")).toBe(botRight);
    expect(moveFocus(botRight, layout, "down")).toBe(botRight);
  });
});

describe("moveFocus — row/grid start/end", () => {
  const start = { rowId: "r2", columnId: "b" };

  it("rowStart snaps to first column of the current row", () => {
    expect(moveFocus(start, layout, "rowStart")).toEqual({ rowId: "r2", columnId: "a" });
  });

  it("rowEnd snaps to last column of the current row", () => {
    expect(moveFocus(start, layout, "rowEnd")).toEqual({ rowId: "r2", columnId: "c" });
  });

  it("gridStart snaps to top-left", () => {
    expect(moveFocus(start, layout, "gridStart")).toEqual({ rowId: "r1", columnId: "a" });
  });

  it("gridEnd snaps to bottom-right", () => {
    expect(moveFocus(start, layout, "gridEnd")).toEqual({ rowId: "r3", columnId: "c" });
  });
});

describe("pageFocus", () => {
  const start = { rowId: "r1", columnId: "a" };

  it("pageDown moves down by pageSize rows", () => {
    expect(pageFocus(start, layout, "pageDown", 2)).toEqual({ rowId: "r3", columnId: "a" });
  });

  it("pageUp moves up by pageSize rows", () => {
    const bottom = { rowId: "r3", columnId: "c" };
    expect(pageFocus(bottom, layout, "pageUp", 2)).toEqual({ rowId: "r1", columnId: "c" });
  });

  it("clamps at edges", () => {
    expect(pageFocus(start, layout, "pageDown", 100)).toEqual({ rowId: "r3", columnId: "a" });
  });

  it("is a no-op when unfocused", () => {
    expect(pageFocus(EMPTY_FOCUS_STATE, layout, "pageDown", 2)).toBe(EMPTY_FOCUS_STATE);
  });
});

describe("focusCell", () => {
  it("moves to an explicit valid position", () => {
    expect(focusCell(EMPTY_FOCUS_STATE, layout, "r2", "c")).toEqual({
      rowId: "r2",
      columnId: "c",
    });
  });

  it("refuses unknown rows or columns", () => {
    expect(focusCell(EMPTY_FOCUS_STATE, layout, "mystery", "a")).toBe(EMPTY_FOCUS_STATE);
    expect(focusCell(EMPTY_FOCUS_STATE, layout, "r1", "z")).toBe(EMPTY_FOCUS_STATE);
  });

  it("returns the same reference when already focused there", () => {
    const s = { rowId: "r1", columnId: "a" };
    expect(focusCell(s, layout, "r1", "a")).toBe(s);
  });
});

describe("blurFocus", () => {
  it("clears focus", () => {
    const s = { rowId: "r1", columnId: "a" };
    expect(blurFocus(s)).toBe(EMPTY_FOCUS_STATE);
  });

  it("is idempotent", () => {
    expect(blurFocus(EMPTY_FOCUS_STATE)).toBe(EMPTY_FOCUS_STATE);
  });
});
