import { describe, it, expect, afterEach } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
} from "./empty-state";

afterEach(cleanup);

// ─── Semantic structure ─────────────────────────────────────────────

describe("EmptyState: semantic structure", () => {
  it("renders root as div with role=status", () => {
    render(
      createElement(
        EmptyState,
        { "data-testid": "root" } as never,
        createElement(EmptyStateTitle, null, "No results"),
      ),
    );
    const root = screen.getByTestId("root");
    expect(root.tagName).toBe("DIV");
    expect(root.getAttribute("role")).toBe("status");
  });

  it("renders title as <h3>", () => {
    render(
      createElement(
        EmptyState,
        null,
        createElement(EmptyStateTitle, { "data-testid": "title" } as never, "Empty"),
      ),
    );
    expect(screen.getByTestId("title").tagName).toBe("H3");
  });

  it("renders description as <p>", () => {
    render(
      createElement(
        EmptyState,
        null,
        createElement(EmptyStateDescription, { "data-testid": "desc" } as never, "No items found"),
      ),
    );
    expect(screen.getByTestId("desc").tagName).toBe("P");
  });

  it("renders icon slot with aria-hidden", () => {
    render(
      createElement(
        EmptyState,
        null,
        createElement(EmptyStateIcon, { "data-testid": "icon" } as never, "🔍"),
      ),
    );
    expect(screen.getByTestId("icon").getAttribute("aria-hidden")).toBe("true");
  });

  it("renders actions as div", () => {
    render(
      createElement(
        EmptyState,
        null,
        createElement(
          EmptyStateActions,
          { "data-testid": "actions" } as never,
          createElement("button", null, "Retry"),
        ),
      ),
    );
    expect(screen.getByTestId("actions").tagName).toBe("DIV");
  });
});

// ─── Data attributes ────────────────────────────────────────────────

describe("EmptyState: data attributes", () => {
  it("sets data-kui-component on all parts", () => {
    render(
      createElement(
        EmptyState,
        { "data-testid": "root" } as never,
        createElement(EmptyStateIcon, { "data-testid": "icon" } as never, "📭"),
        createElement(EmptyStateTitle, { "data-testid": "title" } as never, "Empty"),
        createElement(EmptyStateDescription, { "data-testid": "desc" } as never, "Nothing here"),
        createElement(EmptyStateActions, { "data-testid": "actions" } as never, "Actions"),
      ),
    );
    expect(screen.getByTestId("root").getAttribute("data-kui-component")).toBe("EmptyState");
    expect(screen.getByTestId("icon").getAttribute("data-kui-component")).toBe("EmptyStateIcon");
    expect(screen.getByTestId("title").getAttribute("data-kui-component")).toBe("EmptyStateTitle");
    expect(screen.getByTestId("desc").getAttribute("data-kui-component")).toBe(
      "EmptyStateDescription",
    );
    expect(screen.getByTestId("actions").getAttribute("data-kui-component")).toBe(
      "EmptyStateActions",
    );
  });
});

// ─── Props ──────────────────────────────────────────────────────────

describe("EmptyState: props", () => {
  it("passes className to all parts", () => {
    render(
      createElement(
        EmptyState,
        { className: "es-root", "data-testid": "root" } as never,
        createElement(
          EmptyStateTitle,
          { className: "es-title", "data-testid": "title" } as never,
          "T",
        ),
      ),
    );
    expect(screen.getByTestId("root").className).toBe("es-root");
    expect(screen.getByTestId("title").className).toBe("es-title");
  });

  it("spreads native HTML attributes", () => {
    render(
      createElement(
        EmptyState,
        { id: "es-1", "data-testid": "root" } as never,
        createElement(EmptyStateTitle, null, "T"),
      ),
    );
    expect(screen.getByTestId("root").id).toBe("es-1");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("EmptyState: ref forwarding", () => {
  it("forwards ref on root", () => {
    const ref = createRef<HTMLDivElement>();
    render(createElement(EmptyState, { ref }, createElement(EmptyStateTitle, null, "T")));
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref on title", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(createElement(EmptyState, null, createElement(EmptyStateTitle, { ref }, "T")));
    expect(ref.current?.tagName).toBe("H3");
  });

  it("forwards ref on description", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(createElement(EmptyState, null, createElement(EmptyStateDescription, { ref }, "D")));
    expect(ref.current?.tagName).toBe("P");
  });

  it("forwards ref on icon", () => {
    const ref = createRef<HTMLDivElement>();
    render(createElement(EmptyState, null, createElement(EmptyStateIcon, { ref }, "I")));
    expect(ref.current?.tagName).toBe("DIV");
  });

  it("forwards ref on actions", () => {
    const ref = createRef<HTMLDivElement>();
    render(createElement(EmptyState, null, createElement(EmptyStateActions, { ref }, "A")));
    expect(ref.current?.tagName).toBe("DIV");
  });
});

// ─── Composition ────────────────────────────────────────────────────

describe("EmptyState: composition", () => {
  it("renders full composition", () => {
    render(
      createElement(
        EmptyState,
        { "data-testid": "root" } as never,
        createElement(EmptyStateIcon, null, "🔍"),
        createElement(EmptyStateTitle, null, "No results found"),
        createElement(EmptyStateDescription, null, "Try adjusting your search or filter criteria."),
        createElement(
          EmptyStateActions,
          null,
          createElement("button", { type: "button" }, "Clear filters"),
        ),
      ),
    );
    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search or filter criteria.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("works with only title (minimal)", () => {
    render(createElement(EmptyState, null, createElement(EmptyStateTitle, null, "No data")));
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("EmptyState: SSR", () => {
  it("renders to string without errors", () => {
    const html = renderToString(
      createElement(
        EmptyState,
        null,
        createElement(EmptyStateIcon, null, "📭"),
        createElement(EmptyStateTitle, null, "Empty"),
        createElement(EmptyStateDescription, null, "Nothing to show"),
        createElement(EmptyStateActions, null, createElement("button", null, "Add item")),
      ),
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<h3");
    expect(html).toContain("<p");
    expect(html).toContain("Empty");
    expect(html).toContain("Nothing to show");
  });
});

// ─── StrictMode ─────────────────────────────────────────────────────

describe("EmptyState: StrictMode", () => {
  it("works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          EmptyState,
          null,
          createElement(EmptyStateTitle, null, "No items"),
          createElement(EmptyStateDescription, null, "Add some items to get started."),
        ),
      ),
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("No items")).toBeInTheDocument();
  });
});
