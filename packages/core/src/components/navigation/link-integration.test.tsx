import { describe, it, expect, afterEach } from "vitest";
import { createElement, forwardRef } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import {
  Breadcrumbs,
  BreadcrumbsList,
  BreadcrumbsItem,
  BreadcrumbsLink,
} from "../breadcrumbs/breadcrumbs";
import { NavigationMenuLink } from "../navigation-menu/navigation-menu";
import { SidebarLink } from "../sidebar/sidebar";
import { PaginationItem, Pagination } from "../pagination/pagination";

afterEach(cleanup);

// Simulate a router Link component (like Next.js Link or React Router Link)
const CustomLink = forwardRef<
  HTMLAnchorElement,
  { href: string; children?: React.ReactNode; className?: string }
>(function CustomLink(props, ref) {
  const { href, children, ...rest } = props;
  return createElement("a", { ...rest, ref, href, "data-custom-link": "true" }, children);
});

// ─── Pattern 1: Wrapping KairoUI links with router links ────────────

describe("Link integration: wrapper pattern", () => {
  it("BreadcrumbsLink renders native <a> with href", () => {
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
            createElement(
              BreadcrumbsLink,
              { href: "/about", "data-testid": "link" } as never,
              "About",
            ),
          ),
        ),
      ),
    );
    const link = screen.getByTestId("link");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/about");
  });

  it("consumer can wrap BreadcrumbsLink children with router Link", () => {
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
            createElement(CustomLink, { href: "/about", "data-testid": "custom" }, "About"),
          ),
        ),
      ),
    );
    const link = screen.getByTestId("custom");
    expect(link.getAttribute("data-custom-link")).toBe("true");
    expect(link.getAttribute("href")).toBe("/about");
  });
});

// ─── Pattern 2: NavigationMenuLink with active state ────────────────

describe("Link integration: NavigationMenuLink", () => {
  it("renders <a> with aria-current for active links", () => {
    render(
      createElement(
        NavigationMenuLink,
        { href: "/dashboard", active: true, "data-testid": "nav-link" } as never,
        "Dashboard",
      ),
    );
    const link = screen.getByTestId("nav-link");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.getAttribute("href")).toBe("/dashboard");
  });

  it("inactive link has no aria-current", () => {
    render(
      createElement(
        NavigationMenuLink,
        { href: "/settings", "data-testid": "nav-link" } as never,
        "Settings",
      ),
    );
    expect(screen.getByTestId("nav-link").getAttribute("aria-current")).toBeNull();
  });
});

// ─── Pattern 3: SidebarLink with active/disabled ────────────────────

describe("Link integration: SidebarLink", () => {
  it("active SidebarLink has aria-current=page", () => {
    render(
      createElement(
        SidebarLink,
        { href: "/home", active: true, "data-testid": "sb-link" } as never,
        "Home",
      ),
    );
    const link = screen.getByTestId("sb-link");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.getAttribute("href")).toBe("/home");
  });

  it("disabled SidebarLink has no href", () => {
    render(
      createElement(
        SidebarLink,
        { href: "/admin", disabled: true, "data-testid": "sb-link" } as never,
        "Admin",
      ),
    );
    const link = screen.getByTestId("sb-link");
    expect(link.getAttribute("href")).toBeNull();
    expect(link.getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Pattern 4: PaginationItem renders button or link ───────────────

describe("Link integration: PaginationItem", () => {
  it("renders button without getPageHref", () => {
    render(
      createElement(
        Pagination,
        { totalPages: 10, defaultPage: 1 } as never,
        createElement(PaginationItem, { page: 2, "data-testid": "page-btn" } as never),
      ),
    );
    expect(screen.getByTestId("page-btn").tagName).toBe("BUTTON");
  });

  it("renders <a> with getPageHref", () => {
    render(
      createElement(
        Pagination,
        {
          totalPages: 10,
          defaultPage: 1,
          getPageHref: (p: number) => `/page/${String(p)}`,
        } as never,
        createElement(PaginationItem, { page: 2, "data-testid": "page-link" } as never),
      ),
    );
    const link = screen.getByTestId("page-link");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/page/2");
  });
});

// ─── Pattern 5: Ref forwarding on link components ───────────────────

describe("Link integration: ref forwarding", () => {
  it("BreadcrumbsLink forwards ref", () => {
    let refNode: HTMLAnchorElement | null = null;
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
            createElement(
              BreadcrumbsLink,
              {
                href: "/",
                ref: (node: HTMLAnchorElement | null) => {
                  refNode = node;
                },
              } as never,
              "Home",
            ),
          ),
        ),
      ),
    );
    expect(refNode).not.toBeNull();
    expect(refNode?.tagName).toBe("A");
  });

  it("NavigationMenuLink forwards ref", () => {
    let refNode: HTMLAnchorElement | null = null;
    render(
      createElement(
        NavigationMenuLink,
        {
          href: "/x",
          ref: (node: HTMLAnchorElement | null) => {
            refNode = node;
          },
        } as never,
        "X",
      ),
    );
    expect(refNode).not.toBeNull();
  });
});

// ─── Pattern 6: onPageChange callback is the integration point ──────

describe("Link integration: event callback", () => {
  it("PaginationItem triggers onPageChange on click", () => {
    let page = 0;
    render(
      createElement(
        Pagination,
        {
          totalPages: 5,
          defaultPage: 1,
          onPageChange: (p: number) => {
            page = p;
          },
        } as never,
        createElement(PaginationItem, { page: 3, "data-testid": "pi" } as never),
      ),
    );
    screen.getByTestId("pi").click();
    expect(page).toBe(3);
  });
});
