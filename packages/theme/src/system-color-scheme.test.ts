import { describe, it, expect, vi } from "vitest";
import {
  getSystemColorScheme,
  isColorSchemeSupported,
  subscribeToColorScheme,
} from "./system-color-scheme";
import type { MatchMediaProvider } from "./system-color-scheme";

function createMockMatchMedia(isDark: boolean): {
  provider: MatchMediaProvider;
  trigger: (dark: boolean) => void;
} {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  const provider: MatchMediaProvider = () => ({
    matches: isDark,
    addEventListener(_type: string, listener: (e: { matches: boolean }) => void) {
      listeners.push(listener);
    },
    removeEventListener(_type: string, listener: (e: { matches: boolean }) => void) {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    },
  });
  return {
    provider,
    trigger: (dark: boolean) => {
      for (const l of [...listeners]) {
        l({ matches: dark });
      }
    },
  };
}

function createLegacyMockMatchMedia(isDark: boolean): {
  provider: MatchMediaProvider;
  trigger: (dark: boolean) => void;
} {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  const provider: MatchMediaProvider = () => ({
    matches: isDark,
    addListener(listener: (e: { matches: boolean }) => void) {
      listeners.push(listener);
    },
    removeListener(listener: (e: { matches: boolean }) => void) {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    },
  });
  return {
    provider,
    trigger: (dark: boolean) => {
      for (const l of [...listeners]) {
        l({ matches: dark });
      }
    },
  };
}

describe("getSystemColorScheme", () => {
  it("returns light when system is light", () => {
    const { provider } = createMockMatchMedia(false);
    expect(getSystemColorScheme({ matchMedia: provider })).toBe("light");
  });

  it("returns dark when system is dark", () => {
    const { provider } = createMockMatchMedia(true);
    expect(getSystemColorScheme({ matchMedia: provider })).toBe("dark");
  });

  it("returns fallback when matchMedia is unavailable", () => {
    expect(getSystemColorScheme({ fallback: "light" })).toBe("light");
  });

  it("uses custom fallback", () => {
    expect(getSystemColorScheme({ fallback: "dark" })).toBe("dark");
  });

  it("defaults to light fallback", () => {
    expect(getSystemColorScheme({})).toBe("light");
  });

  it("returns fallback when matchMedia throws", () => {
    const throwing: MatchMediaProvider = () => {
      throw new Error("Not supported");
    };
    expect(getSystemColorScheme({ matchMedia: throwing, fallback: "dark" })).toBe("dark");
  });
});

describe("isColorSchemeSupported", () => {
  it("returns true when matchMedia is available", () => {
    const { provider } = createMockMatchMedia(false);
    expect(isColorSchemeSupported({ matchMedia: provider })).toBe(true);
  });

  it("returns false when matchMedia is unavailable", () => {
    expect(isColorSchemeSupported({})).toBe(false);
  });

  it("returns false when matchMedia throws", () => {
    const throwing: MatchMediaProvider = () => {
      throw new Error("Not supported");
    };
    expect(isColorSchemeSupported({ matchMedia: throwing })).toBe(false);
  });
});

describe("subscribeToColorScheme", () => {
  it("calls listener on change to dark", () => {
    const { provider, trigger } = createMockMatchMedia(false);
    const listener = vi.fn();

    subscribeToColorScheme(listener, { matchMedia: provider });
    trigger(true);

    expect(listener).toHaveBeenCalledWith("dark");
  });

  it("calls listener on change to light", () => {
    const { provider, trigger } = createMockMatchMedia(true);
    const listener = vi.fn();

    subscribeToColorScheme(listener, { matchMedia: provider });
    trigger(false);

    expect(listener).toHaveBeenCalledWith("light");
  });

  it("does not call listener before change", () => {
    const { provider } = createMockMatchMedia(false);
    const listener = vi.fn();

    subscribeToColorScheme(listener, { matchMedia: provider });

    expect(listener).not.toHaveBeenCalled();
  });

  it("unsubscribe stops notifications", () => {
    const { provider, trigger } = createMockMatchMedia(false);
    const listener = vi.fn();

    const sub = subscribeToColorScheme(listener, { matchMedia: provider });
    sub.unsubscribe();
    trigger(true);

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple subscribers", () => {
    const { provider, trigger } = createMockMatchMedia(false);
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    subscribeToColorScheme(listener1, { matchMedia: provider });
    subscribeToColorScheme(listener2, { matchMedia: provider });
    trigger(true);

    expect(listener1).toHaveBeenCalledWith("dark");
    expect(listener2).toHaveBeenCalledWith("dark");
  });

  it("unsubscribing one does not affect others", () => {
    const { provider, trigger } = createMockMatchMedia(false);
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const sub1 = subscribeToColorScheme(listener1, { matchMedia: provider });
    subscribeToColorScheme(listener2, { matchMedia: provider });
    sub1.unsubscribe();
    trigger(true);

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledWith("dark");
  });

  it("returns noop subscription when matchMedia unavailable", () => {
    const listener = vi.fn();
    const sub = subscribeToColorScheme(listener, {});

    expect(sub.unsubscribe).toBeDefined();
    sub.unsubscribe(); // should not throw
  });

  it("returns noop subscription when matchMedia throws", () => {
    const throwing: MatchMediaProvider = () => {
      throw new Error("fail");
    };
    const listener = vi.fn();
    const sub = subscribeToColorScheme(listener, { matchMedia: throwing });

    expect(sub.unsubscribe).toBeDefined();
  });

  it("works with legacy addListener API", () => {
    const { provider, trigger } = createLegacyMockMatchMedia(false);
    const listener = vi.fn();

    subscribeToColorScheme(listener, { matchMedia: provider });
    trigger(true);

    expect(listener).toHaveBeenCalledWith("dark");
  });

  it("unsubscribe works with legacy API", () => {
    const { provider, trigger } = createLegacyMockMatchMedia(false);
    const listener = vi.fn();

    const sub = subscribeToColorScheme(listener, { matchMedia: provider });
    sub.unsubscribe();
    trigger(true);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("server environment", () => {
  it("getSystemColorScheme works without globals", () => {
    expect(getSystemColorScheme({})).toBe("light");
  });

  it("subscribeToColorScheme returns noop without globals", () => {
    const listener = vi.fn();
    const sub = subscribeToColorScheme(listener, {});
    sub.unsubscribe();
    expect(listener).not.toHaveBeenCalled();
  });

  it("isColorSchemeSupported returns false without globals", () => {
    expect(isColorSchemeSupported({})).toBe(false);
  });
});
