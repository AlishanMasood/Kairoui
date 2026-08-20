import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import { AppShellContext, useAppShellContext, normalizeDimension } from "./app-shell-types";
import type {
  AppShellRootProps,
  AppShellHeaderRootProps,
  AppShellSidebarRootProps,
  AppShellContextValue,
} from "./app-shell-types";

// ─── Context ────────────────────────────────────────────────────────

describe("AppShell architecture: context", () => {
  it("useAppShellContext throws outside provider", () => {
    expect(() => renderHook(() => useAppShellContext())).toThrow(
      "AppShell compound components must be used within <AppShell>.",
    );
  });

  it("provides expected shape", () => {
    const value: AppShellContextValue = {
      layout: "sidebar",
      fixed: false,
      headerHeight: "60px",
      sidebarWidth: "240px",
      sidebarCollapsedWidth: "60px",
      sidebarCollapsed: false,
      asideWidth: "280px",
      footerHeight: "auto",
    };
    const { result } = renderHook(() => useAppShellContext(), {
      wrapper: ({ children }) => createElement(AppShellContext.Provider, { value }, children),
    });
    expect(result.current.layout).toBe("sidebar");
    expect(result.current.sidebarWidth).toBe("240px");
  });
});

// ─── normalizeDimension ─────────────────────────────────────────────

describe("AppShell architecture: normalizeDimension", () => {
  it("returns fallback for undefined", () => {
    expect(normalizeDimension(undefined, "60px")).toBe("60px");
  });

  it("returns string as-is", () => {
    expect(normalizeDimension("20rem", "0")).toBe("20rem");
  });

  it("converts number to px", () => {
    expect(normalizeDimension(100, "0")).toBe("100px");
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("AppShell architecture: type contracts", () => {
  it("AppShellRootProps supports all dimension tokens", () => {
    expectTypeOf<AppShellRootProps>().toHaveProperty("layout");
    expectTypeOf<AppShellRootProps>().toHaveProperty("fixed");
    expectTypeOf<AppShellRootProps>().toHaveProperty("headerHeight");
    expectTypeOf<AppShellRootProps>().toHaveProperty("sidebarWidth");
    expectTypeOf<AppShellRootProps>().toHaveProperty("sidebarCollapsedWidth");
    expectTypeOf<AppShellRootProps>().toHaveProperty("sidebarCollapsed");
    expectTypeOf<AppShellRootProps>().toHaveProperty("asideWidth");
    expectTypeOf<AppShellRootProps>().toHaveProperty("footerHeight");
  });

  it("AppShellHeaderRootProps supports fixed", () => {
    expectTypeOf<AppShellHeaderRootProps>().toHaveProperty("fixed");
  });

  it("AppShellSidebarRootProps supports side", () => {
    expectTypeOf<AppShellSidebarRootProps>().toHaveProperty("side");
  });
});
