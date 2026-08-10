import { describe, it, expect } from "vitest";
import { defineBaseStyles, defineCustomProperties, token, cssVar } from "./define-styles";

describe("token", () => {
  it("creates a token reference without fallback", () => {
    const ref = token("color.interactive.default");
    expect(ref).toEqual({ token: "color.interactive.default" });
  });

  it("creates a token reference with fallback", () => {
    const ref = token("color.primary", "#0066cc");
    expect(ref).toEqual({ token: "color.primary", fallback: "#0066cc" });
  });
});

describe("cssVar", () => {
  it("creates a CSS variable reference without fallback", () => {
    expect(cssVar("color-primary")).toBe("var(--kui-color-primary)");
  });

  it("creates a CSS variable reference with fallback", () => {
    expect(cssVar("color-primary", "#0066cc")).toBe("var(--kui-color-primary, #0066cc)");
  });

  it("handles nested paths", () => {
    expect(cssVar("space-inline-md")).toBe("var(--kui-space-inline-md)");
  });
});

describe("defineBaseStyles", () => {
  it("creates immutable style definitions", () => {
    const styles = defineBaseStyles("button", {
      root: {
        base: {
          display: "inline-flex",
          alignItems: "center",
          height: "var(--kui-control-height-md)",
        },
      },
      content: {
        base: { display: "inline-flex" },
      },
    });

    expect(styles.name).toBe("button");
    expect(styles.slots.root.base!["display"]).toBe("inline-flex");
    expect(styles.slots.content.base!["display"]).toBe("inline-flex");
  });

  it("supports state styles per slot", () => {
    const styles = defineBaseStyles("button", {
      root: {
        base: { opacity: "1" },
        states: {
          disabled: { opacity: "0.5", cursor: "not-allowed" },
          loading: { cursor: "wait" },
        },
      },
    });

    expect(styles.slots.root.states!["disabled"]!["opacity"]).toBe("0.5");
    expect(styles.slots.root.states!["loading"]!["cursor"]).toBe("wait");
  });

  it("supports token references in style values", () => {
    const styles = defineBaseStyles("button", {
      root: {
        base: {
          background: token("color.interactive.default"),
          height: token("control.height.md", "36px"),
        },
      },
    });

    const bg = styles.slots.root.base!["background"];
    expect(bg).toEqual({ token: "color.interactive.default" });

    const height = styles.slots.root.base!["height"];
    expect(height).toEqual({ token: "control.height.md", fallback: "36px" });
  });

  it("supports CSS variable strings directly", () => {
    const styles = defineBaseStyles("button", {
      root: {
        base: {
          background: cssVar("color-interactive-default"),
          padding: `0 ${cssVar("space-inline-md")}`,
        },
      },
    });

    expect(styles.slots.root.base!["background"]).toBe("var(--kui-color-interactive-default)");
  });

  it("returns frozen (immutable) objects", () => {
    const styles = defineBaseStyles("button", {
      root: { base: { display: "flex" } },
    });

    expect(Object.isFrozen(styles)).toBe(true);
    expect(Object.isFrozen(styles.slots)).toBe(true);
    expect(Object.isFrozen(styles.slots.root)).toBe(true);
    expect(Object.isFrozen(styles.slots.root.base)).toBe(true);
  });

  it("handles slots with no base styles", () => {
    const styles = defineBaseStyles("card", {
      root: { base: { display: "flex" } },
      header: {},
      body: { base: { flex: "1" } },
    });

    expect(styles.slots.header.base).toBeUndefined();
    expect(styles.slots.body.base!["flex"]).toBe("1");
  });

  it("handles empty state maps", () => {
    const styles = defineBaseStyles("input", {
      root: { base: { display: "block" }, states: {} },
    });
    expect(styles.slots.root.states).toEqual({});
  });

  it("is deterministic (same input → same output)", () => {
    const input = {
      root: { base: { display: "flex", gap: "8px" } },
      icon: { base: { width: "16px" } },
    } as const;

    const a = defineBaseStyles("test", input);
    const b = defineBaseStyles("test", input);

    expect(a).toEqual(b);
  });
});

describe("defineCustomProperties", () => {
  it("creates frozen property map", () => {
    const props = defineCustomProperties({
      "--kui-button-bg": token("color.interactive.default"),
      "--kui-button-fg": "var(--kui-color-text-on-interactive)",
      "--kui-button-height": token("control.height.md", "36px"),
    });

    expect(props["--kui-button-bg"]).toEqual({ token: "color.interactive.default" });
    expect(props["--kui-button-fg"]).toBe("var(--kui-color-text-on-interactive)");
    expect(Object.isFrozen(props)).toBe(true);
  });

  it("returns empty frozen map for empty input", () => {
    const props = defineCustomProperties({});
    expect(Object.keys(props)).toHaveLength(0);
    expect(Object.isFrozen(props)).toBe(true);
  });
});
