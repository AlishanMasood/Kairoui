/**
 * KUI-NAV-020: Navigation Accessibility Audit
 *
 * Keyboard matrices and ARIA compliance for Phase 11 components.
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from "../accordion/accordion";
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
  PaginationEllipsis,
} from "../pagination/pagination";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent } from "../menubar/menubar";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "../navigation-menu/navigation-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarLink,
  SidebarTrigger,
} from "../sidebar/sidebar";
import { AppShell, AppShellHeader, AppShellSidebar, AppShellMain } from "../app-shell/app-shell";

// ═══════════════════════════════════════════════════════════════════════
// TABS — Keyboard Matrix
// ═══════════════════════════════════════════════════════════════════════

describe("Tabs — Accessibility & Keyboard Matrix", () => {
  function renderTabs(
    opts: {
      orientation?: "horizontal" | "vertical";
      dir?: "ltr" | "rtl";
      activationMode?: "automatic" | "manual";
    } = {},
  ) {
    return render(
      createElement(
        Tabs,
        { defaultValue: "a", ...opts },
        createElement(
          TabsList,
          null,
          createElement(TabsTrigger, { value: "a" }, "Tab A"),
          createElement(TabsTrigger, { value: "b" }, "Tab B"),
          createElement(TabsTrigger, { value: "c", disabled: true }, "Tab C"),
        ),
        createElement(TabsContent, { value: "a" }, "Content A"),
        createElement(TabsContent, { value: "b" }, "Content B"),
        createElement(TabsContent, { value: "c" }, "Content C"),
      ),
    );
  }

  it("roles: tablist, tab, tabpanel", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("aria-selected only on active tab", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("aria-controls links tab to panel", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    const panel = screen.getByRole("tabpanel");
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
  });

  it("aria-labelledby links panel to tab", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    const panel = screen.getByRole("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
  });

  it("tabpanel has tabIndex=0 for sequential focus", () => {
    renderTabs();
    expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
  });

  it("roving tabindex: only selected tab is tabbable", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
  });

  it("ArrowRight moves focus to next tab (horizontal LTR)", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("ArrowLeft moves focus to previous tab (horizontal LTR)", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    tabs[1]!.focus();
    fireEvent.keyDown(tabs[1]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("ArrowRight in RTL wraps to last enabled tab", () => {
    renderTabs({ dir: "rtl" });
    const tabs = screen.getAllByRole("tab");
    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: "ArrowRight" });
    // RTL: ArrowRight = "prev", wraps to last enabled (tab B, since C is disabled)
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("ArrowDown moves focus in vertical orientation", () => {
    renderTabs({ orientation: "vertical" });
    const tabs = screen.getAllByRole("tab");
    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("Home moves focus to first tab", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    tabs[1]!.focus();
    fireEvent.keyDown(tabs[1]!, { key: "Home" });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("End moves focus to last enabled tab", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: "End" });
    // Roving focus operates on enabled items only; tab C is disabled
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("automatic activation: tab activates on focus", () => {
    renderTabs({ activationMode: "automatic" });
    const tabs = screen.getAllByRole("tab");
    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });

  it("manual activation: tab activates only on Enter/Space", () => {
    renderTabs({ activationMode: "manual" });
    const tabs = screen.getAllByRole("tab");
    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: "ArrowRight" });
    // Focus moved but not activated
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    // Activate with Enter
    fireEvent.keyDown(tabs[1]!, { key: "Enter" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });

  it("disabled tab has aria-disabled", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[2]).toHaveAttribute("aria-disabled", "true");
  });

  it("aria-orientation set on tablist", () => {
    renderTabs({ orientation: "vertical" });
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ACCORDION — Keyboard & Semantics
// ═══════════════════════════════════════════════════════════════════════

describe("Accordion — Accessibility", () => {
  function renderAccordion(
    opts: { orientation?: "vertical" | "horizontal"; dir?: "ltr" | "rtl" } = {},
  ) {
    return render(
      createElement(
        Accordion,
        { type: "single", defaultValue: "a", collapsible: true, ...opts },
        createElement(
          AccordionItem,
          { value: "a" },
          createElement(AccordionHeader, null, createElement(AccordionTrigger, null, "Item A")),
          createElement(AccordionContent, null, "Content A"),
        ),
        createElement(
          AccordionItem,
          { value: "b" },
          createElement(AccordionHeader, null, createElement(AccordionTrigger, null, "Item B")),
          createElement(AccordionContent, null, "Content B"),
        ),
        createElement(
          AccordionItem,
          { value: "c", disabled: true },
          createElement(AccordionHeader, null, createElement(AccordionTrigger, null, "Item C")),
          createElement(AccordionContent, null, "Content C"),
        ),
      ),
    );
  }

  it("trigger: aria-expanded reflects open state", () => {
    renderAccordion();
    const triggers = screen.getAllByRole("button");
    expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
    expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
  });

  it("trigger: aria-controls links to content region", () => {
    renderAccordion();
    const trigger = screen.getAllByRole("button")[0]!;
    const region = screen.getByRole("region");
    expect(trigger.getAttribute("aria-controls")).toBe(region.id);
  });

  it("content: role=region with aria-labelledby", () => {
    renderAccordion();
    const region = screen.getByRole("region");
    const trigger = screen.getAllByRole("button")[0]!;
    expect(region.getAttribute("aria-labelledby")).toBe(trigger.id);
  });

  it("header: renders as proper heading level", () => {
    render(
      createElement(
        Accordion,
        { type: "single" },
        createElement(
          AccordionItem,
          { value: "x" },
          createElement(AccordionHeader, { level: 2 }, createElement(AccordionTrigger, null, "H2")),
          createElement(AccordionContent, null, "text"),
        ),
      ),
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("ArrowDown moves to next trigger (vertical)", () => {
    renderAccordion();
    const triggers = screen.getAllByRole("button");
    triggers[0]!.focus();
    fireEvent.keyDown(triggers[0]!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(triggers[1]);
  });

  it("ArrowUp moves to previous trigger (vertical)", () => {
    renderAccordion();
    const triggers = screen.getAllByRole("button");
    triggers[1]!.focus();
    fireEvent.keyDown(triggers[1]!, { key: "ArrowUp" });
    expect(document.activeElement).toBe(triggers[0]);
  });

  it("Home/End navigate to first/last trigger", () => {
    renderAccordion();
    const triggers = screen.getAllByRole("button");
    triggers[1]!.focus();
    fireEvent.keyDown(triggers[1]!, { key: "Home" });
    expect(document.activeElement).toBe(triggers[0]);
    fireEvent.keyDown(triggers[0]!, { key: "End" });
    // Last non-disabled trigger
    expect(document.activeElement).toBe(triggers[1]);
  });

  it("skips disabled items during navigation", () => {
    renderAccordion();
    const triggers = screen.getAllByRole("button");
    triggers[1]!.focus();
    fireEvent.keyDown(triggers[1]!, { key: "ArrowDown" });
    // Should wrap to first (skipping disabled)
    expect(document.activeElement).toBe(triggers[0]);
  });

  it("disabled trigger has aria-disabled", () => {
    renderAccordion();
    const triggers = screen.getAllByRole("button");
    expect(triggers[2]).toHaveAttribute("aria-disabled", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// BREADCRUMBS — Semantics
// ═══════════════════════════════════════════════════════════════════════

describe("Breadcrumbs — Accessibility", () => {
  function renderBreadcrumbs() {
    return render(
      createElement(
        Breadcrumbs,
        null,
        createElement(
          BreadcrumbsList,
          null,
          createElement(
            BreadcrumbsItem,
            null,
            createElement(BreadcrumbsLink, { href: "/" }, "Home"),
          ),
          createElement(BreadcrumbsItem, null, createElement(BreadcrumbsSeparator)),
          createElement(
            BreadcrumbsItem,
            null,
            createElement(BreadcrumbsLink, { href: "/docs" }, "Docs"),
          ),
          createElement(BreadcrumbsItem, null, createElement(BreadcrumbsSeparator)),
          createElement(BreadcrumbsItem, null, createElement(BreadcrumbsCurrent, null, "Current")),
        ),
      ),
    );
  }

  it("nav landmark with aria-label", () => {
    renderBreadcrumbs();
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Breadcrumb");
  });

  it("ordered list provides structure", () => {
    renderBreadcrumbs();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("separator is hidden from AT", () => {
    renderBreadcrumbs();
    const separators = document.querySelectorAll("[aria-hidden='true']");
    expect(separators).toHaveLength(2);
    separators.forEach((sep) => {
      expect(sep).toHaveAttribute("role", "presentation");
    });
  });

  it("current page marked with aria-current=page", () => {
    renderBreadcrumbs();
    const current = screen.getByText("Current");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("links are native <a> elements (no roles needed)", () => {
    renderBreadcrumbs();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// PAGINATION — Semantics
// ═══════════════════════════════════════════════════════════════════════

describe("Pagination — Accessibility", () => {
  function renderPagination(page = 1) {
    return render(
      createElement(
        Pagination,
        { defaultPage: page, totalPages: 10 },
        createElement(PaginationPrevious),
        createElement(PaginationItem, { page: 1 }),
        createElement(PaginationEllipsis),
        createElement(PaginationItem, { page: 5 }),
        createElement(PaginationNext),
      ),
    );
  }

  it("nav landmark with aria-label", () => {
    renderPagination();
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "Pagination");
  });

  it("current page has aria-current=page", () => {
    renderPagination(1);
    const items = screen.getAllByRole("button");
    // PaginationItem for page 1
    const page1 = items.find((b) => b.textContent === "1")!;
    expect(page1).toHaveAttribute("aria-current", "page");
  });

  it("previous button: aria-label and aria-disabled at boundary", () => {
    renderPagination(1);
    const prev = screen.getByLabelText("Go to previous page");
    expect(prev).toHaveAttribute("aria-disabled", "true");
  });

  it("next button: aria-label and aria-disabled at boundary", () => {
    renderPagination(10);
    const next = screen.getByLabelText("Go to next page");
    expect(next).toHaveAttribute("aria-disabled", "true");
  });

  it("page buttons have accessible labels", () => {
    renderPagination();
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 5")).toBeInTheDocument();
  });

  it("ellipsis is hidden from AT", () => {
    renderPagination();
    const ellipsis = document.querySelector("[aria-hidden='true']");
    expect(ellipsis).toBeInTheDocument();
    expect(ellipsis!.textContent).toBe("…");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MENUBAR — Keyboard Matrix
// ═══════════════════════════════════════════════════════════════════════

describe("Menubar — Accessibility & Keyboard Matrix", () => {
  function renderMenubar(dir: "ltr" | "rtl" = "ltr") {
    return render(
      createElement(
        Menubar,
        { dir },
        createElement(
          MenubarMenu,
          { value: "file" },
          createElement(MenubarTrigger, null, "File"),
          createElement(MenubarContent, null, createElement("div", { role: "menuitem" }, "New")),
        ),
        createElement(
          MenubarMenu,
          { value: "edit" },
          createElement(MenubarTrigger, null, "Edit"),
          createElement(MenubarContent, null, createElement("div", { role: "menuitem" }, "Undo")),
        ),
        createElement(
          MenubarMenu,
          { value: "view" },
          createElement(MenubarTrigger, null, "View"),
          createElement(MenubarContent, null, createElement("div", { role: "menuitem" }, "Zoom")),
        ),
      ),
    );
  }

  it("role=menubar on root", () => {
    renderMenubar();
    expect(screen.getByRole("menubar")).toBeInTheDocument();
  });

  it("aria-orientation=horizontal", () => {
    renderMenubar();
    expect(screen.getByRole("menubar")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("triggers: role=menuitem with aria-haspopup=menu", () => {
    renderMenubar();
    const triggers = screen.getAllByRole("menuitem");
    expect(triggers).toHaveLength(3);
    triggers.forEach((t) => {
      expect(t).toHaveAttribute("aria-haspopup", "menu");
    });
  });

  it("roving tabindex: only first trigger is tabbable initially", () => {
    renderMenubar();
    const triggers = screen.getAllByRole("menuitem");
    expect(triggers[0]).toHaveAttribute("tabindex", "0");
    expect(triggers[1]).toHaveAttribute("tabindex", "-1");
    expect(triggers[2]).toHaveAttribute("tabindex", "-1");
  });

  it("roving tabindex: focus updates roving target", () => {
    renderMenubar();
    const triggers = screen.getAllByRole("menuitem");
    fireEvent.focus(triggers[1]!);
    expect(triggers[0]).toHaveAttribute("tabindex", "-1");
    expect(triggers[1]).toHaveAttribute("tabindex", "0");
  });

  it("ArrowRight moves focus to next trigger (LTR)", () => {
    renderMenubar();
    const triggers = screen.getAllByRole("menuitem");
    triggers[0]!.focus();
    fireEvent.keyDown(triggers[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(triggers[1]);
  });

  it("ArrowLeft moves focus to previous trigger (LTR)", () => {
    renderMenubar();
    const triggers = screen.getAllByRole("menuitem");
    triggers[1]!.focus();
    fireEvent.keyDown(triggers[1]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(triggers[0]);
  });

  it("ArrowRight in RTL moves to previous trigger", () => {
    renderMenubar("rtl");
    const triggers = screen.getAllByRole("menuitem");
    triggers[1]!.focus();
    fireEvent.keyDown(triggers[1]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(triggers[0]);
  });

  it("ArrowDown/Enter/Space opens menu", () => {
    renderMenubar();
    const triggers = screen.getAllByRole("menuitem");
    triggers[0]!.focus();
    fireEvent.keyDown(triggers[0]!, { key: "ArrowDown" });
    expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
  });

  it("trigger aria-expanded reflects open state", () => {
    renderMenubar();
    const triggers = screen.getAllByRole("menuitem");
    expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("open menu has role=menu with aria-labelledby", () => {
    renderMenubar();
    const triggers = screen.getAllByRole("menuitem");
    fireEvent.keyDown(triggers[0]!, { key: "Enter" });
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("aria-labelledby", triggers[0]!.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION MENU — Keyboard Matrix
// ═══════════════════════════════════════════════════════════════════════

describe("NavigationMenu — Accessibility & Keyboard Matrix", () => {
  function renderNavMenu() {
    return render(
      createElement(
        NavigationMenu,
        { label: "Site navigation" },
        createElement(
          NavigationMenuList,
          null,
          createElement(
            NavigationMenuItem,
            { value: "products" },
            createElement(NavigationMenuTrigger, null, "Products"),
            createElement(
              NavigationMenuContent,
              null,
              createElement(NavigationMenuLink, { href: "/a", active: true }, "Product A"),
              createElement(NavigationMenuLink, { href: "/b" }, "Product B"),
            ),
          ),
          createElement(
            NavigationMenuItem,
            { value: "docs" },
            createElement(NavigationMenuTrigger, null, "Docs"),
            createElement(
              NavigationMenuContent,
              null,
              createElement(NavigationMenuLink, { href: "/docs" }, "Documentation"),
            ),
          ),
          createElement(
            NavigationMenuItem,
            null,
            createElement(NavigationMenuLink, { href: "/about" }, "About"),
          ),
        ),
      ),
    );
  }

  it("nav landmark with configurable aria-label", () => {
    renderNavMenu();
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Site navigation");
  });

  it("triggers have aria-haspopup=true", () => {
    renderNavMenu();
    const triggers = screen.getAllByRole("button");
    triggers.forEach((t) => {
      expect(t).toHaveAttribute("aria-haspopup", "true");
    });
  });

  it("trigger: aria-expanded=false when closed", () => {
    renderNavMenu();
    const triggers = screen.getAllByRole("button");
    triggers.forEach((t) => {
      expect(t).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("ArrowDown opens content", () => {
    renderNavMenu();
    const triggers = screen.getAllByRole("button");
    triggers[0]!.focus();
    fireEvent.keyDown(triggers[0]!, { key: "ArrowDown" });
    expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
  });

  it("Enter/Space opens content", () => {
    renderNavMenu();
    const triggers = screen.getAllByRole("button");
    triggers[1]!.focus();
    fireEvent.keyDown(triggers[1]!, { key: "Enter" });
    expect(triggers[1]).toHaveAttribute("aria-expanded", "true");
  });

  it("trigger aria-controls references content id", () => {
    renderNavMenu();
    const triggers = screen.getAllByRole("button");
    fireEvent.keyDown(triggers[0]!, { key: "Enter" });
    const contentId = triggers[0]!.getAttribute("aria-controls");
    expect(contentId).toBeTruthy();
    expect(document.getElementById(contentId!)).toBeInTheDocument();
  });

  it("active link has aria-current=page", () => {
    renderNavMenu();
    const triggers = screen.getAllByRole("button");
    fireEvent.keyDown(triggers[0]!, { key: "Enter" });
    const activeLink = screen.getByText("Product A");
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("inactive link has no aria-current", () => {
    renderNavMenu();
    const about = screen.getByText("About");
    expect(about).not.toHaveAttribute("aria-current");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SIDEBAR — Keyboard & Semantics
// ═══════════════════════════════════════════════════════════════════════

describe("Sidebar — Accessibility & Keyboard", () => {
  function renderSidebar(collapsed = false) {
    return render(
      createElement(
        Sidebar,
        { collapsed },
        createElement(
          SidebarContent,
          null,
          createElement(
            SidebarGroup,
            { collapsible: true },
            createElement(SidebarGroupLabel, null, "Section"),
            createElement(SidebarLink, { href: "/home", active: true }, "Home"),
            createElement(SidebarLink, { href: "/about", disabled: true }, "About"),
          ),
        ),
        createElement(SidebarTrigger),
      ),
    );
  }

  it("SidebarContent has role=navigation", () => {
    renderSidebar();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("SidebarGroup has role=group", () => {
    renderSidebar();
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("collapsible group label renders as button with aria-expanded", () => {
    renderSidebar();
    const label = screen.getByRole("button", { name: "Section" });
    expect(label).toHaveAttribute("aria-expanded", "true");
  });

  it("active link has aria-current=page", () => {
    renderSidebar();
    const link = screen.getByText("Home");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("disabled link has aria-disabled and no href", () => {
    renderSidebar();
    const link = screen.getByText("About");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).not.toHaveAttribute("href");
  });

  it("SidebarTrigger has aria-expanded reflecting state", () => {
    renderSidebar(false);
    const trigger = screen.getByRole("button", { name: "Toggle sidebar" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("SidebarTrigger aria-expanded=false when collapsed", () => {
    renderSidebar(true);
    const trigger = screen.getByRole("button", { name: "Toggle sidebar" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("SidebarTrigger has accessible label", () => {
    renderSidebar();
    expect(screen.getByLabelText("Toggle sidebar")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// APP SHELL — Semantic Landmarks
// ═══════════════════════════════════════════════════════════════════════

describe("AppShell — Semantic Landmarks", () => {
  it("uses semantic HTML elements for landmark roles", () => {
    render(
      createElement(
        AppShell,
        null,
        createElement(AppShellHeader, null, "Header"),
        createElement(AppShellSidebar, null, "Sidebar"),
        createElement(AppShellMain, null, "Main content"),
      ),
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("main content is in the natural tab order", () => {
    render(
      createElement(
        AppShell,
        null,
        createElement(AppShellMain, null, createElement("a", { href: "#" }, "Link in main")),
      ),
    );
    expect(screen.getByRole("link", { name: "Link in main" })).toBeInTheDocument();
  });
});
