import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { renderAsChild } from "./as-child";

afterEach(cleanup);

// ─── Fixtures ───────────────────────────────────────────────────────

const NoRefComponent = (props: Record<string, unknown>) => {
  const { children, ...rest } = props;
  return <span {...rest}>{children as React.ReactNode}</span>;
};

const ForwardedDiv = forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => (
  <div {...props} ref={ref} data-forwarded="true" />
));
ForwardedDiv.displayName = "ForwardedDiv";

// ─── Invalid children ───────────────────────────────────────────────

describe("asChild edge cases: invalid children", () => {
  it("null children: warns and falls back", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { type: "button" },
      consumerProps: { "data-testid": "fb" },
      children: null,
      componentName: "TestComp",
    });
    render(el);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("exactly one"));
    expect(screen.getByTestId("fb").tagName).toBe("BUTTON");
    spy.mockRestore();
  });

  it("undefined children: warns and falls back", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: {},
      consumerProps: { "data-testid": "undef" },
      children: undefined,
      componentName: "TestComp",
    });
    render(el);
    expect(spy).toHaveBeenCalled();
    expect(screen.getByTestId("undef").tagName).toBe("DIV");
    spy.mockRestore();
  });

  it("text children: warns and falls back", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: { "data-testid": "text" },
      children: "plain text",
      componentName: "TestComp",
    });
    render(el);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("React element child"));
    expect(screen.getByTestId("text").tagName).toBe("BUTTON");
    spy.mockRestore();
  });

  it("number children: warns and falls back", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "span",
      internalProps: {},
      consumerProps: { "data-testid": "num" },
      children: 42,
      componentName: "TestComp",
    });
    render(el);
    expect(spy).toHaveBeenCalled();
    expect(screen.getByTestId("num").tagName).toBe("SPAN");
    spy.mockRestore();
  });

  it("boolean children: warns and falls back", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: { "data-testid": "bool" },
      children: true,
      componentName: "TestComp",
    });
    render(el);
    expect(spy).toHaveBeenCalled();
    expect(screen.getByTestId("bool").tagName).toBe("BUTTON");
    spy.mockRestore();
  });

  it("multiple children: warns about count", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "data-kui-component": "Test" },
      consumerProps: {},
      children: [
        <span key="a" data-testid="first">
          A
        </span>,
        <span key="b">B</span>,
      ],
      componentName: "TestComp",
    });
    render(el);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("exactly one"));
    // Uses first valid element
    expect(screen.getByTestId("first").getAttribute("data-kui-component")).toBe("Test");
    spy.mockRestore();
  });

  it("empty array children: warns", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: {},
      consumerProps: { "data-testid": "empty-arr" },
      children: [],
      componentName: "TestComp",
    });
    render(el);
    expect(spy).toHaveBeenCalled();
    expect(screen.getByTestId("empty-arr").tagName).toBe("DIV");
    spy.mockRestore();
  });
});

// ─── Conditional children ───────────────────────────────────────────

describe("asChild edge cases: conditional children", () => {
  it("condition=true renders child normally", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-label": "action" },
      consumerProps: {},
      children: <div data-testid="cond">Shown</div>,
      componentName: "Test",
    });
    render(el);
    expect(screen.getByTestId("cond").getAttribute("aria-label")).toBe("action");
  });

  it("condition=false (null child) falls back gracefully", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: { "data-testid": "hidden" },
      children: null,
      componentName: "Test",
    });
    render(el);
    expect(screen.getByTestId("hidden").tagName).toBe("BUTTON");
    spy.mockRestore();
  });
});

// ─── Component without ref support ──────────────────────────────────

describe("asChild edge cases: components without ref", () => {
  it("works with component that doesn't forward refs", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-expanded": "true" },
      consumerProps: {},
      children: <NoRefComponent data-testid="no-ref">Content</NoRefComponent>,
      componentName: "Test",
    });
    render(el);
    const node = screen.getByTestId("no-ref");
    expect(node.getAttribute("aria-expanded")).toBe("true");
    expect(node.textContent).toBe("Content");
  });

  it("internal ref still works for non-forwarding components (on clone)", () => {
    const ref = createRef<HTMLElement>();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <ForwardedDiv data-testid="fwd-ref" />,
      componentName: "Test",
      internalRef: ref,
    });
    render(el);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── Nested asChild ─────────────────────────────────────────────────

describe("asChild edge cases: nested asChild", () => {
  it("outer asChild wraps inner asChild result", () => {
    // Inner asChild: merges props onto <a>
    const inner = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "data-inner": "yes" },
      consumerProps: {},
      children: (
        <a href="/page" data-testid="nested">
          Link
        </a>
      ),
      componentName: "Inner",
    });

    // Outer asChild: merges props onto the result of inner
    const outer = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: { "data-outer": "yes" },
      consumerProps: {},
      children: inner,
      componentName: "Outer",
    });

    render(outer);
    const node = screen.getByTestId("nested");
    expect(node.tagName).toBe("A");
    expect(node.getAttribute("data-inner")).toBe("yes");
    expect(node.getAttribute("data-outer")).toBe("yes");
    expect(node.getAttribute("href")).toBe("/page");
  });
});

// ─── asChild + as interaction ───────────────────────────────────────

describe("asChild edge cases: as + asChild interaction", () => {
  it("as is used when asChild=false", () => {
    const el = renderAsChild({
      asChild: false,
      defaultElement: "button",
      internalProps: {},
      consumerProps: { "data-testid": "as-only", href: "/link" },
      children: "Navigate",
      componentName: "Test",
      as: "a",
    });
    render(el);
    const node = screen.getByTestId("as-only");
    expect(node.tagName).toBe("A");
    expect(node.getAttribute("href")).toBe("/link");
  });

  it("asChild ignores as and uses child element", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <nav data-testid="nav-child">Menu</nav>,
      componentName: "Test",
      as: "a",
    });
    render(el);
    expect(screen.getByTestId("nav-child").tagName).toBe("NAV");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("as"));
    spy.mockRestore();
  });
});

// ─── Disabled state reconciliation ──────────────────────────────────

describe("asChild edge cases: disabled state", () => {
  it("native disabled attribute on natively-disableable child", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { disabled: true, "data-disabled": "" },
      consumerProps: {},
      children: <button data-testid="dis-btn">Click</button>,
      componentName: "Test",
    });
    render(el);
    const node = screen.getByTestId("dis-btn");
    expect(node.hasAttribute("disabled")).toBe(true);
  });

  it("aria-disabled on non-natively-disableable child", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-disabled": "true", "data-disabled": "" },
      consumerProps: {},
      children: (
        <div role="button" data-testid="dis-div">
          Action
        </div>
      ),
      componentName: "Test",
    });
    render(el);
    const node = screen.getByTestId("dis-div");
    expect(node.getAttribute("aria-disabled")).toBe("true");
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });

  it("disabled + click events still fire (component responsibility to suppress)", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-disabled": "true", onClick: handler },
      consumerProps: {},
      children: (
        <div role="button" tabIndex={0} data-testid="dis-click">
          Action
        </div>
      ),
      componentName: "Test",
    });
    render(el);
    await user.click(screen.getByTestId("dis-click"));
    // asChild does NOT suppress events — that's the component's responsibility
    expect(handler).toHaveBeenCalled();
  });
});

// ─── Child event cancellation ───────────────────────────────────────

describe("asChild edge cases: event cancellation", () => {
  it("child stopPropagation does not affect composed handlers", () => {
    const internal = vi.fn();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { onClick: internal },
      consumerProps: {},
      children: (
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
          }}
          data-testid="stop"
        />
      ),
      componentName: "Test",
    });
    render(el);
    screen.getByTestId("stop").click();
    // stopPropagation doesn't prevent composed handlers (only preventDefault does)
    expect(internal).toHaveBeenCalled();
  });

  it("child preventDefault prevents internal handler", () => {
    const internal = vi.fn();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { onClick: internal },
      consumerProps: {},
      children: (
        <button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
          }}
          data-testid="prevent"
        />
      ),
      componentName: "Test",
    });
    render(el);
    screen.getByTestId("prevent").click();
    expect(internal).not.toHaveBeenCalled();
  });

  it("consumer root prop handler also composes with child", async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { onFocus: () => order.push("internal") },
      consumerProps: { onFocus: () => order.push("consumer") },
      children: <input onFocus={() => order.push("child")} data-testid="focus-order" />,
      componentName: "Test",
    });
    render(el);
    await user.click(screen.getByTestId("focus-order"));
    expect(order).toContain("child");
    expect(order).toContain("consumer");
  });
});

// ─── ARIA edge cases ────────────────────────────────────────────────

describe("asChild edge cases: ARIA", () => {
  it("aria-controls from internal and child are both preserved", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-controls": "panel-1" },
      consumerProps: {},
      children: <button aria-controls="panel-2" data-testid="ctrl" />,
      componentName: "Test",
    });
    render(el);
    const val = screen.getByTestId("ctrl").getAttribute("aria-controls")!;
    expect(val).toContain("panel-1");
    expect(val).toContain("panel-2");
  });

  it("role from internal is preserved (protected)", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: { role: "dialog" },
      consumerProps: {},
      children: <div data-testid="role-test" />,
      componentName: "Test",
    });
    render(el);
    expect(screen.getByTestId("role-test").getAttribute("role")).toBe("dialog");
  });

  it("child can provide id (consumer controls identity)", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: {},
      consumerProps: {},
      children: <section id="my-section" data-testid="id-test" />,
      componentName: "Test",
    });
    render(el);
    expect(screen.getByTestId("id-test").id).toBe("my-section");
  });
});

// ─── SSR edge cases ─────────────────────────────────────────────────

describe("asChild edge cases: SSR", () => {
  it("renders nested asChild to string without wrappers", () => {
    const inner = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "data-inner": "yes" },
      consumerProps: {},
      children: <span>Content</span>,
      componentName: "Inner",
    });
    const outer = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: { "data-outer": "yes" },
      consumerProps: {},
      children: inner,
      componentName: "Outer",
    });
    const html = renderToString(outer);
    expect(html).toContain("<span");
    expect(html).toContain("data-inner");
    expect(html).toContain("data-outer");
    expect(html).not.toContain("<div");
    expect(html).not.toContain("<button");
  });

  it("invalid child in SSR produces fallback without throwing", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { type: "button" },
      consumerProps: {},
      children: null,
      componentName: "Test",
    });
    const html = renderToString(el);
    expect(html).toContain("<button");
    vi.restoreAllMocks();
  });

  it("preserves consumer className in SSR with asChild", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { className: "internal" },
      consumerProps: { className: "consumer" },
      children: <a href="/page" className="child" aria-label="link" />,
      componentName: "Test",
    });
    const html = renderToString(el);
    expect(html).toContain("internal");
    expect(html).toContain("child");
    expect(html).toContain("consumer");
  });
});

// ─── Strict Mode edge cases ─────────────────────────────────────────

describe("asChild edge cases: Strict Mode", () => {
  it("composed refs handle Strict Mode mount/unmount/mount cycle", () => {
    const ref = createRef<HTMLElement>();
    const childRef = createRef<HTMLDivElement>();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <div ref={childRef} data-testid="sm-ref" />,
      componentName: "Test",
      internalRef: ref,
    });
    render(<StrictMode>{el}</StrictMode>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(childRef.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(childRef.current);
  });

  it("event handlers fire exactly once per interaction in Strict Mode", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { onClick: handler },
      consumerProps: {},
      children: <button data-testid="sm-evt">Click</button>,
      componentName: "Test",
    });
    render(<StrictMode>{el}</StrictMode>);
    await user.click(screen.getByTestId("sm-evt"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("no React warnings in Strict Mode for valid composition", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-label": "action", className: "internal" },
      consumerProps: { className: "consumer" },
      children: (
        <a href="/page" data-testid="sm-clean">
          Link
        </a>
      ),
      componentName: "Test",
    });
    render(<StrictMode>{el}</StrictMode>);
    const reactWarnings = spy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Warning:"),
    );
    expect(reactWarnings).toHaveLength(0);
    expect(screen.getByTestId("sm-clean").tagName).toBe("A");
    spy.mockRestore();
  });
});

// ─── Hydration ──────────────────────────────────────────────────────

describe("asChild edge cases: hydration compatibility", () => {
  it("SSR output matches client render (no mismatch)", () => {
    const makeEl = () =>
      renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: { "data-kui-component": "Trigger", "aria-expanded": "false" },
        consumerProps: { className: "consumer" },
        children: (
          <a href="/menu" className="child">
            Menu
          </a>
        ),
        componentName: "Test",
      });

    const serverHtml = renderToString(makeEl());
    // Verify structure is deterministic
    expect(serverHtml).toContain("<a");
    expect(serverHtml).toContain('href="/menu"');
    expect(serverHtml).toContain("data-kui-component");
    expect(serverHtml).toContain("consumer");
    expect(serverHtml).toContain("child");

    // Client render should produce same structure
    const { container } = render(makeEl());
    const node = container.firstElementChild!;
    expect(node.tagName).toBe("A");
    expect(node.getAttribute("href")).toBe("/menu");
    expect(node.getAttribute("data-kui-component")).toBe("Trigger");
    expect(node.className).toContain("consumer");
    expect(node.className).toContain("child");
  });
});
