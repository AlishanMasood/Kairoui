import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { createElement, useState, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Portal } from "./portal";
import { Presence } from "./presence";
import { DismissableLayer, _resetLayerStack } from "./dismissable-layer";
import { FocusScope } from "./focus-scope";
import { ScrollLock, _resetScrollLock } from "./scroll-lock";
import { computePosition } from "./floating-position";
import type { DOMRectLike } from "@kairoui/utils/dom";

beforeEach(() => {
  _resetLayerStack();
  _resetScrollLock();
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.style.pointerEvents = "";
});

afterEach(() => {
  cleanup();
  _resetLayerStack();
  _resetScrollLock();
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.style.pointerEvents = "";
});

function waitForRaf(): Promise<void> {
  return act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

// ─── Modal overlay composite: DismissableLayer + FocusScope + ScrollLock ─────

describe("Integration: modal overlay composite", () => {
  it("combines scroll lock, focus trap, and dismissable layer", async () => {
    const onDismiss = vi.fn();

    function ModalOverlay({ onClose }: { onClose: () => void }) {
      return createElement(
        DismissableLayer,
        { onDismiss: onClose, disableOutsidePointerEvents: true },
        createElement(ScrollLock),
        createElement(
          FocusScope,
          { trapped: true, restoreFocus: true },
          createElement("button", { "data-testid": "modal-btn" }, "action"),
        ),
      );
    }
    ModalOverlay.displayName = "ModalOverlay";

    const trigger = document.createElement("button");
    trigger.textContent = "trigger";
    document.body.appendChild(trigger);
    trigger.focus();

    function App() {
      const [open, setOpen] = useState(false);
      onDismiss.mockImplementation(() => {
        setOpen(false);
      });
      return createElement(
        "div",
        null,
        createElement(
          "button",
          {
            "data-testid": "trigger",
            onClick: () => {
              setOpen(true);
            },
          },
          "open",
        ),
        open
          ? createElement(ModalOverlay, {
              onClose: () => {
                setOpen(false);
              },
            })
          : null,
      );
    }
    App.displayName = "App";

    render(createElement(App));

    // Open modal
    fireEvent.click(screen.getByTestId("trigger"));
    await waitForRaf();

    // Scroll lock active
    expect(document.body.style.overflow).toBe("hidden");

    // Focus trapped
    expect(document.activeElement).toBe(screen.getByTestId("modal-btn"));

    // Pointer events blocked
    expect(document.body.style.pointerEvents).toBe("none");

    // Escape dismisses
    fireEvent.keyDown(document, { key: "Escape" });

    // All cleaned up
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.pointerEvents).toBe("");
    expect(screen.queryByTestId("modal-btn")).toBeNull();

    document.body.removeChild(trigger);
  });
});

// ─── Nested dismissable layers with escape ordering ─────────────────

describe("Integration: nested dismissable layers", () => {
  it("Escape dismisses innermost first, then outer", () => {
    const dismissed: string[] = [];

    function NestedLayers() {
      const [showInner, setShowInner] = useState(true);
      const [showOuter, setShowOuter] = useState(true);

      if (!showOuter) return null;

      return createElement(
        DismissableLayer,
        {
          onDismiss: () => {
            dismissed.push("outer");
            setShowOuter(false);
          },
        },
        createElement("div", null, "outer"),
        showInner
          ? createElement(
              DismissableLayer,
              {
                onDismiss: () => {
                  dismissed.push("inner");
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

    fireEvent.keyDown(document, { key: "Escape" });
    expect(dismissed).toEqual(["inner"]);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(dismissed).toEqual(["inner", "outer"]);
  });
});

// ─── Nested focus scopes ────────────────────────────────────────────

describe("Integration: nested focus scopes", () => {
  it("inner scope traps, outer resumes after inner unmounts", async () => {
    function NestedFocus() {
      const [showInner, setShowInner] = useState(true);
      return createElement(
        FocusScope,
        { trapped: true },
        createElement("button", { "data-testid": "outer1" }, "o1"),
        createElement("button", { "data-testid": "outer2" }, "o2"),
        showInner
          ? createElement(
              FocusScope,
              { trapped: true },
              createElement("button", { "data-testid": "inner1" }, "i1"),
              createElement(
                "button",
                {
                  "data-testid": "inner-close",
                  onClick: () => {
                    setShowInner(false);
                  },
                },
                "close",
              ),
            )
          : null,
      );
    }
    NestedFocus.displayName = "NestedFocus";

    render(createElement(NestedFocus));
    await waitForRaf();

    // Inner scope is active
    screen.getByTestId("inner-close").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("inner1"));

    // Close inner
    fireEvent.click(screen.getByTestId("inner-close"));
    await waitForRaf();

    // Outer scope resumes
    screen.getByTestId("outer2").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("outer1"));
  });
});

// ─── Nested scroll locks ────────────────────────────────────────────

describe("Integration: nested scroll locks", () => {
  it("scroll stays locked until all modals close", () => {
    function NestedModals() {
      const [modal1, setModal1] = useState(true);
      const [modal2, setModal2] = useState(true);
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "close1",
          onClick: () => {
            setModal1(false);
          },
        }),
        createElement("button", {
          "data-testid": "close2",
          onClick: () => {
            setModal2(false);
          },
        }),
        modal1 ? createElement(ScrollLock) : null,
        modal2 ? createElement(ScrollLock) : null,
      );
    }
    NestedModals.displayName = "NestedModals";

    render(createElement(NestedModals));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByTestId("close2"));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByTestId("close1"));
    expect(document.body.style.overflow).toBe("");
  });
});

// ─── Portal + DismissableLayer ──────────────────────────────────────

describe("Integration: portal + dismissable layer", () => {
  it("outside click on portaled content does not dismiss parent", () => {
    const onDismiss = vi.fn();

    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(
          DismissableLayer,
          { onDismiss },
          createElement("div", { "data-testid": "layer-content" }, "content"),
        ),
      ),
    );

    // Click inside the layer — should not dismiss
    fireEvent.pointerDown(screen.getByTestId("layer-content"));
    expect(onDismiss).not.toHaveBeenCalled();

    // Click outside — should dismiss
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ─── Presence + conditional rendering ───────────────────────────────

describe("Integration: presence lifecycle", () => {
  it("mounts when present becomes true, unmounts when false (no animation)", () => {
    function Toggle() {
      const [show, setShow] = useState(false);
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "toggle",
          onClick: () => {
            setShow((s) => !s);
          },
        }),
        createElement(
          Presence,
          { present: show },
          createElement("div", { "data-testid": "content" }, "hello"),
        ),
      );
    }
    Toggle.displayName = "Toggle";

    render(createElement(Toggle));
    expect(screen.queryByTestId("content")).toBeNull();

    fireEvent.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("content")).not.toBeNull();

    fireEvent.click(screen.getByTestId("toggle"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Floating positioning: RTL ──────────────────────────────────────

describe("Integration: floating positioning RTL", () => {
  const viewport: DOMRectLike = {
    top: 0,
    left: 0,
    right: 1000,
    bottom: 800,
    width: 1000,
    height: 800,
  };
  const anchor: DOMRectLike = {
    top: 400,
    left: 400,
    right: 500,
    bottom: 440,
    width: 100,
    height: 40,
  };

  it("RTL bottom-start mirrors to right-aligned", () => {
    const result = computePosition({
      anchorRect: anchor,
      floatingRect: { width: 200, height: 100 },
      viewportRect: viewport,
      options: { placement: "bottom-start" },
      isRtl: true,
    });
    expect(result.x).toBe(300); // anchor.right - floatingWidth
  });

  it("flip + shift + RTL work together", () => {
    const nearBottom: DOMRectLike = {
      top: 750,
      left: 50,
      right: 100,
      bottom: 790,
      width: 50,
      height: 40,
    };
    const result = computePosition({
      anchorRect: nearBottom,
      floatingRect: { width: 200, height: 100 },
      viewportRect: viewport,
      options: { placement: "bottom-start", collisionPadding: 8 },
      isRtl: true,
    });
    // Should flip to top (overflows bottom) and shift to stay in viewport
    expect(result.placement).toBe("top-start");
    expect(result.y).toBe(650);
    expect(result.x).toBeGreaterThanOrEqual(8);
  });
});

// ─── SSR safety ─────────────────────────────────────────────────────

describe("Integration: SSR", () => {
  it("Portal renders nothing on server", () => {
    const html = renderToString(
      createElement(Portal, null, createElement("div", null, "portaled")),
    );
    expect(html).toBe("");
  });

  it("Presence renders children when present=true on server", () => {
    const html = renderToString(
      createElement(Presence, { present: true }, createElement("div", null, "visible")),
    );
    expect(html).toContain("visible");
  });

  it("Presence renders nothing when present=false on server", () => {
    const html = renderToString(
      createElement(Presence, { present: false }, createElement("div", null, "hidden")),
    );
    expect(html).toBe("");
  });

  it("ScrollLock renders nothing on server", () => {
    const html = renderToString(createElement(ScrollLock, { enabled: true }));
    expect(html).toBe("");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Integration: Strict Mode", () => {
  it("modal composite works in StrictMode", async () => {
    function StrictModal() {
      const [open, setOpen] = useState(true);
      if (!open) return createElement("div", { "data-testid": "closed" }, "closed");
      return createElement(
        DismissableLayer,
        {
          onDismiss: () => {
            setOpen(false);
          },
        },
        createElement(ScrollLock),
        createElement(
          FocusScope,
          { trapped: true },
          createElement("button", { "data-testid": "modal-btn" }, "btn"),
        ),
      );
    }
    StrictModal.displayName = "StrictModal";

    render(createElement(StrictMode, null, createElement(StrictModal)));
    await waitForRaf();

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(screen.getByTestId("modal-btn"));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("closed")).not.toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("nested dismiss layers in StrictMode dismiss correctly", () => {
    const order: string[] = [];

    function StrictNested() {
      const [inner, setInner] = useState(true);
      const [outer, setOuter] = useState(true);
      if (!outer) return null;
      return createElement(
        StrictMode,
        null,
        createElement(
          DismissableLayer,
          {
            onDismiss: () => {
              order.push("outer");
              setOuter(false);
            },
          },
          createElement("div", null, "outer"),
          inner
            ? createElement(
                DismissableLayer,
                {
                  onDismiss: () => {
                    order.push("inner");
                    setInner(false);
                  },
                },
                createElement("div", null, "inner"),
              )
            : null,
        ),
      );
    }
    StrictNested.displayName = "StrictNested";

    render(createElement(StrictNested));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(order).toEqual(["inner"]);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(order).toEqual(["inner", "outer"]);
  });
});

// ─── Consumer cancellation across primitives ────────────────────────

describe("Integration: consumer cancellation", () => {
  it("preventDefault on escape cancels dismiss and keeps scroll lock", () => {
    const onEscape = vi.fn((event: KeyboardEvent) => {
      event.preventDefault();
    });

    function ProtectedModal() {
      const [open, setOpen] = useState(true);
      if (!open) return null;
      return createElement(
        DismissableLayer,
        {
          onDismiss: () => {
            setOpen(false);
          },
          onEscapeKeyDown: onEscape,
        },
        createElement(ScrollLock),
        createElement("div", { "data-testid": "protected" }, "protected"),
      );
    }
    ProtectedModal.displayName = "ProtectedModal";

    render(createElement(ProtectedModal));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("protected")).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
  });
});

// ─── Non-modal overlay (no scroll lock, no focus trap) ──────────────

describe("Integration: non-modal overlay", () => {
  it("does not lock scroll or trap focus", async () => {
    render(
      createElement(
        "div",
        null,
        createElement("input", { "data-testid": "outside-input" }),
        createElement(
          DismissableLayer,
          { onDismiss: () => {} },
          createElement(
            FocusScope,
            { trapped: false, autoFocus: true },
            createElement("button", { "data-testid": "popover-btn" }, "btn"),
          ),
        ),
      ),
    );

    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("popover-btn"));
    expect(document.body.style.overflow).not.toBe("hidden");

    // Tab should NOT be prevented (no trap)
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
