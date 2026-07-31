import { useState, useCallback, useEffect, useMemo, type ReactNode, type RefObject } from "react";
import type { ThemeMode, DensityMode, ThemeDefinition, ResolvedThemeMode } from "@kairoui/theme";
import { DEFAULT_PREFERENCE } from "@kairoui/theme";
import { KairoThemeContext } from "./theme-context";
import type { InternalThemeContextValue } from "./theme-context";

// ─── Types ───────────────────────────────────────────────────────────

/** Accepted target types for theme application. */
export type ThemeTarget = HTMLElement | RefObject<HTMLElement | null> | null;

/** Server-provided initial state for hydration safety. */
export interface ServerState {
  readonly mode?: ThemeMode;
  readonly resolvedMode?: ResolvedThemeMode;
  readonly density?: DensityMode;
}

/** Props for the KairoProvider component. */
export interface KairoProviderProps {
  readonly children: ReactNode;
  readonly theme?: ThemeDefinition;
  readonly target?: ThemeTarget;
  readonly serverState?: ServerState;
  // Uncontrolled
  readonly defaultMode?: ThemeMode;
  readonly defaultDensity?: DensityMode;
  // Controlled mode
  readonly mode?: ThemeMode;
  readonly onModeChange?: (mode: ThemeMode) => void;
  // Controlled density
  readonly density?: DensityMode;
  readonly onDensityChange?: (density: DensityMode) => void;
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

function applyToElement(
  el: HTMLElement | null | undefined,
  mode: ResolvedThemeMode,
  density: DensityMode,
): void {
  if (!el) return;
  el.setAttribute("data-kui-theme", mode);
  el.setAttribute("data-kui-density", density);
}

function cleanupElement(el: HTMLElement | null | undefined): void {
  if (!el) return;
  el.removeAttribute("data-kui-theme");
  el.removeAttribute("data-kui-density");
}

function resolveTarget(target: ThemeTarget | undefined): HTMLElement | null {
  if (target === null || target === undefined) {
    return isBrowser ? document.documentElement : null;
  }
  if ("current" in target) {
    return target.current;
  }
  return target;
}

// Read the current DOM attributes set by the no-flash script
function readDomMode(): ResolvedThemeMode | null {
  if (!isBrowser) return null;
  const val = document.documentElement.getAttribute("data-kui-theme");
  if (val === "light" || val === "dark") return val;
  return null;
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
  target,
  serverState,
  defaultMode,
  defaultDensity,
  mode: controlledMode,
  onModeChange,
  density: controlledDensity,
  onDensityChange,
}: KairoProviderProps): ReactNode {
  const [scopeId] = useState(() => `kairo-${String(++scopeCounter)}`);

  const isModeControlled = controlledMode !== undefined;
  const isDensityControlled = controlledDensity !== undefined;

  // Warn about conflicting props (runs in effect to avoid ref-during-render)
  useEffect(() => {
    if (isModeControlled && defaultMode !== undefined) {
      console.warn(
        "KairoUI: KairoProvider received both `mode` and `defaultMode`. " +
          "A controlled component should not have `defaultMode`. Use one or the other.",
      );
    }
    if (isDensityControlled && defaultDensity !== undefined) {
      console.warn(
        "KairoUI: KairoProvider received both `density` and `defaultDensity`. " +
          "A controlled component should not have `defaultDensity`. Use one or the other.",
      );
    }
    // Only warn on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydration-safe initialization:
  // 1. controlled props (highest priority)
  // 2. DOM attributes (set by no-flash script, matches current visual)
  // 3. serverState prop (from SSR serialization)
  // 4. defaultMode/defaultDensity props
  // 5. persisted preference (localStorage)
  // 6. KairoUI defaults
  const initialMode =
    defaultMode ?? readPersistedMode() ?? serverState?.mode ?? DEFAULT_PREFERENCE.mode;
  const initialDensity =
    defaultDensity ?? readPersistedDensity() ?? serverState?.density ?? DEFAULT_PREFERENCE.density;

  // For system preference: use DOM attribute if set (hydration), then server state, then detect
  const initialSystemPref: ResolvedThemeMode =
    readDomMode() ?? serverState?.resolvedMode ?? getSystemPreference();

  const [internalMode, setInternalMode] = useState<ThemeMode>(initialMode);
  const [internalDensity, setInternalDensity] = useState<DensityMode>(initialDensity);
  const [systemPref, setSystemPref] = useState<ResolvedThemeMode>(initialSystemPref);

  // Effective values
  const effectiveMode = isModeControlled ? controlledMode : internalMode;
  const effectiveDensity = isDensityControlled ? controlledDensity : internalDensity;
  const resolvedMode = resolveMode(effectiveMode, systemPref);

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      if (isModeControlled) {
        onModeChange?.(newMode);
      } else {
        setInternalMode(newMode);
        persistPreference(newMode, effectiveDensity);
      }
    },
    [isModeControlled, onModeChange, effectiveDensity],
  );

  const setDensity = useCallback(
    (newDensity: DensityMode) => {
      if (isDensityControlled) {
        onDensityChange?.(newDensity);
      } else {
        setInternalDensity(newDensity);
        persistPreference(effectiveMode, newDensity);
      }
    },
    [isDensityControlled, onDensityChange, effectiveMode],
  );

  // Listen for system preference changes
  useEffect(() => {
    if (!isBrowser) return;
    if (effectiveMode !== "system") return;

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
  }, [effectiveMode]);

  // Apply to DOM target
  useEffect(() => {
    const el = resolveTarget(target);
    applyToElement(el, resolvedMode, effectiveDensity);
    return () => {
      cleanupElement(el);
    };
  }, [resolvedMode, effectiveDensity, target]);

  const contextValue = useMemo<InternalThemeContextValue>(
    () => ({
      mode: effectiveMode,
      resolvedMode,
      density: effectiveDensity,
      themeName: theme?.name ?? "",
      isNested: false,
      definition: theme ?? null,
      scopeId,
      setMode,
      setDensity,
    }),
    [effectiveMode, resolvedMode, effectiveDensity, theme, scopeId, setMode, setDensity],
  );

  return <KairoThemeContext.Provider value={contextValue}>{children}</KairoThemeContext.Provider>;
}
