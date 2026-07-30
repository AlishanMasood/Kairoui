import { describe, it, expect } from "vitest";
import { lightTheme } from "./light";
import type { SemanticTokens } from "../types/semantic";

// WCAG contrast helpers
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
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("light theme", () => {
  describe("completeness", () => {
    it("satisfies SemanticTokens contract", () => {
      const _typecheck: SemanticTokens = lightTheme;
      expect(_typecheck).toBeDefined();
    });

    it("has all color groups", () => {
      expect(lightTheme.color.background).toBeDefined();
      expect(lightTheme.color.text).toBeDefined();
      expect(lightTheme.color.border).toBeDefined();
      expect(lightTheme.color.interactive).toBeDefined();
      expect(lightTheme.color.status).toBeDefined();
      expect(lightTheme.color.focus).toBeDefined();
      expect(lightTheme.color.destructive).toBeDefined();
    });

    it("has all typography roles", () => {
      expect(Object.keys(lightTheme.typography)).toHaveLength(12);
    });

    it("has all spacing groups", () => {
      expect(lightTheme.spacing.inline).toBeDefined();
      expect(lightTheme.spacing.form).toBeDefined();
      expect(lightTheme.spacing.content).toBeDefined();
      expect(lightTheme.spacing.section).toBeDefined();
      expect(lightTheme.spacing.page).toBeDefined();
    });

    it("has all control heights", () => {
      expect(Object.keys(lightTheme.control.height)).toHaveLength(5);
    });

    it("has all elevation levels", () => {
      expect(lightTheme.elevation.raised).toBeDefined();
      expect(lightTheme.elevation.overlay).toBeDefined();
      expect(lightTheme.elevation.modal).toBeDefined();
      expect(lightTheme.elevation.toast).toBeDefined();
    });

    it("has all interaction states", () => {
      expect(Object.keys(lightTheme.interaction)).toHaveLength(11);
    });
  });

  describe("surface hierarchy", () => {
    it("page is darker than surface (subtle hierarchy)", () => {
      const pageLum = relativeLuminance(lightTheme.color.background.page);
      const surfaceLum = relativeLuminance(lightTheme.color.background.surface);
      expect(surfaceLum).toBeGreaterThan(pageLum);
    });

    it("muted is darker than page", () => {
      const pageLum = relativeLuminance(lightTheme.color.background.page);
      const mutedLum = relativeLuminance(lightTheme.color.background.muted);
      expect(mutedLum).toBeLessThan(pageLum);
    });
  });

  describe("text contrast (WCAG AA ≥ 4.5:1)", () => {
    it("primary text on page background", () => {
      const ratio = contrastRatio(lightTheme.color.text.primary, lightTheme.color.background.page);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("primary text on surface background", () => {
      const ratio = contrastRatio(
        lightTheme.color.text.primary,
        lightTheme.color.background.surface,
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("secondary text on page background", () => {
      const ratio = contrastRatio(
        lightTheme.color.text.secondary,
        lightTheme.color.background.page,
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("link text on page background", () => {
      const ratio = contrastRatio(lightTheme.color.text.link, lightTheme.color.background.page);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("inverse text on inverse background", () => {
      const ratio = contrastRatio(
        lightTheme.color.text.inverse,
        lightTheme.color.background.inverse,
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("focus treatment", () => {
    it("focus ring uses brand color", () => {
      expect(lightTheme.color.focus.ring).toMatch(/^#/);
    });

    it("inner ring is white for double-ring visibility", () => {
      expect(lightTheme.color.focus.innerRing).toBe("#ffffff");
    });

    it("focused state has focusRing visible", () => {
      expect(lightTheme.interaction.focused.focusRing).toBe("visible");
    });

    it("non-focused states have focusRing hidden", () => {
      expect(lightTheme.interaction.default.focusRing).toBe("hidden");
      expect(lightTheme.interaction.hover.focusRing).toBe("hidden");
      expect(lightTheme.interaction.disabled.focusRing).toBe("hidden");
    });
  });

  describe("valid references (no undefined values)", () => {
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
        assertNoUndefined(lightTheme as unknown as Record<string, unknown>, "lightTheme");
      }).not.toThrow();
    });
  });

  describe("public import", () => {
    it("lightTheme is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.lightTheme).toBeDefined();
      expect(tokens.lightTheme.color.background.page).toBe(lightTheme.color.background.page);
    });
  });
});
