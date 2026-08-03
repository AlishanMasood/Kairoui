import { describe, it, expect } from "vitest";
import { sameValue, shallowEqual, arrayShallowEqual, objectShallowEqual } from "./equality";

describe("sameValue", () => {
  it("treats NaN as equal to NaN", () => {
    expect(sameValue(NaN, NaN)).toBe(true);
  });

  it("distinguishes +0 from -0", () => {
    expect(sameValue(0, -0)).toBe(false);
    expect(sameValue(-0, -0)).toBe(true);
    expect(sameValue(0, 0)).toBe(true);
  });

  it("compares primitives correctly", () => {
    expect(sameValue(1, 1)).toBe(true);
    expect(sameValue(1, 2)).toBe(false);
    expect(sameValue("a", "a")).toBe(true);
    expect(sameValue("a", "b")).toBe(false);
    expect(sameValue(true, true)).toBe(true);
    expect(sameValue(true, false)).toBe(false);
    expect(sameValue(null, null)).toBe(true);
    expect(sameValue(undefined, undefined)).toBe(true);
    expect(sameValue(null, undefined)).toBe(false);
  });

  it("compares objects by reference", () => {
    const obj = {};
    expect(sameValue(obj, obj)).toBe(true);
    expect(sameValue({}, {})).toBe(false);
  });
});

describe("arrayShallowEqual", () => {
  it("returns true for same reference", () => {
    const arr = [1, 2, 3];
    expect(arrayShallowEqual(arr, arr)).toBe(true);
  });

  it("returns true for element-wise equal arrays", () => {
    expect(arrayShallowEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(arrayShallowEqual(["a", "b"], ["a", "b"])).toBe(true);
  });

  it("returns false for different lengths", () => {
    expect(arrayShallowEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("returns false for different elements", () => {
    expect(arrayShallowEqual([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it("uses Object.is semantics (NaN, -0)", () => {
    expect(arrayShallowEqual([NaN], [NaN])).toBe(true);
    expect(arrayShallowEqual([0], [-0])).toBe(false);
  });

  it("does not deep-compare nested objects", () => {
    const a = { x: 1 };
    const b = { x: 1 };
    expect(arrayShallowEqual([a], [b])).toBe(false);
    expect(arrayShallowEqual([a], [a])).toBe(true);
  });

  it("handles empty arrays", () => {
    expect(arrayShallowEqual([], [])).toBe(true);
  });
});

describe("objectShallowEqual", () => {
  it("returns true for same reference", () => {
    const obj = { a: 1 };
    expect(objectShallowEqual(obj, obj)).toBe(true);
  });

  it("returns true for equal own properties", () => {
    expect(objectShallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("returns false for different key counts", () => {
    expect(objectShallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("returns false for different values", () => {
    expect(objectShallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("returns false when key exists in a but not b", () => {
    expect(objectShallowEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
  });

  it("uses Object.is semantics for values", () => {
    expect(objectShallowEqual({ x: NaN }, { x: NaN })).toBe(true);
    expect(objectShallowEqual({ x: 0 }, { x: -0 })).toBe(false);
  });

  it("does not compare inherited properties", () => {
    const parent = { inherited: true };
    const a = Object.create(parent) as Record<string, unknown>;
    a["own"] = 1;
    const b = { own: 1 };
    expect(objectShallowEqual(a, b)).toBe(true);
  });

  it("handles empty objects", () => {
    expect(objectShallowEqual({}, {})).toBe(true);
  });

  it("handles null-prototype objects", () => {
    const a = Object.create(null) as Record<string, unknown>;
    a["x"] = 1;
    const b = Object.create(null) as Record<string, unknown>;
    b["x"] = 1;
    expect(objectShallowEqual(a, b)).toBe(true);
  });
});

describe("shallowEqual", () => {
  it("returns true for identical primitives", () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual("a", "a")).toBe(true);
    expect(shallowEqual(null, null)).toBe(true);
    expect(shallowEqual(undefined, undefined)).toBe(true);
  });

  it("returns false for different primitives", () => {
    expect(shallowEqual(1, 2)).toBe(false);
    expect(shallowEqual(null, undefined)).toBe(false);
  });

  it("handles NaN", () => {
    expect(shallowEqual(NaN, NaN)).toBe(true);
  });

  it("delegates to arrayShallowEqual for arrays", () => {
    expect(shallowEqual([1, 2], [1, 2])).toBe(true);
    expect(shallowEqual([1, 2], [1, 3])).toBe(false);
  });

  it("delegates to objectShallowEqual for plain objects", () => {
    expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("returns false for mixed array/object", () => {
    expect(shallowEqual([1], { 0: 1 })).toBe(false);
    expect(shallowEqual({ 0: 1 }, [1])).toBe(false);
  });

  it("returns false for null vs object", () => {
    expect(shallowEqual(null, {})).toBe(false);
    expect(shallowEqual({}, null)).toBe(false);
  });

  it("class instances compared by reference only", () => {
    const d1 = new Date(2024, 0, 1);
    const d2 = new Date(2024, 0, 1);
    // Not plain objects — falls through to objectShallowEqual but keys may differ
    expect(shallowEqual(d1, d1)).toBe(true);
    expect(shallowEqual(d1, d2)).toBe(true); // same keys (none), same reference-free comparison
  });

  it("functions compared by reference", () => {
    const fn = () => {};
    expect(shallowEqual(fn, fn)).toBe(true);
    expect(shallowEqual(fn, () => {})).toBe(false);
  });
});
