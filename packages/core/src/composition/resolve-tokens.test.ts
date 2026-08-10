import { describe, it, expect, vi, afterEach } from "vitest";
import {
  tokenToVar,
  tokenToCssValue,
  resolveTokenReference,
  resolveStyleTokens,
  resolveCustomProperties,
} from "./resolve-tokens";
import type { TokenReference } from "./style-contract";

afterEach(() => vi.restoreAllMocks());

// ─── tokenToVar ─────────────────────────────────────────────────────

describe("tokenToVar", () => {
  it("converts simple dot-path to CSS variable", () => {
    expect(tokenToVar("color.primary")).toBe("--kui-color-primary");
  });

  it("applies abbreviations", () => {
    expect(tokenToVar("color.background.page")).toBe("--kui-color-bg-page");
    expect(tokenToVar("spacing.inline.md")).toBe("--kui-space-inline-md");
  });

  it("converts camelCase to kebab-case", () => {
    expect(tokenToVar("color.backgroundHover")).toBe("--kui-color-bg-hover");
    expect(tokenToVar("typography.fontSize")).toBe("--kui-typography-font-size");
  });

  it("handles deep paths", () => {
    expect(tokenToVar("color.interactive.default")).toBe("--kui-color-interactive-default");
    expect(tokenToVar("control.height.md")).toBe("--kui-control-height-md");
  });

  it("handles single-segment paths", () => {
    expect(tokenToVar("color")).toBe("--kui-color");
  });
});

// ─── tokenToCssValue ────────────────────────────────────────────────

describe("tokenToCssValue", () => {
  it("creates var() without fallback", () => {
    expect(tokenToCssValue("color.primary")).toBe("var(--kui-color-primary)");
  });

  it("creates var() with fallback", () => {
    expect(tokenToCssValue("color.primary", "#0066cc")).toBe("var(--kui-color-primary, #0066cc)");
  });

  it("handles spacing tokens", () => {
    expect(tokenToCssValue("spacing.inline.md")).toBe("var(--kui-space-inline-md)");
  });

  it("handles control tokens", () => {
    expect(tokenToCssValue("control.height.md", "36px")).toBe("var(--kui-control-height-md, 36px)");
  });
});

// ─── resolveTokenReference ──────────────────────────────────────────

describe("resolveTokenReference", () => {
  it("resolves token to var()", () => {
    const ref: TokenReference = { token: "color.interactive.default" };
    expect(resolveTokenReference(ref)).toBe("var(--kui-color-interactive-default)");
  });

  it("includes fallback when provided", () => {
    const ref: TokenReference = { token: "control.height.md", fallback: "36px" };
    expect(resolveTokenReference(ref)).toBe("var(--kui-control-height-md, 36px)");
  });

  it("warns for invalid token paths in development", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveTokenReference({ token: "invalid" }, "Button");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Invalid token path"));
    spy.mockRestore();
  });

  it("does not warn for valid paths", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveTokenReference({ token: "color.primary" });
    resolveTokenReference({ token: "spacing.inline.md" });
    resolveTokenReference({ token: "border.radius.sm" });
    resolveTokenReference({ token: "shadow.md" });
    resolveTokenReference({ token: "interaction.transition.fast" });
    resolveTokenReference({ token: "focus.ring.color" });
    resolveTokenReference({ token: "typography.body.fontSize" });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ─── resolveStyleTokens ─────────────────────────────────────────────

describe("resolveStyleTokens", () => {
  it("passes through string values unchanged", () => {
    const result = resolveStyleTokens({
      display: "inline-flex",
      cursor: "pointer",
    });
    expect(result["display"]).toBe("inline-flex");
    expect(result["cursor"]).toBe("pointer");
  });

  it("resolves TokenReference values to var()", () => {
    const result = resolveStyleTokens({
      background: { token: "color.interactive.default" },
      height: { token: "control.height.md", fallback: "36px" },
    });
    expect(result["background"]).toBe("var(--kui-color-interactive-default)");
    expect(result["height"]).toBe("var(--kui-control-height-md, 36px)");
  });

  it("handles mixed string and token values", () => {
    const result = resolveStyleTokens({
      display: "flex",
      background: { token: "color.background.page" },
      padding: "0 16px",
      gap: { token: "spacing.inline.sm" },
    });
    expect(result["display"]).toBe("flex");
    expect(result["background"]).toBe("var(--kui-color-bg-page)");
    expect(result["padding"]).toBe("0 16px");
    expect(result["gap"]).toBe("var(--kui-space-inline-sm)");
  });

  it("returns empty object for empty input", () => {
    expect(resolveStyleTokens({})).toEqual({});
  });

  it("validates token paths with component name", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveStyleTokens({ bg: { token: "bad" } }, "MyComp");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("MyComp"));
    spy.mockRestore();
  });
});

// ─── resolveCustomProperties ────────────────────────────────────────

describe("resolveCustomProperties", () => {
  it("resolves component custom properties", () => {
    const result = resolveCustomProperties({
      "--kui-button-bg": { token: "color.interactive.default" },
      "--kui-button-fg": { token: "color.foreground.onInteractive" },
      "--kui-button-height": { token: "control.height.md", fallback: "36px" },
    });
    expect(result["--kui-button-bg"]).toBe("var(--kui-color-interactive-default)");
    expect(result["--kui-button-fg"]).toBe("var(--kui-color-fg-on-interactive)");
    expect(result["--kui-button-height"]).toBe("var(--kui-control-height-md, 36px)");
  });

  it("preserves string values as-is", () => {
    const result = resolveCustomProperties({
      "--kui-button-radius": "4px",
      "--kui-button-gap": "var(--kui-space-inline-sm)",
    });
    expect(result["--kui-button-radius"]).toBe("4px");
    expect(result["--kui-button-gap"]).toBe("var(--kui-space-inline-sm)");
  });

  it("handles empty input", () => {
    expect(resolveCustomProperties({})).toEqual({});
  });
});

// ─── Token categories ───────────────────────────────────────────────

describe("token categories", () => {
  it("resolves color tokens", () => {
    expect(tokenToCssValue("color.text.primary")).toBe("var(--kui-color-text-primary)");
    expect(tokenToCssValue("color.interactive.hover")).toBe("var(--kui-color-interactive-hover)");
    expect(tokenToCssValue("color.background.surface")).toBe("var(--kui-color-bg-surface)");
  });

  it("resolves spacing tokens", () => {
    expect(tokenToCssValue("spacing.inline.md")).toBe("var(--kui-space-inline-md)");
    expect(tokenToCssValue("spacing.form.fieldGap")).toBe("var(--kui-space-form-field-gap)");
  });

  it("resolves typography tokens", () => {
    expect(tokenToCssValue("typography.body.fontSize")).toBe(
      "var(--kui-typography-body-font-size)",
    );
    expect(tokenToCssValue("font.size.base")).toBe("var(--kui-font-size-base)");
    expect(tokenToCssValue("line.height.normal")).toBe("var(--kui-line-height-normal)");
  });

  it("resolves border tokens", () => {
    expect(tokenToCssValue("border.radius.sm")).toBe("var(--kui-border-radius-sm)");
    expect(tokenToCssValue("border.width.thin")).toBe("var(--kui-border-width-thin)");
  });

  it("resolves shadow tokens", () => {
    expect(tokenToCssValue("shadow.sm")).toBe("var(--kui-shadow-sm)");
    expect(tokenToCssValue("shadow.lg")).toBe("var(--kui-shadow-lg)");
  });

  it("resolves motion tokens", () => {
    expect(tokenToCssValue("interaction.transition.fast")).toBe(
      "var(--kui-interaction-transition-fast)",
    );
  });

  it("resolves focus tokens", () => {
    expect(tokenToCssValue("focus.ring.color")).toBe("var(--kui-focus-ring-color)");
    expect(tokenToCssValue("focus.ring.offset")).toBe("var(--kui-focus-ring-offset)");
  });

  it("resolves control tokens", () => {
    expect(tokenToCssValue("control.height.sm")).toBe("var(--kui-control-height-sm)");
    expect(tokenToCssValue("control.height.lg")).toBe("var(--kui-control-height-lg)");
  });
});
