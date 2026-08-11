import { describe, it, expect } from "vitest";
import { resolveSlotStyle, resolveAllSlotStyles } from "./resolve-slot-styles";
import type { SlotStyleDefinition } from "./style-contract";
import type { OwnerState } from "./state-styles";

// ─── resolveSlotStyle ───────────────────────────────────────────────

describe("resolveSlotStyle", () => {
  it("returns empty for empty definition", () => {
    const result = resolveSlotStyle({ definition: {} });
    expect(result.styles).toEqual({});
    expect(result.classNames).toEqual([]);
  });

  it("applies base styles", () => {
    const result = resolveSlotStyle({
      definition: { base: { display: "flex", gap: "8px" } },
    });
    expect(result.styles["display"]).toBe("flex");
    expect(result.styles["gap"]).toBe("8px");
  });

  it("variant styles override base per-property", () => {
    const result = resolveSlotStyle({
      definition: { base: { width: "16px", height: "16px" } },
      variantStyles: { width: "20px" },
    });
    expect(result.styles["width"]).toBe("20px"); // variant wins
    expect(result.styles["height"]).toBe("16px"); // base preserved
  });

  it("state styles override variant and base", () => {
    const result = resolveSlotStyle({
      definition: {
        base: { opacity: "1", cursor: "pointer" },
        states: { disabled: { opacity: "0.5", cursor: "not-allowed" } },
      },
      ownerState: { disabled: true },
    });
    expect(result.styles["opacity"]).toBe("0.5"); // state wins
    expect(result.styles["cursor"]).toBe("not-allowed");
  });

  it("precedence: base < variant < state", () => {
    const result = resolveSlotStyle({
      definition: {
        base: { color: "base" },
        states: { hovered: { color: "state" } },
      },
      variantStyles: { color: "variant" },
      ownerState: { hovered: true },
    });
    expect(result.styles["color"]).toBe("state"); // highest priority
  });

  it("no state override when owner state is inactive", () => {
    const result = resolveSlotStyle({
      definition: {
        base: { opacity: "1" },
        states: { disabled: { opacity: "0.5" } },
      },
      ownerState: { disabled: false },
    });
    expect(result.styles["opacity"]).toBe("1");
  });

  it("collects variant class names", () => {
    const result = resolveSlotStyle({
      definition: { base: {} },
      variantClassNames: ["kui-button__icon--sm", "kui-button__icon--primary"],
    });
    expect(result.classNames).toEqual(["kui-button__icon--sm", "kui-button__icon--primary"]);
  });

  it("handles undefined ownerState", () => {
    const result = resolveSlotStyle({
      definition: {
        base: { display: "flex" },
        states: { disabled: { display: "none" } },
      },
    });
    expect(result.styles["display"]).toBe("flex");
  });

  it("handles multiple active states in priority order", () => {
    const result = resolveSlotStyle({
      definition: {
        base: { cursor: "pointer" },
        states: {
          hovered: { cursor: "pointer" },
          loading: { cursor: "wait" },
          disabled: { cursor: "not-allowed" },
        },
      },
      ownerState: { hovered: true, disabled: true },
    });
    expect(result.styles["cursor"]).toBe("not-allowed"); // disabled > hovered
  });
});

// ─── resolveAllSlotStyles ───────────────────────────────────────────

describe("resolveAllSlotStyles", () => {
  const slots = ["root", "startIcon", "content", "endIcon"] as const;
  type Slots = (typeof slots)[number];

  const definitions: Partial<Record<Slots, SlotStyleDefinition>> = {
    root: {
      base: { display: "inline-flex", height: "var(--height)" },
      states: { disabled: { opacity: "0.5" } },
    },
    startIcon: {
      base: { display: "flex", width: "16px" },
    },
    content: {
      base: { display: "inline-flex" },
    },
  };

  it("resolves all declared slots", () => {
    const result = resolveAllSlotStyles(slots, definitions);
    expect(result.root.styles["display"]).toBe("inline-flex");
    expect(result.startIcon.styles["width"]).toBe("16px");
    expect(result.content.styles["display"]).toBe("inline-flex");
  });

  it("returns empty for undeclared slots", () => {
    const result = resolveAllSlotStyles(slots, definitions);
    expect(result.endIcon.styles).toEqual({});
    expect(result.endIcon.classNames).toEqual([]);
  });

  it("applies owner state to all slots with state definitions", () => {
    const state: OwnerState = { disabled: true };
    const result = resolveAllSlotStyles(slots, definitions, { ownerState: state });
    expect(result.root.styles["opacity"]).toBe("0.5"); // root has disabled state
    expect(result.startIcon.styles["opacity"]).toBeUndefined(); // startIcon has no states
  });

  it("applies per-slot variant styles", () => {
    const result = resolveAllSlotStyles(slots, definitions, {
      variantStyles: {
        startIcon: { width: "20px", height: "20px" },
      },
    });
    expect(result.startIcon.styles["width"]).toBe("20px"); // variant overrides base
    expect(result.startIcon.styles["height"]).toBe("20px"); // variant adds new property
  });

  it("applies per-slot variant class names", () => {
    const result = resolveAllSlotStyles(slots, definitions, {
      variantClassNames: {
        startIcon: ["kui-button__start-icon--sm"],
      },
    });
    expect(result.startIcon.classNames).toEqual(["kui-button__start-icon--sm"]);
    expect(result.root.classNames).toEqual([]); // no variant classes for root
  });

  it("handles empty slots array", () => {
    const result = resolveAllSlotStyles([], {});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("combined: base + variant + state", () => {
    const result = resolveAllSlotStyles(
      ["root"] as const,
      {
        root: {
          base: { background: "blue", opacity: "1", cursor: "pointer" },
          states: {
            disabled: { opacity: "0.5", cursor: "not-allowed" },
          },
        },
      },
      {
        variantStyles: { root: { background: "red" } },
        ownerState: { disabled: true },
      },
    );
    expect(result.root.styles["background"]).toBe("red"); // variant overrides base
    expect(result.root.styles["opacity"]).toBe("0.5"); // state overrides
    expect(result.root.styles["cursor"]).toBe("not-allowed"); // state overrides
  });
});

// ─── Slot style patterns ────────────────────────────────────────────

describe("slot style patterns", () => {
  it("icon slot with size variant", () => {
    const result = resolveSlotStyle({
      definition: { base: { display: "flex", width: "1em", height: "1em" } },
      variantStyles: { width: "20px", height: "20px" },
    });
    expect(result.styles["width"]).toBe("20px");
    expect(result.styles["height"]).toBe("20px");
    expect(result.styles["display"]).toBe("flex");
  });

  it("content slot with disabled state", () => {
    const result = resolveSlotStyle({
      definition: {
        base: { display: "inline-flex", whiteSpace: "nowrap" },
        states: { disabled: { color: "var(--kui-color-text-disabled)" } },
      },
      ownerState: { disabled: true },
    });
    expect(result.styles["color"]).toBe("var(--kui-color-text-disabled)");
    expect(result.styles["whiteSpace"]).toBe("nowrap"); // preserved
  });

  it("loading indicator slot only styled when loading", () => {
    const loadingDef: SlotStyleDefinition = {
      base: { display: "none" },
      states: { loading: { display: "flex" } },
    };

    const hidden = resolveSlotStyle({ definition: loadingDef, ownerState: {} });
    expect(hidden.styles["display"]).toBe("none");

    const visible = resolveSlotStyle({ definition: loadingDef, ownerState: { loading: true } });
    expect(visible.styles["display"]).toBe("flex");
  });
});
