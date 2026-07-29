import { describe, it, expect } from "vitest";
import { tokenPathToCssVar, camelToKebab, cssVarToTokenSlug } from "./naming";

describe("camelToKebab", () => {
  it("converts camelCase to kebab-case", () => {
    expect(camelToKebab("fontSize")).toBe("font-size");
    expect(camelToKebab("fontWeight")).toBe("font-weight");
    expect(camelToKebab("lineHeight")).toBe("line-height");
    expect(camelToKebab("zIndex")).toBe("z-index");
    expect(camelToKebab("backgroundHover")).toBe("background-hover");
    expect(camelToKebab("inOut")).toBe("in-out");
    expect(camelToKebab("borderFocus")).toBe("border-focus");
    expect(camelToKebab("textDisabled")).toBe("text-disabled");
  });

  it("leaves already-lowercase strings unchanged", () => {
    expect(camelToKebab("color")).toBe("color");
    expect(camelToKebab("page")).toBe("page");
    expect(camelToKebab("500")).toBe("500");
  });
});

describe("tokenPathToCssVar", () => {
  describe("primitive tokens", () => {
    it("converts color scale tokens", () => {
      expect(tokenPathToCssVar("color.neutral.500")).toBe("--kui-color-neutral-500");
      expect(tokenPathToCssVar("color.blue.600")).toBe("--kui-color-blue-600");
      expect(tokenPathToCssVar("color.red.50")).toBe("--kui-color-red-50");
    });

    it("converts spacing tokens with abbreviation", () => {
      expect(tokenPathToCssVar("spacing.4")).toBe("--kui-space-4");
      expect(tokenPathToCssVar("spacing.16")).toBe("--kui-space-16");
      expect(tokenPathToCssVar("spacing.0")).toBe("--kui-space-0");
    });

    it("converts typography tokens", () => {
      expect(tokenPathToCssVar("fontSize.sm")).toBe("--kui-font-size-sm");
      expect(tokenPathToCssVar("fontSize.lg")).toBe("--kui-font-size-lg");
      expect(tokenPathToCssVar("fontWeight.bold")).toBe("--kui-font-weight-bold");
      expect(tokenPathToCssVar("lineHeight.tight")).toBe("--kui-line-height-tight");
    });

    it("converts radius tokens", () => {
      expect(tokenPathToCssVar("radius.md")).toBe("--kui-radius-md");
      expect(tokenPathToCssVar("radius.full")).toBe("--kui-radius-full");
    });

    it("converts shadow tokens", () => {
      expect(tokenPathToCssVar("shadow.md")).toBe("--kui-shadow-md");
      expect(tokenPathToCssVar("shadow.xl")).toBe("--kui-shadow-xl");
    });

    it("converts motion tokens", () => {
      expect(tokenPathToCssVar("duration.fast")).toBe("--kui-duration-fast");
      expect(tokenPathToCssVar("easing.inOut")).toBe("--kui-easing-in-out");
    });

    it("converts z-index tokens", () => {
      expect(tokenPathToCssVar("zIndex.modal")).toBe("--kui-z-index-modal");
      expect(tokenPathToCssVar("zIndex.dropdown")).toBe("--kui-z-index-dropdown");
    });

    it("converts opacity tokens", () => {
      expect(tokenPathToCssVar("opacity.50")).toBe("--kui-opacity-50");
    });

    it("converts breakpoint tokens", () => {
      expect(tokenPathToCssVar("breakpoint.md")).toBe("--kui-breakpoint-md");
    });
  });

  describe("semantic tokens", () => {
    it("converts background tokens with abbreviation", () => {
      expect(tokenPathToCssVar("color.background.page")).toBe("--kui-color-bg-page");
      expect(tokenPathToCssVar("color.background.surface")).toBe("--kui-color-bg-surface");
      expect(tokenPathToCssVar("color.background.elevated")).toBe("--kui-color-bg-elevated");
    });

    it("converts text tokens", () => {
      expect(tokenPathToCssVar("color.text.primary")).toBe("--kui-color-text-primary");
      expect(tokenPathToCssVar("color.text.secondary")).toBe("--kui-color-text-secondary");
      expect(tokenPathToCssVar("color.text.disabled")).toBe("--kui-color-text-disabled");
    });

    it("converts border tokens", () => {
      expect(tokenPathToCssVar("color.border.default")).toBe("--kui-color-border-default");
      expect(tokenPathToCssVar("color.border.interactive")).toBe("--kui-color-border-interactive");
      expect(tokenPathToCssVar("color.border.focus")).toBe("--kui-color-border-focus");
    });

    it("converts interactive tokens", () => {
      expect(tokenPathToCssVar("color.interactive.default")).toBe(
        "--kui-color-interactive-default",
      );
      expect(tokenPathToCssVar("color.interactive.hover")).toBe("--kui-color-interactive-hover");
    });

    it("converts status tokens", () => {
      expect(tokenPathToCssVar("color.status.error")).toBe("--kui-color-status-error");
      expect(tokenPathToCssVar("color.status.success")).toBe("--kui-color-status-success");
    });

    it("converts focus tokens", () => {
      expect(tokenPathToCssVar("color.focus.ring")).toBe("--kui-color-focus-ring");
    });

    it("converts spacing semantic tokens", () => {
      expect(tokenPathToCssVar("spacing.component.gap")).toBe("--kui-space-component-gap");
    });

    it("converts elevation tokens", () => {
      expect(tokenPathToCssVar("elevation.overlay")).toBe("--kui-elevation-overlay");
    });

    it("converts control tokens", () => {
      expect(tokenPathToCssVar("control.height.md")).toBe("--kui-control-height-md");
    });
  });

  describe("component tokens", () => {
    it("converts button tokens", () => {
      expect(tokenPathToCssVar("button.primary.background")).toBe("--kui-button-primary-bg");
      expect(tokenPathToCssVar("button.primary.backgroundHover")).toBe(
        "--kui-button-primary-bg-hover",
      );
      expect(tokenPathToCssVar("button.primary.text")).toBe("--kui-button-primary-text");
      expect(tokenPathToCssVar("button.secondary.border")).toBe("--kui-button-secondary-border");
    });

    it("converts input tokens", () => {
      expect(tokenPathToCssVar("input.default.background")).toBe("--kui-input-default-bg");
      expect(tokenPathToCssVar("input.default.borderFocus")).toBe(
        "--kui-input-default-border-focus",
      );
    });

    it("converts dialog tokens", () => {
      expect(tokenPathToCssVar("dialog.shadow")).toBe("--kui-dialog-shadow");
      expect(tokenPathToCssVar("dialog.background")).toBe("--kui-dialog-bg");
    });

    it("converts tab tokens", () => {
      expect(tokenPathToCssVar("tab.active.indicator")).toBe("--kui-tab-active-indicator");
    });
  });
});

describe("cssVarToTokenSlug", () => {
  it("strips the --kui- prefix", () => {
    expect(cssVarToTokenSlug("--kui-color-bg-page")).toBe("color-bg-page");
    expect(cssVarToTokenSlug("--kui-space-4")).toBe("space-4");
    expect(cssVarToTokenSlug("--kui-button-primary-bg-hover")).toBe("button-primary-bg-hover");
  });
});
