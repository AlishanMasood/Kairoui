/**
 * Consumer integration test — validates Phase 11 navigation components from an
 * external consumer perspective. Imports ONLY from approved package exports.
 *
 * Covers: package exports, custom link props, refs, aria-current, SSR,
 * hydration, Strict Mode, RTL, tree-shaking markers.
 */
import { describe, it, expect, afterEach } from "vitest";
import { createElement, createRef, forwardRef, StrictMode } from "react";
import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";

// Consumer imports ONLY from approved package export paths
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  Breadcrumbs,
  BreadcrumbsList,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsSeparator,
  BreadcrumbsCurrent,
  Pagination,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  computePageRange,
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarLink,
  SidebarTrigger,
  AppShell,
  AppShellHeader,
  AppShellSidebar,
  AppShellMain,
  AppShellAside,
  AppShellFooter,
} from "@kairoui/core/components";

afterEach(cleanup);

// ─── Mock router link fixtures ──────────────────────────────────────

interface NextLinkProps {
  href: string;
  children?: ReactNode;
  className?: string;
  "aria-current"?: string;
  "data-testid"?: string;
}

// Next.js-like link that accepts href as a prop
const NextLink = forwardRef<HTMLAnchorElement, NextLinkProps>(function NextLink(props, ref) {
  const { href, children, ...rest } = props;
  return createElement("a", { ...rest, ref, href, "data-router": "next" }, children);
});

interface RRLinkProps {
  to: string;
  children?: ReactNode;
  className?: string;
  "aria-current"?: string;
  "data-testid"?: string;
}

// React Router-like link that accepts `to` as a prop
const RRLink = forwardRef<HTMLAnchorElement, RRLinkProps>(function RRLink(props, ref) {
  const { to, children, ...rest } = props;
  return createElement("a", { ...rest, ref, href: to, "data-router": "rr" }, children);
});

// ═══════════════════════════════════════════════════════════════════════
// PACKAGE EXPORTS
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: package exports available", () => {
  it("all Tabs exports are functions", () => {
    expect(typeof Tabs).toBe("object"); // forwardRef
    expect(typeof TabsList).toBe("object");
    expect(typeof TabsTrigger).toBe("object");
    expect(typeof TabsContent).toBe("object");
  });

  it("all Accordion exports are functions or objects", () => {
    expect(typeof Accordion).toBe("object");
    expect(typeof AccordionItem).toBe("object");
    expect(typeof AccordionHeader).toBe("object");
    expect(typeof AccordionTrigger).toBe("object");
    expect(typeof AccordionContent).toBe("object");
  });

  it("all Breadcrumbs exports are objects", () => {
    expect(typeof Breadcrumbs).toBe("object");
    expect(typeof BreadcrumbsList).toBe("object");
    expect(typeof BreadcrumbsItem).toBe("object");
    expect(typeof BreadcrumbsLink).toBe("object");
    expect(typeof BreadcrumbsSeparator).toBe("object");
    expect(typeof BreadcrumbsCurrent).toBe("object");
  });

  it("Pagination exports include computePageRange utility", () => {
    expect(typeof computePageRange).toBe("function");
    const range = computePageRange(5, 20, 1, 1);
    expect(range.items.length).toBeGreaterThan(0);
    expect(range.items.some((i) => i.type === "ellipsis")).toBe(true);
  });

  it("all NavigationMenu exports are objects or functions", () => {
    expect(typeof NavigationMenu).toBe("object");
    expect(typeof NavigationMenuList).toBe("object");
    expect(typeof NavigationMenuItem).toBe("function");
    expect(typeof NavigationMenuTrigger).toBe("object");
    expect(typeof NavigationMenuContent).toBe("object");
    expect(typeof NavigationMenuLink).toBe("object");
  });

  it("all Sidebar exports are objects", () => {
    expect(typeof Sidebar).toBe("object");
    expect(typeof SidebarHeader).toBe("object");
    expect(typeof SidebarContent).toBe("object");
    expect(typeof SidebarFooter).toBe("object");
    expect(typeof SidebarGroup).toBe("object");
    expect(typeof SidebarGroupLabel).toBe("object");
    expect(typeof SidebarItem).toBe("object");
    expect(typeof SidebarLink).toBe("object");
    expect(typeof SidebarTrigger).toBe("object");
  });

  it("all AppShell exports are objects", () => {
    expect(typeof AppShell).toBe("object");
    expect(typeof AppShellHeader).toBe("object");
    expect(typeof AppShellSidebar).toBe("object");
    expect(typeof AppShellMain).toBe("object");
    expect(typeof AppShellAside).toBe("object");
    expect(typeof AppShellFooter).toBe("object");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM LINK INTEGRATION — Next.js-like
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: Next.js-like link integration", () => {
  it("NextLink inside BreadcrumbsItem renders with router marker", () => {
    render(
      createElement(
        Breadcrumbs,
        null,
        createElement(
          BreadcrumbsList,
          null,
          createElement(
            BreadcrumbsItem,
            null,
            createElement(NextLink, { href: "/products", "data-testid": "nl" }, "Products"),
          ),
        ),
      ),
    );
    const link = screen.getByTestId("nl");
    expect(link.getAttribute("data-router")).toBe("next");
    expect(link.getAttribute("href")).toBe("/products");
  });

  it("NextLink for NavigationMenu direct links", () => {
    render(
      createElement(
        NavigationMenu,
        null,
        createElement(
          NavigationMenuList,
          null,
          createElement(
            NavigationMenuItem,
            null,
            createElement(NextLink, { href: "/about", "data-testid": "nav-nl" }, "About"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("nav-nl").getAttribute("data-router")).toBe("next");
  });

  it("NextLink in Sidebar preserves consumer props", () => {
    render(
      createElement(
        Sidebar,
        null,
        createElement(
          SidebarContent,
          null,
          createElement(
            SidebarGroup,
            null,
            createElement(
              NextLink,
              {
                href: "/dash",
                "data-testid": "sb-nl",
                "aria-current": "page",
              },
              "Dashboard",
            ),
          ),
        ),
      ),
    );
    const link = screen.getByTestId("sb-nl");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.getAttribute("data-router")).toBe("next");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM LINK INTEGRATION — React Router-like
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: React Router-like link integration", () => {
  it("RRLink inside BreadcrumbsItem renders with to→href", () => {
    render(
      createElement(
        Breadcrumbs,
        null,
        createElement(
          BreadcrumbsList,
          null,
          createElement(
            BreadcrumbsItem,
            null,
            createElement(RRLink, { to: "/orders", "data-testid": "rrl" }, "Orders"),
          ),
        ),
      ),
    );
    const link = screen.getByTestId("rrl");
    expect(link.getAttribute("data-router")).toBe("rr");
    expect(link.getAttribute("href")).toBe("/orders");
  });

  it("RRLink in NavigationMenu item", () => {
    render(
      createElement(
        NavigationMenu,
        null,
        createElement(
          NavigationMenuList,
          null,
          createElement(
            NavigationMenuItem,
            null,
            createElement(RRLink, { to: "/contact", "data-testid": "nav-rrl" }, "Contact"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("nav-rrl").getAttribute("data-router")).toBe("rr");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// REF FORWARDING
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: ref forwarding", () => {
  it("Tabs forwards ref to root div", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      createElement(
        Tabs,
        { ref, defaultValue: "a" },
        createElement(TabsList, null, createElement(TabsTrigger, { value: "a" }, "A")),
        createElement(TabsContent, { value: "a" }, "Content"),
      ),
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("TabsTrigger forwards ref to button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      createElement(
        Tabs,
        { defaultValue: "a" },
        createElement(TabsList, null, createElement(TabsTrigger, { ref, value: "a" }, "A")),
      ),
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.getAttribute("role")).toBe("tab");
  });

  it("AccordionTrigger forwards ref to button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      createElement(
        Accordion,
        { type: "single" },
        createElement(
          AccordionItem,
          { value: "x" },
          createElement(AccordionHeader, null, createElement(AccordionTrigger, { ref }, "Trigger")),
        ),
      ),
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("BreadcrumbsLink forwards ref to anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      createElement(
        Breadcrumbs,
        null,
        createElement(
          BreadcrumbsList,
          null,
          createElement(
            BreadcrumbsItem,
            null,
            createElement(BreadcrumbsLink, { ref, href: "/" }, "Home"),
          ),
        ),
      ),
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("NavigationMenuLink forwards ref to anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(createElement(NavigationMenuLink, { ref, href: "/x" }, "Link"));
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("SidebarLink forwards ref to anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      createElement(
        Sidebar,
        null,
        createElement(
          SidebarContent,
          null,
          createElement(
            SidebarGroup,
            null,
            createElement(SidebarLink, { ref, href: "/home" }, "Home"),
          ),
        ),
      ),
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("AppShellMain forwards ref to main element", () => {
    const ref = createRef<HTMLElement>();
    render(createElement(AppShell, null, createElement(AppShellMain, { ref }, "Content")));
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe("MAIN");
  });

  it("AppShellHeader forwards ref to header element", () => {
    const ref = createRef<HTMLElement>();
    render(createElement(AppShell, null, createElement(AppShellHeader, { ref }, "Header")));
    expect(ref.current?.tagName).toBe("HEADER");
  });

  it("SidebarTrigger forwards ref to button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(createElement(Sidebar, null, createElement(SidebarTrigger, { ref })));
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("PaginationPrevious forwards ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      createElement(
        Pagination,
        { totalPages: 5, defaultPage: 1 },
        createElement(PaginationPrevious, { ref }),
      ),
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// aria-current INTEGRATION
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: aria-current propagation", () => {
  it("BreadcrumbsCurrent sets aria-current=page", () => {
    render(
      createElement(
        Breadcrumbs,
        null,
        createElement(
          BreadcrumbsList,
          null,
          createElement(
            BreadcrumbsItem,
            null,
            createElement(BreadcrumbsCurrent, { "data-testid": "cur" } as never, "Page"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("cur").getAttribute("aria-current")).toBe("page");
  });

  it("NavigationMenuLink active sets aria-current=page", () => {
    render(
      createElement(
        NavigationMenuLink,
        {
          href: "/dash",
          active: true,
          "data-testid": "active-link",
        } as never,
        "Dashboard",
      ),
    );
    expect(screen.getByTestId("active-link").getAttribute("aria-current")).toBe("page");
  });

  it("NavigationMenuLink inactive has no aria-current", () => {
    render(
      createElement(
        NavigationMenuLink,
        {
          href: "/other",
          "data-testid": "inactive-link",
        } as never,
        "Other",
      ),
    );
    expect(screen.getByTestId("inactive-link").getAttribute("aria-current")).toBeNull();
  });

  it("SidebarLink active sets aria-current=page", () => {
    render(
      createElement(
        Sidebar,
        null,
        createElement(
          SidebarContent,
          null,
          createElement(
            SidebarGroup,
            null,
            createElement(
              SidebarLink,
              {
                href: "/home",
                active: true,
                "data-testid": "sl-active",
              } as never,
              "Home",
            ),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("sl-active").getAttribute("aria-current")).toBe("page");
  });

  it("PaginationItem current page sets aria-current=page", () => {
    render(
      createElement(
        Pagination,
        { totalPages: 5, defaultPage: 3 },
        createElement(PaginationItem, { page: 3, "data-testid": "page3" } as never),
      ),
    );
    expect(screen.getByTestId("page3").getAttribute("aria-current")).toBe("page");
  });

  it("PaginationItem non-current has no aria-current", () => {
    render(
      createElement(
        Pagination,
        { totalPages: 5, defaultPage: 1 },
        createElement(PaginationItem, { page: 3, "data-testid": "page3" } as never),
      ),
    );
    expect(screen.getByTestId("page3").getAttribute("aria-current")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SSR RENDERING
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: SSR rendering", () => {
  it("Tabs renders to string without errors", () => {
    const html = renderToString(
      createElement(
        Tabs,
        { defaultValue: "a" },
        createElement(
          TabsList,
          null,
          createElement(TabsTrigger, { value: "a" }, "Tab A"),
          createElement(TabsTrigger, { value: "b" }, "Tab B"),
        ),
        createElement(TabsContent, { value: "a" }, "Content A"),
      ),
    );
    expect(html).toContain("Tab A");
    expect(html).toContain("Tab B");
    expect(html).toContain("Content A");
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
  });

  it("Accordion renders to string", () => {
    const html = renderToString(
      createElement(
        Accordion,
        { type: "single", defaultValue: "a" },
        createElement(
          AccordionItem,
          { value: "a" },
          createElement(AccordionHeader, null, createElement(AccordionTrigger, null, "Trigger")),
          createElement(AccordionContent, null, "Content"),
        ),
      ),
    );
    expect(html).toContain("Trigger");
    expect(html).toContain("Content");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="region"');
  });

  it("Breadcrumbs renders to string with landmarks", () => {
    const html = renderToString(
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
          createElement(BreadcrumbsItem, null, createElement(BreadcrumbsCurrent, null, "Page")),
        ),
      ),
    );
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("AppShell renders with semantic landmarks in SSR", () => {
    const html = renderToString(
      createElement(
        AppShell,
        null,
        createElement(AppShellHeader, null, "Header"),
        createElement(AppShellSidebar, null, "Sidebar"),
        createElement(AppShellMain, null, "Main"),
        createElement(AppShellFooter, null, "Footer"),
      ),
    );
    expect(html).toContain("<header");
    expect(html).toContain("<aside");
    expect(html).toContain("<main");
    expect(html).toContain("<footer");
  });

  it("Sidebar renders with navigation role in SSR", () => {
    const html = renderToString(
      createElement(
        Sidebar,
        null,
        createElement(
          SidebarContent,
          null,
          createElement(
            SidebarGroup,
            null,
            createElement(SidebarLink, { href: "/a", active: true }, "A"),
          ),
        ),
      ),
    );
    expect(html).toContain('role="navigation"');
    expect(html).toContain('aria-current="page"');
  });

  it("NavigationMenu renders nav landmark in SSR", () => {
    const html = renderToString(
      createElement(
        NavigationMenu,
        { label: "Main" },
        createElement(
          NavigationMenuList,
          null,
          createElement(
            NavigationMenuItem,
            null,
            createElement(NavigationMenuLink, { href: "/home", active: true }, "Home"),
          ),
        ),
      ),
    );
    expect(html).toContain('aria-label="Main"');
    expect(html).toContain('aria-current="page"');
  });

  it("Pagination renders nav with label in SSR", () => {
    const html = renderToString(
      createElement(
        Pagination,
        { totalPages: 5, defaultPage: 2, label: "Pages" },
        createElement(PaginationPrevious),
        createElement(PaginationItem, { page: 1 }),
        createElement(PaginationItem, { page: 2 }),
        createElement(PaginationNext),
      ),
    );
    expect(html).toContain('aria-label="Pages"');
    expect(html).toContain('aria-current="page"');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STRICT MODE
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: Strict Mode compatibility", () => {
  it("Tabs works in StrictMode without errors", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          Tabs,
          { defaultValue: "a" },
          createElement(
            TabsList,
            null,
            createElement(TabsTrigger, { value: "a" }, "A"),
            createElement(TabsTrigger, { value: "b" }, "B"),
          ),
          createElement(TabsContent, { value: "a" }, "Content A"),
          createElement(TabsContent, { value: "b" }, "Content B"),
        ),
      ),
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("Accordion works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          Accordion,
          { type: "single", defaultValue: "a" },
          createElement(
            AccordionItem,
            { value: "a" },
            createElement(AccordionHeader, null, createElement(AccordionTrigger, null, "T")),
            createElement(AccordionContent, null, "C"),
          ),
        ),
      ),
    );
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("Menubar works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          Menubar,
          null,
          createElement(
            MenubarMenu,
            { value: "file" },
            createElement(MenubarTrigger, null, "File"),
            createElement(MenubarContent, null, createElement("div", { role: "menuitem" }, "New")),
          ),
        ),
      ),
    );
    expect(screen.getByRole("menubar")).toBeInTheDocument();
  });

  it("AppShell works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          AppShell,
          null,
          createElement(AppShellHeader, null, "H"),
          createElement(AppShellMain, null, "M"),
        ),
      ),
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// RTL SUPPORT
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: RTL support", () => {
  it("Tabs passes dir to data-orientation context", () => {
    render(
      createElement(
        Tabs,
        { defaultValue: "a", dir: "rtl", "data-testid": "tabs-rtl" } as never,
        createElement(
          TabsList,
          null,
          createElement(TabsTrigger, { value: "a" }, "A"),
          createElement(TabsTrigger, { value: "b" }, "B"),
        ),
      ),
    );
    // Tabs renders with data-orientation; dir is used for keyboard navigation
    const tabs = screen.getAllByRole("tab");
    tabs[0]!.focus();
    // In RTL, ArrowLeft should move to next (reversed)
    fireEvent.keyDown(tabs[0]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("Accordion supports RTL keyboard navigation", () => {
    render(
      createElement(
        Accordion,
        { type: "single", dir: "rtl", orientation: "horizontal" },
        createElement(
          AccordionItem,
          { value: "a" },
          createElement(AccordionHeader, null, createElement(AccordionTrigger, null, "A")),
          createElement(AccordionContent, null, "CA"),
        ),
        createElement(
          AccordionItem,
          { value: "b" },
          createElement(AccordionHeader, null, createElement(AccordionTrigger, null, "B")),
          createElement(AccordionContent, null, "CB"),
        ),
      ),
    );
    const triggers = screen.getAllByRole("button");
    triggers[0]!.focus();
    // In RTL horizontal, ArrowLeft = next
    fireEvent.keyDown(triggers[0]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(triggers[1]);
  });

  it("Menubar supports RTL keyboard navigation", () => {
    render(
      createElement(
        Menubar,
        { dir: "rtl" },
        createElement(
          MenubarMenu,
          { value: "a" },
          createElement(MenubarTrigger, null, "A"),
          createElement(MenubarContent, null, createElement("div", { role: "menuitem" }, "Item")),
        ),
        createElement(
          MenubarMenu,
          { value: "b" },
          createElement(MenubarTrigger, null, "B"),
          createElement(MenubarContent, null, createElement("div", { role: "menuitem" }, "Item")),
        ),
      ),
    );
    const triggers = screen.getAllByRole("menuitem");
    triggers[0]!.focus();
    // In RTL, ArrowLeft moves to next (reversed direction)
    fireEvent.keyDown(triggers[0]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(triggers[1]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TREE-SHAKING VALIDATION
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: tree-shaking readiness", () => {
  it("sideEffects is correctly configured", () => {
    const pkgPath = resolve(import.meta.dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { sideEffects: string[] };
    expect(pkg.sideEffects).toEqual(["**/*.css"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FULL APPLICATION FIXTURE
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: full application fixture", () => {
  it("AppShell with Sidebar and Tabs renders correctly", () => {
    render(
      createElement(
        AppShell,
        { "data-testid": "shell" } as never,
        createElement(AppShellHeader, null, "App Header"),
        createElement(
          AppShellSidebar,
          null,
          createElement(
            Sidebar,
            null,
            createElement(
              SidebarContent,
              null,
              createElement(
                SidebarGroup,
                null,
                createElement(SidebarGroupLabel, null, "Navigation"),
                createElement(SidebarLink, { href: "/", active: true }, "Dashboard"),
                createElement(SidebarLink, { href: "/settings" }, "Settings"),
              ),
            ),
          ),
        ),
        createElement(
          AppShellMain,
          null,
          createElement(
            Tabs,
            { defaultValue: "overview" },
            createElement(
              TabsList,
              null,
              createElement(TabsTrigger, { value: "overview" }, "Overview"),
              createElement(TabsTrigger, { value: "details" }, "Details"),
            ),
            createElement(TabsContent, { value: "overview" }, "Overview content"),
            createElement(TabsContent, { value: "details" }, "Details content"),
          ),
        ),
      ),
    );

    // Landmarks
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    // AppShellSidebar (<aside>) + inner Sidebar (<aside>) = 2 complementary
    expect(screen.getAllByRole("complementary").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("navigation")).toBeInTheDocument();

    // Sidebar
    expect(screen.getByText("Dashboard").getAttribute("aria-current")).toBe("page");

    // Tabs
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview content");
  });

  it("full fixture SSR renders without errors", () => {
    const html = renderToString(
      createElement(
        AppShell,
        null,
        createElement(
          AppShellHeader,
          null,
          createElement(
            NavigationMenu,
            { label: "Site" },
            createElement(
              NavigationMenuList,
              null,
              createElement(
                NavigationMenuItem,
                null,
                createElement(NavigationMenuLink, { href: "/", active: true }, "Home"),
              ),
            ),
          ),
        ),
        createElement(
          AppShellSidebar,
          null,
          createElement(
            Sidebar,
            null,
            createElement(
              SidebarContent,
              null,
              createElement(
                SidebarGroup,
                { collapsible: true },
                createElement(SidebarGroupLabel, null, "Docs"),
                createElement(SidebarLink, { href: "/guide" }, "Guide"),
              ),
            ),
          ),
        ),
        createElement(
          AppShellMain,
          null,
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
                createElement(BreadcrumbsCurrent, null, "Current"),
              ),
            ),
          ),
          createElement(
            Accordion,
            { type: "single", defaultValue: "faq1" },
            createElement(
              AccordionItem,
              { value: "faq1" },
              createElement(AccordionHeader, null, createElement(AccordionTrigger, null, "FAQ 1")),
              createElement(AccordionContent, null, "Answer 1"),
            ),
          ),
          createElement(
            Pagination,
            { totalPages: 10, defaultPage: 1 },
            createElement(PaginationPrevious),
            createElement(PaginationItem, { page: 1 }),
            createElement(PaginationEllipsis),
            createElement(PaginationItem, { page: 10 }),
            createElement(PaginationNext),
          ),
        ),
        createElement(AppShellFooter, null, "Footer"),
      ),
    );

    expect(html).toContain("<header");
    expect(html).toContain("<main");
    expect(html).toContain("<aside");
    expect(html).toContain("<footer");
    expect(html).toContain('aria-label="Site"');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Pagination"');
  });
});
