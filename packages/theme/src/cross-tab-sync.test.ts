/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { createCrossTabSync } from "./cross-tab-sync";
import { PREFERENCE_VERSION } from "./preference";

function fireStorageEvent(key: string, newValue: string | null) {
  const event = new StorageEvent("storage", { key, newValue });
  window.dispatchEvent(event);
}

function validJson(mode = "dark", density = "compact") {
  return JSON.stringify({ version: PREFERENCE_VERSION, mode, density });
}

describe("createCrossTabSync", () => {
  let sync: ReturnType<typeof createCrossTabSync>;

  afterEach(() => {
    sync.destroy();
  });

  describe("valid external update", () => {
    it("notifies subscriber on valid storage event", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("kui-theme-preference", validJson("dark", "compact"));

      expect(listener).toHaveBeenCalledWith({ mode: "dark", density: "compact" });
    });

    it("notifies with correct preference values", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("kui-theme-preference", validJson("light", "standard"));

      expect(listener).toHaveBeenCalledWith({ mode: "light", density: "standard" });
    });
  });

  describe("invalid update", () => {
    it("ignores invalid JSON", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("kui-theme-preference", "not-json{");

      expect(listener).not.toHaveBeenCalled();
    });

    it("ignores wrong version", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent(
        "kui-theme-preference",
        JSON.stringify({ version: 999, mode: "dark", density: "compact" }),
      );

      expect(listener).not.toHaveBeenCalled();
    });

    it("ignores invalid mode", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "auto", density: "compact" }),
      );

      expect(listener).not.toHaveBeenCalled();
    });

    it("ignores invalid density", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "dark", density: "huge" }),
      );

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("unrelated key", () => {
    it("ignores events for other keys", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("other-key", validJson());

      expect(listener).not.toHaveBeenCalled();
    });

    it("uses custom key when configured", () => {
      sync = createCrossTabSync({ key: "my-app-pref" });
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("my-app-pref", validJson("dark", "compact"));
      expect(listener).toHaveBeenCalledWith({ mode: "dark", density: "compact" });

      listener.mockClear();
      fireStorageEvent("kui-theme-preference", validJson("light", "comfortable"));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("same-value update (deduplication)", () => {
    it("does not notify twice for same value", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("kui-theme-preference", validJson("dark", "compact"));
      fireStorageEvent("kui-theme-preference", validJson("dark", "compact"));

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("notifies when value actually changes", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("kui-theme-preference", validJson("dark", "compact"));
      fireStorageEvent("kui-theme-preference", validJson("light", "comfortable"));

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe("disabled synchronization", () => {
    it("does not notify when disabled", () => {
      sync = createCrossTabSync({ enabled: false });
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("kui-theme-preference", validJson());

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("destroy stops all notifications", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      sync.destroy();
      fireStorageEvent("kui-theme-preference", validJson());

      expect(listener).not.toHaveBeenCalled();
    });

    it("unsubscribe stops individual listener", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      const unsub = sync.subscribe(listener);

      unsub();
      fireStorageEvent("kui-theme-preference", validJson());

      expect(listener).not.toHaveBeenCalled();
    });

    it("destroy is safe to call twice", () => {
      sync = createCrossTabSync();
      sync.destroy();
      expect(() => {
        sync.destroy();
      }).not.toThrow();
    });
  });

  describe("multiple subscribers", () => {
    it("notifies all subscribers", () => {
      sync = createCrossTabSync();
      const l1 = vi.fn();
      const l2 = vi.fn();
      sync.subscribe(l1);
      sync.subscribe(l2);

      fireStorageEvent("kui-theme-preference", validJson("dark", "compact"));

      expect(l1).toHaveBeenCalledWith({ mode: "dark", density: "compact" });
      expect(l2).toHaveBeenCalledWith({ mode: "dark", density: "compact" });
    });

    it("unsubscribing one does not affect others", () => {
      sync = createCrossTabSync();
      const l1 = vi.fn();
      const l2 = vi.fn();
      const unsub1 = sync.subscribe(l1);
      sync.subscribe(l2);

      unsub1();
      fireStorageEvent("kui-theme-preference", validJson());

      expect(l1).not.toHaveBeenCalled();
      expect(l2).toHaveBeenCalled();
    });
  });

  describe("storage removal", () => {
    it("does not notify on key removal (newValue null)", () => {
      sync = createCrossTabSync();
      const listener = vi.fn();
      sync.subscribe(listener);

      fireStorageEvent("kui-theme-preference", null);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe("server environment", () => {
  it("createCrossTabSync is safe without window", () => {
    // In node environment the function still creates the sync object
    // (happy-dom has window, so we test the disabled path instead)
    const sync = createCrossTabSync({ enabled: false });
    const listener = vi.fn();
    sync.subscribe(listener);
    sync.destroy();
    expect(listener).not.toHaveBeenCalled();
  });
});
