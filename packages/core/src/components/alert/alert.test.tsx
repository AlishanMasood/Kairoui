import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Alert, AlertIcon, AlertTitle, AlertDescription, AlertAction } from "./alert";

afterEach(cleanup);

// ─── Rendering ──────────────────────────────────────────────────────

describe("Alert: rendering", () => {
  it("renders with data-kui-component", () => {
    render(createElement(Alert, { "data-testid": "alert" } as never, "Content"));
    expect(screen.getByTestId("alert").getAttribute("data-kui-component")).toBe("Alert");
  });

  it("renders all sub-components", () => {
    render(
      createElement(
        Alert,
        { "data-testid": "root" } as never,
        createElement(AlertIcon, { "data-testid": "icon" } as never, "!"),
        createElement(AlertTitle, { "data-testid": "title" } as never, "Title"),
        createElement(AlertDescription, { "data-testid": "desc" } as never, "Desc"),
        createElement(AlertAction, { "data-testid": "action" } as never, "Action"),
      ),
    );
    expect(screen.getByTestId("icon").getAttribute("data-kui-component")).toBe("AlertIcon");
    expect(screen.getByTestId("title").getAttribute("data-kui-component")).toBe("AlertTitle");
    expect(screen.getByTestId("desc").getAttribute("data-kui-component")).toBe("AlertDescription");
    expect(screen.getByTestId("action").getAttribute("data-kui-component")).toBe("AlertAction");
  });
});

// ─── Tone ───────────────────────────────────────────────────────────

describe("Alert: tone", () => {
  it("defaults to info", () => {
    render(createElement(Alert, { "data-testid": "alert" } as never));
    expect(screen.getByTestId("alert").getAttribute("data-tone")).toBe("info");
  });

  it.each(["info", "success", "warning", "danger"] as const)("supports %s tone", (tone) => {
    render(createElement(Alert, { tone, "data-testid": "alert" } as never));
    expect(screen.getByTestId("alert").getAttribute("data-tone")).toBe(tone);
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Alert: accessibility", () => {
  it("has role=status by default (not announced)", () => {
    render(createElement(Alert, { "data-testid": "alert" } as never, "Info"));
    expect(screen.getByTestId("alert").getAttribute("role")).toBe("status");
  });

  it("has role=alert when live=true", () => {
    render(createElement(Alert, { live: true, "data-testid": "alert" } as never, "Urgent"));
    expect(screen.getByTestId("alert").getAttribute("role")).toBe("alert");
  });

  it("icon is aria-hidden", () => {
    render(createElement(AlertIcon, { "data-testid": "icon" } as never, "!"));
    expect(screen.getByTestId("icon").getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Alert: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(
      createElement(
        Alert,
        { tone: "warning" },
        createElement(AlertTitle, null, "Warning"),
        createElement(AlertDescription, null, "Something happened"),
      ),
    );
    expect(html).toContain("Warning");
    expect(html).toContain("Something happened");
    expect(html).toContain('data-tone="warning"');
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Alert: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(Alert, { "data-testid": "alert", tone: "danger" } as never, "Error"),
      ),
    );
    expect(screen.getByTestId("alert").getAttribute("data-tone")).toBe("danger");
    expect(screen.getByTestId("alert").textContent).toBe("Error");
  });
});
