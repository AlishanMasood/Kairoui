import { describe, it, expect } from "vitest";
import {
  measureScrollbarWidth,
  getElementScrollbarWidth,
  getElementScrollbarHeight,
  hasVerticalScrollbar,
  hasHorizontalScrollbar,
} from "./scrollbar";
import type { ScrollableElement, ScrollbarDocument } from "./scrollbar";

describe("measureScrollbarWidth", () => {
  it("returns 0 for null document", () => {
    expect(measureScrollbarWidth(null)).toBe(0);
  });

  it("returns 0 for undefined document", () => {
    expect(measureScrollbarWidth(undefined)).toBe(0);
  });

  it("returns 0 when createElement is missing", () => {
    expect(measureScrollbarWidth({})).toBe(0);
  });

  it("measures scrollbar via temporary element", () => {
    const mockElement = {
      style: {} as Record<string, string>,
      offsetWidth: 100,
      clientWidth: 85,
    };
    const doc: ScrollbarDocument = {
      createElement: () => mockElement,
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
    };
    expect(measureScrollbarWidth(doc)).toBe(15);
  });

  it("returns 0 when scrollbar is not present (offsetWidth equals clientWidth)", () => {
    const mockElement = {
      style: {} as Record<string, string>,
      offsetWidth: 100,
      clientWidth: 100,
    };
    const doc: ScrollbarDocument = {
      createElement: () => mockElement,
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
    };
    expect(measureScrollbarWidth(doc)).toBe(0);
  });

  it("never returns negative values", () => {
    const mockElement = {
      style: {} as Record<string, string>,
      offsetWidth: 80,
      clientWidth: 100,
    };
    const doc: ScrollbarDocument = {
      createElement: () => mockElement,
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
    };
    expect(measureScrollbarWidth(doc)).toBe(0);
  });
});

describe("getElementScrollbarWidth", () => {
  it("returns difference between offsetWidth and clientWidth", () => {
    const el: ScrollableElement = { offsetWidth: 200, clientWidth: 183 };
    expect(getElementScrollbarWidth(el)).toBe(17);
  });

  it("returns 0 when no scrollbar", () => {
    const el: ScrollableElement = { offsetWidth: 200, clientWidth: 200 };
    expect(getElementScrollbarWidth(el)).toBe(0);
  });

  it("returns 0 for null element", () => {
    expect(getElementScrollbarWidth(null)).toBe(0);
  });

  it("returns 0 for undefined element", () => {
    expect(getElementScrollbarWidth(undefined)).toBe(0);
  });

  it("never returns negative", () => {
    const el: ScrollableElement = { offsetWidth: 100, clientWidth: 110 };
    expect(getElementScrollbarWidth(el)).toBe(0);
  });
});

describe("getElementScrollbarHeight", () => {
  it("returns difference between offsetHeight and clientHeight", () => {
    const el: ScrollableElement = { offsetHeight: 300, clientHeight: 283 };
    expect(getElementScrollbarHeight(el)).toBe(17);
  });

  it("returns 0 when no scrollbar", () => {
    const el: ScrollableElement = { offsetHeight: 300, clientHeight: 300 };
    expect(getElementScrollbarHeight(el)).toBe(0);
  });

  it("returns 0 for null element", () => {
    expect(getElementScrollbarHeight(null)).toBe(0);
  });
});

describe("hasVerticalScrollbar", () => {
  it("returns true when scrollHeight > clientHeight", () => {
    const el: ScrollableElement = { scrollHeight: 1000, clientHeight: 500 };
    expect(hasVerticalScrollbar(el)).toBe(true);
  });

  it("returns false when scrollHeight equals clientHeight", () => {
    const el: ScrollableElement = { scrollHeight: 500, clientHeight: 500 };
    expect(hasVerticalScrollbar(el)).toBe(false);
  });

  it("returns false when scrollHeight < clientHeight", () => {
    const el: ScrollableElement = { scrollHeight: 300, clientHeight: 500 };
    expect(hasVerticalScrollbar(el)).toBe(false);
  });

  it("returns false for null element", () => {
    expect(hasVerticalScrollbar(null)).toBe(false);
  });
});

describe("hasHorizontalScrollbar", () => {
  it("returns true when scrollWidth > clientWidth", () => {
    const el: ScrollableElement = { scrollWidth: 1200, clientWidth: 800 };
    expect(hasHorizontalScrollbar(el)).toBe(true);
  });

  it("returns false when scrollWidth equals clientWidth", () => {
    const el: ScrollableElement = { scrollWidth: 800, clientWidth: 800 };
    expect(hasHorizontalScrollbar(el)).toBe(false);
  });

  it("returns false for null element", () => {
    expect(hasHorizontalScrollbar(null)).toBe(false);
  });
});
