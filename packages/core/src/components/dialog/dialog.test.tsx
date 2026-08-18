import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, useState, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";
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

function BasicDialog(props: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
}) {
  return createElement(
    Dialog,
    {
      defaultOpen: props.defaultOpen,
      open: props.open,
      onOpenChange: props.onOpenChange,
      modal: props.modal,
    },
    createElement(DialogTrigger, { "data-testid": "trigger" } as never, "Open"),
    createElement(
      DialogPortal,
      null,
      createElement(DialogBackdrop, { "data-testid": "backdrop" }),
      createElement(
        DialogContent,
        {
          "data-testid": "content",
          ...(props.onEscapeKeyDown ? { onEscapeKeyDown: props.onEscapeKeyDown } : undefined),
          ...(props.onPointerDownOutside
            ? { onPointerDownOutside: props.onPointerDownOutside }
            : undefined),
        } as never,
        createElement(DialogTitle, { "data-testid": "title" }, "Dialog Title"),
        createElement(DialogDescription, { "data-testid": "desc" }, "Description text"),
        createElement(DialogClose, { "data-testid": "close-btn" }, "Close"),
      ),
    ),
  );
}
BasicDialog.displayName = "BasicDialog";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Dialog: rendering", () => {
  it("renders trigger with correct attributes", () => {
    render(createElement(BasicDialog));
    const trigger = screen.getByTestId("trigger");
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("data-kui-component")).toBe("DialogTrigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("data-state")).toBe("closed");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not render content when closed", () => {
    render(createElement(BasicDialog));
    expect(screen.queryByTestId("content")).toBeNull();
    expect(screen.queryByTestId("backdrop")).toBeNull();
  });

  it("renders content when open", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("backdrop")).not.toBeNull();
    expect(screen.getByTestId("title")).not.toBeNull();
    expect(screen.getByTestId("desc")).not.toBeNull();
    expect(screen.getByTestId("close-btn")).not.toBeNull();
  });
});

// ─── Open/close ─────────────────────────────────────────────────────

describe("Dialog: open state", () => {
  it("opens when trigger is clicked", async () => {
    render(createElement(BasicDialog));
    fireEvent.click(screen.getByTestId("trigger"));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("trigger").getAttribute("data-state")).toBe("open");
  });

  it("closes when close button is clicked", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("close-btn"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("calls onOpenChange when opened/closed", async () => {
    const onOpenChange = vi.fn();
    render(createElement(BasicDialog, { onOpenChange }));
    fireEvent.click(screen.getByTestId("trigger"));
    expect(onOpenChange).toHaveBeenCalledWith(true);

    await waitForRaf();
    fireEvent.click(screen.getByTestId("close-btn"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("supports controlled open state", async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return createElement(BasicDialog, { open, onOpenChange: setOpen });
    }
    Controlled.displayName = "Controlled";

    render(createElement(Controlled));
    expect(screen.queryByTestId("content")).toBeNull();

    fireEvent.click(screen.getByTestId("trigger"));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Dialog: accessibility", () => {
  it("content has role=dialog", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    expect(content.getAttribute("role")).toBe("dialog");
  });

  it("has aria-modal=true for modal dialog", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("aria-modal")).toBe("true");
  });

  it("has no aria-modal for non-modal dialog", async () => {
    render(createElement(BasicDialog, { defaultOpen: true, modal: false }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("aria-modal")).toBeNull();
  });

  it("content is labelled by title", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    const titleId = screen.getByTestId("title").id;
    expect(content.getAttribute("aria-labelledby")).toBe(titleId);
  });

  it("content is described by description", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    const descId = screen.getByTestId("desc").id;
    expect(content.getAttribute("aria-describedby")).toBe(descId);
  });

  it("trigger has aria-controls pointing to content when open", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    const trigger = screen.getByTestId("trigger");
    const content = screen.getByTestId("content");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
  });

  it("backdrop has aria-hidden", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("backdrop").getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── Escape dismissal ───────────────────────────────────────────────

describe("Dialog: escape dismissal", () => {
  it("closes on Escape key", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("calls onEscapeKeyDown before closing", async () => {
    const onEscapeKeyDown = vi.fn();
    render(createElement(BasicDialog, { defaultOpen: true, onEscapeKeyDown }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
  });

  it("does not close if onEscapeKeyDown prevents default", async () => {
    const onEscapeKeyDown = vi.fn((e: KeyboardEvent) => {
      e.preventDefault();
    });
    render(createElement(BasicDialog, { defaultOpen: true, onEscapeKeyDown }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("content")).not.toBeNull();
  });
});

// ─── Outside click ──────────────────────────────────────────────────

describe("Dialog: outside click", () => {
  it("closes on pointer-down outside", async () => {
    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(BasicDialog, { defaultOpen: true }),
      ),
    );
    await waitForRaf();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Focus management ───────────────────────────────────────────────

describe("Dialog: focus", () => {
  it("focuses first tabbable element on open (modal)", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    // Close button is the first tabbable in our BasicDialog
    expect(document.activeElement).toBe(screen.getByTestId("close-btn"));
  });

  it("traps focus in modal dialog", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    const closeBtn = screen.getByTestId("close-btn");
    closeBtn.focus();

    // Tab from last tabbable should wrap to first
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeBtn);
  });

  it("does not trap focus in non-modal dialog", async () => {
    render(createElement(BasicDialog, { defaultOpen: true, modal: false }));
    await waitForRaf();
    // Tab should not be prevented
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

// ─── Scroll lock ────────────────────────────────────────────────────

describe("Dialog: scroll lock", () => {
  it("locks scroll when modal dialog is open", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does not lock scroll for non-modal dialog", async () => {
    render(createElement(BasicDialog, { defaultOpen: true, modal: false }));
    await waitForRaf();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("unlocks scroll when dialog closes", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByTestId("close-btn"));
    expect(document.body.style.overflow).toBe("");
  });
});

// ─── data-kui-component markers ─────────────────────────────────────

describe("Dialog: component markers", () => {
  it("all sub-components have data-kui-component", async () => {
    render(createElement(BasicDialog, { defaultOpen: true }));
    await waitForRaf();

    expect(screen.getByTestId("trigger").getAttribute("data-kui-component")).toBe("DialogTrigger");
    expect(screen.getByTestId("content").getAttribute("data-kui-component")).toBe("DialogContent");
    expect(screen.getByTestId("backdrop").getAttribute("data-kui-component")).toBe(
      "DialogBackdrop",
    );
    expect(screen.getByTestId("title").getAttribute("data-kui-component")).toBe("DialogTitle");
    expect(screen.getByTestId("desc").getAttribute("data-kui-component")).toBe("DialogDescription");
    expect(screen.getByTestId("close-btn").getAttribute("data-kui-component")).toBe("DialogClose");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Dialog: SSR", () => {
  it("renders trigger on server, not content", () => {
    const html = renderToString(createElement(BasicDialog));
    expect(html).toContain("Open");
    expect(html).not.toContain("Dialog Title");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Dialog: Strict Mode", () => {
  it("works correctly in StrictMode", async () => {
    render(createElement(StrictMode, null, createElement(BasicDialog, { defaultOpen: true })));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});
