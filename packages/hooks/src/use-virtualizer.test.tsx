import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode, createRef, type ReactNode } from "react";
import { renderHook, act, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useVirtualizer } from "./use-virtualizer";

afterEach(cleanup);

// ─── Helpers ───────────────────────────────────────────────────────

function makeScrollEl({
  clientHeight,
  scrollTop = 0,
}: {
  clientHeight: number;
  scrollTop?: number;
}): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (v: number) => {
      scrollTop = v;
    },
  });
  return el;
}

// ─── RAF stubbing ─────────────────────────────────────────────────

const rafQueue: FrameRequestCallback[] = [];
let originalRAF: typeof globalThis.requestAnimationFrame;
let originalCancel: typeof globalThis.cancelAnimationFrame;

beforeEach(() => {
  rafQueue.length = 0;
  originalRAF = globalThis.requestAnimationFrame;
  originalCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  };
  globalThis.cancelAnimationFrame = (handle: number) => {
    rafQueue.splice(handle - 1, 1);
  };
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalRAF;
  globalThis.cancelAnimationFrame = originalCancel;
});

function flushRAF(): void {
  const pending = rafQueue.splice(0);
  for (const cb of pending) cb(0);
}

// ─── ready flip ───────────────────────────────────────────────────

describe("useVirtualizer: ready flag", () => {
  it("stays not-ready when initialViewportHeight is seeded but the scroll parent is unresolved", () => {
    const scrollParentRef = createRef<HTMLElement>();
    const { result } = renderHook(() =>
      useVirtualizer({
        count: 100,
        rowHeight: 40,
        scrollParentRef,
        initialViewportHeight: 400,
      }),
    );
    // Without a mounted scroll parent, ready remains false regardless of the seed.
    expect(result.current.ready).toBe(false);
    // The seed still narrows the range immediately so SSR / hydration match.
    expect(result.current.endIndex).toBe(13);
  });

  it("flips ready to true after the scroll parent is observed", () => {
    const el = makeScrollEl({ clientHeight: 400 });
    const scrollParentRef = { current: el } as { current: HTMLElement | null };
    const { result } = renderHook(() =>
      useVirtualizer({ count: 100, rowHeight: 40, scrollParentRef }),
    );
    expect(result.current.ready).toBe(true);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBeGreaterThan(0);
  });

  it("stays not-ready when the scroll parent ref never resolves", () => {
    const scrollParentRef = createRef<HTMLElement>();
    const { result } = renderHook(() =>
      useVirtualizer({ count: 100, rowHeight: 40, scrollParentRef }),
    );
    expect(result.current.ready).toBe(false);
    // Without dimensions, the range covers everything (safe fallback).
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(100);
  });
});

// ─── SSR ──────────────────────────────────────────────────────────

describe("useVirtualizer: SSR-safe", () => {
  it("renders every row on the server (no windowing)", () => {
    function Probe(): ReactNode {
      const scrollParentRef = createRef<HTMLElement>();
      const range = useVirtualizer({
        count: 500,
        rowHeight: 40,
        scrollParentRef,
      });
      return `${String(range.startIndex)}-${String(range.endIndex)}-${String(range.ready)}`;
    }
    const html = renderToString(<Probe />);
    expect(html).toBe("0-500-false");
  });

  it("respects initialViewportHeight on the server", () => {
    function Probe(): ReactNode {
      const scrollParentRef = createRef<HTMLElement>();
      const range = useVirtualizer({
        count: 500,
        rowHeight: 40,
        scrollParentRef,
        initialViewportHeight: 400,
      });
      return `${String(range.startIndex)}-${String(range.endIndex)}`;
    }
    const html = renderToString(<Probe />);
    // 400 / 40 = 10 visible, plus overscan 3 on the tail. Start = 0.
    expect(html).toBe("0-13");
  });
});

// ─── Scroll behavior ──────────────────────────────────────────────

describe("useVirtualizer: scroll", () => {
  it("subscribes a passive scroll listener on the scroll parent", () => {
    const el = makeScrollEl({ clientHeight: 400 });
    const addSpy = vi.spyOn(el, "addEventListener");
    const scrollParentRef = { current: el } as { current: HTMLElement | null };
    renderHook(() => useVirtualizer({ count: 100, rowHeight: 40, scrollParentRef }));
    const scrollCall = addSpy.mock.calls.find(([type]) => type === "scroll");
    expect(scrollCall).toBeDefined();
    const opts = scrollCall?.[2];
    expect(opts).toEqual(expect.objectContaining({ passive: true }));
  });

  it("recomputes the range after a scroll event flushes on the next frame", () => {
    let scrollTop = 0;
    const el = makeScrollEl({ clientHeight: 400 });
    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
    });
    const scrollParentRef = { current: el } as { current: HTMLElement | null };
    const { result } = renderHook(() =>
      useVirtualizer({ count: 1000, rowHeight: 40, scrollParentRef }),
    );
    expect(result.current.startIndex).toBe(0);
    // Fire a scroll event; the range should not update until RAF flushes.
    scrollTop = 800;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    // Nothing yet.
    expect(result.current.startIndex).toBe(0);
    act(() => {
      flushRAF();
    });
    // visible start = 800/40 = 20; overscan 3 → 17.
    expect(result.current.startIndex).toBe(17);
  });

  it("coalesces rapid scroll events into a single RAF-scheduled update", () => {
    let scrollTop = 0;
    const el = makeScrollEl({ clientHeight: 400 });
    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
    });
    const scrollParentRef = { current: el } as { current: HTMLElement | null };
    renderHook(() => useVirtualizer({ count: 1000, rowHeight: 40, scrollParentRef }));
    act(() => {
      for (let i = 0; i < 20; i++) {
        scrollTop = i * 40;
        el.dispatchEvent(new Event("scroll"));
      }
    });
    // Only one RAF should be queued regardless of how many scroll events fired.
    expect(rafQueue.length).toBe(1);
  });

  it("removes the scroll listener on unmount", () => {
    const el = makeScrollEl({ clientHeight: 400 });
    const removeSpy = vi.spyOn(el, "removeEventListener");
    const scrollParentRef = { current: el } as { current: HTMLElement | null };
    const { unmount } = renderHook(() =>
      useVirtualizer({ count: 100, rowHeight: 40, scrollParentRef }),
    );
    unmount();
    const scrollRemove = removeSpy.mock.calls.find(([type]) => type === "scroll");
    expect(scrollRemove).toBeDefined();
  });

  it("cancels a pending RAF on unmount", () => {
    let scrollTop = 0;
    const el = makeScrollEl({ clientHeight: 400 });
    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
    });
    const scrollParentRef = { current: el } as { current: HTMLElement | null };
    const { unmount } = renderHook(() =>
      useVirtualizer({ count: 1000, rowHeight: 40, scrollParentRef }),
    );
    act(() => {
      scrollTop = 800;
      el.dispatchEvent(new Event("scroll"));
    });
    expect(rafQueue.length).toBe(1);
    unmount();
    expect(rafQueue.length).toBe(0);
  });
});

// ─── Strict Mode ──────────────────────────────────────────────────

describe("useVirtualizer: StrictMode", () => {
  it("does not double-register scroll listeners under StrictMode", () => {
    const el = makeScrollEl({ clientHeight: 400 });
    const addSpy = vi.spyOn(el, "addEventListener");
    const removeSpy = vi.spyOn(el, "removeEventListener");
    const scrollParentRef = { current: el } as { current: HTMLElement | null };

    renderHook(() => useVirtualizer({ count: 100, rowHeight: 40, scrollParentRef }), {
      wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>,
    });

    const addScroll = addSpy.mock.calls.filter(([t]) => t === "scroll").length;
    const removeScroll = removeSpy.mock.calls.filter(([t]) => t === "scroll").length;
    // Under StrictMode, effects mount twice — but each mount is paired with a
    // cleanup. Net active listener count at rest is `addScroll - removeScroll`,
    // which must be exactly 1.
    expect(addScroll - removeScroll).toBe(1);
  });

  it("cleans up both mounts on unmount under StrictMode", () => {
    const el = makeScrollEl({ clientHeight: 400 });
    const addSpy = vi.spyOn(el, "addEventListener");
    const removeSpy = vi.spyOn(el, "removeEventListener");
    const scrollParentRef = { current: el } as { current: HTMLElement | null };

    const { unmount } = renderHook(
      () => useVirtualizer({ count: 100, rowHeight: 40, scrollParentRef }),
      {
        wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>,
      },
    );
    unmount();

    const addScroll = addSpy.mock.calls.filter(([t]) => t === "scroll").length;
    const removeScroll = removeSpy.mock.calls.filter(([t]) => t === "scroll").length;
    expect(addScroll).toBe(removeScroll);
  });
});

// ─── Reactive props ───────────────────────────────────────────────

describe("useVirtualizer: prop changes", () => {
  it("recomputes when count changes", () => {
    const el = makeScrollEl({ clientHeight: 400 });
    const scrollParentRef = { current: el } as { current: HTMLElement | null };
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useVirtualizer({ count, rowHeight: 40, scrollParentRef }),
      { initialProps: { count: 100 } },
    );
    expect(result.current.endIndex).toBeLessThanOrEqual(100);
    rerender({ count: 50 });
    expect(result.current.endIndex).toBeLessThanOrEqual(50);
  });

  it("recomputes when rowHeight changes", () => {
    const el = makeScrollEl({ clientHeight: 400 });
    const scrollParentRef = { current: el } as { current: HTMLElement | null };
    const { result, rerender } = renderHook(
      ({ rowHeight }: { rowHeight: number }) =>
        useVirtualizer({ count: 100, rowHeight, scrollParentRef }),
      { initialProps: { rowHeight: 40 } },
    );
    const initialEnd = result.current.endIndex;
    rerender({ rowHeight: 80 });
    expect(result.current.endIndex).toBeLessThan(initialEnd);
  });
});
