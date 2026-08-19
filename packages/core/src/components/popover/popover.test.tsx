import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
} from "./popover";
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

function BasicPopover(props: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}) {
  return createElement(
    Popover,
    {
      defaultOpen: props.defaultOpen,
      open: props.open,
      onOpenChange: props.onOpenChange,
      modal: props.modal,
    },
    createElement(PopoverTrigger, { "data-testid": "trigger" } as never, "Toggle"),
    createElement(
      PopoverPortal,
      null,
      createElement(
        PopoverContent,
        {
          "data-testid": "content",
          ...(props.onEscapeKeyDown ? { onEscapeKeyDown: props.onEscapeKeyDown } : undefined),
        } as never,
        createElement(PopoverArrow, { "data-testid": "arrow" } as never),
        createElement("p", null, "Popover body"),
        createElement(PopoverClose, { "data-testid": "close-btn" }, "Close"),
      ),
    ),
  );
}
BasicPopover.displayName = "BasicPopover";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Popover: rendering", () => {
  it("renders trigger", () => {
    render(createElement(BasicPopover));
    const trigger = screen.getByTestId("trigger");
    expect(trigger.getAttribute("data-kui-component")).toBe("PopoverTrigger");
    expect(trigger.getAttribute("data-state")).toBe("closed");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("does not render content when closed", () => {
    render(createElement(BasicPopover));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("renders content when open", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("content").getAttribute("role")).toBe("dialog");
  });
});

// ─── Open/close ─────────────────────────────────────────────────────

describe("Popover: open state", () => {
  it("opens on trigger click", async () => {
    render(createElement(BasicPopover));
    fireEvent.click(screen.getByTestId("trigger"));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("trigger").getAttribute("data-state")).toBe("open");
  });

  it("closes on close button click", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("close-btn"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("calls onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(createElement(BasicPopover, { onOpenChange }));
    fireEvent.click(screen.getByTestId("trigger"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

// ─── Escape dismissal ───────────────────────────────────────────────

describe("Popover: escape", () => {
  it("closes on Escape", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("consumer can prevent Escape", async () => {
    const onEscapeKeyDown = vi.fn((e: KeyboardEvent) => {
      e.preventDefault();
    });
    render(createElement(BasicPopover, { defaultOpen: true, onEscapeKeyDown }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("content")).not.toBeNull();
  });
});

// ─── Outside click ──────────────────────────────────────────────────

describe("Popover: outside click", () => {
  it("closes on pointer-down outside", async () => {
    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(BasicPopover, { defaultOpen: true }),
      ),
    );
    await waitForRaf();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Non-modal focus behavior ───────────────────────────────────────

describe("Popover: focus (non-modal)", () => {
  it("auto-focuses content on open", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("close-btn"));
  });

  it("does not trap focus (non-modal default)", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("does not lock scroll (non-modal)", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

// ─── Modal mode ─────────────────────────────────────────────────────

describe("Popover: modal mode", () => {
  it("traps focus when modal", async () => {
    render(createElement(BasicPopover, { defaultOpen: true, modal: true }));
    await waitForRaf();
    const btn = screen.getByTestId("close-btn");
    btn.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(btn);
  });

  it("locks scroll when modal", async () => {
    render(createElement(BasicPopover, { defaultOpen: true, modal: true }));
    await waitForRaf();
    expect(document.body.style.overflow).toBe("hidden");
  });
});

// ─── Positioning ────────────────────────────────────────────────────

describe("Popover: positioning", () => {
  it("content has absolute positioning styles", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    expect(content.style.position).toBe("absolute");
    expect(content.style.transform).toContain("translate");
  });

  it("content has data-side attribute", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    expect(content.getAttribute("data-side")).toBe("bottom");
  });

  it("arrow is rendered with positioning", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    const arrow = screen.getByTestId("arrow");
    expect(arrow.getAttribute("data-kui-component")).toBe("PopoverArrow");
    expect(arrow.style.position).toBe("absolute");
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Popover: accessibility", () => {
  it("trigger has aria-controls when open", async () => {
    render(createElement(BasicPopover, { defaultOpen: true }));
    await waitForRaf();
    const trigger = screen.getByTestId("trigger");
    const content = screen.getByTestId("content");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
  });

  it("trigger has aria-expanded", () => {
    render(createElement(BasicPopover));
    expect(screen.getByTestId("trigger").getAttribute("aria-expanded")).toBe("false");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Popover: SSR", () => {
  it("renders trigger on server, not content", () => {
    const html = renderToString(createElement(BasicPopover));
    expect(html).toContain("Toggle");
    expect(html).not.toContain("Popover body");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Popover: Strict Mode", () => {
  it("works in StrictMode", async () => {
    render(createElement(StrictMode, null, createElement(BasicPopover, { defaultOpen: true })));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });
});
