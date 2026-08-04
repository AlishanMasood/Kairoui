import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEventCallback } from "./use-event-callback";

describe("useEventCallback", () => {
  describe("stable identity", () => {
    it("returns a stable function reference across renders", () => {
      const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
        initialProps: { fn: () => "a" },
      });
      const ref1 = result.current;
      rerender({ fn: () => "b" });
      expect(result.current).toBe(ref1);
    });

    it("identity is stable even when callback changes", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
        initialProps: { fn: fn1 },
      });
      const ref = result.current;
      rerender({ fn: fn2 });
      rerender({ fn: fn1 });
      expect(result.current).toBe(ref);
    });
  });

  describe("latest callback invocation", () => {
    it("calls the latest callback after update", () => {
      const fn1 = vi.fn().mockReturnValue("first");
      const fn2 = vi.fn().mockReturnValue("second");
      const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
        initialProps: { fn: fn1 },
      });
      rerender({ fn: fn2 });
      const returnVal = result.current();
      expect(fn2).toHaveBeenCalled();
      expect(fn1).not.toHaveBeenCalled();
      expect(returnVal).toBe("second");
    });

    it("passes arguments to the latest callback", () => {
      const fn = vi.fn((a: number, b: string) => `${String(a)}-${b}`);
      const { result } = renderHook(() => useEventCallback(fn));
      const returnVal = result.current(42, "hello");
      expect(fn).toHaveBeenCalledWith(42, "hello");
      expect(returnVal).toBe("42-hello");
    });

    it("preserves return type", () => {
      const fn = (x: number) => x * 2;
      const { result } = renderHook(() => useEventCallback(fn));
      expect(result.current(5)).toBe(10);
    });
  });

  describe("undefined callback", () => {
    it("returns undefined when callback is undefined", () => {
      const { result } = renderHook(() => useEventCallback(undefined));
      expect(result.current()).toBeUndefined();
    });

    it("does not throw when callback becomes undefined", () => {
      const fn = vi.fn();
      const { result, rerender } = renderHook(({ fn: callback }) => useEventCallback(callback), {
        initialProps: { fn: fn as (() => void) | undefined },
      });
      rerender({ fn: undefined });
      expect(() => result.current()).not.toThrow();
    });

    it("calls callback after it becomes defined", () => {
      const fn = vi.fn().mockReturnValue("ok");
      const { result, rerender } = renderHook(({ fn: callback }) => useEventCallback(callback), {
        initialProps: { fn: undefined as (() => string) | undefined },
      });
      rerender({ fn });
      expect(result.current()).toBe("ok");
    });
  });

  describe("error propagation", () => {
    it("does not swallow errors from callback", () => {
      const fn = () => {
        throw new Error("boom");
      };
      const { result } = renderHook(() => useEventCallback(fn));
      expect(() => {
        result.current();
      }).toThrow("boom");
    });
  });
});
