import { describe, it, expect, expectTypeOf } from "vitest";
import { defineSlotStyle, defineStylesFromSlots, cssVar, token } from "./define-styles";
import type { SlotStylesFor } from "./define-styles";
import { defineSlots } from "./slot-definitions";
import type { SlotStyleDefinition } from "./style-contract";

// ─── defineSlotStyle ────────────────────────────────────────────────

describe("defineSlotStyle", () => {
  it("creates a frozen slot style with base properties", () => {
    const style = defineSlotStyle({
      base: { display: "flex", alignItems: "center" },
    });
    expect(style.base!["display"]).toBe("flex");
    expect(Object.isFrozen(style)).toBe(true);
  });

  it("creates slot style with state styles", () => {
    const style = defineSlotStyle({
      base: { opacity: "1" },
      states: {
        disabled: { opacity: "0.5", cursor: "not-allowed" },
        loading: { cursor: "wait" },
      },
    });
    expect(style.states!["disabled"]!["opacity"]).toBe("0.5");
    expect(style.states!["loading"]!["cursor"]).toBe("wait");
    expect(Object.isFrozen(style)).toBe(true);
  });

  it("handles empty definition", () => {
    const style = defineSlotStyle({});
    expect(style.base).toBeUndefined();
    expect(style.states).toBeUndefined();
  });

  it("supports token references", () => {
    const style = defineSlotStyle({
      base: {
        height: token("control.height.md", "36px"),
        background: cssVar("color-interactive-default"),
      },
    });
    expect(style.base!["height"]).toEqual({ token: "control.height.md", fallback: "36px" });
    expect(style.base!["background"]).toBe("var(--kui-color-interactive-default)");
  });

  it("returns immutable definition", () => {
    const style = defineSlotStyle({
      base: { display: "block" },
      states: { hover: { background: "gray" } },
    });
    expect(Object.isFrozen(style)).toBe(true);
    expect(Object.isFrozen(style.base)).toBe(true);
    expect(Object.isFrozen(style.states)).toBe(true);
  });
});

// ─── defineStylesFromSlots ──────────────────────────────────────────

describe("defineStylesFromSlots", () => {
  const buttonSlots = defineSlots({
    root: { defaultElement: "button", required: true, public: true },
    startIcon: { defaultElement: "span", required: false, public: true },
    content: { defaultElement: "span", required: true, public: true },
    endIcon: { defaultElement: "span", required: false, public: true },
    loadingIndicator: { defaultElement: "span", required: false, public: false },
  });

  it("creates style contract matching slot definitions", () => {
    const contract = defineStylesFromSlots("button", buttonSlots, {
      root: {
        base: {
          display: "inline-flex",
          alignItems: "center",
          height: cssVar("control-height-md"),
        },
        states: {
          disabled: { opacity: "0.5" },
        },
      },
      startIcon: { base: { display: "flex" } },
      content: { base: { display: "inline-flex" } },
      endIcon: { base: { display: "flex" } },
      loadingIndicator: {},
    });

    expect(contract.name).toBe("button");
    expect(contract.slots.root.base!["display"]).toBe("inline-flex");
    expect(contract.slots.startIcon.base!["display"]).toBe("flex");
    expect(contract.slots.loadingIndicator.base).toBeUndefined();
  });

  it("returns frozen contract", () => {
    const contract = defineStylesFromSlots("card", buttonSlots, {
      root: { base: { display: "flex" } },
      startIcon: {},
      content: {},
      endIcon: {},
      loadingIndicator: {},
    });
    expect(Object.isFrozen(contract)).toBe(true);
    expect(Object.isFrozen(contract.slots)).toBe(true);
  });

  it("handles optional slot styles as empty objects", () => {
    const simpleSlots = defineSlots({
      root: { defaultElement: "div", required: true, public: true },
      icon: { defaultElement: "span", required: false, public: true },
    });

    const contract = defineStylesFromSlots("simple", simpleSlots, {
      root: { base: { display: "block" } },
      icon: {},
    });

    expect(contract.slots.icon.base).toBeUndefined();
  });
});

// ─── Slot style patterns ────────────────────────────────────────────

describe("slot style patterns", () => {
  it("root slot with structural base styles", () => {
    const style = defineSlotStyle({
      base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: cssVar("space-inline-sm"),
        height: cssVar("control-height-md"),
        padding: `0 ${cssVar("space-inline-md")}`,
        borderRadius: cssVar("border-radius-sm"),
        border: "none",
        cursor: "pointer",
        userSelect: "none",
      },
    });
    expect(Object.keys(style.base!).length).toBeGreaterThan(5);
  });

  it("icon slot with aria-hidden and sizing", () => {
    const style = defineSlotStyle({
      base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1em",
        height: "1em",
        flexShrink: "0",
      },
    });
    expect(style.base!["flexShrink"]).toBe("0");
  });

  it("content slot with text styling", () => {
    const style = defineSlotStyle({
      base: {
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    });
    expect(style.base!["textOverflow"]).toBe("ellipsis");
  });

  it("indicator slot with positioning", () => {
    const style = defineSlotStyle({
      base: {
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    });
    expect(style.base!["position"]).toBe("absolute");
  });

  it("state styles for disabled, loading, and hover", () => {
    const style = defineSlotStyle({
      base: { opacity: "1", cursor: "pointer" },
      states: {
        disabled: { opacity: "0.5", cursor: "not-allowed", pointerEvents: "none" },
        loading: { cursor: "wait" },
        hover: { background: cssVar("color-interactive-hover") },
        active: { background: cssVar("color-interactive-pressed") },
        "focus-visible": { outline: `2px solid ${cssVar("focus-ring-color")}` },
      },
    });
    expect(Object.keys(style.states!)).toHaveLength(5);
  });
});

// ─── Type-level tests ───────────────────────────────────────────────

describe("slot style types", () => {
  it("defineSlotStyle returns SlotStyleDefinition", () => {
    const style = defineSlotStyle({ base: { display: "flex" } });
    expectTypeOf(style).toEqualTypeOf<Readonly<SlotStyleDefinition>>();
  });

  it("SlotStylesFor extracts correct slot names", () => {
    const slots = defineSlots({
      root: { defaultElement: "div", required: true, public: true },
      header: { defaultElement: "header", required: false, public: true },
    });
    type Styles = SlotStylesFor<typeof slots>;

    // Type-checks: must include both slot names
    const styles: Styles = {
      root: { base: { display: "flex" } },
      header: {},
    };
    expect(styles.root.base!["display"]).toBe("flex");
    expect(Object.keys(slots)).toHaveLength(2);
  });

  it("defineStylesFromSlots enforces all slot names", () => {
    const slots = defineSlots({
      root: { defaultElement: "div", required: true, public: true },
      body: { defaultElement: "main", required: true, public: true },
    });

    // This compiles only if both 'root' and 'body' are provided
    const contract = defineStylesFromSlots("card", slots, {
      root: { base: { display: "flex" } },
      body: { base: { flex: "1" } },
    });
    expect(contract.slots.root.base!["display"]).toBe("flex");
    expect(contract.slots.body.base!["flex"]).toBe("1");
  });
});
