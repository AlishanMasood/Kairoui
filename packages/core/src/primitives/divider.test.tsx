import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Divider } from "./divider";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Divider: rendering", () => {
  it("renders as hr by default", () => {
    render(<Divider data-testid="d" />);
    expect(screen.getByTestId("d").tagName).toBe("HR");
  });

  it("applies kui-divider class", () => {
    render(<Divider data-testid="d" />);
    expect(screen.getByTestId("d").className).toContain("kui-divider");
  });

  it("applies data-kui-component", () => {
    render(<Divider data-testid="d" />);
    expect(screen.getByTestId("d").getAttribute("data-kui-component")).toBe("Divider");
  });
});

// ─── Orientation ────────────────────────────────────────────────────

describe("Divider: orientation", () => {
  it("horizontal by default (width: 100%)", () => {
    const html = renderToString(<Divider />);
    expect(html).toContain("width:100%");
  });

  it("vertical sets height auto and align-self stretch", () => {
    const html = renderToString(<Divider orientation="vertical" />);
    expect(html).toContain("align-self:stretch");
  });

  it("vertical sets aria-orientation", () => {
    render(<Divider data-testid="d" orientation="vertical" />);
    expect(screen.getByTestId("d").getAttribute("aria-orientation")).toBe("vertical");
  });

  it("horizontal does not set aria-orientation (default for hr)", () => {
    render(<Divider data-testid="d" orientation="horizontal" />);
    expect(screen.getByTestId("d").getAttribute("aria-orientation")).toBeNull();
  });

  it("orientation does not leak to DOM", () => {
    render(<Divider data-testid="d" orientation="vertical" />);
    expect(screen.getByTestId("d").getAttribute("orientation")).toBeNull();
  });
});

// ─── Decorative ─────────────────────────────────────────────────────

describe("Divider: decorative", () => {
  it("decorative sets role=none", () => {
    render(<Divider data-testid="d" decorative />);
    expect(screen.getByTestId("d").getAttribute("role")).toBe("none");
  });

  it("non-decorative does not set role", () => {
    render(<Divider data-testid="d" />);
    expect(screen.getByTestId("d").getAttribute("role")).toBeNull();
  });

  it("decorative does not leak to DOM", () => {
    render(<Divider data-testid="d" decorative />);
    expect(screen.getByTestId("d").getAttribute("decorative")).toBeNull();
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Divider: accessibility", () => {
  it("native hr has implicit separator role (no explicit role needed)", () => {
    render(<Divider data-testid="d" />);
    expect(screen.getByTestId("d").getAttribute("role")).toBeNull();
  });

  it("vertical decorative divider has role=none", () => {
    render(<Divider data-testid="d" orientation="vertical" decorative />);
    expect(screen.getByTestId("d").getAttribute("role")).toBe("none");
  });

  it("consumer aria-label passes through", () => {
    render(<Divider data-testid="d" aria-label="Section break" />);
    expect(screen.getByTestId("d").getAttribute("aria-label")).toBe("Section break");
  });
});

// ─── Polymorphic ────────────────────────────────────────────────────

describe("Divider: polymorphic", () => {
  it("renders as div", () => {
    render(<Divider as="div" data-testid="d" />);
    expect(screen.getByTestId("d").tagName).toBe("DIV");
  });

  it("retains kui-divider class", () => {
    render(<Divider as="div" data-testid="d" />);
    expect(screen.getByTestId("d").className).toContain("kui-divider");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Divider: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLHRElement>();
    render(<Divider ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLHRElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Divider: consumer overrides", () => {
  it("merges consumer className", () => {
    render(<Divider data-testid="d" className="custom" />);
    const cls = screen.getByTestId("d").className;
    expect(cls).toContain("kui-divider");
    expect(cls).toContain("custom");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Divider: SSR", () => {
  it("renders hr in SSR", () => {
    const html = renderToString(<Divider />);
    expect(html).toContain("<hr");
    expect(html).toContain("kui-divider");
  });

  it("decorative has role=none in SSR", () => {
    const html = renderToString(<Divider decorative />);
    expect(html).toContain('role="none"');
  });

  it("vertical has aria-orientation in SSR", () => {
    const html = renderToString(<Divider orientation="vertical" />);
    expect(html).toContain('aria-orientation="vertical"');
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Divider: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Divider data-testid="d" />
      </StrictMode>,
    );
    expect(screen.getByTestId("d").tagName).toBe("HR");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
