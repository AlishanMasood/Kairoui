import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePrevious, useLatest } from "./use-previous";

describe("usePrevious", () => {
  it("returns undefined on first render", () => {
    const { result } = renderHook(() => usePrevious("initial"));
    expect(result.current).toBeUndefined();
  });

  it("returns previous value after update", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: "first" },
    });
    expect(result.current).toBeUndefined();
    rerender({ value: "second" });
    expect(result.current).toBe("first");
  });

  it("tracks multiple updates", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });
    expect(result.current).toBeUndefined();
    rerender({ value: 2 });
    expect(result.current).toBe(1);
    rerender({ value: 3 });
    expect(result.current).toBe(2);
    rerender({ value: 4 });
    expect(result.current).toBe(3);
  });

  it("works with objects (tracks by reference)", () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: obj1 },
    });
    expect(result.current).toBeUndefined();
    rerender({ value: obj2 });
    expect(result.current).toBe(obj1);
  });

  it("returns undefined when value stays the same", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: "same" },
    });
    expect(result.current).toBeUndefined();
    rerender({ value: "same" });
    // After first rerender, previous is "same" from the first render
    expect(result.current).toBe("same");
  });
});

describe("useLatest", () => {
  it("returns a ref with the initial value", () => {
    const { result } = renderHook(() => useLatest("hello"));
    expect(result.current.current).toBe("hello");
  });

  it("ref identity is stable across renders", () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: "first" },
    });
    const ref1 = result.current;
    rerender({ value: "second" });
    expect(result.current).toBe(ref1);
  });

  it("ref.current reflects the latest value after commit", () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: 1 },
    });
    rerender({ value: 2 });
    expect(result.current.current).toBe(2);
    rerender({ value: 3 });
    expect(result.current.current).toBe(3);
  });

  it("works with functions", () => {
    const fn1 = () => "a";
    const fn2 = () => "b";
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: fn1 },
    });
    expect(result.current.current).toBe(fn1);
    rerender({ value: fn2 });
    expect(result.current.current).toBe(fn2);
  });

  it("works with null values", () => {
    const initial: { value: string | null } = { value: "hello" };
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: initial,
    });
    rerender({ value: null });
    expect(result.current.current).toBeNull();
  });
});
