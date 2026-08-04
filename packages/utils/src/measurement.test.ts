import { describe, it, expect } from "vitest";
import {
  getElementRect,
  getComputedStyleValue,
  parsePxValue,
  isElementVisible,
  hasOverflowX,
  hasOverflowY,
  getViewportRect,
  isRectContained,
} from "./measurement";
import type { MeasurableElement, MeasurableWindow, DOMRectLike } from "./measurement";

function mockElement(
  rect?: Partial<DOMRectLike>,
  overrides?: Partial<MeasurableElement>,
): MeasurableElement {
  return {
    getBoundingClientRect: () => ({
      top: 0,
      right: 100,
      bottom: 50,
      left: 0,
      width: 100,
      height: 50,
      ...rect,
    }),
    offsetWidth: 100,
    offsetHeight: 50,
    clientWidth: 100,
    clientHeight: 50,
    scrollWidth: 100,
    scrollHeight: 50,
    ...overrides,
  };
}

describe("getElementRect", () => {
  it("returns bounding rect from element", () => {
    const el = mockElement({ top: 10, left: 20, width: 200, height: 100, right: 220, bottom: 110 });
    expect(getElementRect(el)).toEqual({
      top: 10,
      left: 20,
      width: 200,
      height: 100,
      right: 220,
      bottom: 110,
    });
  });

  it("returns zero rect for null element", () => {
    expect(getElementRect(null)).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0,
    });
  });

  it("returns zero rect when getBoundingClientRect is missing", () => {
    expect(getElementRect({})).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0,
    });
  });
});

describe("getComputedStyleValue", () => {
  it("returns property value via getPropertyValue", () => {
    const win: MeasurableWindow = {
      getComputedStyle: () => ({
        getPropertyValue: (prop: string) => (prop === "color" ? "red" : ""),
      }),
    };
    expect(getComputedStyleValue(win, {}, "color")).toBe("red");
  });

  it("falls back to direct property access", () => {
    const win: MeasurableWindow = {
      getComputedStyle: () => ({ display: "flex" }),
    };
    expect(getComputedStyleValue(win, {}, "display")).toBe("flex");
  });

  it("returns empty string for null window", () => {
    expect(getComputedStyleValue(null, {}, "color")).toBe("");
  });

  it("returns empty string when getComputedStyle is unavailable", () => {
    expect(getComputedStyleValue({}, {}, "color")).toBe("");
  });
});

describe("parsePxValue", () => {
  it("parses pixel values", () => {
    expect(parsePxValue("16px")).toBe(16);
    expect(parsePxValue("0px")).toBe(0);
    expect(parsePxValue("3.5px")).toBe(3.5);
  });

  it("returns 0 for non-pixel units", () => {
    expect(parsePxValue("1em")).toBe(0);
    expect(parsePxValue("100%")).toBe(0);
    expect(parsePxValue("auto")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(parsePxValue("")).toBe(0);
  });

  it("returns 0 for NaN results", () => {
    expect(parsePxValue("abcpx")).toBe(0);
  });
});

describe("isElementVisible", () => {
  it("returns true for element with non-zero dimensions", () => {
    expect(isElementVisible(mockElement({ width: 100, height: 50 }))).toBe(true);
  });

  it("returns false for zero-width element", () => {
    expect(isElementVisible(mockElement({ width: 0, height: 50 }))).toBe(false);
  });

  it("returns false for zero-height element", () => {
    expect(isElementVisible(mockElement({ width: 100, height: 0 }))).toBe(false);
  });

  it("returns false for null element", () => {
    expect(isElementVisible(null)).toBe(false);
  });
});

describe("hasOverflowY", () => {
  it("returns true when scrollHeight > clientHeight", () => {
    expect(hasOverflowY(mockElement(undefined, { scrollHeight: 500, clientHeight: 300 }))).toBe(
      true,
    );
  });

  it("returns false when no overflow", () => {
    expect(hasOverflowY(mockElement(undefined, { scrollHeight: 300, clientHeight: 300 }))).toBe(
      false,
    );
  });

  it("returns false for null", () => {
    expect(hasOverflowY(null)).toBe(false);
  });
});

describe("hasOverflowX", () => {
  it("returns true when scrollWidth > clientWidth", () => {
    expect(hasOverflowX(mockElement(undefined, { scrollWidth: 800, clientWidth: 400 }))).toBe(true);
  });

  it("returns false when no overflow", () => {
    expect(hasOverflowX(mockElement(undefined, { scrollWidth: 400, clientWidth: 400 }))).toBe(
      false,
    );
  });

  it("returns false for null", () => {
    expect(hasOverflowX(null)).toBe(false);
  });
});

describe("getViewportRect", () => {
  it("returns viewport dimensions from window", () => {
    const win: MeasurableWindow = { innerWidth: 1024, innerHeight: 768 };
    expect(getViewportRect(win)).toEqual({
      top: 0,
      left: 0,
      right: 1024,
      bottom: 768,
      width: 1024,
      height: 768,
    });
  });

  it("returns zero rect for null window", () => {
    expect(getViewportRect(null)).toEqual({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
    });
  });
});

describe("isRectContained", () => {
  it("returns true when child is fully inside parent", () => {
    const parent: DOMRectLike = {
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    };
    const child: DOMRectLike = { top: 10, left: 10, right: 50, bottom: 50, width: 40, height: 40 };
    expect(isRectContained(parent, child)).toBe(true);
  });

  it("returns false when child overflows right", () => {
    const parent: DOMRectLike = {
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    };
    const child: DOMRectLike = { top: 0, left: 50, right: 150, bottom: 50, width: 100, height: 50 };
    expect(isRectContained(parent, child)).toBe(false);
  });

  it("returns false when child overflows top", () => {
    const parent: DOMRectLike = {
      top: 10,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 90,
    };
    const child: DOMRectLike = { top: 0, left: 0, right: 50, bottom: 50, width: 50, height: 50 };
    expect(isRectContained(parent, child)).toBe(false);
  });

  it("returns true when child equals parent", () => {
    const rect: DOMRectLike = { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 };
    expect(isRectContained(rect, rect)).toBe(true);
  });
});
