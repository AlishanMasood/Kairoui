import { describe, it, expect, vi } from "vitest";
import { assignRef, composeRefs } from "./ref";
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

describe("composeRefs", () => {
  it("assigns value to multiple callback refs", () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const composed = composeRefs(fn1, fn2);
    composed("value");
    expect(fn1).toHaveBeenCalledWith("value");
    expect(fn2).toHaveBeenCalledWith("value");
  });

  it("assigns value to multiple object refs", () => {
    const ref1: MutableRefObject<string | null> = { current: null };
    const ref2: MutableRefObject<string | null> = { current: null };
    const composed = composeRefs(ref1, ref2);
    composed("hello");
    expect(ref1.current).toBe("hello");
    expect(ref2.current).toBe("hello");
  });

  it("handles mix of callback and object refs", () => {
    const fn = vi.fn();
    const ref: MutableRefObject<string | null> = { current: null };
    const composed = composeRefs(fn, ref);
    composed("mixed");
    expect(fn).toHaveBeenCalledWith("mixed");
    expect(ref.current).toBe("mixed");
  });

  it("skips null and undefined refs", () => {
    const fn = vi.fn();
    const composed = composeRefs(null, fn, undefined);
    composed("ok");
    expect(fn).toHaveBeenCalledWith("ok");
  });

  it("handles all null/undefined refs without error", () => {
    const composed = composeRefs(null, undefined);
    expect(() => {
      composed("value");
    }).not.toThrow();
  });

  it("handles empty refs list", () => {
    const composed = composeRefs();
    expect(() => {
      composed("value");
    }).not.toThrow();
  });

  it("assigns in order", () => {
    const order: number[] = [];
    const fn1 = () => {
      order.push(1);
    };
    const fn2 = () => {
      order.push(2);
    };
    const fn3 = () => {
      order.push(3);
    };
    const composed = composeRefs(fn1, fn2, fn3);
    composed("x");
    expect(order).toEqual([1, 2, 3]);
  });

  it("assigns null on cleanup", () => {
    const ref1: MutableRefObject<string | null> = { current: "old" };
    const fn = vi.fn();
    const composed = composeRefs(ref1, fn);
    composed(null);
    expect(ref1.current).toBeNull();
    expect(fn).toHaveBeenCalledWith(null);
  });

  it("does not swallow errors from individual refs", () => {
    const bad = () => {
      throw new Error("ref failed");
    };
    const composed = composeRefs(bad);
    expect(() => {
      composed("value");
    }).toThrow("ref failed");
  });

  it("can be called multiple times with different values", () => {
    const ref: MutableRefObject<string | null> = { current: null };
    const composed = composeRefs(ref);
    composed("first");
    expect(ref.current).toBe("first");
    composed("second");
    expect(ref.current).toBe("second");
    composed(null);
    expect(ref.current).toBeNull();
  });
});
