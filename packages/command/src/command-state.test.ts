import { describe, it, expect } from "vitest";
import {
  EMPTY_COMMAND_STATE,
  closePalette,
  currentPageId,
  findHighlightIndex,
  moveHighlight,
  openPalette,
  popPage,
  pushPage,
  setHighlight,
  setQuery,
  snapHighlight,
} from "./command-state";
import type { CommandItem } from "./command-types";

function item(id: string, opts: Partial<Omit<CommandItem, "id">> = {}): CommandItem {
  return {
    id,
    groupId: opts.groupId ?? null,
    pageId: opts.pageId ?? null,
    searchText: opts.searchText ?? id,
    keywords: opts.keywords ?? [],
    disabled: opts.disabled ?? false,
    onSelect: opts.onSelect ?? (() => undefined),
  };
}

// ─── Selectors ────────────────────────────────────────────────────

describe("currentPageId", () => {
  it("returns null when the stack is empty", () => {
    expect(currentPageId(EMPTY_COMMAND_STATE)).toBeNull();
  });

  it("returns the top of the stack", () => {
    expect(currentPageId({ ...EMPTY_COMMAND_STATE, pageStack: ["a", "b"] })).toBe("b");
  });
});

// ─── Open / close ─────────────────────────────────────────────────

describe("openPalette / closePalette", () => {
  it("opens the palette", () => {
    expect(openPalette(EMPTY_COMMAND_STATE).open).toBe(true);
  });

  it("returns the same reference when already open", () => {
    const open = openPalette(EMPTY_COMMAND_STATE);
    expect(openPalette(open)).toBe(open);
  });

  it("closes the palette and resets transient slices", () => {
    const state = {
      ...EMPTY_COMMAND_STATE,
      open: true,
      query: "hello",
      highlightedId: "a",
      pageStack: ["x"],
    };
    const closed = closePalette(state);
    expect(closed.open).toBe(false);
    expect(closed.query).toBe("");
    expect(closed.highlightedId).toBeNull();
    expect(closed.pageStack).toEqual([]);
  });

  it("returns the same reference when already closed and clean", () => {
    expect(closePalette(EMPTY_COMMAND_STATE)).toBe(EMPTY_COMMAND_STATE);
  });
});

// ─── setQuery / setHighlight ──────────────────────────────────────

describe("setQuery", () => {
  it("updates the query", () => {
    expect(setQuery(EMPTY_COMMAND_STATE, "abc").query).toBe("abc");
  });

  it("returns the same reference when the query is unchanged", () => {
    expect(setQuery(EMPTY_COMMAND_STATE, "")).toBe(EMPTY_COMMAND_STATE);
  });
});

describe("setHighlight", () => {
  it("updates the highlight", () => {
    expect(setHighlight(EMPTY_COMMAND_STATE, "x").highlightedId).toBe("x");
  });

  it("returns the same reference when unchanged", () => {
    expect(setHighlight(EMPTY_COMMAND_STATE, null)).toBe(EMPTY_COMMAND_STATE);
  });
});

// ─── Nested pages ─────────────────────────────────────────────────

describe("pushPage / popPage", () => {
  it("pushes a new page and resets query + highlight", () => {
    const state = {
      ...EMPTY_COMMAND_STATE,
      query: "q",
      highlightedId: "a",
    };
    const next = pushPage(state, "theme");
    expect(next.pageStack).toEqual(["theme"]);
    expect(next.query).toBe("");
    expect(next.highlightedId).toBeNull();
  });

  it("is a no-op when the new page equals the current top", () => {
    const state = { ...EMPTY_COMMAND_STATE, pageStack: ["theme"] };
    expect(pushPage(state, "theme")).toBe(state);
  });

  it("pops the top page and resets query", () => {
    const state = {
      ...EMPTY_COMMAND_STATE,
      pageStack: ["a", "b"],
      query: "child",
      highlightedId: "x",
    };
    const next = popPage(state);
    expect(next.pageStack).toEqual(["a"]);
    expect(next.query).toBe("");
    expect(next.highlightedId).toBeNull();
  });

  it("popPage is a no-op at the root page", () => {
    expect(popPage(EMPTY_COMMAND_STATE)).toBe(EMPTY_COMMAND_STATE);
  });
});

// ─── Highlight movement ───────────────────────────────────────────

describe("moveHighlight", () => {
  it("wraps at the ends", () => {
    const items = [item("a"), item("b"), item("c")];
    expect(moveHighlight(items, "a", -1)).toBe("c");
    expect(moveHighlight(items, "c", 1)).toBe("a");
  });

  it("skips disabled items", () => {
    const items = [item("a"), item("b", { disabled: true }), item("c")];
    expect(moveHighlight(items, "a", 1)).toBe("c");
    expect(moveHighlight(items, "c", -1)).toBe("a");
  });

  it("seeds at the first enabled item when nothing is highlighted", () => {
    const items = [item("a", { disabled: true }), item("b"), item("c")];
    expect(moveHighlight(items, null, 1)).toBe("b");
    expect(moveHighlight(items, null, -1)).toBe("c");
  });

  it("returns null when all items are disabled", () => {
    const items = [item("a", { disabled: true }), item("b", { disabled: true })];
    expect(moveHighlight(items, null, 1)).toBeNull();
  });

  it("returns null when the visible set is empty", () => {
    expect(moveHighlight([], null, 1)).toBeNull();
  });
});

describe("snapHighlight", () => {
  it("returns the first enabled item on 'first'", () => {
    const items = [item("a", { disabled: true }), item("b"), item("c")];
    expect(snapHighlight(items, "first")).toBe("b");
  });

  it("returns the last enabled item on 'last'", () => {
    const items = [item("a"), item("b"), item("c", { disabled: true })];
    expect(snapHighlight(items, "last")).toBe("b");
  });

  it("returns null when the visible set is empty", () => {
    expect(snapHighlight([], "first")).toBeNull();
  });
});

describe("findHighlightIndex", () => {
  it("returns the index of the highlighted item", () => {
    const items = [item("a"), item("b"), item("c")];
    expect(findHighlightIndex(items, "b")).toBe(1);
  });

  it("returns -1 when unhighlighted or missing", () => {
    const items = [item("a"), item("b")];
    expect(findHighlightIndex(items, null)).toBe(-1);
    expect(findHighlightIndex(items, "mystery")).toBe(-1);
  });
});
