import { describe, it, expect, vi } from "vitest";
import { createFocusVisibleTracker } from "./focus-visible";
import type { FocusVisibleDocument } from "./focus-visible";

function createMockDocument(): FocusVisibleDocument & {
  dispatch: (type: string, event?: unknown) => void;
} {
  const handlers = new Map<string, Array<(event: unknown) => void>>();

  return {
    addEventListener: vi.fn((type: string, handler: (event: unknown) => void) => {
      if (!handlers.has(type)) handlers.set(type, []);
      handlers.get(type)!.push(handler);
    }),
    removeEventListener: vi.fn((type: string, handler: (event: unknown) => void) => {
      const list = handlers.get(type);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx >= 0) list.splice(idx, 1);
      }
    }),
    dispatch(type: string, event?: unknown) {
      for (const h of handlers.get(type) ?? []) {
        h(event ?? {});
      }
    },
  };
}

describe("createFocusVisibleTracker", () => {
  it("defaults to pointer modality", () => {
    const tracker = createFocusVisibleTracker(createMockDocument());
    expect(tracker.getModality()).toBe("pointer");
    expect(tracker.isFocusVisible()).toBe(false);
  });

  it("switches to keyboard on Tab keydown", () => {
    const doc = createMockDocument();
    const tracker = createFocusVisibleTracker(doc);
    tracker.observe();
    doc.dispatch("keydown", { key: "Tab" });
    expect(tracker.getModality()).toBe("keyboard");
    expect(tracker.isFocusVisible()).toBe(true);
  });

  it("switches to keyboard on arrow keys", () => {
    const doc = createMockDocument();
    const tracker = createFocusVisibleTracker(doc);
    tracker.observe();
    doc.dispatch("keydown", { key: "ArrowDown" });
    expect(tracker.isFocusVisible()).toBe(true);
  });

  it("switches back to pointer on pointerdown", () => {
    const doc = createMockDocument();
    const tracker = createFocusVisibleTracker(doc);
    tracker.observe();
    doc.dispatch("keydown", { key: "Tab" });
    expect(tracker.isFocusVisible()).toBe(true);
    doc.dispatch("pointerdown");
    expect(tracker.isFocusVisible()).toBe(false);
    expect(tracker.getModality()).toBe("pointer");
  });

  it("switches back to pointer on mousedown", () => {
    const doc = createMockDocument();
    const tracker = createFocusVisibleTracker(doc);
    tracker.observe();
    doc.dispatch("keydown", { key: "Enter" });
    doc.dispatch("mousedown");
    expect(tracker.getModality()).toBe("pointer");
  });

  it("ignores modifier-only keypresses", () => {
    const doc = createMockDocument();
    const tracker = createFocusVisibleTracker(doc);
    tracker.observe();
    doc.dispatch("keydown", { key: "Tab", ctrlKey: true });
    expect(tracker.getModality()).toBe("pointer");
    doc.dispatch("keydown", { key: "Tab", metaKey: true });
    expect(tracker.getModality()).toBe("pointer");
    doc.dispatch("keydown", { key: "Tab", altKey: true });
    expect(tracker.getModality()).toBe("pointer");
  });

  it("resets to pointer on visibilitychange", () => {
    const doc = createMockDocument();
    const tracker = createFocusVisibleTracker(doc);
    tracker.observe();
    doc.dispatch("keydown", { key: "Tab" });
    expect(tracker.isFocusVisible()).toBe(true);
    doc.dispatch("visibilitychange");
    expect(tracker.isFocusVisible()).toBe(false);
  });

  it("cleans up listeners", () => {
    const doc = createMockDocument();
    const tracker = createFocusVisibleTracker(doc);
    const cleanup = tracker.observe();
    cleanup();
    expect(doc.removeEventListener).toHaveBeenCalledTimes(4);
  });

  it("observe is a no-op for null document", () => {
    const tracker = createFocusVisibleTracker(null);
    const cleanup = tracker.observe();
    expect(() => {
      cleanup();
    }).not.toThrow();
  });

  it("observe is a no-op when addEventListener is missing", () => {
    const tracker = createFocusVisibleTracker({});
    const cleanup = tracker.observe();
    expect(() => {
      cleanup();
    }).not.toThrow();
  });
});
