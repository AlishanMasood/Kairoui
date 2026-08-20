import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import {
  TabsContext,
  useTabsContext,
  useAccordionContext,
  useAccordionItemContext,
  usePaginationContext,
} from "./navigation-types";
import type {
  Orientation,
  TabsProps,
  TabListProps,
  TabProps,
  TabPanelProps,
  AccordionProps,
  AccordionItemProps,
  BreadcrumbsProps,
  PaginationProps,
  NavigationMenuProps,
  SidebarNavProps,
  AppShellProps,
  AppShellHeaderProps,
  AppShellSidebarProps,
  TabsContextValue,
} from "./navigation-types";

// ─── Context availability ───────────────────────────────────────────

describe("Navigation architecture: contexts", () => {
  it("useTabsContext throws outside provider", () => {
    expect(() => renderHook(() => useTabsContext())).toThrow(
      "Tabs compound components must be used within <Tabs>.",
    );
  });

  it("useTabsContext returns value inside provider", () => {
    const value: TabsContextValue = {
      value: "tab1",
      onValueChange: () => {},
      orientation: "horizontal",
      activationMode: "automatic",
      dir: "ltr",
    };
    const { result } = renderHook(() => useTabsContext(), {
      wrapper: ({ children }) => createElement(TabsContext.Provider, { value }, children),
    });
    expect(result.current.value).toBe("tab1");
    expect(result.current.orientation).toBe("horizontal");
  });

  it("useAccordionContext throws outside provider", () => {
    expect(() => renderHook(() => useAccordionContext())).toThrow(
      "Accordion compound components must be used within <Accordion>.",
    );
  });

  it("useAccordionItemContext throws outside provider", () => {
    expect(() => renderHook(() => useAccordionItemContext())).toThrow(
      "AccordionTrigger/Content must be used within <AccordionItem>.",
    );
  });

  it("usePaginationContext throws outside provider", () => {
    expect(() => renderHook(() => usePaginationContext())).toThrow(
      "Pagination components must be used within <Pagination>.",
    );
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Navigation architecture: type contracts", () => {
  it("Orientation is horizontal | vertical", () => {
    expectTypeOf<Orientation>().toEqualTypeOf<"horizontal" | "vertical">();
  });

  it("TabsProps supports controlled/uncontrolled + orientation + activation", () => {
    expectTypeOf<TabsProps>().toHaveProperty("value");
    expectTypeOf<TabsProps>().toHaveProperty("defaultValue");
    expectTypeOf<TabsProps>().toHaveProperty("onValueChange");
    expectTypeOf<TabsProps>().toHaveProperty("orientation");
    expectTypeOf<TabsProps>().toHaveProperty("activationMode");
    expectTypeOf<TabsProps>().toHaveProperty("dir");
  });

  it("TabListProps supports loop", () => {
    expectTypeOf<TabListProps>().toHaveProperty("loop");
  });

  it("TabProps requires value", () => {
    expectTypeOf<TabProps>().toHaveProperty("value");
    expectTypeOf<TabProps>().toHaveProperty("disabled");
  });

  it("TabPanelProps supports lazy and keepMounted", () => {
    expectTypeOf<TabPanelProps>().toHaveProperty("value");
    expectTypeOf<TabPanelProps>().toHaveProperty("lazy");
    expectTypeOf<TabPanelProps>().toHaveProperty("keepMounted");
  });

  it("AccordionProps is discriminated union (single | multiple)", () => {
    expectTypeOf<AccordionProps>().toHaveProperty("type");
  });

  it("AccordionItemProps requires value", () => {
    expectTypeOf<AccordionItemProps>().toHaveProperty("value");
    expectTypeOf<AccordionItemProps>().toHaveProperty("disabled");
  });

  it("BreadcrumbsProps supports separator and maxItems", () => {
    expectTypeOf<BreadcrumbsProps>().toHaveProperty("separator");
    expectTypeOf<BreadcrumbsProps>().toHaveProperty("maxItems");
  });

  it("PaginationProps supports page/totalPages/siblings/boundary", () => {
    expectTypeOf<PaginationProps>().toHaveProperty("page");
    expectTypeOf<PaginationProps>().toHaveProperty("defaultPage");
    expectTypeOf<PaginationProps>().toHaveProperty("onPageChange");
    expectTypeOf<PaginationProps>().toHaveProperty("totalPages");
    expectTypeOf<PaginationProps>().toHaveProperty("siblingCount");
    expectTypeOf<PaginationProps>().toHaveProperty("boundaryCount");
  });

  it("NavigationMenuProps supports value/orientation/dir", () => {
    expectTypeOf<NavigationMenuProps>().toHaveProperty("value");
    expectTypeOf<NavigationMenuProps>().toHaveProperty("orientation");
    expectTypeOf<NavigationMenuProps>().toHaveProperty("dir");
  });

  it("SidebarNavProps supports collapsed state", () => {
    expectTypeOf<SidebarNavProps>().toHaveProperty("collapsed");
    expectTypeOf<SidebarNavProps>().toHaveProperty("onCollapsedChange");
    expectTypeOf<SidebarNavProps>().toHaveProperty("width");
    expectTypeOf<SidebarNavProps>().toHaveProperty("collapsedWidth");
  });

  it("AppShellProps supports layout variants", () => {
    expectTypeOf<AppShellProps>().toHaveProperty("layout");
    expectTypeOf<AppShellProps>().toHaveProperty("fixed");
  });

  it("AppShellHeaderProps supports fixed + height", () => {
    expectTypeOf<AppShellHeaderProps>().toHaveProperty("fixed");
    expectTypeOf<AppShellHeaderProps>().toHaveProperty("height");
  });

  it("AppShellSidebarProps supports collapse and side", () => {
    expectTypeOf<AppShellSidebarProps>().toHaveProperty("collapsed");
    expectTypeOf<AppShellSidebarProps>().toHaveProperty("onCollapsedChange");
    expectTypeOf<AppShellSidebarProps>().toHaveProperty("side");
    expectTypeOf<AppShellSidebarProps>().toHaveProperty("width");
    expectTypeOf<AppShellSidebarProps>().toHaveProperty("collapsedWidth");
  });
});
