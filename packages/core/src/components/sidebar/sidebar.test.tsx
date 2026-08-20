import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarLink,
  SidebarTrigger,
} from "./sidebar";

afterEach(cleanup);

function BasicSidebar(props: { collapsed?: boolean; defaultCollapsed?: boolean }) {
  return createElement(
    Sidebar,
    { ...props, "data-testid": "sidebar" } as never,
    createElement(SidebarHeader, { "data-testid": "header" } as never, "Logo"),
    createElement(
      SidebarContent,
      { "data-testid": "content" } as never,
      createElement(
        SidebarGroup,
        { "data-testid": "group" } as never,
        createElement(SidebarGroupLabel, { "data-testid": "group-label" } as never, "Navigation"),
        createElement(
          SidebarItem,
          { active: true, "data-testid": "item-home" } as never,
          createElement(
            SidebarLink,
            { href: "/", active: true, "data-testid": "link-home" } as never,
            "Home",
          ),
        ),
        createElement(
          SidebarItem,
          { "data-testid": "item-docs" } as never,
          createElement(
            SidebarLink,
            { href: "/docs", "data-testid": "link-docs" } as never,
            "Docs",
          ),
        ),
        createElement(
          SidebarItem,
          { disabled: true, "data-testid": "item-disabled" } as never,
          createElement(
            SidebarLink,
            { href: "/admin", disabled: true, "data-testid": "link-disabled" } as never,
            "Admin",
          ),
        ),
      ),
    ),
    createElement(SidebarFooter, { "data-testid": "footer" } as never, "v1.0"),
    createElement(SidebarTrigger, { "data-testid": "trigger" } as never),
  );
}
BasicSidebar.displayName = "BasicSidebar";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Sidebar: rendering", () => {
  it("renders aside element", () => {
    render(createElement(BasicSidebar));
    expect(screen.getByTestId("sidebar").tagName).toBe("ASIDE");
    expect(screen.getByTestId("sidebar").getAttribute("data-kui-component")).toBe("Sidebar");
  });

  it("renders all sections", () => {
    render(createElement(BasicSidebar));
    expect(screen.getByTestId("header").textContent).toBe("Logo");
    expect(screen.getByTestId("content").getAttribute("role")).toBe("navigation");
    expect(screen.getByTestId("footer").textContent).toBe("v1.0");
  });

  it("renders group with items", () => {
    render(createElement(BasicSidebar));
    expect(screen.getByTestId("group").getAttribute("role")).toBe("group");
    expect(screen.getByTestId("link-home").getAttribute("href")).toBe("/");
  });
});

// ─── Active/disabled state ──────────────────────────────────────────

describe("Sidebar: state", () => {
  it("active link has aria-current=page", () => {
    render(createElement(BasicSidebar));
    expect(screen.getByTestId("link-home").getAttribute("aria-current")).toBe("page");
  });

  it("inactive link has no aria-current", () => {
    render(createElement(BasicSidebar));
    expect(screen.getByTestId("link-docs").getAttribute("aria-current")).toBeNull();
  });

  it("disabled link has aria-disabled", () => {
    render(createElement(BasicSidebar));
    expect(screen.getByTestId("link-disabled").getAttribute("aria-disabled")).toBe("true");
  });

  it("disabled item has data-disabled", () => {
    render(createElement(BasicSidebar));
    expect(screen.getByTestId("item-disabled").getAttribute("data-disabled")).toBe("true");
  });
});

// ─── Collapse/expand ────────────────────────────────────────────────

describe("Sidebar: collapse", () => {
  it("starts expanded by default", () => {
    render(createElement(BasicSidebar));
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBeNull();
    expect(screen.getByTestId("sidebar").style.width).toBe("240px");
  });

  it("starts collapsed with defaultCollapsed", () => {
    render(createElement(BasicSidebar, { defaultCollapsed: true }));
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBe("true");
    expect(screen.getByTestId("sidebar").style.width).toBe("60px");
  });

  it("trigger toggles collapsed state", () => {
    render(createElement(BasicSidebar));
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBe("true");
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBeNull();
  });
});

// ─── Collapsible group ──────────────────────────────────────────────

describe("Sidebar: collapsible group", () => {
  it("collapsible group label has aria-expanded", () => {
    render(
      createElement(
        Sidebar,
        null,
        createElement(
          SidebarContent,
          null,
          createElement(
            SidebarGroup,
            { collapsible: true },
            createElement(SidebarGroupLabel, { "data-testid": "cg-label" } as never, "Section"),
            createElement(SidebarItem, null, "Item"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("cg-label").getAttribute("aria-expanded")).toBe("true");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Sidebar: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(BasicSidebar));
    expect(html).toContain("Logo");
    expect(html).toContain("Navigation");
    expect(html).toContain('aria-current="page"');
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Sidebar: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(BasicSidebar)));
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBe("true");
  });
});
