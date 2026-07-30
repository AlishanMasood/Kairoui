/**
 * KairoUI Theme Engine — Official Terminology and API Conventions
 *
 * This file defines the canonical types and naming conventions for the
 * theme engine. All public APIs must use these exact names.
 */

// ─── Theme Mode ──────────────────────────────────────────────────────

/**
 * The user's requested color-scheme preference.
 *
 * - `"light"` — always use the light theme.
 * - `"dark"` — always use the dark theme.
 * - `"system"` — follow the operating system's `prefers-color-scheme`.
 *
 * This is the *requested* mode, not the *resolved* mode.
 * When `"system"` is requested, the resolved mode will be `"light"` or `"dark"`
 * based on the OS preference at that moment.
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * The effective color scheme after resolving `"system"` to a concrete value.
 *
 * Always `"light"` or `"dark"` — never `"system"`.
 */
export type ResolvedThemeMode = "light" | "dark";

// ─── Density ─────────────────────────────────────────────────────────

/**
 * The active density mode controlling spatial tokens.
 *
 * - `"comfortable"` — default, generous spacing for general enterprise UI.
 * - `"standard"` — balanced density for mixed content.
 * - `"compact"` — reduced spacing for data-dense views.
 *
 * Density affects control heights, padding, and gaps.
 * Density never affects colors, typography, or elevation.
 */
export type DensityMode = "comfortable" | "standard" | "compact";

// ─── Theme Preference ────────────────────────────────────────────────

/**
 * The user's persisted theme choices, stored via a storage adapter.
 */
export interface ThemePreference {
  readonly mode: ThemeMode;
  readonly density: DensityMode;
}

// ─── Theme Override ──────────────────────────────────────────────────

/** Deeply partial version of a type — all nested properties become optional. */
export type DeepPartial<T> = {
  readonly [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Semantic override groups for theme customization.
 * Each group maps to a top-level key in SemanticTokens.
 */
export interface ThemeOverrides {
  readonly color?: DeepPartial<{
    readonly background: Record<string, string>;
    readonly text: Record<string, string>;
    readonly border: Record<string, string>;
    readonly interactive: Record<string, string>;
    readonly status: Record<string, Record<string, string>>;
    readonly focus: Record<string, string>;
    readonly destructive: Record<string, string>;
  }>;
  readonly typography?: DeepPartial<Record<string, Record<string, string>>>;
  readonly spacing?: DeepPartial<Record<string, Record<string, string>>>;
  readonly elevation?: DeepPartial<Record<string, string>>;
}

// ─── Theme Definition ────────────────────────────────────────────────

/** Input accepted by `createTheme()`. */
export interface CreateThemeInput {
  readonly name: string;
  readonly base: ResolvedThemeMode;
  readonly description?: string;
  readonly defaultDensity?: DensityMode;
  readonly overrides?: ThemeOverrides;
  readonly metadata?: Readonly<Record<string, string>>;
}

/**
 * A validated, immutable theme definition returned by `createTheme()`.
 *
 * Contains all configuration needed to resolve the theme at runtime.
 * The definition is unresolved — it stores overrides, not computed values.
 */
export interface ThemeDefinition {
  readonly name: string;
  readonly base: ResolvedThemeMode;
  readonly description: string;
  readonly defaultDensity: DensityMode;
  readonly overrides: ThemeOverrides;
  readonly metadata: Readonly<Record<string, string>>;
}

/** Validation error from `createTheme()`. */
export interface ThemeValidationError {
  readonly path: string;
  readonly message: string;
}

/** Result of theme validation. */
export interface ThemeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ThemeValidationError[];
}

// ─── Theme Scope ─────────────────────────────────────────────────────

/**
 * A theme scope is a DOM sub-tree with its own theme and/or density,
 * independent of the page-level configuration.
 *
 * Implemented by setting `data-kui-theme` and/or `data-kui-density`
 * on a container element. CSS custom properties cascade naturally
 * within the scope.
 */
export interface ThemeScope {
  readonly mode?: ThemeMode;
  readonly density?: DensityMode;
}

// ─── Theme Target ────────────────────────────────────────────────────

/**
 * The DOM element that receives `data-kui-theme` and `data-kui-density`
 * attributes. Defaults to `document.documentElement` for page-level theming.
 * For scoped themes, the target is the scope's container element.
 */
export type ThemeTarget = HTMLElement;

// ─── Storage Adapter ─────────────────────────────────────────────────

/**
 * Interface for persisting and retrieving theme preferences.
 *
 * Implementations:
 * - `localStorageAdapter` — browser localStorage with cross-tab sync.
 * - `noopStorageAdapter` — returns defaults, stores nothing (SSR).
 * - `memoryStorageAdapter()` — in-memory store for tests.
 */
export interface StorageAdapter {
  get(): ThemePreference | null;
  set(preference: ThemePreference): void;
  subscribe(listener: () => void): () => void;
}

// ─── Theme Engine ────────────────────────────────────────────────────

/**
 * The runtime theme engine instance. Created by `createThemeEngine()`.
 *
 * Manages mode resolution, density, persistence, system preference
 * listening, and DOM attribute application.
 */
export interface ThemeEngine {
  getMode(): ThemeMode;
  getResolvedMode(): ResolvedThemeMode;
  getDensity(): DensityMode;
  setMode(mode: ThemeMode): void;
  setDensity(density: DensityMode): void;
  subscribe(listener: () => void): () => void;
  destroy(): void;
}
