import { describe, it, expect } from "vitest";
import { borderWidth, borderStyle, radius, focusRing } from "./borders";
import type { RadiusKey } from "../types/primitives";

/** Valid CSS length: "0", a number+px, a number+rem, or "9999px" */
const CSS_LENGTH_REGEX = /^(0|[\d.]+(?:px|rem))$/;

const RADIUS_KEYS: RadiusKey[] = ["none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "full"];

function toPixelApprox(value: string): number {
  if (value === "0") return 0;
  if (value.endsWith("px")) return parseFloat(value);
  if (value.endsWith("rem")) return parseFloat(value) * 16;
  return 0;
}

describe("borders and radius", () => {
  describe("borderWidth", () => {
    it("has none, thin, default, and thick", () => {
      expect(borderWidth.none).toBeDefined();
      expect(borderWidth.thin).toBeDefined();
      expect(borderWidth.default).toBeDefined();
      expect(borderWidth.thick).toBeDefined();
    });

    it("all values are valid CSS lengths", () => {
      expect(borderWidth.none).toMatch(CSS_LENGTH_REGEX);
      expect(borderWidth.thin).toMatch(CSS_LENGTH_REGEX);
      expect(borderWidth.default).toMatch(CSS_LENGTH_REGEX);
      expect(borderWidth.thick).toMatch(CSS_LENGTH_REGEX);
    });

    it("none is zero", () => {
      expect(borderWidth.none).toBe("0");
    });

    it("thick is wider than thin", () => {
      expect(toPixelApprox(borderWidth.thick)).toBeGreaterThan(toPixelApprox(borderWidth.thin));
    });
  });

  describe("borderStyle", () => {
    it("has none, solid, dashed, and dotted", () => {
      expect(borderStyle.none).toBe("none");
      expect(borderStyle.solid).toBe("solid");
      expect(borderStyle.dashed).toBe("dashed");
      expect(borderStyle.dotted).toBe("dotted");
    });
  });

  describe("radius", () => {
    it("has all required radius keys", () => {
      for (const key of RADIUS_KEYS) {
        expect(radius[key]).toBeDefined();
      }
    });

    it("has exactly 9 entries", () => {
      expect(Object.keys(radius)).toHaveLength(9);
    });

    it.each(RADIUS_KEYS)("radius[%s] is a valid CSS length", (key) => {
      expect(radius[key]).toMatch(CSS_LENGTH_REGEX);
    });

    it("none is zero", () => {
      expect(radius.none).toBe("0");
    });

    it("full is 9999px (pill/circle)", () => {
      expect(radius.full).toBe("9999px");
    });

    it("values increase from xs to 3xl (excluding none and full)", () => {
      const ordered: RadiusKey[] = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
      for (let i = 1; i < ordered.length; i++) {
        const prev = ordered[i - 1] as RadiusKey;
        const curr = ordered[i] as RadiusKey;
        expect(toPixelApprox(radius[curr])).toBeGreaterThan(toPixelApprox(radius[prev]));
      }
    });

    it("md is moderate (4-8px range) — not aggressively rounded", () => {
      const mdPx = toPixelApprox(radius.md);
      expect(mdPx).toBeGreaterThanOrEqual(4);
      expect(mdPx).toBeLessThanOrEqual(8);
    });
  });

  describe("focusRing", () => {
    it("has width and offset", () => {
      expect(focusRing.width).toBeDefined();
      expect(focusRing.offset).toBeDefined();
    });

    it("values are valid CSS lengths", () => {
      expect(focusRing.width).toMatch(CSS_LENGTH_REGEX);
      expect(focusRing.offset).toMatch(CSS_LENGTH_REGEX);
    });

    it("width is 2px (clearly visible)", () => {
      expect(focusRing.width).toBe("2px");
    });
  });

  describe("public import", () => {
    it("border and radius exports are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.borderWidth).toBeDefined();
      expect(tokens.borderStyle).toBeDefined();
      expect(tokens.radius).toBeDefined();
      expect(tokens.focusRing).toBeDefined();
    });
  });
});
