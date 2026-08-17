import { describe, it, expect, vi, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useCompositeNavigation } from "./use-composite-navigation";
import type { RegisteredItem } from "./use-collection";

afterEach(cleanup);

const items: RegisteredItem[] = [
  { value: "a", label: "Apple", id: "id-a" },
  { value: "b", label: "Banana", id: "id-b", disabled: true },
  { value: "c", label: "Cherry", id: "id-c" },
  { value: "d", label: "Date", id: "id-d" },
];

function NavTest({
  items: testItems = items,
  orientation = "vertical" as const,
  loop = true,
  onSelect,
  typeahead = false,
}: {
  items?: RegisteredItem[];
  orientation?: "vertical" | "horizontal" | "both";
  loop?: boolean;
  onSelect?: (v: string) => void;
  typeahead?: boolean;
}) {
  const { highlightedValue, handleKeyDown } = useCompositeNavigation({
    items: testItems,
    orientation,
    loop,
    onSelect,
    typeahead,
  });
  return createElement(
    "div",
    { "data-testid": "container", tabIndex: 0, onKeyDown: handleKeyDown },
    createElement("span", { "data-testid": "highlight" }, highlightedValue ?? "none"),
  );
}
NavTest.displayName = "NavTest";

// ─── Arrow navigation (vertical) ───────────────────────────────────

describe("useCompositeNavigation: vertical arrows", () => {
  it("ArrowDown highlights first enabled item from none", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("highlight").textContent).toBe("a");
  });

  it("ArrowDown moves to next enabled item", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest));
    const el = screen.getByTestId("container");
    el.focus();
    await user.keyboard("{ArrowDown}"); // → a
    await user.keyboard("{ArrowDown}"); // → c (skips disabled b)
    expect(screen.getByTestId("highlight").textContent).toBe("c");
  });

  it("ArrowUp highlights last item from none", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByTestId("highlight").textContent).toBe("d");
  });

  it("ArrowUp moves to previous enabled item", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowDown}"); // → a
    await user.keyboard("{ArrowDown}"); // → c
    await user.keyboard("{ArrowUp}"); // → a (skips disabled b)
    expect(screen.getByTestId("highlight").textContent).toBe("a");
  });
});

// ─── Arrow navigation (horizontal) ─────────────────────────────────

describe("useCompositeNavigation: horizontal arrows", () => {
  it("ArrowRight moves next in horizontal mode", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { orientation: "horizontal" }));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("highlight").textContent).toBe("a");
  });

  it("ArrowLeft moves previous in horizontal mode", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { orientation: "horizontal" }));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("highlight").textContent).toBe("d");
  });

  it("ArrowDown is ignored in horizontal mode", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { orientation: "horizontal" }));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("highlight").textContent).toBe("none");
  });
});

// ─── Home/End ───────────────────────────────────────────────────────

describe("useCompositeNavigation: Home/End", () => {
  it("Home highlights first enabled item", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest));
    screen.getByTestId("container").focus();
    await user.keyboard("{Home}");
    expect(screen.getByTestId("highlight").textContent).toBe("a");
  });

  it("End highlights last enabled item", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest));
    screen.getByTestId("container").focus();
    await user.keyboard("{End}");
    expect(screen.getByTestId("highlight").textContent).toBe("d");
  });
});

// ─── Looping ────────────────────────────────────────────────────────

describe("useCompositeNavigation: looping", () => {
  it("wraps from last to first when loop=true", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { loop: true }));
    screen.getByTestId("container").focus();
    await user.keyboard("{End}"); // → d
    await user.keyboard("{ArrowDown}"); // → a (wrap)
    expect(screen.getByTestId("highlight").textContent).toBe("a");
  });

  it("does not wrap when loop=false", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { loop: false }));
    screen.getByTestId("container").focus();
    await user.keyboard("{End}"); // → d
    await user.keyboard("{ArrowDown}"); // should stay at d
    expect(screen.getByTestId("highlight").textContent).toBe("d");
  });

  it("does not wrap backwards when loop=false", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { loop: false }));
    screen.getByTestId("container").focus();
    await user.keyboard("{Home}"); // → a
    await user.keyboard("{ArrowUp}"); // should stay at a
    expect(screen.getByTestId("highlight").textContent).toBe("a");
  });
});

// ─── Disabled item skipping ─────────────────────────────────────────

describe("useCompositeNavigation: disabled items", () => {
  it("skips disabled items going forward", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowDown}"); // → a
    await user.keyboard("{ArrowDown}"); // → c (b is disabled)
    expect(screen.getByTestId("highlight").textContent).toBe("c");
  });

  it("skips disabled items going backward", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowDown}"); // → a
    await user.keyboard("{ArrowDown}"); // → c
    await user.keyboard("{ArrowUp}"); // → a (b is disabled)
    expect(screen.getByTestId("highlight").textContent).toBe("a");
  });
});

// ─── Selection (Enter/Space) ────────────────────────────────────────

describe("useCompositeNavigation: selection", () => {
  it("Enter triggers onSelect with highlighted value", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(createElement(NavTest, { onSelect }));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowDown}"); // → a
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("Space triggers onSelect", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(createElement(NavTest, { onSelect }));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowDown}"); // → a
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("Enter does nothing when nothing is highlighted", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(createElement(NavTest, { onSelect }));
    screen.getByTestId("container").focus();
    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });
});

// ─── Typeahead ──────────────────────────────────────────────────────

describe("useCompositeNavigation: typeahead", () => {
  it("typing a character highlights matching item", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { typeahead: true }));
    screen.getByTestId("container").focus();
    await user.keyboard("c");
    expect(screen.getByTestId("highlight").textContent).toBe("c"); // Cherry
  });

  it("typing multiple characters narrows match", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { typeahead: true }));
    screen.getByTestId("container").focus();
    await user.keyboard("d");
    expect(screen.getByTestId("highlight").textContent).toBe("d"); // Date
  });

  it("skips disabled items in typeahead", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { typeahead: true }));
    screen.getByTestId("container").focus();
    await user.keyboard("b"); // Banana is disabled
    expect(screen.getByTestId("highlight").textContent).toBe("none");
  });
});

// ─── Orientation: both ──────────────────────────────────────────────

describe("useCompositeNavigation: both orientation", () => {
  it("responds to both vertical and horizontal arrows", async () => {
    const user = userEvent.setup();
    render(createElement(NavTest, { orientation: "both" }));
    screen.getByTestId("container").focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("highlight").textContent).toBe("a");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("highlight").textContent).toBe("c");
  });
});
