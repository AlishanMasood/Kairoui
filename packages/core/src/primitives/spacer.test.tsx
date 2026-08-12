import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Spacer } from "./spacer";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Spacer: rendering", () => {
  it("renders as div", () => {
    render(<Spacer data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("DIV");
  });

  it("applies kui-spacer class", () => {
    render(<Spacer data-testid="s" />);
    expect(screen.getByTestId("s").className).toContain("kui-spacer");
  });

  it("applies aria-hidden (non-semantic element)", () => {
    render(<Spacer data-testid="s" />);
    expect(screen.getByTestId("s").getAttribute("aria-hidden")).toBe("true");
  });

  it("default size is 16px height", () => {
    render(<Spacer data-testid="s" />);
    expect(screen.getByTestId("s").style.height).toBe("16px");
  });
});

// ─── Size ───────────────────────────────────────────────────────────

describe("Spacer: size", () => {
  it("size as number (px)", () => {
    render(<Spacer data-testid="s" size={24} />);
    expect(screen.getByTestId("s").style.height).toBe("24px");
  });

  it("size as string", () => {
    render(<Spacer data-testid="s" size="2rem" />);
    expect(screen.getByTestId("s").style.height).toBe("2rem");
  });

  it("size=0", () => {
    render(<Spacer data-testid="s" size={0} />);
    expect(screen.getByTestId("s").style.height).toBe("0px");
  });

  it("size with token var()", () => {
    const html = renderToString(<Spacer size="var(--kui-space-4, 16px)" />);
    expect(html).toContain("--kui-space-4");
  });

  it("size does not leak to DOM", () => {
    render(<Spacer data-testid="s" size={32} />);
    expect(screen.getByTestId("s").getAttribute("size")).toBeNull();
  });
});

// ─── Axis ───────────────────────────────────────────────────────────

describe("Spacer: axis", () => {
  it("vertical (default) sets height", () => {
    render(<Spacer data-testid="s" size={12} axis="vertical" />);
    expect(screen.getByTestId("s").style.height).toBe("12px");
    expect(screen.getByTestId("s").style.width).toBe("");
  });

  it("horizontal sets width", () => {
    render(<Spacer data-testid="s" size={12} axis="horizontal" />);
    expect(screen.getByTestId("s").style.width).toBe("12px");
    expect(screen.getByTestId("s").style.height).toBe("");
  });

  it("axis does not leak to DOM", () => {
    render(<Spacer data-testid="s" axis="horizontal" />);
    expect(screen.getByTestId("s").getAttribute("axis")).toBeNull();
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Spacer: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Spacer ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Spacer: consumer overrides", () => {
  it("merges consumer className", () => {
    render(<Spacer data-testid="s" className="extra" />);
    const cls = screen.getByTestId("s").className;
    expect(cls).toContain("kui-spacer");
    expect(cls).toContain("extra");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Spacer: SSR", () => {
  it("renders with aria-hidden in SSR", () => {
    const html = renderToString(<Spacer size={24} />);
    expect(html).toContain("kui-spacer");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("24px");
  });

  it("horizontal in SSR sets width", () => {
    const html = renderToString(<Spacer size={8} axis="horizontal" />);
    expect(html).toContain("width");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Spacer: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Spacer data-testid="s" size={16} />
      </StrictMode>,
    );
    expect(screen.getByTestId("s").style.height).toBe("16px");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
