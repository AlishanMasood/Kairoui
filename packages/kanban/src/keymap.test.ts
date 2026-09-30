import { describe, expect, it } from "vitest";
import { DEFAULT_KANBAN_KEYMAP, resolveKanbanAction, type KanbanKeyBinding } from "./keymap";

describe("DEFAULT_KANBAN_KEYMAP", () => {
  it("includes arrow movement + activate + cancel + delete", () => {
    const actions = new Set(DEFAULT_KANBAN_KEYMAP.map((b) => b.action));
    expect(actions.has("moveFocusUp")).toBe(true);
    expect(actions.has("moveFocusDown")).toBe(true);
    expect(actions.has("moveFocusLeft")).toBe(true);
    expect(actions.has("moveFocusRight")).toBe(true);
    expect(actions.has("activate")).toBe(true);
    expect(actions.has("cancel")).toBe(true);
    expect(actions.has("delete")).toBe(true);
  });
});

describe("resolveKanbanAction", () => {
  const event = {
    key: "ArrowUp",
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  } as const;

  it("returns the action for a plain match", () => {
    expect(resolveKanbanAction(event, DEFAULT_KANBAN_KEYMAP)).toBe("moveFocusUp");
  });

  it("returns null when no binding matches", () => {
    expect(resolveKanbanAction({ ...event, key: "z" }, DEFAULT_KANBAN_KEYMAP)).toBeNull();
  });

  it("requires exact modifier match", () => {
    // Ctrl+ArrowUp is not bound; plain ArrowUp is.
    expect(resolveKanbanAction({ ...event, ctrlKey: true }, DEFAULT_KANBAN_KEYMAP)).toBeNull();
  });

  it("distinguishes Ctrl+Home from Home", () => {
    const homeAction = resolveKanbanAction(
      { key: "Home", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false },
      DEFAULT_KANBAN_KEYMAP,
    );
    const ctrlHomeAction = resolveKanbanAction(
      { key: "Home", shiftKey: false, ctrlKey: true, altKey: false, metaKey: false },
      DEFAULT_KANBAN_KEYMAP,
    );
    expect(homeAction).toBe("moveFocusHome");
    expect(ctrlHomeAction).toBe("moveFocusBoardHome");
  });

  it("respects consumer overrides", () => {
    const custom: readonly KanbanKeyBinding[] = [{ key: "q", action: "activate" }];
    expect(
      resolveKanbanAction(
        { key: "q", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false },
        custom,
      ),
    ).toBe("activate");
  });
});
