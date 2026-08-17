import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Portal } from "./portal";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Portal: rendering", () => {
  it("renders children into document.body", () => {
    render(
      createElement(Portal, null, createElement("div", { "data-testid": "content" }, "hello")),
    );
    const el = document.querySelector("[data-testid='content']");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe("hello");
    // Should be a child of body, not inside the render container
    expect(el?.parentElement).toBe(document.body);
  });

  it("renders multiple children", () => {
    render(
      createElement(
        Portal,
        null,
        createElement("span", { "data-testid": "a" }, "A"),
        createElement("span", { "data-testid": "b" }, "B"),
      ),
    );
    expect(document.querySelector("[data-testid='a']")).not.toBeNull();
    expect(document.querySelector("[data-testid='b']")).not.toBeNull();
  });
});

// ─── Custom container ───────────────────────────────────────────────

describe("Portal: custom container", () => {
  it("renders into a custom container", () => {
    const container = document.createElement("div");
    container.setAttribute("data-testid", "custom-container");
    document.body.appendChild(container);

    render(
      createElement(
        Portal,
        { container },
        createElement("div", { "data-testid": "content" }, "custom"),
      ),
    );

    expect(container.querySelector("[data-testid='content']")).not.toBeNull();
    document.body.removeChild(container);
  });
});

// ─── Disabled mode ──────────────────────────────────────────────────

describe("Portal: disabled", () => {
  it("renders children in-place when disabled", () => {
    const { container } = render(
      createElement(
        "div",
        { "data-testid": "parent" },
        createElement(
          Portal,
          { disabled: true },
          createElement("span", { "data-testid": "inline" }, "inline"),
        ),
      ),
    );
    const parent = container.querySelector("[data-testid='parent']");
    const inline = parent?.querySelector("[data-testid='inline']");
    expect(inline).not.toBeNull();
    expect(inline?.textContent).toBe("inline");
  });
});

// ─── Nested portals ─────────────────────────────────────────────────

describe("Portal: nested", () => {
  it("supports nested portals", () => {
    render(
      createElement(
        Portal,
        null,
        createElement(
          "div",
          { "data-testid": "outer" },
          createElement(Portal, null, createElement("div", { "data-testid": "inner" }, "nested")),
        ),
      ),
    );
    expect(document.querySelector("[data-testid='outer']")).not.toBeNull();
    expect(document.querySelector("[data-testid='inner']")).not.toBeNull();
  });
});

// ─── Unmount cleanup ────────────────────────────────────────────────

describe("Portal: cleanup", () => {
  it("removes portal content on unmount", () => {
    const { unmount } = render(
      createElement(Portal, null, createElement("div", { "data-testid": "ephemeral" }, "bye")),
    );
    expect(document.querySelector("[data-testid='ephemeral']")).not.toBeNull();
    unmount();
    expect(document.querySelector("[data-testid='ephemeral']")).toBeNull();
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Portal: SSR", () => {
  it("renders nothing on server (no DOM)", () => {
    const html = renderToString(
      createElement(Portal, null, createElement("div", null, "should not appear")),
    );
    // Portal renders null on server — no content in SSR output
    expect(html).toBe("");
  });

  it("disabled portal renders children in SSR", () => {
    const html = renderToString(
      createElement(Portal, { disabled: true }, createElement("div", null, "visible")),
    );
    expect(html).toContain("visible");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Portal: Strict Mode", () => {
  it("works correctly in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(Portal, null, createElement("div", { "data-testid": "strict" }, "strict")),
      ),
    );
    const el = document.querySelector("[data-testid='strict']");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe("strict");
  });
});
