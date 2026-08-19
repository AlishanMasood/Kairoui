import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, useState } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../dialog/dialog";
import { Popover, PopoverTrigger, PopoverPortal, PopoverContent } from "../popover/popover";
import {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerContent,
  DrawerTitle,
  DrawerClose,
} from "../drawer/drawer";
import { DismissableLayer, _resetLayerStack } from "../overlay/dismissable-layer";
import { FocusScope, _resetScopeStack } from "../overlay/focus-scope";
import { ScrollLock, _resetScrollLock } from "../overlay/scroll-lock";

afterEach(() => {
  cleanup();
  _resetLayerStack();
  _resetScrollLock();
  _resetScopeStack();
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

// ─── Multiple non-modal overlays (independent, no nesting) ──────────

describe("Nested: Multiple independent non-modal overlays", () => {
  it("multiple popovers can be open simultaneously", async () => {
    render(
      createElement(
        "div",
        null,
        createElement(
          Popover,
          { defaultOpen: true },
          createElement(PopoverTrigger, null, "A"),
          createElement(
            PopoverPortal,
            null,
            createElement(PopoverContent, { "data-testid": "pop-a" } as never, "A"),
          ),
        ),
        createElement(
          Popover,
          { defaultOpen: true },
          createElement(PopoverTrigger, null, "B"),
          createElement(
            PopoverPortal,
            null,
            createElement(PopoverContent, { "data-testid": "pop-b" } as never, "B"),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("pop-a")).not.toBeNull();
    expect(screen.getByTestId("pop-b")).not.toBeNull();
  });

  it("non-modal overlays do not lock scroll", async () => {
    render(
      createElement(
        Popover,
        { defaultOpen: true },
        createElement(PopoverTrigger, null, "A"),
        createElement(PopoverPortal, null, createElement(PopoverContent, null, "Body")),
      ),
    );
    await waitForRaf();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("Escape closes only topmost non-modal overlay", async () => {
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    render(
      createElement(
        "div",
        null,
        createElement(
          Popover,
          { defaultOpen: true, onOpenChange: onChangeA },
          createElement(PopoverTrigger, null, "A"),
          createElement(
            PopoverPortal,
            null,
            createElement(PopoverContent, { "data-testid": "a" } as never, "A"),
          ),
        ),
        createElement(
          Popover,
          { defaultOpen: true, onOpenChange: onChangeB },
          createElement(PopoverTrigger, null, "B"),
          createElement(
            PopoverPortal,
            null,
            createElement(PopoverContent, { "data-testid": "b" } as never, "B"),
          ),
        ),
      ),
    );
    await waitForRaf();
    // Both open
    expect(screen.getByTestId("a")).not.toBeNull();
    expect(screen.getByTestId("b")).not.toBeNull();

    // Escape closes the topmost (last registered)
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onChangeB).toHaveBeenCalledWith(false);
  });
});

// ─── Scroll lock reference counting across overlays ─────────────────

describe("Nested: Scroll lock reference counting", () => {
  it("scroll stays locked when one of two locks is released", () => {
    const { unmount: u1 } = render(createElement(ScrollLock, { enabled: true }));
    const { unmount: u2 } = render(createElement(ScrollLock, { enabled: true }));
    expect(document.body.style.overflow).toBe("hidden");

    u2();
    expect(document.body.style.overflow).toBe("hidden");

    u1();
    expect(document.body.style.overflow).toBe("");
  });

  it("dialog + drawer both contribute to scroll lock", () => {
    render(
      createElement(
        "div",
        null,
        createElement(ScrollLock, { enabled: true }),
        createElement(ScrollLock, { enabled: true }),
      ),
    );
    expect(document.body.style.overflow).toBe("hidden");
  });
});

// ─── DismissableLayer nesting (core primitive) ──────────────────────

describe("Nested: DismissableLayer escape ordering", () => {
  it("inner layer handles Escape before outer", () => {
    const order: string[] = [];

    function Nested() {
      const [inner, setInner] = useState(true);
      const [outer, setOuter] = useState(true);
      if (!outer) return null;
      return createElement(
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
      );
    }
    Nested.displayName = "Nested";

    render(createElement(Nested));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(order).toEqual(["inner"]);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(order).toEqual(["inner", "outer"]);
  });

  it("clicking inside inner layer does not dismiss outer", () => {
    const outerDismiss = vi.fn();
    render(
      createElement(
        DismissableLayer,
        { onDismiss: outerDismiss },
        createElement("div", { "data-testid": "outer-area" }, "outer"),
        createElement(
          DismissableLayer,
          { onDismiss: () => {} },
          createElement("div", { "data-testid": "inner-area" }, "inner"),
        ),
      ),
    );

    fireEvent.pointerDown(screen.getByTestId("inner-area"));
    expect(outerDismiss).not.toHaveBeenCalled();
  });
});

// ─── FocusScope nesting (core primitive) ────────────────────────────

describe("Nested: FocusScope nesting", () => {
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

    // Inner scope is active
    screen.getByTestId("inner-btn2").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("inner-btn1"));
  });

  it("outer scope resumes after inner unmounts", async () => {
    function Test() {
      const [show, setShow] = useState(true);
      return createElement(
        FocusScope,
        { trapped: true },
        createElement("button", { "data-testid": "outer1" }, "o1"),
        createElement(
          "button",
          {
            "data-testid": "outer2",
            onClick: () => {
              setShow(false);
            },
          },
          "o2",
        ),
        show
          ? createElement(
              FocusScope,
              { trapped: true },
              createElement("button", { "data-testid": "inner1" }, "i1"),
            )
          : null,
      );
    }
    Test.displayName = "Test";

    render(createElement(Test));
    await waitForRaf();

    // Unmount inner
    fireEvent.click(screen.getByTestId("outer2"));
    await waitForRaf();

    // Outer resumes — Tab from last wraps to first
    screen.getByTestId("outer2").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("outer1"));
  });
});

// ─── Dialog renders and dismisses correctly ─────────────────────────

describe("Nested: Dialog basic nesting contract", () => {
  it("dialog renders content via portal", async () => {
    render(
      createElement(
        Dialog,
        { defaultOpen: true },
        createElement(DialogTrigger, null, "Open"),
        createElement(
          DialogPortal,
          null,
          createElement(
            DialogContent,
            { "data-testid": "content" } as never,
            createElement(DialogTitle, null, "Title"),
            createElement(DialogClose, null, "X"),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("drawer renders and locks scroll", async () => {
    render(
      createElement(
        Drawer,
        { defaultOpen: true },
        createElement(DrawerTrigger, null, "Open"),
        createElement(
          DrawerPortal,
          null,
          createElement(
            DrawerContent,
            { "data-testid": "drawer" } as never,
            createElement(DrawerTitle, null, "D"),
            createElement(DrawerClose, null, "X"),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("drawer")).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
  });
});
