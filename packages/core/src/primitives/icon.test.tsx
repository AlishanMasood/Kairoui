import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Icon } from "./icon";

afterEach(cleanup);

describe("Icon: rendering", () => {
  it("renders as svg by default", () => {
    render(<Icon data-testid="i" />);
    expect(screen.getByTestId("i").tagName.toLowerCase()).toBe("svg");
  });

  it("applies kui-icon class", () => {
    render(<Icon data-testid="i" />);
    expect(screen.getByTestId("i").getAttribute("class")).toContain("kui-icon");
  });

  it("applies data-kui-component", () => {
    render(<Icon data-testid="i" />);
    expect(screen.getByTestId("i").getAttribute("data-kui-component")).toBe("Icon");
  });

  it("renders children (SVG paths)", () => {
    render(
      <Icon data-testid="i">
        <path d="M0 0h24v24H0z" />
      </Icon>,
    );
    expect(screen.getByTestId("i").querySelector("path")).not.toBeNull();
  });
});

describe("Icon: size", () => {
  it("default size is md (20px)", () => {
    const html = renderToString(<Icon />);
    expect(html).toContain("width:20px");
    expect(html).toContain("height:20px");
  });

  it("xs = 12px", () => {
    const html = renderToString(<Icon size="xs" />);
    expect(html).toContain("width:12px");
  });

  it("sm = 16px", () => {
    const html = renderToString(<Icon size="sm" />);
    expect(html).toContain("width:16px");
  });

  it("lg = 24px", () => {
    const html = renderToString(<Icon size="lg" />);
    expect(html).toContain("width:24px");
  });

  it("xl = 32px", () => {
    const html = renderToString(<Icon size="xl" />);
    expect(html).toContain("width:32px");
  });

  it("numeric size in px", () => {
    const html = renderToString(<Icon size={48} />);
    expect(html).toContain("width:48px");
  });

  it("custom string size", () => {
    const html = renderToString(<Icon size="2em" />);
    expect(html).toContain("width:2em");
  });

  it("size does not leak to DOM", () => {
    render(<Icon data-testid="i" size="lg" />);
    expect(screen.getByTestId("i").getAttribute("size")).toBeNull();
  });
});

describe("Icon: color", () => {
  it("applies color as inline style", () => {
    const html = renderToString(<Icon color="red" />);
    expect(html).toContain("color:red");
  });

  it("default inherits via currentColor (no inline color)", () => {
    const html = renderToString(<Icon />);
    expect(html).not.toContain("color:");
  });

  it("color does not leak to DOM", () => {
    render(<Icon data-testid="i" color="blue" />);
    expect(screen.getByTestId("i").getAttribute("color")).toBeNull();
  });
});

describe("Icon: accessibility", () => {
  it("decorative icon (no label) has aria-hidden=true", () => {
    render(<Icon data-testid="i" />);
    expect(screen.getByTestId("i").getAttribute("aria-hidden")).toBe("true");
  });

  it("decorative icon has no role", () => {
    render(<Icon data-testid="i" />);
    expect(screen.getByTestId("i").getAttribute("role")).toBeNull();
  });

  it("meaningful icon (with label) has role=img", () => {
    render(<Icon data-testid="i" label="Close" />);
    expect(screen.getByTestId("i").getAttribute("role")).toBe("img");
  });

  it("meaningful icon has aria-label", () => {
    render(<Icon data-testid="i" label="Close" />);
    expect(screen.getByTestId("i").getAttribute("aria-label")).toBe("Close");
  });

  it("meaningful icon does NOT have aria-hidden", () => {
    render(<Icon data-testid="i" label="Search" />);
    expect(screen.getByTestId("i").getAttribute("aria-hidden")).toBeNull();
  });

  it("label does not leak to DOM as attribute", () => {
    render(<Icon data-testid="i" label="Close" />);
    expect(screen.getByTestId("i").getAttribute("label")).toBeNull();
  });
});

describe("Icon: polymorphic", () => {
  it("renders as span", () => {
    render(<Icon as="span" data-testid="i" />);
    expect(screen.getByTestId("i").tagName).toBe("SPAN");
  });

  it("retains class with as", () => {
    render(<Icon as="span" data-testid="i" />);
    expect(screen.getByTestId("i").className).toContain("kui-icon");
  });
});

describe("Icon: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });
});

describe("Icon: consumer overrides", () => {
  it("merges className", () => {
    render(<Icon data-testid="i" className="custom-icon" />);
    const cls = screen.getByTestId("i").getAttribute("class") ?? "";
    expect(cls).toContain("kui-icon");
    expect(cls).toContain("custom-icon");
  });
});

describe("Icon: SSR", () => {
  it("decorative icon in SSR", () => {
    const html = renderToString(<Icon size="lg" />);
    expect(html).toContain("kui-icon");
    expect(html).toContain('aria-hidden="true"');
  });

  it("meaningful icon in SSR", () => {
    const html = renderToString(<Icon label="Menu" size="md" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Menu"');
  });
});

describe("Icon: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Icon data-testid="i" label="Star" size="lg">
          <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
        </Icon>
      </StrictMode>,
    );
    expect(screen.getByTestId("i").getAttribute("aria-label")).toBe("Star");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
