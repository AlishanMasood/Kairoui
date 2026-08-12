import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Surface } from "./surface";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Surface: rendering", () => {
  it("renders as div by default", () => {
    render(<Surface data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("DIV");
  });

  it("applies kui-surface class", () => {
    render(<Surface data-testid="s" />);
    expect(screen.getByTestId("s").className).toContain("kui-surface");
  });

  it("applies data-kui-component", () => {
    render(<Surface data-testid="s" />);
    expect(screen.getByTestId("s").getAttribute("data-kui-component")).toBe("Surface");
  });

  it("renders children", () => {
    render(<Surface data-testid="s">Content</Surface>);
    expect(screen.getByTestId("s").textContent).toBe("Content");
  });
});

// ─── Elevation ──────────────────────────────────────────────────────

describe("Surface: elevation", () => {
  it("none removes shadow", () => {
    render(<Surface data-testid="s" elevation="none" />);
    expect(screen.getByTestId("s").style.boxShadow).toBe("none");
  });

  it("sm applies small shadow token", () => {
    render(<Surface data-testid="s" elevation="sm" />);
    expect(screen.getByTestId("s").style.boxShadow).toContain("--kui-shadow-sm");
  });

  it("md applies medium shadow token", () => {
    render(<Surface data-testid="s" elevation="md" />);
    expect(screen.getByTestId("s").style.boxShadow).toContain("--kui-shadow-md");
  });

  it("lg applies large shadow token", () => {
    render(<Surface data-testid="s" elevation="lg" />);
    expect(screen.getByTestId("s").style.boxShadow).toContain("--kui-shadow-lg");
  });

  it("default uses CSS custom property (no inline override)", () => {
    render(<Surface data-testid="s" />);
    expect(screen.getByTestId("s").style.boxShadow).toBe("");
  });

  it("elevation does not leak to DOM", () => {
    render(<Surface data-testid="s" elevation="md" />);
    expect(screen.getByTestId("s").getAttribute("elevation")).toBeNull();
  });
});

// ─── Radius ─────────────────────────────────────────────────────────

describe("Surface: radius", () => {
  it("none sets 0", () => {
    render(<Surface data-testid="s" radius="none" />);
    expect(screen.getByTestId("s").style.borderRadius).toContain("0");
  });

  it("sm uses token", () => {
    const html = renderToString(<Surface radius="sm">X</Surface>);
    expect(html).toContain("border-radius");
  });

  it("md uses token", () => {
    const html = renderToString(<Surface radius="md">X</Surface>);
    expect(html).toContain("border-radius");
  });

  it("lg uses token", () => {
    const html = renderToString(<Surface radius="lg">X</Surface>);
    expect(html).toContain("border-radius");
  });

  it("full sets pill radius", () => {
    render(<Surface data-testid="s" radius="full" />);
    expect(screen.getByTestId("s").style.borderRadius).toBe("9999px");
  });

  it("default uses CSS custom property", () => {
    render(<Surface data-testid="s" />);
    expect(screen.getByTestId("s").style.borderRadius).toBe("");
  });
});

// ─── Bordered ───────────────────────────────────────────────────────

describe("Surface: bordered", () => {
  it("bordered=false removes border", () => {
    render(<Surface data-testid="s" bordered={false} />);
    expect(screen.getByTestId("s").style.border).toContain("none");
  });

  it("default has border from CSS class", () => {
    render(<Surface data-testid="s" />);
    expect(screen.getByTestId("s").style.border).toBe("");
  });

  it("bordered does not leak to DOM", () => {
    render(<Surface data-testid="s" bordered={false} />);
    expect(screen.getByTestId("s").getAttribute("bordered")).toBeNull();
  });
});

// ─── Polymorphic ────────────────────────────────────────────────────

describe("Surface: polymorphic", () => {
  it("renders as section", () => {
    render(<Surface as="section" data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("SECTION");
  });

  it("renders as article", () => {
    render(<Surface as="article" data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("ARTICLE");
  });

  it("retains kui-surface class", () => {
    render(<Surface as="aside" data-testid="s" />);
    expect(screen.getByTestId("s").className).toContain("kui-surface");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Surface: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Surface ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Surface: consumer overrides", () => {
  it("merges consumer className", () => {
    render(<Surface data-testid="s" className="card" />);
    const cls = screen.getByTestId("s").className;
    expect(cls).toContain("kui-surface");
    expect(cls).toContain("card");
  });

  it("consumer style merges with elevation", () => {
    render(<Surface data-testid="s" elevation="md" style={{ padding: "16px" }} />);
    const el = screen.getByTestId("s");
    expect(el.style.boxShadow).toContain("--kui-shadow-md");
    expect(el.style.padding).toBe("16px");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Surface: SSR", () => {
  it("renders with class in SSR", () => {
    const html = renderToString(<Surface elevation="sm">Panel</Surface>);
    expect(html).toContain("kui-surface");
    expect(html).toContain("Panel");
  });

  it("polymorphic SSR", () => {
    const html = renderToString(<Surface as="article">Post</Surface>);
    expect(html).toContain("<article");
    expect(html).toContain("kui-surface");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Surface: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Surface data-testid="s" elevation="md" radius="lg">
          Content
        </Surface>
      </StrictMode>,
    );
    expect(screen.getByTestId("s").className).toContain("kui-surface");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
