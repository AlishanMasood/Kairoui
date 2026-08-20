import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
} from "./navigation-menu";

afterEach(cleanup);

function BasicNav() {
  return createElement(
    NavigationMenu,
    { "data-testid": "nav" } as never,
    createElement(
      NavigationMenuList,
      { "data-testid": "list" } as never,
      createElement(
        NavigationMenuItem,
        { value: "products" },
        createElement(NavigationMenuTrigger, { "data-testid": "t-products" } as never, "Products"),
        createElement(
          NavigationMenuContent,
          { "data-testid": "c-products" } as never,
          createElement(
            NavigationMenuLink,
            { href: "/widgets", "data-testid": "link-widgets" } as never,
            "Widgets",
          ),
        ),
      ),
      createElement(
        NavigationMenuItem,
        { value: "about" },
        createElement(NavigationMenuTrigger, { "data-testid": "t-about" } as never, "About"),
        createElement(
          NavigationMenuContent,
          { "data-testid": "c-about" } as never,
          "About content",
        ),
      ),
      createElement(
        NavigationMenuItem,
        null,
        createElement(
          NavigationMenuLink,
          { href: "/contact", active: true, "data-testid": "link-contact" } as never,
          "Contact",
        ),
      ),
    ),
    createElement(NavigationMenuIndicator, { "data-testid": "indicator" } as never),
    createElement(NavigationMenuViewport, { "data-testid": "viewport" } as never),
  );
}
BasicNav.displayName = "BasicNav";

// ─── Rendering ──────────────────────────────────────────────────────

describe("NavigationMenu: rendering", () => {
  it("renders nav element", () => {
    render(createElement(BasicNav));
    expect(screen.getByTestId("nav").tagName).toBe("NAV");
    expect(screen.getByTestId("nav").getAttribute("data-kui-component")).toBe("NavigationMenu");
  });

  it("renders list and items", () => {
    render(createElement(BasicNav));
    expect(screen.getByTestId("list").tagName).toBe("UL");
    expect(screen.getByTestId("t-products")).not.toBeNull();
  });

  it("content hidden when closed", () => {
    render(createElement(BasicNav));
    expect(screen.queryByTestId("c-products")).toBeNull();
  });

  it("link has href and active state", () => {
    render(createElement(BasicNav));
    const link = screen.getByTestId("link-contact");
    expect(link.getAttribute("href")).toBe("/contact");
    expect(link.getAttribute("aria-current")).toBe("page");
  });
});

// ─── Open/close ─────────────────────────────────────────────────────

describe("NavigationMenu: open/close", () => {
  it("clicking trigger opens content", () => {
    render(createElement(BasicNav));
    fireEvent.click(screen.getByTestId("t-products"));
    expect(screen.getByTestId("c-products")).not.toBeNull();
    expect(screen.getByTestId("t-products").getAttribute("aria-expanded")).toBe("true");
  });

  it("clicking open trigger closes content", () => {
    render(createElement(BasicNav));
    fireEvent.click(screen.getByTestId("t-products"));
    fireEvent.click(screen.getByTestId("t-products"));
    expect(screen.queryByTestId("c-products")).toBeNull();
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("NavigationMenu: keyboard", () => {
  it("ArrowDown opens content", () => {
    render(createElement(BasicNav));
    screen.getByTestId("t-products").focus();
    fireEvent.keyDown(screen.getByTestId("t-products"), { key: "ArrowDown" });
    expect(screen.getByTestId("c-products")).not.toBeNull();
  });

  it("Enter opens content", () => {
    render(createElement(BasicNav));
    screen.getByTestId("t-about").focus();
    fireEvent.keyDown(screen.getByTestId("t-about"), { key: "Enter" });
    expect(screen.getByTestId("c-about")).not.toBeNull();
  });
});

// ─── Indicator/Viewport ─────────────────────────────────────────────

describe("NavigationMenu: indicator/viewport", () => {
  it("indicator hidden when no item open", () => {
    render(createElement(BasicNav));
    expect(screen.queryByTestId("indicator")).toBeNull();
  });

  it("indicator visible when item open", () => {
    render(createElement(BasicNav));
    fireEvent.click(screen.getByTestId("t-products"));
    expect(screen.getByTestId("indicator")).not.toBeNull();
  });

  it("viewport has data-state", () => {
    render(createElement(BasicNav));
    expect(screen.getByTestId("viewport").getAttribute("data-state")).toBe("closed");
    fireEvent.click(screen.getByTestId("t-products"));
    expect(screen.getByTestId("viewport").getAttribute("data-state")).toBe("open");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("NavigationMenu: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(BasicNav));
    expect(html).toContain("Products");
    expect(html).toContain("Contact");
    expect(html).toContain('aria-current="page"');
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("NavigationMenu: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(BasicNav)));
    fireEvent.click(screen.getByTestId("t-products"));
    expect(screen.getByTestId("c-products")).not.toBeNull();
  });
});
