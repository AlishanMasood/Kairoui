import { describe, it, expect } from "vitest";
import {
  resolveClassName,
  resolveStyle,
  resolveSlotOverride,
  resolveConsumerOverrides,
} from "./consumer-overrides";

// ─── resolveClassName ───────────────────────────────────────────────

describe("resolveClassName", () => {
  it("returns undefined when both are undefined", () => {
    expect(resolveClassName(undefined, undefined)).toBeUndefined();
  });

  it("returns internal when consumer is undefined", () => {
    expect(resolveClassName("kui-button", undefined)).toBe("kui-button");
  });

  it("returns consumer when internal is undefined", () => {
    expect(resolveClassName(undefined, "my-button")).toBe("my-button");
  });

  it("merges both (internal first, consumer appended)", () => {
    expect(resolveClassName("kui-button", "my-button")).toBe("kui-button my-button");
  });

  it("preserves multiple internal classes", () => {
    expect(resolveClassName("kui-button kui-button--primary", "custom")).toBe(
      "kui-button kui-button--primary custom",
    );
  });

  it("returns undefined for empty strings", () => {
    expect(resolveClassName("", "")).toBeUndefined();
  });

  it("returns non-empty when one is empty", () => {
    expect(resolveClassName("kui-button", "")).toBe("kui-button");
    expect(resolveClassName("", "custom")).toBe("custom");
  });
});

// ─── resolveStyle ───────────────────────────────────────────────────

describe("resolveStyle", () => {
  it("returns undefined when both are undefined", () => {
    expect(resolveStyle(undefined, undefined)).toBeUndefined();
  });

  it("returns copy of internal when consumer is undefined", () => {
    const internal = { color: "red", padding: "8px" };
    const result = resolveStyle(internal, undefined);
    expect(result).toEqual(internal);
    expect(result).not.toBe(internal); // new object
  });

  it("returns copy of consumer when internal is undefined", () => {
    const consumer = { color: "blue" };
    const result = resolveStyle(undefined, consumer);
    expect(result).toEqual(consumer);
    expect(result).not.toBe(consumer);
  });

  it("consumer overrides internal per-property", () => {
    const result = resolveStyle(
      { color: "red", padding: "8px", gap: "4px" },
      { color: "blue", margin: "16px" },
    );
    expect(result).toEqual({
      color: "blue", // consumer wins
      padding: "8px", // internal preserved
      gap: "4px", // internal preserved
      margin: "16px", // consumer added
    });
  });

  it("does not mutate inputs", () => {
    const internal = { color: "red" };
    const consumer = { color: "blue" };
    resolveStyle(internal, consumer);
    expect(internal["color"]).toBe("red");
  });

  it("handles numeric values", () => {
    const result = resolveStyle({ opacity: 1 }, { opacity: 0.5 });
    expect(result).toEqual({ opacity: 0.5 });
  });
});

// ─── resolveSlotOverride ────────────────────────────────────────────

describe("resolveSlotOverride", () => {
  it("returns internal values when no consumer override", () => {
    const result = resolveSlotOverride("kui-icon", { width: "16px" }, undefined);
    expect(result.className).toBe("kui-icon");
    expect(result.style).toEqual({ width: "16px" });
  });

  it("merges consumer className with internal", () => {
    const result = resolveSlotOverride("kui-icon", undefined, { className: "my-icon" });
    expect(result.className).toBe("kui-icon my-icon");
  });

  it("merges consumer style with internal", () => {
    const result = resolveSlotOverride(undefined, { width: "16px" }, { style: { color: "red" } });
    expect(result.style).toEqual({ width: "16px", color: "red" });
  });

  it("consumer style overrides internal per-property", () => {
    const result = resolveSlotOverride(undefined, { width: "16px" }, { style: { width: "24px" } });
    expect(result.style).toEqual({ width: "24px" });
  });

  it("handles all undefined", () => {
    const result = resolveSlotOverride(undefined, undefined, undefined);
    expect(result.className).toBeUndefined();
    expect(result.style).toBeUndefined();
  });
});

// ─── resolveConsumerOverrides ───────────────────────────────────────

describe("resolveConsumerOverrides", () => {
  it("resolves root className and style", () => {
    const result = resolveConsumerOverrides(
      ["root", "icon"] as const,
      {
        root: { className: "kui-button" },
        icon: { className: "kui-button__icon" },
      },
      { className: "my-button", style: { color: "red" } },
    );
    expect(result.root.className).toBe("kui-button my-button");
    expect(result.root.style).toEqual({ color: "red" });
    expect(result.icon.className).toBe("kui-button__icon");
  });

  it("resolves slot overrides via slotOverrides", () => {
    const result = resolveConsumerOverrides(
      ["root", "icon", "content"] as const,
      {
        root: { className: "kui-button" },
        icon: { className: "kui-button__icon", style: { width: "16px" } },
        content: { className: "kui-button__content" },
      },
      {
        slotOverrides: {
          icon: { className: "my-icon", style: { color: "blue" } },
        },
      },
    );
    expect(result.icon.className).toBe("kui-button__icon my-icon");
    expect(result.icon.style).toEqual({ width: "16px", color: "blue" });
    expect(result.content.className).toBe("kui-button__content");
  });

  it("root gets both root-level and slotOverrides.root merged", () => {
    const result = resolveConsumerOverrides(
      ["root"] as const,
      { root: { className: "kui-button" } },
      {
        className: "consumer-root",
        slotOverrides: { root: { className: "slot-root" } },
      },
    );
    // Both consumer root-level AND slotOverrides.root are merged
    expect(result.root.className).toContain("kui-button");
    expect(result.root.className).toContain("consumer-root");
    expect(result.root.className).toContain("slot-root");
  });

  it("consumer style overrides internal per-property on root", () => {
    const result = resolveConsumerOverrides(
      ["root"] as const,
      { root: { style: { padding: "8px", color: "black" } } },
      { style: { color: "red", margin: "4px" } },
    );
    expect(result.root.style).toEqual({
      padding: "8px", // internal preserved
      color: "red", // consumer wins
      margin: "4px", // consumer added
    });
  });

  it("handles empty consumer input", () => {
    const result = resolveConsumerOverrides(
      ["root", "label"] as const,
      {
        root: { className: "kui-field" },
        label: { className: "kui-field__label" },
      },
      {},
    );
    expect(result.root.className).toBe("kui-field");
    expect(result.label.className).toBe("kui-field__label");
  });

  it("does not leak consumer root className to non-root slots", () => {
    const result = resolveConsumerOverrides(
      ["root", "icon"] as const,
      {
        root: { className: "kui-button" },
        icon: { className: "kui-button__icon" },
      },
      { className: "consumer-class" },
    );
    expect(result.root.className).toContain("consumer-class");
    expect(result.icon.className).not.toContain("consumer-class");
  });
});

// ─── Precedence tests ───────────────────────────────────────────────

describe("consumer override precedence", () => {
  it("consumer className appends, never replaces internal", () => {
    const result = resolveClassName("kui-internal", "consumer-override");
    expect(result).toBe("kui-internal consumer-override");
    expect(result).toContain("kui-internal"); // internal always present
  });

  it("consumer style wins per-property over internal", () => {
    const result = resolveStyle(
      { background: "var(--kui-color-primary)", borderRadius: "4px" },
      { background: "purple" },
    );
    expect(result!["background"]).toBe("purple");
    expect(result!["borderRadius"]).toBe("4px");
  });

  it("slot override is independent from root override", () => {
    const result = resolveConsumerOverrides(
      ["root", "content"] as const,
      {
        root: { className: "root-class" },
        content: { className: "content-class" },
      },
      {
        className: "root-consumer",
        slotOverrides: { content: { className: "content-consumer" } },
      },
    );
    expect(result.root.className).toContain("root-consumer");
    expect(result.root.className).not.toContain("content-consumer");
    expect(result.content.className).toContain("content-consumer");
    expect(result.content.className).not.toContain("root-consumer");
  });
});
