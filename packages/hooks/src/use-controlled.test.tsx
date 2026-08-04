import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useControlled } from "./use-controlled";

function noop() {}

describe("useControlled", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("uncontrolled mode", () => {
    it("uses defaultValue as initial value", () => {
      const { result } = renderHook(() =>
        useControlled({ controlled: undefined, defaultValue: "hello", name: "Test" }),
      );
      expect(result.current[0]).toBe("hello");
    });

    it("setValue updates the internal state", () => {
      const { result } = renderHook(() =>
        useControlled({ controlled: undefined, defaultValue: 0, name: "Test" }),
      );
      act(() => {
        result.current[1](42);
      });
      expect(result.current[0]).toBe(42);
    });

    it("setValue supports updater function", () => {
      const { result } = renderHook(() =>
        useControlled({ controlled: undefined, defaultValue: 10, name: "Test" }),
      );
      act(() => {
        result.current[1]((prev) => prev + 5);
      });
      expect(result.current[0]).toBe(15);
    });

    it("setter reference is stable across renders", () => {
      const { result, rerender } = renderHook(() =>
        useControlled({ controlled: undefined, defaultValue: 0, name: "Test" }),
      );
      const setter1 = result.current[1];
      rerender();
      expect(result.current[1]).toBe(setter1);
    });
  });

  describe("controlled mode", () => {
    it("uses controlled value", () => {
      const { result } = renderHook(() =>
        useControlled({ controlled: "controlled", defaultValue: "default", name: "Test" }),
      );
      expect(result.current[0]).toBe("controlled");
    });

    it("updates when controlled prop changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControlled({ controlled: value, defaultValue: "default", name: "Test" }),
        { initialProps: { value: "first" } },
      );
      expect(result.current[0]).toBe("first");
      rerender({ value: "second" });
      expect(result.current[0]).toBe("second");
    });

    it("setValue is a no-op in controlled mode", () => {
      const { result } = renderHook(() =>
        useControlled({ controlled: "fixed", defaultValue: "default", name: "Test" }),
      );
      act(() => {
        result.current[1]("attempted");
      });
      expect(result.current[0]).toBe("fixed");
    });
  });

  describe("controlled/uncontrolled switching warnings", () => {
    it("warns when switching from uncontrolled to controlled", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(noop);
      const { rerender } = renderHook(
        ({ controlled }: { controlled: string | undefined }) =>
          useControlled({
            controlled,
            defaultValue: "default",
            name: "UncontrolledFirst",
            state: "value",
          }),
        { initialProps: { controlled: undefined as string | undefined } },
      );
      rerender({ controlled: "now controlled" });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("changing an uncontrolled value to be controlled"),
      );
    });

    it("warns when switching from controlled to uncontrolled", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(noop);
      const { rerender } = renderHook(
        ({ controlled }: { controlled: string | undefined }) =>
          useControlled({
            controlled,
            defaultValue: "default",
            name: "ControlledFirst",
            state: "value",
          }),
        { initialProps: { controlled: "initial" } },
      );
      rerender({ controlled: undefined });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("changing a controlled value to be uncontrolled"),
      );
    });

    it("does not warn when staying controlled", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(noop);
      const { rerender } = renderHook(
        ({ controlled }: { controlled: string | undefined }) =>
          useControlled({ controlled, defaultValue: "default", name: "Test" }),
        { initialProps: { controlled: "a" } },
      );
      rerender({ controlled: "b" });
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not warn when staying uncontrolled", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(noop);
      const { result, rerender } = renderHook(() =>
        useControlled({ controlled: undefined, defaultValue: "default", name: "Test" }),
      );
      act(() => {
        result.current[1]("new");
      });
      rerender();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("generic typing", () => {
    it("works with numbers", () => {
      const { result } = renderHook(() =>
        useControlled({ controlled: undefined, defaultValue: 0, name: "Test" }),
      );
      act(() => {
        result.current[1](99);
      });
      expect(result.current[0]).toBe(99);
    });

    it("works with booleans", () => {
      const { result } = renderHook(() =>
        useControlled({ controlled: undefined, defaultValue: false, name: "Test" }),
      );
      act(() => {
        result.current[1](true);
      });
      expect(result.current[0]).toBe(true);
    });

    it("works with objects", () => {
      const obj = { x: 1 };
      const { result } = renderHook(() =>
        useControlled({ controlled: undefined, defaultValue: obj, name: "Test" }),
      );
      expect(result.current[0]).toBe(obj);
    });
  });
});
