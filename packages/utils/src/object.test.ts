import { describe, it, expect } from "vitest";
import {
  objectKeys,
  objectEntries,
  objectFromEntries,
  pick,
  omit,
  mapValues,
  filterObject,
  hasOwn,
  removeUndefined,
  createNullObject,
} from "./object";

describe("objectKeys", () => {
  it("returns own string keys", () => {
    expect(objectKeys({ a: 1, b: 2 })).toEqual(["a", "b"]);
  });

  it("returns empty array for empty object", () => {
    expect(objectKeys({})).toEqual([]);
  });

  it("does not include inherited keys", () => {
    const parent = { inherited: true };
    const child = Object.create(parent) as Record<string, unknown>;
    child["own"] = true;
    expect(objectKeys(child)).toEqual(["own"]);
  });

  it("does not include symbol keys", () => {
    const sym = Symbol("s");
    const obj = { a: 1, [sym]: 2 };
    expect(objectKeys(obj)).toEqual(["a"]);
  });
});

describe("objectEntries", () => {
  it("returns key-value pairs", () => {
    expect(objectEntries({ x: 1, y: 2 })).toEqual([
      ["x", 1],
      ["y", 2],
    ]);
  });

  it("returns empty array for empty object", () => {
    expect(objectEntries({})).toEqual([]);
  });
});

describe("objectFromEntries", () => {
  it("creates object from entries", () => {
    const result = objectFromEntries([
      ["a", 1],
      ["b", 2],
    ]);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("works with iterable input", () => {
    const map = new Map([
      ["x", 10],
      ["y", 20],
    ]);
    expect(objectFromEntries(map)).toEqual({ x: 10, y: 20 });
  });
});

describe("pick", () => {
  it("returns object with only specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("ignores keys not present in source", () => {
    const obj = { a: 1 } as Record<string, number>;
    expect(pick(obj, ["a", "missing"])).toEqual({ a: 1 });
  });

  it("returns empty object for empty keys", () => {
    expect(pick({ a: 1, b: 2 }, [])).toEqual({});
  });

  it("does not include inherited properties", () => {
    const parent = { inherited: true };
    const child = Object.create(parent) as Record<string, boolean>;
    child["own"] = true;
    expect(pick(child, ["own", "inherited"])).toEqual({ own: true });
  });

  it("does not mutate the source", () => {
    const obj = { a: 1, b: 2 };
    const result = pick(obj, ["a"]);
    expect(result).not.toBe(obj);
    expect(obj).toEqual({ a: 1, b: 2 });
  });

  it("result has null prototype", () => {
    const result = pick({ a: 1 }, ["a"]);
    expect(Object.getPrototypeOf(result)).toBeNull();
  });
});

describe("omit", () => {
  it("returns object without specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
  });

  it("returns same shape if no keys match", () => {
    const obj = { a: 1, b: 2 };
    expect(omit(obj, [] as never[])).toEqual({ a: 1, b: 2 });
  });

  it("does not mutate the source", () => {
    const obj = { a: 1, b: 2 };
    omit(obj, ["a"]);
    expect(obj).toEqual({ a: 1, b: 2 });
  });

  it("ignores inherited properties", () => {
    const parent = { inherited: true };
    const child = Object.create(parent) as Record<string, boolean>;
    child["own"] = true;
    expect(omit(child, [])).toEqual({ own: true });
  });
});

describe("mapValues", () => {
  it("transforms values", () => {
    expect(mapValues({ a: 1, b: 2 }, (v) => v * 10)).toEqual({
      a: 10,
      b: 20,
    });
  });

  it("passes key to mapper", () => {
    const keys: string[] = [];
    mapValues({ x: 1, y: 2 }, (_, k) => {
      keys.push(k);
      return 0;
    });
    expect(keys).toEqual(["x", "y"]);
  });

  it("returns empty object for empty input", () => {
    expect(mapValues({}, () => 0)).toEqual({});
  });

  it("does not mutate the source", () => {
    const obj = { a: 1 };
    const result = mapValues(obj, (v) => v + 1);
    expect(obj).toEqual({ a: 1 });
    expect(result).toEqual({ a: 2 });
  });
});

describe("filterObject", () => {
  it("includes entries that pass predicate", () => {
    expect(filterObject({ a: 1, b: 2, c: 3 }, (v) => v > 1)).toEqual({ b: 2, c: 3 });
  });

  it("passes key to predicate", () => {
    expect(filterObject({ keep: 1, skip: 2 }, (_, k) => k === "keep")).toEqual({ keep: 1 });
  });

  it("returns empty object when nothing passes", () => {
    expect(filterObject({ a: 1 }, () => false)).toEqual({});
  });
});

describe("hasOwn", () => {
  it("returns true for own properties", () => {
    expect(hasOwn({ a: 1 }, "a")).toBe(true);
  });

  it("returns false for inherited properties", () => {
    const parent = { inherited: true };
    const child = Object.create(parent) as object;
    expect(hasOwn(child, "inherited")).toBe(false);
  });

  it("returns false for non-existent properties", () => {
    expect(hasOwn({}, "missing")).toBe(false);
  });

  it("works with null-prototype objects", () => {
    const obj = Object.create(null) as Record<string, unknown>;
    obj["key"] = "val";
    expect(hasOwn(obj, "key")).toBe(true);
    expect(hasOwn(obj, "toString")).toBe(false);
  });

  it("works with symbol keys", () => {
    const sym = Symbol("test");
    const obj = { [sym]: true };
    expect(hasOwn(obj, sym)).toBe(true);
    expect(hasOwn(obj, Symbol("other"))).toBe(false);
  });
});

describe("removeUndefined", () => {
  it("removes undefined values", () => {
    expect(removeUndefined({ a: 1, b: undefined, c: "str" })).toEqual({ a: 1, c: "str" });
  });

  it("keeps null values", () => {
    expect(removeUndefined({ a: null, b: undefined })).toEqual({ a: null });
  });

  it("keeps falsy non-undefined values", () => {
    expect(removeUndefined({ a: 0, b: "", c: false, d: undefined })).toEqual({
      a: 0,
      b: "",
      c: false,
    });
  });

  it("returns empty object when all values are undefined", () => {
    expect(removeUndefined({ a: undefined, b: undefined })).toEqual({});
  });

  it("does not mutate the source", () => {
    const obj = { a: 1, b: undefined };
    removeUndefined(obj);
    expect(obj).toEqual({ a: 1, b: undefined });
  });
});

describe("createNullObject", () => {
  it("creates object with null prototype", () => {
    const obj = createNullObject();
    expect(Object.getPrototypeOf(obj)).toBeNull();
  });

  it("copies source properties", () => {
    const result = createNullObject({ x: 10, y: 20 });
    expect(result).toEqual({ x: 10, y: 20 });
    expect(Object.getPrototypeOf(result)).toBeNull();
  });

  it("does not include prototype methods like toString", () => {
    const obj = createNullObject();
    expect("toString" in obj).toBe(false);
  });

  it("is safe from prototype pollution", () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}}') as Record<string, unknown>;
    const safe = createNullObject(malicious);
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect(safe["__proto__"]).toEqual({ polluted: true });
  });

  it("returns empty null-prototype object when no source given", () => {
    const obj = createNullObject();
    expect(Object.keys(obj)).toEqual([]);
  });
});
