import { describe, it, expect } from "vitest";
import { defineVariants } from "./define-variants";
import { resolveVariants } from "./resolve-variants";

// ─── Fixtures ───────────────────────────────────────────────────────

const buttonDef = defineVariants("button", {
  variants: {
    appearance: {
      solid: { background: "var(--bg)" },
      ghost: { background: "transparent" },
    },
    fullWidth: {
      true: { width: "100%", display: "flex" },
      false: { width: "auto" },
    },
  },
  defaultVariants: { appearance: "solid", fullWidth: "false" },
});

const iconDef = defineVariants("icon-button", {
  variants: {
    rounded: {
      true: { borderRadius: "50%" },
      false: {},
    },
    size: { sm: { height: "28px" }, md: { height: "36px" } },
  },
  defaultVariants: { rounded: "false", size: "md" },
});

// ─── Boolean variant resolution ─────────────────────────────────────

describe("boolean variants: resolution", () => {
  it("resolves true value", () => {
    const result = resolveVariants(buttonDef, { fullWidth: "true" });
    expect(result.values.fullWidth).toBe("true");
    expect(result.styles["width"]).toBe("100%");
  });

  it("resolves false value", () => {
    const result = resolveVariants(buttonDef, { fullWidth: "false" });
    expect(result.values.fullWidth).toBe("false");
    expect(result.styles["width"]).toBe("auto");
  });

  it("resolves boolean true prop", () => {
    const result = resolveVariants(buttonDef, { fullWidth: true as unknown as "true" });
    expect(result.values.fullWidth).toBe("true");
    expect(result.styles["width"]).toBe("100%");
  });

  it("resolves boolean false prop", () => {
    const result = resolveVariants(buttonDef, { fullWidth: false as unknown as "false" });
    expect(result.values.fullWidth).toBe("false");
  });

  it("defaults to false when not provided", () => {
    const result = resolveVariants(buttonDef, {});
    expect(result.values.fullWidth).toBe("false");
  });

  it("defaults to false for undefined", () => {
    const result = resolveVariants(buttonDef, { fullWidth: undefined });
    expect(result.values.fullWidth).toBe("false");
  });
});

// ─── Boolean variant class names ────────────────────────────────────

describe("boolean variants: class names", () => {
  it("generates axis-name class when true", () => {
    const result = resolveVariants(buttonDef, { fullWidth: "true" });
    expect(result.classNames).toContain("kui-button--full-width");
    expect(result.classNames).not.toContain("kui-button--true");
  });

  it("does not generate class when false", () => {
    const result = resolveVariants(buttonDef, { fullWidth: "false" });
    expect(result.classNames).not.toContain("kui-button--full-width");
    expect(result.classNames).not.toContain("kui-button--false");
  });

  it("base class always present regardless of boolean value", () => {
    const trueResult = resolveVariants(buttonDef, { fullWidth: "true" });
    const falseResult = resolveVariants(buttonDef, { fullWidth: "false" });
    expect(trueResult.classNames).toContain("kui-button");
    expect(falseResult.classNames).toContain("kui-button");
  });

  it("boolean class combined with string variant class", () => {
    const result = resolveVariants(buttonDef, { appearance: "ghost", fullWidth: "true" });
    expect(result.className).toContain("kui-button");
    expect(result.className).toContain("kui-button--ghost");
    expect(result.className).toContain("kui-button--full-width");
  });
});

// ─── Boolean + string variant interaction ───────────────────────────

describe("boolean variants: interaction with string variants", () => {
  it("both boolean and string axes resolved together", () => {
    const result = resolveVariants(iconDef, { rounded: "true", size: "sm" });
    expect(result.values.rounded).toBe("true");
    expect(result.values.size).toBe("sm");
    expect(result.styles["borderRadius"]).toBe("50%");
    expect(result.styles["height"]).toBe("28px");
  });

  it("string axis still gets standard class name", () => {
    const result = resolveVariants(iconDef, { rounded: "true", size: "sm" });
    expect(result.classNames).toContain("kui-icon-button--rounded");
    expect(result.classNames).toContain("kui-icon-button--sm");
  });

  it("boolean false + string variant", () => {
    const result = resolveVariants(iconDef, { rounded: "false", size: "md" });
    expect(result.classNames).not.toContain("kui-icon-button--rounded");
    expect(result.classNames).toContain("kui-icon-button--md");
  });
});

// ─── Boolean variant with compounds ─────────────────────────────────

describe("boolean variants: compound interaction", () => {
  const def = defineVariants("chip", {
    variants: {
      clickable: { true: { cursor: "pointer" }, false: {} },
      color: { info: {}, error: {} },
    },
    defaultVariants: { clickable: "false", color: "info" },
    compoundVariants: [
      {
        condition: { clickable: "true", color: "error" },
        styles: { outline: "2px solid red" },
      },
    ],
  });

  it("compound matches boolean true condition", () => {
    const result = resolveVariants(def, { clickable: "true", color: "error" });
    expect(result.styles["outline"]).toBe("2px solid red");
    expect(result.styles["cursor"]).toBe("pointer");
  });

  it("compound does not match boolean false", () => {
    const result = resolveVariants(def, { clickable: "false", color: "error" });
    expect(result.styles["outline"]).toBeUndefined();
  });
});

// ─── Determinism ────────────────────────────────────────────────────

describe("boolean variants: determinism", () => {
  it("same input always produces same output", () => {
    const a = resolveVariants(buttonDef, { fullWidth: "true" });
    const b = resolveVariants(buttonDef, { fullWidth: "true" });
    expect(a.className).toBe(b.className);
    expect(a.styles).toEqual(b.styles);
  });

  it("class name order is consistent", () => {
    const result = resolveVariants(buttonDef, { appearance: "ghost", fullWidth: "true" });
    const parts = result.className.split(" ");
    expect(parts[0]).toBe("kui-button"); // base
    // Axes alphabetical: appearance, fullWidth
    expect(parts[1]).toBe("kui-button--ghost"); // appearance (string)
    expect(parts[2]).toBe("kui-button--full-width"); // fullWidth (boolean true)
  });
});
