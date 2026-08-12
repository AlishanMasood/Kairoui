import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Flex } from "./flex";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Flex: rendering", () => {
  it("renders as div by default", () => {
    render(<Flex data-testid="f" />);
    expect(screen.getByTestId("f").tagName).toBe("DIV");
  });

  it("applies kui-flex class", () => {
    render(<Flex data-testid="f" />);
    expect(screen.getByTestId("f").className).toContain("kui-flex");
  });

  it("applies data-kui-component", () => {
    render(<Flex data-testid="f" />);
    expect(screen.getByTestId("f").getAttribute("data-kui-component")).toBe("Flex");
  });

  it("renders children", () => {
    render(
      <Flex data-testid="f">
        <span>A</span>
        <span>B</span>
      </Flex>,
    );
    expect(screen.getByTestId("f").children).toHaveLength(2);
  });
});

// ─── Direction ──────────────────────────────────────────────────────

describe("Flex: direction", () => {
  it("default has no explicit flexDirection style", () => {
    render(<Flex data-testid="f" />);
    expect(screen.getByTestId("f").style.flexDirection).toBe("");
  });

  it("direction=row sets flex-direction", () => {
    render(<Flex data-testid="f" direction="row" />);
    expect(screen.getByTestId("f").style.flexDirection).toBe("row");
  });

  it("direction=column sets flex-direction", () => {
    render(<Flex data-testid="f" direction="column" />);
    expect(screen.getByTestId("f").style.flexDirection).toBe("column");
  });

  it("direction=row-reverse", () => {
    render(<Flex data-testid="f" direction="row-reverse" />);
    expect(screen.getByTestId("f").style.flexDirection).toBe("row-reverse");
  });

  it("direction=column-reverse", () => {
    render(<Flex data-testid="f" direction="column-reverse" />);
    expect(screen.getByTestId("f").style.flexDirection).toBe("column-reverse");
  });

  it("direction does not leak to DOM", () => {
    render(<Flex data-testid="f" direction="column" />);
    expect(screen.getByTestId("f").getAttribute("direction")).toBeNull();
  });
});

// ─── Alignment ──────────────────────────────────────────────────────

describe("Flex: align", () => {
  it("align=center sets align-items", () => {
    render(<Flex data-testid="f" align="center" />);
    expect(screen.getByTestId("f").style.alignItems).toBe("center");
  });

  it("align=start sets flex-start", () => {
    render(<Flex data-testid="f" align="start" />);
    expect(screen.getByTestId("f").style.alignItems).toBe("flex-start");
  });

  it("align=end sets flex-end", () => {
    render(<Flex data-testid="f" align="end" />);
    expect(screen.getByTestId("f").style.alignItems).toBe("flex-end");
  });

  it("align=stretch", () => {
    render(<Flex data-testid="f" align="stretch" />);
    expect(screen.getByTestId("f").style.alignItems).toBe("stretch");
  });

  it("align=baseline", () => {
    render(<Flex data-testid="f" align="baseline" />);
    expect(screen.getByTestId("f").style.alignItems).toBe("baseline");
  });
});

// ─── Justify ────────────────────────────────────────────────────────

describe("Flex: justify", () => {
  it("justify=center", () => {
    render(<Flex data-testid="f" justify="center" />);
    expect(screen.getByTestId("f").style.justifyContent).toBe("center");
  });

  it("justify=between sets space-between", () => {
    render(<Flex data-testid="f" justify="between" />);
    expect(screen.getByTestId("f").style.justifyContent).toBe("space-between");
  });

  it("justify=evenly sets space-evenly", () => {
    render(<Flex data-testid="f" justify="evenly" />);
    expect(screen.getByTestId("f").style.justifyContent).toBe("space-evenly");
  });
});

// ─── Wrap ───────────────────────────────────────────────────────────

describe("Flex: wrap", () => {
  it("wrap=wrap sets flex-wrap", () => {
    render(<Flex data-testid="f" wrap="wrap" />);
    expect(screen.getByTestId("f").style.flexWrap).toBe("wrap");
  });

  it("wrap=nowrap", () => {
    render(<Flex data-testid="f" wrap="nowrap" />);
    expect(screen.getByTestId("f").style.flexWrap).toBe("nowrap");
  });
});

// ─── Gap ────────────────────────────────────────────────────────────

describe("Flex: gap", () => {
  it("gap as number (px)", () => {
    render(<Flex data-testid="f" gap={16} />);
    expect(screen.getByTestId("f").style.gap).toBe("16px");
  });

  it("gap as string (token or CSS value)", () => {
    render(<Flex data-testid="f" gap="var(--kui-space-inline-md, 16px)" />);
    expect(screen.getByTestId("f").style.gap).toBe("var(--kui-space-inline-md, 16px)");
  });

  it("gap=0 is applied", () => {
    render(<Flex data-testid="f" gap={0} />);
    expect(screen.getByTestId("f").style.gap).toBe("0px");
  });
});

// ─── Inline ─────────────────────────────────────────────────────────

describe("Flex: inline", () => {
  it("inline=true sets display inline-flex", () => {
    render(<Flex data-testid="f" inline />);
    expect(screen.getByTestId("f").style.display).toBe("inline-flex");
  });

  it("inline not set uses class-based display:flex", () => {
    render(<Flex data-testid="f" />);
    // display comes from CSS class, not inline style
    expect(screen.getByTestId("f").style.display).toBe("");
  });
});

// ─── Polymorphic ────────────────────────────────────────────────────

describe("Flex: polymorphic", () => {
  it("renders as nav", () => {
    render(<Flex as="nav" data-testid="f" />);
    expect(screen.getByTestId("f").tagName).toBe("NAV");
  });

  it("renders as ul", () => {
    render(<Flex as="ul" data-testid="f" />);
    expect(screen.getByTestId("f").tagName).toBe("UL");
  });

  it("retains kui-flex class with as", () => {
    render(<Flex as="section" data-testid="f" />);
    expect(screen.getByTestId("f").className).toContain("kui-flex");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Flex: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Flex ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Flex: consumer overrides", () => {
  it("merges consumer className", () => {
    render(<Flex data-testid="f" className="nav-bar" />);
    const cls = screen.getByTestId("f").className;
    expect(cls).toContain("kui-flex");
    expect(cls).toContain("nav-bar");
  });

  it("consumer style merges with layout style", () => {
    render(<Flex data-testid="f" direction="column" style={{ maxWidth: "600px" }} />);
    const el = screen.getByTestId("f");
    expect(el.style.flexDirection).toBe("column");
    expect(el.style.maxWidth).toBe("600px");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Flex: SSR", () => {
  it("renders with class and inline styles", () => {
    const html = renderToString(
      <Flex direction="column" gap={8}>
        <span>A</span>
      </Flex>,
    );
    expect(html).toContain("kui-flex");
    expect(html).toContain("column");
  });

  it("polymorphic SSR", () => {
    const html = renderToString(<Flex as="nav">Nav</Flex>);
    expect(html).toContain("<nav");
    expect(html).toContain("kui-flex");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Flex: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Flex data-testid="f" direction="row" gap={16} align="center">
          <span>Child</span>
        </Flex>
      </StrictMode>,
    );
    expect(screen.getByTestId("f").style.gap).toBe("16px");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
