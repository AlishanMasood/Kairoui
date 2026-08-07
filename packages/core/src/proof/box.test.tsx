import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Box } from "./box";
import type { PolymorphicProps } from "../composition/polymorphic-types";

afterEach(cleanup);

// ─── Custom component fixtures ──────────────────────────────────────

interface CustomLinkProps {
  to: string;
  children?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const CustomLink = forwardRef<HTMLAnchorElement, CustomLinkProps>((props, ref) => {
  const { to, children, ...rest } = props;
  return (
    <a {...rest} href={to} ref={ref} data-custom-link="true">
      {children}
    </a>
  );
});
CustomLink.displayName = "CustomLink";

const PlainComponent = (props: { label: string; "data-testid"?: string }) => (
  <span data-testid={props["data-testid"]}>{props.label}</span>
);

// ─── Default rendering ──────────────────────────────────────────────

describe("Box: default rendering", () => {
  it("renders as div by default", () => {
    render(<Box data-testid="box" />);
    expect(screen.getByTestId("box").tagName).toBe("DIV");
  });

  it("renders children", () => {
    render(<Box data-testid="box">Hello</Box>);
    expect(screen.getByTestId("box").textContent).toBe("Hello");
  });

  it("applies data-kui-component metadata", () => {
    render(<Box data-testid="box" />);
    expect(screen.getByTestId("box").getAttribute("data-kui-component")).toBe("Box");
  });

  it("applies className", () => {
    render(<Box data-testid="box" className="my-box" />);
    expect(screen.getByTestId("box").className).toContain("my-box");
  });

  it("applies style", () => {
    render(<Box data-testid="box" style={{ color: "red" }} />);
    expect(screen.getByTestId("box").style.color).toBe("red");
  });

  it("renders nested Box elements", () => {
    render(
      <Box data-testid="outer">
        <Box data-testid="inner">Nested</Box>
      </Box>,
    );
    expect(screen.getByTestId("outer").tagName).toBe("DIV");
    expect(screen.getByTestId("inner").tagName).toBe("DIV");
    expect(screen.getByTestId("inner").textContent).toBe("Nested");
  });
});

// ─── Polymorphic `as` with native elements ──────────────────────────

describe("Box: polymorphic native elements", () => {
  it("renders as section", () => {
    render(
      <Box as="section" data-testid="box">
        Content
      </Box>,
    );
    expect(screen.getByTestId("box").tagName).toBe("SECTION");
  });

  it("renders as a with href", () => {
    render(
      <Box as="a" href="/reports" data-testid="link">
        Reports
      </Box>,
    );
    const el = screen.getByTestId("link");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/reports");
  });

  it("renders as button with type", () => {
    render(
      <Box as="button" type="submit" data-testid="btn">
        Submit
      </Box>,
    );
    const el = screen.getByTestId("btn");
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("type")).toBe("submit");
  });

  it("renders as nav", () => {
    render(<Box as="nav" data-testid="nav" />);
    expect(screen.getByTestId("nav").tagName).toBe("NAV");
  });

  it("renders as article", () => {
    render(<Box as="article" data-testid="article" />);
    expect(screen.getByTestId("article").tagName).toBe("ARTICLE");
  });

  it("renders as input", () => {
    render(<Box as="input" type="text" data-testid="input" />);
    const el = screen.getByTestId("input");
    expect(el.tagName).toBe("INPUT");
    expect(el.getAttribute("type")).toBe("text");
  });
});

// ─── Polymorphic `as` with custom components ────────────────────────

describe("Box: polymorphic custom components", () => {
  it("renders as a custom forwardRef component", () => {
    render(
      <Box as={CustomLink} to="/reports" data-testid="cl">
        Reports
      </Box>,
    );
    const el = screen.getByTestId("cl");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/reports");
    expect(el.getAttribute("data-custom-link")).toBe("true");
    expect(el.textContent).toBe("Reports");
  });

  it("renders as a plain function component", () => {
    render(<Box as={PlainComponent} label="Test" data-testid="plain" />);
    expect(screen.getByTestId("plain").textContent).toBe("Test");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Box: ref forwarding", () => {
  it("forwards ref to div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Box ref={ref} data-testid="ref" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref to polymorphic element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Box as="button" ref={ref} data-testid="btn-ref" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards ref to anchor element", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Box as="a" ref={ref} href="#" data-testid="a-ref" />);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("forwards ref to custom forwardRef component", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Box as={CustomLink} ref={ref} to="/" data-testid="custom-ref" />);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("callback ref receives element", () => {
    let captured: HTMLElement | null = null;
    render(
      <Box
        ref={(el: HTMLElement | null) => {
          captured = el;
        }}
        data-testid="cb-ref"
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── ARIA attributes ────────────────────────────────────────────────

describe("Box: ARIA attributes", () => {
  it("passes aria-label", () => {
    render(<Box data-testid="aria" aria-label="Close" />);
    expect(screen.getByTestId("aria").getAttribute("aria-label")).toBe("Close");
  });

  it("passes aria-hidden", () => {
    render(<Box data-testid="hidden" aria-hidden="true" />);
    expect(screen.getByTestId("hidden").getAttribute("aria-hidden")).toBe("true");
  });

  it("passes aria-describedby", () => {
    render(<Box data-testid="desc" aria-describedby="hint" />);
    expect(screen.getByTestId("desc").getAttribute("aria-describedby")).toBe("hint");
  });

  it("passes role", () => {
    render(<Box data-testid="role" role="navigation" />);
    expect(screen.getByTestId("role").getAttribute("role")).toBe("navigation");
  });

  it("passes aria-expanded on button", () => {
    render(<Box as="button" data-testid="exp" aria-expanded="false" aria-controls="panel" />);
    const el = screen.getByTestId("exp");
    expect(el.getAttribute("aria-expanded")).toBe("false");
    expect(el.getAttribute("aria-controls")).toBe("panel");
  });
});

// ─── Data attributes ────────────────────────────────────────────────

describe("Box: data attributes", () => {
  it("passes data-* attributes", () => {
    render(<Box data-testid="data" data-state="open" />);
    expect(screen.getByTestId("data").getAttribute("data-state")).toBe("open");
  });

  it("preserves data-kui-component alongside consumer data-*", () => {
    render(<Box data-testid="both" data-custom="yes" />);
    const el = screen.getByTestId("both");
    expect(el.getAttribute("data-kui-component")).toBe("Box");
    expect(el.getAttribute("data-custom")).toBe("yes");
  });
});

// ─── Event handlers ─────────────────────────────────────────────────

describe("Box: event handlers", () => {
  it("handles onClick", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Box as="button" data-testid="click" onClick={handler} />);
    await user.click(screen.getByTestId("click"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles onFocus", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Box as="input" data-testid="focus" onFocus={handler} />);
    await user.click(screen.getByTestId("focus"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles onKeyDown", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Box as="input" data-testid="key" onKeyDown={handler} />);
    await user.type(screen.getByTestId("key"), "a");
    expect(handler).toHaveBeenCalled();
  });

  it("handles onMouseEnter", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Box data-testid="hover" onMouseEnter={handler} />);
    await user.hover(screen.getByTestId("hover"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── SSR rendering ──────────────────────────────────────────────────

describe("Box: SSR", () => {
  it("renders to valid HTML string", () => {
    const html = renderToString(<Box className="ssr-box">SSR content</Box>);
    expect(html).toContain("<div");
    expect(html).toContain("ssr-box");
    expect(html).toContain("SSR content");
    expect(html).toContain('data-kui-component="Box"');
  });

  it("renders polymorphic element in SSR", () => {
    const html = renderToString(
      <Box as="section" className="sec">
        Section
      </Box>,
    );
    expect(html).toContain("<section");
    expect(html).toContain("sec");
    expect(html).toContain("Section");
  });

  it("renders anchor with href in SSR", () => {
    const html = renderToString(
      <Box as="a" href="/page">
        Link
      </Box>,
    );
    expect(html).toContain("<a");
    expect(html).toContain('href="/page"');
    expect(html).toContain("Link");
  });

  it("renders custom component in SSR", () => {
    const html = renderToString(
      <Box as={CustomLink} to="/dash">
        Dashboard
      </Box>,
    );
    expect(html).toContain("<a");
    expect(html).toContain('href="/dash"');
    expect(html).toContain("Dashboard");
    expect(html).toContain("data-custom-link");
  });

  it("preserves ARIA in SSR", () => {
    const html = renderToString(
      <Box role="alert" aria-live="polite">
        Notice
      </Box>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="polite"');
  });
});

// ─── React Strict Mode ──────────────────────────────────────────────

describe("Box: React Strict Mode", () => {
  it("renders without warnings in StrictMode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Box data-testid="strict">OK</Box>
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
    const ref = createRef<HTMLDivElement>();
    render(
      <StrictMode>
        <Box ref={ref} data-testid="s-ref" />
      </StrictMode>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("events fire once in StrictMode", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <StrictMode>
        <Box as="button" onClick={handler} data-testid="s-evt">
          Click
        </Box>
      </StrictMode>,
    );
    await user.click(screen.getByTestId("s-evt"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("polymorphic as works in StrictMode", () => {
    render(
      <StrictMode>
        <Box as="nav" data-testid="s-poly">
          Nav
        </Box>
      </StrictMode>,
    );
    expect(screen.getByTestId("s-poly").tagName).toBe("NAV");
  });
});

// ─── Type-level tests ───────────────────────────────────────────────

// Matches Box's OwnProps: open record accepting any props from the target
type BoxOwnProps = Record<string, unknown>;

describe("Box: type inference", () => {
  it("default div props are valid", () => {
    const props: PolymorphicProps<BoxOwnProps, "div"> = {
      id: "test",
      className: "box",
      style: { display: "flex" },
      "aria-label": "test",
    };
    expect(props["id"]).toBe("test");
  });

  it("button props valid with as=button", () => {
    const props: PolymorphicProps<BoxOwnProps, "button"> = {
      as: "button",
      type: "submit",
      disabled: true,
    };
    expect(props["type"]).toBe("submit");
  });

  it("anchor props valid with as=a", () => {
    const props: PolymorphicProps<BoxOwnProps, "a"> = {
      as: "a",
      href: "/page",
      target: "_blank",
    };
    expect(props["href"]).toBe("/page");
  });

  it("custom component props valid with as=CustomComponent", () => {
    const props: PolymorphicProps<BoxOwnProps, typeof CustomLink> = {
      as: CustomLink,
      to: "/dashboard",
    };
    expect(props["to"]).toBe("/dashboard");
  });

  it("PolymorphicProps infers correct types", () => {
    type DivProps = PolymorphicProps<BoxOwnProps, "div">;
    type AnchorProps = PolymorphicProps<BoxOwnProps, "a">;

    expectTypeOf<DivProps>().toHaveProperty("className");
    expectTypeOf<DivProps>().toHaveProperty("style");
    expectTypeOf<AnchorProps>().toHaveProperty("href");
    expectTypeOf<AnchorProps>().toHaveProperty("target");
  });
});

// ─── Composition architecture validation ────────────────────────────

describe("Box: composition architecture", () => {
  it("uses mergeProps for className composition", () => {
    render(<Box data-testid="merge" className="consumer" />);
    const el = screen.getByTestId("merge");
    expect(el.className).toContain("consumer");
  });

  it("uses mergeProps for style composition", () => {
    render(<Box data-testid="style" style={{ padding: "8px" }} />);
    expect(screen.getByTestId("style").style.padding).toBe("8px");
  });

  it("internal props are merged with consumer props", () => {
    render(<Box data-testid="merged" data-extra="val" />);
    const el = screen.getByTestId("merged");
    expect(el.getAttribute("data-kui-component")).toBe("Box");
    expect(el.getAttribute("data-extra")).toBe("val");
  });

  it("displayName is set for DevTools", () => {
    expect(Box.displayName).toBe("Box");
  });
});
