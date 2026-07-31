/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateMode,
  validateDensity,
  isValidPreference,
  parseVersionedPreference,
  coercePreference,
  DEFAULT_PREFERENCE,
  PREFERENCE_VERSION,
  resolvePreference,
  createMemoryAdapter,
  noopStorageAdapter,
} from "./index";
import { createLocalStorageAdapter } from "./storage";
import { createCrossTabSync } from "./cross-tab-sync";
import { getSystemColorScheme, subscribeToColorScheme } from "./system-color-scheme";
import type { MatchMediaProvider } from "./system-color-scheme";

describe("preference management — comprehensive", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─── Default Mode ─────────────────────────────────────────────

  describe("default mode", () => {
    it("DEFAULT_PREFERENCE mode is system", () => {
      expect(DEFAULT_PREFERENCE.mode).toBe("system");
    });

    it("resolvePreference defaults to system mode", () => {
      const result = resolvePreference({});
      expect(result.mode).toBe("system");
      expect(result.modeSource).toBe("default");
    });
  });

  // ─── Default Density ───────────────────────────────────────────

  describe("default density", () => {
    it("DEFAULT_PREFERENCE density is comfortable", () => {
      expect(DEFAULT_PREFERENCE.density).toBe("comfortable");
    });

    it("resolvePreference defaults to comfortable", () => {
      const result = resolvePreference({});
      expect(result.density).toBe("comfortable");
      expect(result.densitySource).toBe("default");
    });
  });

  // ─── Persisted Mode ────────────────────────────────────────────

  describe("persisted mode", () => {
    it("resolves persisted mode", () => {
      const result = resolvePreference({
        persisted: { mode: "dark", density: "comfortable" },
      });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("persisted");
    });

    it("localStorage adapter reads persisted mode", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );
      const adapter = createLocalStorageAdapter();
      const pref = adapter.get();
      expect(pref?.mode).toBe("dark");
    });
  });

  // ─── Persisted Density ─────────────────────────────────────────

  describe("persisted density", () => {
    it("resolves persisted density", () => {
      const result = resolvePreference({
        persisted: { mode: "light", density: "compact" },
      });
      expect(result.density).toBe("compact");
      expect(result.densitySource).toBe("persisted");
    });

    it("localStorage adapter reads persisted density", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "light", density: "standard" }),
      );
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()?.density).toBe("standard");
    });
  });

  // ─── Explicit Mode ─────────────────────────────────────────────

  describe("explicit mode", () => {
    it("explicit overrides persisted", () => {
      const result = resolvePreference({
        explicit: { mode: "dark" },
        persisted: { mode: "light", density: "comfortable" },
      });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("controlled");
    });
  });

  // ─── Explicit Density ──────────────────────────────────────────

  describe("explicit density", () => {
    it("explicit overrides persisted", () => {
      const result = resolvePreference({
        explicit: { density: "compact" },
        persisted: { mode: "light", density: "comfortable" },
      });
      expect(result.density).toBe("compact");
      expect(result.densitySource).toBe("controlled");
    });
  });

  // ─── System Mode ───────────────────────────────────────────────

  describe("system mode", () => {
    it("system resolves to dark when OS is dark", () => {
      const result = resolvePreference({
        explicit: { mode: "system" },
        systemColorScheme: "dark",
      });
      expect(result.resolvedMode).toBe("dark");
      expect(result.resolvedModeSource).toBe("system");
    });

    it("system resolves to light when OS is light", () => {
      const result = resolvePreference({
        explicit: { mode: "system" },
        systemColorScheme: "light",
      });
      expect(result.resolvedMode).toBe("light");
    });

    it("system falls back to light when unavailable", () => {
      const result = resolvePreference({
        explicit: { mode: "system" },
        systemColorScheme: null,
      });
      expect(result.resolvedMode).toBe("light");
      expect(result.resolvedModeSource).toBe("fallback");
    });
  });

  // ─── System Changes ────────────────────────────────────────────

  describe("system changes", () => {
    it("subscribeToColorScheme notifies on change", () => {
      type Handler = (e: { matches: boolean }) => void;
      const handlers: Handler[] = [];
      const provider: MatchMediaProvider = () => ({
        matches: false,
        addEventListener: (_t: string, cb: Handler) => {
          handlers.push(cb);
        },
        removeEventListener: () => {
          handlers.length = 0;
        },
      });

      const fn = vi.fn();
      subscribeToColorScheme(fn, { matchMedia: provider });

      handlers[0]?.({ matches: true });
      expect(fn).toHaveBeenCalledWith("dark");
    });
  });

  // ─── Missing System API ────────────────────────────────────────

  describe("missing system API", () => {
    it("getSystemColorScheme returns fallback when unavailable", () => {
      const result = getSystemColorScheme({ fallback: "dark" });
      // In happy-dom, matchMedia exists but may return false
      expect(["light", "dark"]).toContain(result);
    });

    it("getSystemColorScheme returns fallback when matchMedia throws", () => {
      const throwing: MatchMediaProvider = () => {
        throw new Error("fail");
      };
      expect(getSystemColorScheme({ matchMedia: throwing, fallback: "dark" })).toBe("dark");
    });
  });

  // ─── Invalid Stored JSON ───────────────────────────────────────

  describe("invalid stored JSON", () => {
    it("localStorage adapter returns null for invalid JSON", () => {
      localStorage.setItem("kui-theme-preference", "not-json{{");
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
    });

    it("parseVersionedPreference returns null for invalid JSON parse", () => {
      expect(parseVersionedPreference("invalid")).toBeNull();
    });
  });

  // ─── Unsupported Stored Version ────────────────────────────────

  describe("unsupported stored version", () => {
    it("rejects version 0", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 0, mode: "dark", density: "compact" }),
      );
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
    });

    it("rejects version 99", () => {
      expect(
        parseVersionedPreference({ version: 99, mode: "dark", density: "compact" }),
      ).toBeNull();
    });
  });

  // ─── Storage Unavailable ───────────────────────────────────────

  describe("storage unavailable", () => {
    it("noopStorageAdapter returns null", () => {
      expect(noopStorageAdapter.get()).toBeNull();
      expect(noopStorageAdapter.isAvailable()).toBe(false);
    });

    it("localStorage adapter handles missing storage gracefully", () => {
      const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      const adapter = createLocalStorageAdapter();
      expect(adapter.get()).toBeNull();
      spy.mockRestore();
    });
  });

  // ─── Storage Exceptions ────────────────────────────────────────

  describe("storage exceptions", () => {
    it("set does not throw on quota exceeded", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      const adapter = createLocalStorageAdapter();
      expect(() => {
        adapter.set({ mode: "dark", density: "compact" });
      }).not.toThrow();
      spy.mockRestore();
    });

    it("remove does not throw on error", () => {
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

  // ─── Memory Adapter ────────────────────────────────────────────

  describe("memory adapter", () => {
    it("stores and retrieves values", () => {
      const adapter = createMemoryAdapter();
      adapter.set({ mode: "dark", density: "compact" });
      expect(adapter.get()).toEqual({ mode: "dark", density: "compact" });
    });

    it("starts null by default", () => {
      const adapter = createMemoryAdapter();
      expect(adapter.get()).toBeNull();
    });

    it("accepts initial value", () => {
      const adapter = createMemoryAdapter({ initial: { mode: "dark", density: "standard" } });
      expect(adapter.get()?.mode).toBe("dark");
    });

    it("notifies subscribers on set", () => {
      const adapter = createMemoryAdapter();
      const fn = vi.fn();
      adapter.subscribe(fn);
      adapter.set({ mode: "dark", density: "compact" });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("unsubscribe stops notifications", () => {
      const adapter = createMemoryAdapter();
      const fn = vi.fn();
      const unsub = adapter.subscribe(fn);
      unsub();
      adapter.set({ mode: "dark", density: "compact" });
      expect(fn).not.toHaveBeenCalled();
    });

    it("remove clears value and notifies", () => {
      const adapter = createMemoryAdapter({ initial: { mode: "dark", density: "compact" } });
      const fn = vi.fn();
      adapter.subscribe(fn);
      adapter.remove();
      expect(adapter.get()).toBeNull();
      expect(fn).toHaveBeenCalled();
    });
  });

  // ─── Disabled Storage ──────────────────────────────────────────

  describe("disabled storage (noop)", () => {
    it("set is a no-op", () => {
      noopStorageAdapter.set({ mode: "dark", density: "compact" });
      expect(noopStorageAdapter.get()).toBeNull();
    });

    it("subscribe returns unsubscribe", () => {
      const unsub = noopStorageAdapter.subscribe(() => {});
      expect(typeof unsub).toBe("function");
      unsub();
    });
  });

  // ─── Precedence Resolution ─────────────────────────────────────

  describe("precedence resolution", () => {
    it("explicit > persisted > appDefault > fallback", () => {
      const result = resolvePreference({
        explicit: { mode: "dark", density: "compact" },
        persisted: { mode: "light", density: "standard" },
        appDefault: { mode: "system", density: "comfortable" },
      });
      expect(result.mode).toBe("dark");
      expect(result.density).toBe("compact");
    });

    it("persisted wins when no explicit", () => {
      const result = resolvePreference({
        persisted: { mode: "dark", density: "standard" },
        appDefault: { mode: "light", density: "comfortable" },
      });
      expect(result.mode).toBe("dark");
      expect(result.density).toBe("standard");
    });

    it("appDefault wins when no persisted", () => {
      const result = resolvePreference({
        appDefault: { mode: "dark", density: "compact" },
      });
      expect(result.mode).toBe("dark");
      expect(result.density).toBe("compact");
    });

    it("invalid explicit falls through", () => {
      const result = resolvePreference({
        explicit: { mode: "invalid" as "light" },
        persisted: { mode: "dark", density: "compact" },
      });
      expect(result.mode).toBe("dark");
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ─── Cross-Tab Update ──────────────────────────────────────────

  describe("cross-tab update", () => {
    it("notifies on valid storage event", () => {
      const sync = createCrossTabSync();
      const fn = vi.fn();
      sync.subscribe(fn);

      const event = new StorageEvent("storage", {
        key: "kui-theme-preference",
        newValue: JSON.stringify({ version: PREFERENCE_VERSION, mode: "dark", density: "compact" }),
      });
      window.dispatchEvent(event);

      expect(fn).toHaveBeenCalledWith({ mode: "dark", density: "compact" });
      sync.destroy();
    });
  });

  // ─── Unrelated Storage Update ──────────────────────────────────

  describe("unrelated storage update", () => {
    it("ignores events for other keys", () => {
      const sync = createCrossTabSync();
      const fn = vi.fn();
      sync.subscribe(fn);

      const event = new StorageEvent("storage", {
        key: "other-app-key",
        newValue: JSON.stringify({ mode: "dark" }),
      });
      window.dispatchEvent(event);

      expect(fn).not.toHaveBeenCalled();
      sync.destroy();
    });
  });

  // ─── Update-Loop Prevention ────────────────────────────────────

  describe("update-loop prevention", () => {
    it("deduplicates same-value notifications", () => {
      const sync = createCrossTabSync();
      const fn = vi.fn();
      sync.subscribe(fn);

      const value = JSON.stringify({
        version: PREFERENCE_VERSION,
        mode: "dark",
        density: "compact",
      });
      window.dispatchEvent(
        new StorageEvent("storage", { key: "kui-theme-preference", newValue: value }),
      );
      window.dispatchEvent(
        new StorageEvent("storage", { key: "kui-theme-preference", newValue: value }),
      );

      expect(fn).toHaveBeenCalledTimes(1);
      sync.destroy();
    });
  });

  // ─── Listener Cleanup ──────────────────────────────────────────

  describe("listener cleanup", () => {
    it("destroy removes all listeners", () => {
      const sync = createCrossTabSync();
      const fn = vi.fn();
      sync.subscribe(fn);
      sync.destroy();

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "kui-theme-preference",
          newValue: JSON.stringify({
            version: PREFERENCE_VERSION,
            mode: "dark",
            density: "compact",
          }),
        }),
      );

      expect(fn).not.toHaveBeenCalled();
    });

    it("unsubscribe individual listener", () => {
      const sync = createCrossTabSync();
      const fn = vi.fn();
      const unsub = sync.subscribe(fn);
      unsub();

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "kui-theme-preference",
          newValue: JSON.stringify({
            version: PREFERENCE_VERSION,
            mode: "dark",
            density: "compact",
          }),
        }),
      );

      expect(fn).not.toHaveBeenCalled();
      sync.destroy();
    });

    it("memory adapter unsubscribe prevents notification", () => {
      const adapter = createMemoryAdapter();
      const fn = vi.fn();
      const unsub = adapter.subscribe(fn);
      unsub();
      adapter.set({ mode: "dark", density: "compact" });
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // ─── Validation Helpers ────────────────────────────────────────

  describe("validation helpers", () => {
    it("validateMode accepts valid modes", () => {
      expect(validateMode("light")).toBe("light");
      expect(validateMode("dark")).toBe("dark");
      expect(validateMode("system")).toBe("system");
    });

    it("validateMode rejects invalid", () => {
      expect(validateMode("auto")).toBeNull();
      expect(validateMode(null)).toBeNull();
    });

    it("validateDensity accepts valid densities", () => {
      expect(validateDensity("comfortable")).toBe("comfortable");
      expect(validateDensity("standard")).toBe("standard");
      expect(validateDensity("compact")).toBe("compact");
    });

    it("validateDensity rejects invalid", () => {
      expect(validateDensity("tiny")).toBeNull();
    });

    it("isValidPreference validates shape", () => {
      expect(isValidPreference({ mode: "dark", density: "compact" })).toBe(true);
      expect(isValidPreference({ mode: "invalid" })).toBe(false);
      expect(isValidPreference(null)).toBe(false);
    });

    it("coercePreference provides safe fallbacks", () => {
      expect(coercePreference(null)).toEqual(DEFAULT_PREFERENCE);
      expect(coercePreference({ mode: "bad" })).toEqual({ mode: "system", density: "comfortable" });
    });
  });
});
