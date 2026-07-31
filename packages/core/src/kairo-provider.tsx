import { useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import type { ThemeMode, DensityMode, ThemeDefinition, ResolvedThemeMode } from "@kairoui/theme";
import { DEFAULT_PREFERENCE } from "@kairoui/theme";
import { KairoThemeContext } from "./theme-context";
import type { InternalThemeContextValue } from "./theme-context";

// ─── Types ───────────────────────────────────────────────────────────

/** Props for the KairoProvider component. */
export interface KairoProviderProps {
  readonly children: ReactNode;
  readonly theme?: ThemeDefinition;
  readonly defaultMode?: ThemeMode;
  readonly defaultDensity?: DensityMode;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const isBrowser = typeof document !== "undefined";

function resolveMode(mode: ThemeMode, systemPreference: ResolvedThemeMode): ResolvedThemeMode {
  if (mode === "light" || mode === "dark") return mode;
  return systemPreference;
}

function getSystemPreference(): ResolvedThemeMode {
  if (!isBrowser) return "light";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyToDOM(mode: ResolvedThemeMode, density: DensityMode): void {
  if (!isBrowser) return;
  document.documentElement.setAttribute("data-kui-theme", mode);
  document.documentElement.setAttribute("data-kui-density", density);
}

function cleanupDOM(): void {
  if (!isBrowser) return;
  document.documentElement.removeAttribute("data-kui-theme");
  document.documentElement.removeAttribute("data-kui-density");
}

function persistPreference(mode: ThemeMode, density: DensityMode): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem("kui-theme-preference", JSON.stringify({ version: 1, mode, density }));
  } catch {
    // Silently handle quota/security errors
  }
}

function readPersistedMode(): ThemeMode | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem("kui-theme-preference");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed["version"] !== 1) return null;
    const mode = parsed["mode"];
    if (mode === "light" || mode === "dark" || mode === "system") return mode;
    return null;
  } catch {
    return null;
  }
}

function readPersistedDensity(): DensityMode | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem("kui-theme-preference");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed["version"] !== 1) return null;
    const density = parsed["density"];
    if (density === "comfortable" || density === "standard" || density === "compact")
      return density;
    return null;
  } catch {
    return null;
  }
}

let scopeCounter = 0;

// ─── Component ───────────────────────────────────────────────────────

/** Root theme provider for KairoUI applications. */
export function KairoProvider({
  children,
  theme,
  defaultMode,
  defaultDensity,
}: KairoProviderProps): ReactNode {
  const [scopeId] = useState(() => `kairo-${String(++scopeCounter)}`);

  const initialMode = defaultMode ?? readPersistedMode() ?? DEFAULT_PREFERENCE.mode;
  const initialDensity = defaultDensity ?? readPersistedDensity() ?? DEFAULT_PREFERENCE.density;

  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [density, setDensityState] = useState<DensityMode>(initialDensity);
  const [systemPref, setSystemPref] = useState<ResolvedThemeMode>(getSystemPreference);

  const resolvedMode = resolveMode(mode, systemPref);

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      persistPreference(newMode, density);
    },
    [density],
  );

  const setDensity = useCallback(
    (newDensity: DensityMode) => {
      setDensityState(newDensity);
      persistPreference(mode, newDensity);
    },
    [mode],
  );

  // Listen for system preference changes
  useEffect(() => {
    if (!isBrowser) return;
    if (mode !== "system") return;

    let mql: MediaQueryList;
    try {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }

    const handler = (e: MediaQueryListEvent) => {
      setSystemPref(e.matches ? "dark" : "light");
    };

    mql.addEventListener("change", handler);
    return () => {
      mql.removeEventListener("change", handler);
    };
  }, [mode]);

  // Apply to DOM
  useEffect(() => {
    applyToDOM(resolvedMode, density);
    return () => {
      cleanupDOM();
    };
  }, [resolvedMode, density]);

  const contextValue = useMemo<InternalThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      density,
      themeName: theme?.name ?? "",
      isNested: false,
      definition: theme ?? null,
      scopeId,
      setMode,
      setDensity,
    }),
    [mode, resolvedMode, density, theme, scopeId, setMode, setDensity],
  );

  return <KairoThemeContext.Provider value={contextValue}>{children}</KairoThemeContext.Provider>;
}
