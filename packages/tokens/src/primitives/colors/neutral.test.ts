import { describe, it, expect } from "vitest";
import { neutral } from "./neutral";
import type { ColorScaleStep } from "../../types/primitives";

/** All required scale steps as defined by ColorScale type */
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

describe("neutral color scale", () => {
  describe("required keys", () => {
    it("contains all required scale steps", () => {
      for (const step of REQUIRED_STEPS) {
        expect(neutral[step]).toBeDefined();
      }
    });

    it("has exactly 11 steps", () => {
      expect(Object.keys(neutral)).toHaveLength(11);
    });
  });

  describe("valid color format", () => {
    it.each(REQUIRED_STEPS)("step %s is a valid 6-digit hex color", (step) => {
      expect(neutral[step]).toMatch(HEX_COLOR_REGEX);
    });
  });

  describe("uniqueness", () => {
    it("all values are unique", () => {
      const values = Object.values(neutral);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  describe("ordering (lightness decreases with step)", () => {
    /**
     * Parse hex to approximate relative luminance.
     * We use a simple sRGB sum for ordering validation — not perceptual accuracy.
     */
    function hexToLuminance(hex: string): number {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    it("each step is darker than the previous", () => {
      for (let i = 1; i < REQUIRED_STEPS.length; i++) {
        const prevStep = REQUIRED_STEPS[i - 1]!;
        const currStep = REQUIRED_STEPS[i]!;
        const prevLum = hexToLuminance(neutral[prevStep]);
        const currLum = hexToLuminance(neutral[currStep]);
        expect(currLum).toBeLessThan(prevLum);
      }
    });
  });

  describe("public import", () => {
    it("is importable from the package entry point", async () => {
      const tokens = await import("../../index");
      expect(tokens.neutral).toBeDefined();
      expect(tokens.neutral["500"]).toBe(neutral["500"]);
    });
  });
});
