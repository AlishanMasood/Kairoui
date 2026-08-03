import { describe, it, expect } from "vitest";
import { merge, mergeAll, nestedMerge } from "./merge";

describe("merge", () => {
  it("shallow merges two objects", () => {
    expect(merge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it("source overrides target for matching keys", () => {
    expect(merge({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
  });

  it("does not mutate inputs", () => {
    const target = { a: 1 };
    const source = { b: 2 };
    merge(target, source);
    expect(target).toEqual({ a: 1 });
    expect(source).toEqual({ b: 2 });
  });

  it("returns null-prototype object", () => {
    const result = merge({ a: 1 }, { b: 2 });
    expect(Object.getPrototypeOf(result)).toBeNull();
  });

  it("undefined in source explicitly overwrites", () => {
    const result = merge({ a: 1 }, { a: undefined });
    expect(result).toEqual({ a: undefined });
    expect("a" in result).toBe(true);
  });

  it("null in source replaces target value", () => {
    const result = merge({ a: 1 }, { a: null });
    expect(result).toEqual({ a: null });
  });

  it("arrays are replaced, not concatenated", () => {
    const result = merge({ items: [1, 2] }, { items: [3] });
    expect(result).toEqual({ items: [3] });
  });

  it("does not copy inherited properties", () => {
    const parent = { inherited: true };
    const source = Object.create(parent) as Record<string, unknown>;
    source["own"] = true;
    const result = merge({}, source);
    expect(result).toEqual({ own: true });
    expect("inherited" in result).toBe(false);
  });

  describe("prototype pollution protection", () => {
    it("skips __proto__ key", () => {
      const malicious = JSON.parse('{"__proto__": {"polluted": true}}') as Record<string, unknown>;
      const result = merge({}, malicious);
      expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
      expect("__proto__" in result).toBe(false);
    });

    it("skips constructor key", () => {
      const result = merge({}, { constructor: "evil" });
      expect("constructor" in result).toBe(false);
    });

    it("skips prototype key", () => {
      const result = merge({}, { prototype: "evil" });
      expect("prototype" in result).toBe(false);
    });
  });

  it("handles empty objects", () => {
    expect(merge({}, {})).toEqual({});
    expect(merge({ a: 1 }, {})).toEqual({ a: 1 });
    expect(merge({}, { b: 2 })).toEqual({ b: 2 });
  });
});

describe("mergeAll", () => {
  it("merges multiple sources left to right", () => {
    const result = mergeAll({ a: 1 }, { b: 2 }, { c: 3 });
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("later sources override earlier ones", () => {
    const result = mergeAll({ a: 1 }, { a: 2 }, { a: 3 });
    expect(result).toEqual({ a: 3 });
  });

  it("handles zero sources", () => {
    expect(mergeAll()).toEqual({});
  });

  it("handles single source", () => {
    expect(mergeAll({ a: 1 })).toEqual({ a: 1 });
  });

  it("skips prototype-polluting keys", () => {
    const malicious = JSON.parse('{"__proto__": {"bad": true}}') as Record<string, unknown>;
    mergeAll({}, malicious);
    expect(({} as Record<string, unknown>)["bad"]).toBeUndefined();
  });
});

describe("nestedMerge", () => {
  it("behaves like shallow merge for non-nested keys", () => {
    const result = nestedMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("shallow-merges values at declared nested keys", () => {
    const result = nestedMerge(
      { style: { color: "red", size: 10 } },
      { style: { color: "blue" } },
      { nestedKeys: ["style"] },
    );
    expect(result).toEqual({ style: { color: "blue", size: 10 } });
  });

  it("replaces non-object values at nested keys", () => {
    const result = nestedMerge(
      { style: "old" },
      { style: { color: "blue" } },
      { nestedKeys: ["style"] },
    );
    expect(result).toEqual({ style: { color: "blue" } });
  });

  it("replaces array values at nested keys (not merged)", () => {
    const result = nestedMerge(
      { items: { list: [1, 2] } },
      { items: { list: [3] } },
      { nestedKeys: ["items"] },
    );
    expect(result).toEqual({ items: { list: [3] } });
  });

  it("skips prototype-polluting keys in nested objects", () => {
    const malicious = JSON.parse('{"style": {"__proto__": {"bad": true}}}') as Record<
      string,
      unknown
    >;
    nestedMerge({ style: {} }, malicious, { nestedKeys: ["style"] });
    expect(({} as Record<string, unknown>)["bad"]).toBeUndefined();
  });

  it("nested result has null prototype", () => {
    const result = nestedMerge({ opts: { a: 1 } }, { opts: { b: 2 } }, { nestedKeys: ["opts"] });
    const nested = result["opts"] as object;
    expect(Object.getPrototypeOf(nested)).toBeNull();
  });

  it("works without options (same as merge)", () => {
    expect(nestedMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it("does not mutate inputs", () => {
    const target = { opts: { a: 1 } };
    const source = { opts: { b: 2 } };
    nestedMerge(target, source, { nestedKeys: ["opts"] });
    expect(target).toEqual({ opts: { a: 1 } });
    expect(source).toEqual({ opts: { b: 2 } });
  });
});
