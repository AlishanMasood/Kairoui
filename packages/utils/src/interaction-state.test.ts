import { describe, it, expect } from "vitest";
import { resolveInteractionState } from "./interaction-state";

describe("resolveInteractionState", () => {
  describe("default (no flags)", () => {
    it("returns no restrictions", () => {
      const result = resolveInteractionState({});
      expect(result.isInteractionBlocked).toBe(false);
      expect(result.useNativeDisabled).toBe(false);
      expect(result.useAriaDisabled).toBe(false);
      expect(result.useAriaReadOnly).toBe(false);
      expect(result.useAriaBusy).toBe(false);
      expect(result.focusability).toBe("unchanged");
      expect(result.shouldPreventEvents).toBe(false);
    });
  });

  describe("disabled", () => {
    it("blocks interaction for native controls", () => {
      const result = resolveInteractionState({ disabled: true, nativeControl: true });
      expect(result.isInteractionBlocked).toBe(true);
      expect(result.useNativeDisabled).toBe(true);
      expect(result.useAriaDisabled).toBe(false);
      expect(result.focusability).toBe("not-focusable");
      expect(result.shouldPreventEvents).toBe(false);
    });

    it("uses aria-disabled for non-native elements", () => {
      const result = resolveInteractionState({ disabled: true, nativeControl: false });
      expect(result.isInteractionBlocked).toBe(true);
      expect(result.useNativeDisabled).toBe(false);
      expect(result.useAriaDisabled).toBe(true);
      expect(result.focusability).toBe("focusable");
      expect(result.shouldPreventEvents).toBe(true);
    });

    it("disabled takes precedence over readOnly", () => {
      const result = resolveInteractionState({ disabled: true, readOnly: true });
      expect(result.isInteractionBlocked).toBe(true);
      expect(result.useAriaReadOnly).toBe(false);
    });

    it("disabled takes precedence over loading", () => {
      const result = resolveInteractionState({ disabled: true, loading: true });
      expect(result.isInteractionBlocked).toBe(true);
      expect(result.useAriaBusy).toBe(false);
    });
  });

  describe("loading", () => {
    it("blocks interaction with aria-disabled and aria-busy", () => {
      const result = resolveInteractionState({ loading: true });
      expect(result.isInteractionBlocked).toBe(true);
      expect(result.useNativeDisabled).toBe(false);
      expect(result.useAriaDisabled).toBe(true);
      expect(result.useAriaBusy).toBe(true);
      expect(result.focusability).toBe("focusable");
      expect(result.shouldPreventEvents).toBe(true);
    });

    it("loading keeps element focusable for screen readers", () => {
      const result = resolveInteractionState({ loading: true, nativeControl: true });
      expect(result.focusability).toBe("focusable");
      expect(result.useNativeDisabled).toBe(false);
    });

    it("loading takes precedence over readOnly", () => {
      const result = resolveInteractionState({ loading: true, readOnly: true });
      expect(result.isInteractionBlocked).toBe(true);
      expect(result.useAriaReadOnly).toBe(false);
      expect(result.useAriaBusy).toBe(true);
    });
  });

  describe("readOnly", () => {
    it("allows focus but sets aria-readonly", () => {
      const result = resolveInteractionState({ readOnly: true });
      expect(result.isInteractionBlocked).toBe(false);
      expect(result.useAriaReadOnly).toBe(true);
      expect(result.focusability).toBe("unchanged");
      expect(result.shouldPreventEvents).toBe(false);
    });

    it("does not use native disabled", () => {
      const result = resolveInteractionState({ readOnly: true, nativeControl: true });
      expect(result.useNativeDisabled).toBe(false);
    });
  });

  describe("precedence", () => {
    it("disabled > loading > readOnly > default", () => {
      // All three set: disabled wins
      const all = resolveInteractionState({ disabled: true, loading: true, readOnly: true });
      expect(all.useAriaBusy).toBe(false);
      expect(all.useAriaReadOnly).toBe(false);
      expect(all.isInteractionBlocked).toBe(true);

      // Loading + readOnly: loading wins
      const lr = resolveInteractionState({ loading: true, readOnly: true });
      expect(lr.useAriaBusy).toBe(true);
      expect(lr.useAriaReadOnly).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("all flags false returns default", () => {
      const result = resolveInteractionState({
        disabled: false,
        readOnly: false,
        loading: false,
      });
      expect(result.isInteractionBlocked).toBe(false);
      expect(result.focusability).toBe("unchanged");
    });

    it("nativeControl alone changes nothing", () => {
      const result = resolveInteractionState({ nativeControl: true });
      expect(result.isInteractionBlocked).toBe(false);
      expect(result.useNativeDisabled).toBe(false);
    });
  });
});
