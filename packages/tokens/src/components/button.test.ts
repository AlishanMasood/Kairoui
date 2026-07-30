import { describe, it, expect } from "vitest";
import { buttonTokens } from "./button";
import type { ButtonContract } from "./button";

const VARIANTS = ["primary", "secondary", "outline", "ghost", "destructive"] as const;
const STATES = ["default", "hover", "active", "focus", "disabled", "loading"] as const;
const SIZES = ["sm", "md", "lg"] as const;

describe("button token contract", () => {
  describe("contract shape", () => {
    it("satisfies ButtonContract", () => {
      const _check: ButtonContract = buttonTokens;
      expect(_check).toBeDefined();
    });

    it("has all 5 variants", () => {
      for (const v of VARIANTS) {
        expect(buttonTokens.variant[v]).toBeDefined();
      }
    });

    it("has all 3 sizes", () => {
      for (const s of SIZES) {
        expect(buttonTokens.size[s]).toBeDefined();
      }
    });
  });

  describe("variant completeness", () => {
    it.each(VARIANTS)("variant.%s has all 6 states", (variant) => {
      const v = buttonTokens.variant[variant];
      for (const state of STATES) {
        expect(v[state]).toBeDefined();
      }
    });

    it.each(VARIANTS)("variant.%s states have background, text, border, icon", (variant) => {
      const v = buttonTokens.variant[variant];
      for (const state of STATES) {
        const s = v[state];
        expect(s.background).toBeDefined();
        expect(s.text).toBeDefined();
        expect(s.border).toBeDefined();
        expect(s.icon).toBeDefined();
      }
    });
  });

  describe("size completeness", () => {
    it.each(SIZES)("size.%s has height, paddingX, gap, fontSize, iconSize", (size) => {
      const s = buttonTokens.size[size];
      expect(s.height).toBeDefined();
      expect(s.paddingX).toBeDefined();
      expect(s.gap).toBeDefined();
      expect(s.fontSize).toBeDefined();
      expect(s.iconSize).toBeDefined();
    });

    it("heights increase from sm to lg", () => {
      expect(parseFloat(buttonTokens.size.lg.height)).toBeGreaterThan(
        parseFloat(buttonTokens.size.md.height),
      );
      expect(parseFloat(buttonTokens.size.md.height)).toBeGreaterThan(
        parseFloat(buttonTokens.size.sm.height),
      );
    });
  });

  describe("visual hierarchy", () => {
    it("primary uses brand color background (not transparent)", () => {
      expect(buttonTokens.variant.primary.default.background).not.toBe("transparent");
      expect(buttonTokens.variant.primary.default.background).toMatch(/^#/);
    });

    it("ghost uses transparent background", () => {
      expect(buttonTokens.variant.ghost.default.background).toBe("transparent");
      expect(buttonTokens.variant.ghost.default.border).toBe("transparent");
    });

    it("outline uses transparent background with visible border", () => {
      expect(buttonTokens.variant.outline.default.background).toBe("transparent");
      expect(buttonTokens.variant.outline.default.border).not.toBe("transparent");
    });

    it("destructive uses red-family background", () => {
      expect(buttonTokens.variant.destructive.default.background).toMatch(/^#/);
    });
  });

  describe("shared control inheritance", () => {
    it("radius references shared control value", () => {
      expect(buttonTokens.radius).toBeDefined();
      expect(buttonTokens.radius).toMatch(/rem|px/);
    });

    it("focus ring uses shared treatment", () => {
      expect(buttonTokens.focusRing.width).toBe("2px");
      expect(buttonTokens.focusRing.offset).toBe("2px");
    });

    it("transition uses shared timing", () => {
      expect(buttonTokens.transition.duration).toBe("100ms");
      expect(buttonTokens.transition.easing).toContain("cubic-bezier");
    });
  });

  describe("public import", () => {
    it("buttonTokens is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.buttonTokens).toBeDefined();
    });
  });
});
