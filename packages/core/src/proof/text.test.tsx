import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Text } from "./text";
import type { PolymorphicProps } from "../composition/polymorphic-types";

afterEach(cleanup);

// ─── Custom component fixtures ──────────────────────────────────────

interface RouterLinkProps {
  to: string;
  children?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>((props, ref) => {
  const { to, children, ...rest } = props;
  return (
    <a {...rest} href={to} ref={ref} data-router-link="true">
      {children}
    </a>
  );
});
RouterLink.displayName = "RouterLink";

// ─── Default rendering ──────────────────────────────────────────────

describe("Text: default rendering", () => {
  it("renders as span by default", () => {
    render(<Text data-testid="text" />);
    expect(screen.getByTestId("text").tagName).toBe("SPAN");
  });

  it("renders children", () => {
    render(<Text data-testid="text">Hello world</Text>);
    expect(screen.getByTestId("text").textContent).toBe("Hello world");
  });

  it("applies data-kui-component metadata", () => {
    render(<Text data-testid="text" />);
    expect(screen.getByTestId("text").getAttribute("data-kui-component")).toBe("Text");
  });

  it("applies className", () => {
    render(<Text data-testid="text" className="custom" />);
    expect(screen.getByTestId("text").className).toContain("custom");
  });

  it("applies inline style", () => {
    render(<Text data-testid="text" style={{ color: "red" }} />);
    expect(screen.getByTestId("text").style.color).toBe("red");
  });

  it("applies base class for typography styling", () => {
    render(<Text data-testid="text" />);
    const el = screen.getByTestId("text");
    expect(el.className).toContain("kui-text");
  });

  it("consumer style is applied alongside base class", () => {
    render(<Text data-testid="text" style={{ color: "blue", fontSize: "2rem" }} />);
    const el = screen.getByTestId("text");
    expect(el.style.color).toBe("blue");
    expect(el.style.fontSize).toBe("2rem");
    expect(el.className).toContain("kui-text");
  });
});

// ─── Semantic element targets ───────────────────────────────────────

describe("Text: semantic elements", () => {
  it("renders as p", () => {
    render(
      <Text as="p" data-testid="p">
        Paragraph
      </Text>,
    );
    expect(screen.getByTestId("p").tagName).toBe("P");
    expect(screen.getByTestId("p").textContent).toBe("Paragraph");
  });

  it("renders as span", () => {
    render(
      <Text as="span" data-testid="span">
        Inline
      </Text>,
    );
    expect(screen.getByTestId("span").tagName).toBe("SPAN");
  });

  it("renders as strong", () => {
    render(
      <Text as="strong" data-testid="strong">
        Important
      </Text>,
    );
    expect(screen.getByTestId("strong").tagName).toBe("STRONG");
  });

  it("renders as em", () => {
    render(
      <Text as="em" data-testid="em">
        Emphasized
      </Text>,
    );
    expect(screen.getByTestId("em").tagName).toBe("EM");
  });

  it("renders as small", () => {
    render(
      <Text as="small" data-testid="small">
        Fine print
      </Text>,
    );
    expect(screen.getByTestId("small").tagName).toBe("SMALL");
  });

  it("renders as blockquote", () => {
    render(
      <Text as="blockquote" data-testid="bq">
        Quote
      </Text>,
    );
    expect(screen.getByTestId("bq").tagName).toBe("BLOCKQUOTE");
  });

  it("renders as h1", () => {
    render(
      <Text as="h1" data-testid="h1">
        Heading
      </Text>,
    );
    expect(screen.getByTestId("h1").tagName).toBe("H1");
  });

  it("renders as h2", () => {
    render(
      <Text as="h2" data-testid="h2">
        Subheading
      </Text>,
    );
    expect(screen.getByTestId("h2").tagName).toBe("H2");
  });

  it("renders as abbr with title", () => {
    render(
      <Text as="abbr" title="HyperText Markup Language" data-testid="abbr">
        HTML
      </Text>,
    );
    const el = screen.getByTestId("abbr");
    expect(el.tagName).toBe("ABBR");
    expect(el.getAttribute("title")).toBe("HyperText Markup Language");
  });

  it("renders as time with dateTime", () => {
    render(
      <Text as="time" dateTime="2026-01-01" data-testid="time">
        Jan 1
      </Text>,
    );
    const el = screen.getByTestId("time");
    expect(el.tagName).toBe("TIME");
    expect(el.getAttribute("datetime")).toBe("2026-01-01");
  });
});

// ─── Label and htmlFor ──────────────────────────────────────────────

describe("Text: label rendering", () => {
  it("renders as label with htmlFor", () => {
    render(
      <Text as="label" htmlFor="email-input" data-testid="label">
        Email
      </Text>,
    );
    const el = screen.getByTestId("label");
    expect(el.tagName).toBe("LABEL");
    expect(el.getAttribute("for")).toBe("email-input");
  });

  it("label associates with input via htmlFor", () => {
    render(
      <div>
        <Text as="label" htmlFor="name" data-testid="label">
          Name
        </Text>
        <input id="name" data-testid="input" />
      </div>,
    );
    const label = screen.getByTestId("label");
    const input = screen.getByTestId("input");
    expect(label.getAttribute("for")).toBe("name");
    expect(input.id).toBe("name");
  });

  it("label without htmlFor renders correctly", () => {
    render(
      <Text as="label" data-testid="label">
        Generic label
      </Text>,
    );
    expect(screen.getByTestId("label").tagName).toBe("LABEL");
    expect(screen.getByTestId("label").getAttribute("for")).toBeNull();
  });
});

// ─── Polymorphic custom components ──────────────────────────────────

describe("Text: custom components", () => {
  it("renders as custom forwardRef component", () => {
    render(
      <Text as={RouterLink} to="/about" data-testid="custom">
        About
      </Text>,
    );
    const el = screen.getByTestId("custom");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/about");
    expect(el.getAttribute("data-router-link")).toBe("true");
    expect(el.textContent).toBe("About");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Text: ref forwarding", () => {
  it("forwards ref to default span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Text ref={ref} data-testid="ref" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards ref to paragraph", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<Text as="p" ref={ref} data-testid="p-ref" />);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it("forwards ref to heading", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Text as="h1" ref={ref} data-testid="h-ref" />);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it("forwards ref to label", () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Text as="label" ref={ref} data-testid="l-ref" />);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("forwards ref to custom component", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Text as={RouterLink} ref={ref} to="/" data-testid="c-ref" />);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("callback ref receives element", () => {
    let captured: HTMLElement | null = null;
    render(
      <Text
        ref={(el: HTMLElement | null) => {
          captured = el;
        }}
        data-testid="cb-ref"
      />,
    );
    expect(captured).toBeInstanceOf(HTMLSpanElement);
  });
});

// ─── ARIA and accessibility ─────────────────────────────────────────

describe("Text: accessibility", () => {
  it("passes aria-label", () => {
    render(<Text data-testid="a11y" aria-label="Description" />);
    expect(screen.getByTestId("a11y").getAttribute("aria-label")).toBe("Description");
  });

  it("passes aria-hidden", () => {
    render(<Text data-testid="hidden" aria-hidden="true" />);
    expect(screen.getByTestId("hidden").getAttribute("aria-hidden")).toBe("true");
  });

  it("passes aria-describedby", () => {
    render(<Text data-testid="desc" aria-describedby="hint-1" />);
    expect(screen.getByTestId("desc").getAttribute("aria-describedby")).toBe("hint-1");
  });

  it("passes role", () => {
    render(<Text data-testid="role" role="alert" />);
    expect(screen.getByTestId("role").getAttribute("role")).toBe("alert");
  });

  it("passes aria-live for announcements", () => {
    render(<Text data-testid="live" aria-live="polite" />);
    expect(screen.getByTestId("live").getAttribute("aria-live")).toBe("polite");
  });

  it("passes id for label association", () => {
    render(<Text data-testid="id" id="error-msg" />);
    expect(screen.getByTestId("id").id).toBe("error-msg");
  });
});

// ─── Data attributes ────────────────────────────────────────────────

describe("Text: data attributes", () => {
  it("passes data-* attributes", () => {
    render(<Text data-testid="data" data-state="error" />);
    expect(screen.getByTestId("data").getAttribute("data-state")).toBe("error");
  });

  it("preserves data-kui-component alongside consumer data-*", () => {
    render(<Text data-testid="both" data-variant="caption" />);
    const el = screen.getByTestId("both");
    expect(el.getAttribute("data-kui-component")).toBe("Text");
    expect(el.getAttribute("data-variant")).toBe("caption");
  });
});

// ─── Event handlers ─────────────────────────────────────────────────

describe("Text: event handlers", () => {
  it("handles onClick", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Text data-testid="click" onClick={handler}>
        Click me
      </Text>,
    );
    await user.click(screen.getByTestId("click"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles onMouseEnter", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Text data-testid="hover" onMouseEnter={handler} />);
    await user.hover(screen.getByTestId("hover"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── SSR rendering ──────────────────────────────────────────────────

describe("Text: SSR", () => {
  it("renders default span to string", () => {
    const html = renderToString(<Text>Hello</Text>);
    expect(html).toContain("<span");
    expect(html).toContain("Hello");
    expect(html).toContain('data-kui-component="Text"');
  });

  it("renders paragraph to string", () => {
    const html = renderToString(<Text as="p">Paragraph</Text>);
    expect(html).toContain("<p");
    expect(html).toContain("Paragraph");
  });

  it("renders label with htmlFor to string", () => {
    const html = renderToString(
      <Text as="label" htmlFor="field">
        Label
      </Text>,
    );
    expect(html).toContain("<label");
    expect(html).toContain('for="field"');
    expect(html).toContain("Label");
  });

  it("renders heading to string", () => {
    const html = renderToString(<Text as="h2">Section Title</Text>);
    expect(html).toContain("<h2");
    expect(html).toContain("Section Title");
  });

  it("renders custom component to string", () => {
    const html = renderToString(
      <Text as={RouterLink} to="/page">
        Link
      </Text>,
    );
    expect(html).toContain("<a");
    expect(html).toContain('href="/page"');
    expect(html).toContain("Link");
  });

  it("includes base class in SSR output", () => {
    const html = renderToString(<Text>Styled</Text>);
    expect(html).toContain("kui-text");
  });

  it("preserves ARIA attributes in SSR", () => {
    const html = renderToString(
      <Text role="status" aria-live="polite">
        Update
      </Text>,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
});

// ─── React Strict Mode ──────────────────────────────────────────────

describe("Text: React Strict Mode", () => {
  it("renders without warnings in StrictMode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Text data-testid="strict">OK</Text>
      </StrictMode>,
    );
    expect(screen.getByTestId("strict").textContent).toBe("OK");
    const reactWarnings = spy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Warning:"),
    );
    expect(reactWarnings).toHaveLength(0);
    spy.mockRestore();
  });

  it("ref works in StrictMode", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <StrictMode>
        <Text ref={ref} data-testid="s-ref" />
      </StrictMode>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("events fire once in StrictMode", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <StrictMode>
        <Text data-testid="s-evt" onClick={handler}>
          Click
        </Text>
      </StrictMode>,
    );
    await user.click(screen.getByTestId("s-evt"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("polymorphic as works in StrictMode", () => {
    render(
      <StrictMode>
        <Text as="p" data-testid="s-poly">
          Paragraph
        </Text>
      </StrictMode>,
    );
    expect(screen.getByTestId("s-poly").tagName).toBe("P");
  });
});

// ─── Type-level tests ───────────────────────────────────────────────

type TextOwnProps = Record<string, unknown>;

describe("Text: type inference", () => {
  it("span props are valid by default", () => {
    const props: PolymorphicProps<TextOwnProps, "span"> = {
      id: "text-1",
      className: "body",
    };
    expect(props["id"]).toBe("text-1");
  });

  it("label props valid with as=label including htmlFor", () => {
    const props: PolymorphicProps<TextOwnProps, "label"> = {
      as: "label",
      htmlFor: "email",
    };
    expect(props["htmlFor"]).toBe("email");
  });

  it("heading props valid with as=h1", () => {
    const props: PolymorphicProps<TextOwnProps, "h1"> = {
      as: "h1",
      id: "page-title",
    };
    expect(props["id"]).toBe("page-title");
  });

  it("paragraph props valid with as=p", () => {
    const props: PolymorphicProps<TextOwnProps, "p"> = {
      as: "p",
      className: "body-text",
    };
    expect(props["className"]).toBe("body-text");
  });

  it("custom component props valid", () => {
    const props: PolymorphicProps<TextOwnProps, typeof RouterLink> = {
      as: RouterLink,
      to: "/dashboard",
    };
    expect(props["to"]).toBe("/dashboard");
  });

  it("PolymorphicProps infers label-specific props", () => {
    type LabelProps = PolymorphicProps<TextOwnProps, "label">;
    type TimeProps = PolymorphicProps<TextOwnProps, "time">;
    expectTypeOf<LabelProps>().toHaveProperty("htmlFor");
    expectTypeOf<TimeProps>().toHaveProperty("dateTime");
  });
});

// ─── Composition architecture validation ────────────────────────────

describe("Text: composition architecture", () => {
  it("uses mergeProps for className composition", () => {
    render(<Text data-testid="merge" className="consumer-text" />);
    expect(screen.getByTestId("merge").className).toContain("consumer-text");
  });

  it("consumer style merges with base class", () => {
    render(<Text data-testid="style-merge" style={{ letterSpacing: "0.05em" }} />);
    const el = screen.getByTestId("style-merge");
    expect(el.className).toContain("kui-text");
    expect(el.style.letterSpacing).toBe("0.05em");
  });

  it("displayName is set for DevTools", () => {
    expect(Text.displayName).toBe("Text");
  });
});
