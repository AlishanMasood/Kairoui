import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { createElement, useState, useRef, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { FocusScope } from "./focus-scope";

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(cleanup);

// ─── Initial focus ──────────────────────────────────────────────────

describe("FocusScope: initial focus", () => {
  it("focuses first tabbable element when autoFocus is true", async () => {
    render(
      createElement(
        FocusScope,
        { autoFocus: true },
        createElement("button", { "data-testid": "btn1" }, "first"),
        createElement("button", { "data-testid": "btn2" }, "second"),
      ),
    );

    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("btn1"));
  });

  it("does not focus when autoFocus is false", async () => {
    render(
      createElement(
        FocusScope,
        { autoFocus: false },
        createElement("button", { "data-testid": "btn1" }, "first"),
      ),
    );

    await waitForRaf();
    expect(document.activeElement).not.toBe(screen.getByTestId("btn1"));
  });

  it("focuses initialFocusRef element when provided", async () => {
    function TestComponent() {
      const ref = useRef<HTMLElement>(null);
      return createElement(
        FocusScope,
        { autoFocus: true, initialFocusRef: ref },
        createElement("button", null, "first"),
        createElement("button", { ref, "data-testid": "target" }, "target"),
      );
    }
    TestComponent.displayName = "TestComponent";

    render(createElement(TestComponent));
    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("target"));
  });

  it("autoFocus defaults to true when trapped", async () => {
    render(
      createElement(
        FocusScope,
        { trapped: true },
        createElement("button", { "data-testid": "btn1" }, "first"),
      ),
    );

    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("btn1"));
  });
});

// ─── Focus trapping ─────────────────────────────────────────────────

describe("FocusScope: focus trapping", () => {
  it("wraps focus from last to first on Tab", async () => {
    render(
      createElement(
        FocusScope,
        { trapped: true },
        createElement("button", { "data-testid": "btn1" }, "first"),
        createElement("button", { "data-testid": "btn2" }, "second"),
        createElement("button", { "data-testid": "btn3" }, "third"),
      ),
    );

    await waitForRaf();
    const btn3 = screen.getByTestId("btn3");
    btn3.focus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("btn1"));
  });

  it("wraps focus from first to last on Shift+Tab", async () => {
    render(
      createElement(
        FocusScope,
        { trapped: true },
        createElement("button", { "data-testid": "btn1" }, "first"),
        createElement("button", { "data-testid": "btn2" }, "second"),
        createElement("button", { "data-testid": "btn3" }, "third"),
      ),
    );

    await waitForRaf();
    const btn1 = screen.getByTestId("btn1");
    expect(document.activeElement).toBe(btn1);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByTestId("btn3"));
  });

  it("prevents Tab from escaping when only one tabbable element", async () => {
    render(
      createElement(
        FocusScope,
        { trapped: true },
        createElement("button", { "data-testid": "only" }, "only"),
      ),
    );

    await waitForRaf();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("only"));
  });

  it("does not trap when trapped is false", async () => {
    render(
      createElement(
        "div",
        null,
        createElement(
          FocusScope,
          { trapped: false, autoFocus: true },
          createElement("button", { "data-testid": "inside" }, "inside"),
        ),
        createElement("button", { "data-testid": "outside" }, "outside"),
      ),
    );

    await waitForRaf();
    // Tab should NOT be intercepted (no preventDefault)
    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("prevents focus from escaping to elements outside", async () => {
    render(
      createElement(
        "div",
        null,
        createElement(
          FocusScope,
          { trapped: true },
          createElement("button", { "data-testid": "inside" }, "inside"),
        ),
        createElement("button", { "data-testid": "outside" }, "outside"),
      ),
    );

    await waitForRaf();
    // Simulate focus escaping to outside
    screen.getByTestId("outside").focus();
    fireEvent.focusIn(screen.getByTestId("outside"));

    expect(document.activeElement).toBe(screen.getByTestId("inside"));
  });
});

// ─── Focus restoration ──────────────────────────────────────────────

describe("FocusScope: restore focus", () => {
  it("restores focus to previously focused element on unmount", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    function Wrapper({ show }: { show: boolean }) {
      return createElement(
        "div",
        null,
        show
          ? createElement(
              FocusScope,
              { autoFocus: true, restoreFocus: true },
              createElement("button", { "data-testid": "modal-btn" }, "modal"),
            )
          : null,
      );
    }
    Wrapper.displayName = "Wrapper";

    const { rerender } = render(createElement(Wrapper, { show: true }));
    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("modal-btn"));

    rerender(createElement(Wrapper, { show: false }));
    await waitForRaf();
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it("does not restore when restoreFocus is false", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "trigger";
    document.body.appendChild(trigger);
    trigger.focus();

    function Wrapper({ show }: { show: boolean }) {
      return show
        ? createElement(
            FocusScope,
            { autoFocus: true, restoreFocus: false },
            createElement("button", { "data-testid": "modal-btn" }, "modal"),
          )
        : null;
    }
    Wrapper.displayName = "Wrapper";

    const { rerender } = render(createElement(Wrapper, { show: true }));
    await waitForRaf();

    rerender(createElement(Wrapper, { show: false }));
    await waitForRaf();
    expect(document.activeElement).not.toBe(trigger);

    document.body.removeChild(trigger);
  });
});

// ─── Nested scopes ──────────────────────────────────────────────────

describe("FocusScope: nested scopes", () => {
  it("inner scope traps focus, outer does not interfere", async () => {
    render(
      createElement(
        FocusScope,
        { trapped: true },
        createElement("button", { "data-testid": "outer-btn" }, "outer"),
        createElement(
          FocusScope,
          { trapped: true },
          createElement("button", { "data-testid": "inner-btn1" }, "inner1"),
          createElement("button", { "data-testid": "inner-btn2" }, "inner2"),
        ),
      ),
    );

    await waitForRaf();
    // Inner scope is active (topmost)
    const btn2 = screen.getByTestId("inner-btn2");
    btn2.focus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("inner-btn1"));
  });

  it("outer scope resumes trapping after inner unmounts", async () => {
    function Nested() {
      const [showInner, setShowInner] = useState(true);
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "toggle",
          onClick: () => {
            setShowInner(false);
          },
        }),
        createElement(
          FocusScope,
          { trapped: true },
          createElement("button", { "data-testid": "outer1" }, "outer1"),
          createElement("button", { "data-testid": "outer2" }, "outer2"),
          showInner
            ? createElement(
                FocusScope,
                { trapped: true },
                createElement("button", { "data-testid": "inner1" }, "inner1"),
              )
            : null,
        ),
      );
    }
    Nested.displayName = "Nested";

    render(createElement(Nested));
    await waitForRaf();

    // Unmount inner scope
    fireEvent.click(screen.getByTestId("toggle"));
    await waitForRaf();

    // Outer scope is now active; focus last then Tab should wrap
    screen.getByTestId("outer2").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("outer1"));
  });
});

// ─── Disabled/enabled ───────────────────────────────────────────────

describe("FocusScope: enabled", () => {
  it("does not trap or autofocus when enabled is false", async () => {
    render(
      createElement(
        FocusScope,
        { trapped: true, enabled: false },
        createElement("button", { "data-testid": "btn" }, "btn"),
      ),
    );

    await waitForRaf();
    expect(document.activeElement).not.toBe(screen.getByTestId("btn"));
  });

  it("skips inert elements in tabbable list", async () => {
    render(
      createElement(
        FocusScope,
        { trapped: true },
        createElement("button", { "data-testid": "btn1" }, "first"),
        createElement("button", { "data-testid": "btn2", inert: true }, "inert"),
        createElement("button", { "data-testid": "btn3" }, "last"),
      ),
    );

    await waitForRaf();
    screen.getByTestId("btn3").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("btn1"));
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("FocusScope: Strict Mode", () => {
  it("works in StrictMode without double-focus issues", async () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          FocusScope,
          { trapped: true },
          createElement("button", { "data-testid": "btn1" }, "first"),
          createElement("button", { "data-testid": "btn2" }, "second"),
        ),
      ),
    );

    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("btn1"));

    // Test wrap: Tab from last wraps to first
    screen.getByTestId("btn2").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("btn1"));
  });
});

// ─── Utility ────────────────────────────────────────────────────────

function waitForRaf(): Promise<void> {
  return act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}
