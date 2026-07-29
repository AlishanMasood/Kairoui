import { describe, it, expect } from "vitest";
import { spacing } from "./spacing";
import type { SpacingKey } from "../types/primitives";

/** All required spacing keys from the type contract */
const REQUIRED_KEYS: SpacingKey[] = [
  "0",
  "0.5",
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "20",
  "24",
  "28",
  "32",
  "36",
  "40",
  "44",
  "48",
  "52",
  "56",
  "60",
  "64",
  "72",
  "80",
  "96",
];

/** Valid CSS length: "0" or a number followed by "rem" */
const CSS_LENGTH_REGEX = /^(0|[\d.]+rem)$/;

/**
 * Parse a spacing value to its numeric rem equivalent.
 */
function toRemNumber(value: string): number {
  if (value === "0") return 0;
  return parseFloat(value.replace("rem", ""));
}

describe("spacing scale", () => {
  describe("required keys", () => {
    it("contains all required spacing keys", () => {
      for (const key of REQUIRED_KEYS) {
        expect(spacing[key]).toBeDefined();
      }
    });

    it("has exactly 34 entries", () => {
      expect(Object.keys(spacing)).toHaveLength(34);
    });
  });

  describe("valid CSS length format", () => {
    it.each(REQUIRED_KEYS)("spacing[%s] is a valid CSS length", (key) => {
      expect(spacing[key]).toMatch(CSS_LENGTH_REGEX);
    });
  });

  describe("zero handling", () => {
    it("zero is literal '0' (no unit)", () => {
      expect(spacing["0"]).toBe("0");
    });
  });

  describe("monotonic ordering", () => {
    it("values increase with key progression", () => {
      for (let i = 1; i < REQUIRED_KEYS.length; i++) {
        const prevKey = REQUIRED_KEYS[i - 1] as SpacingKey;
        const currKey = REQUIRED_KEYS[i] as SpacingKey;
        const prevVal = toRemNumber(spacing[prevKey]);
        const currVal = toRemNumber(spacing[currKey]);
        expect(currVal).toBeGreaterThan(prevVal);
      }
    });
  });

  describe("4px base rhythm", () => {
    it("key '1' equals 0.25rem (4px)", () => {
      expect(spacing["1"]).toBe("0.25rem");
    });

    it("key '4' equals 1rem (16px)", () => {
      expect(spacing["4"]).toBe("1rem");
    });

    it("key '8' equals 2rem (32px)", () => {
      expect(spacing["8"]).toBe("2rem");
    });

    it("key '16' equals 4rem (64px)", () => {
      expect(spacing["16"]).toBe("4rem");
    });
  });

  describe("public import", () => {
    it("is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.spacing).toBeDefined();
      expect(tokens.spacing["4"]).toBe("1rem");
    });
  });
});
