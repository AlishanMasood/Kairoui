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

/**
 * A partial set of semantic token overrides applied on top of a base theme.
 *
 * Only supported semantic token paths may be overridden.
 * The structure mirrors SemanticTokens but every property is optional.
 */
export type ThemeOverride = Record<string, unknown>;

// ─── Theme Definition ────────────────────────────────────────────────

/**
 * A complete theme definition that the engine can apply at runtime.
 *
 * Contains a name, an optional base theme to extend, and optional overrides.
 * Built-in themes (`"light"`, `"dark"`) are pre-defined in `@kairoui/tokens`.
 * Custom themes extend a built-in base with partial overrides.
 */
export interface ThemeDefinition {
  readonly name: string;
  readonly base: ResolvedThemeMode;
  readonly overrides?: ThemeOverride;
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
