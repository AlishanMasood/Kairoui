import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "./context-menu";
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

function BasicContextMenu(props: { defaultOpen?: boolean }) {
  return createElement(
    ContextMenu,
    { defaultOpen: props.defaultOpen },
    createElement(ContextMenuTrigger, { "data-testid": "trigger" } as never, "Right-click here"),
    createElement(
      ContextMenuPortal,
      null,
      createElement(
        ContextMenuContent,
        { "data-testid": "content" } as never,
        createElement(
          ContextMenuItem,
          { "data-testid": "item-1", onSelect: () => {} } as never,
          "Cut",
        ),
        createElement(
          ContextMenuItem,
          { "data-testid": "item-2", onSelect: () => {} } as never,
          "Copy",
        ),
        createElement(
          ContextMenuItem,
          { "data-testid": "item-3", disabled: true } as never,
          "Paste",
        ),
      ),
    ),
  );
}
BasicContextMenu.displayName = "BasicContextMenu";

// ─── Rendering ──────────────────────────────────────────────────────

describe("ContextMenu: rendering", () => {
  it("renders trigger", () => {
    render(createElement(BasicContextMenu));
    const trigger = screen.getByTestId("trigger");
    expect(trigger.getAttribute("data-kui-component")).toBe("ContextMenuTrigger");
    expect(trigger.getAttribute("data-state")).toBe("closed");
  });

  it("does not render content when closed", () => {
    render(createElement(BasicContextMenu));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("renders content when open", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("content").getAttribute("role")).toBe("menu");
  });
});

// ─── Context menu trigger ───────────────────────────────────────────

describe("ContextMenu: trigger", () => {
  it("opens on contextmenu event (right-click)", async () => {
    render(createElement(BasicContextMenu));
    fireEvent.contextMenu(screen.getByTestId("trigger"));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("prevents native context menu", () => {
    render(createElement(BasicContextMenu));
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    screen.getByTestId("trigger").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

// ─── Dismissal ──────────────────────────────────────────────────────

describe("ContextMenu: dismissal", () => {
  it("closes on Escape", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("closes on outside pointer-down", async () => {
    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(BasicContextMenu, { defaultOpen: true }),
      ),
    );
    await waitForRaf();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Keyboard navigation ────────────────────────────────────────────

describe("ContextMenu: keyboard", () => {
  it("ArrowDown moves focus to next item", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    screen.getByTestId("item-1").focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("item-2"));
  });

  it("ArrowUp moves focus to previous item", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    screen.getByTestId("item-2").focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(screen.getByTestId("item-1"));
  });

  it("Home moves to first item", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    screen.getByTestId("item-2").focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "Home" });
    expect(document.activeElement).toBe(screen.getByTestId("item-1"));
  });

  it("End moves to last enabled item", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    screen.getByTestId("item-1").focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "End" });
    expect(document.activeElement).toBe(screen.getByTestId("item-2"));
  });
});

// ─── Item selection ─────────────────────────────────────────────────

describe("ContextMenu: items", () => {
  it("clicking item calls onSelect and closes", async () => {
    const onSelect = vi.fn();
    render(
      createElement(
        ContextMenu,
        { defaultOpen: true },
        createElement(ContextMenuTrigger, null, "Trigger"),
        createElement(
          ContextMenuPortal,
          null,
          createElement(
            ContextMenuContent,
            null,
            createElement(ContextMenuItem, { "data-testid": "item", onSelect } as never, "Action"),
          ),
        ),
      ),
    );
    await waitForRaf();
    fireEvent.click(screen.getByTestId("item"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("item")).toBeNull();
  });

  it("disabled item has aria-disabled", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("item-3").getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Checkbox items ─────────────────────────────────────────────────

describe("ContextMenu: checkbox items", () => {
  it("toggles checked state", async () => {
    const onCheckedChange = vi.fn();
    render(
      createElement(
        ContextMenu,
        { defaultOpen: true },
        createElement(ContextMenuTrigger, null, "T"),
        createElement(
          ContextMenuPortal,
          null,
          createElement(
            ContextMenuContent,
            null,
            createElement(
              ContextMenuCheckboxItem,
              { "data-testid": "cb", onCheckedChange } as never,
              "Check",
            ),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("cb").getAttribute("role")).toBe("menuitemcheckbox");
    fireEvent.click(screen.getByTestId("cb"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

// ─── Radio items ────────────────────────────────────────────────────

describe("ContextMenu: radio items", () => {
  it("selects radio item", async () => {
    const onValueChange = vi.fn();
    render(
      createElement(
        ContextMenu,
        { defaultOpen: true },
        createElement(ContextMenuTrigger, null, "T"),
        createElement(
          ContextMenuPortal,
          null,
          createElement(
            ContextMenuContent,
            null,
            createElement(
              ContextMenuRadioGroup,
              { defaultValue: "a", onValueChange },
              createElement(
                ContextMenuRadioItem,
                { "data-testid": "ra", value: "a" } as never,
                "A",
              ),
              createElement(
                ContextMenuRadioItem,
                { "data-testid": "rb", value: "b" } as never,
                "B",
              ),
            ),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("ra").getAttribute("role")).toBe("menuitemradio");
    expect(screen.getByTestId("ra").getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByTestId("rb"));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});

// ─── Groups/labels/separators ───────────────────────────────────────

describe("ContextMenu: groups", () => {
  it("renders group/label/separator with correct roles", async () => {
    render(
      createElement(
        ContextMenu,
        { defaultOpen: true },
        createElement(ContextMenuTrigger, null, "T"),
        createElement(
          ContextMenuPortal,
          null,
          createElement(
            ContextMenuContent,
            null,
            createElement(
              ContextMenuGroup,
              { "data-testid": "group" } as never,
              createElement(ContextMenuLabel, { "data-testid": "label" } as never, "Actions"),
              createElement(ContextMenuItem, null, "Item"),
            ),
            createElement(ContextMenuSeparator, { "data-testid": "sep" } as never),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("group").getAttribute("role")).toBe("group");
    expect(screen.getByTestId("sep").getAttribute("role")).toBe("separator");
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("ContextMenu: accessibility", () => {
  it("content has role=menu", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content").getAttribute("role")).toBe("menu");
  });

  it("items have role=menuitem", async () => {
    render(createElement(BasicContextMenu, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("item-1").getAttribute("role")).toBe("menuitem");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("ContextMenu: SSR", () => {
  it("renders trigger, not content on server", () => {
    const html = renderToString(createElement(BasicContextMenu));
    expect(html).toContain("Right-click here");
    expect(html).not.toContain("Cut");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("ContextMenu: Strict Mode", () => {
  it("works in StrictMode", async () => {
    render(createElement(StrictMode, null, createElement(BasicContextMenu, { defaultOpen: true })));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });
});
