import { describe, it, expect } from "vitest";
import { reconcileInteractionState } from "./reconcile-interaction";

describe("reconcileInteractionState", () => {
  describe("default (no flags)", () => {
    it("returns no attributes and no suppression", () => {
      const result = reconcileInteractionState({});
      expect(result.shouldSuppressEvents).toBe(false);
      expect(result.disabled).toBeUndefined();
      expect(result["aria-disabled"]).toBeUndefined();
      expect(result["data-disabled"]).toBeUndefined();
    });
  });

  describe("disabled — native control", () => {
    it("uses native disabled for button", () => {
      const result = reconcileInteractionState({ disabled: true, elementType: "button" });
      expect(result.disabled).toBe(true);
      expect(result["aria-disabled"]).toBeUndefined();
      expect(result["data-disabled"]).toBe("");
      expect(result.shouldSuppressEvents).toBe(false);
    });

    it("uses native disabled for input", () => {
      const result = reconcileInteractionState({ disabled: true, elementType: "input" });
      expect(result.disabled).toBe(true);
    });

    it("uses native disabled for select", () => {
      const result = reconcileInteractionState({ disabled: true, elementType: "select" });
      expect(result.disabled).toBe(true);
    });

    it("uses native disabled for textarea", () => {
      const result = reconcileInteractionState({ disabled: true, elementType: "textarea" });
      expect(result.disabled).toBe(true);
    });

    it("uses native disabled for fieldset", () => {
      const result = reconcileInteractionState({ disabled: true, elementType: "fieldset" });
      expect(result.disabled).toBe(true);
    });
  });

  describe("disabled — non-native element", () => {
    it("uses aria-disabled for div", () => {
      const result = reconcileInteractionState({ disabled: true, elementType: "div" });
      expect(result.disabled).toBeUndefined();
      expect(result["aria-disabled"]).toBe("true");
      expect(result["data-disabled"]).toBe("");
      expect(result.shouldSuppressEvents).toBe(true);
    });

    it("uses aria-disabled when elementType is undefined", () => {
      const result = reconcileInteractionState({ disabled: true });
      expect(result["aria-disabled"]).toBe("true");
      expect(result.shouldSuppressEvents).toBe(true);
    });

    it("uses aria-disabled for span", () => {
      const result = reconcileInteractionState({ disabled: true, elementType: "span" });
      expect(result["aria-disabled"]).toBe("true");
    });
  });

  describe("loading", () => {
    it("sets aria-disabled and aria-busy", () => {
      const result = reconcileInteractionState({ loading: true });
      expect(result["aria-disabled"]).toBe("true");
      expect(result["aria-busy"]).toBe("true");
      expect(result["data-loading"]).toBe("");
      expect(result.shouldSuppressEvents).toBe(true);
    });

    it("does not use native disabled (keeps focusable)", () => {
      const result = reconcileInteractionState({ loading: true, elementType: "button" });
      expect(result.disabled).toBeUndefined();
      expect(result["aria-disabled"]).toBe("true");
      expect(result["aria-busy"]).toBe("true");
    });
  });

  describe("readOnly — native control", () => {
    it("uses native readOnly for input", () => {
      const result = reconcileInteractionState({ readOnly: true, elementType: "input" });
      expect(result.readOnly).toBe(true);
      expect(result["aria-readonly"]).toBeUndefined();
      expect(result["data-readonly"]).toBe("");
      expect(result.shouldSuppressEvents).toBe(false);
    });

    it("uses native readOnly for textarea", () => {
      const result = reconcileInteractionState({ readOnly: true, elementType: "textarea" });
      expect(result.readOnly).toBe(true);
    });
  });

  describe("readOnly — non-native element", () => {
    it("uses aria-readonly for div", () => {
      const result = reconcileInteractionState({ readOnly: true, elementType: "div" });
      expect(result.readOnly).toBeUndefined();
      expect(result["aria-readonly"]).toBe("true");
      expect(result["data-readonly"]).toBe("");
    });

    it("uses aria-readonly for button (not native readonly)", () => {
      const result = reconcileInteractionState({ readOnly: true, elementType: "button" });
      expect(result["aria-readonly"]).toBe("true");
    });
  });

  describe("precedence", () => {
    it("disabled wins over loading", () => {
      const result = reconcileInteractionState({ disabled: true, loading: true });
      expect(result["data-disabled"]).toBe("");
      expect(result["data-loading"]).toBeUndefined();
      expect(result["aria-busy"]).toBeUndefined();
    });

    it("disabled wins over readOnly", () => {
      const result = reconcileInteractionState({ disabled: true, readOnly: true });
      expect(result["data-disabled"]).toBe("");
      expect(result["data-readonly"]).toBeUndefined();
    });

    it("loading wins over readOnly", () => {
      const result = reconcileInteractionState({ loading: true, readOnly: true });
      expect(result["data-loading"]).toBe("");
      expect(result["data-readonly"]).toBeUndefined();
    });
  });

  describe("all flags false", () => {
    it("returns clean result", () => {
      const result = reconcileInteractionState({
        disabled: false,
        readOnly: false,
        loading: false,
      });
      expect(result.shouldSuppressEvents).toBe(false);
      expect(result.disabled).toBeUndefined();
      expect(result["aria-disabled"]).toBeUndefined();
    });
  });
});
