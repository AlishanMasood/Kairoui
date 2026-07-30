/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLocalStorageAdapter, createMemoryAdapter, noopStorageAdapter } from "./storage";
import { PREFERENCE_VERSION } from "./preference";

describe("createLocalStorageAdapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("get", () => {
    it("returns null when nothing stored", () => {
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
    });

    it("reads a valid stored preference", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "dark", density: "compact" }),
      );
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toEqual({ mode: "dark", density: "compact" });
    });

    it("returns null for invalid JSON", () => {
      localStorage.setItem("kui-theme-preference", "not-json");
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
    });

    it("returns null for wrong version", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 999, mode: "dark", density: "compact" }),
      );
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
    });

    it("returns null for partial values", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "dark" }),
      );
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
    });

    it("returns null for invalid mode", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "auto", density: "compact" }),
      );
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
    });
  });

  describe("set", () => {
    it("persists a preference", () => {
      const adapter = createLocalStorageAdapter();
      adapter.set({ mode: "dark", density: "compact" });

      const raw = localStorage.getItem("kui-theme-preference");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as Record<string, unknown>;
      expect(parsed["version"]).toBe(PREFERENCE_VERSION);
      expect(parsed["mode"]).toBe("dark");
      expect(parsed["density"]).toBe("compact");
    });

    it("overwrites existing value", () => {
      const adapter = createLocalStorageAdapter();
      adapter.set({ mode: "light", density: "comfortable" });
      adapter.set({ mode: "dark", density: "compact" });
      expect(adapter.get()).toEqual({ mode: "dark", density: "compact" });
    });
  });

  describe("remove", () => {
    it("removes the stored preference", () => {
      const adapter = createLocalStorageAdapter();
      adapter.set({ mode: "dark", density: "compact" });
      adapter.remove();
      expect(adapter.get()).toBeNull();
      expect(localStorage.getItem("kui-theme-preference")).toBeNull();
    });

    it("is safe when nothing stored", () => {
      const adapter = createLocalStorageAdapter();
      expect(() => {
        adapter.remove();
      }).not.toThrow();
    });
  });

  describe("custom storage key", () => {
    it("uses custom key", () => {
      const adapter = createLocalStorageAdapter({ key: "my-app-theme" });
      adapter.set({ mode: "dark", density: "standard" });
      expect(localStorage.getItem("my-app-theme")).not.toBeNull();
      expect(localStorage.getItem("kui-theme-preference")).toBeNull();
    });

    it("reads from custom key", () => {
      localStorage.setItem(
        "my-app-theme",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "light", density: "standard" }),
      );
      const adapter = createLocalStorageAdapter({ key: "my-app-theme" });
      expect(adapter.get()).toEqual({ mode: "light", density: "standard" });
    });
  });

  describe("isAvailable", () => {
    it("returns true when localStorage works", () => {
      const adapter = createLocalStorageAdapter();
      expect(adapter.isAvailable()).toBe(true);
    });
  });

  describe("storage unavailable", () => {
    it("get returns null when localStorage throws", () => {
      const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
      spy.mockRestore();
    });

    it("set does not throw when localStorage throws", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      const adapter = createLocalStorageAdapter();
      expect(() => {
        adapter.set({ mode: "dark", density: "compact" });
      }).not.toThrow();
      spy.mockRestore();
    });

    it("remove does not throw when localStorage throws", () => {
      const spy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      const adapter = createLocalStorageAdapter();
      expect(() => {
        adapter.remove();
      }).not.toThrow();
      spy.mockRestore();
    });
  });

  describe("subscribe", () => {
    it("returns an unsubscribe function", () => {
      const adapter = createLocalStorageAdapter();
      const unsub = adapter.subscribe(() => {});
      expect(typeof unsub).toBe("function");
      unsub(); // should not throw
    });
  });
});

describe("createMemoryAdapter", () => {
  it("returns null initially by default", () => {
    const adapter = createMemoryAdapter();
    expect(adapter.get()).toBeNull();
  });

  it("accepts initial value", () => {
    const adapter = createMemoryAdapter({ initial: { mode: "dark", density: "compact" } });
    expect(adapter.get()).toEqual({ mode: "dark", density: "compact" });
  });

  it("stores values", () => {
    const adapter = createMemoryAdapter();
    adapter.set({ mode: "light", density: "standard" });
    expect(adapter.get()).toEqual({ mode: "light", density: "standard" });
  });

  it("overwrites values", () => {
    const adapter = createMemoryAdapter();
    adapter.set({ mode: "light", density: "comfortable" });
    adapter.set({ mode: "dark", density: "compact" });
    expect(adapter.get()).toEqual({ mode: "dark", density: "compact" });
  });

  it("removes values", () => {
    const adapter = createMemoryAdapter({ initial: { mode: "dark", density: "compact" } });
    adapter.remove();
    expect(adapter.get()).toBeNull();
  });

  it("isAvailable returns true", () => {
    expect(createMemoryAdapter().isAvailable()).toBe(true);
  });

  describe("subscribe", () => {
    it("notifies on set", () => {
      const adapter = createMemoryAdapter();
      const listener = vi.fn();
      adapter.subscribe(listener);
      adapter.set({ mode: "dark", density: "compact" });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("notifies on remove", () => {
      const adapter = createMemoryAdapter({ initial: { mode: "dark", density: "compact" } });
      const listener = vi.fn();
      adapter.subscribe(listener);
      adapter.remove();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("unsubscribe stops notifications", () => {
      const adapter = createMemoryAdapter();
      const listener = vi.fn();
      const unsub = adapter.subscribe(listener);
      unsub();
      adapter.set({ mode: "dark", density: "compact" });
      expect(listener).not.toHaveBeenCalled();
    });

    it("supports multiple subscribers", () => {
      const adapter = createMemoryAdapter();
      const l1 = vi.fn();
      const l2 = vi.fn();
      adapter.subscribe(l1);
      adapter.subscribe(l2);
      adapter.set({ mode: "dark", density: "compact" });
      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledTimes(1);
    });
  });
});

describe("noopStorageAdapter", () => {
  it("get returns null", () => {
    expect(noopStorageAdapter.get()).toBeNull();
  });

  it("set does nothing", () => {
    noopStorageAdapter.set({ mode: "dark", density: "compact" });
    expect(noopStorageAdapter.get()).toBeNull();
  });

  it("remove does nothing", () => {
    expect(() => {
      noopStorageAdapter.remove();
    }).not.toThrow();
  });

  it("isAvailable returns false", () => {
    expect(noopStorageAdapter.isAvailable()).toBe(false);
  });

  it("subscribe returns unsubscribe", () => {
    const unsub = noopStorageAdapter.subscribe(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });
});
