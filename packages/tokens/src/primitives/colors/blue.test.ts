import { describe, it, expect } from "vitest";
import { blue } from "./blue";
import type { ColorScaleStep } from "../../types/primitives";

/** All required scale steps */
const REQUIRED_STEPS: ColorScaleStep[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

/** Hex color regex: #RRGGBB (6 chars, lowercase) */
const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/;

/**
 * Convert sRGB component (0-255) to linear.
 */
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/**
 * Calculate relative luminance per WCAG 2.1.
 */
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/**
 * Calculate WCAG contrast ratio between two colors.
 */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("blue (brand) color scale", () => {
  describe("required keys", () => {
    it("contains all required scale steps", () => {
      for (const step of REQUIRED_STEPS) {
        expect(blue[step]).toBeDefined();
      }
    });

    it("has exactly 11 steps", () => {
      expect(Object.keys(blue)).toHaveLength(11);
    });
  });

  describe("valid color format", () => {
    it.each(REQUIRED_STEPS)("step %s is a valid 6-digit hex color", (step) => {
      expect(blue[step]).toMatch(HEX_COLOR_REGEX);
    });
  });

  describe("uniqueness", () => {
    it("all values are unique", () => {
      const values = Object.values(blue);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  describe("ordering (lightness decreases with step)", () => {
    it("each step is darker than the previous", () => {
      for (let i = 1; i < REQUIRED_STEPS.length; i++) {
        const prevStep = REQUIRED_STEPS[i - 1]!;
        const currStep = REQUIRED_STEPS[i]!;
        const prevLum = relativeLuminance(blue[prevStep]);
        const currLum = relativeLuminance(blue[currStep]);
        expect(currLum).toBeLessThan(prevLum);
      }
    });
  });

  describe("contrast validation", () => {
    const WHITE = "#ffffff";
    const DARK_BG = "#1e2433"; // neutral.900

    it("step 600 on white meets WCAG AA (≥ 4.5:1)", () => {
      const ratio = contrastRatio(blue["600"], WHITE);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("step 700 on white meets WCAG AA (≥ 4.5:1)", () => {
      const ratio = contrastRatio(blue["700"], WHITE);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("step 300 on dark background meets WCAG AA for large text (≥ 3:1)", () => {
      const ratio = contrastRatio(blue["300"], DARK_BG);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it("step 400 on dark background meets WCAG AA for large text (≥ 3:1)", () => {
      const ratio = contrastRatio(blue["400"], DARK_BG);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe("public import", () => {
    it("is importable from the package entry point", async () => {
      const tokens = await import("../../index");
      expect(tokens.blue).toBeDefined();
      expect(tokens.blue["600"]).toBe(blue["600"]);
    });
  });
});
