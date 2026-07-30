import { describe, it, expect } from "vitest";
import { sharedControlTokens } from "./index";
import type {
  SharedControlTokens,
  ControlSizeTokens,
  ControlBorderTokens,
  ControlFocusTokens,
  ControlDisabledTokens,
  ControlReadOnlyTokens,
  ControlLoadingTokens,
  ControlTransitionTokens,
} from "./index";

const SIZE_LABELS = ["xs", "sm", "md", "lg", "xl"] as const;
const REM_OR_PX = /^[\d.]+(rem|px)$/;

describe("shared control tokens", () => {
  describe("contract shape", () => {
    it("satisfies SharedControlTokens", () => {
      const _check: SharedControlTokens = sharedControlTokens;
      expect(_check).toBeDefined();
    });

    it("has all top-level groups", () => {
      expect(sharedControlTokens.size).toBeDefined();
      expect(sharedControlTokens.border).toBeDefined();
      expect(sharedControlTokens.focus).toBeDefined();
      expect(sharedControlTokens.disabled).toBeDefined();
      expect(sharedControlTokens.readOnly).toBeDefined();
      expect(sharedControlTokens.loading).toBeDefined();
      expect(sharedControlTokens.transition).toBeDefined();
      expect(sharedControlTokens.typography).toBeDefined();
    });
  });

  describe("sizes", () => {
    it("has all 5 size variants", () => {
      for (const size of SIZE_LABELS) {
        expect(sharedControlTokens.size[size]).toBeDefined();
      }
    });

    it.each(SIZE_LABELS)("size.%s has all required properties", (size) => {
      const s = sharedControlTokens.size[size];
      type RequiredKeys = keyof ControlSizeTokens;
      const keys: RequiredKeys[] = [
        "height",
        "paddingX",
        "paddingY",
        "fontSize",
        "lineHeight",
        "iconSize",
        "iconGap",
      ];
      for (const key of keys) {
        expect(s[key]).toBeDefined();
      }
    });

    it("heights increase monotonically", () => {
      for (let i = 1; i < SIZE_LABELS.length; i++) {
        const prev = parseFloat(sharedControlTokens.size[SIZE_LABELS[i - 1]!].height);
        const curr = parseFloat(sharedControlTokens.size[SIZE_LABELS[i]!].height);
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it("all height values are valid lengths", () => {
      for (const size of SIZE_LABELS) {
        expect(sharedControlTokens.size[size].height).toMatch(REM_OR_PX);
      }
    });
  });

  describe("border", () => {
    it("has all required border properties", () => {
      type RequiredKeys = keyof ControlBorderTokens;
      const keys: RequiredKeys[] = [
        "width",
        "radius",
        "colorDefault",
        "colorHover",
        "colorFocus",
        "colorDisabled",
        "colorReadOnly",
        "colorInvalid",
      ];
      for (const key of keys) {
        expect(sharedControlTokens.border[key]).toBeDefined();
      }
    });

    it("radius references a primitive value", () => {
      expect(sharedControlTokens.border.radius).toMatch(REM_OR_PX);
    });
  });

  describe("focus", () => {
    it("has all focus ring properties", () => {
      type RequiredKeys = keyof ControlFocusTokens;
      const keys: RequiredKeys[] = ["ringWidth", "ringOffset", "ringColor", "innerRingColor"];
      for (const key of keys) {
        expect(sharedControlTokens.focus[key]).toBeDefined();
      }
    });

    it("ring width is 2px (visible)", () => {
      expect(sharedControlTokens.focus.ringWidth).toBe("2px");
    });
  });

  describe("disabled state", () => {
    it("has all disabled properties", () => {
      type RequiredKeys = keyof ControlDisabledTokens;
      const keys: RequiredKeys[] = ["opacity", "background", "text", "border"];
      for (const key of keys) {
        expect(sharedControlTokens.disabled[key]).toBeDefined();
      }
    });

    it("opacity is reduced", () => {
      expect(parseFloat(sharedControlTokens.disabled.opacity)).toBeLessThan(1);
    });
  });

  describe("readOnly state", () => {
    it("has all readOnly properties", () => {
      type RequiredKeys = keyof ControlReadOnlyTokens;
      const keys: RequiredKeys[] = ["background", "text", "border"];
      for (const key of keys) {
        expect(sharedControlTokens.readOnly[key]).toBeDefined();
      }
    });
  });

  describe("loading state", () => {
    it("has all loading properties", () => {
      type RequiredKeys = keyof ControlLoadingTokens;
      const keys: RequiredKeys[] = ["opacity", "text"];
      for (const key of keys) {
        expect(sharedControlTokens.loading[key]).toBeDefined();
      }
    });
  });

  describe("transition", () => {
    it("has all transition properties", () => {
      type RequiredKeys = keyof ControlTransitionTokens;
      const keys: RequiredKeys[] = ["duration", "easing", "properties"];
      for (const key of keys) {
        expect(sharedControlTokens.transition[key]).toBeDefined();
      }
    });

    it("duration is fast (≤ 150ms)", () => {
      expect(parseInt(sharedControlTokens.transition.duration, 10)).toBeLessThanOrEqual(150);
    });

    it("properties include standard transition targets", () => {
      expect(sharedControlTokens.transition.properties).toContain("background-color");
      expect(sharedControlTokens.transition.properties).toContain("border-color");
    });
  });

  describe("typography", () => {
    it("uses sans font family", () => {
      expect(sharedControlTokens.typography.fontFamily).toContain("Inter");
    });

    it("uses medium weight for labels", () => {
      expect(sharedControlTokens.typography.fontWeight).toBe(500);
    });
  });

  describe("public import", () => {
    it("shared control tokens are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.sharedControlTokens).toBeDefined();
    });
  });
});
