import { describe, it, expect, vi } from "vitest";
import { mergeProps, mergePropsAll } from "./merge-props";

describe("mergeProps", () => {
  describe("scalar props (override)", () => {
    it("override wins for simple props", () => {
      expect(mergeProps({ id: "a" }, { id: "b" })).toEqual({ id: "b" });
    });

    it("preserves base props not in override", () => {
      expect(mergeProps({ id: "a", name: "x" }, { id: "b" })).toEqual({ id: "b", name: "x" });
    });

    it("does not erase base when override is undefined", () => {
      expect(mergeProps({ id: "a" }, { id: undefined })).toEqual({ id: "a" });
    });
  });

  describe("className (merge)", () => {
    it("concatenates class names", () => {
      expect(mergeProps({ className: "base" }, { className: "consumer" })).toEqual({
        className: "base consumer",
      });
    });

    it("handles undefined base className", () => {
      expect(mergeProps({}, { className: "consumer" })).toEqual({ className: "consumer" });
    });

    it("handles undefined override className (skipped)", () => {
      expect(mergeProps({ className: "base" }, { className: undefined })).toEqual({
        className: "base",
      });
    });
  });

  describe("style (shallow merge)", () => {
    it("merges style objects", () => {
      const result = mergeProps(
        { style: { color: "red", padding: 10 } },
        { style: { color: "blue" } },
      );
      expect(result.style).toEqual({ color: "blue", padding: 10 });
    });

    it("handles missing base style", () => {
      const result = mergeProps({}, { style: { color: "red" } });
      expect(result.style).toEqual({ color: "red" });
    });
  });

  describe("event handlers (compose)", () => {
    it("calls override handler first (consumer), then base (internal)", () => {
      const order: string[] = [];
      const base = {
        onClick: () => {
          order.push("base");
        },
      };
      const override = {
        onClick: () => {
          order.push("override");
        },
      };
      const merged = mergeProps(base, override);
      (merged.onClick as (e: { defaultPrevented: boolean }) => void)({ defaultPrevented: false });
      expect(order).toEqual(["override", "base"]);
    });

    it("skips base handler when override calls preventDefault", () => {
      const base = { onClick: vi.fn() };
      const override = {
        onClick: (e: { defaultPrevented: boolean; preventDefault: () => void }) => {
          e.preventDefault();
        },
      };
      const merged = mergeProps(base, override);
      const event = {
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      (merged.onClick as (e: typeof event) => void)(event);
      expect(base.onClick).not.toHaveBeenCalled();
    });

    it("uses override directly when base has no handler", () => {
      const fn = vi.fn();
      const merged = mergeProps({}, { onClick: fn });
      expect(merged.onClick).toBe(fn);
    });

    it("uses base directly when override is not a function", () => {
      const fn = vi.fn();
      const merged = mergeProps({ onClick: fn }, { onClick: "not-a-function" });
      expect(merged.onClick).toBe("not-a-function");
    });
  });

  describe("ref (compose)", () => {
    it("composes object and callback refs", () => {
      const objRef = { current: null as string | null };
      const callbackRef = vi.fn();
      const merged = mergeProps({ ref: objRef }, { ref: callbackRef });
      (merged.ref as (val: string | null) => void)("element");
      expect(objRef.current).toBe("element");
      expect(callbackRef).toHaveBeenCalledWith("element");
    });
  });

  describe("ARIA token-lists (reconcile)", () => {
    it("merges aria-labelledby", () => {
      const merged = mergeProps(
        { "aria-labelledby": "internal-id" },
        { "aria-labelledby": "consumer-id" },
      );
      expect(merged["aria-labelledby"]).toBe("internal-id consumer-id");
    });

    it("merges aria-describedby", () => {
      const merged = mergeProps({ "aria-describedby": "desc-1" }, { "aria-describedby": "desc-2" });
      expect(merged["aria-describedby"]).toBe("desc-1 desc-2");
    });

    it("deduplicates tokens", () => {
      const merged = mergeProps(
        { "aria-labelledby": "id-1 id-2" },
        { "aria-labelledby": "id-2 id-3" },
      );
      expect(merged["aria-labelledby"]).toBe("id-1 id-2 id-3");
    });
  });

  describe("data-* attributes (override per-key)", () => {
    it("override wins for data attributes", () => {
      const merged = mergeProps({ "data-state": "closed" }, { "data-state": "open" });
      expect(merged["data-state"]).toBe("open");
    });

    it("preserves non-conflicting data attributes", () => {
      const merged = mergeProps({ "data-x": "1" }, { "data-y": "2" });
      expect(merged["data-x"]).toBe("1");
      expect(merged["data-y"]).toBe("2");
    });
  });

  describe("mixed props", () => {
    it("handles a realistic component prop merge", () => {
      const internal = {
        className: "kui-btn",
        "aria-labelledby": "label-id",
        "data-disabled": "",
        onClick: vi.fn(),
        role: "button",
      };
      const consumer = {
        className: "my-btn",
        "aria-labelledby": "custom-label",
        id: "save-btn",
        onClick: vi.fn(),
      };
      const merged = mergeProps(internal, consumer);
      expect(merged.className).toBe("kui-btn my-btn");
      expect(merged["aria-labelledby"]).toBe("label-id custom-label");
      expect(merged["data-disabled"]).toBe("");
      expect(merged.id).toBe("save-btn");
      expect(merged.role).toBe("button");
    });
  });
});

describe("mergePropsAll", () => {
  it("merges multiple sources left to right", () => {
    const result = mergePropsAll(
      { className: "a", id: "1" },
      { className: "b" },
      { className: "c", id: "3" },
    );
    expect(result).toEqual({ className: "a b c", id: "3" });
  });

  it("returns empty object for no sources", () => {
    expect(mergePropsAll()).toEqual({});
  });

  it("returns single source directly", () => {
    const src = { id: "x" };
    expect(mergePropsAll(src)).toBe(src);
  });
});
