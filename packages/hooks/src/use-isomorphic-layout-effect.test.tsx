import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

describe("useIsomorphicLayoutEffect", () => {
  it("is a function (valid React hook)", () => {
    expect(useIsomorphicLayoutEffect).toBeTypeOf("function");
  });

  it("fires the effect callback", () => {
    const callback = vi.fn();
    renderHook(() => {
      useIsomorphicLayoutEffect(callback);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("fires cleanup on unmount", () => {
    const cleanup = vi.fn();
    const { unmount } = renderHook(() => {
      useIsomorphicLayoutEffect(() => cleanup);
    });
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("re-fires when deps change", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ dep }) => {
        useIsomorphicLayoutEffect(callback, [dep]);
      },
      { initialProps: { dep: 1 } },
    );
    expect(callback).toHaveBeenCalledTimes(1);
    rerender({ dep: 2 });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("does not re-fire when deps are stable", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ dep }) => {
        useIsomorphicLayoutEffect(callback, [dep]);
      },
      { initialProps: { dep: 1 } },
    );
    rerender({ dep: 1 });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("can be imported from @kairoui/hooks", async () => {
    const hooks = await import("@kairoui/hooks");
    expect(hooks.useIsomorphicLayoutEffect).toBeTypeOf("function");
  });
});
