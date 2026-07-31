import { createContext } from "react";
import type { ThemeMode, ResolvedThemeMode, DensityMode, ThemeDefinition } from "@kairoui/theme";

// ─── Public Context Value ────────────────────────────────────────────

/** The public context value exposed to consumers via hooks. */
export interface KairoThemeContextValue {
  readonly mode: ThemeMode;
  readonly resolvedMode: ResolvedThemeMode;
  readonly density: DensityMode;
  readonly themeName: string;
  readonly isNested: boolean;
  readonly setMode: (mode: ThemeMode) => void;
  readonly setDensity: (density: DensityMode) => void;
}

// ─── Internal Context Value ──────────────────────────────────────────

/** Internal context value with additional metadata not exposed to consumers. */
export interface InternalThemeContextValue extends KairoThemeContextValue {
  readonly definition: ThemeDefinition | null;
  readonly scopeId: string;
}

// ─── Sentinel ────────────────────────────────────────────────────────

const OUTSIDE_PROVIDER_MODE: ThemeMode = "system";
const OUTSIDE_PROVIDER_RESOLVED: ResolvedThemeMode = "light";
const OUTSIDE_PROVIDER_DENSITY: DensityMode = "comfortable";

function throwOutsideProvider(action: string): never {
  throw new Error(
    `KairoUI: ${action} called outside of KairoProvider. ` +
      "Wrap your application in <KairoProvider> to use theme features.",
  );
}

/** Sentinel value used when no KairoProvider wraps the consumer. */
const SENTINEL_VALUE: InternalThemeContextValue = {
  mode: OUTSIDE_PROVIDER_MODE,
  resolvedMode: OUTSIDE_PROVIDER_RESOLVED,
  density: OUTSIDE_PROVIDER_DENSITY,
  themeName: "",
  isNested: false,
  definition: null,
  scopeId: "",
  setMode: () => {
    throwOutsideProvider("setMode");
  },
  setDensity: () => {
    throwOutsideProvider("setDensity");
  },
};

// ─── Context ─────────────────────────────────────────────────────────

/**
 * Internal React context for KairoUI theming.
 * Not exported as part of the public API — consumers use hooks instead.
 */
export const KairoThemeContext = createContext<InternalThemeContextValue>(SENTINEL_VALUE);

KairoThemeContext.displayName = "KairoThemeContext";

// ─── Utilities ───────────────────────────────────────────────────────

/** Check if a context value is the sentinel (no provider above). */
export function isOutsideProvider(value: InternalThemeContextValue): boolean {
  return value === SENTINEL_VALUE;
}

/** Get the sentinel value for testing purposes. */
export function getSentinelValue(): InternalThemeContextValue {
  return SENTINEL_VALUE;
}
