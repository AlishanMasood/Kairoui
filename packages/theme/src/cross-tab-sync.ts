import type { ThemePreference } from "./types";
import { parseVersionedPreference } from "./preference";

// ─── Types ───────────────────────────────────────────────────────────

/** Listener called when a cross-tab preference change is detected. */
export type CrossTabListener = (preference: ThemePreference) => void;

/** Options for creating cross-tab synchronization. */
export interface CrossTabSyncOptions {
  readonly key?: string;
  readonly enabled?: boolean;
}

/** Handle for managing cross-tab sync subscription. */
export interface CrossTabSync {
  readonly subscribe: (listener: CrossTabListener) => () => void;
  readonly destroy: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_STORAGE_KEY = "kui-theme-preference";

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Create a cross-tab synchronization instance.
 *
 * Listens for `storage` events on the configured key and notifies subscribers
 * when a valid preference change is detected from another tab.
 *
 * Does not access browser globals at module import — only when `create` is called.
 */
export function createCrossTabSync(options: CrossTabSyncOptions = {}): CrossTabSync {
  const key = options.key ?? DEFAULT_STORAGE_KEY;
  const enabled = options.enabled !== false;

  const listeners = new Set<CrossTabListener>();
  let lastNotifiedJson = "";
  let cleanup: (() => void) | null = null;

  if (enabled && hasStorageEvents()) {
    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;

      // Storage removal — notify with null parse (subscribers decide behavior)
      if (event.newValue === null) {
        return;
      }

      // Parse and validate
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.newValue);
      } catch {
        return;
      }

      const preference = parseVersionedPreference(parsed);
      if (preference === null) return;

      // Deduplicate: skip if same value as last notification
      const json = JSON.stringify(preference);
      if (json === lastNotifiedJson) return;
      lastNotifiedJson = json;

      // Notify all subscribers
      for (const listener of listeners) {
        listener(preference);
      }
    };

    window.addEventListener("storage", handler);
    cleanup = () => {
      window.removeEventListener("storage", handler);
    };
  }

  return {
    subscribe(listener: CrossTabListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    destroy(): void {
      cleanup?.();
      cleanup = null;
      listeners.clear();
      lastNotifiedJson = "";
    },
  };
}

// ─── Internal ────────────────────────────────────────────────────────

function hasStorageEvents(): boolean {
  try {
    return typeof window !== "undefined" && "addEventListener" in window;
  } catch {
    return false;
  }
}
