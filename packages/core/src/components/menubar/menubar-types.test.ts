import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import { MenubarContext, useMenubarContext, useMenubarMenuContext } from "./menubar-types";
import type {
  MenubarRootProps,
  MenubarMenuProps,
  MenubarTriggerProps,
  MenubarContentProps,
  MenubarContextValue,
  MenubarMenuContextValue,
} from "./menubar-types";

// ─── Context ────────────────────────────────────────────────────────

describe("Menubar architecture: context", () => {
  it("useMenubarContext throws outside provider", () => {
    expect(() => renderHook(() => useMenubarContext())).toThrow(
      "Menubar compound components must be used within <Menubar>.",
    );
  });

  it("useMenubarMenuContext throws outside provider", () => {
    expect(() => renderHook(() => useMenubarMenuContext())).toThrow(
      "MenubarTrigger/Content must be used within <MenubarMenu>.",
    );
  });

  it("provides expected shape", () => {
    const value: MenubarContextValue = {
      value: "",
      onValueChange: () => {},
      dir: "ltr",
      loop: true,
      hasOpenMenu: false,
      triggerRefs: { current: new Map() },
      registerTrigger: () => () => {},
    };
    const { result } = renderHook(() => useMenubarContext(), {
      wrapper: ({ children }) => createElement(MenubarContext.Provider, { value }, children),
    });
    expect(result.current.dir).toBe("ltr");
    expect(result.current.loop).toBe(true);
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Menubar architecture: type contracts", () => {
  it("MenubarRootProps supports value/dir/loop", () => {
    expectTypeOf<MenubarRootProps>().toHaveProperty("value");
    expectTypeOf<MenubarRootProps>().toHaveProperty("onValueChange");
    expectTypeOf<MenubarRootProps>().toHaveProperty("dir");
    expectTypeOf<MenubarRootProps>().toHaveProperty("loop");
  });

  it("MenubarMenuProps requires value", () => {
    expectTypeOf<MenubarMenuProps>().toHaveProperty("value");
  });

  it("MenubarTriggerProps supports disabled", () => {
    expectTypeOf<MenubarTriggerProps>().toHaveProperty("disabled");
  });

  it("MenubarContentProps supports loop and onEscapeKeyDown", () => {
    expectTypeOf<MenubarContentProps>().toHaveProperty("loop");
    expectTypeOf<MenubarContentProps>().toHaveProperty("onEscapeKeyDown");
  });

  it("MenubarContextValue has hasOpenMenu for hover switching", () => {
    expectTypeOf<MenubarContextValue>().toHaveProperty("hasOpenMenu");
    expectTypeOf<MenubarContextValue>().toHaveProperty("registerTrigger");
  });

  it("MenubarMenuContextValue has open + IDs", () => {
    expectTypeOf<MenubarMenuContextValue>().toHaveProperty("open");
    expectTypeOf<MenubarMenuContextValue>().toHaveProperty("triggerId");
    expectTypeOf<MenubarMenuContextValue>().toHaveProperty("contentId");
  });
});
