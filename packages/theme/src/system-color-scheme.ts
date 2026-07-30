import type { ResolvedThemeMode } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

/** Listener called when the system color scheme changes. */
export type ColorSchemeListener = (mode: ResolvedThemeMode) => void;

/** Subscription handle returned by subscribe(). */
export interface ColorSchemeSubscription {
  readonly unsubscribe: () => void;
}

/** Injectable matchMedia interface for testing. */
export interface MatchMediaProvider {
  (query: string): {
    readonly matches: boolean;
    addEventListener?(type: string, listener: (e: { matches: boolean }) => void): void;
    removeEventListener?(type: string, listener: (e: { matches: boolean }) => void): void;
    addListener?(listener: (e: { matches: boolean }) => void): void;
    removeListener?(listener: (e: { matches: boolean }) => void): void;
  };
}

/** Options for creating a color-scheme detector. */
export interface ColorSchemeDetectorOptions {
  readonly matchMedia?: MatchMediaProvider;
  readonly fallback?: ResolvedThemeMode;
}

// ─── Constants ───────────────────────────────────────────────────────

const DARK_QUERY = "(prefers-color-scheme: dark)";
const DEFAULT_FALLBACK: ResolvedThemeMode = "light";

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Read the current system color scheme once.
 * Returns the fallback if matchMedia is unavailable.
 */
export function getSystemColorScheme(options: ColorSchemeDetectorOptions = {}): ResolvedThemeMode {
  const provider = options.matchMedia ?? getGlobalMatchMedia();
  const fallback = options.fallback ?? DEFAULT_FALLBACK;

  if (!provider) return fallback;

  try {
    const mql = provider(DARK_QUERY);
    return mql.matches ? "dark" : "light";
  } catch {
    return fallback;
  }
}

/**
 * Check if system color-scheme detection is available.
 */
export function isColorSchemeSupported(options: ColorSchemeDetectorOptions = {}): boolean {
  const provider = options.matchMedia ?? getGlobalMatchMedia();
  if (!provider) return false;
  try {
    provider(DARK_QUERY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Subscribe to system color-scheme changes.
 * Returns an unsubscribe handle. Safe to call when matchMedia is unavailable
 * (the listener simply won't fire).
 */
export function subscribeToColorScheme(
  listener: ColorSchemeListener,
  options: ColorSchemeDetectorOptions = {},
): ColorSchemeSubscription {
  const provider = options.matchMedia ?? getGlobalMatchMedia();

  if (!provider) {
    return { unsubscribe: () => {} };
  }

  let mql: ReturnType<MatchMediaProvider>;
  try {
    mql = provider(DARK_QUERY);
  } catch {
    return { unsubscribe: () => {} };
  }

  const handler = (e: { matches: boolean }) => {
    listener(e.matches ? "dark" : "light");
  };

  // Prefer modern API, fall back to legacy addListener/removeListener
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", handler);
    return {
      unsubscribe: () => {
        mql.removeEventListener?.("change", handler);
      },
    };
  } else if (typeof mql.addListener === "function") {
    mql.addListener(handler);
    return {
      unsubscribe: () => {
        mql.removeListener?.(handler);
      },
    };
  }

  return { unsubscribe: () => {} };
}

// ─── Internal ────────────────────────────────────────────────────────

function getGlobalMatchMedia(): MatchMediaProvider | null {
  if (typeof globalThis !== "undefined" && "matchMedia" in globalThis) {
    return (globalThis as unknown as { matchMedia: MatchMediaProvider }).matchMedia;
  }
  return null;
}
