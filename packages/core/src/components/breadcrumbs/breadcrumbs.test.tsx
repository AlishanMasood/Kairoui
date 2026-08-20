import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Breadcrumbs,
  BreadcrumbsList,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsSeparator,
  BreadcrumbsCurrent,
} from "./breadcrumbs";

afterEach(cleanup);

function BasicBreadcrumbs() {
  return createElement(
    Breadcrumbs,
    { "data-testid": "nav" } as never,
    createElement(
      BreadcrumbsList,
      { "data-testid": "list" } as never,
      createElement(
        BreadcrumbsItem,
        null,
        createElement(BreadcrumbsLink, { href: "/", "data-testid": "link-home" } as never, "Home"),
        createElement(BreadcrumbsSeparator, { "data-testid": "sep" } as never),
      ),
      createElement(
        BreadcrumbsItem,
        null,
        createElement(
          BreadcrumbsLink,
          { href: "/docs", "data-testid": "link-docs" } as never,
          "Docs",
        ),
        createElement(BreadcrumbsSeparator),
      ),
      createElement(
        BreadcrumbsItem,
        null,
        createElement(BreadcrumbsCurrent, { "data-testid": "current" } as never, "Tabs"),
      ),
    ),
  );
}
BasicBreadcrumbs.displayName = "BasicBreadcrumbs";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Breadcrumbs: rendering", () => {
  it("renders nav with aria-label", () => {
    render(createElement(BasicBreadcrumbs));
    const nav = screen.getByTestId("nav");
    expect(nav.tagName).toBe("NAV");
    expect(nav.getAttribute("aria-label")).toBe("Breadcrumb");
  });

  it("renders ordered list", () => {
    render(createElement(BasicBreadcrumbs));
    expect(screen.getByTestId("list").tagName).toBe("OL");
  });

  it("renders links with href", () => {
    render(createElement(BasicBreadcrumbs));
    expect(screen.getByTestId("link-home").getAttribute("href")).toBe("/");
    expect(screen.getByTestId("link-docs").getAttribute("href")).toBe("/docs");
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Breadcrumbs: accessibility", () => {
  it("current page has aria-current=page", () => {
    render(createElement(BasicBreadcrumbs));
    expect(screen.getByTestId("current").getAttribute("aria-current")).toBe("page");
  });

  it("separator is aria-hidden", () => {
    render(createElement(BasicBreadcrumbs));
    expect(screen.getByTestId("sep").getAttribute("aria-hidden")).toBe("true");
  });

  it("separator has role=presentation", () => {
    render(createElement(BasicBreadcrumbs));
    expect(screen.getByTestId("sep").getAttribute("role")).toBe("presentation");
  });
});

// ─── Custom separator ───────────────────────────────────────────────

describe("Breadcrumbs: custom separator", () => {
  it("default separator is /", () => {
    render(createElement(BasicBreadcrumbs));
    expect(screen.getByTestId("sep").textContent).toBe("/");
  });

  it("supports custom separator content", () => {
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
            createElement(BreadcrumbsSeparator, { "data-testid": "custom-sep" } as never, "›"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("custom-sep").textContent).toBe("›");
  });
});

// ─── Custom label ───────────────────────────────────────────────────

describe("Breadcrumbs: custom label", () => {
  it("supports custom aria-label", () => {
    render(createElement(Breadcrumbs, { label: "Navigation path", "data-testid": "nav" } as never));
    expect(screen.getByTestId("nav").getAttribute("aria-label")).toBe("Navigation path");
  });
});

// ─── data-kui-component ─────────────────────────────────────────────

describe("Breadcrumbs: markers", () => {
  it("all parts have data-kui-component", () => {
    render(createElement(BasicBreadcrumbs));
    expect(screen.getByTestId("nav").getAttribute("data-kui-component")).toBe("Breadcrumbs");
    expect(screen.getByTestId("list").getAttribute("data-kui-component")).toBe("BreadcrumbsList");
    expect(screen.getByTestId("link-home").getAttribute("data-kui-component")).toBe(
      "BreadcrumbsLink",
    );
    expect(screen.getByTestId("sep").getAttribute("data-kui-component")).toBe(
      "BreadcrumbsSeparator",
    );
    expect(screen.getByTestId("current").getAttribute("data-kui-component")).toBe(
      "BreadcrumbsCurrent",
    );
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Breadcrumbs: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(BasicBreadcrumbs));
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Home");
    expect(html).toContain("Tabs");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Breadcrumbs: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(BasicBreadcrumbs)));
    expect(screen.getByTestId("nav").getAttribute("aria-label")).toBe("Breadcrumb");
    expect(screen.getByTestId("current").getAttribute("aria-current")).toBe("page");
  });
});
