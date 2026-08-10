import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  ComponentStyleContract,
  CompoundVariantCondition,
  DefaultVariants,
  VariantProps,
  StyleProperties,
  SlotStyleDefinition,
  TokenReference,
  StyleMetadata,
  ConsumerStyleOverrides,
} from "./style-contract";

describe("style contract: type-level tests", () => {
  it("ComponentStyleContract accepts minimal definition", () => {
    const contract: ComponentStyleContract = {
      name: "box",
      slots: { root: { base: { display: "block" } } },
    };
    expect(contract.name).toBe("box");
  });

  it("slots are constrained to defined slot names", () => {
    type ButtonSlots = "root" | "startIcon" | "content";
    const contract: ComponentStyleContract<ButtonSlots> = {
      name: "button",
      slots: {
        root: { base: { display: "flex" } },
        startIcon: { base: { display: "flex" } },
        content: {},
      },
    };
    expect(Object.keys(contract.slots)).toHaveLength(3);
  });

  it("VariantProps generates optional props from variant definition", () => {
    type ButtonVariants = { appearance: "solid" | "ghost"; size: "sm" | "lg" };
    type Props = VariantProps<ButtonVariants>;
    const props: Props = { appearance: "solid" };
    expectTypeOf(props.appearance).toEqualTypeOf<"solid" | "ghost" | undefined>();
    expect(props.appearance).toBe("solid");
  });

  it("CompoundVariantCondition uses Partial variant values", () => {
    type Variants = { appearance: "solid" | "outlined"; color: "primary" | "danger" };
    const compound: CompoundVariantCondition<Variants> = {
      condition: { appearance: "solid", color: "danger" },
      styles: { background: "var(--kui-color-danger)" },
    };
    expect(compound.condition.appearance).toBe("solid");
  });

  it("DefaultVariants makes all axes optional", () => {
    type Variants = { appearance: "solid" | "outlined"; size: "sm" | "md" };
    const defaults: DefaultVariants<Variants> = { appearance: "solid" };
    expect(defaults.appearance).toBe("solid");
    expect(defaults.size).toBeUndefined();
  });

  it("StyleProperties accepts string and TokenReference values", () => {
    const ref: TokenReference = { token: "color.interactive.default", fallback: "#0066cc" };
    const props: StyleProperties = {
      background: "var(--kui-color-primary)",
      color: ref,
    };
    expect(props["background"]).toBe("var(--kui-color-primary)");
    expect(props["color"]).toBe(ref);
  });

  it("SlotStyleDefinition has optional base and states", () => {
    const slot: SlotStyleDefinition = {
      base: { display: "flex", alignItems: "center" },
      states: {
        disabled: { opacity: "0.5" },
        loading: { cursor: "wait" },
      },
    };
    expect(slot.base).toBeDefined();
    expect(slot.states!["disabled"]).toBeDefined();
  });

  it("full button contract type-checks", () => {
    type ButtonSlots = "root" | "startIcon" | "content" | "endIcon";
    type ButtonVariants = {
      appearance: "solid" | "outlined" | "ghost";
      color: "primary" | "secondary" | "danger";
      size: "sm" | "md" | "lg";
    };

    const contract: ComponentStyleContract<ButtonSlots, ButtonVariants> = {
      name: "button",
      customProperties: {
        "--kui-button-bg": { token: "color.interactive.default" },
        "--kui-button-fg": { token: "color.text.onInteractive" },
      },
      slots: {
        root: {
          base: { display: "inline-flex", height: "var(--kui-button-height)" },
          states: { disabled: { opacity: "0.5" } },
        },
        startIcon: { base: { display: "flex" } },
        content: { base: { display: "inline-flex" } },
        endIcon: { base: { display: "flex" } },
      },
      variants: {
        appearance: {
          solid: { background: "var(--kui-button-bg)" },
          outlined: { background: "transparent" },
          ghost: { background: "transparent" },
        },
        color: {
          primary: { "--kui-button-bg": "var(--kui-color-primary)" },
          secondary: { "--kui-button-bg": "var(--kui-color-secondary)" },
          danger: { "--kui-button-bg": "var(--kui-color-danger)" },
        },
        size: {
          sm: { height: "var(--kui-control-height-sm)" },
          md: { height: "var(--kui-control-height-md)" },
          lg: { height: "var(--kui-control-height-lg)" },
        },
      },
      compoundVariants: [
        { condition: { appearance: "solid", color: "danger" }, styles: { color: "white" } },
      ],
      defaultVariants: { appearance: "solid", color: "primary", size: "md" },
    };

    expect(contract.name).toBe("button");
    expect(contract.defaultVariants!.size).toBe("md");
  });

  it("StyleMetadata provides tooling information", () => {
    const meta: StyleMetadata = {
      name: "button",
      slots: ["root", "startIcon", "content"],
      variantAxes: ["appearance", "color", "size"],
      variantValues: {
        appearance: ["solid", "outlined", "ghost"],
        color: ["primary", "secondary"],
        size: ["sm", "md", "lg"],
      },
      hasCompoundVariants: true,
      customPropertyNames: ["--kui-button-bg", "--kui-button-fg"],
    };
    expect(meta.name).toBe("button");
    expect(meta.slots).toHaveLength(3);
  });

  it("ConsumerStyleOverrides provides typed override props", () => {
    type ButtonSlots = "root" | "startIcon" | "content";
    const overrides: ConsumerStyleOverrides<ButtonSlots> = {
      className: "my-button",
      style: { borderRadius: "999px" },
      slotStyles: { content: { className: "my-label" } },
    };
    expect(overrides.className).toBe("my-button");
    expect(overrides.slotStyles!["content"]!.className).toBe("my-label");
  });
});
