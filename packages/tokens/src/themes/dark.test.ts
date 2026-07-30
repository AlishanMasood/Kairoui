import { describe, it, expect } from "vitest";
import { darkTheme } from "./dark";
import { lightTheme } from "./light";
import type { SemanticTokens } from "../types/semantic";

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function getKeys(obj: object): string[] {
  const keys: string[] = [];
  function walk(o: object, prefix: string): void {
    for (const [k, v] of Object.entries(o)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        walk(v as object, path);
      } else {
        keys.push(path);
      }
    }
  }
  walk(obj, "");
  return keys.sort();
}

describe("dark theme", () => {
  describe("completeness", () => {
    it("satisfies SemanticTokens contract", () => {
      const _typecheck: SemanticTokens = darkTheme;
      expect(_typecheck).toBeDefined();
    });

    it("has all color groups", () => {
      expect(darkTheme.color.background).toBeDefined();
      expect(darkTheme.color.text).toBeDefined();
      expect(darkTheme.color.border).toBeDefined();
      expect(darkTheme.color.interactive).toBeDefined();
      expect(darkTheme.color.status).toBeDefined();
      expect(darkTheme.color.focus).toBeDefined();
      expect(darkTheme.color.destructive).toBeDefined();
    });

    it("has all typography roles", () => {
      expect(Object.keys(darkTheme.typography)).toHaveLength(12);
    });

    it("has all interaction states", () => {
      expect(Object.keys(darkTheme.interaction)).toHaveLength(11);
    });
  });

  describe("symmetry with light theme", () => {
    it("has identical key structure to light theme", () => {
      const darkKeys = getKeys(darkTheme);
      const lightKeys = getKeys(lightTheme);
      expect(darkKeys).toEqual(lightKeys);
    });
  });

  describe("no pure black surfaces", () => {
    it("page background is not #000000", () => {
      expect(darkTheme.color.background.page).not.toBe("#000000");
    });

    it("surface background is not #000000", () => {
      expect(darkTheme.color.background.surface).not.toBe("#000000");
    });
  });

  describe("surface distinguishability", () => {
    it("surface is lighter than page", () => {
      const pageLum = relativeLuminance(darkTheme.color.background.page);
      const surfaceLum = relativeLuminance(darkTheme.color.background.surface);
      expect(surfaceLum).toBeGreaterThan(pageLum);
    });

    it("muted is lighter than surface", () => {
      const surfaceLum = relativeLuminance(darkTheme.color.background.surface);
      const mutedLum = relativeLuminance(darkTheme.color.background.muted);
      expect(mutedLum).toBeGreaterThan(surfaceLum);
    });
  });

  describe("text contrast (WCAG AA ≥ 4.5:1)", () => {
    it("primary text on page", () => {
      const ratio = contrastRatio(darkTheme.color.text.primary, darkTheme.color.background.page);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("primary text on surface", () => {
      const ratio = contrastRatio(darkTheme.color.text.primary, darkTheme.color.background.surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("secondary text on page", () => {
      const ratio = contrastRatio(darkTheme.color.text.secondary, darkTheme.color.background.page);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("focus treatment preserved", () => {
    it("focus ring is a visible brand color", () => {
      expect(darkTheme.color.focus.ring).toMatch(/^#/);
    });

    it("inner ring matches surface for dark-theme visibility", () => {
      expect(darkTheme.color.focus.innerRing).toBe(darkTheme.color.background.surface);
    });

    it("focused state has focusRing visible", () => {
      expect(darkTheme.interaction.focused.focusRing).toBe("visible");
    });
  });

  describe("no undefined values", () => {
    function assertNoUndefined(obj: Record<string, unknown>, path: string): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = `${path}.${key}`;
        if (value === undefined) {
          throw new Error(`Undefined value at ${fullPath}`);
        }
        if (typeof value === "object" && value !== null) {
          assertNoUndefined(value as Record<string, unknown>, fullPath);
        }
      }
    }

    it("no undefined values in entire theme", () => {
      expect(() => {
        assertNoUndefined(darkTheme as unknown as Record<string, unknown>, "darkTheme");
      }).not.toThrow();
    });
  });

  describe("public import", () => {
    it("darkTheme is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.darkTheme).toBeDefined();
      expect(tokens.darkTheme.color.background.page).toBe(darkTheme.color.background.page);
    });
  });
});
