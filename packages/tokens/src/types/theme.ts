/**
 * Theme and density definition contracts.
 *
 * Themes provide value sets for semantic tokens.
 * Density modes adjust spacing/sizing semantic tokens.
 */

import type { SemanticTokens } from "./semantic";
import type { TokenRef } from "./references";

// ─── Theme ───────────────────────────────────────────────────────────

/** Approved theme names */
export type ThemeName = "light" | "dark";

/**
 * A theme definition maps every semantic token to a resolved reference.
 *
 * The structure mirrors SemanticTokens exactly, but each leaf value
 * is a TokenRef (typically a PrimitiveRef or LiteralRef).
 */
export type ThemeDefinition = DeepTokenRefMap<SemanticTokens>;

/**
 * A partial theme override — allows overriding a subset of semantic tokens.
 * Useful for custom themes that extend a base theme.
 */
export type PartialThemeOverride = DeepPartialTokenRefMap<SemanticTokens>;

// ─── Density ─────────────────────────────────────────────────────────

/** Approved density names */
export type DensityName = "comfortable" | "standard" | "compact";

/**
 * A density definition overrides spacing and sizing semantic tokens.
 * Only spacing-related tokens are affected by density.
 */
export interface DensityDefinition {
  readonly spacing: DeepTokenRefMap<SemanticTokens["spacing"]>;
  readonly control: DeepTokenRefMap<SemanticTokens["control"]>;
}

/**
 * A partial density override.
 */
export interface PartialDensityOverride {
  readonly spacing?: DeepPartialTokenRefMap<SemanticTokens["spacing"]>;
  readonly control?: DeepPartialTokenRefMap<SemanticTokens["control"]>;
}

// ─── Utility Types ───────────────────────────────────────────────────

/**
 * Recursively maps an object structure so each leaf value becomes a TokenRef.
 * Used to create theme definitions that mirror semantic token structure.
 */
export type DeepTokenRefMap<T> = {
  readonly [K in keyof T]: T[K] extends string | number
    ? TokenRef
    : T[K] extends object
      ? DeepTokenRefMap<T[K]>
      : TokenRef;
};

/**
 * Recursively maps an object to a partial structure with TokenRef leaves.
 * Used for partial theme overrides.
 */
export type DeepPartialTokenRefMap<T> = {
  readonly [K in keyof T]?: T[K] extends string | number
    ? TokenRef
    : T[K] extends object
      ? DeepPartialTokenRefMap<T[K]>
      : TokenRef;
};
