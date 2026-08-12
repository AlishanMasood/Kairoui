import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Container } from "./container";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Container: rendering", () => {
  it("renders as div by default", () => {
    render(<Container data-testid="c" />);
    expect(screen.getByTestId("c").tagName).toBe("DIV");
  });

  it("applies kui-container class", () => {
    render(<Container data-testid="c" />);
    expect(screen.getByTestId("c").className).toContain("kui-container");
  });

  it("applies data-kui-component", () => {
    render(<Container data-testid="c" />);
    expect(screen.getByTestId("c").getAttribute("data-kui-component")).toBe("Container");
  });

  it("renders children", () => {
    render(<Container data-testid="c">Content</Container>);
    expect(screen.getByTestId("c").textContent).toBe("Content");
  });
});

// ─── maxWidth presets ───────────────────────────────────────────────

describe("Container: maxWidth", () => {
  it("sm = 640px", () => {
    render(<Container data-testid="c" maxWidth="sm" />);
    expect(screen.getByTestId("c").style.maxWidth).toBe("640px");
  });

  it("md = 768px", () => {
    render(<Container data-testid="c" maxWidth="md" />);
    expect(screen.getByTestId("c").style.maxWidth).toBe("768px");
  });

  it("lg = 1024px", () => {
    render(<Container data-testid="c" maxWidth="lg" />);
    expect(screen.getByTestId("c").style.maxWidth).toBe("1024px");
  });

  it("xl = 1200px", () => {
    render(<Container data-testid="c" maxWidth="xl" />);
    expect(screen.getByTestId("c").style.maxWidth).toBe("1200px");
  });

  it("full = none", () => {
    render(<Container data-testid="c" maxWidth="full" />);
    expect(screen.getByTestId("c").style.maxWidth).toBe("none");
  });

  it("custom CSS value", () => {
    render(<Container data-testid="c" maxWidth="900px" />);
    expect(screen.getByTestId("c").style.maxWidth).toBe("900px");
  });

  it("default uses CSS custom property (no inline override)", () => {
    render(<Container data-testid="c" />);
    expect(screen.getByTestId("c").style.maxWidth).toBe("");
  });

  it("maxWidth does not leak to DOM", () => {
    render(<Container data-testid="c" maxWidth="lg" />);
    expect(screen.getByTestId("c").getAttribute("maxwidth")).toBeNull();
    expect(screen.getByTestId("c").getAttribute("maxWidth")).toBeNull();
  });
});

// ─── Gutter ─────────────────────────────────────────────────────────

describe("Container: gutter", () => {
  it("gutter as number (px)", () => {
    render(<Container data-testid="c" gutter={32} />);
    const el = screen.getByTestId("c");
    expect(el.style.paddingLeft).toBe("32px");
    expect(el.style.paddingRight).toBe("32px");
  });

  it("gutter as string", () => {
    render(<Container data-testid="c" gutter="2rem" />);
    expect(screen.getByTestId("c").style.paddingLeft).toBe("2rem");
  });

  it("gutter=0 removes padding", () => {
    render(<Container data-testid="c" gutter={0} />);
    expect(screen.getByTestId("c").style.paddingLeft).toBe("0px");
  });

  it("default gutter uses CSS custom property (no inline override)", () => {
    render(<Container data-testid="c" />);
    expect(screen.getByTestId("c").style.paddingLeft).toBe("");
  });
});

// ─── Polymorphic ────────────────────────────────────────────────────

describe("Container: polymorphic", () => {
  it("renders as main", () => {
    render(<Container as="main" data-testid="c" />);
    expect(screen.getByTestId("c").tagName).toBe("MAIN");
  });

  it("renders as section", () => {
    render(<Container as="section" data-testid="c" />);
    expect(screen.getByTestId("c").tagName).toBe("SECTION");
  });

  it("retains kui-container class", () => {
    render(<Container as="main" data-testid="c" />);
    expect(screen.getByTestId("c").className).toContain("kui-container");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Container: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Container ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Container: consumer overrides", () => {
  it("merges consumer className", () => {
    render(<Container data-testid="c" className="page" />);
    const cls = screen.getByTestId("c").className;
    expect(cls).toContain("kui-container");
    expect(cls).toContain("page");
  });

  it("consumer style merges", () => {
    render(<Container data-testid="c" maxWidth="lg" style={{ color: "red" }} />);
    const el = screen.getByTestId("c");
    expect(el.style.maxWidth).toBe("1024px");
    expect(el.style.color).toBe("red");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Container: SSR", () => {
  it("renders with class in SSR", () => {
    const html = renderToString(<Container maxWidth="lg">Page</Container>);
    expect(html).toContain("kui-container");
    expect(html).toContain("1024px");
    expect(html).toContain("Page");
  });

  it("polymorphic SSR", () => {
    const html = renderToString(<Container as="main">Content</Container>);
    expect(html).toContain("<main");
    expect(html).toContain("kui-container");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Container: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Container data-testid="c" maxWidth="xl" gutter={16}>
          Content
        </Container>
      </StrictMode>,
    );
    expect(screen.getByTestId("c").style.maxWidth).toBe("1200px");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
