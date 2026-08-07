import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { renderSlot, renderOptionalSlot, renderSlots } from "./render-slot";
import type { ResolvedSlotProps } from "./resolve-slot-props";
import type { ElementType } from "react";

function resolved(element: ElementType, props: Record<string, unknown> = {}): ResolvedSlotProps {
  return { element, props: { ...props, "data-kui-slot": element as string } };
}

describe("renderSlot", () => {
  it("renders an element with resolved props", () => {
    const el = renderSlot(resolved("button", { type: "button", "data-testid": "slot" }));
    render(el);
    const node = screen.getByTestId("slot");
    expect(node.tagName).toBe("BUTTON");
    expect(node.getAttribute("type")).toBe("button");
  });

  it("renders with children", () => {
    const el = renderSlot(resolved("span", { "data-testid": "child" }), "Hello");
    render(el);
    expect(screen.getByTestId("child").textContent).toBe("Hello");
  });

  it("renders complex children", () => {
    const el = renderSlot(
      resolved("div", { "data-testid": "parent" }),
      createElement("span", null, "Nested"),
    );
    render(el);
    expect(screen.getByTestId("parent").textContent).toBe("Nested");
  });

  it("applies all resolved props", () => {
    const el = renderSlot(
      resolved("div", {
        className: "my-class",
        "aria-label": "test",
        "data-testid": "props",
      }),
    );
    render(el);
    const node = screen.getByTestId("props");
    expect(node.className).toBe("my-class");
    expect(node.getAttribute("aria-label")).toBe("test");
  });
});

describe("renderOptionalSlot", () => {
  it("renders when condition is true", () => {
    const el = renderOptionalSlot(resolved("span", { "data-testid": "opt" }), true, "Visible");
    render(el ?? createElement("div"));
    expect(screen.getByTestId("opt").textContent).toBe("Visible");
  });

  it("returns null when condition is false", () => {
    const el = renderOptionalSlot(resolved("span"), false);
    expect(el).toBeNull();
  });
});

describe("renderSlots", () => {
  it("renders all slots", () => {
    const slots = renderSlots({
      root: resolved("button", { "data-testid": "root" }),
      icon: resolved("span", { "data-testid": "icon" }),
    });

    render(createElement("div", null, slots.root, slots.icon));
    expect(screen.getByTestId("root").tagName).toBe("BUTTON");
    expect(screen.getByTestId("icon").tagName).toBe("SPAN");
  });

  it("renders with per-slot children", () => {
    const slots = renderSlots(
      {
        root: resolved("div", { "data-testid": "root" }),
        label: resolved("span", { "data-testid": "label" }),
      },
      { children: { label: "Label Text" } },
    );

    render(createElement("div", null, slots.root, slots.label));
    expect(screen.getByTestId("label").textContent).toBe("Label Text");
  });

  it("hides slots based on visibility", () => {
    const slots = renderSlots(
      {
        root: resolved("div", { "data-testid": "root" }),
        icon: resolved("span", { "data-testid": "icon" }),
      },
      { visible: { icon: false } },
    );

    expect(slots.root).not.toBeNull();
    expect(slots.icon).toBeNull();
  });

  it("all slots visible by default", () => {
    const slots = renderSlots({
      a: resolved("div", { "data-testid": "a" }),
      b: resolved("span", { "data-testid": "b" }),
    });

    render(createElement("div", null, slots.a, slots.b));
    expect(screen.getByTestId("a")).toBeDefined();
    expect(screen.getByTestId("b")).toBeDefined();
  });
});
