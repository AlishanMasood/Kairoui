import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { createElement, useState, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { DismissableLayer, _resetLayerStack } from "./dismissable-layer";

beforeEach(() => {
  _resetLayerStack();
});

afterEach(() => {
  cleanup();
  _resetLayerStack();
});

// ─── Escape key dismissal ───────────────────────────────────────────

describe("DismissableLayer: escape key", () => {
  it("calls onDismiss when Escape is pressed", () => {
    const onDismiss = vi.fn();
    render(createElement(DismissableLayer, { onDismiss }, createElement("div", null, "content")));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onEscapeKeyDown before onDismiss", () => {
    const order: string[] = [];
    const onEscapeKeyDown = vi.fn(() => {
      order.push("escape");
    });
    const onDismiss = vi.fn(() => {
      order.push("dismiss");
    });

    render(
      createElement(
        DismissableLayer,
        { onDismiss, onEscapeKeyDown },
        createElement("div", null, "content"),
      ),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(order).toEqual(["escape", "dismiss"]);
  });

  it("does not call onDismiss when consumer prevents default", () => {
    const onDismiss = vi.fn();
    const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => {
      event.preventDefault();
    });

    render(
      createElement(
        DismissableLayer,
        { onDismiss, onEscapeKeyDown },
        createElement("div", null, "content"),
      ),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not handle Escape when disableEscapeKeyDown is true", () => {
    const onDismiss = vi.fn();
    render(
      createElement(
        DismissableLayer,
        { onDismiss, disableEscapeKeyDown: true },
        createElement("div", null, "content"),
      ),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("ignores non-Escape keys", () => {
    const onDismiss = vi.fn();
    render(createElement(DismissableLayer, { onDismiss }, createElement("div", null, "content")));

    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "Tab" });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

// ─── Pointer-down outside ───────────────────────────────────────────

describe("DismissableLayer: pointer-down outside", () => {
  it("calls onDismiss on pointer-down outside the layer", () => {
    const onDismiss = vi.fn();
    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(
          DismissableLayer,
          { onDismiss },
          createElement("div", { "data-testid": "inside" }, "content"),
        ),
      ),
    );

    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss on pointer-down inside the layer", () => {
    const onDismiss = vi.fn();
    render(
      createElement(
        DismissableLayer,
        { onDismiss },
        createElement("div", { "data-testid": "inside" }, "content"),
      ),
    );

    fireEvent.pointerDown(screen.getByTestId("inside"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("calls onPointerDownOutside before onDismiss", () => {
    const order: string[] = [];
    const onPointerDownOutside = vi.fn(() => {
      order.push("outside");
    });
    const onDismiss = vi.fn(() => {
      order.push("dismiss");
    });

    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(
          DismissableLayer,
          { onDismiss, onPointerDownOutside },
          createElement("div", null, "content"),
        ),
      ),
    );

    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(order).toEqual(["outside", "dismiss"]);
  });

  it("does not call onDismiss when consumer prevents default", () => {
    const onDismiss = vi.fn();
    const onPointerDownOutside = vi.fn((event: PointerEvent) => {
      event.preventDefault();
    });

    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(
          DismissableLayer,
          { onDismiss, onPointerDownOutside },
          createElement("div", null, "content"),
        ),
      ),
    );

    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

// ─── Focus outside ──────────────────────────────────────────────────

describe("DismissableLayer: focus outside", () => {
  it("calls onDismiss when focus moves outside", () => {
    const onDismiss = vi.fn();
    render(
      createElement(
        "div",
        null,
        createElement("input", { "data-testid": "external-input" }),
        createElement(
          DismissableLayer,
          { onDismiss },
          createElement("input", { "data-testid": "internal-input" }),
        ),
      ),
    );

    fireEvent.focusIn(screen.getByTestId("external-input"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss when focus moves inside", () => {
    const onDismiss = vi.fn();
    render(
      createElement(
        DismissableLayer,
        { onDismiss },
        createElement("input", { "data-testid": "internal-input" }),
      ),
    );

    fireEvent.focusIn(screen.getByTestId("internal-input"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("calls onFocusOutside before onDismiss", () => {
    const order: string[] = [];
    const onFocusOutside = vi.fn(() => {
      order.push("focus-outside");
    });
    const onDismiss = vi.fn(() => {
      order.push("dismiss");
    });

    render(
      createElement(
        "div",
        null,
        createElement("input", { "data-testid": "external" }),
        createElement(
          DismissableLayer,
          { onDismiss, onFocusOutside },
          createElement("div", null, "content"),
        ),
      ),
    );

    fireEvent.focusIn(screen.getByTestId("external"));
    expect(order).toEqual(["focus-outside", "dismiss"]);
  });

  it("does not call onDismiss when consumer prevents focus-outside default", () => {
    const onDismiss = vi.fn();
    const onFocusOutside = vi.fn((event: Event) => {
      event.preventDefault();
    });

    render(
      createElement(
        "div",
        null,
        createElement("input", { "data-testid": "external" }),
        createElement(
          DismissableLayer,
          { onDismiss, onFocusOutside: onFocusOutside as unknown as (e: FocusEvent) => void },
          createElement("div", null, "content"),
        ),
      ),
    );

    fireEvent.focusIn(screen.getByTestId("external"));
    expect(onFocusOutside).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

// ─── Branches / exclusions ──────────────────────────────────────────

describe("DismissableLayer: branches", () => {
  it("does not dismiss on pointer-down on a branch element", () => {
    const onDismiss = vi.fn();

    function TestWithBranch() {
      const [branchEl, setBranchEl] = useState<HTMLElement | null>(null);
      return createElement(
        "div",
        null,
        createElement("button", { ref: setBranchEl, "data-testid": "branch" }, "trigger"),
        createElement(
          DismissableLayer,
          { onDismiss, branches: [branchEl] },
          createElement("div", { "data-testid": "layer" }, "content"),
        ),
      );
    }
    TestWithBranch.displayName = "TestWithBranch";

    render(createElement(TestWithBranch));

    fireEvent.pointerDown(screen.getByTestId("branch"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not dismiss on focus moving to a branch element", () => {
    const onDismiss = vi.fn();

    function TestWithBranch() {
      const [branchEl, setBranchEl] = useState<HTMLElement | null>(null);
      return createElement(
        "div",
        null,
        createElement("input", { ref: setBranchEl, "data-testid": "branch-input" }),
        createElement(
          DismissableLayer,
          { onDismiss, branches: [branchEl] },
          createElement("div", null, "content"),
        ),
      );
    }
    TestWithBranch.displayName = "TestWithBranch";

    render(createElement(TestWithBranch));

    fireEvent.focusIn(screen.getByTestId("branch-input"));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

// ─── Nested layers ──────────────────────────────────────────────────

describe("DismissableLayer: nested layers", () => {
  it("only topmost layer handles Escape", () => {
    const onDismissOuter = vi.fn();
    const onDismissInner = vi.fn();

    render(
      createElement(
        DismissableLayer,
        { onDismiss: onDismissOuter },
        createElement("div", { "data-testid": "outer-content" }, "outer"),
        createElement(
          DismissableLayer,
          { onDismiss: onDismissInner },
          createElement("div", { "data-testid": "inner-content" }, "inner"),
        ),
      ),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismissInner).toHaveBeenCalledTimes(1);
    expect(onDismissOuter).not.toHaveBeenCalled();
  });

  it("parent layer handles Escape after inner layer unmounts", () => {
    const onDismissOuter = vi.fn();
    const onDismissInner = vi.fn();

    function NestedLayers() {
      const [showInner, setShowInner] = useState(true);
      return createElement(
        DismissableLayer,
        { onDismiss: onDismissOuter },
        createElement("div", null, "outer"),
        showInner
          ? createElement(
              DismissableLayer,
              {
                onDismiss: () => {
                  onDismissInner();
                  setShowInner(false);
                },
              },
              createElement("div", null, "inner"),
            )
          : null,
      );
    }
    NestedLayers.displayName = "NestedLayers";

    render(createElement(NestedLayers));

    // First Escape dismisses inner
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismissInner).toHaveBeenCalledTimes(1);
    expect(onDismissOuter).not.toHaveBeenCalled();

    // Second Escape dismisses outer
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismissOuter).toHaveBeenCalledTimes(1);
  });

  it("pointer-down inside child layer does not dismiss parent", () => {
    const onDismissOuter = vi.fn();
    const onDismissInner = vi.fn();

    render(
      createElement(
        "div",
        { "data-testid": "outside-all" },
        createElement(
          DismissableLayer,
          { onDismiss: onDismissOuter },
          createElement("div", { "data-testid": "outer-content" }, "outer"),
          createElement(
            DismissableLayer,
            { onDismiss: onDismissInner },
            createElement("div", { "data-testid": "inner-content" }, "inner"),
          ),
        ),
      ),
    );

    // Click inside inner layer → neither should dismiss
    fireEvent.pointerDown(screen.getByTestId("inner-content"));
    expect(onDismissInner).not.toHaveBeenCalled();
    expect(onDismissOuter).not.toHaveBeenCalled();
  });

  it("pointer-down outside all layers dismisses topmost only (stack order)", () => {
    const onDismissOuter = vi.fn();
    const onDismissInner = vi.fn();

    render(
      createElement(
        "div",
        { "data-testid": "outside-all" },
        createElement(
          DismissableLayer,
          { onDismiss: onDismissOuter },
          createElement("div", null, "outer"),
          createElement(
            DismissableLayer,
            { onDismiss: onDismissInner },
            createElement("div", null, "inner"),
          ),
        ),
      ),
    );

    // Click outside all layers → both fire (each detects it's "outside")
    fireEvent.pointerDown(screen.getByTestId("outside-all"));
    expect(onDismissInner).toHaveBeenCalledTimes(1);
    expect(onDismissOuter).toHaveBeenCalledTimes(1);
  });

  it("pointer-down in outer (but outside inner) dismisses inner only", () => {
    const onDismissOuter = vi.fn();
    const onDismissInner = vi.fn();

    render(
      createElement(
        DismissableLayer,
        { onDismiss: onDismissOuter },
        createElement("div", { "data-testid": "outer-only" }, "outer"),
        createElement(
          DismissableLayer,
          { onDismiss: onDismissInner },
          createElement("div", { "data-testid": "inner-content" }, "inner"),
        ),
      ),
    );

    // Click on outer content (inside outer, outside inner)
    fireEvent.pointerDown(screen.getByTestId("outer-only"));
    expect(onDismissInner).toHaveBeenCalledTimes(1);
    expect(onDismissOuter).not.toHaveBeenCalled();
  });
});

// ─── Modal behavior (disableOutsidePointerEvents) ───────────────────

describe("DismissableLayer: modal", () => {
  it("sets pointer-events:none on body when modal", () => {
    const { unmount } = render(
      createElement(
        DismissableLayer,
        { disableOutsidePointerEvents: true },
        createElement("div", null, "modal content"),
      ),
    );

    expect(document.body.style.pointerEvents).toBe("none");
    unmount();
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("restores original body pointer-events on unmount", () => {
    document.body.style.pointerEvents = "auto";

    const { unmount } = render(
      createElement(
        DismissableLayer,
        { disableOutsidePointerEvents: true },
        createElement("div", null, "modal content"),
      ),
    );

    expect(document.body.style.pointerEvents).toBe("none");
    unmount();
    expect(document.body.style.pointerEvents).toBe("auto");

    // Cleanup
    document.body.style.pointerEvents = "";
  });

  it("only restores after last modal layer unmounts", () => {
    const { unmount: unmount1 } = render(
      createElement(
        DismissableLayer,
        { disableOutsidePointerEvents: true },
        createElement("div", null, "modal 1"),
      ),
    );
    const { unmount: unmount2 } = render(
      createElement(
        DismissableLayer,
        { disableOutsidePointerEvents: true },
        createElement("div", null, "modal 2"),
      ),
    );

    expect(document.body.style.pointerEvents).toBe("none");

    unmount2();
    expect(document.body.style.pointerEvents).toBe("none");

    unmount1();
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("layer has pointer-events:auto when modal", () => {
    render(
      createElement(
        DismissableLayer,
        { disableOutsidePointerEvents: true },
        createElement("div", { "data-testid": "child" }, "content"),
      ),
    );

    const layer = document.querySelector("[data-dismissable-layer]") as HTMLElement;
    expect(layer.style.pointerEvents).toBe("auto");
  });
});

// ─── Cleanup ────────────────────────────────────────────────────────

describe("DismissableLayer: cleanup", () => {
  it("removes event listeners on unmount", () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      createElement(DismissableLayer, { onDismiss }, createElement("div", null, "content")),
    );

    unmount();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("removes layer from stack on unmount", () => {
    const onDismissA = vi.fn();
    const onDismissB = vi.fn();

    const { unmount: unmountB } = render(
      createElement(
        DismissableLayer,
        { onDismiss: onDismissA },
        createElement("div", null, "A"),
        createElement(DismissableLayer, { onDismiss: onDismissB }, createElement("div", null, "B")),
      ),
    );

    // B is topmost — Escape goes to B
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismissB).toHaveBeenCalledTimes(1);
    expect(onDismissA).not.toHaveBeenCalled();

    // Unmount everything, no errors
    unmountB();
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("DismissableLayer: Strict Mode", () => {
  it("works correctly in StrictMode", () => {
    const onDismiss = vi.fn();
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          DismissableLayer,
          { onDismiss },
          createElement("div", { "data-testid": "content" }, "ok"),
        ),
      ),
    );

    expect(screen.getByTestId("content")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("nested layers in StrictMode dismiss in correct order", () => {
    const onDismissOuter = vi.fn();
    const onDismissInner = vi.fn();

    render(
      createElement(
        StrictMode,
        null,
        createElement(
          DismissableLayer,
          { onDismiss: onDismissOuter },
          createElement("div", null, "outer"),
          createElement(
            DismissableLayer,
            { onDismiss: onDismissInner },
            createElement("div", null, "inner"),
          ),
        ),
      ),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismissInner).toHaveBeenCalledTimes(1);
    expect(onDismissOuter).not.toHaveBeenCalled();
  });
});
