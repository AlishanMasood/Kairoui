import { describe, it, expect } from "vitest";
import { breakpoint } from "./breakpoints";
import type { BreakpointKey } from "../types/primitives";

const BREAKPOINT_KEYS: BreakpointKey[] = ["xs", "sm", "md", "lg", "xl", "2xl"];

/** Valid CSS pixel length */
const PX_REGEX = /^[\d]+px$/;

function toPx(value: string): number {
  return parseInt(value, 10);
}

describe("breakpoint tokens", () => {
  describe("required keys", () => {
    it("has all required breakpoint keys", () => {
      for (const key of BREAKPOINT_KEYS) {
        expect(breakpoint[key]).toBeDefined();
      }
    });

    it("has exactly 6 entries", () => {
      expect(Object.keys(breakpoint)).toHaveLength(6);
    });
  });

  describe("valid CSS format", () => {
    it.each(BREAKPOINT_KEYS)("breakpoint[%s] is a valid px value", (key) => {
      expect(breakpoint[key]).toMatch(PX_REGEX);
    });
  });

  describe("ascending order", () => {
    it("breakpoints increase monotonically", () => {
      for (let i = 1; i < BREAKPOINT_KEYS.length; i++) {
        const prev = BREAKPOINT_KEYS[i - 1] as BreakpointKey;
        const curr = BREAKPOINT_KEYS[i] as BreakpointKey;
        expect(toPx(breakpoint[curr])).toBeGreaterThan(toPx(breakpoint[prev]));
      }
    });
  });

  describe("reasonable values", () => {
    it("xs starts at mobile landscape (~480px)", () => {
      expect(toPx(breakpoint.xs)).toBeGreaterThanOrEqual(320);
      expect(toPx(breakpoint.xs)).toBeLessThanOrEqual(640);
    });

    it("lg covers standard desktop (~1024px)", () => {
      expect(toPx(breakpoint.lg)).toBe(1024);
    });

    it("2xl covers ultra-wide enterprise screens", () => {
      expect(toPx(breakpoint["2xl"])).toBeGreaterThanOrEqual(1440);
    });
  });

  describe("public import", () => {
    it("breakpoint is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.breakpoint).toBeDefined();
      expect(tokens.breakpoint.lg).toBe("1024px");
    });
  });
});
