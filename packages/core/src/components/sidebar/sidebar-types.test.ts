import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import { SidebarContext, useSidebarContext } from "./sidebar-types";
import type {
  SidebarRootProps,
  SidebarGroupProps,
  SidebarItemProps,
  SidebarLinkProps,
  SidebarContextValue,
} from "./sidebar-types";

// ─── Context ────────────────────────────────────────────────────────

describe("Sidebar architecture: context", () => {
  it("useSidebarContext throws outside provider", () => {
    expect(() => renderHook(() => useSidebarContext())).toThrow(
      "Sidebar compound components must be used within <Sidebar>.",
    );
  });

  it("provides expected shape", () => {
    const value: SidebarContextValue = {
      collapsed: false,
      onCollapsedChange: () => {},
      width: "240px",
      collapsedWidth: "60px",
      side: "left",
    };
    const { result } = renderHook(() => useSidebarContext(), {
      wrapper: ({ children }) => createElement(SidebarContext.Provider, { value }, children),
    });
    expect(result.current.collapsed).toBe(false);
    expect(result.current.width).toBe("240px");
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Sidebar architecture: type contracts", () => {
  it("SidebarRootProps supports collapsed state + dimensions", () => {
    expectTypeOf<SidebarRootProps>().toHaveProperty("collapsed");
    expectTypeOf<SidebarRootProps>().toHaveProperty("defaultCollapsed");
    expectTypeOf<SidebarRootProps>().toHaveProperty("onCollapsedChange");
    expectTypeOf<SidebarRootProps>().toHaveProperty("width");
    expectTypeOf<SidebarRootProps>().toHaveProperty("collapsedWidth");
    expectTypeOf<SidebarRootProps>().toHaveProperty("side");
  });

  it("SidebarGroupProps supports collapsible + defaultOpen", () => {
    expectTypeOf<SidebarGroupProps>().toHaveProperty("collapsible");
    expectTypeOf<SidebarGroupProps>().toHaveProperty("defaultOpen");
  });

  it("SidebarItemProps supports active + disabled", () => {
    expectTypeOf<SidebarItemProps>().toHaveProperty("active");
    expectTypeOf<SidebarItemProps>().toHaveProperty("disabled");
  });

  it("SidebarLinkProps supports href + active + disabled", () => {
    expectTypeOf<SidebarLinkProps>().toHaveProperty("href");
    expectTypeOf<SidebarLinkProps>().toHaveProperty("active");
    expectTypeOf<SidebarLinkProps>().toHaveProperty("disabled");
  });

  it("SidebarContextValue has all dimension/state fields", () => {
    expectTypeOf<SidebarContextValue>().toHaveProperty("collapsed");
    expectTypeOf<SidebarContextValue>().toHaveProperty("onCollapsedChange");
    expectTypeOf<SidebarContextValue>().toHaveProperty("width");
    expectTypeOf<SidebarContextValue>().toHaveProperty("collapsedWidth");
    expectTypeOf<SidebarContextValue>().toHaveProperty("side");
  });
});
