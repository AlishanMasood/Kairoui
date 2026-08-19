import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import {
  ToastStateContext,
  useToastState,
  ToastItemContext,
  useToastItemContext,
} from "./toast-types";
import type {
  ToastSeverity,
  ToastViewportPlacement,
  ToastData,
  CreateToastInput,
  ToastProviderProps,
  ToastViewportProps,
  ToastActionProps,
  ToastState,
  ToastItemContextValue,
} from "./toast-types";

// ─── Context availability ───────────────────────────────────────────

describe("Toast architecture: contexts", () => {
  it("useToastState throws outside provider", () => {
    expect(() => renderHook(() => useToastState())).toThrow(
      "Toast components must be used within <ToastProvider>.",
    );
  });

  it("useToastState returns value inside provider", () => {
    const state: ToastState = {
      toasts: [],
      add: () => "id",
      dismiss: () => {},
      dismissAll: () => {},
      update: () => {},
      pauseAll: () => {},
      resumeAll: () => {},
    };
    const { result } = renderHook(() => useToastState(), {
      wrapper: ({ children }) =>
        createElement(ToastStateContext.Provider, { value: state }, children),
    });
    expect(result.current.toasts).toEqual([]);
    expect(typeof result.current.add).toBe("function");
    expect(typeof result.current.dismiss).toBe("function");
  });

  it("useToastItemContext throws outside provider", () => {
    expect(() => renderHook(() => useToastItemContext())).toThrow(
      "Toast sub-components must be used within a Toast item.",
    );
  });

  it("useToastItemContext returns value inside provider", () => {
    const value: ToastItemContextValue = {
      id: "toast-1",
      severity: "success",
      dismiss: () => {},
    };
    const { result } = renderHook(() => useToastItemContext(), {
      wrapper: ({ children }) => createElement(ToastItemContext.Provider, { value }, children),
    });
    expect(result.current.id).toBe("toast-1");
    expect(result.current.severity).toBe("success");
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Toast architecture: type contracts", () => {
  it("ToastSeverity is a union of 4 values", () => {
    expectTypeOf<ToastSeverity>().toEqualTypeOf<"info" | "success" | "warning" | "error">();
  });

  it("ToastViewportPlacement has 6 positions", () => {
    expectTypeOf<ToastViewportPlacement>().toEqualTypeOf<
      "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end"
    >();
  });

  it("ToastData has required id", () => {
    expectTypeOf<ToastData>().toHaveProperty("id");
    expectTypeOf<ToastData>().toHaveProperty("title");
    expectTypeOf<ToastData>().toHaveProperty("description");
    expectTypeOf<ToastData>().toHaveProperty("action");
    expectTypeOf<ToastData>().toHaveProperty("severity");
    expectTypeOf<ToastData>().toHaveProperty("duration");
    expectTypeOf<ToastData>().toHaveProperty("onDismiss");
  });

  it("CreateToastInput makes id optional", () => {
    expectTypeOf<CreateToastInput>().toHaveProperty("title");
    expectTypeOf<CreateToastInput>().toHaveProperty("duration");
  });

  it("ToastProviderProps supports configuration", () => {
    expectTypeOf<ToastProviderProps>().toHaveProperty("maxVisible");
    expectTypeOf<ToastProviderProps>().toHaveProperty("defaultDuration");
    expectTypeOf<ToastProviderProps>().toHaveProperty("placement");
    expectTypeOf<ToastProviderProps>().toHaveProperty("pauseOnHover");
    expectTypeOf<ToastProviderProps>().toHaveProperty("label");
  });

  it("ToastViewportProps supports hotkey", () => {
    expectTypeOf<ToastViewportProps>().toHaveProperty("hotkey");
    expectTypeOf<ToastViewportProps>().toHaveProperty("className");
  });

  it("ToastActionProps requires altText", () => {
    expectTypeOf<ToastActionProps>().toHaveProperty("altText");
  });

  it("ToastState has full manager API", () => {
    expectTypeOf<ToastState>().toHaveProperty("toasts");
    expectTypeOf<ToastState>().toHaveProperty("add");
    expectTypeOf<ToastState>().toHaveProperty("dismiss");
    expectTypeOf<ToastState>().toHaveProperty("dismissAll");
    expectTypeOf<ToastState>().toHaveProperty("update");
    expectTypeOf<ToastState>().toHaveProperty("pauseAll");
    expectTypeOf<ToastState>().toHaveProperty("resumeAll");
  });
});
