import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";
import { _resetLayerStack } from "../overlay/dismissable-layer";
import { _resetScrollLock } from "../overlay/scroll-lock";
import { _resetScopeStack } from "../overlay/focus-scope";

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

function BasicAlertDialog(props: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onAction?: () => void;
  onCancel?: () => void;
}) {
  return createElement(
    AlertDialog,
    {
      defaultOpen: props.defaultOpen,
      open: props.open,
      onOpenChange: props.onOpenChange,
    },
    createElement(AlertDialogTrigger, { "data-testid": "trigger" } as never, "Delete"),
    createElement(
      AlertDialogPortal,
      null,
      createElement(AlertDialogBackdrop, { "data-testid": "backdrop" }),
      createElement(
        AlertDialogContent,
        {
          "data-testid": "content",
          ...(props.onEscapeKeyDown ? { onEscapeKeyDown: props.onEscapeKeyDown } : undefined),
        } as never,
        createElement(AlertDialogTitle, { "data-testid": "title" }, "Are you sure?"),
        createElement(
          AlertDialogDescription,
          { "data-testid": "desc" },
          "This action cannot be undone.",
        ),
        createElement(
          AlertDialogCancel,
          { "data-testid": "cancel-btn", onClick: props.onCancel } as never,
          "Cancel",
        ),
        createElement(
          AlertDialogAction,
          { "data-testid": "action-btn", onClick: props.onAction } as never,
          "Confirm",
        ),
      ),
    ),
  );
}
BasicAlertDialog.displayName = "BasicAlertDialog";

// ─── Rendering ──────────────────────────────────────────────────────

describe("AlertDialog: rendering", () => {
  it("renders trigger", () => {
    render(createElement(BasicAlertDialog));
    const trigger = screen.getByTestId("trigger");
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("data-kui-component")).toBe("AlertDialogTrigger");
    expect(trigger.getAttribute("data-state")).toBe("closed");
  });

  it("does not render content when closed", () => {
    render(createElement(BasicAlertDialog));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("renders content when open", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("title")).not.toBeNull();
    expect(screen.getByTestId("desc")).not.toBeNull();
    expect(screen.getByTestId("cancel-btn")).not.toBeNull();
    expect(screen.getByTestId("action-btn")).not.toBeNull();
  });
});

// ─── Accessibility (alertdialog role) ───────────────────────────────

describe("AlertDialog: accessibility", () => {
  it("content has role=alertdialog", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("role")).toBe("alertdialog");
  });

  it("has aria-modal=true", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("aria-modal")).toBe("true");
  });

  it("content is labelled by title", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    const titleId = screen.getByTestId("title").id;
    expect(content.getAttribute("aria-labelledby")).toBe(titleId);
  });

  it("content is described by description", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    const descId = screen.getByTestId("desc").id;
    expect(content.getAttribute("aria-describedby")).toBe(descId);
  });

  it("backdrop has aria-hidden", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("backdrop").getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── Focus management ───────────────────────────────────────────────

describe("AlertDialog: focus", () => {
  it("focuses Cancel button on open (initial focus on safe action)", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("cancel-btn"));
  });

  it("traps focus within the dialog", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    const actionBtn = screen.getByTestId("action-btn");
    actionBtn.focus();

    // Tab from last tabbable wraps to first
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("cancel-btn"));
  });

  it("restores focus on close", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "external trigger";
    document.body.appendChild(trigger);
    trigger.focus();

    function Wrapper({ show }: { show: boolean }) {
      return show ? createElement(BasicAlertDialog, { defaultOpen: true }) : null;
    }
    Wrapper.displayName = "Wrapper";

    const { rerender } = render(createElement(Wrapper, { show: true }));
    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("cancel-btn"));

    rerender(createElement(Wrapper, { show: false }));
    await waitForRaf();
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });
});

// ─── Dismissal behavior ─────────────────────────────────────────────

describe("AlertDialog: dismissal", () => {
  it("closes on Escape key by default", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("does not close on outside pointer-down (destructive protection)", async () => {
    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(BasicAlertDialog, { defaultOpen: true }),
      ),
    );
    await waitForRaf();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    // AlertDialog should NOT dismiss on outside click
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("supports consumer cancellation of Escape", async () => {
    const onEscapeKeyDown = vi.fn((e: KeyboardEvent) => {
      e.preventDefault();
    });
    render(createElement(BasicAlertDialog, { defaultOpen: true, onEscapeKeyDown }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("content")).not.toBeNull();
  });
});

// ─── Action and Cancel ──────────────────────────────────────────────

describe("AlertDialog: action/cancel", () => {
  it("Action button closes the dialog", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("action-btn"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("Cancel button closes the dialog", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("calls onOpenChange(false) when action is clicked", async () => {
    const onOpenChange = vi.fn();
    render(createElement(BasicAlertDialog, { defaultOpen: true, onOpenChange }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("action-btn"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

// ─── Scroll lock ────────────────────────────────────────────────────

describe("AlertDialog: scroll lock", () => {
  it("locks scroll when open", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("unlocks scroll on close", async () => {
    render(createElement(BasicAlertDialog, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(document.body.style.overflow).toBe("");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("AlertDialog: SSR", () => {
  it("renders only trigger on server", () => {
    const html = renderToString(createElement(BasicAlertDialog));
    expect(html).toContain("Delete");
    expect(html).not.toContain("Are you sure?");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("AlertDialog: Strict Mode", () => {
  it("works correctly in StrictMode", async () => {
    render(createElement(StrictMode, null, createElement(BasicAlertDialog, { defaultOpen: true })));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("content").getAttribute("role")).toBe("alertdialog");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });
});
