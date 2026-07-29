import { describe, it, expect } from "vitest";
import { opacity, zIndex } from "./layering";
import type { OpacityKey, ZIndexKey } from "../types/primitives";

const OPACITY_KEYS: OpacityKey[] = [
  "0",
  "5",
  "10",
  "20",
  "30",
  "40",
  "50",
  "60",
  "70",
  "80",
  "90",
  "95",
  "100",
];

const ZINDEX_KEYS: ZIndexKey[] = [
  "hide",
  "base",
  "dropdown",
  "sticky",
  "overlay",
  "modal",
  "toast",
];

/** Valid opacity string: "0", "1", or a decimal 0.XX */
const OPACITY_REGEX = /^(0|1|0\.\d+)$/;

describe("layering tokens", () => {
  describe("opacity", () => {
    it("has all required opacity keys", () => {
      for (const key of OPACITY_KEYS) {
        expect(opacity[key]).toBeDefined();
      }
    });

    it("has exactly 13 entries", () => {
      expect(Object.keys(opacity)).toHaveLength(13);
    });

    it.each(OPACITY_KEYS)("opacity[%s] is a valid CSS opacity value", (key) => {
      expect(opacity[key]).toMatch(OPACITY_REGEX);
    });

    it("opacity[0] is '0' (fully transparent)", () => {
      expect(opacity["0"]).toBe("0");
    });

    it("opacity[100] is '1' (fully opaque)", () => {
      expect(opacity["100"]).toBe("1");
    });

    it("values increase monotonically", () => {
      for (let i = 1; i < OPACITY_KEYS.length; i++) {
        const prev = OPACITY_KEYS[i - 1] as OpacityKey;
        const curr = OPACITY_KEYS[i] as OpacityKey;
        expect(parseFloat(opacity[curr])).toBeGreaterThan(parseFloat(opacity[prev]));
      }
    });
  });

  describe("zIndex", () => {
    it("has all required z-index keys", () => {
      for (const key of ZINDEX_KEYS) {
        expect(zIndex[key]).toBeDefined();
      }
    });

    it("has exactly 7 entries", () => {
      expect(Object.keys(zIndex)).toHaveLength(7);
    });

    it("all values are integers", () => {
      for (const key of ZINDEX_KEYS) {
        expect(Number.isInteger(zIndex[key])).toBe(true);
      }
    });

    it("hide is negative (-1)", () => {
      expect(zIndex.hide).toBe(-1);
    });

    it("base is 0", () => {
      expect(zIndex.base).toBe(0);
    });

    it("layers above base increase in order", () => {
      const orderedAboveBase: ZIndexKey[] = ["dropdown", "sticky", "overlay", "modal", "toast"];
      for (let i = 1; i < orderedAboveBase.length; i++) {
        const prev = orderedAboveBase[i - 1] as ZIndexKey;
        const curr = orderedAboveBase[i] as ZIndexKey;
        expect(zIndex[curr]).toBeGreaterThan(zIndex[prev]);
      }
    });

    it("all positive values are unique", () => {
      const positiveValues = ZINDEX_KEYS.filter((k) => zIndex[k] > 0).map((k) => zIndex[k]);
      const unique = new Set(positiveValues);
      expect(unique.size).toBe(positiveValues.length);
    });

    it("toast is the highest layer", () => {
      const maxZ = Math.max(...Object.values(zIndex));
      expect(zIndex.toast).toBe(maxZ);
    });
  });

  describe("public import", () => {
    it("opacity and zIndex are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.opacity).toBeDefined();
      expect(tokens.zIndex).toBeDefined();
      expect(tokens.opacity["50"]).toBe("0.5");
      expect(tokens.zIndex.modal).toBe(400);
    });
  });
});
