import { describe, it, expect } from "vitest";
import {
  toArray,
  compact,
  unique,
  uniqueBy,
  groupBy,
  partition,
  clampIndex,
  moveItem,
  arrayEqual,
  last,
  first,
} from "./array";

describe("toArray", () => {
  it("wraps a single value in an array", () => {
    expect(toArray(1)).toEqual([1]);
    expect(toArray("str")).toEqual(["str"]);
    expect(toArray(null)).toEqual([null]);
  });

  it("returns a copy if already an array", () => {
    const arr = [1, 2, 3];
    const result = toArray(arr);
    expect(result).toEqual([1, 2, 3]);
    expect(result).not.toBe(arr);
  });

  it("handles readonly arrays", () => {
    const readonly: readonly number[] = [1, 2];
    expect(toArray(readonly)).toEqual([1, 2]);
  });
});

describe("compact", () => {
  it("removes null and undefined", () => {
    expect(compact([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
  });

  it("keeps falsy non-nullish values", () => {
    expect(compact([0, "", false, null, undefined])).toEqual([0, "", false]);
  });

  it("returns empty array for all-nullish input", () => {
    expect(compact([null, undefined, null])).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(compact([])).toEqual([]);
  });
});

describe("unique", () => {
  it("removes duplicate primitives", () => {
    expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
  });

  it("preserves insertion order", () => {
    expect(unique(["b", "a", "b", "c"])).toEqual(["b", "a", "c"]);
  });

  it("does not deduplicate objects by value", () => {
    const a = { id: 1 };
    const b = { id: 1 };
    expect(unique([a, b, a])).toEqual([a, b]);
  });

  it("handles empty arrays", () => {
    expect(unique([])).toEqual([]);
  });
});

describe("uniqueBy", () => {
  it("deduplicates by key function", () => {
    const items = [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
      { id: 1, name: "c" },
    ];
    expect(uniqueBy(items, (i) => i.id)).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
  });

  it("keeps first occurrence", () => {
    expect(uniqueBy([1, 2, 3, 4], (n) => n % 2)).toEqual([1, 2]);
  });

  it("handles empty arrays", () => {
    expect(uniqueBy([], () => 0)).toEqual([]);
  });
});

describe("groupBy", () => {
  it("groups by key function", () => {
    const result = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? "even" : "odd"));
    expect(result).toEqual({ odd: [1, 3, 5], even: [2, 4] });
  });

  it("preserves order within groups", () => {
    const items = ["apple", "avocado", "banana", "apricot"];
    const result = groupBy(items, (s) => s[0]!);
    expect(result["a"]).toEqual(["apple", "avocado", "apricot"]);
    expect(result["b"]).toEqual(["banana"]);
  });

  it("handles empty arrays", () => {
    expect(groupBy([], () => "x")).toEqual({});
  });
});

describe("partition", () => {
  it("splits into pass and fail", () => {
    expect(partition([1, 2, 3, 4, 5], (n) => n > 3)).toEqual([
      [4, 5],
      [1, 2, 3],
    ]);
  });

  it("all pass", () => {
    expect(partition([1, 2], () => true)).toEqual([[1, 2], []]);
  });

  it("all fail", () => {
    expect(partition([1, 2], () => false)).toEqual([[], [1, 2]]);
  });

  it("empty input", () => {
    expect(partition([], () => true)).toEqual([[], []]);
  });
});

describe("clampIndex", () => {
  it("returns index unchanged when in bounds", () => {
    expect(clampIndex(2, 5)).toBe(2);
  });

  it("clamps negative to 0", () => {
    expect(clampIndex(-5, 5)).toBe(0);
  });

  it("clamps beyond length to length-1", () => {
    expect(clampIndex(10, 5)).toBe(4);
  });

  it("returns -1 for empty arrays", () => {
    expect(clampIndex(0, 0)).toBe(-1);
  });

  it("truncates fractional indices", () => {
    expect(clampIndex(2.9, 5)).toBe(2);
  });
});

describe("moveItem", () => {
  it("moves item forward", () => {
    expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
  });

  it("moves item backward", () => {
    expect(moveItem([1, 2, 3, 4], 3, 1)).toEqual([1, 4, 2, 3]);
  });

  it("does not mutate the original", () => {
    const arr = [1, 2, 3];
    moveItem(arr, 0, 2);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("clamps out-of-bounds indices", () => {
    expect(moveItem([1, 2, 3], -1, 10)).toEqual([2, 3, 1]);
  });

  it("returns empty array for empty input", () => {
    expect(moveItem([], 0, 1)).toEqual([]);
  });

  it("same position is no-op", () => {
    expect(moveItem([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
  });
});

describe("arrayEqual", () => {
  it("returns true for identical arrays", () => {
    const arr = [1, 2, 3];
    expect(arrayEqual(arr, arr)).toBe(true);
  });

  it("returns true for equal arrays", () => {
    expect(arrayEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it("returns false for different lengths", () => {
    expect(arrayEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("returns false for different elements", () => {
    expect(arrayEqual([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it("uses strict equality (objects not deep-compared)", () => {
    const a = { x: 1 };
    const b = { x: 1 };
    expect(arrayEqual([a], [b])).toBe(false);
    expect(arrayEqual([a], [a])).toBe(true);
  });

  it("handles empty arrays", () => {
    expect(arrayEqual([], [])).toBe(true);
  });
});

describe("last", () => {
  it("returns last element", () => {
    expect(last([1, 2, 3])).toBe(3);
  });

  it("returns undefined for empty array", () => {
    const result = last([] as number[]);
    expect(result).toBeUndefined();
  });

  it("works with single element", () => {
    expect(last(["only"])).toBe("only");
  });
});

describe("first", () => {
  it("returns first element", () => {
    expect(first([1, 2, 3])).toBe(1);
  });

  it("returns undefined for empty array", () => {
    const result = first([] as number[]);
    expect(result).toBeUndefined();
  });

  it("works with single element", () => {
    expect(first(["only"])).toBe("only");
  });
});
