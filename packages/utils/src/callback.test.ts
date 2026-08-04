import { describe, it, expect, vi } from "vitest";
import { createStableCallback } from "./callback";

describe("createStableCallback", () => {
  it("call invokes the initial function", () => {
    const fn = vi.fn().mockReturnValue(42);
    const stable = createStableCallback(fn);
    const result = stable.call();
    expect(fn).toHaveBeenCalled();
    expect(result).toBe(42);
  });

  it("call passes arguments through", () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const stable = createStableCallback(fn);
    expect(stable.call(3, 4)).toBe(7);
    expect(fn).toHaveBeenCalledWith(3, 4);
  });

  it("call invokes the latest function after update", () => {
    const first = vi.fn().mockReturnValue("first");
    const second = vi.fn().mockReturnValue("second");
    const stable = createStableCallback(first);

    expect(stable.call()).toBe("first");

    stable.update(second);
    expect(stable.call()).toBe("second");
    expect(second).toHaveBeenCalled();
  });

  it("call reference identity is stable across updates", () => {
    const stable = createStableCallback(() => {});
    const ref1 = stable.call;
    stable.update(() => {});
    const ref2 = stable.call;
    expect(ref1).toBe(ref2);
  });

  it("preserves return type", () => {
    const stable = createStableCallback((x: string) => x.length);
    expect(stable.call("hello")).toBe(5);

    stable.update((x: string) => x.length * 2);
    expect(stable.call("hi")).toBe(4);
  });

  it("does not swallow errors", () => {
    const stable = createStableCallback(() => {
      throw new Error("boom");
    });
    expect(() => stable.call()).toThrow("boom");
  });

  it("propagates errors from updated callback", () => {
    const stable = createStableCallback(() => "ok");
    stable.update(() => {
      throw new Error("updated boom");
    });
    expect(() => stable.call()).toThrow("updated boom");
  });

  it("handles void callbacks", () => {
    const fn = vi.fn();
    const stable = createStableCallback(fn);
    stable.call();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles multiple arguments", () => {
    const fn = vi.fn((a: string, b: number, c: boolean) => `${a}-${String(b)}-${String(c)}`);
    const stable = createStableCallback(fn);
    expect(stable.call("x", 1, true)).toBe("x-1-true");
  });

  it("update can be called multiple times", () => {
    const stable = createStableCallback(() => 1);
    stable.update(() => 2);
    stable.update(() => 3);
    stable.update(() => 4);
    expect(stable.call()).toBe(4);
  });
});
