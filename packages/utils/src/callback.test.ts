import { describe, it, expect, vi } from "vitest";
import { createStableCallback, createEventCallback } from "./callback";

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

describe("createEventCallback", () => {
  it("invoke calls the initial function", () => {
    const fn = vi.fn().mockReturnValue(10);
    const ec = createEventCallback(fn);
    expect(ec.invoke()).toBe(10);
    expect(fn).toHaveBeenCalled();
  });

  it("invoke passes arguments through", () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const ec = createEventCallback(fn);
    expect(ec.invoke(2, 3)).toBe(5);
  });

  it("invoke returns undefined when no callback is set", () => {
    const ec = createEventCallback<() => number>();
    expect(ec.invoke()).toBeUndefined();
  });

  it("invoke returns undefined after clearing with update(undefined)", () => {
    const fn = vi.fn().mockReturnValue(1);
    const ec = createEventCallback(fn);
    ec.update(undefined);
    expect(ec.invoke()).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });

  it("invoke calls the latest function after update", () => {
    const first = vi.fn().mockReturnValue("a");
    const second = vi.fn().mockReturnValue("b");
    const ec = createEventCallback(first);
    expect(ec.invoke()).toBe("a");
    ec.update(second);
    expect(ec.invoke()).toBe("b");
  });

  it("invoke is a no-op when disabled", () => {
    const fn = vi.fn().mockReturnValue(99);
    const ec = createEventCallback(fn);
    ec.setDisabled(true);
    expect(ec.invoke()).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });

  it("invoke resumes after re-enabling", () => {
    const fn = vi.fn().mockReturnValue(42);
    const ec = createEventCallback(fn);
    ec.setDisabled(true);
    ec.setDisabled(false);
    expect(ec.invoke()).toBe(42);
  });

  it("disabled property reflects state", () => {
    const ec = createEventCallback(() => {});
    expect(ec.disabled).toBe(false);
    ec.setDisabled(true);
    expect(ec.disabled).toBe(true);
    ec.setDisabled(false);
    expect(ec.disabled).toBe(false);
  });

  it("invoke reference is stable across updates", () => {
    const ec = createEventCallback(() => 1);
    const ref1 = ec.invoke;
    ec.update(() => 2);
    const ref2 = ec.invoke;
    expect(ref1).toBe(ref2);
  });

  it("does not swallow errors", () => {
    const ec = createEventCallback(() => {
      throw new Error("event error");
    });
    expect(() => {
      ec.invoke();
    }).toThrow("event error");
  });

  it("errors not thrown when disabled", () => {
    const ec = createEventCallback(() => {
      throw new Error("should not throw");
    });
    ec.setDisabled(true);
    expect(() => {
      ec.invoke();
    }).not.toThrow();
  });
});
