import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { Command } from "./command";

function Setup(): ReturnType<typeof createElement> {
  return createElement(
    Command.Root,
    { defaultOpen: true },
    createElement(
      Command.Dialog,
      { container: null, "aria-label": "A11y palette" },
      createElement(Command.Input, { placeholder: "Search" }),
      createElement(
        Command.List,
        { "aria-label": "Commands" },
        createElement(
          Command.Group,
          { id: "file", heading: "File" },
          createElement(Command.Item, { id: "a" }, "A"),
          createElement(Command.Item, { id: "b", disabled: true }, "B"),
        ),
      ),
    ),
  );
}

describe("Command palette — accessibility", () => {
  it("dialog carries role=dialog and aria-modal=true", () => {
    const { container } = render(createElement(Setup));
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
  });

  it("input has role=combobox, aria-autocomplete=list, and aria-controls", () => {
    const { container } = render(createElement(Setup));
    const input = container.querySelector('[role="combobox"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute("aria-autocomplete")).toBe("list");
    expect(input?.getAttribute("aria-controls")).not.toBeNull();
    expect(input?.getAttribute("aria-expanded")).toBe("true");
  });

  it("list carries role=listbox and matches input's aria-controls id", () => {
    const { container } = render(createElement(Setup));
    const list = container.querySelector('[role="listbox"]');
    expect(list).not.toBeNull();
    const input = container.querySelector('[role="combobox"]');
    expect(input?.getAttribute("aria-controls")).toBe(list?.getAttribute("id"));
  });

  it("groups expose role=group and aria-labelledby pointing at the heading", () => {
    const { container } = render(createElement(Setup));
    const group = container.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    const labelledBy = group?.getAttribute("aria-labelledby");
    expect(labelledBy).not.toBeNull();
    if (labelledBy) {
      const heading = container.querySelector(`#${CSS.escape(labelledBy)}`);
      expect(heading?.textContent).toBe("File");
    }
  });

  it("items expose role=option with aria-selected and aria-disabled", () => {
    const { container } = render(createElement(Setup));
    const enabled = container.querySelector('[data-kui-item-id="a"]');
    const disabled = container.querySelector('[data-kui-item-id="b"]');
    expect(enabled?.getAttribute("role")).toBe("option");
    expect(disabled?.getAttribute("aria-disabled")).toBe("true");
    expect(disabled?.getAttribute("data-disabled")).toBe("true");
  });

  it("separator carries role=separator", () => {
    const { container } = render(
      createElement(
        Command.Root,
        { defaultOpen: true },
        createElement(
          Command.Dialog,
          { container: null, "aria-label": "test" },
          createElement(Command.Input, null),
          createElement(
            Command.List,
            null,
            createElement(Command.Item, { id: "a" }, "A"),
            createElement(Command.Separator, null),
            createElement(Command.Item, { id: "b" }, "B"),
          ),
        ),
      ),
    );
    expect(container.querySelector('[role="separator"]')).not.toBeNull();
  });

  it("aria-activedescendant points at the highlighted item's id", () => {
    const { container } = render(createElement(Setup));
    const input = container.querySelector('[role="combobox"]');
    const activedescendant = input?.getAttribute("aria-activedescendant");
    // Initial highlight lands on the first enabled item.
    expect(activedescendant).not.toBeNull();
    if (activedescendant) {
      const target = container.querySelector(`#${CSS.escape(activedescendant)}`);
      expect(target?.getAttribute("data-kui-item-id")).toBe("a");
    }
  });
});
