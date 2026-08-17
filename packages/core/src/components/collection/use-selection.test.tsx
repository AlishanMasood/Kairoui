import { describe, it, expect, afterEach } from "vitest";
import { createElement, useState } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useSingleSelection, useMultiSelection } from "./use-selection";
import type { CollectionState } from "./use-collection";

afterEach(cleanup);

// ─── Mock collection for disabled-item tests ────────────────────────

function mockCollection(disabled: string[] = []): CollectionState {
  const items = [
    { value: "a", label: "A", id: "id-a", disabled: disabled.includes("a") },
    { value: "b", label: "B", id: "id-b", disabled: disabled.includes("b") },
    { value: "c", label: "C", id: "id-c", disabled: disabled.includes("c") },
  ];
  return {
    items,
    register: () => () => {},
    getByValue: (v) => items.find((i) => i.value === v),
    getById: (id) => items.find((i) => i.id === id),
    getEnabledItems: () => items.filter((i) => !i.disabled),
    count: items.length,
  };
}

// ─── Single Selection: uncontrolled ─────────────────────────────────

describe("useSingleSelection: uncontrolled", () => {
  function Uncontrolled({ defaultValue }: { defaultValue?: string }) {
    const { selectedValue, select, clear, isSelected } = useSingleSelection({ defaultValue });
    return createElement(
      "div",
      null,
      createElement("span", { "data-testid": "value" }, selectedValue ?? "none"),
      createElement(
        "button",
        {
          "data-testid": "select-a",
          onClick: () => {
            select("a");
          },
        },
        "A",
      ),
      createElement(
        "button",
        {
          "data-testid": "select-b",
          onClick: () => {
            select("b");
          },
        },
        "B",
      ),
      createElement("button", { "data-testid": "clear", onClick: clear }, "Clear"),
      createElement("span", { "data-testid": "is-a", "data-selected": String(isSelected("a")) }),
    );
  }
  Uncontrolled.displayName = "Uncontrolled";

  it("starts with undefined when no defaultValue", () => {
    render(createElement(Uncontrolled));
    expect(screen.getByTestId("value").textContent).toBe("none");
  });

  it("starts with defaultValue", () => {
    render(createElement(Uncontrolled, { defaultValue: "a" }));
    expect(screen.getByTestId("value").textContent).toBe("a");
  });

  it("selects a value", async () => {
    const user = userEvent.setup();
    render(createElement(Uncontrolled));
    await user.click(screen.getByTestId("select-a"));
    expect(screen.getByTestId("value").textContent).toBe("a");
  });

  it("replaces previous selection", async () => {
    const user = userEvent.setup();
    render(createElement(Uncontrolled, { defaultValue: "a" }));
    await user.click(screen.getByTestId("select-b"));
    expect(screen.getByTestId("value").textContent).toBe("b");
  });

  it("clears selection", async () => {
    const user = userEvent.setup();
    render(createElement(Uncontrolled, { defaultValue: "a" }));
    await user.click(screen.getByTestId("clear"));
    expect(screen.getByTestId("value").textContent).toBe("none");
  });

  it("isSelected returns true for selected value", async () => {
    const user = userEvent.setup();
    render(createElement(Uncontrolled));
    await user.click(screen.getByTestId("select-a"));
    expect(screen.getByTestId("is-a").getAttribute("data-selected")).toBe("true");
  });
});

// ─── Single Selection: controlled ───────────────────────────────────

describe("useSingleSelection: controlled", () => {
  function Controlled() {
    const [val, setVal] = useState<string | undefined>("a");
    const { selectedValue, select } = useSingleSelection({
      value: val,
      onValueChange: setVal,
    });
    return createElement(
      "div",
      null,
      createElement("span", { "data-testid": "value" }, selectedValue ?? "none"),
      createElement(
        "button",
        {
          "data-testid": "select-b",
          onClick: () => {
            select("b");
          },
        },
        "B",
      ),
    );
  }
  Controlled.displayName = "Controlled";

  it("reflects controlled value", () => {
    render(createElement(Controlled));
    expect(screen.getByTestId("value").textContent).toBe("a");
  });

  it("calls onValueChange and updates", async () => {
    const user = userEvent.setup();
    render(createElement(Controlled));
    await user.click(screen.getByTestId("select-b"));
    expect(screen.getByTestId("value").textContent).toBe("b");
  });
});

// ─── Single Selection: disabled items ───────────────────────────────

describe("useSingleSelection: disabled items", () => {
  function WithCollection() {
    const col = mockCollection(["b"]);
    const { selectedValue, select } = useSingleSelection({ collection: col });
    return createElement(
      "div",
      null,
      createElement("span", { "data-testid": "value" }, selectedValue ?? "none"),
      createElement(
        "button",
        {
          "data-testid": "select-a",
          onClick: () => {
            select("a");
          },
        },
        "A",
      ),
      createElement(
        "button",
        {
          "data-testid": "select-b",
          onClick: () => {
            select("b");
          },
        },
        "B",
      ),
    );
  }
  WithCollection.displayName = "WithCollection";

  it("allows selecting enabled items", async () => {
    const user = userEvent.setup();
    render(createElement(WithCollection));
    await user.click(screen.getByTestId("select-a"));
    expect(screen.getByTestId("value").textContent).toBe("a");
  });

  it("prevents selecting disabled items", async () => {
    const user = userEvent.setup();
    render(createElement(WithCollection));
    await user.click(screen.getByTestId("select-b"));
    expect(screen.getByTestId("value").textContent).toBe("none");
  });
});

// ─── Multi Selection: uncontrolled ──────────────────────────────────

describe("useMultiSelection: uncontrolled", () => {
  function Multi({ defaultValue }: { defaultValue?: string[] }) {
    const { selectedValues, toggle, select, deselect, clear, isSelected } = useMultiSelection({
      defaultValue,
    });
    return createElement(
      "div",
      null,
      createElement("span", { "data-testid": "values" }, JSON.stringify(selectedValues)),
      createElement(
        "button",
        {
          "data-testid": "toggle-a",
          onClick: () => {
            toggle("a");
          },
        },
        "A",
      ),
      createElement(
        "button",
        {
          "data-testid": "toggle-b",
          onClick: () => {
            toggle("b");
          },
        },
        "B",
      ),
      createElement(
        "button",
        {
          "data-testid": "select-c",
          onClick: () => {
            select("c");
          },
        },
        "C",
      ),
      createElement(
        "button",
        {
          "data-testid": "deselect-a",
          onClick: () => {
            deselect("a");
          },
        },
        "-A",
      ),
      createElement("button", { "data-testid": "clear", onClick: clear }, "Clear"),
      createElement("span", { "data-testid": "is-a", "data-selected": String(isSelected("a")) }),
    );
  }
  Multi.displayName = "Multi";

  it("starts with empty array", () => {
    render(createElement(Multi));
    expect(screen.getByTestId("values").textContent).toBe("[]");
  });

  it("starts with defaultValue", () => {
    render(createElement(Multi, { defaultValue: ["a", "b"] }));
    expect(screen.getByTestId("values").textContent).toBe('["a","b"]');
  });

  it("toggle adds value", async () => {
    const user = userEvent.setup();
    render(createElement(Multi));
    await user.click(screen.getByTestId("toggle-a"));
    expect(screen.getByTestId("values").textContent).toContain('"a"');
  });

  it("toggle removes already-selected value", async () => {
    const user = userEvent.setup();
    render(createElement(Multi, { defaultValue: ["a"] }));
    await user.click(screen.getByTestId("toggle-a"));
    expect(screen.getByTestId("values").textContent).toBe("[]");
  });

  it("select adds without duplication", async () => {
    const user = userEvent.setup();
    render(createElement(Multi, { defaultValue: ["a"] }));
    await user.click(screen.getByTestId("select-c"));
    expect(screen.getByTestId("values").textContent).toBe('["a","c"]');
    // Selecting again should not duplicate
    await user.click(screen.getByTestId("select-c"));
    expect(screen.getByTestId("values").textContent).toBe('["a","c"]');
  });

  it("deselect removes value", async () => {
    const user = userEvent.setup();
    render(createElement(Multi, { defaultValue: ["a", "b"] }));
    await user.click(screen.getByTestId("deselect-a"));
    expect(screen.getByTestId("values").textContent).toBe('["b"]');
  });

  it("clear removes all", async () => {
    const user = userEvent.setup();
    render(createElement(Multi, { defaultValue: ["a", "b"] }));
    await user.click(screen.getByTestId("clear"));
    expect(screen.getByTestId("values").textContent).toBe("[]");
  });

  it("isSelected returns correct state", async () => {
    const user = userEvent.setup();
    render(createElement(Multi));
    await user.click(screen.getByTestId("toggle-a"));
    expect(screen.getByTestId("is-a").getAttribute("data-selected")).toBe("true");
  });
});

// ─── Multi Selection: controlled ────────────────────────────────────

describe("useMultiSelection: controlled", () => {
  function ControlledMulti() {
    const [vals, setVals] = useState<string[]>(["a"]);
    const { selectedValues, toggle } = useMultiSelection({
      value: vals,
      onValueChange: setVals,
    });
    return createElement(
      "div",
      null,
      createElement("span", { "data-testid": "values" }, JSON.stringify(selectedValues)),
      createElement(
        "button",
        {
          "data-testid": "toggle-b",
          onClick: () => {
            toggle("b");
          },
        },
        "B",
      ),
    );
  }
  ControlledMulti.displayName = "ControlledMulti";

  it("reflects controlled value", () => {
    render(createElement(ControlledMulti));
    expect(screen.getByTestId("values").textContent).toBe('["a"]');
  });

  it("updates via onValueChange", async () => {
    const user = userEvent.setup();
    render(createElement(ControlledMulti));
    await user.click(screen.getByTestId("toggle-b"));
    expect(screen.getByTestId("values").textContent).toBe('["a","b"]');
  });
});

// ─── Multi Selection: disabled items ────────────────────────────────

describe("useMultiSelection: disabled items", () => {
  function MultiWithCollection() {
    const col = mockCollection(["b"]);
    const { selectedValues, toggle, select } = useMultiSelection({ collection: col });
    return createElement(
      "div",
      null,
      createElement("span", { "data-testid": "values" }, JSON.stringify(selectedValues)),
      createElement(
        "button",
        {
          "data-testid": "toggle-a",
          onClick: () => {
            toggle("a");
          },
        },
        "A",
      ),
      createElement(
        "button",
        {
          "data-testid": "toggle-b",
          onClick: () => {
            toggle("b");
          },
        },
        "B",
      ),
      createElement(
        "button",
        {
          "data-testid": "select-b",
          onClick: () => {
            select("b");
          },
        },
        "SB",
      ),
    );
  }
  MultiWithCollection.displayName = "MultiWithCollection";

  it("allows toggling enabled items", async () => {
    const user = userEvent.setup();
    render(createElement(MultiWithCollection));
    await user.click(screen.getByTestId("toggle-a"));
    expect(screen.getByTestId("values").textContent).toContain('"a"');
  });

  it("prevents toggling disabled items", async () => {
    const user = userEvent.setup();
    render(createElement(MultiWithCollection));
    await user.click(screen.getByTestId("toggle-b"));
    expect(screen.getByTestId("values").textContent).toBe("[]");
  });

  it("prevents selecting disabled items", async () => {
    const user = userEvent.setup();
    render(createElement(MultiWithCollection));
    await user.click(screen.getByTestId("select-b"));
    expect(screen.getByTestId("values").textContent).toBe("[]");
  });
});
