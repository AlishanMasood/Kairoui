/**
 * Semantic token collection contracts.
 *
 * Semantic tokens describe purpose (not appearance).
 * They are the primary mechanism for theming.
 */

import type { ColorValue, LengthValue, ShadowValue } from "./values";

// ─── Semantic Color Roles ────────────────────────────────────────────

/** Background role tokens */
export interface SemanticBackgroundColors {
  readonly page: ColorValue;
  readonly surface: ColorValue;
  readonly elevated: ColorValue;
  readonly sunken: ColorValue;
  readonly overlay: ColorValue;
}

/** Text role tokens */
export interface SemanticTextColors {
  readonly primary: ColorValue;
  readonly secondary: ColorValue;
  readonly tertiary: ColorValue;
  readonly disabled: ColorValue;
  readonly inverse: ColorValue;
  readonly link: ColorValue;
}

/** Border role tokens */
export interface SemanticBorderColors {
  readonly default: ColorValue;
  readonly subtle: ColorValue;
  readonly strong: ColorValue;
  readonly interactive: ColorValue;
  readonly focus: ColorValue;
  readonly disabled: ColorValue;
}

/** Interactive state tokens */
export interface SemanticInteractiveColors {
  readonly default: ColorValue;
  readonly hover: ColorValue;
  readonly active: ColorValue;
  readonly selected: ColorValue;
  readonly subtle: ColorValue;
  readonly subtleHover: ColorValue;
}

/** Status tokens */
export interface SemanticStatusColors {
  readonly success: ColorValue;
  readonly successSubtle: ColorValue;
  readonly warning: ColorValue;
  readonly warningSubtle: ColorValue;
  readonly error: ColorValue;
  readonly errorSubtle: ColorValue;
  readonly info: ColorValue;
  readonly infoSubtle: ColorValue;
}

/** Focus tokens */
export interface SemanticFocusColors {
  readonly ring: ColorValue;
  readonly innerRing: ColorValue;
}

/** Destructive action tokens */
export interface SemanticDestructiveColors {
  readonly default: ColorValue;
  readonly hover: ColorValue;
  readonly active: ColorValue;
  readonly subtle: ColorValue;
  readonly text: ColorValue;
}

/** Complete semantic color collection */
export interface SemanticColors {
  readonly background: SemanticBackgroundColors;
  readonly text: SemanticTextColors;
  readonly border: SemanticBorderColors;
  readonly interactive: SemanticInteractiveColors;
  readonly status: SemanticStatusColors;
  readonly focus: SemanticFocusColors;
  readonly destructive: SemanticDestructiveColors;
}

// ─── Semantic Spacing ────────────────────────────────────────────────

/** Semantic spacing roles (density-aware) */
export interface SemanticSpacing {
  readonly component: {
    readonly gap: LengthValue;
    readonly padding: LengthValue;
    readonly paddingSmall: LengthValue;
    readonly paddingLarge: LengthValue;
  };
  readonly section: {
    readonly gap: LengthValue;
    readonly padding: LengthValue;
  };
  readonly page: {
    readonly margin: LengthValue;
    readonly gap: LengthValue;
  };
}

// ─── Semantic Sizing ─────────────────────────────────────────────────

/** Control height tokens (density-aware) */
export interface SemanticControlHeights {
  readonly xs: LengthValue;
  readonly sm: LengthValue;
  readonly md: LengthValue;
  readonly lg: LengthValue;
  readonly xl: LengthValue;
}

// ─── Semantic Elevation ──────────────────────────────────────────────

/** Elevation level tokens */
export interface SemanticElevation {
  readonly raised: ShadowValue;
  readonly overlay: ShadowValue;
  readonly modal: ShadowValue;
  readonly toast: ShadowValue;
}

// ─── Full Semantic Collection ────────────────────────────────────────

/** Complete semantic token collection */
export interface SemanticTokens {
  readonly color: SemanticColors;
  readonly spacing: SemanticSpacing;
  readonly control: {
    readonly height: SemanticControlHeights;
  };
  readonly elevation: SemanticElevation;
}
