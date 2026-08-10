import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import type { ReactNode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { renderAsChild } from "./as-child";

afterEach(cleanup);

// ─── Fixtures ───────────────────────────────────────────────────────

const ForwardedButton = forwardRef<HTMLButtonElement, Record<string, unknown>>((props, ref) => (
  <button {...props} ref={ref} data-forwarded="true" />
));
ForwardedButton.displayName = "ForwardedButton";

const CustomCard = (props: { title: string; children?: ReactNode; "data-testid"?: string }) => (
  <div data-testid={props["data-testid"]} data-card-title={props.title}>
    {props.children}
  </div>
);

// ─── asChild with native elements ──────────────────────────────────

describe("asChild: native elements", () => {
  it("renders child element with internal props merged", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-expanded": "true", "data-kui-component": "Trigger" },
      consumerProps: {},
      children: (
        <a href="/page" data-testid="child">
          Link
        </a>
      ),
      componentName: "Trigger",
    });
    render(el);
    const node = screen.getByTestId("child");
    expect(node.tagName).toBe("A");
    expect(node.getAttribute("href")).toBe("/page");
    expect(node.getAttribute("aria-expanded")).toBe("true");
    expect(node.getAttribute("data-kui-component")).toBe("Trigger");
    expect(node.textContent).toBe("Link");
  });

  it("does not introduce wrapper elements", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <span data-testid="only">Only child</span>,
      componentName: "Test",
    });
    const { container } = render(el);
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });

  it("preserves child's native semantics", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: {},
      consumerProps: {},
      children: <input type="email" placeholder="user@test.com" data-testid="input" />,
      componentName: "Test",
    });
    render(el);
    const node = screen.getByTestId("input");
    expect(node.tagName).toBe("INPUT");
    expect(node.getAttribute("type")).toBe("email");
    expect(node.getAttribute("placeholder")).toBe("user@test.com");
  });
});

// ─── asChild with custom components ─────────────────────────────────

describe("asChild: custom components", () => {
  it("works with ForwardRef components", () => {
    const ref = createRef<HTMLButtonElement>();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: { "aria-label": "Action" },
      consumerProps: {},
      children: <ForwardedButton data-testid="fwd" />,
      componentName: "Test",
      internalRef: ref,
    });
    render(el);
    const node = screen.getByTestId("fwd");
    expect(node.getAttribute("data-forwarded")).toBe("true");
    expect(node.getAttribute("aria-label")).toBe("Action");
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("works with plain function components", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: (
        <CustomCard title="Hello" data-testid="card">
          Content
        </CustomCard>
      ),
      componentName: "Test",
    });
    render(el);
    expect(screen.getByTestId("card").getAttribute("data-card-title")).toBe("Hello");
  });
});

// ─── Ref composition ────────────────────────────────────────────────

describe("asChild: ref composition", () => {
  it("composes internal ref + child ref", () => {
    const internalRef = createRef<HTMLElement>();
    const childRef = createRef<HTMLDivElement>();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <div ref={childRef} data-testid="ref-test" />,
      componentName: "Test",
      internalRef,
    });
    render(el);
    expect(internalRef.current).toBeInstanceOf(HTMLDivElement);
    expect(childRef.current).toBeInstanceOf(HTMLDivElement);
    expect(internalRef.current).toBe(childRef.current);
  });

  it("composes internal ref + consumer forwarded ref", () => {
    const internalRef = createRef<HTMLElement>();
    const forwardedRef = createRef<HTMLElement>();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: { ref: forwardedRef },
      children: <div data-testid="fwd-ref" />,
      componentName: "Test",
      internalRef,
    });
    render(el);
    expect(internalRef.current).toBeInstanceOf(HTMLDivElement);
    expect(forwardedRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("callback refs receive element", () => {
    let captured: HTMLElement | null = null;
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <span data-testid="cb-ref" />,
      componentName: "Test",
      internalRef: (node: unknown) => {
        captured = node as HTMLElement | null;
      },
    });
    render(el);
    expect(captured).toBeInstanceOf(HTMLSpanElement);
  });
});

// ─── Event composition ──────────────────────────────────────────────

describe("asChild: event composition", () => {
  it("child handler runs before internal handler", () => {
    const order: string[] = [];
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { onClick: () => order.push("internal") },
      consumerProps: {},
      children: <button onClick={() => order.push("child")} data-testid="evt" />,
      componentName: "Test",
    });
    render(el);
    screen.getByTestId("evt").click();
    expect(order).toEqual(["child", "internal"]);
  });

  it("child can cancel internal via preventDefault", () => {
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
          data-testid="cancel"
        />
      ),
      componentName: "Test",
    });
    render(el);
    screen.getByTestId("cancel").click();
    expect(internal).not.toHaveBeenCalled();
  });

  it("consumer root props handler also composes", () => {
    const order: string[] = [];
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { onClick: () => order.push("internal") },
      consumerProps: { onClick: () => order.push("consumer") },
      children: <button onClick={() => order.push("child")} data-testid="three" />,
      componentName: "Test",
    });
    render(el);
    screen.getByTestId("three").click();
    expect(order).toContain("child");
    expect(order).toContain("consumer");
  });

  it("composes keyboard events", async () => {
    const user = userEvent.setup();
    const internal = vi.fn();
    const child = vi.fn();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: { onKeyDown: internal },
      consumerProps: {},
      children: <input onKeyDown={child} data-testid="kbd" />,
      componentName: "Test",
    });
    render(el);
    await user.type(screen.getByTestId("kbd"), "a");
    expect(child).toHaveBeenCalled();
    expect(internal).toHaveBeenCalled();
  });
});

// ─── className and style merging ────────────────────────────────────

describe("asChild: className and style", () => {
  it("merges className from all layers", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { className: "internal" },
      consumerProps: { className: "consumer" },
      children: <span className="child" data-testid="cls" />,
      componentName: "Test",
    });
    render(el);
    const cls = screen.getByTestId("cls").className;
    expect(cls).toContain("internal");
    expect(cls).toContain("child");
    expect(cls).toContain("consumer");
  });

  it("merges style objects (child per-property wins over internal)", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { style: { color: "red", padding: "8px" } },
      consumerProps: {},
      children: <div style={{ color: "blue" }} data-testid="sty" />,
      componentName: "Test",
    });
    render(el);
    const node = screen.getByTestId("sty");
    expect(node.style.color).toBe("blue");
    expect(node.style.padding).toBe("8px");
  });
});

// ─── ARIA composition ───────────────────────────────────────────────

describe("asChild: ARIA", () => {
  it("reconciles aria-labelledby (both preserved)", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-labelledby": "internal-label" },
      consumerProps: {},
      children: <div aria-labelledby="child-label" data-testid="aria" />,
      componentName: "Test",
    });
    render(el);
    const val = screen.getByTestId("aria").getAttribute("aria-labelledby")!;
    expect(val).toContain("internal-label");
    expect(val).toContain("child-label");
  });

  it("child scalar ARIA overrides internal", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-label": "internal" },
      consumerProps: {},
      children: <div aria-label="child-label" data-testid="scalar" />,
      componentName: "Test",
    });
    render(el);
    expect(screen.getByTestId("scalar").getAttribute("aria-label")).toBe("child-label");
  });

  it("preserves aria-describedby from both layers", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-describedby": "hint-a" },
      consumerProps: {},
      children: <div aria-describedby="hint-b" data-testid="desc" />,
      componentName: "Test",
    });
    render(el);
    const val = screen.getByTestId("desc").getAttribute("aria-describedby")!;
    expect(val).toContain("hint-a");
    expect(val).toContain("hint-b");
  });
});

// ─── Data attributes ────────────────────────────────────────────────

describe("asChild: data attributes", () => {
  it("child data-* attributes are preserved", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "data-kui-component": "Trigger", "data-state": "open" },
      consumerProps: {},
      children: <div data-custom="mine" data-testid="data" />,
      componentName: "Test",
    });
    render(el);
    const node = screen.getByTestId("data");
    expect(node.getAttribute("data-kui-component")).toBe("Trigger");
    expect(node.getAttribute("data-state")).toBe("open");
    expect(node.getAttribute("data-custom")).toBe("mine");
  });

  it("child data-* overrides internal per-key", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "data-state": "closed" },
      consumerProps: {},
      children: <div data-state="open" data-testid="override" />,
      componentName: "Test",
    });
    render(el);
    expect(screen.getByTestId("override").getAttribute("data-state")).toBe("open");
  });
});

// ─── as + asChild mutual exclusivity ────────────────────────────────

describe("asChild: as + asChild interaction", () => {
  it("warns when both as and asChild are provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <span data-testid="both" />,
      componentName: "MyComp",
      as: "a",
    });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Both `as` and `asChild` were provided"),
    );
    spy.mockRestore();
  });

  it("asChild takes precedence over as", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <span data-testid="prec">Child wins</span>,
      componentName: "Test",
      as: "a",
    });
    render(el);
    expect(screen.getByTestId("prec").tagName).toBe("SPAN");
    vi.restoreAllMocks();
  });

  it("as prop works when asChild is false", () => {
    const el = renderAsChild({
      asChild: false,
      defaultElement: "button",
      internalProps: {},
      consumerProps: { "data-testid": "as-only", href: "/" },
      children: "Link",
      componentName: "Test",
      as: "a",
    });
    render(el);
    const node = screen.getByTestId("as-only");
    expect(node.tagName).toBe("A");
    expect(node.getAttribute("href")).toBe("/");
  });
});

// ─── Disabled state ─────────────────────────────────────────────────

describe("asChild: disabled state", () => {
  it("merges aria-disabled onto child", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-disabled": "true", "data-disabled": "" },
      consumerProps: {},
      children: (
        <a href="/disabled-link" data-testid="disabled">
          Link
        </a>
      ),
      componentName: "Test",
    });
    render(el);
    const node = screen.getByTestId("disabled");
    expect(node.getAttribute("aria-disabled")).toBe("true");
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("asChild: SSR", () => {
  it("renders child with merged props to string", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-expanded": "true", "data-kui-component": "Trigger" },
      consumerProps: {},
      children: <a href="/page">Link</a>,
      componentName: "Test",
    });
    const html = renderToString(el);
    expect(html).toContain("<a");
    expect(html).toContain('href="/page"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("Link");
  });

  it("does not include wrapper elements in SSR output", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "div",
      internalProps: { className: "internal" },
      consumerProps: {},
      children: <span className="child">Text</span>,
      componentName: "Test",
    });
    const html = renderToString(el);
    expect(html).toMatch(/^<span/);
    expect(html).not.toContain("<div");
  });

  it("fallback renders default element in SSR on invalid child", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { type: "button" },
      consumerProps: {},
      children: "just text",
      componentName: "Test",
    });
    const html = renderToString(el);
    expect(html).toContain("<button");
    vi.restoreAllMocks();
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("asChild: Strict Mode", () => {
  it("renders correctly in StrictMode", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-label": "Action" },
      consumerProps: {},
      children: <div data-testid="strict">Content</div>,
      componentName: "Test",
    });
    render(<StrictMode>{el}</StrictMode>);
    expect(screen.getByTestId("strict").getAttribute("aria-label")).toBe("Action");
    expect(screen.getByTestId("strict").textContent).toBe("Content");
  });

  it("refs work in StrictMode", () => {
    const ref = createRef<HTMLElement>();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: {},
      children: <span data-testid="s-ref" />,
      componentName: "Test",
      internalRef: ref,
    });
    render(<StrictMode>{el}</StrictMode>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("events fire once in StrictMode", () => {
    const handler = vi.fn();
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { onClick: handler },
      consumerProps: {},
      children: <button data-testid="s-evt" />,
      componentName: "Test",
    });
    render(<StrictMode>{el}</StrictMode>);
    screen.getByTestId("s-evt").click();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── Validation diagnostics ─────────────────────────────────────────

describe("asChild: diagnostics", () => {
  it("warns and falls back for zero children", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { type: "button" },
      consumerProps: { "data-testid": "fallback" },
      children: null,
      componentName: "MyComp",
    });
    render(el);
    expect(spy).toHaveBeenCalled();
    expect(screen.getByTestId("fallback").tagName).toBe("BUTTON");
    spy.mockRestore();
  });

  it("warns for multiple children (e.g. from fragment)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: {},
      consumerProps: { "data-testid": "frag-fb" },
      children: [<span key="a">a</span>, <span key="b">b</span>],
      componentName: "MyComp",
    });
    render(el);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("exactly one"));
    spy.mockRestore();
  });
});
