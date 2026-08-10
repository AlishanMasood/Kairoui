import { describe, it, expect, vi, afterEach } from "vitest";
import { defineVariants } from "./define-variants";
import { resolveVariants, resolveSlotVariants } from "./resolve-variants";

afterEach(() => vi.restoreAllMocks());

// ─── Test fixtures ──────────────────────────────────────────────────

const buttonDef = defineVariants("button", {
  variants: {
    appearance: {
      solid: { background: "var(--kui-button-bg)" },
      outlined: { background: "transparent", border: "1px solid currentColor" },
      ghost: { background: "transparent" },
    },
    color: {
      primary: { "--kui-button-bg": "var(--kui-color-primary)" },
      danger: { "--kui-button-bg": "var(--kui-color-danger)" },
    },
    size: {
      sm: { height: "var(--kui-control-height-sm)" },
      md: { height: "var(--kui-control-height-md)" },
      lg: { height: "var(--kui-control-height-lg)" },
    },
  },
  defaultVariants: { appearance: "solid", color: "primary", size: "md" },
});

// ─── resolveVariants ────────────────────────────────────────────────

describe("resolveVariants", () => {
  it("applies defaults when no props provided", () => {
    const result = resolveVariants(buttonDef, {});
    expect(result.values.appearance).toBe("solid");
    expect(result.values.color).toBe("primary");
    expect(result.values.size).toBe("md");
  });

  it("uses consumer value when provided", () => {
    const result = resolveVariants(buttonDef, { appearance: "ghost", size: "lg" });
    expect(result.values.appearance).toBe("ghost");
    expect(result.values.color).toBe("primary"); // default
    expect(result.values.size).toBe("lg");
  });

  it("generates base + variant class names", () => {
    const result = resolveVariants(buttonDef, {
      appearance: "solid",
      color: "primary",
      size: "md",
    });
    expect(result.classNames).toContain("kui-button");
    expect(result.classNames).toContain("kui-button--solid");
    expect(result.classNames).toContain("kui-button--primary");
    expect(result.classNames).toContain("kui-button--md");
  });

  it("generates combined className string", () => {
    const result = resolveVariants(buttonDef, {});
    expect(result.className).toContain("kui-button");
    expect(result.className).toContain("kui-button--solid");
  });

  it("className has deterministic order (alphabetical axes)", () => {
    const result = resolveVariants(buttonDef, {
      size: "lg",
      appearance: "ghost",
      color: "danger",
    });
    // Axes are sorted: appearance, color, size
    const parts = result.className.split(" ");
    expect(parts[0]).toBe("kui-button");
    expect(parts[1]).toBe("kui-button--ghost"); // appearance
    expect(parts[2]).toBe("kui-button--danger"); // color
    expect(parts[3]).toBe("kui-button--lg"); // size
  });

  it("merges styles from active variant values", () => {
    const result = resolveVariants(buttonDef, { appearance: "solid", size: "md" });
    expect(result.styles["background"]).toBe("var(--kui-button-bg)");
    expect(result.styles["height"]).toBe("var(--kui-control-height-md)");
  });

  it("later axis styles override earlier for same property", () => {
    // If two axes set the same property, axis order determines winner
    const def = defineVariants("test", {
      variants: {
        a: { x: { color: "red" } },
        b: { y: { color: "blue" } },
      },
      defaultVariants: { a: "x", b: "y" },
    });
    const result = resolveVariants(def, {});
    // 'b' comes after 'a' alphabetically, so 'b' wins
    expect(result.styles["color"]).toBe("blue");
  });

  it("warns for invalid variant values", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = resolveVariants(buttonDef, {
      appearance: "invalid" as "solid",
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Invalid variant value"));
    // Falls back to default
    expect(result.values.appearance).toBe("solid");
    spy.mockRestore();
  });

  it("handles undefined prop values (uses default)", () => {
    const result = resolveVariants(buttonDef, { appearance: undefined });
    expect(result.values.appearance).toBe("solid");
  });

  it("handles null prop values (uses default)", () => {
    const result = resolveVariants(buttonDef, { appearance: null as unknown as undefined });
    expect(result.values.appearance).toBe("solid");
  });
});

// ─── resolveSlotVariants ────────────────────────────────────────────

describe("resolveSlotVariants", () => {
  it("returns empty for definitions without slot variants", () => {
    const result = resolveSlotVariants(buttonDef, {
      appearance: "solid",
      color: "primary",
      size: "md",
    });
    expect(result.classNames).toEqual({});
    expect(result.styles).toEqual({});
  });

  it("resolves slot-specific styles", () => {
    const def = defineVariants<
      { size: { sm: Record<string, never>; md: Record<string, never>; lg: Record<string, never> } },
      "startIcon"
    >("button", {
      variants: {
        size: { sm: {}, md: {}, lg: {} },
      },
      defaultVariants: { size: "md" },
      slotVariants: {
        startIcon: {
          size: {
            sm: { width: "14px", height: "14px" },
            md: { width: "16px", height: "16px" },
            lg: { width: "20px", height: "20px" },
          },
        },
      },
    });

    const result = resolveSlotVariants(def, { size: "lg" });
    expect(result.styles["startIcon"]).toEqual({ width: "20px", height: "20px" });
    expect(result.classNames["startIcon"]).toContain("kui-button__start-icon--lg");
  });

  it("generates correct slot class names", () => {
    const def = defineVariants<
      { size: { sm: Record<string, never>; md: Record<string, never> } },
      "endIcon"
    >("button", {
      variants: { size: { sm: {}, md: {} } },
      defaultVariants: { size: "md" },
      slotVariants: {
        endIcon: {
          size: {
            sm: { width: "14px" },
            md: { width: "16px" },
          },
        },
      },
    });

    const result = resolveSlotVariants(def, { size: "sm" });
    expect(result.classNames["endIcon"]).toContain("kui-button__end-icon--sm");
  });
});

// ─── Class name format ──────────────────────────────────────────────

describe("variant class name format", () => {
  it("uses kebab-case for camelCase values", () => {
    const def = defineVariants("input", {
      variants: {
        variant: {
          outlined: {},
          filledDark: {},
        },
      },
      defaultVariants: { variant: "filledDark" },
    });
    const result = resolveVariants(def, {});
    expect(result.classNames).toContain("kui-input--filled-dark");
  });

  it("base class always first", () => {
    const result = resolveVariants(buttonDef, {});
    expect(result.classNames[0]).toBe("kui-button");
  });

  it("handles single-axis definition", () => {
    const def = defineVariants("badge", {
      variants: { color: { info: {}, error: {} } },
      defaultVariants: { color: "info" },
    });
    const result = resolveVariants(def, { color: "error" });
    expect(result.className).toBe("kui-badge kui-badge--error");
  });
});

// ─── Determinism ────────────────────────────────────────────────────

describe("variant resolution determinism", () => {
  it("same inputs always produce same output", () => {
    const a = resolveVariants(buttonDef, { appearance: "ghost", size: "lg" });
    const b = resolveVariants(buttonDef, { appearance: "ghost", size: "lg" });
    expect(a.className).toBe(b.className);
    expect(a.values).toEqual(b.values);
  });

  it("prop order does not affect output", () => {
    const a = resolveVariants(buttonDef, { size: "lg", appearance: "ghost" });
    const b = resolveVariants(buttonDef, { appearance: "ghost", size: "lg" });
    expect(a.className).toBe(b.className);
  });
});
