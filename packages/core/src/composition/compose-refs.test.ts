import { describe, it, expect, vi } from "vitest";
import { composeComponentRefs } from "./compose-refs";
import type { AssignableRef } from "./compose-refs";

describe("composeComponentRefs", () => {
  describe("single ref sources", () => {
    it("returns undefined when all sources are null/undefined", () => {
      expect(composeComponentRefs({})).toBeUndefined();
      expect(composeComponentRefs({ forwarded: null, internal: undefined })).toBeUndefined();
    });

    it("returns a callback for a single forwarded ref", () => {
      const ref: AssignableRef<HTMLElement> = { current: null };
      const composed = composeComponentRefs({ forwarded: ref });
      expect(composed).toBeTypeOf("function");
    });

    it("assigns to a single object ref", () => {
      const ref: { current: string | null } = { current: null };
      const composed = composeComponentRefs({ forwarded: ref });
      composed!("hello");
      expect(ref.current).toBe("hello");
    });

    it("calls a single callback ref", () => {
      const fn = vi.fn();
      const composed = composeComponentRefs({ internal: fn });
      composed!("world");
      expect(fn).toHaveBeenCalledWith("world");
    });
  });

  describe("multiple ref sources", () => {
    it("assigns to both forwarded and internal refs", () => {
      const forwarded: { current: string | null } = { current: null };
      const internal = vi.fn();
      const composed = composeComponentRefs({ forwarded, internal });
      composed!("element");
      expect(forwarded.current).toBe("element");
      expect(internal).toHaveBeenCalledWith("element");
    });

    it("assigns in order: forwarded → internal → slot → child", () => {
      const order: string[] = [];
      const forwarded = () => {
        order.push("forwarded");
      };
      const internal = () => {
        order.push("internal");
      };
      const slot = () => {
        order.push("slot");
      };
      const child = () => {
        order.push("child");
      };
      const composed = composeComponentRefs({ forwarded, internal, slot, child });
      composed!("x");
      expect(order).toEqual(["forwarded", "internal", "slot", "child"]);
    });

    it("skips null/undefined sources", () => {
      const fn = vi.fn();
      const composed = composeComponentRefs({
        forwarded: null,
        internal: fn,
        slot: undefined,
      });
      composed!("val");
      expect(fn).toHaveBeenCalledWith("val");
    });
  });

  describe("cleanup", () => {
    it("assigns null to all refs on unmount", () => {
      const forwarded: { current: string | null } = { current: null };
      const internal = vi.fn();
      const composed = composeComponentRefs({ forwarded, internal });
      composed!("element");
      composed!(null);
      expect(forwarded.current).toBeNull();
      expect(internal).toHaveBeenCalledWith(null);
    });
  });

  describe("error propagation", () => {
    it("does not swallow callback ref errors", () => {
      const bad = () => {
        throw new Error("ref error");
      };
      const composed = composeComponentRefs({ forwarded: bad });
      expect(() => {
        composed!("val");
      }).toThrow("ref error");
    });
  });

  describe("typing", () => {
    it("accepts generic element types", () => {
      const ref: { current: HTMLButtonElement | null } = { current: null };
      const composed = composeComponentRefs<HTMLButtonElement>({ forwarded: ref });
      const fakeButton = {} as HTMLButtonElement;
      composed!(fakeButton);
      expect(ref.current).toBe(fakeButton);
    });
  });
});
