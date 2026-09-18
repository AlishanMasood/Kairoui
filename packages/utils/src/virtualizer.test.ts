import { describe, it, expect } from "vitest";
import {
  computeScrollToIndex,
  computeVirtualizedRange,
  getIndexAtOffset,
  getItemOffset,
  getRangeSize,
} from "./virtualizer";

// ─── computeVirtualizedRange: boundaries ────────────────────────────

describe("computeVirtualizedRange: empty and degenerate", () => {
  it("returns an empty range when count is 0", () => {
    const r = computeVirtualizedRange({
      count: 0,
      rowHeight: 40,
      viewportHeight: 400,
      scrollTop: 0,
    });
    expect(r).toEqual({
      startIndex: 0,
      endIndex: 0,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight: 0,
    });
  });

  it("returns an empty range when viewportHeight is 0", () => {
    const r = computeVirtualizedRange({
      count: 100,
      rowHeight: 40,
      viewportHeight: 0,
      scrollTop: 0,
    });
    expect(r.startIndex).toBe(0);
    expect(r.endIndex).toBe(0);
    expect(r.totalHeight).toBe(4000);
  });

  it("throws on non-positive rowHeight", () => {
    expect(() =>
      computeVirtualizedRange({ count: 10, rowHeight: 0, viewportHeight: 100, scrollTop: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      computeVirtualizedRange({ count: 10, rowHeight: -1, viewportHeight: 100, scrollTop: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      computeVirtualizedRange({
        count: 10,
        rowHeight: Number.NaN,
        viewportHeight: 100,
        scrollTop: 0,
      }),
    ).toThrow(RangeError);
  });

  it("returns the entire collection when viewport covers total height", () => {
    const r = computeVirtualizedRange({
      count: 10,
      rowHeight: 40,
      viewportHeight: 500,
      scrollTop: 0,
    });
    expect(r).toEqual({
      startIndex: 0,
      endIndex: 10,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight: 400,
    });
  });
});

// ─── computeVirtualizedRange: normal windowing ──────────────────────

describe("computeVirtualizedRange: normal windowing", () => {
  const base = { count: 1000, rowHeight: 40, viewportHeight: 400 } as const;

  it("scrollTop = 0 starts at index 0 (plus overscan on the tail)", () => {
    const r = computeVirtualizedRange({ ...base, scrollTop: 0, overscan: 3 });
    expect(r.startIndex).toBe(0);
    // visible end = ceil(400 / 40) = 10; plus overscan 3 = 13
    expect(r.endIndex).toBe(13);
  });

  it("mid-scroll offsets produce a symmetric overscan", () => {
    const r = computeVirtualizedRange({ ...base, scrollTop: 400, overscan: 3 });
    // visible start = floor(400/40) = 10; end = ceil((400+400)/40) = 20
    expect(r.startIndex).toBe(7);
    expect(r.endIndex).toBe(23);
  });

  it("scrollTop past the end clamps endIndex to count", () => {
    const r = computeVirtualizedRange({ ...base, scrollTop: 40_000, overscan: 3 });
    expect(r.endIndex).toBe(1000);
    expect(r.startIndex).toBeGreaterThan(base.count - 20);
  });

  it("negative scrollTop is treated as 0", () => {
    const r = computeVirtualizedRange({ ...base, scrollTop: -1000, overscan: 3 });
    expect(r.startIndex).toBe(0);
  });

  it("respects a custom overscan value", () => {
    const zero = computeVirtualizedRange({ ...base, scrollTop: 800, overscan: 0 });
    const many = computeVirtualizedRange({ ...base, scrollTop: 800, overscan: 10 });
    expect(zero.endIndex - zero.startIndex).toBeLessThan(many.endIndex - many.startIndex);
  });

  it("padding invariant holds across scroll offsets", () => {
    for (const scrollTop of [0, 40, 400, 4000, 39_960, 40_000]) {
      const r = computeVirtualizedRange({ ...base, scrollTop, overscan: 3 });
      const rendered = (r.endIndex - r.startIndex) * base.rowHeight;
      expect(r.paddingTop + rendered + r.paddingBottom).toBe(r.totalHeight);
    }
  });

  it("startIndex and endIndex stay within bounds for extreme inputs", () => {
    const r = computeVirtualizedRange({
      count: 5,
      rowHeight: 40,
      viewportHeight: 100,
      scrollTop: 1e12,
      overscan: 100,
    });
    expect(r.startIndex).toBeGreaterThanOrEqual(0);
    expect(r.endIndex).toBeLessThanOrEqual(5);
  });

  it("is deterministic for identical inputs", () => {
    const cfg = { ...base, scrollTop: 1234, overscan: 5 };
    expect(computeVirtualizedRange(cfg)).toEqual(computeVirtualizedRange(cfg));
  });

  it("fractional rowHeight still preserves the padding invariant", () => {
    const r = computeVirtualizedRange({
      count: 100,
      rowHeight: 33.5,
      viewportHeight: 250,
      scrollTop: 500,
      overscan: 2,
    });
    const rendered = (r.endIndex - r.startIndex) * 33.5;
    expect(r.paddingTop + rendered + r.paddingBottom).toBeCloseTo(r.totalHeight, 5);
  });

  it("non-integer count is floored to integer semantics", () => {
    const r = computeVirtualizedRange({
      count: 10.9,
      rowHeight: 40,
      viewportHeight: 500,
      scrollTop: 0,
    });
    expect(r.endIndex).toBe(10);
    expect(r.totalHeight).toBe(400);
  });
});

// ─── Item positioning helpers ──────────────────────────────────────

describe("getItemOffset", () => {
  it("returns index * rowHeight", () => {
    expect(getItemOffset(0, 40)).toBe(0);
    expect(getItemOffset(1, 40)).toBe(40);
    expect(getItemOffset(10, 40)).toBe(400);
  });

  it("clamps negative indices to 0", () => {
    expect(getItemOffset(-5, 40)).toBe(0);
  });

  it("throws on non-positive rowHeight", () => {
    expect(() => getItemOffset(1, 0)).toThrow(RangeError);
  });
});

describe("getRangeSize", () => {
  it("returns rendered pixel height for a half-open range", () => {
    expect(getRangeSize(5, 10, 40)).toBe(200);
  });

  it("returns 0 for an empty range", () => {
    expect(getRangeSize(10, 10, 40)).toBe(0);
    expect(getRangeSize(10, 5, 40)).toBe(0);
  });
});

describe("getIndexAtOffset", () => {
  it("returns 0 for offset 0", () => {
    expect(getIndexAtOffset(0, 40, 100)).toBe(0);
  });

  it("returns count - 1 for offset past the end", () => {
    expect(getIndexAtOffset(1_000_000, 40, 100)).toBe(99);
  });

  it("returns 0 for empty collections", () => {
    expect(getIndexAtOffset(200, 40, 0)).toBe(0);
  });

  it("clamps negative offsets to 0", () => {
    expect(getIndexAtOffset(-500, 40, 100)).toBe(0);
  });
});

// ─── computeScrollToIndex ──────────────────────────────────────────

describe("computeScrollToIndex", () => {
  const base = { rowHeight: 40, count: 100, viewportHeight: 400 } as const;

  it("returns 0 for empty collections", () => {
    expect(computeScrollToIndex({ ...base, count: 0, index: 5 })).toBe(0);
  });

  it("clamps out-of-range indices", () => {
    expect(computeScrollToIndex({ ...base, index: -1 })).toBe(0);
    // index 200 out of 100 — clamped to last
    const target = computeScrollToIndex({ ...base, index: 200 });
    expect(target).toBeGreaterThan(0);
    expect(target).toBeLessThanOrEqual(base.count * base.rowHeight);
  });

  it("align: start places the item at the top of the viewport", () => {
    expect(computeScrollToIndex({ ...base, index: 25, align: "start" })).toBe(1000);
  });

  it("align: end places the item at the bottom of the viewport", () => {
    // itemBottom = 26 * 40 = 1040; scrollTop = 1040 - 400 = 640
    expect(computeScrollToIndex({ ...base, index: 25, align: "end" })).toBe(640);
  });

  it("align: center centers the item vertically", () => {
    // itemTop = 1000; scrollTop = 1000 - (400 - 40)/2 = 1000 - 180 = 820
    expect(computeScrollToIndex({ ...base, index: 25, align: "center" })).toBe(820);
  });

  it("align: auto no-ops when the item is already fully visible", () => {
    const currentScrollTop = 800;
    // Item 25 starts at 1000, ends at 1040. Viewport is [800, 1200]. Fully visible.
    expect(computeScrollToIndex({ ...base, index: 25, currentScrollTop, align: "auto" })).toBe(
      currentScrollTop,
    );
  });

  it("align: auto scrolls up when the item is above the viewport", () => {
    const currentScrollTop = 1200;
    // Item 25 top = 1000; below viewport start. Scroll to place at top.
    expect(computeScrollToIndex({ ...base, index: 25, currentScrollTop, align: "auto" })).toBe(
      1000,
    );
  });

  it("align: auto scrolls down when the item is below the viewport", () => {
    const currentScrollTop = 0;
    // Item 50 top = 2000; scroll to place at bottom of viewport.
    expect(computeScrollToIndex({ ...base, index: 50, currentScrollTop, align: "auto" })).toBe(
      2040 - 400,
    );
  });

  it("target is clamped to [0, maxScroll]", () => {
    // Very small viewport, very large item index.
    const target = computeScrollToIndex({
      rowHeight: 40,
      count: 10,
      viewportHeight: 200,
      index: 9,
      align: "start",
    });
    // totalHeight=400, viewport=200, maxScroll=200. index 9 top = 360 — clamped to 200.
    expect(target).toBe(200);
  });

  it("throws on non-positive rowHeight", () => {
    expect(() => computeScrollToIndex({ ...base, rowHeight: 0, index: 0 })).toThrow(RangeError);
  });
});
