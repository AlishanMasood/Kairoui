import type { DensityMode, ResolvedThemeMode, ThemeMode, ThemePreference } from "./types";
import type { PreferenceSource } from "./preference";
import { validateMode, validateDensity, DEFAULT_PREFERENCE } from "./preference";

// ─── Types ───────────────────────────────────────────────────────────

/** Input sources for preference resolution. */
export interface ResolutionInputs {
  /** Explicit runtime value (highest priority). */
  readonly explicit?: Partial<ThemePreference>;
  /** Value from storage adapter. */
  readonly persisted?: ThemePreference | null;
  /** Application-configured defaults. */
  readonly appDefault?: Partial<ThemePreference>;
  /** Detected system color scheme (light or dark). */
  readonly systemColorScheme?: ResolvedThemeMode | null;
}

/** Resolved preference with provenance tracking. */
export interface ResolvedPreference {
  readonly mode: ThemeMode;
  readonly resolvedMode: ResolvedThemeMode;
  readonly density: DensityMode;
  readonly modeSource: PreferenceSource;
  readonly resolvedModeSource: "explicit" | "persisted" | "app_default" | "system" | "fallback";
  readonly densitySource: PreferenceSource;
  readonly warnings: readonly PreferenceResolutionWarning[];
}

/** Warning produced during resolution. */
export interface PreferenceResolutionWarning {
  readonly field: "mode" | "density";
  readonly message: string;
  readonly source: string;
}

// ─── Resolution ──────────────────────────────────────────────────────

/**
 * Resolve the final theme preference using deterministic precedence.
 *
 * Precedence (highest to lowest):
 * 1. Explicit runtime value
 * 2. Persisted preference
 * 3. Application default
 * 4. KairoUI fallback (system mode + comfortable density)
 *
 * The resolved mode is determined by:
 * - If the requested mode is "light" or "dark", that IS the resolved mode.
 * - If the requested mode is "system", the resolved mode comes from systemColorScheme.
 * - If systemColorScheme is unavailable, resolved mode falls back to "light".
 */
export function resolvePreference(inputs: ResolutionInputs): ResolvedPreference {
  const warnings: PreferenceResolutionWarning[] = [];

  // ─── Resolve Mode ──────────────────────────────────────────────

  let mode: ThemeMode;
  let modeSource: PreferenceSource;

  if (inputs.explicit?.mode !== undefined) {
    const validated = validateMode(inputs.explicit.mode);
    if (validated !== null) {
      mode = validated;
      modeSource = "controlled";
    } else {
      warnings.push({
        field: "mode",
        message: `Invalid explicit mode "${inputs.explicit.mode}" — falling through.`,
        source: "explicit",
      });
      mode = resolveModeFallback(inputs, warnings);
      modeSource = getModeFallbackSource(inputs);
    }
  } else if (inputs.persisted?.mode !== undefined) {
    const validated = validateMode(inputs.persisted.mode);
    if (validated !== null) {
      mode = validated;
      modeSource = "persisted";
    } else {
      warnings.push({
        field: "mode",
        message: `Invalid persisted mode "${inputs.persisted.mode}" — falling through.`,
        source: "persisted",
      });
      mode = resolveModeFallback(inputs, warnings, true);
      modeSource = getModeFallbackSource(inputs, true);
    }
  } else if (inputs.appDefault?.mode !== undefined) {
    const validated = validateMode(inputs.appDefault.mode);
    if (validated !== null) {
      mode = validated;
      modeSource = "default";
    } else {
      warnings.push({
        field: "mode",
        message: `Invalid app default mode "${inputs.appDefault.mode}" — using fallback.`,
        source: "appDefault",
      });
      mode = DEFAULT_PREFERENCE.mode;
      modeSource = "default";
    }
  } else {
    mode = DEFAULT_PREFERENCE.mode;
    modeSource = "default";
  }

  // ─── Resolve Density ───────────────────────────────────────────

  let density: DensityMode;
  let densitySource: PreferenceSource;

  if (inputs.explicit?.density !== undefined) {
    const validated = validateDensity(inputs.explicit.density);
    if (validated !== null) {
      density = validated;
      densitySource = "controlled";
    } else {
      warnings.push({
        field: "density",
        message: `Invalid explicit density "${inputs.explicit.density}" — falling through.`,
        source: "explicit",
      });
      density = resolveDensityFallback(inputs, warnings);
      densitySource = getDensityFallbackSource(inputs);
    }
  } else if (inputs.persisted?.density !== undefined) {
    const validated = validateDensity(inputs.persisted.density);
    if (validated !== null) {
      density = validated;
      densitySource = "persisted";
    } else {
      warnings.push({
        field: "density",
        message: `Invalid persisted density "${inputs.persisted.density}" — falling through.`,
        source: "persisted",
      });
      density = resolveDensityFallback(inputs, warnings, true);
      densitySource = getDensityFallbackSource(inputs, true);
    }
  } else if (inputs.appDefault?.density !== undefined) {
    const validated = validateDensity(inputs.appDefault.density);
    if (validated !== null) {
      density = validated;
      densitySource = "default";
    } else {
      warnings.push({
        field: "density",
        message: `Invalid app default density "${inputs.appDefault.density}" — using fallback.`,
        source: "appDefault",
      });
      density = DEFAULT_PREFERENCE.density;
      densitySource = "default";
    }
  } else {
    density = DEFAULT_PREFERENCE.density;
    densitySource = "default";
  }

  // ─── Determine Resolved Mode ───────────────────────────────────

  let resolvedMode: ResolvedThemeMode;
  let resolvedModeSource: ResolvedPreference["resolvedModeSource"];

  if (mode === "light" || mode === "dark") {
    resolvedMode = mode;
    resolvedModeSource =
      modeSource === "controlled"
        ? "explicit"
        : modeSource === "persisted"
          ? "persisted"
          : "app_default";
  } else {
    // mode === "system"
    if (inputs.systemColorScheme === "light" || inputs.systemColorScheme === "dark") {
      resolvedMode = inputs.systemColorScheme;
      resolvedModeSource = "system";
    } else {
      resolvedMode = "light";
      resolvedModeSource = "fallback";
    }
  }

  return {
    mode,
    resolvedMode,
    density,
    modeSource,
    resolvedModeSource,
    densitySource,
    warnings,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function resolveModeFallback(
  inputs: ResolutionInputs,
  _warnings: PreferenceResolutionWarning[],
  skipPersisted = false,
): ThemeMode {
  if (!skipPersisted && inputs.persisted?.mode !== undefined) {
    const v = validateMode(inputs.persisted.mode);
    if (v !== null) return v;
  }
  if (inputs.appDefault?.mode !== undefined) {
    const v = validateMode(inputs.appDefault.mode);
    if (v !== null) return v;
  }
  return DEFAULT_PREFERENCE.mode;
}

function getModeFallbackSource(inputs: ResolutionInputs, skipPersisted = false): PreferenceSource {
  if (!skipPersisted && inputs.persisted?.mode !== undefined) {
    if (validateMode(inputs.persisted.mode) !== null) return "persisted";
  }
  if (inputs.appDefault?.mode !== undefined) {
    if (validateMode(inputs.appDefault.mode) !== null) return "default";
  }
  return "default";
}

function resolveDensityFallback(
  inputs: ResolutionInputs,
  _warnings: PreferenceResolutionWarning[],
  skipPersisted = false,
): DensityMode {
  if (!skipPersisted && inputs.persisted?.density !== undefined) {
    const v = validateDensity(inputs.persisted.density);
    if (v !== null) return v;
  }
  if (inputs.appDefault?.density !== undefined) {
    const v = validateDensity(inputs.appDefault.density);
    if (v !== null) return v;
  }
  return DEFAULT_PREFERENCE.density;
}

function getDensityFallbackSource(
  inputs: ResolutionInputs,
  skipPersisted = false,
): PreferenceSource {
  if (!skipPersisted && inputs.persisted?.density !== undefined) {
    if (validateDensity(inputs.persisted.density) !== null) return "persisted";
  }
  if (inputs.appDefault?.density !== undefined) {
    if (validateDensity(inputs.appDefault.density) !== null) return "default";
  }
  return "default";
}
