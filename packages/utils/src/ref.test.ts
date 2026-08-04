import { describe, it, expect, vi } from "vitest";
import { assignRef } from "./ref";
import type { MutableRefObject } from "./ref";

describe("assignRef", () => {
  describe("callback refs", () => {
    it("calls callback ref with the value", () => {
      const fn = vi.fn();
      assignRef(fn, "hello");
      expect(fn).toHaveBeenCalledWith("hello");
    });

    it("calls callback ref with null", () => {
      const fn = vi.fn();
      assignRef(fn, null);
      expect(fn).toHaveBeenCalledWith(null);
    });

    it("calls callback ref with an element-like object", () => {
      const fn = vi.fn();
      const el = { tagName: "DIV" };
      assignRef(fn, el);
      expect(fn).toHaveBeenCalledWith(el);
    });

    it("does not swallow callback errors", () => {
      const fn = () => {
        throw new Error("ref error");
      };
      expect(() => {
        assignRef(fn, "value");
      }).toThrow("ref error");
    });

    it("supports cleanup-capable callback refs (return value ignored)", () => {
      const cleanup = vi.fn();
      const fn = vi.fn().mockReturnValue(cleanup);
      assignRef(fn, "value");
      expect(fn).toHaveBeenCalledWith("value");
      // The cleanup return is handled by React, not by assignRef
    });
  });

  describe("object refs", () => {
    it("sets .current on mutable ref object", () => {
      const ref: MutableRefObject<string | null> = { current: null };
      assignRef(ref, "world");
      expect(ref.current).toBe("world");
    });

    it("sets .current to null", () => {
      const ref: MutableRefObject<string | null> = { current: "old" };
      assignRef(ref, null);
      expect(ref.current).toBeNull();
    });

    it("overwrites previous .current value", () => {
      const ref: MutableRefObject<number | null> = { current: 1 };
      assignRef(ref, 2);
      expect(ref.current).toBe(2);
      assignRef(ref, 3);
      expect(ref.current).toBe(3);
    });
  });

  describe("null/undefined refs", () => {
    it("does nothing for null ref", () => {
      expect(() => {
        assignRef(null, "value");
      }).not.toThrow();
    });

    it("does nothing for undefined ref", () => {
      expect(() => {
        assignRef(undefined, "value");
      }).not.toThrow();
    });
  });

  describe("typing", () => {
    it("accepts generic types", () => {
      const ref: MutableRefObject<HTMLElement | null> = { current: null };
      const el = { tagName: "DIV" } as unknown as HTMLElement;
      assignRef(ref, el);
      expect(ref.current).toBe(el);
    });
  });
});
