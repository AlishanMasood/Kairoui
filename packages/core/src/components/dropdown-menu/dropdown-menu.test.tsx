import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./dropdown-menu";
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

function BasicMenu(props: { defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
  return createElement(
    DropdownMenu,
    { defaultOpen: props.defaultOpen, onOpenChange: props.onOpenChange },
    createElement(DropdownMenuTrigger, { "data-testid": "trigger" } as never, "Menu"),
    createElement(
      DropdownMenuPortal,
      null,
      createElement(
        DropdownMenuContent,
        { "data-testid": "content" } as never,
        createElement(
          DropdownMenuItem,
          { "data-testid": "item-1", onSelect: () => {} } as never,
          "Cut",
        ),
        createElement(
          DropdownMenuItem,
          { "data-testid": "item-2", onSelect: () => {} } as never,
          "Copy",
        ),
        createElement(
          DropdownMenuItem,
          { "data-testid": "item-3", disabled: true } as never,
          "Paste",
        ),
      ),
    ),
  );
}
BasicMenu.displayName = "BasicMenu";

// ─── Rendering ──────────────────────────────────────────────────────

describe("DropdownMenu: rendering", () => {
  it("renders trigger with correct attributes", () => {
    render(createElement(BasicMenu));
    const trigger = screen.getByTestId("trigger");
    expect(trigger.getAttribute("data-kui-component")).toBe("DropdownMenuTrigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("data-state")).toBe("closed");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not render content when closed", () => {
    render(createElement(BasicMenu));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("renders content when open", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("content").getAttribute("role")).toBe("menu");
  });
});

// ─── Open/close ─────────────────────────────────────────────────────

describe("DropdownMenu: open state", () => {
  it("opens on trigger click", async () => {
    render(createElement(BasicMenu));
    fireEvent.click(screen.getByTestId("trigger"));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("closes on Escape", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("calls onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(createElement(BasicMenu, { onOpenChange }));
    fireEvent.click(screen.getByTestId("trigger"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("closes on outside pointer-down", async () => {
    render(
      createElement(
        "div",
        { "data-testid": "outside" },
        createElement(BasicMenu, { defaultOpen: true }),
      ),
    );
    await waitForRaf();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Keyboard navigation ────────────────────────────────────────────

describe("DropdownMenu: keyboard", () => {
  it("ArrowDown on trigger opens menu", async () => {
    render(createElement(BasicMenu));
    fireEvent.keyDown(screen.getByTestId("trigger"), { key: "ArrowDown" });
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("ArrowDown moves focus to next item", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    const item1 = screen.getByTestId("item-1");
    item1.focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("item-2"));
  });

  it("ArrowUp moves focus to previous item", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    const item2 = screen.getByTestId("item-2");
    item2.focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(screen.getByTestId("item-1"));
  });

  it("Home moves focus to first item", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    const item2 = screen.getByTestId("item-2");
    item2.focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "Home" });
    expect(document.activeElement).toBe(screen.getByTestId("item-1"));
  });

  it("End moves focus to last enabled item", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    const item1 = screen.getByTestId("item-1");
    item1.focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "End" });
    expect(document.activeElement).toBe(screen.getByTestId("item-2"));
  });
});

// ─── Item selection ─────────────────────────────────────────────────

describe("DropdownMenu: items", () => {
  it("clicking item calls onSelect and closes menu", async () => {
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
            createElement(DropdownMenuItem, { "data-testid": "item", onSelect } as never, "Action"),
          ),
        ),
      ),
    );
    await waitForRaf();
    fireEvent.click(screen.getByTestId("item"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("item")).toBeNull();
  });

  it("disabled item cannot be selected", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("item-3"));
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("Enter key activates item", async () => {
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
            createElement(DropdownMenuItem, { "data-testid": "item", onSelect } as never, "Action"),
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

// ─── Disabled items ─────────────────────────────────────────────────

describe("DropdownMenu: disabled items", () => {
  it("disabled item has aria-disabled", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("item-3").getAttribute("aria-disabled")).toBe("true");
  });

  it("ArrowDown skips disabled items", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    screen.getByTestId("item-2").focus();
    fireEvent.keyDown(screen.getByTestId("content"), { key: "ArrowDown" });
    // item-3 is disabled, navigation stops at item-2
    expect(document.activeElement).toBe(screen.getByTestId("item-2"));
  });
});

// ─── Checkbox items ─────────────────────────────────────────────────

describe("DropdownMenu: checkbox items", () => {
  it("toggles checked state on click", async () => {
    const onCheckedChange = vi.fn();
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
            createElement(
              DropdownMenuCheckboxItem,
              { "data-testid": "checkbox", onCheckedChange } as never,
              "Show lines",
            ),
          ),
        ),
      ),
    );
    await waitForRaf();
    const item = screen.getByTestId("checkbox");
    expect(item.getAttribute("role")).toBe("menuitemcheckbox");
    expect(item.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(item);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

// ─── Radio items ────────────────────────────────────────────────────

describe("DropdownMenu: radio items", () => {
  it("selects radio item on click", async () => {
    const onValueChange = vi.fn();

    function RadioMenu() {
      return createElement(
        DropdownMenu,
        { defaultOpen: true },
        createElement(DropdownMenuTrigger, null, "Menu"),
        createElement(
          DropdownMenuPortal,
          null,
          createElement(
            DropdownMenuContent,
            null,
            createElement(
              DropdownMenuRadioGroup,
              { defaultValue: "a", onValueChange },
              createElement(
                DropdownMenuRadioItem,
                { "data-testid": "radio-a", value: "a" } as never,
                "A",
              ),
              createElement(
                DropdownMenuRadioItem,
                { "data-testid": "radio-b", value: "b" } as never,
                "B",
              ),
            ),
          ),
        ),
      );
    }
    RadioMenu.displayName = "RadioMenu";

    render(createElement(RadioMenu));
    await waitForRaf();

    const radioA = screen.getByTestId("radio-a");
    expect(radioA.getAttribute("role")).toBe("menuitemradio");
    expect(radioA.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(screen.getByTestId("radio-b"));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});

// ─── Groups, labels, separators ─────────────────────────────────────

describe("DropdownMenu: groups/labels/separators", () => {
  it("renders group with role=group", async () => {
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
            createElement(
              DropdownMenuGroup,
              { "data-testid": "group" } as never,
              createElement(DropdownMenuLabel, { "data-testid": "label" } as never, "Actions"),
              createElement(DropdownMenuItem, null, "Item"),
            ),
            createElement(DropdownMenuSeparator, { "data-testid": "sep" } as never),
          ),
        ),
      ),
    );
    await waitForRaf();
    expect(screen.getByTestId("group").getAttribute("role")).toBe("group");
    expect(screen.getByTestId("label").getAttribute("data-kui-component")).toBe(
      "DropdownMenuLabel",
    );
    expect(screen.getByTestId("sep").getAttribute("role")).toBe("separator");
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("DropdownMenu: accessibility", () => {
  it("content has role=menu and aria-labelledby", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    const content = screen.getByTestId("content");
    expect(content.getAttribute("role")).toBe("menu");
    expect(content.getAttribute("aria-labelledby")).toBe(screen.getByTestId("trigger").id);
  });

  it("items have role=menuitem", async () => {
    render(createElement(BasicMenu, { defaultOpen: true }));
    await waitForRaf();
    expect(screen.getByTestId("item-1").getAttribute("role")).toBe("menuitem");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("DropdownMenu: SSR", () => {
  it("renders trigger, not content on server", () => {
    const html = renderToString(createElement(BasicMenu));
    expect(html).toContain("Menu");
    expect(html).not.toContain("Cut");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("DropdownMenu: Strict Mode", () => {
  it("works in StrictMode", async () => {
    render(createElement(StrictMode, null, createElement(BasicMenu, { defaultOpen: true })));
    await waitForRaf();
    expect(screen.getByTestId("content")).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });
});
