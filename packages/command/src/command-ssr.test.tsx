import { describe, it, expect } from "vitest";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { createElement } from "react";
import { Command } from "./command";

function Setup(open: boolean): ReturnType<typeof createElement> {
  return createElement(
    Command.Root,
    { defaultOpen: open },
    createElement(Command.Trigger, null, "Open"),
    createElement(
      Command.Dialog,
      { container: null, "aria-label": "SSR palette" },
      createElement(Command.Input, null),
      createElement(
        Command.List,
        null,
        createElement(Command.Item, { id: "a" }, "A"),
        createElement(Command.Item, { id: "b" }, "B"),
      ),
    ),
  );
}

describe("Command palette — SSR", () => {
  it("renders on the server without throwing", () => {
    const markup = renderToString(Setup(true));
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain("Open");
  });

  it("does not render the dialog on the server when closed", () => {
    const markup = renderToString(Setup(false));
    expect(markup).not.toContain('role="dialog"');
    expect(markup).toContain("Open");
  });

  it("renders the trigger only when the dialog is closed on the server", () => {
    const openMarkup = renderToString(Setup(true));
    expect(openMarkup).toContain('aria-expanded="true"');
    const closedMarkup = renderToString(Setup(false));
    expect(closedMarkup).toContain('aria-expanded="false"');
  });

  it("static markup contains no client-only markers", () => {
    const markup = renderToStaticMarkup(Setup(true));
    expect(markup).not.toContain("undefined");
    expect(markup).not.toContain("[object Object]");
  });
});
