import { describe, it, expect, expectTypeOf } from "vitest";
import {
  resolveActiveStates,
  resolveStateStyles,
  stateToDataAttributes,
  resolveDataState,
} from "./state-styles";
import type { OwnerState, StateName, StateStyleDefinition } from "./state-styles";

// ─── resolveActiveStates ────────────────────────────────────────────

describe("resolveActiveStates", () => {
  it("returns empty for default (no active states)", () => {
    expect(resolveActiveStates({})).toEqual([]);
  });

  it("returns single active state", () => {
    expect(resolveActiveStates({ disabled: true })).toEqual(["disabled"]);
  });

  it("returns multiple active states in priority order", () => {
    const result = resolveActiveStates({ hovered: true, focused: true, disabled: true });
    expect(result).toEqual(["hovered", "focused", "disabled"]);
  });

  it("ignores false values", () => {
    expect(resolveActiveStates({ disabled: false, loading: false })).toEqual([]);
  });

  it("ignores undefined values", () => {
    expect(resolveActiveStates({ disabled: undefined })).toEqual([]);
  });

  it("returns all states in correct priority order", () => {
    const all: OwnerState = {
      hovered: true,
      focused: true,
      focusVisible: true,
      pressed: true,
      selected: true,
      checked: true,
      expanded: true,
      open: true,
      readOnly: true,
      invalid: true,
      loading: true,
      disabled: true,
    };
    const result = resolveActiveStates(all);
    expect(result).toEqual([
      "hovered",
      "focused",
      "focusVisible",
      "pressed",
      "selected",
      "checked",
      "expanded",
      "open",
      "readOnly",
      "invalid",
      "loading",
      "disabled",
    ]);
  });
});

// ─── resolveStateStyles ─────────────────────────────────────────────

describe("resolveStateStyles", () => {
  const styles: StateStyleDefinition = {
    hovered: { background: "var(--kui-color-hover)" },
    focused: { outline: "2px solid blue" },
    disabled: { opacity: "0.5", cursor: "not-allowed" },
    loading: { cursor: "wait" },
    invalid: { borderColor: "red" },
  };

  it("returns undefined for no active states", () => {
    expect(resolveStateStyles(styles, {})).toBeUndefined();
  });

  it("returns styles for single active state", () => {
    const result = resolveStateStyles(styles, { disabled: true });
    expect(result).toEqual({ opacity: "0.5", cursor: "not-allowed" });
  });

  it("merges multiple active state styles", () => {
    const result = resolveStateStyles(styles, { hovered: true, focused: true });
    expect(result).toEqual({
      background: "var(--kui-color-hover)",
      outline: "2px solid blue",
    });
  });

  it("higher-priority state overrides lower for same property", () => {
    const result = resolveStateStyles(styles, { hovered: true, disabled: true });
    expect(result!["cursor"]).toBe("not-allowed");
    expect(result!["background"]).toBe("var(--kui-color-hover)");
    expect(result!["opacity"]).toBe("0.5");
  });

  it("loading cursor overrides hover cursor but disabled overrides loading", () => {
    const result = resolveStateStyles(styles, { hovered: true, loading: true, disabled: true });
    expect(result!["cursor"]).toBe("not-allowed"); // disabled > loading > hovered
  });

  it("returns undefined when active states have no matching definitions", () => {
    const result = resolveStateStyles(styles, { selected: true });
    expect(result).toBeUndefined();
  });

  it("handles empty style definition", () => {
    expect(resolveStateStyles({}, { disabled: true })).toBeUndefined();
  });
});

// ─── stateToDataAttributes ──────────────────────────────────────────

describe("stateToDataAttributes", () => {
  it("returns empty for no active states", () => {
    expect(stateToDataAttributes({})).toEqual({});
  });

  it("generates data-disabled", () => {
    expect(stateToDataAttributes({ disabled: true })).toEqual({ "data-disabled": "" });
  });

  it("generates data-loading", () => {
    expect(stateToDataAttributes({ loading: true })).toEqual({ "data-loading": "" });
  });

  it("generates kebab-case data attributes", () => {
    const result = stateToDataAttributes({ focusVisible: true, readOnly: true });
    expect(result).toEqual({ "data-focus-visible": "", "data-read-only": "" });
  });

  it("generates multiple attributes", () => {
    const result = stateToDataAttributes({ disabled: true, loading: true, invalid: true });
    expect(result).toEqual({
      "data-invalid": "",
      "data-loading": "",
      "data-disabled": "",
    });
  });

  it("ignores false and undefined values", () => {
    expect(stateToDataAttributes({ disabled: false, loading: undefined })).toEqual({});
  });
});

// ─── resolveDataState ───────────────────────────────────────────────

describe("resolveDataState", () => {
  it("returns 'default' for no active states", () => {
    expect(resolveDataState({})).toBe("default");
  });

  it("returns highest-priority state", () => {
    expect(resolveDataState({ disabled: true })).toBe("disabled");
  });

  it("disabled wins over loading", () => {
    expect(resolveDataState({ loading: true, disabled: true })).toBe("disabled");
  });

  it("loading wins over invalid", () => {
    expect(resolveDataState({ invalid: true, loading: true })).toBe("loading");
  });

  it("invalid wins over hovered", () => {
    expect(resolveDataState({ hovered: true, invalid: true })).toBe("invalid");
  });

  it("uses kebab-case for multi-word states", () => {
    expect(resolveDataState({ focusVisible: true })).toBe("focus-visible");
    expect(resolveDataState({ readOnly: true })).toBe("read-only");
  });

  it("returns highest priority from many active states", () => {
    expect(resolveDataState({ hovered: true, focused: true, pressed: true, disabled: true })).toBe(
      "disabled",
    );
  });
});

// ─── Type tests ─────────────────────────────────────────────────────

describe("state styles: types", () => {
  it("OwnerState has all standard states", () => {
    expectTypeOf<OwnerState>().toHaveProperty("disabled");
    expectTypeOf<OwnerState>().toHaveProperty("readOnly");
    expectTypeOf<OwnerState>().toHaveProperty("loading");
    expectTypeOf<OwnerState>().toHaveProperty("focused");
    expectTypeOf<OwnerState>().toHaveProperty("focusVisible");
    expectTypeOf<OwnerState>().toHaveProperty("hovered");
    expectTypeOf<OwnerState>().toHaveProperty("pressed");
    expectTypeOf<OwnerState>().toHaveProperty("selected");
    expectTypeOf<OwnerState>().toHaveProperty("checked");
    expectTypeOf<OwnerState>().toHaveProperty("expanded");
    expectTypeOf<OwnerState>().toHaveProperty("invalid");
    expectTypeOf<OwnerState>().toHaveProperty("open");
  });

  it("StateName is a union of all state keys", () => {
    const name: StateName = "disabled";
    expect(name).toBe("disabled");
  });

  it("StateStyleDefinition maps state names to properties", () => {
    const def: StateStyleDefinition = {
      disabled: { opacity: "0.5" },
      loading: { cursor: "wait" },
    };
    expect(def.disabled!["opacity"]).toBe("0.5");
  });
});
