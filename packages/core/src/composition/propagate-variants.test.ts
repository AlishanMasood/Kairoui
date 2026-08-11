import { describe, it, expect } from "vitest";
import { defineVariants } from "./define-variants";
import { propagateVariantsToSlots } from "./propagate-variants";
import type { SlotStyleDefinition } from "./style-contract";

// ─── Fixtures ───────────────────────────────────────────────────────

const buttonDef = defineVariants<
  {
    appearance: { solid: Record<string, string>; ghost: Record<string, string> };
    size: { sm: Record<string, string>; md: Record<string, string>; lg: Record<string, string> };
  },
  "root" | "startIcon" | "content" | "endIcon"
>("button", {
  variants: {
    appearance: {
      solid: { background: "var(--bg)" },
      ghost: { background: "transparent" },
    },
    size: {
      sm: { height: "28px" },
      md: { height: "36px" },
      lg: { height: "44px" },
    },
  },
  defaultVariants: { appearance: "solid", size: "md" },
  slotVariants: {
    root: {},
    startIcon: {
      size: {
        sm: { width: "14px", height: "14px" },
        md: { width: "16px", height: "16px" },
        lg: { width: "20px", height: "20px" },
      },
    },
    content: {
      size: {
        sm: { fontSize: "12px" },
        md: { fontSize: "14px" },
        lg: { fontSize: "16px" },
      },
    },
    endIcon: {
      size: {
        sm: { width: "14px", height: "14px" },
        md: { width: "16px", height: "16px" },
        lg: { width: "20px", height: "20px" },
      },
    },
  },
});

const slots = ["root", "startIcon", "content", "endIcon"] as const;

const slotDefinitions: Partial<Record<(typeof slots)[number], SlotStyleDefinition>> = {
  root: {
    base: { display: "inline-flex", gap: "8px" },
    states: { disabled: { opacity: "0.5" } },
  },
  startIcon: {
    base: { display: "flex", flexShrink: "0" },
  },
  content: {
    base: { display: "inline-flex", whiteSpace: "nowrap" },
  },
  endIcon: {
    base: { display: "flex", flexShrink: "0" },
  },
};

// ─── Propagation ────────────────────────────────────────────────────

describe("propagateVariantsToSlots", () => {
  it("resolves root className from variants", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: { appearance: "solid", size: "md" },
      slots,
      slotDefinitions,
    });
    expect(result.rootClassName).toContain("kui-button");
    expect(result.rootClassName).toContain("kui-button--solid");
    expect(result.rootClassName).toContain("kui-button--md");
  });

  it("propagates size variant to icon slots", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: { size: "lg" },
      slots,
      slotDefinitions,
    });
    expect(result.slots.startIcon.styles["width"]).toBe("20px");
    expect(result.slots.startIcon.styles["height"]).toBe("20px");
    expect(result.slots.endIcon.styles["width"]).toBe("20px");
  });

  it("propagates size variant to content slot", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: { size: "sm" },
      slots,
      slotDefinitions,
    });
    expect(result.slots.content.styles["fontSize"]).toBe("12px");
  });

  it("slot base styles preserved alongside variant styles", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: { size: "lg" },
      slots,
      slotDefinitions,
    });
    expect(result.slots.startIcon.styles["display"]).toBe("flex"); // from base
    expect(result.slots.startIcon.styles["flexShrink"]).toBe("0"); // from base
    expect(result.slots.startIcon.styles["width"]).toBe("20px"); // from variant
  });

  it("slot variant does not affect slots that don't declare it", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: { size: "lg" },
      slots,
      slotDefinitions,
    });
    // root slot doesn't have size in slotVariants (empty object)
    expect(result.slots.root.styles["width"]).toBeUndefined();
    expect(result.slots.root.styles["display"]).toBe("inline-flex"); // base preserved
  });

  it("applies owner state to slots with state definitions", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: { size: "md" },
      slots,
      slotDefinitions,
      ownerState: { disabled: true },
    });
    expect(result.slots.root.styles["opacity"]).toBe("0.5"); // root has disabled state
  });

  it("owner state does not affect slots without state definitions", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: {},
      slots,
      slotDefinitions,
      ownerState: { disabled: true },
    });
    expect(result.slots.startIcon.styles["opacity"]).toBeUndefined();
    expect(result.slots.content.styles["opacity"]).toBeUndefined();
  });

  it("uses defaults when no variant props provided", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: {},
      slots,
      slotDefinitions,
    });
    expect(result.variantValues["size"]).toBe("md");
    expect(result.slots.startIcon.styles["width"]).toBe("16px"); // md default
    expect(result.slots.content.styles["fontSize"]).toBe("14px"); // md default
  });

  it("returns variant class names per slot", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: { size: "lg" },
      slots,
      slotDefinitions,
    });
    expect(result.slots.startIcon.classNames).toContain("kui-button__start-icon--lg");
    expect(result.slots.endIcon.classNames).toContain("kui-button__end-icon--lg");
    expect(result.slots.content.classNames).toContain("kui-button__content--lg");
  });

  it("provides resolved variant values", () => {
    const result = propagateVariantsToSlots({
      definition: buttonDef,
      props: { appearance: "ghost", size: "sm" },
      slots,
      slotDefinitions,
    });
    expect(result.variantValues["appearance"]).toBe("ghost");
    expect(result.variantValues["size"]).toBe("sm");
  });
});

// ─── Selective slot consumption ─────────────────────────────────────

describe("slot variant propagation: selective consumption", () => {
  const selectiveDef = defineVariants<
    {
      size: { sm: Record<string, string>; lg: Record<string, string> };
      color: { red: Record<string, string>; blue: Record<string, string> };
    },
    "root" | "badge"
  >("tag", {
    variants: {
      size: { sm: {}, lg: {} },
      color: { red: { background: "red" }, blue: { background: "blue" } },
    },
    defaultVariants: { size: "sm", color: "red" },
    slotVariants: {
      root: {},
      badge: {
        // badge only responds to size, not color
        size: {
          sm: { width: "8px", height: "8px" },
          lg: { width: "12px", height: "12px" },
        },
      },
    },
  });

  it("slot consumes only the variant axes it declares", () => {
    const result = propagateVariantsToSlots({
      definition: selectiveDef,
      props: { size: "lg", color: "blue" },
      slots: ["root", "badge"],
      slotDefinitions: {
        root: { base: { display: "inline-flex" } },
        badge: { base: { borderRadius: "50%" } },
      },
    });

    // badge gets size variant styles
    expect(result.slots.badge.styles["width"]).toBe("12px");
    // badge does NOT get color styles (it doesn't declare color in slotVariants)
    expect(result.slots.badge.styles["background"]).toBeUndefined();
    // root gets color from root-level variant resolution
    // (color is in root variants, not slotVariants)
  });
});
