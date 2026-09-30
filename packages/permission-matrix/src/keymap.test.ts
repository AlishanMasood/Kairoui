import { describe, expect, it } from "vitest";
import { DEFAULT_PERMISSION_MATRIX_KEYMAP, resolvePermissionMatrixAction } from "./keymap";

describe("DEFAULT_PERMISSION_MATRIX_KEYMAP", () => {
  it("includes arrow nav, toggle, selection, and search bindings", () => {
    const actions = new Set(DEFAULT_PERMISSION_MATRIX_KEYMAP.map((b) => b.action));
    expect(actions.has("moveFocusUp")).toBe(true);
    expect(actions.has("moveFocusDown")).toBe(true);
    expect(actions.has("moveFocusLeft")).toBe(true);
    expect(actions.has("moveFocusRight")).toBe(true);
    expect(actions.has("moveFocusHome")).toBe(true);
    expect(actions.has("moveFocusEnd")).toBe(true);
    expect(actions.has("moveFocusGridHome")).toBe(true);
    expect(actions.has("moveFocusGridEnd")).toBe(true);
    expect(actions.has("moveFocusPageUp")).toBe(true);
    expect(actions.has("moveFocusPageDown")).toBe(true);
    expect(actions.has("toggle")).toBe(true);
    expect(actions.has("selectRow")).toBe(true);
    expect(actions.has("selectColumn")).toBe(true);
    expect(actions.has("selectAll")).toBe(true);
    expect(actions.has("clearSelection")).toBe(true);
    expect(actions.has("focusSearch")).toBe(true);
  });
});

describe("resolvePermissionMatrixAction", () => {
  const event = {
    key: "ArrowUp",
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  } as const;

  it("returns the action for a plain match", () => {
    expect(resolvePermissionMatrixAction(event, DEFAULT_PERMISSION_MATRIX_KEYMAP)).toBe(
      "moveFocusUp",
    );
  });

  it("distinguishes Home from Ctrl+Home", () => {
    const plain = resolvePermissionMatrixAction(
      { key: "Home", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false },
      DEFAULT_PERMISSION_MATRIX_KEYMAP,
    );
    const ctrl = resolvePermissionMatrixAction(
      { key: "Home", shiftKey: false, ctrlKey: true, altKey: false, metaKey: false },
      DEFAULT_PERMISSION_MATRIX_KEYMAP,
    );
    expect(plain).toBe("moveFocusHome");
    expect(ctrl).toBe("moveFocusGridHome");
  });

  it("distinguishes Space from Shift+Space and Ctrl+Space", () => {
    const plain = resolvePermissionMatrixAction(
      { key: " ", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false },
      DEFAULT_PERMISSION_MATRIX_KEYMAP,
    );
    const shifted = resolvePermissionMatrixAction(
      { key: " ", shiftKey: true, ctrlKey: false, altKey: false, metaKey: false },
      DEFAULT_PERMISSION_MATRIX_KEYMAP,
    );
    const ctrl = resolvePermissionMatrixAction(
      { key: " ", shiftKey: false, ctrlKey: true, altKey: false, metaKey: false },
      DEFAULT_PERMISSION_MATRIX_KEYMAP,
    );
    expect(plain).toBe("toggle");
    expect(shifted).toBe("selectRow");
    expect(ctrl).toBe("selectColumn");
  });

  it("returns null for unmapped keys", () => {
    expect(
      resolvePermissionMatrixAction(
        { key: "z", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false },
        DEFAULT_PERMISSION_MATRIX_KEYMAP,
      ),
    ).toBeNull();
  });
});
