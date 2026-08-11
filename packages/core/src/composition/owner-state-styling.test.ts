import { describe, it, expect } from "vitest";
import {
  resolveOwnerStateStyling,
  ownerStateFromProps,
  applyStateToProps,
} from "./owner-state-styling";

// ─── resolveOwnerStateStyling ───────────────────────────────────────

describe("resolveOwnerStateStyling", () => {
  it("returns defaults for idle state", () => {
    const result = resolveOwnerStateStyling({});
    expect(result.dataState).toBe("default");
    expect(result.dataAttributes).toEqual({});
    expect(result.activeStates).toEqual([]);
    expect(result.factoryState).toEqual({
      disabled: false,
      loading: false,
      dataState: "default",
    });
  });

  it("handles disabled state", () => {
    const result = resolveOwnerStateStyling({ disabled: true });
    expect(result.dataState).toBe("disabled");
    expect(result.dataAttributes["data-disabled"]).toBe("");
    expect(result.activeStates).toContain("disabled");
    expect(result.factoryState.disabled).toBe(true);
  });

  it("handles loading state (implies disabled)", () => {
    const result = resolveOwnerStateStyling({ loading: true });
    expect(result.dataState).toBe("loading");
    expect(result.dataAttributes["data-loading"]).toBe("");
    expect(result.activeStates).toContain("loading");
    expect(result.factoryState.disabled).toBe(true);
    expect(result.factoryState.loading).toBe(true);
  });

  it("handles selected state", () => {
    const result = resolveOwnerStateStyling({ selected: true });
    expect(result.dataState).toBe("selected");
    expect(result.dataAttributes["data-selected"]).toBe("");
  });

  it("handles checked state", () => {
    const result = resolveOwnerStateStyling({ checked: true });
    expect(result.dataState).toBe("checked");
    expect(result.dataAttributes["data-checked"]).toBe("");
  });

  it("handles expanded state", () => {
    const result = resolveOwnerStateStyling({ expanded: true });
    expect(result.dataState).toBe("expanded");
    expect(result.dataAttributes["data-expanded"]).toBe("");
  });

  it("handles open state", () => {
    const result = resolveOwnerStateStyling({ open: true });
    expect(result.dataState).toBe("open");
    expect(result.dataAttributes["data-open"]).toBe("");
  });

  it("handles invalid state", () => {
    const result = resolveOwnerStateStyling({ invalid: true });
    expect(result.dataState).toBe("invalid");
    expect(result.dataAttributes["data-invalid"]).toBe("");
  });

  it("multiple states: highest priority wins for dataState", () => {
    const result = resolveOwnerStateStyling({ selected: true, disabled: true });
    expect(result.dataState).toBe("disabled"); // disabled > selected
    expect(result.dataAttributes["data-selected"]).toBe("");
    expect(result.dataAttributes["data-disabled"]).toBe("");
  });

  it("active states in priority order", () => {
    const result = resolveOwnerStateStyling({ hovered: true, focused: true, disabled: true });
    expect(result.activeStates).toEqual(["hovered", "focused", "disabled"]);
  });

  it("false values are not active", () => {
    const result = resolveOwnerStateStyling({ disabled: false, loading: false });
    expect(result.dataState).toBe("default");
    expect(result.activeStates).toEqual([]);
    expect(Object.keys(result.dataAttributes)).toHaveLength(0);
  });
});

// ─── ownerStateFromProps ────────────────────────────────────────────

describe("ownerStateFromProps", () => {
  it("maps props to OwnerState", () => {
    const state = ownerStateFromProps({ disabled: true, loading: false });
    expect(state.disabled).toBe(true);
    expect(state.loading).toBe(false);
  });

  it("defaults undefined to false", () => {
    const state = ownerStateFromProps({});
    expect(state.disabled).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.selected).toBe(false);
    expect(state.checked).toBe(false);
    expect(state.expanded).toBe(false);
    expect(state.open).toBe(false);
    expect(state.invalid).toBe(false);
    expect(state.readOnly).toBe(false);
  });

  it("maps all supported props", () => {
    const state = ownerStateFromProps({
      disabled: true,
      readOnly: true,
      loading: true,
      selected: true,
      checked: true,
      expanded: true,
      open: true,
      invalid: true,
    });
    expect(state.disabled).toBe(true);
    expect(state.readOnly).toBe(true);
    expect(state.loading).toBe(true);
    expect(state.selected).toBe(true);
    expect(state.checked).toBe(true);
    expect(state.expanded).toBe(true);
    expect(state.open).toBe(true);
    expect(state.invalid).toBe(true);
  });
});

// ─── applyStateToProps ──────────────────────────────────────────────

describe("applyStateToProps", () => {
  it("adds data attributes to props", () => {
    const result = applyStateToProps({ className: "kui-button" }, { disabled: true });
    expect(result["className"]).toBe("kui-button");
    expect(result["data-disabled"]).toBe("");
    expect(result["data-state"]).toBe("disabled");
  });

  it("does not add disabled/loading/etc. as direct props", () => {
    const result = applyStateToProps({}, { disabled: true, loading: true });
    // Only data-* attributes, never the raw state props
    expect(result["disabled"]).toBeUndefined();
    expect(result["loading"]).toBeUndefined();
    expect(result["data-disabled"]).toBe("");
    expect(result["data-loading"]).toBe("");
  });

  it("preserves existing props", () => {
    const result = applyStateToProps({ id: "btn", "aria-label": "action" }, { selected: true });
    expect(result["id"]).toBe("btn");
    expect(result["aria-label"]).toBe("action");
    expect(result["data-selected"]).toBe("");
  });

  it("does not mutate input props", () => {
    const original = { className: "test" };
    applyStateToProps(original, { disabled: true });
    expect(original["data-disabled" as keyof typeof original]).toBeUndefined();
  });

  it("adds data-state for idle", () => {
    const result = applyStateToProps({}, {});
    expect(result["data-state"]).toBe("default");
  });
});

// ─── No private state leaks ─────────────────────────────────────────

describe("owner state: no DOM leaks", () => {
  it("data attributes are strings, not booleans", () => {
    const result = applyStateToProps({}, { disabled: true, loading: true });
    // All data attrs are empty strings (for [data-disabled] CSS selector)
    expect(result["data-disabled"]).toBe("");
    expect(result["data-loading"]).toBe("");
    expect(typeof result["data-state"]).toBe("string");
  });

  it("no OwnerState object in output", () => {
    const result = applyStateToProps({}, { disabled: true, expanded: true });
    // None of the OwnerState keys should appear as direct props
    for (const key of [
      "disabled",
      "readOnly",
      "loading",
      "selected",
      "checked",
      "expanded",
      "open",
      "invalid",
      "focused",
      "focusVisible",
      "hovered",
      "pressed",
    ]) {
      expect(result[key]).toBeUndefined();
    }
  });
});
