import { describe, it, expect, vi, beforeEach } from "vitest";
import { invariant, warning, warnOnce, errorOnce } from "./assertion";

describe("invariant", () => {
  it("does not throw when condition is truthy", () => {
    expect(() => {
      invariant(true, "msg");
    }).not.toThrow();
    expect(() => {
      invariant(1, "msg");
    }).not.toThrow();
    expect(() => {
      invariant("str", "msg");
    }).not.toThrow();
    expect(() => {
      invariant({}, "msg");
    }).not.toThrow();
  });

  it("throws when condition is falsy", () => {
    expect(() => {
      invariant(false, "oops");
    }).toThrow("[KairoUI] oops");
    expect(() => {
      invariant(null, "null");
    }).toThrow("[KairoUI] null");
    expect(() => {
      invariant(undefined, "undef");
    }).toThrow("[KairoUI] undef");
    expect(() => {
      invariant(0, "zero");
    }).toThrow("[KairoUI] zero");
    expect(() => {
      invariant("", "empty");
    }).toThrow("[KairoUI] empty");
  });

  it("narrows type via assertion", () => {
    const values: (string | null)[] = ["hello"];
    const value = values[0];
    invariant(value != null, "must exist");
    // After invariant, TypeScript knows value is string
    const _len: number = value.length;
    expect(_len).toBe(5);
  });

  it("includes the message in the error", () => {
    try {
      invariant(false, "specific message");
    } catch (e) {
      expect((e as Error).message).toBe("[KairoUI] specific message");
    }
  });

  it("works with empty message", () => {
    expect(() => {
      invariant(false, "");
    }).toThrow("[KairoUI] ");
  });
});

describe("warning", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs warning when condition is falsy", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(noop);
    warning(false, "watch out");
    expect(spy).toHaveBeenCalledWith("[KairoUI] watch out");
  });

  it("does not log when condition is truthy", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(noop);
    warning(true, "should not appear");
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not throw on falsy condition", () => {
    vi.spyOn(console, "warn").mockImplementation(noop);
    expect(() => {
      warning(false, "msg");
    }).not.toThrow();
  });

  it("warns multiple times for repeated calls", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(noop);
    warning(false, "repeat");
    warning(false, "repeat");
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("warnOnce", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs warning on first call with a key", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(noop);
    warnOnce("unique-key-1", "first time");
    expect(spy).toHaveBeenCalledWith("[KairoUI] first time");
  });

  it("does not log on subsequent calls with same key", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(noop);
    warnOnce("dedup-key", "msg");
    warnOnce("dedup-key", "msg");
    warnOnce("dedup-key", "msg");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("logs for different keys independently", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(noop);
    warnOnce("key-a", "first");
    warnOnce("key-b", "second");
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("errorOnce", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs error on first call with a key", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(noop);
    errorOnce("err-key-1", "something wrong");
    expect(spy).toHaveBeenCalledWith("[KairoUI] something wrong");
  });

  it("does not log on subsequent calls with same key", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(noop);
    errorOnce("err-dedup", "msg");
    errorOnce("err-dedup", "msg");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does not throw", () => {
    vi.spyOn(console, "error").mockImplementation(noop);
    expect(() => {
      errorOnce("err-safe", "msg");
    }).not.toThrow();
  });

  it("logs for different keys independently", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(noop);
    errorOnce("err-a", "first");
    errorOnce("err-b", "second");
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

function noop() {
  // suppress console output in tests
}
