import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  AppShell,
  AppShellHeader,
  AppShellSidebar,
  AppShellMain,
  AppShellAside,
  AppShellFooter,
} from "./app-shell";

afterEach(cleanup);

function BasicShell(props: { fixed?: boolean; sidebarCollapsed?: boolean }) {
  return createElement(
    AppShell,
    { ...props, "data-testid": "shell" } as never,
    createElement(AppShellHeader, { "data-testid": "header" } as never, "Header"),
    createElement(AppShellSidebar, { "data-testid": "sidebar" } as never, "Nav"),
    createElement(AppShellMain, { "data-testid": "main" } as never, "Content"),
    createElement(AppShellFooter, { "data-testid": "footer" } as never, "Footer"),
  );
}
BasicShell.displayName = "BasicShell";

// ─── Rendering ──────────────────────────────────────────────────────

describe("AppShell: rendering", () => {
  it("renders grid container", () => {
    render(createElement(BasicShell));
    const shell = screen.getByTestId("shell");
    expect(shell.style.display).toBe("grid");
    expect(shell.getAttribute("data-layout")).toBe("sidebar");
    expect(shell.getAttribute("data-kui-component")).toBe("AppShell");
  });

  it("renders semantic landmarks", () => {
    render(createElement(BasicShell));
    expect(screen.getByTestId("header").tagName).toBe("HEADER");
    expect(screen.getByTestId("sidebar").tagName).toBe("ASIDE");
    expect(screen.getByTestId("main").tagName).toBe("MAIN");
    expect(screen.getByTestId("footer").tagName).toBe("FOOTER");
  });

  it("applies CSS custom properties", () => {
    render(createElement(BasicShell));
    const shell = screen.getByTestId("shell");
    expect(shell.style.getPropertyValue("--kui-shell-header-height")).toBe("60px");
    expect(shell.style.getPropertyValue("--kui-shell-sidebar-width")).toBe("240px");
  });
});

// ─── Sidebar collapse ───────────────────────────────────────────────

describe("AppShell: sidebar collapse", () => {
  it("uses collapsed width when sidebarCollapsed", () => {
    render(createElement(BasicShell, { sidebarCollapsed: true }));
    expect(screen.getByTestId("sidebar").style.width).toBe("60px");
    expect(screen.getByTestId("shell").style.getPropertyValue("--kui-shell-sidebar-width")).toBe(
      "60px",
    );
  });

  it("uses full width when not collapsed", () => {
    render(createElement(BasicShell));
    expect(screen.getByTestId("sidebar").style.width).toBe("240px");
  });
});

// ─── Fixed positioning ──────────────────────────────────────────────

describe("AppShell: fixed", () => {
  it("header becomes sticky when fixed", () => {
    render(createElement(BasicShell, { fixed: true }));
    expect(screen.getByTestId("header").style.position).toBe("sticky");
    expect(screen.getByTestId("header").getAttribute("data-fixed")).toBe("true");
  });

  it("sidebar becomes sticky when fixed", () => {
    render(createElement(BasicShell, { fixed: true }));
    expect(screen.getByTestId("sidebar").style.position).toBe("sticky");
  });
});

// ─── Aside ──────────────────────────────────────────────────────────

describe("AppShell: aside", () => {
  it("renders aside with width", () => {
    render(
      createElement(
        AppShell,
        null,
        createElement(AppShellHeader, null, "H"),
        createElement(AppShellMain, null, "M"),
        createElement(AppShellAside, { "data-testid": "aside" } as never, "Side"),
      ),
    );
    expect(screen.getByTestId("aside").style.width).toBe("280px");
    expect(screen.getByTestId("aside").getAttribute("data-kui-component")).toBe("AppShellAside");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("AppShell: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(BasicShell));
    expect(html).toContain("Header");
    expect(html).toContain("Content");
    expect(html).toContain("display:grid");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("AppShell: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(BasicShell)));
    expect(screen.getByTestId("shell").style.display).toBe("grid");
    expect(screen.getByTestId("main").tagName).toBe("MAIN");
  });
});
