import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import {
  TabsInternalContext,
  useTabsInternalContext,
  getTabTriggerId,
  getTabContentId,
} from "./tabs-types";
import type {
  TabsRootProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  TabsInternalContextValue,
} from "./tabs-types";

// ─── Context ────────────────────────────────────────────────────────

describe("Tabs architecture: context", () => {
  it("useTabsInternalContext throws outside provider", () => {
    expect(() => renderHook(() => useTabsInternalContext())).toThrow(
      "Tabs compound components must be used within <Tabs>.",
    );
  });

  it("useTabsInternalContext returns value inside provider", () => {
    const value: TabsInternalContextValue = {
      value: "tab1",
      onValueChange: () => {},
      orientation: "horizontal",
      activationMode: "automatic",
      dir: "ltr",
      baseId: "tabs-1",
    };
    const { result } = renderHook(() => useTabsInternalContext(), {
      wrapper: ({ children }) => createElement(TabsInternalContext.Provider, { value }, children),
    });
    expect(result.current.value).toBe("tab1");
    expect(result.current.baseId).toBe("tabs-1");
  });
});

// ─── ID helpers ─────────────────────────────────────────────────────

describe("Tabs architecture: ID generation", () => {
  it("getTabTriggerId produces deterministic ID", () => {
    expect(getTabTriggerId("tabs-1", "settings")).toBe("tabs-1-trigger-settings");
  });

  it("getTabContentId produces deterministic ID", () => {
    expect(getTabContentId("tabs-1", "settings")).toBe("tabs-1-content-settings");
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Tabs architecture: type contracts", () => {
  it("TabsRootProps supports controlled/uncontrolled + orientation + activation", () => {
    expectTypeOf<TabsRootProps>().toHaveProperty("value");
    expectTypeOf<TabsRootProps>().toHaveProperty("defaultValue");
    expectTypeOf<TabsRootProps>().toHaveProperty("onValueChange");
    expectTypeOf<TabsRootProps>().toHaveProperty("orientation");
    expectTypeOf<TabsRootProps>().toHaveProperty("activationMode");
    expectTypeOf<TabsRootProps>().toHaveProperty("dir");
  });

  it("TabsListProps supports loop", () => {
    expectTypeOf<TabsListProps>().toHaveProperty("loop");
  });

  it("TabsTriggerProps requires value and supports disabled", () => {
    expectTypeOf<TabsTriggerProps>().toHaveProperty("value");
    expectTypeOf<TabsTriggerProps>().toHaveProperty("disabled");
  });

  it("TabsContentProps supports lazy + keepMounted", () => {
    expectTypeOf<TabsContentProps>().toHaveProperty("value");
    expectTypeOf<TabsContentProps>().toHaveProperty("lazy");
    expectTypeOf<TabsContentProps>().toHaveProperty("keepMounted");
  });

  it("TabsInternalContextValue has baseId for ARIA ID generation", () => {
    expectTypeOf<TabsInternalContextValue>().toHaveProperty("baseId");
    expectTypeOf<TabsInternalContextValue>().toHaveProperty("value");
    expectTypeOf<TabsInternalContextValue>().toHaveProperty("activationMode");
  });
});
