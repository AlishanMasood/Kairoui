import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Heading } from "./heading";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Heading: rendering", () => {
  it("renders as h2 by default", () => {
    render(<Heading data-testid="h">Title</Heading>);
    expect(screen.getByTestId("h").tagName).toBe("H2");
  });

  it("renders children", () => {
    render(<Heading data-testid="h">Page Title</Heading>);
    expect(screen.getByTestId("h").textContent).toBe("Page Title");
  });

  it("applies kui-heading class", () => {
    render(<Heading data-testid="h">Title</Heading>);
    expect(screen.getByTestId("h").className).toContain("kui-heading");
  });

  it("applies data-kui-component", () => {
    render(<Heading data-testid="h">Title</Heading>);
    expect(screen.getByTestId("h").getAttribute("data-kui-component")).toBe("Heading");
  });
});

// ─── Level prop ─────────────────────────────────────────────────────

describe("Heading: level", () => {
  it("level=1 renders h1", () => {
    render(
      <Heading level={1} data-testid="h">
        H1
      </Heading>,
    );
    expect(screen.getByTestId("h").tagName).toBe("H1");
  });

  it("level=2 renders h2", () => {
    render(
      <Heading level={2} data-testid="h">
        H2
      </Heading>,
    );
    expect(screen.getByTestId("h").tagName).toBe("H2");
  });

  it("level=3 renders h3", () => {
    render(
      <Heading level={3} data-testid="h">
        H3
      </Heading>,
    );
    expect(screen.getByTestId("h").tagName).toBe("H3");
  });

  it("level=4 renders h4", () => {
    render(
      <Heading level={4} data-testid="h">
        H4
      </Heading>,
    );
    expect(screen.getByTestId("h").tagName).toBe("H4");
  });

  it("level=5 renders h5", () => {
    render(
      <Heading level={5} data-testid="h">
        H5
      </Heading>,
    );
    expect(screen.getByTestId("h").tagName).toBe("H5");
  });

  it("level=6 renders h6", () => {
    render(
      <Heading level={6} data-testid="h">
        H6
      </Heading>,
    );
    expect(screen.getByTestId("h").tagName).toBe("H6");
  });

  it("level does not leak to DOM", () => {
    render(
      <Heading level={1} data-testid="h">
        H1
      </Heading>,
    );
    expect(screen.getByTestId("h").getAttribute("level")).toBeNull();
  });

  it("all levels retain kui-heading class", () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const { unmount } = render(
        <Heading level={level} data-testid="h">
          H
        </Heading>,
      );
      expect(screen.getByTestId("h").className).toContain("kui-heading");
      unmount();
    }
  });
});

// ─── Polymorphic ────────────────────────────────────────────────────

describe("Heading: polymorphic", () => {
  it("as overrides level", () => {
    render(
      <Heading as="h1" level={3} data-testid="h">
        Title
      </Heading>,
    );
    expect(screen.getByTestId("h").tagName).toBe("H1");
  });

  it("as=span renders span", () => {
    render(
      <Heading as="span" data-testid="h">
        Visual heading
      </Heading>,
    );
    expect(screen.getByTestId("h").tagName).toBe("SPAN");
  });

  it("retains kui-heading class with as", () => {
    render(
      <Heading as="div" data-testid="h">
        Title
      </Heading>,
    );
    expect(screen.getByTestId("h").className).toContain("kui-heading");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Heading: ref", () => {
  it("forwards ref to heading element", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Heading ref={ref}>Title</Heading>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(ref.current?.tagName).toBe("H2");
  });

  it("forwards ref to level-specified element", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading ref={ref} level={1}>
        Title
      </Heading>,
    );
    expect(ref.current?.tagName).toBe("H1");
  });

  it("supports callback ref", () => {
    let el: HTMLElement | null = null;
    render(
      <Heading
        ref={(node: HTMLHeadingElement | null) => {
          el = node;
        }}
      >
        Title
      </Heading>,
    );
    expect(el).not.toBeNull();
    expect(el!.tagName).toBe("H2");
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Heading: consumer overrides", () => {
  it("merges consumer className", () => {
    render(
      <Heading data-testid="h" className="page-title">
        Title
      </Heading>,
    );
    const cls = screen.getByTestId("h").className;
    expect(cls).toContain("kui-heading");
    expect(cls).toContain("page-title");
  });

  it("applies consumer style", () => {
    render(
      <Heading data-testid="h" style={{ color: "navy" }}>
        Title
      </Heading>,
    );
    expect(screen.getByTestId("h").style.color).toBe("navy");
  });

  it("passes ARIA attributes", () => {
    render(
      <Heading data-testid="h" aria-label="Section">
        Title
      </Heading>,
    );
    expect(screen.getByTestId("h").getAttribute("aria-label")).toBe("Section");
  });

  it("passes data attributes", () => {
    render(
      <Heading data-testid="h" data-section="intro">
        Title
      </Heading>,
    );
    expect(screen.getByTestId("h").getAttribute("data-section")).toBe("intro");
  });

  it("passes id", () => {
    render(
      <Heading data-testid="h" id="main-title">
        Title
      </Heading>,
    );
    expect(screen.getByTestId("h").id).toBe("main-title");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Heading: SSR", () => {
  it("renders h2 by default in SSR", () => {
    const html = renderToString(<Heading>Title</Heading>);
    expect(html).toContain("<h2");
    expect(html).toContain("kui-heading");
    expect(html).toContain("Title");
  });

  it("renders correct level in SSR", () => {
    const html = renderToString(<Heading level={1}>Page</Heading>);
    expect(html).toContain("<h1");
  });

  it("no inline typography styles", () => {
    const html = renderToString(<Heading>Title</Heading>);
    expect(html).not.toMatch(/style="[^"]*font/);
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Heading: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Heading data-testid="h" level={1}>
          OK
        </Heading>
      </StrictMode>,
    );
    expect(screen.getByTestId("h").textContent).toBe("OK");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Heading: accessibility", () => {
  it("renders semantic heading elements (not divs with role)", () => {
    render(
      <Heading level={1} data-testid="h">
        Title
      </Heading>,
    );
    const el = screen.getByTestId("h");
    expect(el.tagName).toBe("H1");
    expect(el.getAttribute("role")).toBeNull();
  });

  it("supports id for anchor linking", () => {
    render(
      <Heading id="section-1" data-testid="h">
        Section
      </Heading>,
    );
    expect(screen.getByTestId("h").id).toBe("section-1");
  });
});
