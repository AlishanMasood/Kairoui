import { describe, it, expect } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  describe("strings", () => {
    it("returns a single string", () => {
      expect(cx("foo")).toBe("foo");
    });

    it("joins multiple strings", () => {
      expect(cx("foo", "bar", "baz")).toBe("foo bar baz");
    });

    it("skips empty strings", () => {
      expect(cx("foo", "", "bar")).toBe("foo bar");
    });
  });

  describe("falsy values", () => {
    it("skips null", () => {
      expect(cx("foo", null, "bar")).toBe("foo bar");
    });

    it("skips undefined", () => {
      expect(cx("foo", undefined, "bar")).toBe("foo bar");
    });

    it("skips false", () => {
      expect(cx("foo", false, "bar")).toBe("foo bar");
    });

    it("skips true (boolean true is not a class name)", () => {
      expect(cx("foo", true, "bar")).toBe("foo bar");
    });
  });

  describe("numbers", () => {
    it("includes numbers as strings", () => {
      expect(cx("foo", 42)).toBe("foo 42");
    });

    it("includes zero", () => {
      expect(cx("foo", 0)).toBe("foo 0");
    });
  });

  describe("conditional objects", () => {
    it("includes keys with truthy values", () => {
      expect(cx({ "is-active": true, "is-disabled": false })).toBe("is-active");
    });

    it("includes keys with truthy non-boolean values", () => {
      expect(cx({ foo: 1, bar: "", baz: "yes" })).toBe("foo baz");
    });

    it("handles empty objects", () => {
      expect(cx({})).toBe("");
    });

    it("handles object with all falsy values", () => {
      expect(cx({ a: false, b: null, c: 0, d: undefined, e: "" })).toBe("");
    });
  });

  describe("arrays", () => {
    it("flattens arrays", () => {
      expect(cx(["foo", "bar"])).toBe("foo bar");
    });

    it("flattens nested arrays", () => {
      expect(cx(["foo", ["bar", ["baz"]]])).toBe("foo bar baz");
    });

    it("handles mixed arrays", () => {
      expect(cx(["foo", null, { active: true }])).toBe("foo active");
    });

    it("handles empty arrays", () => {
      expect(cx([])).toBe("");
    });
  });

  describe("mixed inputs", () => {
    it("handles typical component usage", () => {
      const active = Boolean(Date.now());
      const disabled = false as boolean;
      expect(cx("kui-button", active && "is-active", { "is-disabled": disabled })).toBe(
        "kui-button is-active",
      );
    });

    it("handles complex mixed inputs", () => {
      expect(cx("base", ["nested", { conditional: true }], null, "end")).toBe(
        "base nested conditional end",
      );
    });

    it("returns empty string for all-falsy inputs", () => {
      expect(cx(null, undefined, false, "", [])).toBe("");
    });

    it("returns empty string for no inputs", () => {
      expect(cx()).toBe("");
    });
  });

  describe("order", () => {
    it("preserves insertion order", () => {
      expect(cx("c", "a", "b")).toBe("c a b");
    });

    it("preserves object key order", () => {
      expect(cx({ z: true, a: true, m: true })).toBe("z a m");
    });
  });
});
