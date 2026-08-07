import { describe, it, expect, expectTypeOf } from "vitest";
import { defineSlot, defineSlots } from "./slot-definitions";
import type { SlotDefinition, SlotNames } from "./slot-definitions";

describe("defineSlot", () => {
  it("creates a slot definition with defaults", () => {
    const slot = defineSlot("root");
    expect(slot).toEqual({
      defaultElement: "div",
      required: false,
      public: true,
      role: undefined,
      slotName: "root",
    });
  });

  it("accepts custom options", () => {
    const slot = defineSlot("trigger", {
      defaultElement: "button",
      required: true,
      public: true,
      role: "button",
    });
    expect(slot.defaultElement).toBe("button");
    expect(slot.required).toBe(true);
    expect(slot.role).toBe("button");
    expect(slot.slotName).toBe("trigger");
  });

  it("supports internal (non-public) slots", () => {
    const slot = defineSlot("positioner", { public: false });
    expect(slot.public).toBe(false);
  });

  it("supports custom element types", () => {
    const slot = defineSlot("content", { defaultElement: "section" });
    expect(slot.defaultElement).toBe("section");
  });
});

describe("defineSlots", () => {
  it("creates a typed slot definition map", () => {
    const slots = defineSlots({
      root: { defaultElement: "button", required: true },
      icon: { defaultElement: "span", required: false },
      label: { defaultElement: "span", required: false },
    });

    expect(slots.root.required).toBe(true);
    expect(slots.root.defaultElement).toBe("button");
    expect(slots.icon.defaultElement).toBe("span");
    expect(slots.label.slotName).toBe("label");
  });

  it("applies defaults to all slots", () => {
    const slots = defineSlots({
      root: {},
      content: {},
    });
    expect(slots.root.defaultElement).toBe("div");
    expect(slots.root.public).toBe(true);
    expect(slots.content.required).toBe(false);
  });

  it("preserves all slot names", () => {
    const slots = defineSlots({
      root: { required: true },
      header: {},
      body: {},
      footer: {},
    });
    expect(Object.keys(slots)).toEqual(["root", "header", "body", "footer"]);
  });
});

describe("type-level tests", () => {
  it("SlotNames extracts slot name union", () => {
    const _slots = defineSlots({
      root: { required: true },
      content: {},
      footer: {},
    });
    type Names = SlotNames<typeof _slots>;
    expectTypeOf<Names>().toEqualTypeOf<"root" | "content" | "footer">();
  });

  it("SlotDefinitionMap is readonly", () => {
    const _slots = defineSlots({ root: { required: true } });
    expectTypeOf<typeof _slots>().toExtend<Readonly<Record<string, SlotDefinition>>>();
  });
});
