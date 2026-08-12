import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Center } from "./center";

afterEach(cleanup);

describe("Center: rendering", () => {
  it("renders as div", () => {
    render(<Center data-testid="c" />);
    expect(screen.getByTestId("c").tagName).toBe("DIV");
  });

  it("applies kui-center class", () => {
    render(<Center data-testid="c" />);
    expect(screen.getByTestId("c").className).toContain("kui-center");
  });

  it("applies data-kui-component", () => {
    render(<Center data-testid="c" />);
    expect(screen.getByTestId("c").getAttribute("data-kui-component")).toBe("Center");
  });

  it("renders children", () => {
    render(<Center data-testid="c">Hello</Center>);
    expect(screen.getByTestId("c").textContent).toBe("Hello");
  });
});

describe("Center: inline", () => {
  it("inline sets display inline-flex", () => {
    render(<Center data-testid="c" inline />);
    expect(screen.getByTestId("c").style.display).toBe("inline-flex");
  });

  it("default has no inline style for display", () => {
    render(<Center data-testid="c" />);
    expect(screen.getByTestId("c").style.display).toBe("");
  });

  it("inline does not leak to DOM", () => {
    render(<Center data-testid="c" inline />);
    expect(screen.getByTestId("c").getAttribute("inline")).toBeNull();
  });
});

describe("Center: polymorphic", () => {
  it("renders as section", () => {
    render(<Center as="section" data-testid="c" />);
    expect(screen.getByTestId("c").tagName).toBe("SECTION");
  });

  it("retains kui-center class", () => {
    render(<Center as="span" data-testid="c" />);
    expect(screen.getByTestId("c").className).toContain("kui-center");
  });
});

describe("Center: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Center ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("Center: consumer overrides", () => {
  it("merges className", () => {
    render(<Center data-testid="c" className="hero" />);
    const cls = screen.getByTestId("c").className;
    expect(cls).toContain("kui-center");
    expect(cls).toContain("hero");
  });

  it("merges style", () => {
    render(<Center data-testid="c" style={{ height: "100vh" }} />);
    expect(screen.getByTestId("c").style.height).toBe("100vh");
  });
});

describe("Center: SSR", () => {
  it("renders with class in SSR", () => {
    const html = renderToString(<Center>Content</Center>);
    expect(html).toContain("kui-center");
    expect(html).toContain("Content");
  });
});

describe("Center: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Center data-testid="c">OK</Center>
      </StrictMode>,
    );
    expect(screen.getByTestId("c").textContent).toBe("OK");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
