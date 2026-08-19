import { describe, it, expect, expectTypeOf } from "vitest";
import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import {
  MenuContext,
  useMenuContext,
  useMenuRadioGroupContext,
  useMenuSubContext,
} from "./menu-types";
import type {
  MenuRootProps,
  MenuTriggerProps,
  MenuContentProps,
  MenuItemProps,
  MenuCheckboxItemProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSubProps,
  MenuSubContentProps,
  MenuArrowProps,
  MenuContextValue,
} from "./menu-types";

// ─── Context availability ───────────────────────────────────────────

describe("Menu architecture: contexts", () => {
  it("useMenuContext throws outside provider", () => {
    expect(() => renderHook(() => useMenuContext())).toThrow(
      "Menu compound components must be used within a Menu root.",
    );
  });

  it("useMenuContext returns value inside provider", () => {
    const value: MenuContextValue = {
      open: true,
      dir: "ltr",
      highlightedValue: undefined,
      onOpenChange: () => {},
      setHighlightedValue: () => {},
      onItemSelect: () => {},
      triggerId: "t",
      contentId: "c",
      triggerRef: { current: null },
      contentRef: { current: null },
      setTriggerNode: () => {},
      setContentNode: () => {},
    };
    const { result } = renderHook(() => useMenuContext(), {
      wrapper: ({ children }) => createElement(MenuContext.Provider, { value }, children),
    });
    expect(result.current.open).toBe(true);
    expect(result.current.dir).toBe("ltr");
  });

  it("useMenuRadioGroupContext returns null outside provider", () => {
    const { result } = renderHook(() => useMenuRadioGroupContext());
    expect(result.current).toBeNull();
  });

  it("useMenuSubContext returns null outside provider", () => {
    const { result } = renderHook(() => useMenuSubContext());
    expect(result.current).toBeNull();
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Menu architecture: type contracts", () => {
  it("MenuRootProps supports open/defaultOpen/onOpenChange/dir", () => {
    expectTypeOf<MenuRootProps>().toHaveProperty("open");
    expectTypeOf<MenuRootProps>().toHaveProperty("defaultOpen");
    expectTypeOf<MenuRootProps>().toHaveProperty("onOpenChange");
    expectTypeOf<MenuRootProps>().toHaveProperty("dir");
  });

  it("MenuContentProps includes positioning and dismiss props", () => {
    expectTypeOf<MenuContentProps>().toHaveProperty("placement");
    expectTypeOf<MenuContentProps>().toHaveProperty("offset");
    expectTypeOf<MenuContentProps>().toHaveProperty("flip");
    expectTypeOf<MenuContentProps>().toHaveProperty("shift");
    expectTypeOf<MenuContentProps>().toHaveProperty("onEscapeKeyDown");
    expectTypeOf<MenuContentProps>().toHaveProperty("onPointerDownOutside");
    expectTypeOf<MenuContentProps>().toHaveProperty("loop");
  });

  it("MenuItemProps supports onSelect and disabled", () => {
    expectTypeOf<MenuItemProps>().toHaveProperty("onSelect");
    expectTypeOf<MenuItemProps>().toHaveProperty("disabled");
    expectTypeOf<MenuItemProps>().toHaveProperty("textValue");
  });

  it("MenuCheckboxItemProps supports checked state", () => {
    expectTypeOf<MenuCheckboxItemProps>().toHaveProperty("checked");
    expectTypeOf<MenuCheckboxItemProps>().toHaveProperty("defaultChecked");
    expectTypeOf<MenuCheckboxItemProps>().toHaveProperty("onCheckedChange");
  });

  it("MenuRadioGroupProps supports value/onValueChange", () => {
    expectTypeOf<MenuRadioGroupProps>().toHaveProperty("value");
    expectTypeOf<MenuRadioGroupProps>().toHaveProperty("defaultValue");
    expectTypeOf<MenuRadioGroupProps>().toHaveProperty("onValueChange");
  });

  it("MenuRadioItemProps requires value", () => {
    expectTypeOf<MenuRadioItemProps>().toHaveProperty("value");
  });

  it("MenuSubProps supports open/defaultOpen/onOpenChange", () => {
    expectTypeOf<MenuSubProps>().toHaveProperty("open");
    expectTypeOf<MenuSubProps>().toHaveProperty("defaultOpen");
    expectTypeOf<MenuSubProps>().toHaveProperty("onOpenChange");
  });

  it("MenuSubContentProps supports offset and escape", () => {
    expectTypeOf<MenuSubContentProps>().toHaveProperty("offset");
    expectTypeOf<MenuSubContentProps>().toHaveProperty("onEscapeKeyDown");
  });

  it("MenuTriggerProps supports asContextTrigger", () => {
    expectTypeOf<MenuTriggerProps>().toHaveProperty("asContextTrigger");
  });

  it("MenuArrowProps supports width/height", () => {
    expectTypeOf<MenuArrowProps>().toHaveProperty("width");
    expectTypeOf<MenuArrowProps>().toHaveProperty("height");
  });

  it("MenuContextValue has required fields", () => {
    expectTypeOf<MenuContextValue>().toHaveProperty("open");
    expectTypeOf<MenuContextValue>().toHaveProperty("dir");
    expectTypeOf<MenuContextValue>().toHaveProperty("highlightedValue");
    expectTypeOf<MenuContextValue>().toHaveProperty("onOpenChange");
    expectTypeOf<MenuContextValue>().toHaveProperty("setHighlightedValue");
    expectTypeOf<MenuContextValue>().toHaveProperty("onItemSelect");
    expectTypeOf<MenuContextValue>().toHaveProperty("triggerId");
    expectTypeOf<MenuContextValue>().toHaveProperty("contentId");
    expectTypeOf<MenuContextValue>().toHaveProperty("triggerRef");
    expectTypeOf<MenuContextValue>().toHaveProperty("contentRef");
  });
});
