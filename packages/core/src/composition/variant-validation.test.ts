import { describe, it, expect, vi, afterEach } from "vitest";
import { defineVariants } from "./define-variants";
import { resolveVariants } from "./resolve-variants";

afterEach(() => vi.restoreAllMocks());

// ─── Definition-time validation ─────────────────────────────────────

describe("variant validation: definition", () => {
  it("warns for invalid default value", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("test", {
      variants: { color: { red: {}, blue: {} } },
      defaultVariants: { color: "green" as "red" },
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Default variant"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"green"'));
  });

  it("does not warn for valid defaults", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("test", {
      variants: { size: { sm: {}, md: {}, lg: {} } },
      defaultVariants: { size: "md" },
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("warns for compound with unknown axis", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("test", {
      variants: { color: { red: {}, blue: {} } },
      defaultVariants: { color: "red" },
      compoundVariants: [
        {
          condition: { unknown: "x" } as unknown as { color?: "red" | "blue" },
          styles: {},
        },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("unknown axis"));
  });

  it("warns for compound with invalid value", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("test", {
      variants: { color: { red: {}, blue: {} } },
      defaultVariants: { color: "red" },
      compoundVariants: [{ condition: { color: "invalid" as "red" }, styles: {} }],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("invalid value"));
  });

  it("does not warn for valid compound conditions", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("test", {
      variants: { color: { red: {}, blue: {} }, size: { sm: {}, lg: {} } },
      defaultVariants: { color: "red", size: "sm" },
      compoundVariants: [{ condition: { color: "red", size: "lg" }, styles: {} }],
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("warns for slot variant with unknown axis", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants<{ size: { sm: Record<string, never>; md: Record<string, never> } }, "icon">(
      "test",
      {
        variants: { size: { sm: {}, md: {} } },
        defaultVariants: { size: "sm" },
        slotVariants: {
          icon: {
            badAxis: { sm: { width: "14px" } },
          } as Record<string, Record<string, Record<string, string>>>,
        },
      },
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("unknown axis"));
  });
});

// ─── Resolution-time validation ─────────────────────────────────────

describe("variant validation: resolution", () => {
  const def = defineVariants("button", {
    variants: {
      appearance: { solid: {}, outlined: {}, ghost: {} },
      size: { sm: {}, md: {}, lg: {} },
    },
    defaultVariants: { appearance: "solid", size: "md" },
  });

  it("warns for invalid value at resolution time", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = resolveVariants(def, { appearance: "invalid" as "solid" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Invalid variant value"));
    expect(result.values.appearance).toBe("solid"); // falls back to default
  });

  it("does not warn for valid values", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveVariants(def, { appearance: "ghost", size: "lg" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not warn for undefined (uses default silently)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveVariants(def, { appearance: undefined });
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not warn for empty props (all defaults)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveVariants(def, {});
    expect(spy).not.toHaveBeenCalled();
  });
});

// ─── Warning message quality ────────────────────────────────────────

describe("variant validation: message quality", () => {
  it("includes component name in warnings", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("MyButton", {
      variants: { size: { sm: {} } },
      defaultVariants: { size: "invalid" as "sm" },
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("MyButton"));
  });

  it("includes valid values in warning", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const def = defineVariants("test", {
      variants: { color: { red: {}, blue: {}, green: {} } },
      defaultVariants: { color: "red" },
    });
    resolveVariants(def, { color: "invalid" as "red" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("blue"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("green"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("red"));
  });

  it("includes axis name in warning", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const def = defineVariants("test", {
      variants: { appearance: { solid: {} } },
      defaultVariants: { appearance: "solid" },
    });
    resolveVariants(def, { appearance: "bad" as "solid" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("appearance"));
  });

  it("compound warning includes index", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineVariants("test", {
      variants: { a: { x: {} } },
      defaultVariants: { a: "x" },
      compoundVariants: [
        { condition: { a: "x" }, styles: {} }, // valid
        { condition: { a: "bad" as "x" }, styles: {} }, // invalid
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("#2"));
  });
});

// ─── Valid usage: no warnings ───────────────────────────────────────

describe("variant validation: valid usage produces no warnings", () => {
  it("complete valid definition", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const def = defineVariants("button", {
      variants: {
        appearance: { solid: {}, outlined: {} },
        color: { primary: {}, danger: {} },
        size: { sm: {}, md: {}, lg: {} },
      },
      defaultVariants: { appearance: "solid", color: "primary", size: "md" },
      compoundVariants: [{ condition: { appearance: "solid", color: "danger" }, styles: {} }],
    });
    resolveVariants(def, { appearance: "outlined", size: "lg" });
    expect(spy).not.toHaveBeenCalled();
  });
});
