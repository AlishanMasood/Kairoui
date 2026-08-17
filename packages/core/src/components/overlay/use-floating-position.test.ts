import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useFloatingPosition } from "./use-floating-position";

afterEach(cleanup);

describe("useFloatingPosition", () => {
  it("returns initial zero position", () => {
    const { result } = renderHook(() => useFloatingPosition());
    expect(result.current.x).toBe(0);
    expect(result.current.y).toBe(0);
    expect(result.current.placement).toBe("bottom");
  });

  it("provides ref setters and update function", () => {
    const { result } = renderHook(() => useFloatingPosition());
    expect(typeof result.current.refs.setAnchor).toBe("function");
    expect(typeof result.current.refs.setFloating).toBe("function");
    expect(typeof result.current.update).toBe("function");
  });

  it("does not throw when enabled is false", () => {
    const { result } = renderHook(() => useFloatingPosition({ enabled: false }));
    expect(result.current.x).toBe(0);
  });

  it("provides arrow position", () => {
    const { result } = renderHook(() => useFloatingPosition({ arrowSize: 8 }));
    expect(result.current.arrowPosition).toEqual({ x: undefined, y: undefined });
  });

  it("update function does not throw without refs", () => {
    const { result } = renderHook(() => useFloatingPosition());
    expect(() => {
      act(() => {
        result.current.update();
      });
    }).not.toThrow();
  });
});
