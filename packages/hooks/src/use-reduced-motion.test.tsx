import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "./use-reduced-motion";

function createMockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = [];
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn((_: string, handler: () => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn(),
    dispatchChange(newMatches: boolean) {
      mql.matches = newMatches;
      for (const l of listeners) l();
    },
  };
  return mql;
}

describe("useReducedMotion", () => {
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

  it("returns false when motion is not reduced", () => {
    const mql = createMockMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mql);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when motion is reduced", () => {
    const mql = createMockMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mql);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when system preference changes", () => {
    const mql = createMockMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mql);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      mql.dispatchChange(true);
    });
    expect(result.current).toBe(true);
  });

  it("defaults to false when matchMedia is unavailable (SSR)", () => {
    // @ts-expect-error — intentionally removing
    window.matchMedia = undefined;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
