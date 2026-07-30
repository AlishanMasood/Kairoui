import { describe, it, expect } from "vitest";
import { formControlTokens } from "./form-controls";
import type { FormControlContracts } from "./form-controls";

const STATES = [
  "default",
  "hover",
  "focus",
  "filled",
  "disabled",
  "readOnly",
  "invalid",
  "valid",
] as const;
const SIZES = ["sm", "md", "lg"] as const;

describe("form control token contracts", () => {
  describe("contract shape", () => {
    it("satisfies FormControlContracts", () => {
      const _check: FormControlContracts = formControlTokens;
      expect(_check).toBeDefined();
    });

    it("has all form control types", () => {
      expect(formControlTokens.input).toBeDefined();
      expect(formControlTokens.select).toBeDefined();
      expect(formControlTokens.checkbox).toBeDefined();
      expect(formControlTokens.radio).toBeDefined();
      expect(formControlTokens.switch).toBeDefined();
      expect(formControlTokens.field).toBeDefined();
    });
  });

  describe("input", () => {
    it("has all 8 states", () => {
      for (const s of STATES) {
        expect(formControlTokens.input.states[s]).toBeDefined();
      }
    });

    it("each state has background, text, border, placeholder, icon", () => {
      for (const s of STATES) {
        const state = formControlTokens.input.states[s];
        expect(state.background).toBeDefined();
        expect(state.text).toBeDefined();
        expect(state.border).toBeDefined();
        expect(state.placeholder).toBeDefined();
        expect(state.icon).toBeDefined();
      }
    });

    it("has all 3 sizes", () => {
      for (const s of SIZES) {
        expect(formControlTokens.input.size[s]).toBeDefined();
        expect(formControlTokens.input.size[s].height).toBeDefined();
        expect(formControlTokens.input.size[s].paddingX).toBeDefined();
        expect(formControlTokens.input.size[s].fontSize).toBeDefined();
      }
    });

    it("has focus ring and transition", () => {
      expect(formControlTokens.input.focusRing.width).toBe("2px");
      expect(formControlTokens.input.transition.duration).toBe("100ms");
    });
  });

  describe("select", () => {
    it("has states matching input", () => {
      for (const s of STATES) {
        expect(formControlTokens.select.states[s]).toBeDefined();
      }
    });

    it("has dropdown indicator", () => {
      expect(formControlTokens.select.indicator.size).toBeDefined();
      expect(formControlTokens.select.indicator.color).toBeDefined();
    });
  });

  describe("checkbox", () => {
    it("has all sizes", () => {
      for (const s of SIZES) {
        expect(formControlTokens.checkbox.size[s]).toBeDefined();
      }
    });

    it("has border states", () => {
      expect(formControlTokens.checkbox.border.default).toBeDefined();
      expect(formControlTokens.checkbox.border.hover).toBeDefined();
      expect(formControlTokens.checkbox.border.focus).toBeDefined();
      expect(formControlTokens.checkbox.border.disabled).toBeDefined();
    });

    it("has checked and unchecked backgrounds", () => {
      expect(formControlTokens.checkbox.background.unchecked).toBeDefined();
      expect(formControlTokens.checkbox.background.checked).toBeDefined();
    });

    it("has checkmark colors", () => {
      expect(formControlTokens.checkbox.checkmark.color).toBe("#ffffff");
    });

    it("has label gap", () => {
      expect(formControlTokens.checkbox.labelGap).toBeDefined();
    });
  });

  describe("radio", () => {
    it("has all sizes", () => {
      for (const s of SIZES) {
        expect(formControlTokens.radio.size[s]).toBeDefined();
      }
    });

    it("has selected and unselected backgrounds", () => {
      expect(formControlTokens.radio.background.unselected).toBeDefined();
      expect(formControlTokens.radio.background.selected).toBeDefined();
    });

    it("has dot color", () => {
      expect(formControlTokens.radio.dot.color).toBe("#ffffff");
    });
  });

  describe("switch", () => {
    it("has track dimensions", () => {
      expect(formControlTokens.switch.track.width).toBeDefined();
      expect(formControlTokens.switch.track.height).toBeDefined();
      expect(formControlTokens.switch.track.radius).toBeDefined();
    });

    it("has on/off/disabled track backgrounds", () => {
      expect(formControlTokens.switch.track.backgroundOff).toBeDefined();
      expect(formControlTokens.switch.track.backgroundOn).toBeDefined();
      expect(formControlTokens.switch.track.backgroundDisabled).toBeDefined();
    });

    it("has thumb with size and color", () => {
      expect(formControlTokens.switch.thumb.size).toBeDefined();
      expect(formControlTokens.switch.thumb.color).toBe("#ffffff");
    });
  });

  describe("form field layout", () => {
    it("has label tokens", () => {
      expect(formControlTokens.field.label.fontSize).toBeDefined();
      expect(formControlTokens.field.label.fontWeight).toBeDefined();
      expect(formControlTokens.field.label.color).toBeDefined();
      expect(formControlTokens.field.label.gap).toBeDefined();
      expect(formControlTokens.field.label.requiredIndicatorColor).toBeDefined();
    });

    it("has description tokens", () => {
      expect(formControlTokens.field.description.fontSize).toBeDefined();
      expect(formControlTokens.field.description.color).toBeDefined();
      expect(formControlTokens.field.description.gap).toBeDefined();
    });

    it("has validation tokens with error AND icon references", () => {
      expect(formControlTokens.field.validation.errorColor).toBeDefined();
      expect(formControlTokens.field.validation.errorIcon).toBeDefined();
      expect(formControlTokens.field.validation.successColor).toBeDefined();
      expect(formControlTokens.field.validation.successIcon).toBeDefined();
    });

    it("has field spacing", () => {
      expect(formControlTokens.field.spacing.fieldGap).toBeDefined();
      expect(formControlTokens.field.spacing.sectionGap).toBeDefined();
    });
  });

  describe("public import", () => {
    it("formControlTokens is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.formControlTokens).toBeDefined();
    });
  });
});
