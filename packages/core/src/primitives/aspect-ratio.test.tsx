import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { AspectRatio } from "./aspect-ratio";

afterEach(cleanup);

describe("AspectRatio: rendering", () => {
  it("renders as div", () => {
    render(<AspectRatio data-testid="a" />);
    expect(screen.getByTestId("a").tagName).toBe("DIV");
  });

  it("applies kui-aspect-ratio class", () => {
    render(<AspectRatio data-testid="a" />);
    expect(screen.getByTestId("a").className).toContain("kui-aspect-ratio");
  });

  it("applies data-kui-component", () => {
    render(<AspectRatio data-testid="a" />);
    expect(screen.getByTestId("a").getAttribute("data-kui-component")).toBe("AspectRatio");
  });

  it("renders children", () => {
    render(
      <AspectRatio data-testid="a">
        <img alt="test" />
      </AspectRatio>,
    );
    expect(screen.getByTestId("a").querySelector("img")).not.toBeNull();
  });
});

describe("AspectRatio: ratio", () => {
  it("default ratio is 1 (square)", () => {
    const html = renderToString(<AspectRatio />);
    expect(html).toContain("aspect-ratio:1");
  });

  it("numeric ratio", () => {
    const html = renderToString(<AspectRatio ratio={16 / 9} />);
    expect(html).toContain("aspect-ratio:");
  });

  it("string ratio (16/9)", () => {
    const html = renderToString(<AspectRatio ratio="16/9" />);
    expect(html).toContain("aspect-ratio:16/9");
  });

  it("string ratio (4/3)", () => {
    const html = renderToString(<AspectRatio ratio="4/3" />);
    expect(html).toContain("aspect-ratio:4/3");
  });

  it("ratio does not leak to DOM", () => {
    render(<AspectRatio data-testid="a" ratio={2} />);
    expect(screen.getByTestId("a").getAttribute("ratio")).toBeNull();
  });
});

describe("AspectRatio: polymorphic", () => {
  it("renders as figure", () => {
    render(<AspectRatio as="figure" data-testid="a" />);
    expect(screen.getByTestId("a").tagName).toBe("FIGURE");
  });

  it("retains class with as", () => {
    render(<AspectRatio as="section" data-testid="a" />);
    expect(screen.getByTestId("a").className).toContain("kui-aspect-ratio");
  });
});

describe("AspectRatio: ref", () => {
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<AspectRatio ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("AspectRatio: consumer overrides", () => {
  it("merges className", () => {
    render(<AspectRatio data-testid="a" className="video" />);
    const cls = screen.getByTestId("a").className;
    expect(cls).toContain("kui-aspect-ratio");
    expect(cls).toContain("video");
  });

  it("merges style", () => {
    render(<AspectRatio data-testid="a" style={{ width: "100%" }} />);
    expect(screen.getByTestId("a").style.width).toBe("100%");
  });
});

describe("AspectRatio: SSR", () => {
  it("renders with aspect-ratio in SSR", () => {
    const html = renderToString(<AspectRatio ratio="16/9">Media</AspectRatio>);
    expect(html).toContain("kui-aspect-ratio");
    expect(html).toContain("aspect-ratio");
    expect(html).toContain("Media");
  });
});

describe("AspectRatio: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <AspectRatio data-testid="a" ratio={16 / 9}>
          <div>Content</div>
        </AspectRatio>
      </StrictMode>,
    );
    expect(screen.getByTestId("a").textContent).toBe("Content");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });
});
