import { describe, it, expect } from "vitest";
import {
  isDefined,
  isNullish,
  isString,
  isNumber,
  isFiniteNumber,
  isBoolean,
  isFunction,
  isObject,
  isPlainObject,
  isPromiseLike,
} from "./type-guards";

describe("isDefined", () => {
  it("returns true for non-null/undefined values", () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined("")).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined({})).toBe(true);
    expect(isDefined([])).toBe(true);
  });

  it("returns false for null and undefined", () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });

  it("narrows type", () => {
    const value: string | null = "test";
    if (isDefined(value)) {
      const _len: number = value.length;
      expect(_len).toBe(4);
    }
  });
});

describe("isNullish", () => {
  it("returns true for null and undefined", () => {
    expect(isNullish(null)).toBe(true);
    expect(isNullish(undefined)).toBe(true);
  });

  it("returns false for falsy non-nullish values", () => {
    expect(isNullish(0)).toBe(false);
    expect(isNullish("")).toBe(false);
    expect(isNullish(false)).toBe(false);
    expect(isNullish(NaN)).toBe(false);
  });
});

describe("isString", () => {
  it("returns true for primitive strings", () => {
    expect(isString("")).toBe(true);
    expect(isString("hello")).toBe(true);
  });

  it("returns false for non-strings", () => {
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);

    expect(isString(new String("boxed"))).toBe(false);
  });
});

describe("isNumber", () => {
  it("returns true for all numbers including NaN and Infinity", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-1)).toBe(true);
    expect(isNumber(3.14)).toBe(true);
    expect(isNumber(NaN)).toBe(true);
    expect(isNumber(Infinity)).toBe(true);
    expect(isNumber(-Infinity)).toBe(true);
  });

  it("returns false for non-numbers", () => {
    expect(isNumber("123")).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);

    expect(isNumber(new Number(5))).toBe(false);
  });
});

describe("isFiniteNumber", () => {
  it("returns true for finite numbers", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(-1)).toBe(true);
    expect(isFiniteNumber(3.14)).toBe(true);
    expect(isFiniteNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it("returns false for NaN and Infinity", () => {
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
  });

  it("returns false for non-numbers", () => {
    expect(isFiniteNumber("3.14")).toBe(false);
    expect(isFiniteNumber(null)).toBe(false);
  });
});

describe("isBoolean", () => {
  it("returns true for primitive booleans", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
  });

  it("returns false for non-booleans", () => {
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean("true")).toBe(false);
    expect(isBoolean(null)).toBe(false);

    expect(isBoolean(new Boolean(true))).toBe(false);
  });
});

describe("isFunction", () => {
  it("returns true for functions", () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(function named() {})).toBe(true);
    expect(isFunction(Date)).toBe(true);
    expect(isFunction(async () => {})).toBe(true);
  });

  it("returns false for non-functions", () => {
    expect(isFunction({})).toBe(false);
    expect(isFunction(null)).toBe(false);
    expect(isFunction("function")).toBe(false);
  });
});

describe("isObject", () => {
  it("returns true for objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
    expect(isObject(new Date())).toBe(true);
    expect(isObject(/regex/)).toBe(true);
    expect(isObject(Object.create(null))).toBe(true);
  });

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isObject(42)).toBe(false);
    expect(isObject("str")).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(Symbol("s"))).toBe(false);
  });
});

describe("isPlainObject", () => {
  it("returns true for plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject(new Object())).toBe(true);
  });

  it("returns false for class instances", () => {
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(/regex/)).toBe(false);
    expect(isPlainObject(new Map())).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it("returns false for null and primitives", () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(42)).toBe(false);
    expect(isPlainObject("str")).toBe(false);
  });
});

describe("isPromiseLike", () => {
  it("returns true for native Promises", () => {
    expect(isPromiseLike(Promise.resolve())).toBe(true);
    expect(isPromiseLike(new Promise(() => {}))).toBe(true);
  });

  it("returns true for thenable objects", () => {
    expect(isPromiseLike({ then: () => {} })).toBe(true);
  });

  it("returns false for non-thenables", () => {
    expect(isPromiseLike({})).toBe(false);
    expect(isPromiseLike(null)).toBe(false);
    expect(isPromiseLike(undefined)).toBe(false);
    expect(isPromiseLike(42)).toBe(false);
    expect(isPromiseLike({ then: "not a function" })).toBe(false);
  });
});
