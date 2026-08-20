import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent } from "./menubar";
import { DropdownMenuItem } from "../dropdown-menu/dropdown-menu";
import { _resetLayerStack } from "../overlay/dismissable-layer";
import { _resetScopeStack } from "../overlay/focus-scope";

afterEach(() => {
  cleanup();
  _resetLayerStack();
  _resetScopeStack();
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

function BasicMenubar() {
  return createElement(
    Menubar,
    { "data-testid": "bar" } as never,
    createElement(
      MenubarMenu,
      { value: "file" },
      createElement(MenubarTrigger, { "data-testid": "t-file" } as never, "File"),
      createElement(
        MenubarContent,
        { "data-testid": "c-file" } as never,
        createElement(DropdownMenuItem, { "data-testid": "item-new" } as never, "New"),
      ),
    ),
    createElement(
      MenubarMenu,
      { value: "edit" },
      createElement(MenubarTrigger, { "data-testid": "t-edit" } as never, "Edit"),
      createElement(
        MenubarContent,
        { "data-testid": "c-edit" } as never,
        createElement(DropdownMenuItem, null, "Undo"),
      ),
    ),
  );
}
BasicMenubar.displayName = "BasicMenubar";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Menubar: rendering", () => {
  it("renders with role=menubar", () => {
    render(createElement(BasicMenubar));
    expect(screen.getByTestId("bar").getAttribute("role")).toBe("menubar");
  });

  it("triggers have aria-haspopup=menu", () => {
    render(createElement(BasicMenubar));
    expect(screen.getByTestId("t-file").getAttribute("aria-haspopup")).toBe("menu");
  });

  it("content not rendered when closed", () => {
    render(createElement(BasicMenubar));
    expect(screen.queryByTestId("c-file")).toBeNull();
  });
});

// ─── Open/close ─────────────────────────────────────────────────────

describe("Menubar: open/close", () => {
  it("clicking trigger opens menu", async () => {
    render(createElement(BasicMenubar));
    fireEvent.click(screen.getByTestId("t-file"));
    await waitForRaf();
    expect(screen.getByTestId("c-file")).not.toBeNull();
    expect(screen.getByTestId("t-file").getAttribute("aria-expanded")).toBe("true");
  });

  it("clicking open trigger closes menu", async () => {
    render(createElement(BasicMenubar));
    fireEvent.click(screen.getByTestId("t-file"));
    await waitForRaf();
    fireEvent.click(screen.getByTestId("t-file"));
    expect(screen.queryByTestId("c-file")).toBeNull();
  });
});

// ─── Keyboard navigation ────────────────────────────────────────────

describe("Menubar: keyboard", () => {
  it("ArrowRight moves focus to next trigger", () => {
    render(createElement(BasicMenubar));
    screen.getByTestId("t-file").focus();
    fireEvent.keyDown(screen.getByTestId("t-file"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("t-edit"));
  });

  it("ArrowLeft moves focus to previous trigger", () => {
    render(createElement(BasicMenubar));
    screen.getByTestId("t-edit").focus();
    fireEvent.keyDown(screen.getByTestId("t-edit"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByTestId("t-file"));
  });

  it("ArrowDown opens menu", async () => {
    render(createElement(BasicMenubar));
    screen.getByTestId("t-file").focus();
    fireEvent.keyDown(screen.getByTestId("t-file"), { key: "ArrowDown" });
    await waitForRaf();
    expect(screen.getByTestId("c-file")).not.toBeNull();
  });

  it("Escape closes open menu", async () => {
    render(createElement(BasicMenubar));
    fireEvent.click(screen.getByTestId("t-file"));
    await waitForRaf();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("c-file")).toBeNull();
  });
});

// ─── Hover switching ────────────────────────────────────────────────

describe("Menubar: hover switching", () => {
  it("hovering another trigger switches open menu", async () => {
    render(createElement(BasicMenubar));
    fireEvent.click(screen.getByTestId("t-file"));
    await waitForRaf();
    fireEvent.pointerEnter(screen.getByTestId("t-edit"));
    await waitForRaf();
    expect(screen.queryByTestId("c-file")).toBeNull();
    expect(screen.getByTestId("c-edit")).not.toBeNull();
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Menubar: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(BasicMenubar));
    expect(html).toContain('role="menubar"');
    expect(html).toContain("File");
    expect(html).toContain("Edit");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Menubar: Strict Mode", () => {
  it("works in StrictMode", async () => {
    render(createElement(StrictMode, null, createElement(BasicMenubar)));
    fireEvent.click(screen.getByTestId("t-file"));
    await waitForRaf();
    expect(screen.getByTestId("c-file")).not.toBeNull();
  });
});
