import { describe, it, expect } from "vitest";
import { mergeStyles } from "./merge-styles";
import type { StyleObject } from "./merge-styles";

describe("mergeStyles", () => {
  describe("basic merging", () => {
    it("merges two style objects", () => {
      expect(mergeStyles({ color: "red" }, { fontSize: 14 })).toEqual({
        color: "red",
        fontSize: 14,
      });
    });

    it("later sources override earlier for same property", () => {
      expect(mergeStyles({ color: "red" }, { color: "blue" })).toEqual({
        color: "blue",
      });
    });

    it("merges multiple sources left to right", () => {
      expect(mergeStyles({ padding: 10 }, { margin: 5 }, { padding: 20, color: "green" })).toEqual({
        padding: 20,
        margin: 5,
        color: "green",
      });
    });
  });

  describe("consumer precedence", () => {
    it("consumer style overrides internal", () => {
      const internal: StyleObject = { color: "gray", padding: 8 };
      const consumer: StyleObject = { color: "red" };
      const result = mergeStyles(internal, consumer);
      expect(result).toEqual({ color: "red", padding: 8 });
    });

    it("slot style overrides consumer", () => {
      const consumer: StyleObject = { color: "red" };
      const slot: StyleObject = { color: "blue" };
      expect(mergeStyles(consumer, slot)).toEqual({ color: "blue" });
    });
  });

  describe("CSS custom properties", () => {
    it("supports CSS variables", () => {
      const result = mergeStyles({ "--my-color": "red" }, { padding: 10 });
      expect(result).toEqual({ "--my-color": "red", padding: 10 });
    });

    it("later source overrides CSS variable", () => {
      const result = mergeStyles({ "--spacing": "8px" }, { "--spacing": "16px" });
      expect(result).toEqual({ "--spacing": "16px" });
    });

    it("preserves CSS variables from all sources", () => {
      const result = mergeStyles({ "--a": "1" }, { "--b": "2" });
      expect(result).toEqual({ "--a": "1", "--b": "2" });
    });
  });

  describe("undefined and empty handling", () => {
    it("returns undefined for all undefined sources", () => {
      expect(mergeStyles(undefined, null, undefined)).toBeUndefined();
    });

    it("returns undefined for no sources", () => {
      expect(mergeStyles()).toBeUndefined();
    });

    it("returns undefined for empty objects", () => {
      expect(mergeStyles({}, {})).toBeUndefined();
    });

    it("skips undefined sources in the middle", () => {
      expect(mergeStyles({ color: "red" }, undefined, { padding: 5 })).toEqual({
        color: "red",
        padding: 5,
      });
    });

    it("returns single source directly when only one is non-empty", () => {
      const style: StyleObject = { color: "red" };
      const result = mergeStyles(undefined, style, null);
      expect(result).toBe(style);
    });
  });

  describe("immutability", () => {
    it("does not mutate input objects", () => {
      const a: StyleObject = { color: "red" };
      const b: StyleObject = { color: "blue", padding: 10 };
      const aSnapshot = { ...a };
      const bSnapshot = { ...b };
      mergeStyles(a, b);
      expect(a).toEqual(aSnapshot);
      expect(b).toEqual(bSnapshot);
    });

    it("result is a new object when multiple sources merge", () => {
      const a: StyleObject = { color: "red" };
      const b: StyleObject = { padding: 10 };
      const result = mergeStyles(a, b);
      expect(result).not.toBe(a);
      expect(result).not.toBe(b);
    });
  });

  describe("type support", () => {
    it("accepts numeric values", () => {
      expect(mergeStyles({ width: 100, height: 50 })).toEqual({ width: 100, height: 50 });
    });

    it("accepts string values", () => {
      expect(mergeStyles({ display: "flex", justifyContent: "center" })).toEqual({
        display: "flex",
        justifyContent: "center",
      });
    });
  });
});
