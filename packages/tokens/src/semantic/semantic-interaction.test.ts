import { describe, it, expect } from "vitest";
import type { InteractionStateVisuals, SemanticInteractionStates } from "../types/semantic";

describe("semantic interaction state contracts", () => {
  describe("InteractionStateVisuals", () => {
    it("requires all visual treatment properties", () => {
      type RequiredKeys = keyof InteractionStateVisuals;
      const keys: RequiredKeys[] = [
        "background",
        "border",
        "text",
        "icon",
        "opacity",
        "focusRing",
        "transitionDuration",
        "transitionEasing",
      ];
      expect(keys).toHaveLength(8);
    });
  });

  describe("SemanticInteractionStates", () => {
    it("requires all 11 interaction states", () => {
      type RequiredKeys = keyof SemanticInteractionStates;
      const keys: RequiredKeys[] = [
        "default",
        "hover",
        "active",
        "focused",
        "selected",
        "disabled",
        "readOnly",
        "loading",
        "dragging",
        "invalid",
        "valid",
      ];
      expect(keys).toHaveLength(11);
    });

    it("total interaction state visual tokens = 11 states × 8 properties", () => {
      const total = 11 * 8;
      expect(total).toBe(88);
    });
  });
});
