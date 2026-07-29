import { describe, it, expect } from "vitest";
import { duration, easing } from "./motion";
import type { DurationKey, EasingKey } from "../types/primitives";

const DURATION_KEYS: DurationKey[] = ["instant", "fast", "normal", "slow", "slower"];
const EASING_KEYS: EasingKey[] = ["default", "linear", "in", "out", "inOut"];

/** Valid CSS duration: "0ms" or a number followed by "ms" or "s" */
const CSS_DURATION_REGEX = /^[\d.]+(ms|s)$/;

/** Valid CSS easing: "linear", "ease", "ease-in-out", or cubic-bezier(...) */
const CSS_EASING_REGEX =
  /^(linear|ease(-in|-out|-in-out)?|cubic-bezier\(\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+\s*\))$/;

function toMs(value: string): number {
  if (value.endsWith("ms")) return parseFloat(value);
  if (value.endsWith("s")) return parseFloat(value) * 1000;
  return 0;
}

describe("motion tokens", () => {
  describe("duration", () => {
    it("has all required duration keys", () => {
      for (const key of DURATION_KEYS) {
        expect(duration[key]).toBeDefined();
      }
    });

    it("has exactly 5 entries", () => {
      expect(Object.keys(duration)).toHaveLength(5);
    });

    it.each(DURATION_KEYS)("duration[%s] is a valid CSS duration", (key) => {
      expect(duration[key]).toMatch(CSS_DURATION_REGEX);
    });

    it("instant is 0ms", () => {
      expect(duration.instant).toBe("0ms");
    });

    it("durations increase monotonically", () => {
      for (let i = 1; i < DURATION_KEYS.length; i++) {
        const prev = DURATION_KEYS[i - 1] as DurationKey;
        const curr = DURATION_KEYS[i] as DurationKey;
        expect(toMs(duration[curr])).toBeGreaterThan(toMs(duration[prev]));
      }
    });

    it("fast is ≤ 150ms (feels instant to user)", () => {
      expect(toMs(duration.fast)).toBeLessThanOrEqual(150);
    });

    it("slower is ≤ 500ms (never feels sluggish)", () => {
      expect(toMs(duration.slower)).toBeLessThanOrEqual(500);
    });
  });

  describe("easing", () => {
    it("has all required easing keys", () => {
      for (const key of EASING_KEYS) {
        expect(easing[key]).toBeDefined();
      }
    });

    it("has exactly 5 entries", () => {
      expect(Object.keys(easing)).toHaveLength(5);
    });

    it.each(EASING_KEYS)("easing[%s] is a valid CSS easing function", (key) => {
      expect(easing[key]).toMatch(CSS_EASING_REGEX);
    });

    it("linear is literal 'linear'", () => {
      expect(easing.linear).toBe("linear");
    });

    it("all cubic-bezier values have 4 control points", () => {
      const cubicKeys = EASING_KEYS.filter((k) => easing[k].startsWith("cubic-bezier"));
      for (const key of cubicKeys) {
        const match = easing[key].match(/cubic-bezier\(([^)]+)\)/);
        expect(match).not.toBeNull();
        const points = match?.[1]?.split(",") ?? [];
        expect(points).toHaveLength(4);
      }
    });
  });

  describe("public import", () => {
    it("motion tokens are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.duration).toBeDefined();
      expect(tokens.easing).toBeDefined();
      expect(tokens.duration.fast).toBe("100ms");
      expect(tokens.easing.default).toContain("cubic-bezier");
    });
  });
});
