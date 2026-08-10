import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { createComponent } from "./create-component";
import type { PolymorphicComponent } from "./polymorphic-types";

afterEach(cleanup);

// ─── Simple component (Box-like) ────────────────────────────────────

const SimpleBox = createComponent<Record<string, unknown>, "div">({
  displayName: "SimpleBox",
  defaultElement: "div",
  useComponent: ({ ref }) => ({
    rootProps: { ref },
  }),
});

describe("createComponent: simple component", () => {
  it("renders default element", () => {
    render(<SimpleBox data-testid="box" />);
    expect(screen.getByTestId("box").tagName).toBe("DIV");
  });

  it("sets displayName", () => {
    expect(SimpleBox.displayName).toBe("SimpleBox");
  });

  it("adds data-kui-component metadata", () => {
    render(<SimpleBox data-testid="box" />);
    expect(screen.getByTestId("box").getAttribute("data-kui-component")).toBe("SimpleBox");
  });

  it("renders children", () => {
    render(<SimpleBox data-testid="box">Hello</SimpleBox>);
    expect(screen.getByTestId("box").textContent).toBe("Hello");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<SimpleBox ref={ref} data-testid="box" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("supports polymorphic as", () => {
    render(
      <SimpleBox as="section" data-testid="box">
        Content
      </SimpleBox>,
    );
    expect(screen.getByTestId("box").tagName).toBe("SECTION");
  });

  it("merges consumer className", () => {
    render(<SimpleBox data-testid="box" className="custom" />);
    expect(screen.getByTestId("box").className).toContain("custom");
  });

  it("merges consumer style", () => {
    render(<SimpleBox data-testid="box" style={{ color: "red" }} />);
    expect(screen.getByTestId("box").style.color).toBe("red");
  });

  it("passes consumer ARIA attributes", () => {
    render(<SimpleBox data-testid="box" aria-label="Test" />);
    expect(screen.getByTestId("box").getAttribute("aria-label")).toBe("Test");
  });

  it("passes consumer data attributes", () => {
    render(<SimpleBox data-testid="box" data-custom="val" />);
    expect(screen.getByTestId("box").getAttribute("data-custom")).toBe("val");
  });
});

// ─── Component with own props ───────────────────────────────────────

interface TextOwnProps {
  variant?: "body" | "caption";
}

const TextComp = createComponent<TextOwnProps, "span">({
  displayName: "TextComp",
  defaultElement: "span",
  useComponent: ({ props, ref }) => ({
    rootProps: {
      ref,
      "data-variant": props.variant ?? "body",
    },
  }),
});

describe("createComponent: own props", () => {
  it("passes own props to useComponent", () => {
    render(<TextComp data-testid="text" variant="caption" />);
    expect(screen.getByTestId("text").getAttribute("data-variant")).toBe("caption");
  });

  it("uses default when own prop not provided", () => {
    render(<TextComp data-testid="text" />);
    expect(screen.getByTestId("text").getAttribute("data-variant")).toBe("body");
  });
});

// ─── Component state ────────────────────────────────────────────────

interface StatefulProps {
  disabled?: boolean;
  loading?: boolean;
}

const StatefulComp = createComponent<StatefulProps, "button">({
  displayName: "StatefulComp",
  defaultElement: "button",
  useComponent: ({ props, ref }) => {
    const disabled = props.disabled === true;
    const loading = props.loading === true;
    return {
      rootProps: { ref },
      state: {
        disabled,
        loading,
        dataState: loading ? "loading" : disabled ? "disabled" : "default",
      },
    };
  },
});

describe("createComponent: state", () => {
  it("generates data-state from ComponentState", () => {
    render(<StatefulComp data-testid="btn">Click</StatefulComp>);
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("default");
  });

  it("generates data-disabled when disabled", () => {
    render(
      <StatefulComp data-testid="btn" disabled>
        Click
      </StatefulComp>,
    );
    expect(screen.getByTestId("btn").hasAttribute("data-disabled")).toBe(true);
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("disabled");
  });

  it("generates data-loading when loading", () => {
    render(
      <StatefulComp data-testid="btn" loading>
        Click
      </StatefulComp>,
    );
    expect(screen.getByTestId("btn").hasAttribute("data-loading")).toBe(true);
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("loading");
  });
});

// ─── Accessibility props ────────────────────────────────────────────

const A11yComp = createComponent<{ expanded?: boolean }, "button">({
  displayName: "A11yComp",
  defaultElement: "button",
  useComponent: ({ props, ref }) => ({
    rootProps: { ref },
    accessibilityProps: {
      "aria-expanded": props.expanded === true ? "true" : "false",
      type: "button",
    },
  }),
});

describe("createComponent: accessibility", () => {
  it("applies accessibility props", () => {
    render(<A11yComp data-testid="a11y" expanded />);
    expect(screen.getByTestId("a11y").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("a11y").getAttribute("type")).toBe("button");
  });

  it("consumer ARIA overrides internal", () => {
    render(<A11yComp data-testid="a11y" aria-expanded="false" />);
    expect(screen.getByTestId("a11y").getAttribute("aria-expanded")).toBe("false");
  });
});

// ─── Event composition ──────────────────────────────────────────────

const EventComp = createComponent<Record<string, unknown>, "button">({
  displayName: "EventComp",
  defaultElement: "button",
  useComponent: ({ props, ref }) => ({
    rootProps: {
      ref,
      onClick: () => {
        (props as Record<string, unknown>)["_internal_clicked"] = true;
      },
    },
  }),
});

describe("createComponent: events", () => {
  it("composes consumer onClick with internal", async () => {
    const user = userEvent.setup();
    const consumer = vi.fn();
    render(
      <EventComp data-testid="evt" onClick={consumer}>
        Click
      </EventComp>,
    );
    await user.click(screen.getByTestId("evt"));
    expect(consumer).toHaveBeenCalledTimes(1);
  });

  it("consumer can cancel internal via preventDefault", async () => {
    const user = userEvent.setup();
    const submitted = vi.fn();
    render(
      <form onSubmit={submitted}>
        <EventComp
          data-testid="evt"
          type="submit"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
          }}
        >
          Submit
        </EventComp>
      </form>,
    );
    await user.click(screen.getByTestId("evt"));
    expect(submitted).not.toHaveBeenCalled();
  });
});

// ─── asChild support ────────────────────────────────────────────────

const AsChildComp = createComponent<Record<string, unknown>, "button">({
  displayName: "AsChildComp",
  defaultElement: "button",
  useComponent: ({ ref }) => ({
    rootProps: { ref, "aria-expanded": "true" },
  }),
});

describe("createComponent: asChild", () => {
  it("delegates to child when asChild=true", () => {
    render(
      <AsChildComp asChild>
        <a href="/page" data-testid="child">
          Link
        </a>
      </AsChildComp>,
    );
    const node = screen.getByTestId("child");
    expect(node.tagName).toBe("A");
    expect(node.getAttribute("href")).toBe("/page");
    expect(node.getAttribute("aria-expanded")).toBe("true");
    expect(node.getAttribute("data-kui-component")).toBe("AsChildComp");
  });

  it("no wrapper element with asChild", () => {
    const { container } = render(
      <AsChildComp asChild>
        <span data-testid="only">Only</span>
      </AsChildComp>,
    );
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });

  it("renders normally when asChild=false", () => {
    render(<AsChildComp data-testid="normal">Content</AsChildComp>);
    expect(screen.getByTestId("normal").tagName).toBe("BUTTON");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("createComponent: refs", () => {
  it("forwards ref to native element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <StatefulComp ref={ref} data-testid="ref">
        Click
      </StatefulComp>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards ref to polymorphic element", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <SimpleBox as="a" ref={ref} href="/page" data-testid="ref">
        Link
      </SimpleBox>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("callback ref receives element", () => {
    let captured: HTMLElement | null = null;
    render(
      <SimpleBox
        ref={(el: HTMLElement | null) => {
          captured = el;
        }}
        data-testid="cb"
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it("ref works with asChild", () => {
    const ref = createRef<HTMLElement>();
    render(
      <AsChildComp asChild ref={ref}>
        <span data-testid="as-ref" />
      </AsChildComp>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("createComponent: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(<SimpleBox className="ssr">Content</SimpleBox>);
    expect(html).toContain("<div");
    expect(html).toContain("ssr");
    expect(html).toContain("Content");
    expect(html).toContain('data-kui-component="SimpleBox"');
  });

  it("renders polymorphic element in SSR", () => {
    const html = renderToString(<SimpleBox as="section">Section</SimpleBox>);
    expect(html).toContain("<section");
  });

  it("renders state attributes in SSR", () => {
    const html = renderToString(<StatefulComp loading>Save</StatefulComp>);
    expect(html).toContain('data-state="loading"');
    expect(html).toContain("data-loading");
  });

  it("renders asChild in SSR", () => {
    const html = renderToString(
      <AsChildComp asChild>
        <a href="/link">Go</a>
      </AsChildComp>,
    );
    expect(html).toContain("<a");
    expect(html).toContain('href="/link"');
    expect(html).toContain("data-kui-component");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("createComponent: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <SimpleBox data-testid="strict">OK</SimpleBox>
      </StrictMode>,
    );
    expect(screen.getByTestId("strict").textContent).toBe("OK");
    const warnings = spy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });

  it("ref works in Strict Mode", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <StrictMode>
        <SimpleBox ref={ref} data-testid="s-ref" />
      </StrictMode>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("events fire once in Strict Mode", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <StrictMode>
        <SimpleBox as="button" data-testid="s-evt" onClick={handler}>
          Click
        </SimpleBox>
      </StrictMode>,
    );
    await user.click(screen.getByTestId("s-evt"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── Type inference ─────────────────────────────────────────────────

describe("createComponent: type inference", () => {
  it("returns PolymorphicComponent type", () => {
    expectTypeOf(SimpleBox).toExtend<PolymorphicComponent<Record<string, unknown>, "div">>();
  });

  it("preserves displayName on result", () => {
    expectTypeOf(SimpleBox).toHaveProperty("displayName");
  });

  it("factory output is callable", () => {
    expectTypeOf(SimpleBox).toBeCallableWith({ "data-testid": "x" });
  });
});
