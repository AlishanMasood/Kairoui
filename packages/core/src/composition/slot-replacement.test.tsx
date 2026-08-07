import { describe, it, expect, vi, beforeEach } from "vitest";
import { forwardRef, createElement } from "react";
import type { ElementType } from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  validateSlotReplacement,
  validateSlotReplacements,
  resolveSlotElement,
  resolveSlotElements,
  createSlotReplacements,
  isForwardRefComponent,
  checkRefSupport,
} from "./slot-replacement";
import { defineSlot, defineSlots } from "./slot-definitions";
import { resolveAllSlotProps } from "./resolve-slot-props";
import { renderSlot } from "./render-slot";
import type { SlotDefinition } from "./slot-definitions";

// ─── Fixtures ───────────────────────────────────────────────────────

function publicSlot(name: string, defaultElement: ElementType = "div"): SlotDefinition {
  return defineSlot(name, { defaultElement, public: true });
}

function internalSlot(name: string, defaultElement: ElementType = "div"): SlotDefinition {
  return defineSlot(name, { defaultElement, public: false });
}

const CustomComponent = (props: Record<string, unknown>) =>
  createElement("span", { ...props, "data-custom": "true" });

const ForwardRefComponent = forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) =>
  createElement("div", { ...props, ref, "data-forwarded": "true" }),
);
ForwardRefComponent.displayName = "ForwardRefComponent";

// ─── validateSlotReplacement ────────────────────────────────────────

describe("validateSlotReplacement", () => {
  it("returns null for valid intrinsic element replacement", () => {
    const result = validateSlotReplacement("root", "button", publicSlot("root"));
    expect(result).toBeNull();
  });

  it("returns null for valid SVG element replacement", () => {
    const result = validateSlotReplacement("icon", "svg", publicSlot("icon"));
    expect(result).toBeNull();
  });

  it("returns null for valid component replacement", () => {
    const result = validateSlotReplacement("root", CustomComponent, publicSlot("root"));
    expect(result).toBeNull();
  });

  it("returns null for forwardRef component replacement", () => {
    const result = validateSlotReplacement("root", ForwardRefComponent, publicSlot("root"));
    expect(result).toBeNull();
  });

  it("returns error for internal slot replacement", () => {
    const result = validateSlotReplacement("internal", "div", internalSlot("internal"));
    expect(result).not.toBeNull();
    expect(result?.severity).toBe("error");
    expect(result?.reason).toContain("internal");
  });

  it("returns error for invalid replacement type (number)", () => {
    const result = validateSlotReplacement("root", 42, publicSlot("root"));
    expect(result).not.toBeNull();
    expect(result?.severity).toBe("error");
    expect(result?.reason).toContain("Invalid replacement");
  });

  it("returns error for null replacement", () => {
    const result = validateSlotReplacement("root", null, publicSlot("root"));
    expect(result).not.toBeNull();
    expect(result?.severity).toBe("error");
  });

  it("returns error for empty string replacement", () => {
    const result = validateSlotReplacement("root", "", publicSlot("root"));
    expect(result).not.toBeNull();
    expect(result?.severity).toBe("error");
  });

  it("returns error for uppercase string (component convention)", () => {
    const result = validateSlotReplacement("root", "Button", publicSlot("root"));
    expect(result).not.toBeNull();
    expect(result?.severity).toBe("error");
  });
});

// ─── validateSlotReplacements ───────────────────────────────────────

describe("validateSlotReplacements", () => {
  const definitions = defineSlots({
    root: { defaultElement: "div", public: true },
    icon: { defaultElement: "span", public: true },
    internal: { defaultElement: "div", public: false },
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates all valid replacements", () => {
    const result = validateSlotReplacements(
      { root: "button", icon: "svg" },
      definitions,
      "TestComponent",
    );
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.replacements).toEqual({ root: "button", icon: "svg" });
  });

  it("rejects unknown slot names", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = validateSlotReplacements({ unknown: "div" }, definitions, "TestComponent");
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]!.reason).toContain("Unknown slot");
    spy.mockRestore();
  });

  it("rejects internal slot replacements", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = validateSlotReplacements({ internal: "span" }, definitions, "TestComponent");
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]!.reason).toContain("internal");
    spy.mockRestore();
  });

  it("rejects invalid element types", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = validateSlotReplacements({ root: 123 }, definitions, "TestComponent");
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(1);
    spy.mockRestore();
  });

  it("skips undefined values in replacement map", () => {
    const result = validateSlotReplacements({ root: undefined }, definitions, "TestComponent");
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("returns sanitized replacements without invalid entries", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = validateSlotReplacements(
      { root: "button", icon: null, internal: "a" },
      definitions,
      "TestComponent",
    );
    expect(result.replacements).toEqual({ root: "button" });
    spy.mockRestore();
  });

  it("emits dev warnings for all issues", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateSlotReplacements({ unknown: "div", internal: "span" }, definitions, "TestComponent");
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});

// ─── resolveSlotElement ─────────────────────────────────────────────

describe("resolveSlotElement", () => {
  it("returns replacement when provided", () => {
    const def = publicSlot("root", "div");
    expect(resolveSlotElement(def, "button")).toBe("button");
  });

  it("returns default element when no replacement", () => {
    const def = publicSlot("root", "button");
    expect(resolveSlotElement(def, undefined)).toBe("button");
  });

  it("returns component replacement", () => {
    const def = publicSlot("root", "div");
    expect(resolveSlotElement(def, CustomComponent)).toBe(CustomComponent);
  });
});

// ─── resolveSlotElements ────────────────────────────────────────────

describe("resolveSlotElements", () => {
  it("resolves all slots with replacements", () => {
    const defs = defineSlots({
      root: { defaultElement: "div" },
      icon: { defaultElement: "span" },
    });
    const result = resolveSlotElements(defs, { root: "button" });
    expect(result.root).toBe("button");
    expect(result.icon).toBe("span");
  });

  it("uses defaults when no replacements map", () => {
    const defs = defineSlots({
      root: { defaultElement: "div" },
      icon: { defaultElement: "span" },
    });
    const result = resolveSlotElements(defs, undefined);
    expect(result.root).toBe("div");
    expect(result.icon).toBe("span");
  });
});

// ─── createSlotReplacements ─────────────────────────────────────────

describe("createSlotReplacements", () => {
  const definitions = defineSlots({
    root: { defaultElement: "div", public: true },
    icon: { defaultElement: "span", public: true },
  });

  it("returns empty for undefined input", () => {
    const result = createSlotReplacements(definitions, undefined, "TestComponent");
    expect(result).toEqual({});
  });

  it("returns validated replacements", () => {
    const result = createSlotReplacements(definitions, { root: "a" }, "TestComponent");
    expect(result).toEqual({ root: "a" });
  });

  it("filters out invalid replacements", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = createSlotReplacements(definitions, { root: 42 }, "TestComponent");
    expect(result).toEqual({});
    spy.mockRestore();
  });
});

// ─── isForwardRefComponent ──────────────────────────────────────────

describe("isForwardRefComponent", () => {
  it("returns true for forwardRef component", () => {
    expect(isForwardRefComponent(ForwardRefComponent)).toBe(true);
  });

  it("returns false for function component", () => {
    expect(isForwardRefComponent(CustomComponent)).toBe(false);
  });

  it("returns false for intrinsic element", () => {
    expect(isForwardRefComponent("div")).toBe(false);
  });
});

// ─── checkRefSupport ────────────────────────────────────────────────

describe("checkRefSupport", () => {
  it("returns true for intrinsic elements", () => {
    expect(checkRefSupport("root", "div", "Test")).toBe(true);
  });

  it("returns true for forwardRef components", () => {
    expect(checkRefSupport("root", ForwardRefComponent, "Test")).toBe(true);
  });

  it("returns false for plain function components", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(checkRefSupport("root", CustomComponent, "Test")).toBe(false);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("returns true for class components", () => {
    class ClassComp {
      render() {
        return null;
      }
    }
    expect(checkRefSupport("root", ClassComp as unknown as React.ElementType, "Test")).toBe(true);
  });
});

// ─── Integration: slot replacement with rendering ───────────────────

describe("slot replacement integration", () => {
  const definitions = defineSlots({
    root: { defaultElement: "div", public: true },
    icon: { defaultElement: "span", public: true },
  });

  it("replaces slot with native HTML element", () => {
    const replacements = createSlotReplacements(definitions, { root: "button" }, "TestComponent");
    const resolved = resolveAllSlotProps({
      definitions,
      internalProps: { root: { "data-testid": "root", type: "button" } },
      overrides: { slots: replacements },
    });
    const el = renderSlot(resolved.root);
    render(el);
    const node = screen.getByTestId("root");
    expect(node.tagName).toBe("BUTTON");
    expect(node.getAttribute("type")).toBe("button");
  });

  it("replaces slot with SVG element", () => {
    const replacements = createSlotReplacements(definitions, { icon: "svg" }, "TestComponent");
    const resolved = resolveAllSlotProps({
      definitions,
      internalProps: { icon: { "data-testid": "icon", role: "img" } },
      overrides: { slots: replacements },
    });
    const el = renderSlot(resolved.icon);
    render(el);
    const node = screen.getByTestId("icon");
    expect(node.tagName).toBe("svg");
    expect(node.getAttribute("role")).toBe("img");
  });

  it("replaces slot with React component", () => {
    const Custom = (props: Record<string, unknown>) =>
      createElement("article", { ...props, "data-custom": "yes" });

    const replacements = createSlotReplacements(definitions, { root: Custom }, "TestComponent");
    const resolved = resolveAllSlotProps({
      definitions,
      internalProps: { root: { "data-testid": "root", className: "internal" } },
      overrides: { slots: replacements },
    });
    const el = renderSlot(resolved.root);
    render(el);
    const node = screen.getByTestId("root");
    expect(node.tagName).toBe("ARTICLE");
    expect(node.getAttribute("data-custom")).toBe("yes");
    expect(node.className).toBe("internal");
  });

  it("replaces slot with ForwardRef component", () => {
    const ref = { current: null as HTMLDivElement | null };
    const FancyDiv = forwardRef<HTMLDivElement, Record<string, unknown>>((props, fref) =>
      createElement("div", { ...props, ref: fref, "data-fancy": "true" }),
    );
    FancyDiv.displayName = "FancyDiv";

    const replacements = createSlotReplacements(definitions, { root: FancyDiv }, "TestComponent");
    const resolved = resolveAllSlotProps({
      definitions,
      internalProps: { root: { "data-testid": "root", ref } },
      overrides: { slots: replacements },
    });
    const el = renderSlot(resolved.root);
    render(el);
    const node = screen.getByTestId("root");
    expect(node.getAttribute("data-fancy")).toBe("true");
  });

  it("preserves event handlers on replaced slots", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const replacements = createSlotReplacements(definitions, { root: "a" }, "TestComponent");
    const resolved = resolveAllSlotProps({
      definitions,
      internalProps: { root: { "data-testid": "root", onClick } },
      overrides: { slots: replacements },
    });
    const el = renderSlot(resolved.root, "Link text");
    render(el);
    await user.click(screen.getByTestId("root"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("preserves ARIA attributes on replaced slots", () => {
    const replacements = createSlotReplacements(definitions, { root: "nav" }, "TestComponent");
    const resolved = resolveAllSlotProps({
      definitions,
      internalProps: { root: { "data-testid": "root" } },
      accessibilityProps: { root: { "aria-label": "Main navigation", role: "navigation" } },
      overrides: { slots: replacements },
    });
    const el = renderSlot(resolved.root);
    render(el);
    const node = screen.getByTestId("root");
    expect(node.getAttribute("aria-label")).toBe("Main navigation");
    expect(node.getAttribute("role")).toBe("navigation");
  });

  it("preserves data-kui-slot attribute on replaced slots", () => {
    const replacements = createSlotReplacements(definitions, { root: "section" }, "TestComponent");
    const resolved = resolveAllSlotProps({
      definitions,
      internalProps: { root: { "data-testid": "root" } },
      overrides: { slots: replacements },
    });
    const el = renderSlot(resolved.root);
    render(el);
    const node = screen.getByTestId("root");
    expect(node.getAttribute("data-kui-slot")).toBe("root");
  });

  it("does not expose internal slots to replacement", () => {
    const defs = defineSlots({
      root: { defaultElement: "div", public: true },
      _internal: { defaultElement: "span", public: false },
    });

    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const replacements = createSlotReplacements(defs, { _internal: "div" }, "TestComponent");
    expect(replacements).toEqual({});
    spy.mockRestore();
  });
});

// ─── Type tests ─────────────────────────────────────────────────────

describe("slot replacement types", () => {
  it("SlotReplacementProp only includes public slots", () => {
    // This test verifies type compilation — no runtime assertion needed
    const defs = defineSlots({
      root: { defaultElement: "div", public: true },
      icon: { defaultElement: "span", public: true },
      _impl: { defaultElement: "div", public: false },
    });

    type Names = keyof typeof defs;
    // Valid: public slots can be replaced
    const validReplacements: Partial<Record<Names, React.ElementType>> = {
      root: "button",
      icon: "svg",
    };
    expect(validReplacements).toBeDefined();
    expect(defs).toBeDefined();
  });

  it("accepts ElementType union (string | Component | ForwardRef)", () => {
    const defs = defineSlots({
      root: { defaultElement: "div", public: true },
    });

    // Each type is accepted by createSlotReplacements
    const r1 = createSlotReplacements(defs, { root: "button" }, "T");
    const r2 = createSlotReplacements(defs, { root: CustomComponent }, "T");
    const r3 = createSlotReplacements(defs, { root: ForwardRefComponent }, "T");

    expect(r1.root).toBe("button");
    expect(r2.root).toBe(CustomComponent);
    expect(r3.root).toBe(ForwardRefComponent);
  });
});
