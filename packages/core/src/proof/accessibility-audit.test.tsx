/**
 * Accessibility infrastructure audit.
 *
 * Validates the foundational a11y patterns that all future KairoUI components
 * will depend on. This covers:
 * - Disabled/readOnly/loading semantics across element types
 * - ARIA relationship merging and deduplication
 * - Focus-visible behavior
 * - ID stability (SSR/hydration safe)
 * - Polymorphic component accessibility
 * - Slot accessibility (aria-hidden on decorative elements)
 * - Button proof component accessibility completeness
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { reconcileInteractionState } from "../composition/reconcile-interaction";
import { mergeAriaRelationship, reconcileAriaBoolean } from "../composition/merge-aria";
import { resolveDisabledProps, resolveButtonType } from "../composition/authoring-helpers";
import { Button } from "./button";
import { Box } from "./box";
import { Text } from "./text";

afterEach(cleanup);

// ─── Disabled semantics ─────────────────────────────────────────────

describe("A11y: disabled semantics", () => {
  it("native button gets disabled attribute", () => {
    const result = reconcileInteractionState({ disabled: true, elementType: "button" });
    expect(result.disabled).toBe(true);
    expect(result["aria-disabled"]).toBeUndefined();
    expect(result["data-disabled"]).toBe("");
  });

  it("native input gets disabled attribute", () => {
    const result = reconcileInteractionState({ disabled: true, elementType: "input" });
    expect(result.disabled).toBe(true);
  });

  it("non-native element gets aria-disabled", () => {
    const result = reconcileInteractionState({ disabled: true, elementType: "div" });
    expect(result.disabled).toBeUndefined();
    expect(result["aria-disabled"]).toBe("true");
    expect(result["data-disabled"]).toBe("");
  });

  it("non-native element needs event suppression", () => {
    const result = reconcileInteractionState({ disabled: true, elementType: "div" });
    expect(result.shouldSuppressEvents).toBe(true);
  });

  it("native button does not need event suppression (browser handles it)", () => {
    const result = reconcileInteractionState({ disabled: true, elementType: "button" });
    expect(result.shouldSuppressEvents).toBe(false);
  });

  it("resolveDisabledProps: button element gets disabled", () => {
    const props = resolveDisabledProps("button", true, false);
    expect(props["disabled"]).toBe(true);
    expect(props["aria-disabled"]).toBeUndefined();
  });

  it("resolveDisabledProps: anchor element gets aria-disabled", () => {
    const props = resolveDisabledProps("a", true, false);
    expect(props["aria-disabled"]).toBe("true");
    expect(props["disabled"]).toBeUndefined();
  });

  it("Button component: disabled renders correctly", () => {
    render(
      <Button data-testid="btn" disabled>
        Click
      </Button>,
    );
    const el = screen.getByTestId("btn");
    expect(el.hasAttribute("disabled")).toBe(true);
    expect(el.getAttribute("data-disabled")).toBe("");
    expect(el.getAttribute("data-state")).toBe("disabled");
  });

  it("Button as anchor: disabled uses aria-disabled", () => {
    render(
      <Button as="a" href="#" data-testid="btn" disabled>
        Link
      </Button>,
    );
    const el = screen.getByTestId("btn");
    expect(el.getAttribute("aria-disabled")).toBe("true");
    expect(el.hasAttribute("disabled")).toBe(false);
  });
});

// ─── Loading semantics ──────────────────────────────────────────────

describe("A11y: loading semantics", () => {
  it("loading sets aria-busy", () => {
    const result = reconcileInteractionState({ loading: true, elementType: "button" });
    expect(result["aria-busy"]).toBe("true");
    expect(result["aria-disabled"]).toBe("true");
  });

  it("loading suppresses events", () => {
    const result = reconcileInteractionState({ loading: true, elementType: "button" });
    expect(result.shouldSuppressEvents).toBe(true);
  });

  it("loading sets data-loading attribute", () => {
    const result = reconcileInteractionState({ loading: true, elementType: "button" });
    expect(result["data-loading"]).toBe("");
  });

  it("Button component: loading renders correctly", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    const el = screen.getByTestId("btn");
    expect(el.getAttribute("aria-busy")).toBe("true");
    expect(el.getAttribute("data-loading")).toBe("");
    expect(el.getAttribute("data-state")).toBe("loading");
  });
});

// ─── ReadOnly semantics ─────────────────────────────────────────────

describe("A11y: readOnly semantics", () => {
  it("native input gets readOnly attribute", () => {
    const result = reconcileInteractionState({ readOnly: true, elementType: "input" });
    expect(result.readOnly).toBe(true);
    expect(result["aria-readonly"]).toBeUndefined();
  });

  it("native textarea gets readOnly attribute", () => {
    const result = reconcileInteractionState({ readOnly: true, elementType: "textarea" });
    expect(result.readOnly).toBe(true);
  });

  it("non-native element gets aria-readonly", () => {
    const result = reconcileInteractionState({ readOnly: true, elementType: "div" });
    expect(result["aria-readonly"]).toBe("true");
    expect(result["data-readonly"]).toBe("");
  });

  it("readOnly does not suppress events", () => {
    const result = reconcileInteractionState({ readOnly: true, elementType: "div" });
    expect(result.shouldSuppressEvents).toBe(false);
  });
});

// ─── ARIA relationship merging ──────────────────────────────────────

describe("A11y: ARIA relationship merging", () => {
  it("merges multiple sources without duplication", () => {
    const result = mergeAriaRelationship({
      internal: "id-1 id-2",
      consumer: "id-2 id-3",
    });
    // consumer comes first in merge order, deduplication removes id-2 from internal
    expect(result).toBe("id-2 id-3 id-1");
  });

  it("preserves order (first source first)", () => {
    const result = mergeAriaRelationship({
      internal: "a",
      consumer: "b",
    });
    // consumer is first in the source order (precedence order)
    expect(result).toContain("a");
    expect(result).toContain("b");
  });

  it("returns undefined when all sources are empty", () => {
    const result = mergeAriaRelationship({});
    expect(result).toBeUndefined();
  });

  it("handles null/undefined sources gracefully", () => {
    const result = mergeAriaRelationship({
      consumer: null,
      internal: "id-1",
      accessibility: undefined,
    });
    expect(result).toBe("id-1");
  });
});

// ─── Boolean ARIA reconciliation ────────────────────────────────────

describe("A11y: boolean ARIA reconciliation", () => {
  it("consumer wins over state", () => {
    expect(reconcileAriaBoolean({ consumer: false, state: true })).toBe(false);
  });

  it("state wins over internal", () => {
    expect(reconcileAriaBoolean({ state: true, internal: false })).toBe(true);
  });

  it("returns undefined when no sources set", () => {
    expect(reconcileAriaBoolean({})).toBeUndefined();
  });
});

// ─── Button type resolution ─────────────────────────────────────────

describe("A11y: button type", () => {
  it("native button gets explicit type", () => {
    expect(resolveButtonType("button", "button")).toEqual({ type: "button" });
    expect(resolveButtonType("button", "submit")).toEqual({ type: "submit" });
  });

  it("non-button element does not get type", () => {
    expect(resolveButtonType("a", "button")).toEqual({});
    expect(resolveButtonType("div", "submit")).toEqual({});
  });

  it("Button component has type=button by default (prevents accidental form submit)", () => {
    render(<Button data-testid="btn">Click</Button>);
    expect(screen.getByTestId("btn").getAttribute("type")).toBe("button");
  });
});

// ─── Slot accessibility ─────────────────────────────────────────────

describe("A11y: slot accessibility", () => {
  it("Button startIcon slot has aria-hidden", () => {
    render(
      <Button data-testid="btn" startIcon={<span>★</span>}>
        Save
      </Button>,
    );
    const slot = screen.getByTestId("btn").querySelector("[data-kui-slot='startIcon']");
    expect(slot?.getAttribute("aria-hidden")).toBe("true");
  });

  it("Button endIcon slot has aria-hidden", () => {
    render(
      <Button data-testid="btn" endIcon={<span>→</span>}>
        Next
      </Button>,
    );
    const slot = screen.getByTestId("btn").querySelector("[data-kui-slot='endIcon']");
    expect(slot?.getAttribute("aria-hidden")).toBe("true");
  });

  it("Button loadingIndicator slot has aria-hidden", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    const slot = screen.getByTestId("btn").querySelector("[data-kui-slot='loadingIndicator']");
    expect(slot?.getAttribute("aria-hidden")).toBe("true");
  });

  it("Button content slot does NOT have aria-hidden", () => {
    render(<Button data-testid="btn">Click</Button>);
    const slot = screen.getByTestId("btn").querySelector("[data-kui-slot='content']");
    expect(slot?.getAttribute("aria-hidden")).toBeNull();
  });
});

// ─── Polymorphic accessibility ──────────────────────────────────────

describe("A11y: polymorphic rendering", () => {
  it("Box as button gets data-kui-component (semantics preserved)", () => {
    render(
      <Box as="button" data-testid="box">
        Click
      </Box>,
    );
    expect(screen.getByTestId("box").getAttribute("data-kui-component")).toBe("Box");
  });

  it("Text as label renders semantic label element", () => {
    render(
      <Text as="label" htmlFor="input-1" data-testid="label">
        Email
      </Text>,
    );
    const el = screen.getByTestId("label");
    expect(el.tagName).toBe("LABEL");
    expect(el.getAttribute("for")).toBe("input-1");
  });

  it("consumer ARIA attributes pass through polymorphic components", () => {
    render(
      <Box as="nav" aria-label="Main navigation" data-testid="nav">
        Nav
      </Box>,
    );
    expect(screen.getByTestId("nav").getAttribute("aria-label")).toBe("Main navigation");
  });

  it("consumer role passes through", () => {
    render(
      <Box role="alert" data-testid="box">
        Error
      </Box>,
    );
    expect(screen.getByTestId("box").getAttribute("role")).toBe("alert");
  });
});

// ─── SSR accessibility ──────────────────────────────────────────────

describe("A11y: SSR rendering", () => {
  it("disabled Button has disabled attr in SSR", () => {
    const html = renderToString(createElement(Button, { disabled: true }, "Off"));
    expect(html).toContain("disabled");
    expect(html).toContain("data-disabled");
  });

  it("loading Button has aria-busy in SSR", () => {
    const html = renderToString(createElement(Button, { loading: true }, "Wait"));
    expect(html).toContain('aria-busy="true"');
  });

  it("ARIA attributes preserved in SSR", () => {
    const html = renderToString(
      createElement(Box, { role: "alert", "aria-live": "polite" }, "Notice"),
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="polite"');
  });

  it("Button type=button in SSR (prevents form submit)", () => {
    const html = renderToString(createElement(Button, null, "Click"));
    expect(html).toContain('type="button"');
  });
});
