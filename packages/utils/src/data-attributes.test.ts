import { describe, it, expect } from "vitest";
import {
  resolveBooleanDataAttributes,
  resolveEnumDataAttributes,
  resolveDataAttributes,
} from "./data-attributes";

describe("resolveBooleanDataAttributes", () => {
  it("produces empty-string attribute for truthy values", () => {
    expect(resolveBooleanDataAttributes({ disabled: true })).toEqual({
      "data-disabled": "",
    });
  });

  it("omits falsy values", () => {
    expect(resolveBooleanDataAttributes({ disabled: false, loading: true })).toEqual({
      "data-loading": "",
    });
  });

  it("omits undefined values", () => {
    expect(resolveBooleanDataAttributes({ selected: undefined, loading: true })).toEqual({
      "data-loading": "",
    });
  });

  it("converts camelCase to kebab-case", () => {
    expect(resolveBooleanDataAttributes({ focusVisible: true })).toEqual({
      "data-focus-visible": "",
    });
  });

  it("returns empty object when all are falsy", () => {
    expect(resolveBooleanDataAttributes({ disabled: false, loading: false })).toEqual({});
  });

  it("returns empty object for empty input", () => {
    expect(resolveBooleanDataAttributes({})).toEqual({});
  });

  it("produces deterministic key order", () => {
    const result = resolveBooleanDataAttributes({ loading: true, disabled: true });
    expect(Object.keys(result)).toEqual(["data-disabled", "data-loading"]);
  });

  it("supports custom prefix", () => {
    expect(resolveBooleanDataAttributes({ active: true }, { prefix: "kui" })).toEqual({
      "kui-active": "",
    });
  });
});

describe("resolveEnumDataAttributes", () => {
  it("produces attribute with string value", () => {
    expect(resolveEnumDataAttributes({ state: "open" })).toEqual({
      "data-state": "open",
    });
  });

  it("omits undefined values", () => {
    expect(resolveEnumDataAttributes({ state: "open", mode: undefined })).toEqual({
      "data-state": "open",
    });
  });

  it("omits empty string values", () => {
    expect(resolveEnumDataAttributes({ state: "" })).toEqual({});
  });

  it("handles orientation", () => {
    expect(resolveEnumDataAttributes({ orientation: "horizontal" })).toEqual({
      "data-orientation": "horizontal",
    });
  });

  it("handles density", () => {
    expect(resolveEnumDataAttributes({ density: "compact" })).toEqual({
      "data-density": "compact",
    });
  });

  it("converts camelCase keys to kebab-case", () => {
    expect(resolveEnumDataAttributes({ placementSide: "top" })).toEqual({
      "data-placement-side": "top",
    });
  });

  it("produces deterministic key order", () => {
    const result = resolveEnumDataAttributes({ z: "1", a: "2" });
    expect(Object.keys(result)).toEqual(["data-a", "data-z"]);
  });

  it("supports custom prefix", () => {
    expect(resolveEnumDataAttributes({ state: "closed" }, { prefix: "kui" })).toEqual({
      "kui-state": "closed",
    });
  });
});

describe("resolveDataAttributes", () => {
  it("combines boolean and enum attributes", () => {
    expect(
      resolveDataAttributes({
        boolean: { disabled: true, loading: true },
        enum: { state: "open" },
      }),
    ).toEqual({
      "data-disabled": "",
      "data-loading": "",
      "data-state": "open",
    });
  });

  it("handles boolean-only input", () => {
    expect(resolveDataAttributes({ boolean: { selected: true } })).toEqual({
      "data-selected": "",
    });
  });

  it("handles enum-only input", () => {
    expect(resolveDataAttributes({ enum: { orientation: "vertical" } })).toEqual({
      "data-orientation": "vertical",
    });
  });

  it("returns empty object for empty input", () => {
    expect(resolveDataAttributes({})).toEqual({});
  });

  it("respects custom prefix for both types", () => {
    expect(
      resolveDataAttributes(
        { boolean: { active: true }, enum: { state: "open" } },
        { prefix: "kui" },
      ),
    ).toEqual({
      "kui-active": "",
      "kui-state": "open",
    });
  });

  it("omits inactive boolean and undefined enum", () => {
    expect(
      resolveDataAttributes({
        boolean: { disabled: false, invalid: true },
        enum: { state: undefined, mode: "dark" },
      }),
    ).toEqual({
      "data-invalid": "",
      "data-mode": "dark",
    });
  });
});
