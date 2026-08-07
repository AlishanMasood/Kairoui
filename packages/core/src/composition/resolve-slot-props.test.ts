import { describe, it, expect, vi } from "vitest";
import { resolveSlotProps, resolveAllSlotProps } from "./resolve-slot-props";
import { defineSlot, defineSlots } from "./slot-definitions";

describe("resolveSlotProps", () => {
  it("resolves with internal props only", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { type: "button", className: "kui-btn" },
    });
    expect(result.element).toBe("button");
    expect(result.props["type"]).toBe("button");
    expect(result.props["className"]).toBe("kui-btn");
    expect(result.props["data-kui-slot"]).toBe("root");
  });

  it("merges accessibility props with internal", () => {
    const result = resolveSlotProps({
      definition: defineSlot("trigger", { defaultElement: "button" }),
      internalProps: { className: "internal" },
      accessibilityProps: { "aria-expanded": "true", "aria-haspopup": "dialog" },
    });
    expect(result.props["className"]).toBe("internal");
    expect(result.props["aria-expanded"]).toBe("true");
    expect(result.props["aria-haspopup"]).toBe("dialog");
  });

  it("merges state props over internal", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root"),
      internalProps: { "data-state": "closed" },
      stateProps: { "data-state": "open", "data-disabled": "" },
    });
    expect(result.props["data-state"]).toBe("open");
    expect(result.props["data-disabled"]).toBe("");
  });

  it("consumer slotProps override state", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root"),
      stateProps: { className: "state" },
      consumerProps: { className: "consumer", id: "my-id" },
    });
    expect(result.props["className"]).toContain("state");
    expect(result.props["className"]).toContain("consumer");
    expect(result.props["id"]).toBe("my-id");
  });

  it("composes event handlers across sources", () => {
    const internalClick = vi.fn();
    const consumerClick = vi.fn();
    const result = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      internalProps: { onClick: internalClick },
      consumerProps: { onClick: consumerClick },
    });
    // Events are composed via mergeProps
    const handler = result.props["onClick"] as (e: { defaultPrevented: boolean }) => void;
    handler({ defaultPrevented: false });
    expect(consumerClick).toHaveBeenCalled();
    expect(internalClick).toHaveBeenCalled();
  });

  it("uses element override when provided", () => {
    const result = resolveSlotProps({
      definition: defineSlot("root", { defaultElement: "button" }),
      elementOverride: "a",
    });
    expect(result.element).toBe("a");
  });

  it("uses default element when no override", () => {
    const result = resolveSlotProps({
      definition: defineSlot("content", { defaultElement: "section" }),
    });
    expect(result.element).toBe("section");
  });

  it("always includes data-kui-slot metadata", () => {
    const result = resolveSlotProps({
      definition: defineSlot("indicator"),
    });
    expect(result.props["data-kui-slot"]).toBe("indicator");
  });
});

describe("resolveAllSlotProps", () => {
  it("resolves all slots in a component", () => {
    const definitions = defineSlots({
      root: { defaultElement: "button", required: true },
      icon: { defaultElement: "span" },
      label: { defaultElement: "span" },
    });

    const result = resolveAllSlotProps({
      definitions,
      internalProps: {
        root: { type: "button", className: "kui-btn" },
        icon: { "aria-hidden": "true" },
        label: {},
      },
    });

    expect(result.root.element).toBe("button");
    expect(result.root.props["type"]).toBe("button");
    expect(result.root.props["data-kui-slot"]).toBe("root");
    expect(result.icon.props["aria-hidden"]).toBe("true");
    expect(result.icon.props["data-kui-slot"]).toBe("icon");
    expect(result.label.props["data-kui-slot"]).toBe("label");
  });

  it("applies consumer overrides to specific slots", () => {
    const definitions = defineSlots({
      root: { defaultElement: "button" },
      icon: { defaultElement: "span" },
    });

    const result = resolveAllSlotProps({
      definitions,
      overrides: {
        slots: { root: "a" },
        slotProps: { root: { href: "/" }, icon: { className: "custom-icon" } },
      },
    });

    expect(result.root.element).toBe("a");
    expect(result.root.props["href"]).toBe("/");
    expect(result.icon.element).toBe("span");
    expect(result.icon.props["className"]).toBe("custom-icon");
  });

  it("handles empty overrides", () => {
    const definitions = defineSlots({
      root: { defaultElement: "div" },
    });

    const result = resolveAllSlotProps({ definitions });
    expect(result.root.element).toBe("div");
    expect(result.root.props["data-kui-slot"]).toBe("root");
  });
});
