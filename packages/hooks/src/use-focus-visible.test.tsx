import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFocusVisible } from "./use-focus-visible";

describe("useFocusVisible", () => {
  it("returns isFocusVisible as false initially", () => {
    const { result } = renderHook(() => useFocusVisible());
    expect(result.current.isFocusVisible).toBe(false);
  });

  it("returns focusProps with onFocus and onBlur", () => {
    const { result } = renderHook(() => useFocusVisible());
    expect(result.current.focusProps.onFocus).toBeTypeOf("function");
    expect(result.current.focusProps.onBlur).toBeTypeOf("function");
  });

  it("focusProps references are stable", () => {
    const { result, rerender } = renderHook(() => useFocusVisible());
    const { onFocus, onBlur } = result.current.focusProps;
    rerender();
    expect(result.current.focusProps.onFocus).toBe(onFocus);
    expect(result.current.focusProps.onBlur).toBe(onBlur);
  });

  it("isFocusVisible is false after pointer focus", () => {
    const { result } = renderHook(() => useFocusVisible());
    // Simulate pointer interaction then focus
    act(() => {
      document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    act(() => {
      result.current.focusProps.onFocus();
    });
    expect(result.current.isFocusVisible).toBe(false);
  });

  it("isFocusVisible is true after keyboard focus", () => {
    const { result } = renderHook(() => useFocusVisible());
    // Simulate keyboard interaction then focus
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    });
    act(() => {
      result.current.focusProps.onFocus();
    });
    expect(result.current.isFocusVisible).toBe(true);
  });

  it("isFocusVisible resets on blur", () => {
    const { result } = renderHook(() => useFocusVisible());
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    });
    act(() => {
      result.current.focusProps.onFocus();
    });
    expect(result.current.isFocusVisible).toBe(true);
    act(() => {
      result.current.focusProps.onBlur();
    });
    expect(result.current.isFocusVisible).toBe(false);
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() => useFocusVisible());
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
