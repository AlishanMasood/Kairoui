import { describe, it, expect, afterEach } from "vitest";
import { createElement, useRef, useEffect, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useRovingFocus } from "./use-roving-focus";
import type { RovingFocusItem } from "./use-roving-focus";

afterEach(cleanup);

function RovingGroup(props: {
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  loop?: boolean;
  items?: Array<{ value: string; label: string; disabled?: boolean }>;
}) {
  const { orientation = "horizontal", dir = "ltr", loop = false, items: itemData } = props;
  const defaultItems = itemData ?? [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
    { value: "c", label: "C" },
  ];

  const roving = useRovingFocus({ orientation, dir, loop });

  return createElement(
    "div",
    { "data-testid": "group", role: "tablist", onKeyDown: roving.handleKeyDown },
    defaultItems.map((item) =>
      createElement(RovingItem, {
        key: item.value,
        value: item.value,
        label: item.label,
        disabled: item.disabled,
        register: roving.register,
        getItemProps: roving.getItemProps,
      }),
    ),
  );
}
RovingGroup.displayName = "RovingGroup";

function RovingItem(props: {
  value: string;
  label: string;
  disabled?: boolean;
  register: (item: RovingFocusItem) => () => void;
  getItemProps: (value: string, disabled?: boolean) => Record<string, unknown>;
}) {
  const { value, label, disabled, register, getItemProps } = props;
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) {
      return register({ element: ref.current, value, disabled });
    }
    return undefined;
  }, [register, value, disabled]);

  const itemProps = getItemProps(value, disabled);

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ref,
      "data-testid": `item-${value}`,
      "aria-disabled": disabled || undefined,
      ...itemProps,
    },
    label,
  );
  /* eslint-enable react-hooks/refs */
}
RovingItem.displayName = "RovingItem";

// ─── Basic tabIndex management ──────────────────────────────────────

describe("useRovingFocus: tabIndex", () => {
  it("first item has tabIndex=0, others have -1", () => {
    render(createElement(RovingGroup));
    expect(screen.getByTestId("item-a").tabIndex).toBe(0);
    expect(screen.getByTestId("item-b").tabIndex).toBe(-1);
    expect(screen.getByTestId("item-c").tabIndex).toBe(-1);
  });

  it("focused item gets tabIndex=0", () => {
    render(createElement(RovingGroup));
    fireEvent.focus(screen.getByTestId("item-b"));
    expect(screen.getByTestId("item-a").tabIndex).toBe(-1);
    expect(screen.getByTestId("item-b").tabIndex).toBe(0);
  });
});

// ─── Horizontal navigation ──────────────────────────────────────────

describe("useRovingFocus: horizontal", () => {
  it("ArrowRight moves focus to next", () => {
    render(createElement(RovingGroup));
    screen.getByTestId("item-a").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("item-b"));
  });

  it("ArrowLeft moves focus to previous", () => {
    render(createElement(RovingGroup));
    screen.getByTestId("item-b").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByTestId("item-a"));
  });

  it("does not wrap without loop", () => {
    render(createElement(RovingGroup));
    screen.getByTestId("item-c").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("item-c"));
  });

  it("wraps with loop", () => {
    render(createElement(RovingGroup, { loop: true }));
    screen.getByTestId("item-c").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("item-a"));
  });

  it("wraps backward with loop", () => {
    render(createElement(RovingGroup, { loop: true }));
    screen.getByTestId("item-a").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByTestId("item-c"));
  });
});

// ─── Vertical navigation ────────────────────────────────────────────

describe("useRovingFocus: vertical", () => {
  it("ArrowDown moves focus to next", () => {
    render(createElement(RovingGroup, { orientation: "vertical" }));
    screen.getByTestId("item-a").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("item-b"));
  });

  it("ArrowUp moves focus to previous", () => {
    render(createElement(RovingGroup, { orientation: "vertical" }));
    screen.getByTestId("item-b").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(screen.getByTestId("item-a"));
  });
});

// ─── Home / End ─────────────────────────────────────────────────────

describe("useRovingFocus: Home/End", () => {
  it("Home moves to first item", () => {
    render(createElement(RovingGroup));
    screen.getByTestId("item-c").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "Home" });
    expect(document.activeElement).toBe(screen.getByTestId("item-a"));
  });

  it("End moves to last item", () => {
    render(createElement(RovingGroup));
    screen.getByTestId("item-a").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "End" });
    expect(document.activeElement).toBe(screen.getByTestId("item-c"));
  });
});

// ─── Disabled item skipping ─────────────────────────────────────────

describe("useRovingFocus: disabled items", () => {
  it("skips disabled items when navigating forward", () => {
    render(
      createElement(RovingGroup, {
        items: [
          { value: "a", label: "A" },
          { value: "b", label: "B", disabled: true },
          { value: "c", label: "C" },
        ],
      }),
    );
    screen.getByTestId("item-a").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("item-c"));
  });

  it("skips disabled items when navigating backward", () => {
    render(
      createElement(RovingGroup, {
        items: [
          { value: "a", label: "A" },
          { value: "b", label: "B", disabled: true },
          { value: "c", label: "C" },
        ],
      }),
    );
    screen.getByTestId("item-c").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByTestId("item-a"));
  });
});

// ─── RTL ────────────────────────────────────────────────────────────

describe("useRovingFocus: RTL", () => {
  it("ArrowLeft moves forward in RTL horizontal", () => {
    render(createElement(RovingGroup, { dir: "rtl" }));
    screen.getByTestId("item-a").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByTestId("item-b"));
  });

  it("ArrowRight moves backward in RTL horizontal", () => {
    render(createElement(RovingGroup, { dir: "rtl" }));
    screen.getByTestId("item-b").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("item-a"));
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("useRovingFocus: SSR", () => {
  it("renders without error on server", () => {
    const html = renderToString(createElement(RovingGroup));
    expect(html).toContain("tabindex");
    expect(html).toContain("A");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("useRovingFocus: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(RovingGroup)));
    screen.getByTestId("item-a").focus();
    fireEvent.keyDown(screen.getByTestId("group"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("item-b"));
  });
});
