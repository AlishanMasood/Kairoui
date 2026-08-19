import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerBackdrop,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "./drawer";
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

function BasicDrawer(props: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "left" | "right" | "top" | "bottom";
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}) {
  return createElement(
    Drawer,
    {
      defaultOpen: props.defaultOpen,
      open: props.open,
      onOpenChange: props.onOpenChange,
      side: props.side,
    },
    createElement(DrawerTrigger, { "data-testid": "trigger" } as never, "Open"),
    createElement(
      DrawerPortal,
      null,
      createElement(DrawerBackdrop, { "data-testid": "backdrop" }),
      createElement(
        DrawerContent,
        {
          "data-testid": "content",
          ...(props.onEscapeKeyDown ? { onEscapeKeyDown: props.onEscapeKeyDown } : undefined),
        } as never,
        createElement(DrawerTitle, { "data-testid": "title" }, "Drawer Title"),
        createElement(DrawerDescription, { "data-testid": "desc" }, "Description"),
        createElement(DrawerClose, { "data-testid": "close-btn" }, "Close"),
      ),
    ),
  );
}
BasicDrawer.displayName = "BasicDrawer";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Drawer: rendering", () => {
  it("renders trigger with correct attributes", () => {
    render(createElement(BasicDrawer));
    const trigger = screen.getByTestId("trigger");
    expect(trigger.getAttribute("data-kui-component")).toBe("DrawerTrigger");
    expect(trigger.getAttribute("data-state")).toBe("closed");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("does not render content when closed", () => {
    render(createElement(BasicDrawer));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("renders content when open", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("title")).not.toBeNull();
    expect(screen.getByTestId("desc")).not.toBeNull();
  });
});

// ─── Side placement ─────────────────────────────────────────────────

describe("Drawer: side placement", () => {
  it("defaults to right side", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("data-side")).toBe("right");
  });

  it("supports left side", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true, side: "left" }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("data-side")).toBe("left");
  });

  it("supports top side", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true, side: "top" }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("data-side")).toBe("top");
  });

  it("supports bottom side", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true, side: "bottom" }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("data-side")).toBe("bottom");
  });
});

// ─── Open/close ─────────────────────────────────────────────────────

describe("Drawer: open state", () => {
  it("opens when trigger is clicked", async () => {
    render(createElement(BasicDrawer));
    fireEvent.click(screen.getByTestId("trigger"));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("closes when close button is clicked", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("close-btn"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("calls onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(createElement(BasicDrawer, { onOpenChange }));
    fireEvent.click(screen.getByTestId("trigger"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Drawer: accessibility", () => {
  it("content has role=dialog", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("role")).toBe("dialog");
  });

  it("has aria-modal=true", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("aria-modal")).toBe("true");
  });

  it("labelled by title", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    const titleId = screen.getByTestId("title").id;
    expect(content.getAttribute("aria-labelledby")).toBe(titleId);
  });

  it("described by description", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    const descId = screen.getByTestId("desc").id;
    expect(content.getAttribute("aria-describedby")).toBe(descId);
  });
});

// ─── Escape ─────────────────────────────────────────────────────────

describe("Drawer: escape dismissal", () => {
  it("closes on Escape", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("consumer can prevent Escape dismissal", async () => {
    const onEscapeKeyDown = vi.fn((e: KeyboardEvent) => {
      e.preventDefault();
    });
    render(createElement(BasicDrawer, { defaultOpen: true, onEscapeKeyDown }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("content")).not.toBeNull();
  });
});

// ─── Outside click ──────────────────────────────────────────────────

describe("Drawer: outside click", () => {
  it("closes on pointer-down outside", async () => {
    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(BasicDrawer, { defaultOpen: true }),
      ),
    );
    await waitForRaf();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Focus management ───────────────────────────────────────────────

describe("Drawer: focus", () => {
  it("focuses first tabbable on open", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    expect(document.activeElement).toBe(screen.getByTestId("close-btn"));
  });

  it("traps focus", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    const btn = screen.getByTestId("close-btn");
    btn.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(btn);
  });
});

// ─── Scroll lock ────────────────────────────────────────────────────

describe("Drawer: scroll lock", () => {
  it("locks scroll when open", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("unlocks on close", async () => {
    render(createElement(BasicDrawer, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("close-btn"));
    expect(document.body.style.overflow).toBe("");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Drawer: SSR", () => {
  it("renders trigger on server, not content", () => {
    const html = renderToString(createElement(BasicDrawer));
    expect(html).toContain("Open");
    expect(html).not.toContain("Drawer Title");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Drawer: Strict Mode", () => {
  it("works in StrictMode", async () => {
    render(createElement(StrictMode, null, createElement(BasicDrawer, { defaultOpen: true })));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});
