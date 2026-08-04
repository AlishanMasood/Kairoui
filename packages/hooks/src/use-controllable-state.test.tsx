import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useControllableState } from "./use-controllable-state";

function noop() {}

describe("useControllableState", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("uncontrolled mode", () => {
    it("uses defaultValue as initial value", () => {
      const { result } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: "hello" }),
      );
      expect(result.current[0]).toBe("hello");
    });

    it("setValue updates internal state", () => {
      const { result } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: 0 }),
      );
      act(() => {
        result.current[1](42);
      });
      expect(result.current[0]).toBe(42);
    });

    it("setValue supports functional updates", () => {
      const { result } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: 10 }),
      );
      act(() => {
        result.current[1]((prev) => prev + 5);
      });
      expect(result.current[0]).toBe(15);
    });

    it("calls onChange when value changes", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: "a", onChange }),
      );
      act(() => {
        result.current[1]("b");
      });
      expect(onChange).toHaveBeenCalledWith("b");
    });

    it("does not call onChange when value is same", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: "same", onChange }),
      );
      act(() => {
        result.current[1]("same");
      });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("controlled mode", () => {
    it("uses controlled value", () => {
      const { result } = renderHook(() =>
        useControllableState({ value: "controlled", defaultValue: "default" }),
      );
      expect(result.current[0]).toBe("controlled");
    });

    it("calls onChange when setValue is called", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: "current", defaultValue: "default", onChange }),
      );
      act(() => {
        result.current[1]("new");
      });
      expect(onChange).toHaveBeenCalledWith("new");
    });

    it("does not call onChange when value is same as controlled", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: "same", defaultValue: "default", onChange }),
      );
      act(() => {
        result.current[1]("same");
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("updates when controlled prop changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControllableState({ value, defaultValue: "default" }),
        { initialProps: { value: "first" } },
      );
      expect(result.current[0]).toBe("first");
      rerender({ value: "second" });
      expect(result.current[0]).toBe("second");
    });
  });

  describe("setter stability", () => {
    it("setter reference is stable", () => {
      const { result, rerender } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: 0 }),
      );
      const setter1 = result.current[1];
      rerender();
      expect(result.current[1]).toBe(setter1);
    });
  });

  describe("equality comparator", () => {
    it("uses custom equality to skip onChange", () => {
      const onChange = vi.fn();
      const isEqual = (a: { id: number }, b: { id: number }) => a.id === b.id;
      const initial = { id: 1, name: "old" };
      const { result } = renderHook(() =>
        useControllableState({
          value: undefined,
          defaultValue: initial,
          onChange,
          isEqual,
        }),
      );
      act(() => {
        result.current[1]({ id: 1, name: "new" });
      });
      // Same id — considered equal by custom comparator
      expect(onChange).not.toHaveBeenCalled();
    });

    it("calls onChange when custom equality says not equal", () => {
      const onChange = vi.fn();
      const isEqual = (a: { id: number }, b: { id: number }) => a.id === b.id;
      const initial = { id: 1, name: "old" };
      const { result } = renderHook(() =>
        useControllableState({
          value: undefined,
          defaultValue: initial,
          onChange,
          isEqual,
        }),
      );
      act(() => {
        result.current[1]({ id: 2, name: "new" });
      });
      expect(onChange).toHaveBeenCalledWith({ id: 2, name: "new" });
    });
  });

  describe("latest callback", () => {
    it("uses the latest onChange even after re-render", () => {
      const onChange1 = vi.fn();
      const onChange2 = vi.fn();
      const { result, rerender } = renderHook(
        ({ onChange }) => useControllableState({ value: undefined, defaultValue: 0, onChange }),
        { initialProps: { onChange: onChange1 } },
      );
      rerender({ onChange: onChange2 });
      act(() => {
        result.current[1](99);
      });
      expect(onChange1).not.toHaveBeenCalled();
      expect(onChange2).toHaveBeenCalledWith(99);
    });
  });

  describe("development warnings", () => {
    it("warns on controlled/uncontrolled switch", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(noop);
      const { rerender } = renderHook(
        ({ value }) =>
          useControllableState({
            value,
            defaultValue: "d",
            name: "ControllableSwitch",
            state: "val",
          }),
        { initialProps: { value: undefined as string | undefined } },
      );
      rerender({ value: "now controlled" });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("ControllableSwitch"));
    });
  });
});
