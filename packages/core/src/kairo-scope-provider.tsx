import {
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { ThemeMode, DensityMode, ThemeDefinition, ResolvedThemeMode } from "@kairoui/theme";
import { KairoThemeContext } from "./theme-context";
import type { InternalThemeContextValue } from "./theme-context";

// ─── Types ───────────────────────────────────────────────────────────

/** Props for the KairoScopeProvider component. */
export interface KairoScopeProviderProps {
  readonly children: ReactNode;
  readonly theme?: ThemeDefinition;
  readonly mode?: ThemeMode;
  readonly defaultMode?: ThemeMode;
  readonly onModeChange?: (mode: ThemeMode) => void;
  readonly density?: DensityMode;
  readonly defaultDensity?: DensityMode;
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

let scopeCounter = 0;

// ─── Component ───────────────────────────────────────────────────────

/**
 * Scoped theme provider for local theme/density overrides.
 *
 * Renders a `<div>` with `data-kui-theme` and `data-kui-density` attributes
 * so CSS custom properties cascade within the scope. Does not apply to
 * document.documentElement. Does not persist preferences.
 */
export function KairoScopeProvider({
  children,
  theme,
  mode: controlledMode,
  defaultMode,
  onModeChange,
  density: controlledDensity,
  defaultDensity,
  onDensityChange,
}: KairoScopeProviderProps): ReactNode {
  const parent = useContext(KairoThemeContext);
  const [scopeId] = useState(() => `kairo-scope-${String(++scopeCounter)}`);
  const scopeRef = useRef<HTMLDivElement>(null);

  const isModeControlled = controlledMode !== undefined;
  const isDensityControlled = controlledDensity !== undefined;

  // Inherit from parent or use provided defaults
  const initialMode = defaultMode ?? parent.mode;
  const initialDensity = defaultDensity ?? parent.density;

  const [internalMode, setInternalMode] = useState<ThemeMode>(initialMode);
  const [internalDensity, setInternalDensity] = useState<DensityMode>(initialDensity);
  const [systemPref, setSystemPref] = useState<ResolvedThemeMode>(getSystemPreference);

  const effectiveMode = isModeControlled ? controlledMode : internalMode;
  const effectiveDensity = isDensityControlled ? controlledDensity : internalDensity;
  const resolvedMode = resolveMode(effectiveMode, systemPref);

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      if (isModeControlled) {
        onModeChange?.(newMode);
      } else {
        setInternalMode(newMode);
      }
    },
    [isModeControlled, onModeChange],
  );

  const setDensity = useCallback(
    (newDensity: DensityMode) => {
      if (isDensityControlled) {
        onDensityChange?.(newDensity);
      } else {
        setInternalDensity(newDensity);
      }
    },
    [isDensityControlled, onDensityChange],
  );

  // Listen for system preference changes when in system mode
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

  const contextValue = useMemo<InternalThemeContextValue>(
    () => ({
      mode: effectiveMode,
      resolvedMode,
      density: effectiveDensity,
      themeName: theme?.name ?? parent.themeName,
      isNested: true,
      definition: theme ?? parent.definition,
      scopeId,
      setMode,
      setDensity,
    }),
    [
      effectiveMode,
      resolvedMode,
      effectiveDensity,
      theme,
      parent.themeName,
      parent.definition,
      scopeId,
      setMode,
      setDensity,
    ],
  );

  return (
    <KairoThemeContext.Provider value={contextValue}>
      <div
        ref={scopeRef}
        data-kui-theme={resolvedMode}
        data-kui-density={effectiveDensity}
        data-kui-scope={scopeId}
        style={{ display: "contents" }}
      >
        {children}
      </div>
    </KairoThemeContext.Provider>
  );
}
