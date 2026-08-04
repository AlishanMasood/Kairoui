import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useMergedRefs } from "./use-merged-refs";
import type { MutableRefObject } from "@kairoui/utils";

describe("useMergedRefs", () => {
  it("assigns to a single object ref", () => {
    const { result } = renderHook(() => {
      const ref = useRef<string | null>(null);
      const merged = useMergedRefs(ref);
      return { ref, merged };
    });
    result.current.merged("hello");
    expect(result.current.ref.current).toBe("hello");
  });

  it("assigns to a single callback ref", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useMergedRefs(callback));
    result.current("world");
    expect(callback).toHaveBeenCalledWith("world");
  });

  it("assigns to multiple refs", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => {
      const objRef = useRef<string | null>(null);
      const merged = useMergedRefs(objRef, callback);
      return { objRef, merged };
    });
    result.current.merged("both");
    expect(result.current.objRef.current).toBe("both");
    expect(callback).toHaveBeenCalledWith("both");
  });

  it("skips null refs", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useMergedRefs(null, callback, undefined));
    result.current("ok");
    expect(callback).toHaveBeenCalledWith("ok");
  });

  it("handles all null/undefined refs", () => {
    const { result } = renderHook(() => useMergedRefs<string>(null, undefined));
    expect(() => {
      result.current("val");
    }).not.toThrow();
  });

  it("assigns null on cleanup", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => {
      const objRef = useRef<string | null>(null);
      const merged = useMergedRefs(objRef, callback);
      return { objRef, merged };
    });
    result.current.merged("init");
    result.current.merged(null);
    expect(result.current.objRef.current).toBeNull();
    expect(callback).toHaveBeenCalledWith(null);
  });

  it("returns a function (callback ref)", () => {
    const { result } = renderHook(() => useMergedRefs<HTMLElement>(null));
    expect(result.current).toBeTypeOf("function");
  });

  it("ref stability when inputs do not change", () => {
    const stableRef: MutableRefObject<string | null> = { current: null };
    const { result, rerender } = renderHook(() => useMergedRefs(stableRef));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("always calls the latest refs even when they change", () => {
    const ref1 = vi.fn();
    const ref2 = vi.fn();
    const { result, rerender } = renderHook(({ fn }) => useMergedRefs(fn), {
      initialProps: { fn: ref1 as (instance: string | null) => void },
    });
    const first = result.current;
    rerender({ fn: ref2 });
    // Merged ref is always stable
    expect(result.current).toBe(first);
    result.current("new");
    expect(ref2).toHaveBeenCalledWith("new");
  });
});
