import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "./use-media-query";

// Mock matchMedia
function createMockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = [];
  const mql = {
    matches,
    media: "",
    addEventListener: vi.fn((_event: string, handler: () => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn((_event: string, handler: () => void) => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
    dispatchChange(newMatches: boolean) {
      mql.matches = newMatches;
      for (const listener of listeners) {
        listener();
      }
    },
  };
  return mql;
}

describe("useMediaQuery", () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("returns true when media query matches", () => {
    const mql = createMockMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mql);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when media query does not match", () => {
    const mql = createMockMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mql);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("updates when match state changes", () => {
    const mql = createMockMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mql);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
    act(() => {
      mql.dispatchChange(true);
    });
    expect(result.current).toBe(true);
  });

  it("cleans up listener on unmount", () => {
    const mql = createMockMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mql);
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalled();
  });

  it("re-subscribes when query changes", () => {
    const mql1 = createMockMatchMedia(true);
    const mql2 = createMockMatchMedia(false);
    window.matchMedia = vi.fn((q: string) => (q.includes("768") ? mql1 : mql2));
    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: "(min-width: 768px)" },
    });
    expect(result.current).toBe(true);
    rerender({ query: "(min-width: 1024px)" });
    expect(result.current).toBe(false);
    expect(mql1.removeEventListener).toHaveBeenCalled();
  });

  it("uses defaultMatches when matchMedia is unavailable", () => {
    // @ts-expect-error -- intentionally removing matchMedia for test
    window.matchMedia = undefined;
    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)", { defaultMatches: true }),
    );
    expect(result.current).toBe(true);
  });

  it("defaults to false when no options provided and no matchMedia", () => {
    // @ts-expect-error -- intentionally removing matchMedia for test
    window.matchMedia = undefined;
    const { result } = renderHook(() => useMediaQuery("(prefers-color-scheme: dark)"));
    expect(result.current).toBe(false);
  });
});
