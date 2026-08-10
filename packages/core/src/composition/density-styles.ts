import { tokenToCssValue } from "./resolve-tokens";

// ─── Density Modes ──────────────────────────────────────────────────

/** Supported density modes. */
export type DensityMode = "comfortable" | "standard" | "compact";

/** All density modes in order. */
export const DENSITY_MODES: readonly DensityMode[] = ["comfortable", "standard", "compact"];

// ─── Density Token Categories ───────────────────────────────────────

/** Density-responsive token dimensions that components may opt into. */
export type DensityDimension =
  "controlHeight" | "inlineSpacing" | "formSpacing" | "contentPadding" | "iconSize";

/** Maps density dimensions to their token paths. */
const DIMENSION_TOKENS: Readonly<Record<DensityDimension, readonly string[]>> = {
  controlHeight: [
    "control.height.xs",
    "control.height.sm",
    "control.height.md",
    "control.height.lg",
    "control.height.xl",
  ],
  inlineSpacing: ["spacing.inline.xs", "spacing.inline.sm", "spacing.inline.md"],
  formSpacing: ["spacing.form.fieldGap", "spacing.form.sectionGap", "spacing.form.labelGap"],
  contentPadding: [
    "spacing.content.cardPadding",
    "spacing.content.dialogPadding",
    "spacing.content.toolbarGap",
    "spacing.content.tableCell",
  ],
  iconSize: ["control.height.xs", "control.height.sm"],
};

// ─── Density Style Resolution ───────────────────────────────────────

/** Style map with density-responsive values. */
export interface DensityResponsiveStyle {
  /** CSS property name. */
  readonly property: string;
  /** Token path for the density-responsive value. */
  readonly token: string;
  /** Optional fallback. */
  readonly fallback?: string | undefined;
}

/**
 * Resolves a set of density-responsive styles to CSS var() references.
 * Components use these to automatically adapt to the active density mode.
 *
 * The returned values reference tokens that change automatically via
 * [data-kui-density] CSS selectors — no runtime density logic needed.
 */
export function resolveDensityStyles(
  styles: readonly DensityResponsiveStyle[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { property, token, fallback } of styles) {
    result[property] = tokenToCssValue(token, fallback);
  }
  return result;
}

/**
 * Returns all token paths for a given density dimension.
 * Useful for tooling and CSS generation.
 */
export function getDimensionTokens(dimension: DensityDimension): readonly string[] {
  return DIMENSION_TOKENS[dimension];
}

/**
 * Checks if a token path is density-responsive.
 */
export function isDensityResponsiveToken(tokenPath: string): boolean {
  for (const tokens of Object.values(DIMENSION_TOKENS)) {
    if (tokens.includes(tokenPath)) return true;
  }
  return false;
}

// ─── Component Density Helpers ──────────────────────────────────────

/** Shorthand for control height at a specific size. */
export function controlHeight(size: "xs" | "sm" | "md" | "lg" | "xl"): string {
  return tokenToCssValue(`control.height.${size}`);
}

/** Shorthand for inline spacing at a specific size. */
export function inlineSpacing(size: "xs" | "sm" | "md"): string {
  return tokenToCssValue(`spacing.inline.${size}`);
}

/** Shorthand for form spacing dimension. */
export function formSpacing(dimension: "fieldGap" | "sectionGap" | "labelGap"): string {
  return tokenToCssValue(`spacing.form.${dimension}`);
}

/** Shorthand for content padding dimension. */
export function contentPadding(
  dimension: "cardPadding" | "dialogPadding" | "toolbarGap" | "tableCell",
): string {
  return tokenToCssValue(`spacing.content.${dimension}`);
}
