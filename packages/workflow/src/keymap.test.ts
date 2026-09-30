import { describe, expect, it } from "vitest";
import { DEFAULT_WORKFLOW_KEYMAP, resolveWorkflowAction } from "./keymap";

describe("DEFAULT_WORKFLOW_KEYMAP", () => {
  it("covers arrow nav on both axes plus activate + Home/End", () => {
    const actions = new Set(DEFAULT_WORKFLOW_KEYMAP.map((b) => b.action));
    expect(actions.has("moveFocusPrevious")).toBe(true);
    expect(actions.has("moveFocusNext")).toBe(true);
    expect(actions.has("moveFocusFirst")).toBe(true);
    expect(actions.has("moveFocusLast")).toBe(true);
    expect(actions.has("activate")).toBe(true);
  });

  it("binds both ArrowUp and ArrowLeft to previous (orientation resolved by runtime)", () => {
    const bindings = DEFAULT_WORKFLOW_KEYMAP.filter((b) => b.action === "moveFocusPrevious");
    const keys = new Set(bindings.map((b) => b.key));
    expect(keys.has("ArrowLeft")).toBe(true);
    expect(keys.has("ArrowUp")).toBe(true);
  });
});

describe("resolveWorkflowAction", () => {
  const event = {
    key: "ArrowRight",
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  } as const;

  it("resolves ArrowRight to moveFocusNext", () => {
    expect(resolveWorkflowAction(event, DEFAULT_WORKFLOW_KEYMAP)).toBe("moveFocusNext");
  });

  it("distinguishes Home from End", () => {
    expect(
      resolveWorkflowAction(
        { key: "Home", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false },
        DEFAULT_WORKFLOW_KEYMAP,
      ),
    ).toBe("moveFocusFirst");
    expect(
      resolveWorkflowAction(
        { key: "End", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false },
        DEFAULT_WORKFLOW_KEYMAP,
      ),
    ).toBe("moveFocusLast");
  });

  it("returns null for unmapped keys", () => {
    expect(
      resolveWorkflowAction(
        { key: "z", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false },
        DEFAULT_WORKFLOW_KEYMAP,
      ),
    ).toBeNull();
  });

  it("requires exact modifier match", () => {
    expect(resolveWorkflowAction({ ...event, ctrlKey: true }, DEFAULT_WORKFLOW_KEYMAP)).toBeNull();
  });
});
