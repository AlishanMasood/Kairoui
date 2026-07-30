import type { DensityMode, ThemeMode, ResolvedThemeMode, ThemePreference } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

/** Where a preference value originated. */
export type PreferenceSource = "default" | "persisted" | "runtime" | "controlled";

/** A preference with provenance tracking. */
export interface TrackedPreference {
  readonly mode: ThemeMode;
  readonly density: DensityMode;
  readonly source: PreferenceSource;
}

/** Versioned preference for storage format evolution. */
export interface VersionedPreference {
  readonly version: number;
  readonly mode: ThemeMode;
  readonly density: DensityMode;
  readonly themeName?: string;
}

/** The current storage format version. */
export const PREFERENCE_VERSION = 1 as const;

/** Default preference when no stored value or override exists. */
export const DEFAULT_PREFERENCE: Readonly<ThemePreference> = Object.freeze({
  mode: "system",
  density: "comfortable",
} as const);

// ─── Validation ──────────────────────────────────────────────────────

const VALID_MODES: ReadonlySet<string> = new Set(["light", "dark", "system"]);
const VALID_DENSITIES: ReadonlySet<string> = new Set(["comfortable", "standard", "compact"]);
const VALID_RESOLVED_MODES: ReadonlySet<string> = new Set(["light", "dark"]);

/** Validate a mode value. Returns the mode if valid, null otherwise. */
export function validateMode(value: unknown): ThemeMode | null {
  if (typeof value === "string" && VALID_MODES.has(value)) {
    return value as ThemeMode;
  }
  return null;
}

/** Validate a density value. Returns the density if valid, null otherwise. */
export function validateDensity(value: unknown): DensityMode | null {
  if (typeof value === "string" && VALID_DENSITIES.has(value)) {
    return value as DensityMode;
  }
  return null;
}

/** Validate a resolved mode value (never "system"). */
export function validateResolvedMode(value: unknown): ResolvedThemeMode | null {
  if (typeof value === "string" && VALID_RESOLVED_MODES.has(value)) {
    return value as ResolvedThemeMode;
  }
  return null;
}

/** Check if a value is a valid ThemePreference shape. */
export function isValidPreference(value: unknown): value is ThemePreference {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return validateMode(obj["mode"]) !== null && validateDensity(obj["density"]) !== null;
}

/**
 * Parse and validate a preference from untrusted input (e.g. storage).
 * Returns a valid ThemePreference or null.
 */
export function parsePreference(value: unknown): ThemePreference | null {
  if (!isValidPreference(value)) return null;
  return { mode: value.mode, density: value.density };
}

/**
 * Parse a versioned preference from storage.
 * Returns the preference if valid and version is supported.
 */
export function parseVersionedPreference(value: unknown): ThemePreference | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  if (obj["version"] !== PREFERENCE_VERSION) return null;
  const mode = validateMode(obj["mode"]);
  const density = validateDensity(obj["density"]);
  if (mode === null || density === null) return null;
  return { mode, density };
}

/**
 * Create a versioned preference object for storage serialization.
 */
export function toVersionedPreference(
  preference: ThemePreference,
  themeName?: string,
): VersionedPreference {
  return {
    version: PREFERENCE_VERSION,
    mode: preference.mode,
    density: preference.density,
    ...(themeName !== undefined ? { themeName } : {}),
  };
}

/**
 * Coerce an untrusted preference value to valid defaults.
 * Uses the provided value if valid, falls back to DEFAULT_PREFERENCE.
 */
export function coercePreference(value: unknown): ThemePreference {
  if (typeof value !== "object" || value === null) return DEFAULT_PREFERENCE;
  const obj = value as Record<string, unknown>;
  return {
    mode: validateMode(obj["mode"]) ?? DEFAULT_PREFERENCE.mode,
    density: validateDensity(obj["density"]) ?? DEFAULT_PREFERENCE.density,
  };
}
