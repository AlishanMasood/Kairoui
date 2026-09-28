import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import { Command } from "./command";

interface Recorded {
  readonly ran: string[];
}

function Setup(props: {
  readonly onSelect: (id: string) => void;
  readonly defaultOpen?: boolean;
}): ReturnType<typeof createElement> {
  return createElement(
    Command.Root,
    {
      defaultOpen: props.defaultOpen ?? true,
      onOpenChange: () => undefined,
    },
    createElement(Command.Trigger, null, "Open"),
    createElement(
      Command.Dialog,
      { container: null, "aria-label": "Test palette" },
      createElement(Command.Input, { placeholder: "Search" }),
      createElement(
        Command.List,
        null,
        createElement(
          Command.Group,
          { id: "file", heading: "File" },
          createElement(
            Command.Item,
            {
              id: "new",
              onSelect: () => {
                props.onSelect("new");
              },
            },
            "New file",
          ),
          createElement(
            Command.Item,
            {
              id: "open",
              onSelect: () => {
                props.onSelect("open");
              },
            },
            "Open project",
          ),
        ),
        createElement(Command.Separator, null),
        createElement(
          Command.Group,
          { id: "edit", heading: "Edit" },
          createElement(
            Command.Item,
            {
              id: "copy",
              onSelect: () => {
                props.onSelect("copy");
              },
            },
            "Copy",
          ),
          createElement(
            Command.Item,
            {
              id: "disabled",
              disabled: true,
              onSelect: () => {
                props.onSelect("disabled");
              },
            },
            "Do nothing",
          ),
        ),
        createElement(Command.Empty, null, "No results"),
      ),
    ),
  );
}

// ─── Rendering ────────────────────────────────────────────────────

describe("Command palette — rendering", () => {
  it("renders the dialog with role=dialog when open", () => {
    const record: Recorded = { ran: [] };
    const { container } = render(
      createElement(Setup, {
        onSelect: (id) => {
          record.ran.push(id);
        },
      }),
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-label")).toBe("Test palette");
  });

  it("does not render the dialog when closed", () => {
    const { container } = render(
      createElement(Setup, {
        onSelect: () => undefined,
        defaultOpen: false,
      }),
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders group headings with an id referenced by aria-labelledby", () => {
    const { container } = render(createElement(Setup, { onSelect: () => undefined }));
    const group = container.querySelector('[data-kui-group-id="file"]');
    const labelledBy = group?.getAttribute("aria-labelledby");
    expect(labelledBy).not.toBeNull();
    if (labelledBy) {
      expect(container.querySelector(`#${CSS.escape(labelledBy)}`)?.textContent).toBe("File");
    }
  });

  it("renders each item as role=option with a stable id", () => {
    const { container } = render(createElement(Setup, { onSelect: () => undefined }));
    const options = container.querySelectorAll('[role="option"]:not([hidden])');
    expect(options.length).toBe(4);
  });

  it("hides the empty node when items are visible", () => {
    const { queryByText } = render(createElement(Setup, { onSelect: () => undefined }));
    expect(queryByText("No results")).toBeNull();
  });

  it("shows the empty node when the query filters all items out", () => {
    const { container, getByText } = render(createElement(Setup, { onSelect: () => undefined }));
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]');
    if (!input) throw new Error("no input");
    act(() => {
      fireEvent.change(input, { target: { value: "nomatch" } });
    });
    expect(getByText("No results")).toBeInTheDocument();
  });
});

// ─── Filtering ────────────────────────────────────────────────────

describe("Command palette — filtering", () => {
  it("filters visible items by the input query", () => {
    const { container } = render(createElement(Setup, { onSelect: () => undefined }));
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]');
    if (!input) throw new Error("no input");
    act(() => {
      fireEvent.change(input, { target: { value: "copy" } });
    });
    const options = container.querySelectorAll('[role="option"]:not([hidden])');
    expect(options.length).toBe(1);
    expect(options[0]?.getAttribute("data-kui-item-id")).toBe("copy");
  });

  it("hides empty groups whose items are filtered out", () => {
    const { container } = render(createElement(Setup, { onSelect: () => undefined }));
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]');
    if (!input) throw new Error("no input");
    act(() => {
      fireEvent.change(input, { target: { value: "copy" } });
    });
    const fileGroup = container.querySelector('[data-kui-group-id="file"]');
    expect(fileGroup?.getAttribute("hidden")).not.toBeNull();
  });

  it("supports a consumer-supplied filter", () => {
    const filter = vi.fn().mockReturnValue(false);
    const { container } = render(
      createElement(
        Command.Root,
        { defaultOpen: true, filter },
        createElement(
          Command.Dialog,
          { container: null, "aria-label": "test" },
          createElement(Command.Input, null),
          createElement(Command.List, null, createElement(Command.Item, { id: "a" }, "A")),
        ),
      ),
    );
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]');
    if (!input) throw new Error("no input");
    act(() => {
      fireEvent.change(input, { target: { value: "hi" } });
    });
    expect(filter).toHaveBeenCalled();
    expect(container.querySelectorAll('[role="option"]:not([hidden])').length).toBe(0);
  });
});

// ─── Execution ────────────────────────────────────────────────────

describe("Command palette — execution", () => {
  it("runs the item's onSelect when clicked", () => {
    const record: Recorded = { ran: [] };
    const { container } = render(
      createElement(Setup, {
        onSelect: (id) => {
          record.ran.push(id);
        },
      }),
    );
    const first = container.querySelector<HTMLElement>('[data-kui-item-id="new"]');
    if (!first) throw new Error("no item");
    act(() => {
      fireEvent.click(first);
    });
    expect(record.ran).toEqual(["new"]);
  });

  it("does not execute a disabled item on click", () => {
    const record: Recorded = { ran: [] };
    const { container } = render(
      createElement(Setup, {
        onSelect: (id) => {
          record.ran.push(id);
        },
      }),
    );
    const disabled = container.querySelector<HTMLElement>('[data-kui-item-id="disabled"]');
    if (!disabled) throw new Error("no item");
    act(() => {
      fireEvent.click(disabled);
    });
    expect(record.ran).toEqual([]);
  });

  it("fires onItemSelect after execution", () => {
    const onItemSelect = vi.fn();
    const { container } = render(
      createElement(
        Command.Root,
        { defaultOpen: true, onItemSelect },
        createElement(
          Command.Dialog,
          { container: null, "aria-label": "test" },
          createElement(Command.Input, null),
          createElement(
            Command.List,
            null,
            createElement(Command.Item, { id: "a", onSelect: () => undefined }, "A"),
          ),
        ),
      ),
    );
    const item = container.querySelector<HTMLElement>('[data-kui-item-id="a"]');
    if (!item) throw new Error("no item");
    act(() => {
      fireEvent.click(item);
    });
    expect(onItemSelect).toHaveBeenCalledTimes(1);
    expect(onItemSelect.mock.calls[0]?.[0]?.id).toBe("a");
  });
});

// ─── Nested pages ─────────────────────────────────────────────────

describe("Command palette — nested pages", () => {
  it("only renders items belonging to the current page", () => {
    const { container } = render(
      createElement(
        Command.Root,
        { defaultOpen: true, defaultPageStack: ["theme"] },
        createElement(
          Command.Dialog,
          { container: null, "aria-label": "test" },
          createElement(Command.Input, null),
          createElement(
            Command.List,
            null,
            createElement(
              Command.Group,
              { id: "root" },
              createElement(Command.Item, { id: "a" }, "A"),
            ),
            createElement(
              Command.Group,
              { id: "theme-group", pageId: "theme" },
              createElement(Command.Item, { id: "light" }, "Light"),
              createElement(Command.Item, { id: "dark" }, "Dark"),
            ),
          ),
        ),
      ),
    );
    const options = container.querySelectorAll('[role="option"]:not([hidden])');
    const ids = Array.from(options).map((el) => el.getAttribute("data-kui-item-id"));
    expect(ids).toEqual(["light", "dark"]);
  });

  it("Backspace on empty query pops the current page", () => {
    const { container } = render(
      createElement(
        Command.Root,
        { defaultOpen: true, defaultPageStack: ["theme"] },
        createElement(
          Command.Dialog,
          { container: null, "aria-label": "test" },
          createElement(Command.Input, null),
          createElement(
            Command.List,
            null,
            createElement(
              Command.Group,
              { id: "root" },
              createElement(Command.Item, { id: "a" }, "A"),
            ),
            createElement(
              Command.Group,
              { id: "theme-group", pageId: "theme" },
              createElement(Command.Item, { id: "light" }, "Light"),
            ),
          ),
        ),
      ),
    );
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]');
    if (!input) throw new Error("no input");
    act(() => {
      fireEvent.keyDown(input, { key: "Backspace" });
    });
    const options = container.querySelectorAll('[role="option"]:not([hidden])');
    expect(options.length).toBe(1);
    expect(options[0]?.getAttribute("data-kui-item-id")).toBe("a");
  });
});
