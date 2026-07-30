/**
 * Semantic token collection contracts.
 *
 * Semantic tokens describe purpose (not appearance).
 * They are the primary mechanism for theming.
 */

import type {
  ColorValue,
  FontFamilyValue,
  FontWeightValue,
  LengthValue,
  RatioValue,
  ShadowValue,
} from "./values";

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
 * Roles available within a single status category.
 *
 * | Role       | Purpose                                              |
 * | ---------- | ---------------------------------------------------- |
 * | subtle     | Very light background tint (banners, toasts)         |
 * | muted      | Slightly stronger background (badges, pills)         |
 * | emphasis   | Strong/saturated background (filled badges, actions) |
 * | border     | Border for status-colored containers                 |
 * | text       | Status-appropriate text color on neutral backgrounds |
 * | icon       | Status-appropriate icon color                        |
 * | action     | Strong action/button background for this status      |
 *
 * ## Business State Mapping (examples — not encoded here)
 *
 * Business states map to semantic statuses at the application layer:
 * - approved, completed, paid → success
 * - overdue, at-risk, expiring → warning
 * - failed, rejected, blocked → danger (error)
 * - processing, pending, in-review → info
 * - draft, archived, inactive → neutral
 *
 * These mappings are NOT tokens. They are application-level decisions.
 * Status tokens provide the visual vocabulary; applications choose which to use.
 */
export interface StatusRoles {
  readonly subtle: ColorValue;
  readonly muted: ColorValue;
  readonly emphasis: ColorValue;
  readonly border: ColorValue;
  readonly text: ColorValue;
  readonly icon: ColorValue;
  readonly action: ColorValue;
}

/**
 * Complete semantic status color collection.
 *
 * Five status categories cover all enterprise feedback needs:
 * - success: positive outcomes, completion, approval
 * - warning: caution, non-critical issues, approaching limits
 * - error: failures, critical issues, destructive feedback
 * - info: neutral information, guidance, processing
 * - neutral: default/inactive states, drafts, archived items
 */
export interface SemanticStatusColors {
  readonly success: StatusRoles;
  readonly warning: StatusRoles;
  readonly error: StatusRoles;
  readonly info: StatusRoles;
  readonly neutral: StatusRoles;
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

/**
 * Semantic spacing roles.
 *
 * All values reference primitive spacing tokens. Roles marked with (D)
 * are density-aware and will be remapped by compact/spacious density modes.
 *
 * | Group    | Role         | D | Purpose                                       |
 * | -------- | ------------ | - | --------------------------------------------- |
 * | inline   | xs           | D | Tight icon-to-text, badge gaps                |
 * | inline   | sm           | D | Standard icon-to-label, inline element gaps   |
 * | inline   | md           | D | Control-to-control in toolbars, button groups |
 * | form     | fieldGap     | D | Vertical gap between form fields              |
 * | form     | sectionGap   | D | Gap between form sections/fieldsets           |
 * | form     | labelGap     | D | Gap between label and its control             |
 * | content  | cardPadding  | D | Internal padding of cards/panels              |
 * | content  | dialogPadding| D | Internal padding of dialogs                   |
 * | content  | toolbarGap   | D | Gap between toolbar items                     |
 * | content  | listItemGap  | D | Gap between list/menu items                   |
 * | content  | tableCell    | D | Table cell internal padding                   |
 * | section  | gap          |   | Vertical gap between page sections            |
 * | section  | padding      |   | Internal padding of major sections            |
 * | page     | gutter       |   | Horizontal page edge gutter                   |
 * | page     | gap          |   | Gap between top-level page regions            |
 */
export interface SemanticSpacing {
  readonly inline: {
    readonly xs: LengthValue;
    readonly sm: LengthValue;
    readonly md: LengthValue;
  };
  readonly form: {
    readonly fieldGap: LengthValue;
    readonly sectionGap: LengthValue;
    readonly labelGap: LengthValue;
  };
  readonly content: {
    readonly cardPadding: LengthValue;
    readonly dialogPadding: LengthValue;
    readonly toolbarGap: LengthValue;
    readonly listItemGap: LengthValue;
    readonly tableCell: LengthValue;
  };
  readonly section: {
    readonly gap: LengthValue;
    readonly padding: LengthValue;
  };
  readonly page: {
    readonly gutter: LengthValue;
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

// ─── Semantic Typography ─────────────────────────────────────────────

/**
 * A single typography role definition.
 *
 * Each role specifies the complete typographic treatment for a semantic purpose.
 * Optional `numericVariant` signals tabular-nums or other numeric font features.
 */
export interface TypographyRole {
  readonly fontFamily: FontFamilyValue;
  readonly fontSize: LengthValue;
  readonly lineHeight: RatioValue;
  readonly fontWeight: FontWeightValue;
  readonly letterSpacing: LengthValue;
}

/**
 * Numeric typography extension — adds tabular number behavior.
 */
export interface NumericTypographyRole extends TypographyRole {
  readonly fontVariantNumeric: "tabular-nums" | "normal";
}

/**
 * Semantic typography roles.
 *
 * | Role             | Use                                    | Misuse                                |
 * | ---------------- | -------------------------------------- | ------------------------------------- |
 * | display          | Dashboard hero metrics, large KPIs     | Body text, section content            |
 * | pageTitle        | Top-level page heading (one per page)  | Multiple per page, section headings   |
 * | sectionTitle     | Section/card headings                  | Body text, navigation labels          |
 * | componentTitle   | Component-level headings (dialogs, panels) | Page titles, body text            |
 * | body             | Default body text                      | Headings, labels                      |
 * | bodyStrong       | Emphasized body text (bold inline)     | Full paragraphs, headings             |
 * | label            | Form labels, button text               | Body paragraphs, headings             |
 * | metadata         | Timestamps, counts, secondary info     | Primary content, actions              |
 * | caption          | Table captions, footnotes, help text   | Body text, labels                     |
 * | code             | Code snippets, file names, commands    | Body text, headings                   |
 * | numeric          | Table numbers, prices, data values     | Body text, labels                     |
 * | numericEmphasized| Prominent metrics, dashboard totals    | Body text, secondary numbers          |
 */
export interface SemanticTypography {
  readonly display: TypographyRole;
  readonly pageTitle: TypographyRole;
  readonly sectionTitle: TypographyRole;
  readonly componentTitle: TypographyRole;
  readonly body: TypographyRole;
  readonly bodyStrong: TypographyRole;
  readonly label: TypographyRole;
  readonly metadata: TypographyRole;
  readonly caption: TypographyRole;
  readonly code: TypographyRole;
  readonly numeric: NumericTypographyRole;
  readonly numericEmphasized: NumericTypographyRole;
}

// ─── Full Semantic Collection ────────────────────────────────────────

/** Complete semantic token collection */
export interface SemanticTokens {
  readonly color: SemanticColors;
  readonly typography: SemanticTypography;
  readonly spacing: SemanticSpacing;
  readonly control: {
    readonly height: SemanticControlHeights;
  };
  readonly elevation: SemanticElevation;
}
