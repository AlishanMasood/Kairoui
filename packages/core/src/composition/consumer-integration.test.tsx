/**
 * Consumer integration test — validates the composition API from an external consumer perspective.
 * Imports only from approved package exports (@kairoui/core/composition).
 * Verifies: type resolution, prop composition, ref forwarding, events, ARIA, SSR, Strict Mode.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import type { ReactNode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";

// Consumer imports from approved package export paths
import {
  createPolymorphicComponent,
  renderPolymorphic,
  mergeProps,
  mergePropsAll,
  defineSlots,
  resolveAllSlotProps,
  renderSlot,
  renderOptionalSlot,
  renderAsChild,
  mergeClassNames,
  mergeStyles,
  composeComponentRefs,
} from "@kairoui/core/composition";

afterEach(cleanup);

// ─── Consumer-built components using composition API ────────────────

const ConsumerBox = createPolymorphicComponent<Record<string, unknown>, "div">({
  displayName: "ConsumerBox",
  defaultElement: "div",
  useProps: (_props, ref) => ({ ref, "data-component": "ConsumerBox" }),
});

interface ConsumerButtonProps {
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

const ConsumerButton = createPolymorphicComponent<ConsumerButtonProps, "button">({
  displayName: "ConsumerButton",
  defaultElement: "button",
  useProps: (props, ref) => ({
    ref,
    type: "button",
    "data-component": "ConsumerButton",
    "data-variant": props.variant ?? "primary",
    ...(props.disabled ? { disabled: true, "aria-disabled": "true" } : {}),
  }),
});

// ─── Consumer custom component fixture ──────────────────────────────

interface RouterLinkProps {
  to: string;
  children?: ReactNode;
  "data-testid"?: string;
  className?: string;
}

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>((props, ref) => {
  const { to, children, ...rest } = props;
  return (
    <a {...rest} href={to} ref={ref}>
      {children}
    </a>
  );
});
RouterLink.displayName = "RouterLink";

// ─── createPolymorphicComponent consumer usage ──────────────────────

describe("Consumer: createPolymorphicComponent", () => {
  it("creates component with default element", () => {
    render(<ConsumerBox data-testid="box">Content</ConsumerBox>);
    const el = screen.getByTestId("box");
    expect(el.tagName).toBe("DIV");
    expect(el.getAttribute("data-component")).toBe("ConsumerBox");
    expect(el.textContent).toBe("Content");
  });

  it("supports polymorphic as", () => {
    render(
      <ConsumerBox as="section" data-testid="sec">
        Section
      </ConsumerBox>,
    );
    expect(screen.getByTestId("sec").tagName).toBe("SECTION");
  });

  it("supports custom component target", () => {
    render(
      <ConsumerBox as={RouterLink} to="/page" data-testid="link">
        Link
      </ConsumerBox>,
    );
    const el = screen.getByTestId("link");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/page");
  });

  it("forwards ref to native element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ConsumerBox ref={ref} data-testid="r" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref to polymorphic element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ConsumerButton ref={ref} data-testid="b">
        Click
      </ConsumerButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("passes own props to useProps", () => {
    render(
      <ConsumerButton variant="secondary" data-testid="v">
        Go
      </ConsumerButton>,
    );
    expect(screen.getByTestId("v").getAttribute("data-variant")).toBe("secondary");
  });

  it("merges consumer className", () => {
    render(
      <ConsumerBox data-testid="c" className="consumer">
        X
      </ConsumerBox>,
    );
    expect(screen.getByTestId("c").className).toContain("consumer");
  });

  it("merges consumer style", () => {
    render(
      <ConsumerBox data-testid="s" style={{ color: "red" }}>
        X
      </ConsumerBox>,
    );
    expect(screen.getByTestId("s").style.color).toBe("red");
  });

  it("composes consumer events with internal", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <ConsumerButton data-testid="e" onClick={handler}>
        Click
      </ConsumerButton>,
    );
    await user.click(screen.getByTestId("e"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── mergeProps consumer usage ──────────────────────────────────────

describe("Consumer: mergeProps", () => {
  it("merges className", () => {
    const result = mergeProps({ className: "a" }, { className: "b" });
    expect(result["className"]).toContain("a");
    expect(result["className"]).toContain("b");
  });

  it("merges style objects", () => {
    const result = mergeProps(
      { style: { color: "red", padding: "4px" } },
      { style: { color: "blue" } },
    );
    const style = result["style"] as Record<string, string>;
    expect(style["color"]).toBe("blue");
    expect(style["padding"]).toBe("4px");
  });

  it("composes event handlers", () => {
    const calls: string[] = [];
    const result = mergeProps(
      { onClick: () => calls.push("base") },
      { onClick: () => calls.push("override") },
    );
    (result["onClick"] as (e: { defaultPrevented: boolean }) => void)({ defaultPrevented: false });
    expect(calls).toContain("base");
    expect(calls).toContain("override");
  });

  it("composes refs", () => {
    const ref1 = createRef<HTMLElement>();
    const ref2 = createRef<HTMLElement>();
    const result = mergeProps({ ref: ref1 }, { ref: ref2 });
    const composed = result["ref"] as unknown as (el: HTMLElement | null) => void;
    const div = document.createElement("div");
    composed(div);
    expect(ref1.current).toBe(div);
    expect(ref2.current).toBe(div);
  });

  it("reconciles ARIA token-lists", () => {
    const result = mergeProps({ "aria-labelledby": "label-a" }, { "aria-labelledby": "label-b" });
    const val = result["aria-labelledby"];
    expect(val).toContain("label-a");
    expect(val).toContain("label-b");
  });
});

// ─── mergePropsAll consumer usage ───────────────────────────────────

describe("Consumer: mergePropsAll", () => {
  it("merges multiple sources", () => {
    const result = mergePropsAll(
      { className: "a" },
      { className: "b" },
      { className: "c", id: "test" },
    );
    expect(result["className"]).toContain("a");
    expect(result["className"]).toContain("c");
    expect(result["id"]).toBe("test");
  });
});

// ─── Slot system consumer usage ─────────────────────────────────────

describe("Consumer: slot system", () => {
  it("defines and resolves slots", () => {
    const slots = defineSlots({
      root: { defaultElement: "div", required: true, public: true },
      icon: { defaultElement: "span", required: false, public: true },
    });

    const resolved = resolveAllSlotProps({
      definitions: slots,
      internalProps: {
        root: { className: "root-class" },
        icon: { "aria-hidden": "true" },
      },
    });

    expect(resolved.root.element).toBe("div");
    expect(resolved.root.props["className"]).toBe("root-class");
    expect(resolved.icon.props["aria-hidden"]).toBe("true");
  });

  it("renders slots", () => {
    const slots = defineSlots({
      content: { defaultElement: "span", required: true, public: true },
    });
    const resolved = resolveAllSlotProps({
      definitions: slots,
      internalProps: { content: { "data-testid": "slot" } },
    });
    render(renderSlot(resolved.content, "Hello"));
    expect(screen.getByTestId("slot").textContent).toBe("Hello");
  });

  it("renders optional slots", () => {
    const slots = defineSlots({ icon: { defaultElement: "span", required: false, public: true } });
    const resolved = resolveAllSlotProps({
      definitions: slots,
      internalProps: { icon: { "data-testid": "icon" } },
    });
    const el = renderOptionalSlot(resolved.icon, true, "★");
    render(el ?? <span />);
    expect(screen.getByTestId("icon").textContent).toBe("★");
  });

  it("accepts consumer slot overrides", () => {
    const slots = defineSlots({ body: { defaultElement: "div", required: true, public: true } });
    const resolved = resolveAllSlotProps({
      definitions: slots,
      internalProps: { body: { className: "internal" } },
      overrides: {
        slots: { body: "section" },
        slotProps: { body: { className: "consumer" } },
      },
    });
    expect(resolved.body.element).toBe("section");
    expect(resolved.body.props["className"]).toContain("internal");
    expect(resolved.body.props["className"]).toContain("consumer");
  });
});

// ─── renderAsChild consumer usage ───────────────────────────────────

describe("Consumer: renderAsChild", () => {
  it("delegates rendering to child", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "aria-label": "Action" },
      consumerProps: {},
      children: <span data-testid="child">Child</span>,
      componentName: "MyComp",
    });
    render(el);
    expect(screen.getByTestId("child").tagName).toBe("SPAN");
    expect(screen.getByTestId("child").getAttribute("aria-label")).toBe("Action");
  });

  it("renders default element when asChild=false", () => {
    const el = renderAsChild({
      asChild: false,
      defaultElement: "button",
      internalProps: { type: "button" },
      consumerProps: { "data-testid": "default" },
      children: "Click",
      componentName: "MyComp",
    });
    render(el);
    expect(screen.getByTestId("default").tagName).toBe("BUTTON");
  });
});

// ─── Ref composition consumer usage ─────────────────────────────────

describe("Consumer: composeComponentRefs", () => {
  it("composes forwarded + internal refs", () => {
    const forwarded = createRef<HTMLElement>();
    const internal = createRef<HTMLElement>();
    const composed = composeComponentRefs({ forwarded, internal });
    const div = document.createElement("div");
    composed!(div);
    expect(forwarded.current).toBe(div);
    expect(internal.current).toBe(div);
  });

  it("returns undefined when no refs provided", () => {
    const result = composeComponentRefs({});
    expect(result).toBeUndefined();
  });
});

// ─── Utility consumer usage ─────────────────────────────────────────

describe("Consumer: utilities", () => {
  it("mergeClassNames combines sources", () => {
    const result = mergeClassNames({ base: "a", consumer: "b" });
    expect(result).toContain("a");
    expect(result).toContain("b");
  });

  it("mergeStyles merges per-property", () => {
    const result = mergeStyles({ color: "red" }, { padding: "4px" });
    expect(result).toEqual({ color: "red", padding: "4px" });
  });
});

// ─── SSR consumer usage ─────────────────────────────────────────────

describe("Consumer: SSR", () => {
  it("renders polymorphic component to string", () => {
    const html = renderToString(<ConsumerBox className="ssr">Content</ConsumerBox>);
    expect(html).toContain("<div");
    expect(html).toContain("ssr");
    expect(html).toContain("Content");
  });

  it("renders custom target to string", () => {
    const html = renderToString(
      <ConsumerBox as="article" className="art">
        Article
      </ConsumerBox>,
    );
    expect(html).toContain("<article");
    expect(html).toContain("Article");
  });

  it("renderAsChild works in SSR", () => {
    const el = renderAsChild({
      asChild: true,
      defaultElement: "button",
      internalProps: { "data-ssr": "true" },
      consumerProps: {},
      children: <a href="/link">Link</a>,
      componentName: "Test",
    });
    const html = renderToString(el);
    expect(html).toContain("<a");
    expect(html).toContain("data-ssr");
  });
});

// ─── Strict Mode consumer usage ─────────────────────────────────────

describe("Consumer: Strict Mode", () => {
  it("polymorphic component works in StrictMode", () => {
    render(
      <StrictMode>
        <ConsumerButton data-testid="sm">OK</ConsumerButton>
      </StrictMode>,
    );
    expect(screen.getByTestId("sm").textContent).toBe("OK");
  });

  it("refs work in StrictMode", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <StrictMode>
        <ConsumerBox ref={ref} data-testid="sr" />
      </StrictMode>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("events fire once in StrictMode", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <StrictMode>
        <ConsumerButton data-testid="se" onClick={handler}>
          Click
        </ConsumerButton>
      </StrictMode>,
    );
    await user.click(screen.getByTestId("se"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── Package boundary: private paths should not be needed ───────────

describe("Consumer: package boundaries", () => {
  it("all needed APIs are available from @kairoui/core/composition", () => {
    // These are all imported at the top — if any were missing, the test file wouldn't compile
    expect(createPolymorphicComponent).toBeDefined();
    expect(renderPolymorphic).toBeDefined();
    expect(mergeProps).toBeDefined();
    expect(mergePropsAll).toBeDefined();
    expect(defineSlots).toBeDefined();
    expect(resolveAllSlotProps).toBeDefined();
    expect(renderSlot).toBeDefined();
    expect(renderOptionalSlot).toBeDefined();
    expect(renderAsChild).toBeDefined();
    expect(mergeClassNames).toBeDefined();
    expect(mergeStyles).toBeDefined();
    expect(composeComponentRefs).toBeDefined();
  });
});
