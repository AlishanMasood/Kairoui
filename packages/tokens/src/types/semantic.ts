/**
 * Semantic token collection contracts.
 *
 * Semantic tokens describe purpose (not appearance).
 * They are the primary mechanism for theming.
 */

import type { ColorValue, LengthValue, ShadowValue } from "./values";

// ─── Semantic Color Roles ────────────────────────────────────────────

/**
 * Background role tokens.
 *
 * | Role     | Purpose                                                |
 * | -------- | ------------------------------------------------------ |
 * | page     | Main page/app background                               |
 * | surface  | Default card/panel background                          |
 * | muted    | De-emphasized surfaces (sidebars, wells, code blocks)  |
 * | raised   | Elevated surfaces (popovers, dropdowns)                |
 * | inverse  | Inverse surface for contrast (tooltips, badges)        |
 * | overlay  | Semi-transparent backdrop behind modals/drawers        |
 * | hover    | Background on hover state (interactive rows/areas)     |
 * | active   | Background on active/pressed state                     |
 * | selected | Background for selected items (table rows, list items) |
 */
export interface SemanticBackgroundColors {
  readonly page: ColorValue;
  readonly surface: ColorValue;
  readonly muted: ColorValue;
  readonly raised: ColorValue;
  readonly inverse: ColorValue;
  readonly overlay: ColorValue;
  readonly hover: ColorValue;
  readonly active: ColorValue;
  readonly selected: ColorValue;
}

/**
 * Text role tokens.
 *
 * | Role      | Purpose                                             |
 * | --------- | --------------------------------------------------- |
 * | primary   | Default body text, highest contrast                 |
 * | secondary | Supporting text, descriptions, metadata             |
 * | muted     | De-emphasized text (timestamps, hints)              |
 * | disabled  | Text on disabled controls (reduced opacity effect)  |
 * | inverse   | Text on inverse/dark backgrounds                    |
 * | link      | Hyperlink text (resting state)                      |
 * | linkHover | Hyperlink text on hover                             |
 */
export interface SemanticTextColors {
  readonly primary: ColorValue;
  readonly secondary: ColorValue;
  readonly muted: ColorValue;
  readonly disabled: ColorValue;
  readonly inverse: ColorValue;
  readonly link: ColorValue;
  readonly linkHover: ColorValue;
}

/**
 * Border role tokens.
 *
 * | Role        | Purpose                                            |
 * | ----------- | -------------------------------------------------- |
 * | subtle      | Very light borders (dividers between same-surfaces)|
 * | default     | Standard border (inputs, cards, panels)            |
 * | strong      | Emphasized borders (active sections, key dividers) |
 * | interactive | Borders on interactive elements (hovered inputs)   |
 * | focus       | Border/outline color when element has focus         |
 * | disabled    | Border on disabled controls                        |
 */
export interface SemanticBorderColors {
  readonly subtle: ColorValue;
  readonly default: ColorValue;
  readonly strong: ColorValue;
  readonly interactive: ColorValue;
  readonly focus: ColorValue;
  readonly disabled: ColorValue;
}

/**
 * Interactive/action color tokens.
 *
 * These represent the primary brand interaction color in various states.
 *
 * | Role        | Purpose                                           |
 * | ----------- | ------------------------------------------------- |
 * | default     | Primary action resting state (buttons, links)     |
 * | hover       | Primary action on hover                           |
 * | active      | Primary action being pressed                      |
 * | selected    | Selected/toggled state background                 |
 * | subtle      | Soft interactive background (ghost actions)       |
 * | subtleHover | Soft interactive background on hover              |
 * | disabled    | Interactive element when disabled                  |
 * | readOnly    | Interactive element in read-only state             |
 */
export interface SemanticInteractiveColors {
  readonly default: ColorValue;
  readonly hover: ColorValue;
  readonly active: ColorValue;
  readonly selected: ColorValue;
  readonly subtle: ColorValue;
  readonly subtleHover: ColorValue;
  readonly disabled: ColorValue;
  readonly readOnly: ColorValue;
}

/**
 * Status color tokens.
 *
 * Each status has a standard (strong) and subtle (background) variant.
 */
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

/**
 * Focus indicator tokens.
 *
 * | Role      | Purpose                                    |
 * | --------- | ------------------------------------------ |
 * | ring      | Primary focus ring color                   |
 * | innerRing | Inner ring for double-ring focus patterns  |
 */
export interface SemanticFocusColors {
  readonly ring: ColorValue;
  readonly innerRing: ColorValue;
}

/**
 * Destructive action tokens.
 *
 * Used for dangerous/irreversible actions (delete, remove, disconnect).
 *
 * | Role    | Purpose                                        |
 * | ------- | ---------------------------------------------- |
 * | default | Destructive button/action resting state         |
 * | hover   | Destructive action on hover                    |
 * | active  | Destructive action being pressed               |
 * | subtle  | Soft destructive background (inline warnings)  |
 * | text    | Text color for destructive context              |
 */
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
