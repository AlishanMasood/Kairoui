import type { ThemePreference } from "./types";
import { parseVersionedPreference, toVersionedPreference } from "./preference";

// ─── Types ───────────────────────────────────────────────────────────

/** Extended storage adapter with availability detection and error reporting. */
export interface ThemeStorageAdapter {
  /** Read the persisted preference. Returns null if not stored or invalid. */
  get(): ThemePreference | null;
  /** Persist a preference. */
  set(preference: ThemePreference): void;
  /** Remove the persisted preference. */
  remove(): void;
  /** Check if storage is available. */
  isAvailable(): boolean;
  /** Subscribe to external changes (e.g. other tabs). Returns unsubscribe. */
  subscribe(listener: () => void): () => void;
}

/** Options for the localStorage adapter. */
export interface LocalStorageAdapterOptions {
  readonly key?: string;
}

/** Options for the memory adapter. */
export interface MemoryAdapterOptions {
  readonly initial?: ThemePreference;
}

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_STORAGE_KEY = "kui-theme-preference";

// ─── localStorage Adapter ────────────────────────────────────────────

/**
 * Create a localStorage-based storage adapter.
 * Safe when localStorage is unavailable (returns null on read, no-ops on write).
 */
export function createLocalStorageAdapter(
  options: LocalStorageAdapterOptions = {},
): ThemeStorageAdapter {
  const key = options.key ?? DEFAULT_STORAGE_KEY;

  function getStorage(): Storage | null {
    try {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        return (globalThis as unknown as { localStorage: Storage }).localStorage;
      }
    } catch {
      // Security exception (e.g. Safari private mode in some contexts)
    }
    return null;
  }

  return {
    get(): ThemePreference | null {
      const storage = getStorage();
      if (!storage) return null;

      try {
        const raw = storage.getItem(key);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        return parseVersionedPreference(parsed);
      } catch {
        // Invalid JSON or parse error — treat as missing
        return null;
      }
    },

    set(preference: ThemePreference): void {
      const storage = getStorage();
      if (!storage) return;

      try {
        const versioned = toVersionedPreference(preference);
        storage.setItem(key, JSON.stringify(versioned));
      } catch {
        // Quota exceeded or security error — silently fail
      }
    },

    remove(): void {
      const storage = getStorage();
      if (!storage) return;

      try {
        storage.removeItem(key);
      } catch {
        // Security error — silently fail
      }
    },

    isAvailable(): boolean {
      const storage = getStorage();
      if (!storage) return false;
      try {
        const testKey = `${key}__test`;
        storage.setItem(testKey, "1");
        storage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    },

    subscribe(_listener: () => void): () => void {
      // Cross-tab sync deferred to a later task
      return () => {};
    },
  };
}

// ─── Memory Adapter ──────────────────────────────────────────────────

/** Create an in-memory storage adapter for testing. */
export function createMemoryAdapter(options: MemoryAdapterOptions = {}): ThemeStorageAdapter {
  let stored: ThemePreference | null = options.initial ?? null;
  const listeners = new Set<() => void>();

  return {
    get(): ThemePreference | null {
      return stored;
    },

    set(preference: ThemePreference): void {
      stored = { mode: preference.mode, density: preference.density };
      for (const listener of listeners) {
        listener();
      }
    },

    remove(): void {
      stored = null;
      for (const listener of listeners) {
        listener();
      }
    },

    isAvailable(): boolean {
      return true;
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ─── Noop Adapter ────────────────────────────────────────────────────

/** A no-op adapter that stores nothing. Suitable for SSR or disabled persistence. */
export const noopStorageAdapter: ThemeStorageAdapter = {
  get() {
    return null;
  },
  set() {},
  remove() {},
  isAvailable() {
    return false;
  },
  subscribe() {
    return () => {};
  },
};
