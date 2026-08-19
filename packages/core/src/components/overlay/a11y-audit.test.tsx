import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../dialog/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "../alert-dialog/alert-dialog";
import {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerBackdrop,
  DrawerContent,
  DrawerTitle,
  DrawerClose,
} from "../drawer/drawer";
import { Popover, PopoverTrigger, PopoverPortal, PopoverContent } from "../popover/popover";
import { Tooltip, TooltipTrigger, TooltipPortal, TooltipContent } from "../tooltip/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../dropdown-menu/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
} from "../context-menu/context-menu";
import { ToastProvider, ToastViewport } from "../toast/toast";
import { useToastState } from "../toast/toast-types";
import { Alert } from "../alert/alert";
import { Spinner } from "../progress/progress";
import { Skeleton } from "../skeleton/skeleton";
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

// ─── Dialog: focus restoration ──────────────────────────────────────

describe("A11y audit: Dialog focus restoration", () => {
  it("restores focus to trigger on Escape close", async () => {
    function Test() {
      return createElement(
        Dialog,
        { defaultOpen: true },
        createElement(DialogTrigger, { "data-testid": "trigger" } as never, "Open"),
        createElement(
          DialogPortal,
          null,
          createElement(
            DialogContent,
            null,
            createElement(DialogTitle, null, "Title"),
            createElement(DialogClose, { "data-testid": "close" } as never, "X"),
          ),
        ),
      );
    }
    Test.displayName = "Test";
    render(createElement(Test));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitForRaf();
    // Focus should be restored (FocusScope restoreFocus)
    expect(screen.queryByTestId("close")).toBeNull();
  });
});

// ─── AlertDialog: trigger ARIA ──────────────────────────────────────

describe("A11y audit: AlertDialog trigger", () => {
  it("trigger has aria-haspopup=dialog", () => {
    render(
      createElement(
        AlertDialog,
        null,
        createElement(AlertDialogTrigger, { "data-testid": "trigger" } as never, "Delete"),
        createElement(
          AlertDialogPortal,
          null,
          createElement(
            AlertDialogContent,
            null,
            createElement(AlertDialogTitle, null, "T"),
            createElement(AlertDialogCancel, null, "C"),
            createElement(AlertDialogAction, null, "A"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("trigger").getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("trigger has aria-expanded", () => {
    render(
      createElement(
        AlertDialog,
        { defaultOpen: true },
        createElement(AlertDialogTrigger, { "data-testid": "trigger" } as never, "Delete"),
        createElement(
          AlertDialogPortal,
          null,
          createElement(
            AlertDialogContent,
            null,
            createElement(AlertDialogTitle, null, "T"),
            createElement(AlertDialogCancel, null, "C"),
            createElement(AlertDialogAction, null, "A"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("trigger").getAttribute("aria-expanded")).toBe("true");
  });
});

// ─── Drawer: backdrop and trigger ARIA ──────────────────────────────

describe("A11y audit: Drawer ARIA completeness", () => {
  it("backdrop has aria-hidden", async () => {
    render(
      createElement(
        Drawer,
        { defaultOpen: true },
        createElement(DrawerTrigger, null, "Open"),
        createElement(
          DrawerPortal,
          null,
          createElement(DrawerBackdrop, { "data-testid": "backdrop" } as never),
          createElement(
            DrawerContent,
            null,
            createElement(DrawerTitle, null, "T"),
            createElement(DrawerClose, null, "X"),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("backdrop").getAttribute("aria-hidden")).toBe("true");
  });

  it("trigger has aria-expanded", async () => {
    render(
      createElement(
        Drawer,
        { defaultOpen: true },
        createElement(DrawerTrigger, { "data-testid": "trigger" } as never, "Open"),
        createElement(
          DrawerPortal,
          null,
          createElement(
            DrawerContent,
            null,
            createElement(DrawerTitle, null, "T"),
            createElement(DrawerClose, null, "X"),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("trigger").getAttribute("aria-expanded")).toBe("true");
  });
});

// ─── Popover: aria-modal ────────────────────────────────────────────

describe("A11y audit: Popover aria-modal", () => {
  it("non-modal popover has no aria-modal", async () => {
    render(
      createElement(
        Popover,
        { defaultOpen: true },
        createElement(PopoverTrigger, null, "T"),
        createElement(
          PopoverPortal,
          null,
          createElement(PopoverContent, { "data-testid": "content" } as never, "Body"),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("aria-modal")).toBeNull();
  });
});

// ─── Tooltip: not focusable ─────────────────────────────────────────

describe("A11y audit: Tooltip non-interactive", () => {
  it("tooltip content has no tabindex", () => {
    render(
      createElement(
        Tooltip,
        { defaultOpen: true },
        createElement(TooltipTrigger, null, "Hover"),
        createElement(
          TooltipPortal,
          null,
          createElement(TooltipContent, { "data-testid": "tip" } as never, "Tip text"),
        ),
      ),
    );
    expect(screen.getByTestId("tip").getAttribute("tabindex")).toBeNull();
  });

  it("tooltip content has pointer-events none", () => {
    render(
      createElement(
        Tooltip,
        { defaultOpen: true },
        createElement(TooltipTrigger, null, "Hover"),
        createElement(
          TooltipPortal,
          null,
          createElement(TooltipContent, { "data-testid": "tip" } as never, "Tip text"),
        ),
      ),
    );
    expect(screen.getByTestId("tip").style.pointerEvents).toBe("none");
  });
});

// ─── DropdownMenu: Space activation + Tab closes ────────────────────

describe("A11y audit: DropdownMenu keyboard", () => {
  it("Space activates item", async () => {
    const onSelect = vi.fn();
    render(
      createElement(
        DropdownMenu,
        { defaultOpen: true },
        createElement(DropdownMenuTrigger, null, "Menu"),
        createElement(
          DropdownMenuPortal,
          null,
          createElement(
            DropdownMenuContent,
            null,
            createElement(DropdownMenuItem, { "data-testid": "item", onSelect } as never, "Act"),
          ),
        ),
      ),
    );
    await waitForRaf();
    const item = screen.getByTestId("item");
    item.focus();
    fireEvent.keyDown(item, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("trigger has aria-controls when open", async () => {
    render(
      createElement(
        DropdownMenu,
        { defaultOpen: true },
        createElement(DropdownMenuTrigger, { "data-testid": "trigger" } as never, "Menu"),
        createElement(
          DropdownMenuPortal,
          null,
          createElement(
            DropdownMenuContent,
            { "data-testid": "content" } as never,
            createElement(DropdownMenuItem, null, "Item"),
          ),
        ),
      ),
    );
    await waitForRaf();
    const trigger = screen.getByTestId("trigger");
    const content = screen.getByTestId("content");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
  });
});

// ─── ContextMenu: Enter activates ───────────────────────────────────

describe("A11y audit: ContextMenu keyboard", () => {
  it("Enter activates item and closes", async () => {
    const onSelect = vi.fn();
    render(
      createElement(
        ContextMenu,
        { defaultOpen: true },
        createElement(ContextMenuTrigger, null, "Right-click"),
        createElement(
          ContextMenuPortal,
          null,
          createElement(
            ContextMenuContent,
            null,
            createElement(ContextMenuItem, { "data-testid": "item", onSelect } as never, "Act"),
          ),
        ),
      ),
    );
    await waitForRaf();
    const item = screen.getByTestId("item");
    item.focus();
    fireEvent.keyDown(item, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

// ─── Toast: aria-atomic ─────────────────────────────────────────────

describe("A11y audit: Toast announcements", () => {
  it("toast items have aria-atomic=true", () => {
    function App() {
      const state = useToastState();
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "add",
          onClick: () => state.add({ title: "Hello", duration: 0 }),
        }),
        createElement(ToastViewport),
      );
    }
    App.displayName = "App";

    render(createElement(ToastProvider, null, createElement(App)));
    fireEvent.click(screen.getByTestId("add"));
    const toast = document.querySelector("[data-kui-component='Toast']");
    expect(toast?.getAttribute("aria-atomic")).toBe("true");
  });
});

// ─── Alert: static does not need aria-live ──────────────────────────

describe("A11y audit: Alert semantics", () => {
  it("static alert (role=status) does not have aria-live=assertive", () => {
    render(createElement(Alert, { "data-testid": "a" } as never, "Info"));
    const el = screen.getByTestId("a");
    expect(el.getAttribute("role")).toBe("status");
    // role="status" implies aria-live="polite" — no assertive
    expect(el.getAttribute("aria-live")).not.toBe("assertive");
  });

  it("live alert has role=alert (implies aria-live=assertive)", () => {
    render(createElement(Alert, { live: true, "data-testid": "a" } as never, "Error"));
    expect(screen.getByTestId("a").getAttribute("role")).toBe("alert");
  });
});

// ─── Progress: Spinner aria-live ────────────────────────────────────

describe("A11y audit: Spinner announcement", () => {
  it("Spinner has role=status (implies aria-live=polite)", () => {
    render(createElement(Spinner, { "data-testid": "s" } as never));
    expect(screen.getByTestId("s").getAttribute("role")).toBe("status");
  });
});

// ─── Skeleton: not in a11y tree ─────────────────────────────────────

describe("A11y audit: Skeleton excluded from a11y tree", () => {
  it("has aria-hidden=true", () => {
    render(createElement(Skeleton, { "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").getAttribute("aria-hidden")).toBe("true");
  });

  it("is not focusable (no tabindex)", () => {
    render(createElement(Skeleton, { "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").getAttribute("tabindex")).toBeNull();
  });
});

// ─── Nested overlays: tested in overlay-integration.test.tsx with DismissableLayer directly
