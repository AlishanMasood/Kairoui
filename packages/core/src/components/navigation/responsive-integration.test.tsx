import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { AppShell, AppShellHeader, AppShellSidebar, AppShellMain } from "../app-shell/app-shell";
import {
  Sidebar,
  SidebarContent,
  SidebarItem,
  SidebarLink,
  SidebarTrigger,
} from "../sidebar/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs/tabs";
import {
  Breadcrumbs,
  BreadcrumbsList,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsSeparator,
  BreadcrumbsCurrent,
} from "../breadcrumbs/breadcrumbs";
import {
  Pagination,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "../pagination/pagination";

afterEach(cleanup);

// ─── AppShell responsive: sidebar collapse ──────────────────────────

describe("Responsive: AppShell sidebar collapse", () => {
  it("sidebar width changes when collapsed", () => {
    const { rerender } = render(
      createElement(
        AppShell,
        { sidebarCollapsed: false, "data-testid": "shell" } as never,
        createElement(AppShellHeader, null, "H"),
        createElement(AppShellSidebar, { "data-testid": "sidebar" } as never, "Nav"),
        createElement(AppShellMain, null, "M"),
      ),
    );
    expect(screen.getByTestId("sidebar").style.width).toBe("240px");

    rerender(
      createElement(
        AppShell,
        { sidebarCollapsed: true, "data-testid": "shell" } as never,
        createElement(AppShellHeader, null, "H"),
        createElement(AppShellSidebar, { "data-testid": "sidebar" } as never, "Nav"),
        createElement(AppShellMain, null, "M"),
      ),
    );
    expect(screen.getByTestId("sidebar").style.width).toBe("60px");
  });

  it("CSS variable updates on collapse", () => {
    render(
      createElement(
        AppShell,
        { sidebarCollapsed: true, "data-testid": "shell" } as never,
        createElement(AppShellHeader, null, "H"),
        createElement(AppShellSidebar, null, "Nav"),
        createElement(AppShellMain, null, "M"),
      ),
    );
    expect(screen.getByTestId("shell").style.getPropertyValue("--kui-shell-sidebar-width")).toBe(
      "60px",
    );
  });
});

// ─── Sidebar trigger for collapse ───────────────────────────────────

describe("Responsive: Sidebar trigger", () => {
  it("clicking trigger collapses sidebar", () => {
    render(
      createElement(
        Sidebar,
        { "data-testid": "sidebar" } as never,
        createElement(
          SidebarContent,
          null,
          createElement(SidebarItem, null, createElement(SidebarLink, { href: "/" }, "Home")),
        ),
        createElement(SidebarTrigger, { "data-testid": "trigger" } as never),
      ),
    );
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBeNull();
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBe("true");
  });
});

// ─── Tabs overflow: many tabs render without layout error ───────────

describe("Responsive: Tabs overflow", () => {
  it("renders many tabs without error", () => {
    const tabs = Array.from({ length: 20 }, (_, i) => `tab${String(i)}`);
    render(
      createElement(
        Tabs,
        { defaultValue: "tab0" },
        createElement(
          TabsList,
          { "data-testid": "tablist" } as never,
          ...tabs.map((t) => createElement(TabsTrigger, { key: t, value: t }, t)),
        ),
        ...tabs.map((t) => createElement(TabsContent, { key: t, value: t }, `Panel ${t}`)),
      ),
    );
    const list = screen.getByTestId("tablist");
    expect(list.children.length).toBe(20);
  });
});

// ─── Breadcrumbs overflow: many items ───────────────────────────────

describe("Responsive: Breadcrumbs overflow", () => {
  it("renders deep breadcrumb trail without error", () => {
    const items = ["Home", "Products", "Category", "Subcategory", "Item", "Detail"];
    render(
      createElement(
        Breadcrumbs,
        { "data-testid": "nav" } as never,
        createElement(
          BreadcrumbsList,
          { "data-testid": "list" } as never,
          ...items.map((item, i) =>
            createElement(
              BreadcrumbsItem,
              { key: item },
              i < items.length - 1
                ? [
                    createElement(
                      BreadcrumbsLink,
                      { href: `/${item.toLowerCase()}`, key: "l" },
                      item,
                    ),
                    createElement(BreadcrumbsSeparator, { key: "s" }),
                  ]
                : createElement(BreadcrumbsCurrent, null, item),
            ),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("list").children.length).toBe(6);
  });
});

// ─── Pagination compact: small page count ───────────────────────────

describe("Responsive: Pagination compact", () => {
  it("renders minimal pagination for 3 pages", () => {
    render(
      createElement(
        Pagination,
        { totalPages: 3, defaultPage: 2, "data-testid": "pagination" } as never,
        createElement(PaginationPrevious, { "data-testid": "prev" } as never),
        createElement(PaginationItem, { page: 1 } as never),
        createElement(PaginationItem, { page: 2 } as never),
        createElement(PaginationItem, { page: 3 } as never),
        createElement(PaginationNext, { "data-testid": "next" } as never),
      ),
    );
    expect(screen.getByTestId("pagination")).not.toBeNull();
    expect(screen.getByTestId("prev").getAttribute("aria-disabled")).toBeNull();
    expect(screen.getByTestId("next").getAttribute("aria-disabled")).toBeNull();
  });
});

// ─── RTL layout: AppShell sidebar on right ──────────────────────────

describe("Responsive: RTL", () => {
  it("AppShell sidebar can be on right side", () => {
    render(
      createElement(
        AppShell,
        null,
        createElement(AppShellHeader, null, "H"),
        createElement(AppShellSidebar, { side: "right", "data-testid": "sidebar" } as never, "Nav"),
        createElement(AppShellMain, null, "M"),
      ),
    );
    expect(screen.getByTestId("sidebar").getAttribute("data-side")).toBe("right");
  });

  it("Sidebar supports right side", () => {
    render(
      createElement(
        Sidebar,
        { side: "right", "data-testid": "sb" } as never,
        createElement(SidebarContent, null, "Nav"),
      ),
    );
    expect(screen.getByTestId("sb").getAttribute("data-side")).toBe("right");
  });
});

// ─── Layout stability: AppShell main has min-width 0 ────────────────

describe("Responsive: layout stability", () => {
  it("main content has min-width 0 to prevent overflow", () => {
    render(
      createElement(
        AppShell,
        null,
        createElement(AppShellHeader, null, "H"),
        createElement(AppShellSidebar, null, "Nav"),
        createElement(AppShellMain, { "data-testid": "main" } as never, "Content"),
      ),
    );
    expect(screen.getByTestId("main").style.minWidth).toBe("0");
  });

  it("AppShell uses grid layout", () => {
    render(
      createElement(
        AppShell,
        { "data-testid": "shell" } as never,
        createElement(AppShellHeader, null, "H"),
        createElement(AppShellMain, null, "M"),
      ),
    );
    expect(screen.getByTestId("shell").style.display).toBe("grid");
  });
});
