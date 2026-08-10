import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  warnInvalidPolymorphicTarget,
  warnAsChildConflict,
  warnAsChildInvalidChildren,
  warnInternalSlotReplacement,
  warnInvalidSlotReplacement,
  warnUnknownSlot,
  warnMissingRequiredSlot,
  warnProtectedPropConflict,
  warnSlotRefNotForwarded,
  isValidElementType,
} from "./diagnostics";

describe("composition diagnostics", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.restoreAllMocks();
  });

  // ─── warnInvalidPolymorphicTarget ───────────────────────────────

  describe("warnInvalidPolymorphicTarget", () => {
    it("does not warn for valid string element", () => {
      warnInvalidPolymorphicTarget("Button", "button");
      warnInvalidPolymorphicTarget("Box", "div");
      warnInvalidPolymorphicTarget("Link", "a");
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("does not warn for function component", () => {
      const Comp = () => null;
      warnInvalidPolymorphicTarget("Button", Comp);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("does not warn for forwardRef/memo objects", () => {
      const fakeForwardRef = { $$typeof: Symbol.for("react.forward_ref") };
      warnInvalidPolymorphicTarget("Button", fakeForwardRef);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("warns for null", () => {
      warnInvalidPolymorphicTarget("Button", null);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid `as` prop"));
    });

    it("warns for number", () => {
      warnInvalidPolymorphicTarget("Button", 42);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("received number"));
    });

    it("warns for empty string", () => {
      warnInvalidPolymorphicTarget("Button", "");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid `as` prop"));
    });

    it("warns for undefined", () => {
      warnInvalidPolymorphicTarget("Button", undefined);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("received undefined"));
    });
  });

  // ─── warnAsChildConflict ────────────────────────────────────────

  describe("warnAsChildConflict", () => {
    it("warns about as + asChild conflict", () => {
      warnAsChildConflict("Trigger_a");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Both `as` and `asChild` were provided"),
      );
    });

    it("deduplicates per component name", () => {
      warnAsChildConflict("Trigger_b");
      warnAsChildConflict("Trigger_b");
      warnAsChildConflict("Trigger_b");
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("warns separately for different components", () => {
      warnAsChildConflict("Trigger_c");
      warnAsChildConflict("Button_c");
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ─── warnAsChildInvalidChildren ─────────────────────────────────

  describe("warnAsChildInvalidChildren", () => {
    it("warns for zero children", () => {
      warnAsChildInvalidChildren("Dialog.Trigger", 0, "undefined");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("received 0 children"));
    });

    it("warns for multiple children", () => {
      warnAsChildInvalidChildren("Dialog.Trigger", 3, "element");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("received 3 children"));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("first element will be used"));
    });

    it("warns for non-element child type", () => {
      warnAsChildInvalidChildren("Dialog.Trigger", 1, "string");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("received string"));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("default element instead"));
    });

    it("does not warn for valid single element", () => {
      warnAsChildInvalidChildren("Dialog.Trigger", 1, "element");
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  // ─── warnInternalSlotReplacement ────────────────────────────────

  describe("warnInternalSlotReplacement", () => {
    it("warns with slot name", () => {
      warnInternalSlotReplacement("Button", "_positioner");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("_positioner"));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("internal"));
    });
  });

  // ─── warnInvalidSlotReplacement ─────────────────────────────────

  describe("warnInvalidSlotReplacement", () => {
    it("warns with slot name and received type", () => {
      warnInvalidSlotReplacement("Button", "root", 42);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('slot "root"'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("received number"));
    });
  });

  // ─── warnUnknownSlot ────────────────────────────────────────────

  describe("warnUnknownSlot", () => {
    it("warns with available slots", () => {
      warnUnknownSlot("Button", "header", ["root", "icon", "content"]);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown slot "header"'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("root, icon, content"));
    });
  });

  // ─── warnMissingRequiredSlot ────────────────────────────────────

  describe("warnMissingRequiredSlot", () => {
    it("warns with slot name and consequence", () => {
      warnMissingRequiredSlot("Button", "content");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Required slot "content"'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("appear broken"));
    });
  });

  // ─── warnProtectedPropConflict ──────────────────────────────────

  describe("warnProtectedPropConflict", () => {
    it("warns with prop name and both values", () => {
      warnProtectedPropConflict("Dialog_a", "role", "dialog", "alert");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"role=alert"'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"dialog"'));
    });

    it("deduplicates per component + prop", () => {
      warnProtectedPropConflict("Dialog_b", "role", "dialog", "alert");
      warnProtectedPropConflict("Dialog_b", "role", "dialog", "alert");
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("warns separately for different props", () => {
      warnProtectedPropConflict("Dialog_c", "role", "dialog", "alert");
      warnProtectedPropConflict("Dialog_c", "aria-modal", "true", "false");
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ─── warnSlotRefNotForwarded ────────────────────────────────────

  describe("warnSlotRefNotForwarded", () => {
    it("warns with slot and component names", () => {
      warnSlotRefNotForwarded("Button_a", "root", "CustomButton");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Slot "root"'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("CustomButton"));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("React.forwardRef()"));
    });

    it("deduplicates per component + slot", () => {
      warnSlotRefNotForwarded("Button_b", "root", "CustomButton");
      warnSlotRefNotForwarded("Button_b", "root", "CustomButton");
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─── isValidElementType ─────────────────────────────────────────

  describe("isValidElementType", () => {
    it("accepts valid intrinsic elements", () => {
      expect(isValidElementType("div")).toBe(true);
      expect(isValidElementType("button")).toBe(true);
      expect(isValidElementType("a")).toBe(true);
    });

    it("accepts function components", () => {
      expect(isValidElementType(() => null)).toBe(true);
    });

    it("accepts forwardRef objects", () => {
      expect(isValidElementType({ $$typeof: Symbol.for("react.forward_ref") })).toBe(true);
    });

    it("rejects null", () => {
      expect(isValidElementType(null)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidElementType(undefined)).toBe(false);
    });

    it("rejects numbers", () => {
      expect(isValidElementType(42)).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidElementType("")).toBe(false);
    });

    it("rejects plain objects without $$typeof", () => {
      expect(isValidElementType({})).toBe(false);
    });
  });

  // ─── Valid usage produces no warnings ───────────────────────────

  describe("valid usage: no warnings", () => {
    it("valid polymorphic targets produce no warnings", () => {
      warnInvalidPolymorphicTarget("Box", "div");
      warnInvalidPolymorphicTarget("Box", "section");
      warnInvalidPolymorphicTarget("Box", () => null);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("valid single-element asChild produces no warnings", () => {
      warnAsChildInvalidChildren("Trigger", 1, "element");
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
