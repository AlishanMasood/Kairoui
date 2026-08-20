import { describe, it, expect, afterEach } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { List, ListItem } from "./list";

afterEach(cleanup);

// ─── Semantic HTML ──────────────────────────────────────────────────

describe("List: semantic HTML", () => {
  it("renders as <ul> by default", () => {
    render(
      createElement(
        List,
        { "data-testid": "list" } as never,
        createElement(ListItem, null, "Item"),
      ),
    );
    expect(screen.getByTestId("list").tagName).toBe("UL");
  });

  it("renders as <ol> when variant=ordered", () => {
    render(
      createElement(
        List,
        { variant: "ordered", "data-testid": "list" } as never,
        createElement(ListItem, null, "A"),
      ),
    );
    expect(screen.getByTestId("list").tagName).toBe("OL");
  });

  it("renders ListItem as <li>", () => {
    render(
      createElement(
        List,
        null,
        createElement(ListItem, { "data-testid": "item" } as never, "Hello"),
      ),
    );
    expect(screen.getByTestId("item").tagName).toBe("LI");
  });

  it("preserves list role for screen readers", () => {
    render(
      createElement(List, { "data-testid": "list" } as never, createElement(ListItem, null, "A")),
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("preserves listitem role for screen readers", () => {
    render(createElement(List, null, createElement(ListItem, null, "A")));
    expect(screen.getByRole("listitem")).toBeInTheDocument();
  });
});

// ─── Props ──────────────────────────────────────────────────────────

describe("List: props", () => {
  it("sets data-variant attribute", () => {
    render(
      createElement(List, { "data-testid": "list" } as never, createElement(ListItem, null, "A")),
    );
    expect(screen.getByTestId("list").getAttribute("data-variant")).toBe("unordered");
  });

  it("sets data-variant=ordered", () => {
    render(
      createElement(
        List,
        { variant: "ordered", "data-testid": "list" } as never,
        createElement(ListItem, null, "A"),
      ),
    );
    expect(screen.getByTestId("list").getAttribute("data-variant")).toBe("ordered");
  });

  it("sets data-kui-component on root", () => {
    render(
      createElement(List, { "data-testid": "list" } as never, createElement(ListItem, null, "A")),
    );
    expect(screen.getByTestId("list").getAttribute("data-kui-component")).toBe("List");
  });

  it("sets data-kui-component on item", () => {
    render(
      createElement(List, null, createElement(ListItem, { "data-testid": "item" } as never, "A")),
    );
    expect(screen.getByTestId("item").getAttribute("data-kui-component")).toBe("ListItem");
  });

  it("passes className to root", () => {
    render(
      createElement(
        List,
        { className: "my-list", "data-testid": "list" } as never,
        createElement(ListItem, null, "A"),
      ),
    );
    expect(screen.getByTestId("list").className).toBe("my-list");
  });

  it("passes className to item", () => {
    render(
      createElement(
        List,
        null,
        createElement(ListItem, { className: "my-item", "data-testid": "item" } as never, "A"),
      ),
    );
    expect(screen.getByTestId("item").className).toBe("my-item");
  });

  it("spreads native HTML attributes on <ul>", () => {
    render(
      createElement(
        List,
        { id: "list-id", "data-testid": "list" } as never,
        createElement(ListItem, null, "A"),
      ),
    );
    expect(screen.getByTestId("list").id).toBe("list-id");
  });

  it("spreads native HTML attributes on <li>", () => {
    render(
      createElement(
        List,
        null,
        createElement(ListItem, { id: "item-id", "data-testid": "item" } as never, "A"),
      ),
    );
    expect(screen.getByTestId("item").id).toBe("item-id");
  });

  it("passes ordered list attributes (start, reversed, type)", () => {
    render(
      createElement(
        List,
        { variant: "ordered", start: 5, "data-testid": "list" } as never,
        createElement(ListItem, null, "A"),
      ),
    );
    expect(screen.getByTestId("list").getAttribute("start")).toBe("5");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("List: ref forwarding", () => {
  it("forwards ref on List", () => {
    const ref = createRef<HTMLUListElement>();
    render(createElement(List, { ref }, createElement(ListItem, null, "A")));
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe("UL");
  });

  it("forwards ref on ordered List", () => {
    const ref = createRef<HTMLOListElement>();
    render(createElement(List, { ref, variant: "ordered" }, createElement(ListItem, null, "A")));
    expect(ref.current?.tagName).toBe("OL");
  });

  it("forwards ref on ListItem", () => {
    const ref = createRef<HTMLLIElement>();
    render(createElement(List, null, createElement(ListItem, { ref }, "A")));
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe("LI");
  });
});

// ─── Multiple items ─────────────────────────────────────────────────

describe("List: multiple items", () => {
  it("renders multiple items", () => {
    render(
      createElement(
        List,
        null,
        createElement(ListItem, null, "Alpha"),
        createElement(ListItem, null, "Beta"),
        createElement(ListItem, null, "Gamma"),
      ),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("List: SSR", () => {
  it("renders to string without errors (unordered)", () => {
    const html = renderToString(
      createElement(
        List,
        null,
        createElement(ListItem, null, "A"),
        createElement(ListItem, null, "B"),
      ),
    );
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("A");
    expect(html).toContain("B");
  });

  it("renders ordered list to string", () => {
    const html = renderToString(
      createElement(List, { variant: "ordered" }, createElement(ListItem, null, "First")),
    );
    expect(html).toContain("<ol");
    expect(html).toContain("First");
  });
});

// ─── StrictMode ─────────────────────────────────────────────────────

describe("List: StrictMode", () => {
  it("works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(List, null, createElement(ListItem, null, "A")),
      ),
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
