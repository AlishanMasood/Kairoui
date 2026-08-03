import { describe, it, expect } from "vitest";
import { resolveVariantClasses, variantClasses } from "./variant-classes";

describe("resolveVariantClasses", () => {
  it("produces class for each variant value", () => {
    expect(
      resolveVariantClasses({
        component: "button",
        values: { variant: "primary", size: "md" },
      }),
    ).toEqual(["kui-button--size-md", "kui-button--variant-primary"]);
  });

  it("skips undefined values", () => {
    expect(
      resolveVariantClasses({
        component: "button",
        values: { variant: "primary", size: undefined },
      }),
    ).toEqual(["kui-button--variant-primary"]);
  });

  it("skips empty string values", () => {
    expect(
      resolveVariantClasses({
        component: "input",
        values: { variant: "", size: "lg" },
      }),
    ).toEqual(["kui-input--size-lg"]);
  });

  it("returns empty array when all values are undefined", () => {
    expect(
      resolveVariantClasses({
        component: "button",
        values: { variant: undefined, size: undefined },
      }),
    ).toEqual([]);
  });

  it("returns empty array for empty values", () => {
    expect(resolveVariantClasses({ component: "button", values: {} })).toEqual([]);
  });

  it("uses custom prefix", () => {
    expect(
      resolveVariantClasses({
        component: "button",
        values: { variant: "primary" },
        prefix: "app",
      }),
    ).toEqual(["app-button--variant-primary"]);
  });

  it("produces deterministic order (sorted by dimension)", () => {
    const a = resolveVariantClasses({
      component: "btn",
      values: { z: "1", a: "2", m: "3" },
    });
    const b = resolveVariantClasses({
      component: "btn",
      values: { a: "2", m: "3", z: "1" },
    });
    expect(a).toEqual(b);
    expect(a).toEqual(["kui-btn--a-2", "kui-btn--m-3", "kui-btn--z-1"]);
  });

  it("handles density variant", () => {
    expect(
      resolveVariantClasses({
        component: "button",
        values: { variant: "primary", size: "md", density: "compact" },
      }),
    ).toEqual([
      "kui-button--density-compact",
      "kui-button--size-md",
      "kui-button--variant-primary",
    ]);
  });
});

describe("variantClasses", () => {
  it("returns space-separated class string", () => {
    expect(
      variantClasses({
        component: "button",
        values: { variant: "primary", size: "md" },
      }),
    ).toBe("kui-button--size-md kui-button--variant-primary");
  });

  it("returns empty string for no active variants", () => {
    expect(variantClasses({ component: "button", values: {} })).toBe("");
  });

  it("returns single class for single variant", () => {
    expect(
      variantClasses({
        component: "chip",
        values: { color: "blue" },
      }),
    ).toBe("kui-chip--color-blue");
  });
});
