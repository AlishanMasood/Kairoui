import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsMounted } from "./use-is-mounted";

describe("useIsMounted", () => {
  it("returns a function", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current).toBeTypeOf("function");
  });

  it("returns true after mount", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current()).toBe(true);
  });

  it("returns false after unmount", () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    const isMounted = result.current;
    unmount();
    expect(isMounted()).toBe(false);
  });

  it("function reference is stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useIsMounted());
    const ref1 = result.current;
    rerender();
    expect(result.current).toBe(ref1);
  });

  it("remains true across re-renders", () => {
    const { result, rerender } = renderHook(() => useIsMounted());
    rerender();
    rerender();
    expect(result.current()).toBe(true);
  });

  it("transitions: false → true → false", () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    // After mount, it's true
    expect(result.current()).toBe(true);
    // After unmount, it's false
    unmount();
    expect(result.current()).toBe(false);
  });
});
