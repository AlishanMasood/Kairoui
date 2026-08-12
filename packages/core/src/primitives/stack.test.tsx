import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Stack } from "./stack";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Stack: rendering", () => {
  it("renders as div by default", () => {
    render(<Stack data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("DIV");
  });

  it("applies kui-stack class", () => {
    render(<Stack data-testid="s" />);
    expect(screen.getByTestId("s").className).toContain("kui-stack");
  });

  it("applies data-kui-component", () => {
    render(<Stack data-testid="s" />);
    expect(screen.getByTestId("s").getAttribute("data-kui-component")).toBe("Stack");
  });

  it("renders children vertically (column is default in CSS)", () => {
    render(
      <Stack data-testid="s">
        <span>A</span>
        <span>B</span>
      </Stack>,
    );
    // flex-direction comes from CSS class, not inline style
    expect(screen.getByTestId("s").style.flexDirection).toBe("");
  });
});

// ─── Gap ────────────────────────────────────────────────────────────

describe("Stack: gap", () => {
  it("gap as number (px)", () => {
    render(<Stack data-testid="s" gap={12} />);
    expect(screen.getByTestId("s").style.gap).toBe("12px");
  });

  it("gap as string", () => {
    render(<Stack data-testid="s" gap="1rem" />);
    expect(screen.getByTestId("s").style.gap).toBe("1rem");
  });

  it("gap=0", () => {
    render(<Stack data-testid="s" gap={0} />);
    expect(screen.getByTestId("s").style.gap).toBe("0px");
  });

  it("gap with token var()", () => {
    render(<Stack data-testid="s" gap="var(--kui-space-inline-md, 16px)" />);
    expect(screen.getByTestId("s").style.gap).toBe("var(--kui-space-inline-md, 16px)");
  });

  it("gap does not leak to DOM", () => {
    render(<Stack data-testid="s" gap={8} />);
    expect(screen.getByTestId("s").getAttribute("gap")).toBeNull();
  });
});

// ─── Direction ──────────────────────────────────────────────────────

describe("Stack: direction", () => {
  it("default is vertical (no inline style needed)", () => {
    render(<Stack data-testid="s" />);
    expect(screen.getByTestId("s").style.flexDirection).toBe("");
  });

  it("direction=horizontal sets flex-direction row", () => {
    render(<Stack data-testid="s" direction="horizontal" />);
    expect(screen.getByTestId("s").style.flexDirection).toBe("row");
  });

  it("direction=vertical does not set inline style", () => {
    render(<Stack data-testid="s" direction="vertical" />);
    expect(screen.getByTestId("s").style.flexDirection).toBe("");
  });

  it("direction does not leak to DOM", () => {
    render(<Stack data-testid="s" direction="horizontal" />);
    expect(screen.getByTestId("s").getAttribute("direction")).toBeNull();
  });
});

// ─── Align ──────────────────────────────────────────────────────────

describe("Stack: align", () => {
  it("align=center", () => {
    render(<Stack data-testid="s" align="center" />);
    expect(screen.getByTestId("s").style.alignItems).toBe("center");
  });

  it("align=start", () => {
    render(<Stack data-testid="s" align="start" />);
    expect(screen.getByTestId("s").style.alignItems).toBe("flex-start");
  });

  it("align=stretch", () => {
    render(<Stack data-testid="s" align="stretch" />);
    expect(screen.getByTestId("s").style.alignItems).toBe("stretch");
  });
});

// ─── Polymorphic ────────────────────────────────────────────────────

describe("Stack: polymorphic", () => {
  it("renders as section", () => {
    render(<Stack as="section" data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("SECTION");
  });

  it("renders as ul", () => {
    render(<Stack as="ul" data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("UL");
  });

  it("retains kui-stack class", () => {
    render(<Stack as="nav" data-testid="s" />);
    expect(screen.getByTestId("s").className).toContain("kui-stack");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Stack: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Stack: consumer overrides", () => {
  it("merges consumer className", () => {
    render(<Stack data-testid="s" className="sidebar" />);
    const cls = screen.getByTestId("s").className;
    expect(cls).toContain("kui-stack");
    expect(cls).toContain("sidebar");
  });

  it("consumer style merges with gap", () => {
    render(<Stack data-testid="s" gap={8} style={{ padding: "16px" }} />);
    const el = screen.getByTestId("s");
    expect(el.style.gap).toBe("8px");
    expect(el.style.padding).toBe("16px");
  });
});

// ─── Nested stacks ──────────────────────────────────────────────────

describe("Stack: nesting", () => {
  it("nested stacks render independently", () => {
    render(
      <Stack data-testid="outer" gap={16}>
        <Stack data-testid="inner" gap={8}>
          <span>A</span>
          <span>B</span>
        </Stack>
        <span>C</span>
      </Stack>,
    );
    expect(screen.getByTestId("outer").style.gap).toBe("16px");
    expect(screen.getByTestId("inner").style.gap).toBe("8px");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Stack: SSR", () => {
  it("renders with class in SSR", () => {
    const html = renderToString(
      <Stack gap={12}>
        <span>A</span>
        <span>B</span>
      </Stack>,
    );
    expect(html).toContain("kui-stack");
    expect(html).toContain("12px");
  });

  it("polymorphic SSR", () => {
    const html = renderToString(<Stack as="nav">Nav</Stack>);
    expect(html).toContain("<nav");
    expect(html).toContain("kui-stack");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Stack: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Stack data-testid="s" gap={8} align="center">
          <span>Child</span>
        </Stack>
      </StrictMode>,
    );
    expect(screen.getByTestId("s").style.gap).toBe("8px");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
