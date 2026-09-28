import { describe, it, expect } from "vitest";
import { applyFilter, defaultFilter, filterByPage, tokenizeQuery } from "./command-filter";
import type { CommandItem } from "./command-types";

function item(
  id: string,
  searchText: string,
  keywords: readonly string[] = [],
  opts: Partial<Pick<CommandItem, "pageId" | "groupId" | "disabled">> = {},
): CommandItem {
  return {
    id,
    groupId: opts.groupId ?? null,
    pageId: opts.pageId ?? null,
    searchText,
    keywords,
    disabled: opts.disabled ?? false,
    onSelect: () => undefined,
  };
}

// ─── tokenizeQuery ────────────────────────────────────────────────

describe("tokenizeQuery", () => {
  it("returns [] for an empty query", () => {
    expect(tokenizeQuery("")).toEqual([]);
  });

  it("lowercases and trims", () => {
    expect(tokenizeQuery("  Hello World  ")).toEqual(["hello", "world"]);
  });

  it("collapses runs of whitespace", () => {
    expect(tokenizeQuery("a\tb\nc")).toEqual(["a", "b", "c"]);
  });
});

// ─── defaultFilter ────────────────────────────────────────────────

describe("defaultFilter", () => {
  it("matches every item on an empty query", () => {
    const it1 = item("1", "New file");
    expect(defaultFilter(it1, "")).toBe(true);
  });

  it("matches on searchText substring", () => {
    const it1 = item("1", "New file");
    expect(defaultFilter(it1, "new")).toBe(true);
    expect(defaultFilter(it1, "FIL")).toBe(true);
  });

  it("does not match unrelated tokens", () => {
    const it1 = item("1", "New file");
    expect(defaultFilter(it1, "delete")).toBe(false);
  });

  it("all tokens must match somewhere", () => {
    const it1 = item("1", "New file");
    expect(defaultFilter(it1, "new file")).toBe(true);
    expect(defaultFilter(it1, "new mystery")).toBe(false);
  });

  it("falls back to keywords", () => {
    const it1 = item("1", "Toggle sidebar", ["nav", "layout"]);
    expect(defaultFilter(it1, "nav")).toBe(true);
    expect(defaultFilter(it1, "toggle nav")).toBe(true);
  });
});

// ─── applyFilter ──────────────────────────────────────────────────

describe("applyFilter", () => {
  const items = [
    item("a", "New file"),
    item("b", "Open project"),
    item("c", "Save file", ["persist"]),
  ];

  it("returns the input unchanged for an empty query", () => {
    expect(applyFilter(items, "")).toBe(items);
  });

  it("filters items using the default filter", () => {
    const out = applyFilter(items, "file");
    expect(out.map((it) => it.id)).toEqual(["a", "c"]);
  });

  it("respects a custom filter", () => {
    const customFilter = (it: CommandItem): boolean => it.id === "b";
    const out = applyFilter(items, "irrelevant", customFilter);
    expect(out.map((it) => it.id)).toEqual(["b"]);
  });

  it("preserves input order for matching items", () => {
    const many = [item("z", "one"), item("y", "two"), item("x", "three")];
    const out = applyFilter(many, "e");
    expect(out.map((it) => it.id)).toEqual(["z", "x"]);
  });
});

// ─── filterByPage ─────────────────────────────────────────────────

describe("filterByPage", () => {
  const items = [
    item("a", "top"),
    item("b", "nested", [], { pageId: "sub" }),
    item("c", "top2"),
    item("d", "deep", [], { pageId: "sub" }),
  ];

  it("returns root-page items when pageId is null", () => {
    expect(filterByPage(items, null).map((it) => it.id)).toEqual(["a", "c"]);
  });

  it("returns nested-page items", () => {
    expect(filterByPage(items, "sub").map((it) => it.id)).toEqual(["b", "d"]);
  });
});
