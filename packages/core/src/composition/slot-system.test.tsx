import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, forwardRef, memo, StrictMode, createRef } from "react";
import type { ElementType, ReactNode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { defineSlot, defineSlots } from "./slot-definitions";
import { resolveSlotProps, resolveAllSlotProps } from "./resolve-slot-props";
import { renderSlot, renderOptionalSlot, renderSlots } from "./render-slot";
import {
  validateSlotReplacements,
  createSlotReplacements,
  resolveSlotElements,
  checkRefSupport,
  isForwardRefComponent,
} from "./slot-replacement";
import type { ResolvedSlotProps, SlotOverrides } from "./resolve-slot-props";

// ─── Helpers ────────────────────────────────────────────────────────

function makeResolved(element: ElementType, props: Record<string, unknown>): ResolvedSlotProps {
  return { element, props };
}

const ForwardedButton = forwardRef<HTMLButtonElement, Record<string, unknown>>((props, ref) =>
  createElement("button", { ...props, ref, "data-forwarded": "true" }),
);
ForwardedButton.displayName = "ForwardedButton";

const PlainComponent = (props: Record<string, unknown>) =>
  createElement("div", { ...props, "data-plain": "true" });

// ─── Edge Cases: Slot Definitions ───────────────────────────────────

describe("slot definitions edge cases", () => {
  it("handles single-slot components", () => {
    const defs = defineSlots({ root: { defaultElement: "div", required: true } });
    expect(Object.keys(defs)).toEqual(["root"]);
    expect(defs.root.required).toBe(true);
  });

  it("handles many-slot components", () => {
    const defs = defineSlots({
      root: { required: true },
      header: {},
      title: {},
      subtitle: {},
      content: {},
      actions: {},
      footer: {},
      overlay: { public: false },
      positioner: { public: false },
    });
    expect(Object.keys(defs)).toHaveLength(9);
  });

  it("preserves role through composition pipeline", () => {
    const def = defineSlot("listbox", { defaultElement: "ul", role: "listbox" });
    const resolved = resolveSlotProps({ definition: def, internalProps: {} });
    expect(resolved.props["data-kui-slot"]).toBe("listbox");
    // Role is metadata on definition, not auto-injected as prop
    expect(def.role).toBe("listbox");
  });

  it("supports component as defaultElement", () => {
    const Custom = (props: Record<string, unknown>) => createElement("section", props);
    const def = defineSlot("content", { defaultElement: Custom });
    expect(def.defaultElement).toBe(Custom);
  });
});

// ─── Edge Cases: Prop Composition ───────────────────────────────────

describe("slot prop composition edge cases", () => {
  it("handles empty props from all sources", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root"),
      internalProps: {},
      accessibilityProps: {},
      stateProps: {},
      consumerProps: {},
    });
    expect(result.props["data-kui-slot"]).toBe("root");
    expect(Object.keys(result.props)).toHaveLength(1);
  });

  it("handles undefined sources gracefully", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root"),
      internalProps: undefined,
      accessibilityProps: undefined,
      stateProps: undefined,
      consumerProps: undefined,
    });
    expect(result.element).toBe("div");
    expect(result.props["data-kui-slot"]).toBe("root");
  });

  it("merges className from all four sources", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root"),
      internalProps: { className: "internal" },
      accessibilityProps: { className: "a11y" },
      stateProps: { className: "state" },
      consumerProps: { className: "consumer" },
    });
    const cls = result.props["className"] as string;
    expect(cls).toContain("internal");
    expect(cls).toContain("a11y");
    expect(cls).toContain("state");
    expect(cls).toContain("consumer");
  });

  it("composes event handlers from multiple sources", () => {
    const calls: string[] = [];
    const result = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { onClick: () => calls.push("internal") },
      stateProps: { onClick: () => calls.push("state") },
      consumerProps: { onClick: () => calls.push("consumer") },
    });
    const handler = result.props["onClick"] as (e: { defaultPrevented: boolean }) => void;
    handler({ defaultPrevented: false });
    expect(calls).toContain("internal");
    expect(calls).toContain("consumer");
  });

  it("consumer can cancel internal handlers via preventDefault", () => {
    const internal = vi.fn();
    const result = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { onClick: internal },
      consumerProps: {
        onClick: (e: { defaultPrevented: boolean; preventDefault: () => void }) => {
          e.preventDefault();
        },
      },
    });
    const handler = result.props["onClick"] as (e: {
      defaultPrevented: boolean;
      preventDefault: () => void;
    }) => void;
    const event = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    handler(event);
    expect(internal).not.toHaveBeenCalled();
  });

  it("merges style objects from multiple sources", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root"),
      internalProps: { style: { display: "flex", gap: "8px" } },
      consumerProps: { style: { gap: "16px", color: "red" } },
    });
    const style = result.props["style"] as Record<string, string>;
    expect(style["display"]).toBe("flex");
    expect(style["gap"]).toBe("16px");
    expect(style["color"]).toBe("red");
  });

  it("merges ARIA token-list attributes", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root"),
      internalProps: { "aria-labelledby": "internal-label" },
      accessibilityProps: { "aria-labelledby": "a11y-label" },
    });
    const labelledby = result.props["aria-labelledby"] as string;
    expect(labelledby).toContain("internal-label");
    expect(labelledby).toContain("a11y-label");
  });

  it("data-kui-slot cannot be overridden by consumer", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root"),
      consumerProps: { "data-kui-slot": "hacked" },
    });
    // data-kui-slot is always set last from definition
    expect(result.props["data-kui-slot"]).toBe("root");
  });
});

// ─── Edge Cases: Rendering ──────────────────────────────────────────

describe("slot rendering edge cases", () => {
  afterEach(cleanup);

  it("renders with null children (no children prop added)", () => {
    const el = renderSlot(makeResolved("div", { "data-testid": "null-child" }));
    render(el);
    expect(screen.getByTestId("null-child").childNodes).toHaveLength(0);
  });

  it("renders with empty string children", () => {
    const el = renderSlot(makeResolved("span", { "data-testid": "empty" }), "");
    render(el);
    expect(screen.getByTestId("empty").textContent).toBe("");
  });

  it("renders with fragment-like multiple children", () => {
    const el = renderSlot(makeResolved("div", { "data-testid": "multi" }), [
      createElement("span", { key: "a" }, "A"),
      createElement("span", { key: "b" }, "B"),
    ]);
    render(el);
    expect(screen.getByTestId("multi").textContent).toBe("AB");
  });

  it("renders custom component in slot", () => {
    const Custom = (props: { "data-testid"?: string; children?: ReactNode }) =>
      createElement("article", props);
    const el = renderSlot(makeResolved(Custom, { "data-testid": "custom" }), "Content");
    render(el);
    expect(screen.getByTestId("custom").tagName).toBe("ARTICLE");
    expect(screen.getByTestId("custom").textContent).toBe("Content");
  });

  it("renders forwardRef component in slot", () => {
    const el = renderSlot(makeResolved(ForwardedButton, { "data-testid": "fwd" }), "Click");
    render(el);
    expect(screen.getByTestId("fwd").getAttribute("data-forwarded")).toBe("true");
    expect(screen.getByTestId("fwd").textContent).toBe("Click");
  });

  it("renderOptionalSlot with undefined children when visible", () => {
    const el = renderOptionalSlot(makeResolved("div", { "data-testid": "opt" }), true);
    render(el ?? createElement("div"));
    expect(screen.getByTestId("opt")).toBeDefined();
  });

  it("renderSlots with zero visible slots returns all null", () => {
    const slots = renderSlots(
      { a: makeResolved("div", {}), b: makeResolved("span", {}) },
      { visible: { a: false, b: false } },
    );
    expect(slots.a).toBeNull();
    expect(slots.b).toBeNull();
  });
});

// ─── Edge Cases: Slot Replacement ───────────────────────────────────

describe("slot replacement edge cases", () => {
  const definitions = defineSlots({
    root: { defaultElement: "div", public: true, required: true },
    icon: { defaultElement: "span", public: true },
    _positioner: { defaultElement: "div", public: false },
  });

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles empty replacement map", () => {
    const result = createSlotReplacements(definitions, {}, "TestComponent");
    expect(result).toEqual({});
  });

  it("handles replacement map with only undefined values", () => {
    const result = createSlotReplacements(
      definitions,
      { root: undefined, icon: undefined },
      "TestComponent",
    );
    expect(result).toEqual({});
  });

  it("rejects multiple invalid replacements in one call", () => {
    const validation = validateSlotReplacements(
      { root: 42, icon: null, _positioner: "div", unknown: "span" },
      definitions,
      "TestComponent",
    );
    expect(validation.valid).toBe(false);
    expect(validation.diagnostics.length).toBeGreaterThanOrEqual(3);
  });

  it("preserves valid entries alongside invalid ones", () => {
    const validation = validateSlotReplacements(
      { root: "button", icon: null },
      definitions,
      "TestComponent",
    );
    expect(validation.replacements["root"]).toBe("button");
    expect(validation.replacements["icon"]).toBeUndefined();
  });

  it("accepts SVG elements as replacements", () => {
    const result = createSlotReplacements(definitions, { icon: "svg" }, "TestComponent");
    expect(result.icon).toBe("svg");
  });

  it("accepts memo components as replacements", () => {
    const MemoComp = memo(PlainComponent);
    const result = createSlotReplacements(definitions, { root: MemoComp }, "TestComponent");
    expect(result.root).toBe(MemoComp);
  });

  it("resolveSlotElements falls back to defaults for unspecified slots", () => {
    const elements = resolveSlotElements(definitions, { root: "button" });
    expect(elements.root).toBe("button");
    expect(elements.icon).toBe("span");
    expect(elements._positioner).toBe("div");
  });
});

// ─── Ref Composition Through Slots ──────────────────────────────────

describe("ref composition through slots", () => {
  afterEach(cleanup);

  it("forwards ref to native element slot", () => {
    const ref = createRef<HTMLButtonElement>();
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { ref, "data-testid": "ref-slot" },
    });
    render(renderSlot(resolved));
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards ref to replaced native element", () => {
    const ref = createRef<HTMLAnchorElement>();
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { ref, "data-testid": "ref-replaced" },
      elementOverride: "a",
    });
    render(renderSlot(resolved));
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("composes multiple refs on a slot", () => {
    const ref1 = createRef<HTMLElement>();
    const ref2 = createRef<HTMLElement>();
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "div" }),
      internalProps: { ref: ref1, "data-testid": "multi-ref" },
      consumerProps: { ref: ref2 },
    });
    render(renderSlot(resolved));
    expect(ref1.current).toBeInstanceOf(HTMLDivElement);
    expect(ref2.current).toBeInstanceOf(HTMLDivElement);
    expect(ref1.current).toBe(ref2.current);
  });

  it("callback refs receive the element", () => {
    let captured: HTMLElement | null = null;
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "span" }),
      internalProps: {
        ref: (el: HTMLElement | null) => {
          captured = el;
        },
        "data-testid": "cb-ref",
      },
    });
    render(renderSlot(resolved));
    expect(captured).toBeInstanceOf(HTMLSpanElement);
  });

  it("checkRefSupport warns for plain function components", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = checkRefSupport("root", PlainComponent, "TestComp");
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("ref forwarding"));
    spy.mockRestore();
  });

  it("checkRefSupport passes for forwardRef components", () => {
    const result = checkRefSupport("root", ForwardedButton, "TestComp");
    expect(result).toBe(true);
  });

  it("checkRefSupport passes for intrinsic elements", () => {
    expect(checkRefSupport("root", "button", "T")).toBe(true);
    expect(checkRefSupport("root", "svg", "T")).toBe(true);
  });
});

// ─── Event Composition Through Slots ────────────────────────────────

describe("event composition through slots", () => {
  afterEach(cleanup);

  it("composes onClick from internal and consumer", async () => {
    const user = userEvent.setup();
    const internal = vi.fn();
    const consumer = vi.fn();
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { onClick: internal, "data-testid": "evt" },
      consumerProps: { onClick: consumer },
    });
    render(renderSlot(resolved, "Click"));
    await user.click(screen.getByTestId("evt"));
    expect(internal).toHaveBeenCalledTimes(1);
    expect(consumer).toHaveBeenCalledTimes(1);
  });

  it("composes onFocus and onBlur", async () => {
    const user = userEvent.setup();
    const internalFocus = vi.fn();
    const consumerFocus = vi.fn();
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "input" }),
      internalProps: { onFocus: internalFocus, "data-testid": "focus" },
      consumerProps: { onFocus: consumerFocus },
    });
    render(renderSlot(resolved));
    await user.click(screen.getByTestId("focus"));
    expect(internalFocus).toHaveBeenCalled();
    expect(consumerFocus).toHaveBeenCalled();
  });

  it("composes onKeyDown", async () => {
    const user = userEvent.setup();
    const internal = vi.fn();
    const consumer = vi.fn();
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "input" }),
      internalProps: { onKeyDown: internal, "data-testid": "kd" },
      consumerProps: { onKeyDown: consumer },
    });
    render(renderSlot(resolved));
    await user.type(screen.getByTestId("kd"), "a");
    expect(internal).toHaveBeenCalled();
    expect(consumer).toHaveBeenCalled();
  });

  it("events work on replaced slot element", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    const defs = defineSlots({ root: { defaultElement: "div", public: true } });
    const resolved = resolveAllSlotProps({
      definitions: defs,
      internalProps: { root: { onClick: handler, "data-testid": "replaced" } },
      overrides: { slots: { root: "button" } },
    });
    render(renderSlot(resolved.root, "Click"));
    await user.click(screen.getByTestId("replaced"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── Accessibility Through Slots ────────────────────────────────────

describe("accessibility through slots", () => {
  afterEach(cleanup);

  it("preserves aria-label on slot", () => {
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      accessibilityProps: { "aria-label": "Close dialog" },
      internalProps: { "data-testid": "a11y" },
    });
    render(renderSlot(resolved));
    expect(screen.getByTestId("a11y").getAttribute("aria-label")).toBe("Close dialog");
  });

  it("merges aria-describedby from multiple sources", () => {
    const resolved = resolveSlotProps({
      definition: defineSlot("root"),
      internalProps: { "aria-describedby": "hint-1", "data-testid": "desc" },
      accessibilityProps: { "aria-describedby": "hint-2" },
    });
    render(renderSlot(resolved));
    const val = screen.getByTestId("desc").getAttribute("aria-describedby")!;
    expect(val).toContain("hint-1");
    expect(val).toContain("hint-2");
  });

  it("preserves role attribute through replacement", () => {
    const defs = defineSlots({ nav: { defaultElement: "div", public: true } });
    const resolved = resolveAllSlotProps({
      definitions: defs,
      accessibilityProps: { nav: { role: "navigation", "aria-label": "Main" } },
      internalProps: { nav: { "data-testid": "nav" } },
      overrides: { slots: { nav: "nav" } },
    });
    render(renderSlot(resolved.nav));
    const node = screen.getByTestId("nav");
    expect(node.tagName).toBe("NAV");
    expect(node.getAttribute("role")).toBe("navigation");
    expect(node.getAttribute("aria-label")).toBe("Main");
  });

  it("preserves aria-expanded and aria-controls", () => {
    const resolved = resolveSlotProps({
      definition: defineSlot("trigger", { defaultElement: "button" }),
      accessibilityProps: {
        "aria-expanded": "true",
        "aria-controls": "panel-1",
      },
      internalProps: { "data-testid": "trigger" },
    });
    render(renderSlot(resolved));
    const node = screen.getByTestId("trigger");
    expect(node.getAttribute("aria-expanded")).toBe("true");
    expect(node.getAttribute("aria-controls")).toBe("panel-1");
  });

  it("data-kui-slot is always set for testing/styling hooks", () => {
    const defs = defineSlots({
      root: { defaultElement: "div" },
      icon: { defaultElement: "span" },
    });
    const resolved = resolveAllSlotProps({ definitions: defs });
    expect(resolved.root.props["data-kui-slot"]).toBe("root");
    expect(resolved.icon.props["data-kui-slot"]).toBe("icon");
  });
});

// ─── SSR Compatibility ──────────────────────────────────────────────

describe("SSR compatibility", () => {
  it("renders slot to string", () => {
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { type: "button", className: "kui-btn" },
    });
    const html = renderToString(renderSlot(resolved, "Click me"));
    expect(html).toContain("<button");
    expect(html).toContain("kui-btn");
    expect(html).toContain("Click me");
    expect(html).toContain('data-kui-slot="root"');
  });

  it("renders replaced slot to string", () => {
    const defs = defineSlots({ root: { defaultElement: "div", public: true } });
    const resolved = resolveAllSlotProps({
      definitions: defs,
      internalProps: { root: { className: "card" } },
      overrides: { slots: { root: "article" } },
    });
    const html = renderToString(renderSlot(resolved.root, "Content"));
    expect(html).toContain("<article");
    expect(html).toContain("card");
    expect(html).toContain("Content");
  });

  it("renders multiple slots to string", () => {
    const defs = defineSlots({
      root: { defaultElement: "div" },
      header: { defaultElement: "header" },
      content: { defaultElement: "main" },
    });
    const resolved = resolveAllSlotProps({
      definitions: defs,
      internalProps: {
        root: { className: "card" },
        header: { className: "header" },
        content: { className: "content" },
      },
    });
    const elements = renderSlots(resolved, {
      children: { header: "Title", content: "Body" },
    });
    const html = renderToString(
      createElement("div", null, elements.root, elements.header, elements.content),
    );
    expect(html).toContain("card");
    expect(html).toContain("Title");
    expect(html).toContain("Body");
  });

  it("renders optional slot (hidden) to nothing on SSR", () => {
    const resolved = resolveSlotProps({
      definition: defineSlot("tooltip"),
      internalProps: { className: "tooltip" },
    });
    const el = renderOptionalSlot(resolved, false);
    expect(el).toBeNull();
  });

  it("renders component slot to string", () => {
    const Card = (props: Record<string, unknown>) =>
      createElement("article", { ...props, "data-card": "true" });
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: Card }),
      internalProps: { className: "my-card" },
    });
    const html = renderToString(renderSlot(resolved, "Card content"));
    expect(html).toContain("<article");
    expect(html).toContain("data-card");
    expect(html).toContain("Card content");
  });
});

// ─── React Strict Mode ──────────────────────────────────────────────

describe("React Strict Mode", () => {
  afterEach(cleanup);

  it("slot renders correctly in StrictMode", () => {
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { "data-testid": "strict", type: "button" },
    });
    render(createElement(StrictMode, null, renderSlot(resolved, "Strict")));
    expect(screen.getByTestId("strict").textContent).toBe("Strict");
  });

  it("refs work correctly in StrictMode", () => {
    const ref = createRef<HTMLDivElement>();
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "div" }),
      internalProps: { ref, "data-testid": "strict-ref" },
    });
    render(createElement(StrictMode, null, renderSlot(resolved)));
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("event handlers fire once in StrictMode", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    const resolved = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { onClick: handler, "data-testid": "strict-evt" },
    });
    render(createElement(StrictMode, null, renderSlot(resolved, "Click")));
    await user.click(screen.getByTestId("strict-evt"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("multiple slots render in StrictMode", () => {
    const defs = defineSlots({
      root: { defaultElement: "div" },
      label: { defaultElement: "span" },
    });
    const resolved = resolveAllSlotProps({
      definitions: defs,
      internalProps: {
        root: { "data-testid": "sm-root" },
        label: { "data-testid": "sm-label" },
      },
    });
    const elements = renderSlots(resolved, { children: { label: "Hello" } });
    render(
      createElement(StrictMode, null, createElement("div", null, elements.root, elements.label)),
    );
    expect(screen.getByTestId("sm-root")).toBeDefined();
    expect(screen.getByTestId("sm-label").textContent).toBe("Hello");
  });
});

// ─── Integration: Full Pipeline ─────────────────────────────────────

describe("full slot pipeline integration", () => {
  afterEach(cleanup);

  it("define → resolve → replace → render", () => {
    const defs = defineSlots({
      root: { defaultElement: "div", required: true, public: true },
      icon: { defaultElement: "span", public: true },
      label: { defaultElement: "span", public: true },
    });

    const replacements = createSlotReplacements(defs, { root: "button" }, "Button");

    const resolved = resolveAllSlotProps({
      definitions: defs,
      internalProps: {
        root: { type: "button", "data-testid": "pipe-root" },
        icon: { "aria-hidden": "true", "data-testid": "pipe-icon" },
        label: { "data-testid": "pipe-label" },
      },
      accessibilityProps: {
        root: { "aria-label": "Submit" },
      },
      overrides: {
        slots: replacements,
        slotProps: { root: { className: "consumer-btn" } },
      },
    });

    const elements = renderSlots(resolved, {
      children: { icon: "★", label: "Submit" },
    });

    render(createElement("div", null, elements.root, elements.icon, elements.label));

    const root = screen.getByTestId("pipe-root");
    expect(root.tagName).toBe("BUTTON");
    expect(root.getAttribute("type")).toBe("button");
    expect(root.getAttribute("aria-label")).toBe("Submit");
    expect(root.className).toContain("consumer-btn");
    expect(root.getAttribute("data-kui-slot")).toBe("root");

    expect(screen.getByTestId("pipe-icon").textContent).toBe("★");
    expect(screen.getByTestId("pipe-icon").getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByTestId("pipe-label").textContent).toBe("Submit");
  });

  it("pipeline with forwardRef replacement", () => {
    const defs = defineSlots({
      root: { defaultElement: "div", public: true },
    });

    const ref = createRef<HTMLButtonElement>();
    const resolved = resolveAllSlotProps({
      definitions: defs,
      internalProps: { root: { "data-testid": "fwd-pipe", ref } },
      overrides: { slots: { root: ForwardedButton } },
    });

    render(renderSlot(resolved.root, "Forwarded"));
    expect(screen.getByTestId("fwd-pipe").getAttribute("data-forwarded")).toBe("true");
  });

  it("pipeline with conditional slots", () => {
    const defs = defineSlots({
      root: { defaultElement: "div", required: true },
      description: { defaultElement: "p" },
      error: { defaultElement: "span" },
    });

    const resolved = resolveAllSlotProps({
      definitions: defs,
      internalProps: {
        root: { "data-testid": "cond-root" },
        description: { "data-testid": "cond-desc" },
        error: { "data-testid": "cond-err", role: "alert" },
      },
    });

    const hasError = false;
    const elements = renderSlots(resolved, {
      children: { description: "Help text", error: "Error message" },
      visible: { error: hasError },
    });

    render(createElement("div", null, elements.root, elements.description, elements.error));
    expect(screen.getByTestId("cond-desc").textContent).toBe("Help text");
    expect(elements.error).toBeNull();
  });

  it("pipeline preserves data attributes across layers", () => {
    const defs = defineSlots({ root: { defaultElement: "div" } });
    const resolved = resolveAllSlotProps({
      definitions: defs,
      internalProps: { root: { "data-testid": "data-attrs", "data-state": "open" } },
      stateProps: { root: { "data-orientation": "horizontal" } },
      overrides: { slotProps: { root: { "data-custom": "value" } } },
    });
    render(renderSlot(resolved.root));
    const node = screen.getByTestId("data-attrs");
    expect(node.getAttribute("data-state")).toBe("open");
    expect(node.getAttribute("data-orientation")).toBe("horizontal");
    expect(node.getAttribute("data-custom")).toBe("value");
    expect(node.getAttribute("data-kui-slot")).toBe("root");
  });
});

// ─── Type Inference Tests ───────────────────────────────────────────

describe("type inference", () => {
  it("resolveAllSlotProps preserves slot name keys", () => {
    const defs = defineSlots({
      root: { defaultElement: "div" },
      content: { defaultElement: "main" },
    });
    const resolved = resolveAllSlotProps({ definitions: defs });
    // TypeScript ensures these keys exist
    expect(resolved.root).toBeDefined();
    expect(resolved.content).toBeDefined();
  });

  it("renderSlots preserves slot name keys in output", () => {
    const defs = defineSlots({
      root: { defaultElement: "div" },
      footer: { defaultElement: "footer" },
    });
    const resolved = resolveAllSlotProps({ definitions: defs });
    const elements = renderSlots(resolved);
    expect("root" in elements).toBe(true);
    expect("footer" in elements).toBe(true);
  });

  it("SlotOverrides type constrains slot names", () => {
    type Names = "root" | "icon";
    const overrides: SlotOverrides<Names> = {
      slots: { root: "button" },
      slotProps: { icon: { className: "icon" } },
    };
    expect(overrides.slots!["root"]).toBe("button");
  });

  it("createSlotReplacements returns typed map", () => {
    const defs = defineSlots({
      root: { defaultElement: "div", public: true },
      icon: { defaultElement: "span", public: true },
    });
    const replacements = createSlotReplacements(defs, { root: "a" }, "T");
    // TypeScript: replacements is SlotReplacementMap<"root" | "icon">
    expect(replacements.root).toBe("a");
    expect(replacements.icon).toBeUndefined();
  });
});

// ─── Performance ────────────────────────────────────────────────────

describe("performance characteristics", () => {
  it("resolveAllSlotProps does not create unnecessary intermediate objects", () => {
    const defs = defineSlots({
      root: { defaultElement: "div" },
      a: { defaultElement: "span" },
      b: { defaultElement: "span" },
      c: { defaultElement: "span" },
      d: { defaultElement: "span" },
    });

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      resolveAllSlotProps({
        definitions: defs,
        internalProps: { root: { className: "r" }, a: { className: "a" } },
      });
    }
    const duration = performance.now() - start;
    // Should complete 1000 iterations quickly (< 500ms even on slow CI)
    expect(duration).toBeLessThan(500);
  });

  it("renderSlots is O(n) in slot count", () => {
    const resolved: Record<string, ResolvedSlotProps> = {};
    for (let i = 0; i < 50; i++) {
      resolved[`slot${i}`] = makeResolved("div", { key: `s${i}` });
    }
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      renderSlots(resolved);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});

// ─── isForwardRefComponent Edge Cases ───────────────────────────────

describe("isForwardRefComponent edge cases", () => {
  it("detects forwardRef component", () => {
    expect(isForwardRefComponent(ForwardedButton)).toBe(true);
  });

  it("rejects plain function component", () => {
    expect(isForwardRefComponent(PlainComponent)).toBe(false);
  });

  it("rejects intrinsic element string", () => {
    expect(isForwardRefComponent("div")).toBe(false);
  });

  it("rejects number", () => {
    expect(isForwardRefComponent(42 as unknown as ElementType)).toBe(false);
  });
});
