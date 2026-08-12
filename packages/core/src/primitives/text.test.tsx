import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Text } from "./text";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Text: rendering", () => {
  it("renders as span by default", () => {
    render(<Text data-testid="t">Hello</Text>);
    expect(screen.getByTestId("t").tagName).toBe("SPAN");
  });

  it("renders children", () => {
    render(<Text data-testid="t">World</Text>);
    expect(screen.getByTestId("t").textContent).toBe("World");
  });

  it("applies kui-text class", () => {
    render(<Text data-testid="t">Hi</Text>);
    expect(screen.getByTestId("t").className).toContain("kui-text");
  });

  it("applies data-kui-component", () => {
    render(<Text data-testid="t">Hi</Text>);
    expect(screen.getByTestId("t").getAttribute("data-kui-component")).toBe("Text");
  });
});

// ─── Semantic elements ──────────────────────────────────────────────

describe("Text: semantic elements", () => {
  it("renders as p", () => {
    render(
      <Text as="p" data-testid="t">
        Paragraph
      </Text>,
    );
    expect(screen.getByTestId("t").tagName).toBe("P");
  });

  it("renders as strong", () => {
    render(
      <Text as="strong" data-testid="t">
        Bold
      </Text>,
    );
    expect(screen.getByTestId("t").tagName).toBe("STRONG");
  });

  it("renders as em", () => {
    render(
      <Text as="em" data-testid="t">
        Italic
      </Text>,
    );
    expect(screen.getByTestId("t").tagName).toBe("EM");
  });

  it("renders as small", () => {
    render(
      <Text as="small" data-testid="t">
        Fine
      </Text>,
    );
    expect(screen.getByTestId("t").tagName).toBe("SMALL");
  });

  it("renders as label with htmlFor", () => {
    render(
      <Text as="label" htmlFor="email" data-testid="t">
        Email
      </Text>,
    );
    const el = screen.getByTestId("t");
    expect(el.tagName).toBe("LABEL");
    expect(el.getAttribute("for")).toBe("email");
  });

  it("renders as blockquote", () => {
    render(
      <Text as="blockquote" data-testid="t">
        Quote
      </Text>,
    );
    expect(screen.getByTestId("t").tagName).toBe("BLOCKQUOTE");
  });

  it("renders as time with dateTime", () => {
    render(
      <Text as="time" dateTime="2026-01-01" data-testid="t">
        Jan 1
      </Text>,
    );
    const el = screen.getByTestId("t");
    expect(el.tagName).toBe("TIME");
    expect(el.getAttribute("datetime")).toBe("2026-01-01");
  });

  it("retains kui-text class on all semantic elements", () => {
    render(
      <Text as="p" data-testid="t">
        P
      </Text>,
    );
    expect(screen.getByTestId("t").className).toContain("kui-text");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Text: ref", () => {
  it("forwards ref to span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Text ref={ref}>Hi</Text>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards ref to polymorphic element", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(
      <Text as="p" ref={ref}>
        Hi
      </Text>,
    );
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it("supports callback ref", () => {
    let el: HTMLElement | null = null;
    render(
      <Text
        ref={(node: HTMLElement | null) => {
          el = node;
        }}
      >
        Hi
      </Text>,
    );
    expect(el).toBeInstanceOf(HTMLSpanElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Text: consumer overrides", () => {
  it("merges consumer className", () => {
    render(
      <Text data-testid="t" className="custom">
        Hi
      </Text>,
    );
    const cls = screen.getByTestId("t").className;
    expect(cls).toContain("kui-text");
    expect(cls).toContain("custom");
  });

  it("applies consumer style", () => {
    render(
      <Text data-testid="t" style={{ color: "red" }}>
        Hi
      </Text>,
    );
    expect(screen.getByTestId("t").style.color).toBe("red");
  });

  it("passes ARIA attributes", () => {
    render(
      <Text data-testid="t" aria-label="status" role="status">
        OK
      </Text>,
    );
    const el = screen.getByTestId("t");
    expect(el.getAttribute("aria-label")).toBe("status");
    expect(el.getAttribute("role")).toBe("status");
  });

  it("passes data attributes", () => {
    render(
      <Text data-testid="t" data-state="active">
        Hi
      </Text>,
    );
    expect(screen.getByTestId("t").getAttribute("data-state")).toBe("active");
  });
});

// ─── Custom component ───────────────────────────────────────────────

describe("Text: custom component", () => {
  it("renders as forwardRef component", () => {
    const RouterLink = forwardRef<
      HTMLAnchorElement,
      { to: string; children?: React.ReactNode; "data-testid"?: string }
    >((props, ref) => {
      const { to, children, ...rest } = props;
      return (
        <a ref={ref} href={to} {...rest}>
          {children}
        </a>
      );
    });
    RouterLink.displayName = "RouterLink";
    render(
      <Text as={RouterLink} to="/page" data-testid="t">
        Link
      </Text>,
    );
    const el = screen.getByTestId("t");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/page");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Text: SSR", () => {
  it("renders to string with class", () => {
    const html = renderToString(<Text className="body">Hello</Text>);
    expect(html).toContain("kui-text");
    expect(html).toContain("body");
    expect(html).toContain("Hello");
  });

  it("polymorphic SSR", () => {
    const html = renderToString(<Text as="p">Paragraph</Text>);
    expect(html).toContain("<p");
    expect(html).toContain("kui-text");
  });

  it("no inline typography styles (class-based)", () => {
    const html = renderToString(<Text>Clean</Text>);
    expect(html).not.toMatch(/style="[^"]*font-family/);
    expect(html).not.toMatch(/style="[^"]*font-size/);
  });

  it("label SSR has for attribute", () => {
    const html = renderToString(
      <Text as="label" htmlFor="input-1">
        Name
      </Text>,
    );
    expect(html).toContain('for="input-1"');
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Text: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Text data-testid="t">OK</Text>
      </StrictMode>,
    );
    expect(screen.getByTestId("t").textContent).toBe("OK");
    const warnings = spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });

  it("ref works in Strict Mode", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <StrictMode>
        <Text ref={ref}>Hi</Text>
      </StrictMode>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
