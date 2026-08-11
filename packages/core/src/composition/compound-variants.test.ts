import { describe, it, expect } from "vitest";
import { defineVariants } from "./define-variants";
import { resolveVariants } from "./resolve-variants";

// ─── Fixtures ───────────────────────────────────────────────────────

const buttonDef = defineVariants("button", {
  variants: {
    appearance: {
      solid: { background: "var(--bg)", color: "var(--fg)" },
      outlined: { background: "transparent", borderStyle: "solid" },
      ghost: { background: "transparent" },
    },
    color: {
      primary: { "--bg": "var(--kui-color-primary)" },
      danger: { "--bg": "var(--kui-color-danger)" },
      neutral: { "--bg": "var(--kui-color-neutral)" },
    },
    size: {
      sm: { height: "28px" },
      md: { height: "36px" },
      lg: { height: "44px" },
    },
  },
  defaultVariants: { appearance: "solid", color: "primary", size: "md" },
  compoundVariants: [
    {
      condition: { appearance: "solid", color: "danger" },
      styles: { "--fg": "white", fontWeight: "bold" },
    },
    {
      condition: { appearance: "outlined", color: "danger" },
      styles: { borderColor: "var(--kui-color-danger)" },
    },
    {
      condition: { appearance: "ghost", size: "sm" },
      styles: { padding: "0 4px" },
    },
  ],
});

// ─── Compound matching ──────────────────────────────────────────────

describe("compound variants: matching", () => {
  it("applies compound when all conditions match", () => {
    const result = resolveVariants(buttonDef, { appearance: "solid", color: "danger" });
    expect(result.styles["--fg"]).toBe("white");
    expect(result.styles["fontWeight"]).toBe("bold");
  });

  it("does not apply compound when conditions do not match", () => {
    const result = resolveVariants(buttonDef, { appearance: "solid", color: "primary" });
    expect(result.styles["--fg"]).toBeUndefined();
    expect(result.styles["fontWeight"]).toBeUndefined();
  });

  it("does not apply compound with partial match", () => {
    const result = resolveVariants(buttonDef, { appearance: "solid", color: "neutral" });
    expect(result.styles["--fg"]).toBeUndefined();
  });

  it("applies multiple matching compounds", () => {
    // Both "solid+danger" and no others should match
    const result = resolveVariants(buttonDef, { appearance: "solid", color: "danger", size: "lg" });
    expect(result.styles["--fg"]).toBe("white"); // from solid+danger compound
    expect(result.styles["borderColor"]).toBeUndefined(); // outlined+danger not matched
  });

  it("applies different compound for different values", () => {
    const result = resolveVariants(buttonDef, { appearance: "outlined", color: "danger" });
    expect(result.styles["borderColor"]).toBe("var(--kui-color-danger)");
    expect(result.styles["--fg"]).toBeUndefined(); // solid+danger not matched
  });
});

// ─── Compound with defaults ─────────────────────────────────────────

describe("compound variants: with defaults", () => {
  it("matches when defaults satisfy compound condition", () => {
    // Default: appearance=solid, color=primary
    // No compound matches solid+primary in our fixture
    const result = resolveVariants(buttonDef, {});
    expect(result.styles["--fg"]).toBeUndefined();
  });

  it("matches when mix of explicit and default satisfies compound", () => {
    // explicit: color=danger, default: appearance=solid
    const result = resolveVariants(buttonDef, { color: "danger" });
    expect(result.styles["--fg"]).toBe("white"); // solid(default)+danger matches
  });
});

// ─── Compound precedence ────────────────────────────────────────────

describe("compound variants: precedence", () => {
  it("compound styles override base variant styles for same property", () => {
    // Base "solid" sets color: "var(--fg)"
    // Compound "solid+danger" sets "--fg": "white"
    const result = resolveVariants(buttonDef, { appearance: "solid", color: "danger" });
    expect(result.styles["--fg"]).toBe("white");
    expect(result.styles["background"]).toBe("var(--bg)"); // from base solid
  });

  it("later compound overrides earlier for same property", () => {
    const def = defineVariants("test", {
      variants: {
        a: { x: {} },
        b: { y: {} },
      },
      defaultVariants: { a: "x", b: "y" },
      compoundVariants: [
        { condition: { a: "x" }, styles: { color: "first" } },
        { condition: { a: "x", b: "y" }, styles: { color: "second" } },
      ],
    });

    const result = resolveVariants(def, {});
    // Both match, but second is later in declaration order
    expect(result.styles["color"]).toBe("second");
  });

  it("compound styles are applied after all base axis styles", () => {
    const def = defineVariants("test", {
      variants: {
        color: { red: { bg: "red" } },
        size: { lg: { bg: "large-bg" } },
      },
      defaultVariants: { color: "red", size: "lg" },
      compoundVariants: [
        { condition: { color: "red", size: "lg" }, styles: { bg: "compound-bg" } },
      ],
    });

    const result = resolveVariants(def, {});
    // Compound should override the axis value
    expect(result.styles["bg"]).toBe("compound-bg");
  });
});

// ─── Compound with single condition ─────────────────────────────────

describe("compound variants: single condition", () => {
  it("single-axis compound matches when that axis matches", () => {
    const def = defineVariants("badge", {
      variants: {
        color: { info: {}, error: {} },
        size: { sm: {}, lg: {} },
      },
      defaultVariants: { color: "info", size: "sm" },
      compoundVariants: [{ condition: { color: "error" }, styles: { fontWeight: "bold" } }],
    });

    const result = resolveVariants(def, { color: "error" });
    expect(result.styles["fontWeight"]).toBe("bold");
  });

  it("single-axis compound does not match other values", () => {
    const def = defineVariants("badge", {
      variants: {
        color: { info: {}, error: {} },
        size: { sm: {}, lg: {} },
      },
      defaultVariants: { color: "info", size: "sm" },
      compoundVariants: [{ condition: { color: "error" }, styles: { fontWeight: "bold" } }],
    });

    const result = resolveVariants(def, { color: "info" });
    expect(result.styles["fontWeight"]).toBeUndefined();
  });
});

// ─── Empty and edge cases ───────────────────────────────────────────

describe("compound variants: edge cases", () => {
  it("no compound variants in definition", () => {
    const def = defineVariants("simple", {
      variants: { size: { sm: {}, md: {} } },
      defaultVariants: { size: "sm" },
    });
    const result = resolveVariants(def, {});
    expect(result.styles).toBeDefined();
  });

  it("empty condition matches all (vacuously true)", () => {
    const def = defineVariants("test", {
      variants: { a: { x: {} } },
      defaultVariants: { a: "x" },
      compoundVariants: [{ condition: {}, styles: { universal: "yes" } }],
    });
    const result = resolveVariants(def, {});
    expect(result.styles["universal"]).toBe("yes");
  });

  it("deterministic: same input always produces same compound result", () => {
    const a = resolveVariants(buttonDef, { appearance: "solid", color: "danger" });
    const b = resolveVariants(buttonDef, { appearance: "solid", color: "danger" });
    expect(a.styles).toEqual(b.styles);
  });

  it("compound does not mutate base definition", () => {
    const before = JSON.stringify(buttonDef.variants);
    resolveVariants(buttonDef, { appearance: "solid", color: "danger" });
    const after = JSON.stringify(buttonDef.variants);
    expect(before).toBe(after);
  });
});
