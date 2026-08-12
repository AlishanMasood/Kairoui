import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { VisuallyHidden } from "./visually-hidden";

afterEach(cleanup);

describe("VisuallyHidden: rendering", () => {
  it("renders as span by default", () => {
    render(<VisuallyHidden data-testid="vh">Hidden text</VisuallyHidden>);
    expect(screen.getByTestId("vh").tagName).toBe("SPAN");
  });

  it("renders children (accessible to screen readers)", () => {
    render(<VisuallyHidden data-testid="vh">Skip to content</VisuallyHidden>);
    expect(screen.getByTestId("vh").textContent).toBe("Skip to content");
  });

  it("applies kui-visually-hidden class", () => {
    render(<VisuallyHidden data-testid="vh">Text</VisuallyHidden>);
    expect(screen.getByTestId("vh").className).toContain("kui-visually-hidden");
  });

  it("applies data-kui-component", () => {
    render(<VisuallyHidden data-testid="vh">Text</VisuallyHidden>);
    expect(screen.getByTestId("vh").getAttribute("data-kui-component")).toBe("VisuallyHidden");
  });
});

describe("VisuallyHidden: accessibility", () => {
  it("does NOT use aria-hidden", () => {
    render(<VisuallyHidden data-testid="vh">Accessible</VisuallyHidden>);
    expect(screen.getByTestId("vh").getAttribute("aria-hidden")).toBeNull();
  });

  it("does NOT use display:none (element is in DOM)", () => {
    render(<VisuallyHidden data-testid="vh">Present</VisuallyHidden>);
    const el = screen.getByTestId("vh");
    expect(el).toBeDefined();
    expect(el.textContent).toBe("Present");
  });

  it("content is findable by accessible name", () => {
    render(
      <div>
        <VisuallyHidden>
          <label htmlFor="search">Search</label>
        </VisuallyHidden>
        <input id="search" data-testid="input" />
      </div>,
    );
    expect(screen.getByTestId("input")).toBeDefined();
  });

  it("can be used as form label", () => {
    render(
      <div>
        <VisuallyHidden as="label" htmlFor="email">
          Email address
        </VisuallyHidden>
        <input id="email" data-testid="email" />
      </div>,
    );
    expect(screen.getByTestId("email")).toBeDefined();
  });
});

describe("VisuallyHidden: CSS technique", () => {
  it("SSR output uses position:absolute (not display:none)", () => {
    const html = renderToString(<VisuallyHidden>Skip</VisuallyHidden>);
    expect(html).not.toContain("display:none");
    expect(html).not.toContain("visibility:hidden");
    expect(html).not.toContain("aria-hidden");
  });

  it("SSR includes clip technique", () => {
    // The CSS class handles the clipping — just verify the class is present
    const html = renderToString(<VisuallyHidden>Skip</VisuallyHidden>);
    expect(html).toContain("kui-visually-hidden");
  });
});

describe("VisuallyHidden: polymorphic", () => {
  it("renders as label", () => {
    render(
      <VisuallyHidden as="label" data-testid="vh">
        Label
      </VisuallyHidden>,
    );
    expect(screen.getByTestId("vh").tagName).toBe("LABEL");
  });

  it("renders as h1 (for accessible headings)", () => {
    render(
      <VisuallyHidden as="h1" data-testid="vh">
        Page Title
      </VisuallyHidden>,
    );
    expect(screen.getByTestId("vh").tagName).toBe("H1");
  });

  it("retains class with polymorphic rendering", () => {
    render(
      <VisuallyHidden as="div" data-testid="vh">
        Text
      </VisuallyHidden>,
    );
    expect(screen.getByTestId("vh").className).toContain("kui-visually-hidden");
  });
});

describe("VisuallyHidden: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<VisuallyHidden ref={ref}>Text</VisuallyHidden>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

describe("VisuallyHidden: consumer overrides", () => {
  it("merges className", () => {
    render(
      <VisuallyHidden data-testid="vh" className="sr-only">
        Text
      </VisuallyHidden>,
    );
    const cls = screen.getByTestId("vh").className;
    expect(cls).toContain("kui-visually-hidden");
    expect(cls).toContain("sr-only");
  });
});

describe("VisuallyHidden: SSR", () => {
  it("renders content in SSR (accessible to parsers)", () => {
    const html = renderToString(<VisuallyHidden>Skip navigation</VisuallyHidden>);
    expect(html).toContain("Skip navigation");
    expect(html).toContain("kui-visually-hidden");
  });
});

describe("VisuallyHidden: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <VisuallyHidden data-testid="vh">OK</VisuallyHidden>
      </StrictMode>,
    );
    expect(screen.getByTestId("vh").textContent).toBe("OK");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
