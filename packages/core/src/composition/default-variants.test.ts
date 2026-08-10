import { describe, it, expect, vi, afterEach } from "vitest";
import { defineVariants } from "./define-variants";
import { resolveVariants } from "./resolve-variants";

afterEach(() => vi.restoreAllMocks());

const buttonDef = defineVariants("button", {
  variants: {
    appearance: {
      solid: { background: "var(--bg)" },
      outlined: { background: "transparent" },
      ghost: { background: "transparent" },
    },
    size: {
      sm: { height: "28px" },
      md: { height: "36px" },
      lg: { height: "44px" },
    },
  },
  defaultVariants: { appearance: "solid", size: "md" },
});

describe("default variants: definition", () => {
  it("stores default values in the definition", () => {
    expect(buttonDef.defaultVariants.appearance).toBe("solid");
    expect(buttonDef.defaultVariants.size).toBe("md");
  });

  it("warns for invalid default value", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("test", {
      variants: { color: { red: {}, blue: {} } },
      defaultVariants: { color: "green" as "red" },
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Default variant"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("green"));
    spy.mockRestore();
  });

  it("does not warn for valid defaults", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("test", {
      variants: { size: { sm: {}, md: {}, lg: {} } },
      defaultVariants: { size: "md" },
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("default variants: resolution", () => {
  it("applies defaults when no props provided", () => {
    const result = resolveVariants(buttonDef, {});
    expect(result.values.appearance).toBe("solid");
    expect(result.values.size).toBe("md");
  });

  it("applies defaults for undefined props", () => {
    const result = resolveVariants(buttonDef, { appearance: undefined, size: undefined });
    expect(result.values.appearance).toBe("solid");
    expect(result.values.size).toBe("md");
  });

  it("applies defaults for partially-specified props", () => {
    const result = resolveVariants(buttonDef, { appearance: "ghost" });
    expect(result.values.appearance).toBe("ghost");
    expect(result.values.size).toBe("md"); // default
  });

  it("explicit consumer value wins over default", () => {
    const result = resolveVariants(buttonDef, { appearance: "outlined", size: "lg" });
    expect(result.values.appearance).toBe("outlined");
    expect(result.values.size).toBe("lg");
  });

  it("generates correct classes with defaults", () => {
    const result = resolveVariants(buttonDef, {});
    expect(result.className).toContain("kui-button--solid");
    expect(result.className).toContain("kui-button--md");
  });

  it("generates correct classes with mix of explicit and default", () => {
    const result = resolveVariants(buttonDef, { size: "sm" });
    expect(result.className).toContain("kui-button--solid"); // default
    expect(result.className).toContain("kui-button--sm"); // explicit
  });

  it("merges styles from default values", () => {
    const result = resolveVariants(buttonDef, {});
    expect(result.styles["background"]).toBe("var(--bg)"); // from solid default
    expect(result.styles["height"]).toBe("36px"); // from md default
  });

  it("explicit value styles override default styles", () => {
    const result = resolveVariants(buttonDef, { appearance: "outlined" });
    expect(result.styles["background"]).toBe("transparent"); // outlined, not solid
    expect(result.styles["height"]).toBe("36px"); // md default
  });

  it("output is deterministic with defaults", () => {
    const a = resolveVariants(buttonDef, {});
    const b = resolveVariants(buttonDef, {});
    expect(a.className).toBe(b.className);
    expect(a.values).toEqual(b.values);
    expect(a.styles).toEqual(b.styles);
  });

  it("null prop falls back to default", () => {
    const result = resolveVariants(buttonDef, {
      appearance: null as unknown as undefined,
    });
    expect(result.values.appearance).toBe("solid");
  });
});

describe("default variants: multi-axis", () => {
  const multiDef = defineVariants("chip", {
    variants: {
      color: { info: {}, success: {}, error: {} },
      size: { sm: {}, md: {}, lg: {} },
      variant: { filled: {}, outlined: {} },
    },
    defaultVariants: { color: "info", size: "sm", variant: "filled" },
  });

  it("all defaults applied when empty", () => {
    const result = resolveVariants(multiDef, {});
    expect(result.values.color).toBe("info");
    expect(result.values.size).toBe("sm");
    expect(result.values.variant).toBe("filled");
  });

  it("one explicit, rest default", () => {
    const result = resolveVariants(multiDef, { color: "error" });
    expect(result.values.color).toBe("error");
    expect(result.values.size).toBe("sm"); // default
    expect(result.values.variant).toBe("filled"); // default
  });

  it("all explicit", () => {
    const result = resolveVariants(multiDef, {
      color: "success",
      size: "lg",
      variant: "outlined",
    });
    expect(result.values.color).toBe("success");
    expect(result.values.size).toBe("lg");
    expect(result.values.variant).toBe("outlined");
  });
});
