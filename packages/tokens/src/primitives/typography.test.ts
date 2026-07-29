import { describe, it, expect } from "vitest";
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } from "./typography";
import type {
  FontSizeKey,
  FontWeightKey,
  LineHeightKey,
  LetterSpacingKey,
} from "../types/primitives";

const REM_REGEX = /^[\d.]+rem$/;
const EM_REGEX = /^-?[\d.]+em$/;

const FONT_SIZE_KEYS: FontSizeKey[] = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
];

const FONT_WEIGHT_KEYS: FontWeightKey[] = [
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
];

const LINE_HEIGHT_KEYS: LineHeightKey[] = ["none", "tight", "snug", "normal", "relaxed", "loose"];

const LETTER_SPACING_KEYS: LetterSpacingKey[] = [
  "tighter",
  "tight",
  "normal",
  "wide",
  "wider",
  "widest",
];

function toRemNumber(value: string): number {
  return parseFloat(value.replace("rem", ""));
}

describe("typography scale", () => {
  describe("fontFamily", () => {
    it("has sans, serif, and mono stacks", () => {
      expect(fontFamily.sans).toBeDefined();
      expect(fontFamily.serif).toBeDefined();
      expect(fontFamily.mono).toBeDefined();
    });

    it("sans stack starts with Inter", () => {
      expect(fontFamily.sans.startsWith("Inter")).toBe(true);
    });

    it("mono stack includes JetBrains Mono", () => {
      expect(fontFamily.mono).toContain("JetBrains Mono");
    });

    it("all stacks end with a generic family", () => {
      expect(fontFamily.sans).toMatch(/sans-serif/);
      expect(fontFamily.serif).toMatch(/serif/);
      expect(fontFamily.mono).toMatch(/monospace/);
    });
  });

  describe("fontSize", () => {
    it("has all required size keys", () => {
      for (const key of FONT_SIZE_KEYS) {
        expect(fontSize[key]).toBeDefined();
      }
    });

    it("has exactly 13 entries", () => {
      expect(Object.keys(fontSize)).toHaveLength(13);
    });

    it.each(FONT_SIZE_KEYS)("fontSize[%s] is a valid rem value", (key) => {
      expect(fontSize[key]).toMatch(REM_REGEX);
    });

    it("sizes increase monotonically", () => {
      for (let i = 1; i < FONT_SIZE_KEYS.length; i++) {
        const prev = FONT_SIZE_KEYS[i - 1] as FontSizeKey;
        const curr = FONT_SIZE_KEYS[i] as FontSizeKey;
        expect(toRemNumber(fontSize[curr])).toBeGreaterThan(toRemNumber(fontSize[prev]));
      }
    });

    it("base is 0.875rem (14px) — enterprise default", () => {
      expect(fontSize.base).toBe("0.875rem");
    });

    it("xs is minimum 0.75rem (12px)", () => {
      expect(toRemNumber(fontSize.xs)).toBeGreaterThanOrEqual(0.75);
    });
  });

  describe("fontWeight", () => {
    it("has all required weight keys", () => {
      for (const key of FONT_WEIGHT_KEYS) {
        expect(fontWeight[key]).toBeDefined();
      }
    });

    it("has exactly 9 entries", () => {
      expect(Object.keys(fontWeight)).toHaveLength(9);
    });

    it("weights are numeric 100-900", () => {
      expect(fontWeight.thin).toBe(100);
      expect(fontWeight.normal).toBe(400);
      expect(fontWeight.bold).toBe(700);
      expect(fontWeight.black).toBe(900);
    });

    it("weights increase monotonically", () => {
      for (let i = 1; i < FONT_WEIGHT_KEYS.length; i++) {
        const prev = FONT_WEIGHT_KEYS[i - 1] as FontWeightKey;
        const curr = FONT_WEIGHT_KEYS[i] as FontWeightKey;
        expect(fontWeight[curr]).toBeGreaterThan(fontWeight[prev] as number);
      }
    });
  });

  describe("lineHeight", () => {
    it("has all required keys", () => {
      for (const key of LINE_HEIGHT_KEYS) {
        expect(lineHeight[key]).toBeDefined();
      }
    });

    it("has exactly 6 entries", () => {
      expect(Object.keys(lineHeight)).toHaveLength(6);
    });

    it("values are unitless numbers", () => {
      for (const key of LINE_HEIGHT_KEYS) {
        expect(typeof lineHeight[key]).toBe("number");
      }
    });

    it("none is 1 (no extra leading)", () => {
      expect(lineHeight.none).toBe(1);
    });

    it("normal is 1.5 (WCAG recommended)", () => {
      expect(lineHeight.normal).toBe(1.5);
    });

    it("values increase monotonically", () => {
      for (let i = 1; i < LINE_HEIGHT_KEYS.length; i++) {
        const prev = LINE_HEIGHT_KEYS[i - 1] as LineHeightKey;
        const curr = LINE_HEIGHT_KEYS[i] as LineHeightKey;
        expect(lineHeight[curr]).toBeGreaterThan(lineHeight[prev] as number);
      }
    });
  });

  describe("letterSpacing", () => {
    it("has all required keys", () => {
      for (const key of LETTER_SPACING_KEYS) {
        expect(letterSpacing[key]).toBeDefined();
      }
    });

    it("has exactly 6 entries", () => {
      expect(Object.keys(letterSpacing)).toHaveLength(6);
    });

    it.each(LETTER_SPACING_KEYS)("letterSpacing[%s] is a valid em value", (key) => {
      expect(letterSpacing[key]).toMatch(EM_REGEX);
    });

    it("normal is 0em", () => {
      expect(letterSpacing.normal).toBe("0em");
    });

    it("tighter values are negative, wider values are positive", () => {
      expect(parseFloat(letterSpacing.tighter)).toBeLessThan(0);
      expect(parseFloat(letterSpacing.tight)).toBeLessThan(0);
      expect(parseFloat(letterSpacing.wide)).toBeGreaterThan(0);
      expect(parseFloat(letterSpacing.widest)).toBeGreaterThan(0);
    });
  });

  describe("public import", () => {
    it("typography exports are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.fontFamily).toBeDefined();
      expect(tokens.fontSize).toBeDefined();
      expect(tokens.fontWeight).toBeDefined();
      expect(tokens.lineHeight).toBeDefined();
      expect(tokens.letterSpacing).toBeDefined();
    });
  });
});
