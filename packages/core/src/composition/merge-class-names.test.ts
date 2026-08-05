import { describe, it, expect } from "vitest";
import { mergeClassNames, mergeClassNameSources } from "./merge-class-names";

describe("mergeClassNames", () => {
  it("merges multiple string sources", () => {
    expect(mergeClassNames("base", "state", "consumer")).toBe("base state consumer");
  });

  it("skips null and undefined", () => {
    expect(mergeClassNames("base", null, undefined, "consumer")).toBe("base consumer");
  });

  it("skips false and empty strings", () => {
    expect(mergeClassNames("base", false, "", "end")).toBe("base end");
  });

  it("returns empty string for all-empty inputs", () => {
    expect(mergeClassNames(null, undefined, false, "")).toBe("");
  });

  it("returns empty string for no inputs", () => {
    expect(mergeClassNames()).toBe("");
  });

  it("preserves duplicate class names", () => {
    expect(mergeClassNames("foo", "foo")).toBe("foo foo");
  });

  it("preserves source order (base before consumer)", () => {
    expect(mergeClassNames("kui-btn", "is-active", "custom")).toBe("kui-btn is-active custom");
  });

  it("handles conditional classes", () => {
    const active = Boolean(Date.now());
    const disabled = !active;
    expect(mergeClassNames("base", active && "is-active", disabled && "is-disabled")).toBe(
      "base is-active",
    );
  });

  it("handles object notation", () => {
    expect(mergeClassNames("base", { "is-open": true, "is-closed": false })).toBe("base is-open");
  });

  it("handles arrays", () => {
    expect(mergeClassNames(["a", "b"], "c")).toBe("a b c");
  });
});

describe("mergeClassNameSources", () => {
  it("merges all named sources in order", () => {
    expect(
      mergeClassNameSources({
        base: "kui-btn",
        state: "is-active",
        variants: "variant-primary",
        theme: "theme-dark",
        internal: "internal-focus",
        consumer: "my-class",
        slot: "slot-root",
        child: "child-class",
      }),
    ).toBe(
      "kui-btn is-active variant-primary theme-dark internal-focus my-class slot-root child-class",
    );
  });

  it("skips undefined sources", () => {
    expect(
      mergeClassNameSources({
        base: "kui-btn",
        consumer: "custom",
      }),
    ).toBe("kui-btn custom");
  });

  it("consumer appears after internal sources", () => {
    const result = mergeClassNameSources({
      base: "base",
      internal: "internal",
      consumer: "consumer",
    });
    const parts = result.split(" ");
    expect(parts.indexOf("consumer")).toBeGreaterThan(parts.indexOf("internal"));
    expect(parts.indexOf("consumer")).toBeGreaterThan(parts.indexOf("base"));
  });

  it("slot appears after consumer", () => {
    const result = mergeClassNameSources({
      consumer: "consumer",
      slot: "slot",
    });
    const parts = result.split(" ");
    expect(parts.indexOf("slot")).toBeGreaterThan(parts.indexOf("consumer"));
  });

  it("child appears last", () => {
    const result = mergeClassNameSources({
      base: "base",
      consumer: "consumer",
      child: "child",
    });
    const parts = result.split(" ");
    expect(parts.indexOf("child")).toBe(parts.length - 1);
  });

  it("returns empty string when no sources provided", () => {
    expect(mergeClassNameSources({})).toBe("");
  });

  it("handles conditional values in sources", () => {
    const active = Boolean(Date.now());
    expect(
      mergeClassNameSources({
        base: "btn",
        state: active && "is-active",
      }),
    ).toBe("btn is-active");
  });
});
