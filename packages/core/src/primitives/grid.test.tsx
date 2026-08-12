import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Grid } from "./grid";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Grid: rendering", () => {
  it("renders as div by default", () => {
    render(<Grid data-testid="g" />);
    expect(screen.getByTestId("g").tagName).toBe("DIV");
  });

  it("applies kui-grid class", () => {
    render(<Grid data-testid="g" />);
    expect(screen.getByTestId("g").className).toContain("kui-grid");
  });

  it("applies data-kui-component", () => {
    render(<Grid data-testid="g" />);
    expect(screen.getByTestId("g").getAttribute("data-kui-component")).toBe("Grid");
  });

  it("renders children", () => {
    render(
      <Grid data-testid="g">
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </Grid>,
    );
    expect(screen.getByTestId("g").children).toHaveLength(3);
  });
});

// ─── Columns ────────────────────────────────────────────────────────

describe("Grid: columns", () => {
  it("columns as number creates repeat(n, 1fr)", () => {
    render(<Grid data-testid="g" columns={3} />);
    expect(screen.getByTestId("g").style.gridTemplateColumns).toBe("repeat(3, 1fr)");
  });

  it("columns as string passes through", () => {
    render(<Grid data-testid="g" columns="200px 1fr 200px" />);
    expect(screen.getByTestId("g").style.gridTemplateColumns).toBe("200px 1fr 200px");
  });

  it("columns=1 creates single column", () => {
    render(<Grid data-testid="g" columns={1} />);
    expect(screen.getByTestId("g").style.gridTemplateColumns).toBe("repeat(1, 1fr)");
  });

  it("columns does not leak to DOM", () => {
    render(<Grid data-testid="g" columns={3} />);
    expect(screen.getByTestId("g").getAttribute("columns")).toBeNull();
  });
});

// ─── Rows ───────────────────────────────────────────────────────────

describe("Grid: rows", () => {
  it("rows sets grid-template-rows", () => {
    render(<Grid data-testid="g" rows="auto 1fr auto" />);
    expect(screen.getByTestId("g").style.gridTemplateRows).toBe("auto 1fr auto");
  });
});

// ─── Gap ────────────────────────────────────────────────────────────

describe("Grid: gap", () => {
  it("gap as number (px)", () => {
    render(<Grid data-testid="g" gap={16} />);
    expect(screen.getByTestId("g").style.gap).toBe("16px");
  });

  it("gap as string", () => {
    render(<Grid data-testid="g" gap="1rem" />);
    expect(screen.getByTestId("g").style.gap).toBe("1rem");
  });

  it("columnGap overrides gap for columns", () => {
    render(<Grid data-testid="g" gap={16} columnGap={8} />);
    const el = screen.getByTestId("g");
    expect(el.style.gap).toBe("16px");
    expect(el.style.columnGap).toBe("8px");
  });

  it("rowGap overrides gap for rows", () => {
    render(<Grid data-testid="g" gap={16} rowGap={24} />);
    expect(screen.getByTestId("g").style.rowGap).toBe("24px");
  });

  it("gap=0", () => {
    render(<Grid data-testid="g" gap={0} />);
    expect(screen.getByTestId("g").style.gap).toBe("0px");
  });
});

// ─── Align & Justify ────────────────────────────────────────────────

describe("Grid: align", () => {
  it("align=center", () => {
    render(<Grid data-testid="g" align="center" />);
    expect(screen.getByTestId("g").style.alignItems).toBe("center");
  });

  it("align=stretch", () => {
    render(<Grid data-testid="g" align="stretch" />);
    expect(screen.getByTestId("g").style.alignItems).toBe("stretch");
  });
});

describe("Grid: justify", () => {
  it("justify=center", () => {
    render(<Grid data-testid="g" justify="center" />);
    expect(screen.getByTestId("g").style.justifyContent).toBe("center");
  });

  it("justify=between", () => {
    render(<Grid data-testid="g" justify="between" />);
    expect(screen.getByTestId("g").style.justifyContent).toBe("space-between");
  });
});

// ─── Inline ─────────────────────────────────────────────────────────

describe("Grid: inline", () => {
  it("inline sets display inline-grid", () => {
    render(<Grid data-testid="g" inline />);
    expect(screen.getByTestId("g").style.display).toBe("inline-grid");
  });
});

// ─── Polymorphic ────────────────────────────────────────────────────

describe("Grid: polymorphic", () => {
  it("renders as section", () => {
    render(<Grid as="section" data-testid="g" />);
    expect(screen.getByTestId("g").tagName).toBe("SECTION");
  });

  it("retains kui-grid class", () => {
    render(<Grid as="main" data-testid="g" />);
    expect(screen.getByTestId("g").className).toContain("kui-grid");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Grid: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Grid ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Grid: consumer overrides", () => {
  it("merges consumer className", () => {
    render(<Grid data-testid="g" className="dashboard" />);
    const cls = screen.getByTestId("g").className;
    expect(cls).toContain("kui-grid");
    expect(cls).toContain("dashboard");
  });

  it("consumer style merges with grid style", () => {
    render(<Grid data-testid="g" columns={2} style={{ maxWidth: "800px" }} />);
    const el = screen.getByTestId("g");
    expect(el.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
    expect(el.style.maxWidth).toBe("800px");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Grid: SSR", () => {
  it("renders with class and columns in SSR", () => {
    const html = renderToString(
      <Grid columns={3} gap={16}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </Grid>,
    );
    expect(html).toContain("kui-grid");
    expect(html).toContain("repeat(3, 1fr)");
    expect(html).toContain("16px");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Grid: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Grid data-testid="g" columns={2} gap={8}>
          <div>A</div>
          <div>B</div>
        </Grid>
      </StrictMode>,
    );
    expect(screen.getByTestId("g").style.gridTemplateColumns).toBe("repeat(2, 1fr)");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
