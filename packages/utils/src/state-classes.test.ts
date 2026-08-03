import { describe, it, expect } from "vitest";
import { resolveStateClasses, stateClasses } from "./state-classes";

describe("resolveStateClasses", () => {
  it("returns empty array for no active states", () => {
    expect(resolveStateClasses({})).toEqual([]);
    expect(resolveStateClasses({ disabled: false, loading: false })).toEqual([]);
  });

  it("returns class for each truthy state", () => {
    expect(resolveStateClasses({ disabled: true })).toEqual(["kui-is-disabled"]);
    expect(resolveStateClasses({ loading: true })).toEqual(["kui-is-loading"]);
    expect(resolveStateClasses({ focused: true })).toEqual(["kui-is-focused"]);
  });

  it("returns multiple classes in stable order", () => {
    expect(resolveStateClasses({ pressed: true, disabled: true, focused: true })).toEqual([
      "kui-is-disabled",
      "kui-is-focused",
      "kui-is-pressed",
    ]);
  });

  it("handles all approved states", () => {
    const all = resolveStateClasses({
      disabled: true,
      readOnly: true,
      loading: true,
      focused: true,
      focusVisible: true,
      hovered: true,
      pressed: true,
      selected: true,
      invalid: true,
      valid: true,
      expanded: true,
      checked: true,
    });
    expect(all).toEqual([
      "kui-is-disabled",
      "kui-is-read-only",
      "kui-is-loading",
      "kui-is-focused",
      "kui-is-focus-visible",
      "kui-is-hovered",
      "kui-is-pressed",
      "kui-is-selected",
      "kui-is-invalid",
      "kui-is-valid",
      "kui-is-expanded",
      "kui-is-checked",
    ]);
  });

  it("supports custom prefix", () => {
    expect(resolveStateClasses({ disabled: true }, { prefix: "my" })).toEqual(["my-is-disabled"]);
  });

  it("supports empty prefix", () => {
    expect(resolveStateClasses({ disabled: true }, { prefix: "" })).toEqual(["-is-disabled"]);
  });

  it("order is deterministic regardless of object key order", () => {
    const a = resolveStateClasses({ checked: true, disabled: true });
    const b = resolveStateClasses({ disabled: true, checked: true });
    expect(a).toEqual(b);
    expect(a).toEqual(["kui-is-disabled", "kui-is-checked"]);
  });
});

describe("stateClasses", () => {
  it("returns empty string for no active states", () => {
    expect(stateClasses({})).toBe("");
  });

  it("returns space-separated class string", () => {
    expect(stateClasses({ disabled: true, loading: true })).toBe("kui-is-disabled kui-is-loading");
  });

  it("supports custom prefix", () => {
    expect(stateClasses({ focused: true }, { prefix: "app" })).toBe("app-is-focused");
  });

  it("single active state returns single class", () => {
    expect(stateClasses({ hovered: true })).toBe("kui-is-hovered");
  });
});
