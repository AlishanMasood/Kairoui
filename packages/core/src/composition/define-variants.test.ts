import { describe, it, expect, expectTypeOf } from "vitest";
import { defineVariants } from "./define-variants";
import type { VariantPropsFrom } from "./define-variants";

// ─── defineVariants ─────────────────────────────────────────────────

describe("defineVariants", () => {
  it("creates a basic variant definition", () => {
    const def = defineVariants("button", {
      variants: {
        appearance: {
          solid: { background: "var(--kui-button-bg)" },
          outlined: { background: "transparent" },
          ghost: { background: "transparent" },
        },
        size: {
          sm: { height: "var(--kui-control-height-sm)" },
          md: { height: "var(--kui-control-height-md)" },
          lg: { height: "var(--kui-control-height-lg)" },
        },
      },
      defaultVariants: {
        appearance: "solid",
        size: "md",
      },
    });

    expect(def.componentName).toBe("button");
    expect(def.axisNames).toEqual(["appearance", "size"]);
    expect(def.defaultVariants.appearance).toBe("solid");
    expect(def.defaultVariants.size).toBe("md");
  });

  it("extracts axis values sorted alphabetically", () => {
    const def = defineVariants("button", {
      variants: {
        color: {
          primary: {},
          danger: {},
          secondary: {},
        },
      },
      defaultVariants: { color: "primary" },
    });

    expect(def.axisValues.color).toEqual(["danger", "primary", "secondary"]);
  });

  it("preserves compound variants", () => {
    const def = defineVariants("button", {
      variants: {
        appearance: { solid: {}, outlined: {} },
        color: { primary: {}, danger: {} },
      },
      defaultVariants: { appearance: "solid", color: "primary" },
      compoundVariants: [
        {
          condition: { appearance: "solid", color: "danger" },
          styles: { color: "white" },
        },
      ],
    });

    expect(def.compoundVariants).toHaveLength(1);
    expect(def.compoundVariants[0]!.condition).toEqual({
      appearance: "solid",
      color: "danger",
    });
  });

  it("preserves slot variants", () => {
    const def = defineVariants<
      { size: { sm: Record<string, never>; md: Record<string, never> } },
      "startIcon"
    >("button", {
      variants: {
        size: { sm: {}, md: {} },
      },
      defaultVariants: { size: "md" },
      slotVariants: {
        startIcon: {
          size: {
            sm: { width: "14px", height: "14px" },
            md: { width: "16px", height: "16px" },
          },
        },
      },
    });

    const iconStyles = def.slotVariants?.["startIcon"]?.["size"]?.["sm"];
    expect(iconStyles).toEqual({
      width: "14px",
      height: "14px",
    });
  });

  it("returns frozen definition", () => {
    const def = defineVariants("box", {
      variants: { display: { block: {}, flex: {} } },
      defaultVariants: { display: "block" },
    });

    expect(Object.isFrozen(def)).toBe(true);
    expect(Object.isFrozen(def.compoundVariants)).toBe(true);
    expect(Object.isFrozen(def.axisNames)).toBe(true);
    expect(Object.isFrozen(def.axisValues)).toBe(true);
  });

  it("handles single-axis definition", () => {
    const def = defineVariants("badge", {
      variants: {
        color: { info: {}, success: {}, warning: {}, error: {} },
      },
      defaultVariants: { color: "info" },
    });

    expect(def.axisNames).toEqual(["color"]);
    expect(def.axisValues.color).toEqual(["error", "info", "success", "warning"]);
  });

  it("handles empty compound variants", () => {
    const def = defineVariants("chip", {
      variants: { size: { sm: {}, md: {} } },
      defaultVariants: { size: "sm" },
    });

    expect(def.compoundVariants).toEqual([]);
  });

  it("handles undefined slot variants", () => {
    const def = defineVariants("chip", {
      variants: { size: { sm: {}, md: {} } },
      defaultVariants: { size: "sm" },
    });

    expect(def.slotVariants).toBeUndefined();
  });
});

// ─── Type-level tests ───────────────────────────────────────────────

describe("variant definition types", () => {
  it("VariantPropsFrom generates optional props", () => {
    type Axes = {
      appearance: { solid: Record<string, never>; outlined: Record<string, never> };
      size: { sm: Record<string, never>; md: Record<string, never>; lg: Record<string, never> };
    };
    type Props = VariantPropsFrom<Axes>;

    expectTypeOf<Props>().toHaveProperty("appearance");
    expectTypeOf<Props>().toHaveProperty("size");

    const props: Props = { appearance: "solid" };
    expect(props.appearance).toBe("solid");
    expect(props.size).toBeUndefined();
  });

  it("defaultVariants requires all axes", () => {
    // This compiles — all axes have defaults
    const def = defineVariants("test", {
      variants: {
        a: { x: {}, y: {} },
        b: { m: {}, n: {} },
      },
      defaultVariants: { a: "x", b: "m" },
    });
    expect(def.defaultVariants.a).toBe("x");
    expect(def.defaultVariants.b).toBe("m");
  });

  it("compound conditions reference valid axes and values", () => {
    const def = defineVariants("test", {
      variants: {
        color: { red: {}, blue: {} },
        size: { sm: {}, lg: {} },
      },
      defaultVariants: { color: "red", size: "sm" },
      compoundVariants: [
        { condition: { color: "red", size: "lg" }, styles: { fontWeight: "bold" } },
      ],
    });
    expect(def.compoundVariants).toHaveLength(1);
  });

  it("style properties accept string values", () => {
    const def = defineVariants("test", {
      variants: {
        variant: {
          primary: { background: "var(--kui-color-primary)", color: "white" },
          secondary: { background: "transparent", border: "1px solid currentColor" },
        },
      },
      defaultVariants: { variant: "primary" },
    });
    expect(def.variants.variant.primary["background"]).toBe("var(--kui-color-primary)");
  });

  it("VariantDefinition preserves literal axis types", () => {
    const def = defineVariants("button", {
      variants: {
        appearance: { solid: {}, ghost: {} },
      },
      defaultVariants: { appearance: "solid" },
    });

    // TypeScript should infer literal types for axis names
    expectTypeOf(def.defaultVariants.appearance).toEqualTypeOf<"solid" | "ghost">();
  });
});
