import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import {
  NavigationMenuContext,
  useNavigationMenuContext,
  useNavigationMenuItemContext,
} from "./navigation-menu-types";
import type {
  NavigationMenuRootProps,
  NavigationMenuItemProps,
  NavigationMenuLinkRootProps,
  NavigationMenuContextValue,
} from "./navigation-menu-types";

// ─── Context ────────────────────────────────────────────────────────

describe("NavigationMenu architecture: context", () => {
  it("useNavigationMenuContext throws outside provider", () => {
    expect(() => renderHook(() => useNavigationMenuContext())).toThrow(
      "NavigationMenu compound components must be used within <NavigationMenu>.",
    );
  });

  it("useNavigationMenuItemContext returns null outside provider", () => {
    const { result } = renderHook(() => useNavigationMenuItemContext());
    expect(result.current).toBeNull();
  });

  it("provides expected shape", () => {
    const value: NavigationMenuContextValue = {
      value: "",
      onValueChange: () => {},
      orientation: "horizontal",
      dir: "ltr",
      delayDuration: 200,
      baseId: "nav-1",
      triggerRefs: { current: new Map() },
      contentRefs: { current: new Map() },
    };
    const { result } = renderHook(() => useNavigationMenuContext(), {
      wrapper: ({ children }) => createElement(NavigationMenuContext.Provider, { value }, children),
    });
    expect(result.current.delayDuration).toBe(200);
    expect(result.current.baseId).toBe("nav-1");
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("NavigationMenu architecture: type contracts", () => {
  it("NavigationMenuRootProps supports value/orientation/delay", () => {
    expectTypeOf<NavigationMenuRootProps>().toHaveProperty("value");
    expectTypeOf<NavigationMenuRootProps>().toHaveProperty("defaultValue");
    expectTypeOf<NavigationMenuRootProps>().toHaveProperty("onValueChange");
    expectTypeOf<NavigationMenuRootProps>().toHaveProperty("orientation");
    expectTypeOf<NavigationMenuRootProps>().toHaveProperty("delayDuration");
    expectTypeOf<NavigationMenuRootProps>().toHaveProperty("dir");
  });

  it("NavigationMenuItemProps has optional value", () => {
    expectTypeOf<NavigationMenuItemProps>().toHaveProperty("value");
  });

  it("NavigationMenuLinkRootProps supports href + active", () => {
    expectTypeOf<NavigationMenuLinkRootProps>().toHaveProperty("href");
    expectTypeOf<NavigationMenuLinkRootProps>().toHaveProperty("active");
  });

  it("NavigationMenuContextValue has triggerRefs + contentRefs", () => {
    expectTypeOf<NavigationMenuContextValue>().toHaveProperty("triggerRefs");
    expectTypeOf<NavigationMenuContextValue>().toHaveProperty("contentRefs");
    expectTypeOf<NavigationMenuContextValue>().toHaveProperty("delayDuration");
  });
});
