import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGlobalSearch } from "./use-global-search";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useGlobalSearch", () => {
  it("starts empty by default", () => {
    const { result } = renderHook(() => useGlobalSearch());
    expect(result.current.input).toBe("");
    expect(result.current.debounced).toBe("");
  });

  it("accepts an initial value", () => {
    const { result } = renderHook(() => useGlobalSearch({ initial: "hi" }));
    expect(result.current.input).toBe("hi");
    expect(result.current.debounced).toBe("hi");
  });

  it("input updates immediately, debounced trails by delayMs", () => {
    const { result } = renderHook(() => useGlobalSearch({ delayMs: 200 }));
    act(() => {
      result.current.setInput("abc");
    });
    expect(result.current.input).toBe("abc");
    expect(result.current.debounced).toBe("");
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debounced).toBe("abc");
  });

  it("collapses rapid typing into a single debounced update", () => {
    const { result } = renderHook(() => useGlobalSearch({ delayMs: 100 }));
    act(() => {
      result.current.setInput("a");
    });
    act(() => {
      vi.advanceTimersByTime(50);
      result.current.setInput("ab");
    });
    act(() => {
      vi.advanceTimersByTime(50);
      result.current.setInput("abc");
    });
    // Only 50 ms elapsed since the last update — still pending.
    expect(result.current.debounced).toBe("");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.debounced).toBe("abc");
  });

  it("clear resets both input and debounced immediately", () => {
    const { result } = renderHook(() => useGlobalSearch({ initial: "seed" }));
    act(() => {
      result.current.setInput("changed");
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.input).toBe("");
    expect(result.current.debounced).toBe("");
  });
});
