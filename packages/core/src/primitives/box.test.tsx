import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Box } from "./box";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Box: rendering", () => {
  it("renders as div by default", () => {
    render(<Box data-testid="box" />);
    expect(screen.getByTestId("box").tagName).toBe("DIV");
  });

  it("renders children", () => {
    render(<Box data-testid="box">Hello</Box>);
    expect(screen.getByTestId("box").textContent).toBe("Hello");
  });

  it("applies kui-box class", () => {
    render(<Box data-testid="box" />);
    expect(screen.getByTestId("box").className).toContain("kui-box");
  });

  it("applies data-kui-component", () => {
    render(<Box data-testid="box" />);
    expect(screen.getByTestId("box").getAttribute("data-kui-component")).toBe("Box");
  });
});

// ─── Polymorphic ────────────────────────────────────────────────────

describe("Box: polymorphic", () => {
  it("renders as section", () => {
    render(<Box as="section" data-testid="box" />);
    expect(screen.getByTestId("box").tagName).toBe("SECTION");
  });

  it("renders as button with native props", () => {
    render(
      <Box as="button" type="submit" data-testid="box">
        Go
      </Box>,
    );
    const el = screen.getByTestId("box");
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("type")).toBe("submit");
  });

  it("renders as anchor with href", () => {
    render(
      <Box as="a" href="/page" data-testid="box">
        Link
      </Box>,
    );
    expect(screen.getByTestId("box").getAttribute("href")).toBe("/page");
  });

  it("renders as custom component", () => {
    const Custom = forwardRef<
      HTMLAnchorElement,
      { to: string; children?: React.ReactNode; "data-testid"?: string }
    >((props, ref) => {
      const { to, children, ...rest } = props;
      return (
        <a ref={ref} href={to} {...rest}>
          {children}
        </a>
      );
    });
    Custom.displayName = "Custom";
    render(
      <Box as={Custom} to="/test" data-testid="box">
        Nav
      </Box>,
    );
    expect(screen.getByTestId("box").getAttribute("href")).toBe("/test");
  });

  it("retains kui-box class with polymorphic rendering", () => {
    render(<Box as="nav" data-testid="box" />);
    expect(screen.getByTestId("box").className).toContain("kui-box");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Box: ref", () => {
  it("forwards ref to DOM element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Box ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref to polymorphic element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Box as="button" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("supports callback ref", () => {
    let el: HTMLElement | null = null;
    render(
      <Box
        ref={(node: HTMLElement | null) => {
          el = node;
        }}
      />,
    );
    expect(el).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Box: consumer overrides", () => {
  it("merges consumer className", () => {
    render(<Box data-testid="box" className="custom" />);
    const cls = screen.getByTestId("box").className;
    expect(cls).toContain("kui-box");
    expect(cls).toContain("custom");
  });

  it("applies consumer style", () => {
    render(<Box data-testid="box" style={{ color: "red" }} />);
    expect(screen.getByTestId("box").style.color).toBe("red");
  });

  it("passes ARIA attributes", () => {
    render(<Box data-testid="box" aria-label="container" role="region" />);
    const el = screen.getByTestId("box");
    expect(el.getAttribute("aria-label")).toBe("container");
    expect(el.getAttribute("role")).toBe("region");
  });

  it("passes data attributes", () => {
    render(<Box data-testid="box" data-state="open" />);
    expect(screen.getByTestId("box").getAttribute("data-state")).toBe("open");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Box: SSR", () => {
  it("renders to valid HTML", () => {
    const html = renderToString(<Box className="app">Content</Box>);
    expect(html).toContain("kui-box");
    expect(html).toContain("app");
    expect(html).toContain("Content");
    expect(html).toContain("data-kui-component");
  });

  it("polymorphic SSR", () => {
    const html = renderToString(<Box as="section">Section</Box>);
    expect(html).toContain("<section");
    expect(html).toContain("kui-box");
  });

  it("no inline style injection for base styles", () => {
    const html = renderToString(<Box>Clean</Box>);
    expect(html).not.toMatch(/style="[^"]*box-sizing/);
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Box: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Box data-testid="box">OK</Box>
      </StrictMode>,
    );
    expect(screen.getByTestId("box").textContent).toBe("OK");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });

  it("ref works in Strict Mode", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <StrictMode>
        <Box ref={ref} />
      </StrictMode>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
