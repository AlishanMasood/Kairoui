import { describe, it, expect } from "vitest";
import {
  controlHeight,
  iconSize,
  contentWidth,
  minTouchTarget,
  recommendedTouchTarget,
} from "./sizing";
import type { SizeLabel } from "./sizing";

/** Valid CSS length: a number followed by "rem" */
const REM_REGEX = /^[\d.]+rem$/;

const SIZE_LABELS: SizeLabel[] = ["xs", "sm", "md", "lg", "xl"];

function toRemNumber(value: string): number {
  return parseFloat(value.replace("rem", ""));
}

describe("sizing scale", () => {
  describe("controlHeight", () => {
    it("has all required size labels", () => {
      for (const label of SIZE_LABELS) {
        expect(controlHeight[label]).toBeDefined();
      }
    });

    it.each(SIZE_LABELS)("controlHeight[%s] is a valid rem value", (label) => {
      expect(controlHeight[label]).toMatch(REM_REGEX);
    });

    it("values increase monotonically", () => {
      for (let i = 1; i < SIZE_LABELS.length; i++) {
        const prev = SIZE_LABELS[i - 1] as SizeLabel;
        const curr = SIZE_LABELS[i] as SizeLabel;
        expect(toRemNumber(controlHeight[curr])).toBeGreaterThan(toRemNumber(controlHeight[prev]));
      }
    });

    it("xs meets WCAG minimum touch target (24px = 1.5rem)", () => {
      expect(toRemNumber(controlHeight.xs)).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe("iconSize", () => {
    it("has all required size labels", () => {
      for (const label of SIZE_LABELS) {
        expect(iconSize[label]).toBeDefined();
      }
    });

    it.each(SIZE_LABELS)("iconSize[%s] is a valid rem value", (label) => {
      expect(iconSize[label]).toMatch(REM_REGEX);
    });

    it("values increase monotonically", () => {
      for (let i = 1; i < SIZE_LABELS.length; i++) {
        const prev = SIZE_LABELS[i - 1] as SizeLabel;
        const curr = SIZE_LABELS[i] as SizeLabel;
        expect(toRemNumber(iconSize[curr])).toBeGreaterThan(toRemNumber(iconSize[prev]));
      }
    });
  });

  describe("contentWidth", () => {
    it("has reading, content, wide, and max", () => {
      expect(contentWidth.reading).toBeDefined();
      expect(contentWidth.content).toBeDefined();
      expect(contentWidth.wide).toBeDefined();
      expect(contentWidth.max).toBeDefined();
    });

    it("all values are valid rem lengths", () => {
      expect(contentWidth.reading).toMatch(REM_REGEX);
      expect(contentWidth.content).toMatch(REM_REGEX);
      expect(contentWidth.wide).toMatch(REM_REGEX);
      expect(contentWidth.max).toMatch(REM_REGEX);
    });

    it("widths increase: reading < content < wide < max", () => {
      expect(toRemNumber(contentWidth.content)).toBeGreaterThan(toRemNumber(contentWidth.reading));
      expect(toRemNumber(contentWidth.wide)).toBeGreaterThan(toRemNumber(contentWidth.content));
      expect(toRemNumber(contentWidth.max)).toBeGreaterThan(toRemNumber(contentWidth.wide));
    });

    it("reading width is ~640px (40rem)", () => {
      expect(contentWidth.reading).toBe("40rem");
    });
  });

  describe("touch targets", () => {
    it("minTouchTarget is 1.5rem (24px)", () => {
      expect(minTouchTarget).toBe("1.5rem");
    });

    it("recommendedTouchTarget is 2.75rem (44px)", () => {
      expect(recommendedTouchTarget).toBe("2.75rem");
    });
  });

  describe("public import", () => {
    it("sizing exports are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.controlHeight).toBeDefined();
      expect(tokens.iconSize).toBeDefined();
      expect(tokens.contentWidth).toBeDefined();
      expect(tokens.minTouchTarget).toBeDefined();
      expect(tokens.recommendedTouchTarget).toBeDefined();
    });
  });
});
