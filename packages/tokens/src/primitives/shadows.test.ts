import { describe, it, expect } from "vitest";
import { shadow } from "./shadows";
import type { ShadowKey } from "../types/primitives";

const SHADOW_KEYS: ShadowKey[] = ["none", "xs", "sm", "md", "lg", "xl", "2xl", "inner"];

/**
 * Valid CSS box-shadow: "none" or one or more shadow layers.
 * Each layer: [inset] <x> <y> <blur> <spread> <color>
 * Values may be "0" (unitless) or have px units.
 */
const CSS_SHADOW_REGEX =
  /^(none|((inset\s+)?-?[\d.]+(px)?\s+-?[\d.]+(px)?\s+[\d.]+(px)?\s+-?[\d.]+(px)?\s+rgba?\([^)]+\)(,\s*)?)+)$/;

describe("shadow scale", () => {
  describe("required keys", () => {
    it("has all required shadow keys", () => {
      for (const key of SHADOW_KEYS) {
        expect(shadow[key]).toBeDefined();
      }
    });

    it("has exactly 8 entries", () => {
      expect(Object.keys(shadow)).toHaveLength(8);
    });
  });

  describe("valid CSS shadow format", () => {
    it.each(SHADOW_KEYS)("shadow[%s] is a valid CSS box-shadow", (key) => {
      expect(shadow[key]).toMatch(CSS_SHADOW_REGEX);
    });
  });

  describe("special values", () => {
    it("none is literal 'none'", () => {
      expect(shadow.none).toBe("none");
    });

    it("inner uses inset keyword", () => {
      expect(shadow.inner).toContain("inset");
    });

    it("non-none shadows use rgba", () => {
      const nonNone = SHADOW_KEYS.filter((k) => k !== "none");
      for (const key of nonNone) {
        expect(shadow[key]).toContain("rgba");
      }
    });
  });

  describe("public import", () => {
    it("shadow is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.shadow).toBeDefined();
      expect(tokens.shadow.md).toBe(shadow.md);
    });
  });
});
