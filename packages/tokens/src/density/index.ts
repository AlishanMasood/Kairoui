/**
 * KairoUI Density Token System
 *
 * Three density modes adjust spacing and control sizing for different contexts.
 * Density is orthogonal to theme (light/dark) — any density works with any theme.
 *
 * ## Modes
 *
 * | Mode        | Default? | Audience                                          |
 * | ----------- | -------- | ------------------------------------------------- |
 * | comfortable | Yes      | General enterprise UI, forms, dashboards          |
 * | standard    | No       | Balanced density for mixed content                |
 * | compact     | No       | Data tables, dense lists, power-user interfaces   |
 *
 * ## What Density May Change
 *
 * - Control heights (buttons, inputs, selects)
 * - Inline gaps (icon-to-text, control-to-control)
 * - Form spacing (field gaps, label gaps)
 * - Content padding (cards, dialogs, table cells)
 * - Toolbar spacing
 * - List item spacing
 *
 * ## What Density Must NEVER Change
 *
 * - Colors (theme concern, not density)
 * - Typography (font-size, font-family, line-height remain stable)
 * - Border radii
 * - Shadow/elevation
 * - Focus ring dimensions (must remain visible at all densities)
 * - Page-level spacing (gutters, section gaps — layout concern)
 * - Motion timing
 *
 * ## Accessibility Constraints
 *
 * - Compact mode reduces control heights to sm (32px) — still meets WCAG 2.5.8 minimum (24px)
 * - Touch-target compliance: compact mode should be used on desktop/pointer devices only
 * - Focus visibility is never reduced by density
 * - Text remains the same size across all densities (readability preserved)
 *
 * ## How Themes and Components Consume Density
 *
 * Components read semantic spacing/sizing tokens. The density system provides
 * alternate value sets for those tokens. At runtime (Phase 3), a density context
 * will select which value set to apply, similar to how theme selects colors.
 */

import type { SemanticSpacing, SemanticControlHeights } from "../types/semantic";
import { spacing } from "../primitives/spacing";
import { controlHeight } from "../primitives/sizing";

export interface DensityTokens {
  readonly spacing: SemanticSpacing;
  readonly control: { readonly height: SemanticControlHeights };
}

// ─── Comfortable (Default) ───────────────────────────────────────────

export const comfortable: DensityTokens = {
  spacing: {
    inline: {
      xs: spacing["1"],
      sm: spacing["2"],
      md: spacing["3"],
    },
    form: {
      fieldGap: spacing["4"],
      sectionGap: spacing["8"],
      labelGap: spacing["1.5"],
    },
    content: {
      cardPadding: spacing["5"],
      dialogPadding: spacing["6"],
      toolbarGap: spacing["2"],
      listItemGap: spacing["0.5"],
      tableCell: spacing["3"],
    },
    section: {
      gap: spacing["10"],
      padding: spacing["8"],
    },
    page: {
      gutter: spacing["6"],
      gap: spacing["12"],
    },
  },
  control: {
    height: {
      xs: controlHeight.xs,
      sm: controlHeight.sm,
      md: controlHeight.md,
      lg: controlHeight.lg,
      xl: controlHeight.xl,
    },
  },
} as const;

// ─── Standard ────────────────────────────────────────────────────────

export const standard: DensityTokens = {
  spacing: {
    inline: {
      xs: spacing["0.5"],
      sm: spacing["1.5"],
      md: spacing["2.5"],
    },
    form: {
      fieldGap: spacing["3"],
      sectionGap: spacing["6"],
      labelGap: spacing["1"],
    },
    content: {
      cardPadding: spacing["4"],
      dialogPadding: spacing["5"],
      toolbarGap: spacing["1.5"],
      listItemGap: spacing["0.5"],
      tableCell: spacing["2.5"],
    },
    section: {
      gap: spacing["10"],
      padding: spacing["8"],
    },
    page: {
      gutter: spacing["6"],
      gap: spacing["12"],
    },
  },
  control: {
    height: {
      xs: controlHeight.xs,
      sm: controlHeight.sm,
      md: controlHeight.sm,
      lg: controlHeight.md,
      xl: controlHeight.lg,
    },
  },
} as const;

// ─── Compact ─────────────────────────────────────────────────────────

export const compact: DensityTokens = {
  spacing: {
    inline: {
      xs: spacing["0.5"],
      sm: spacing["1"],
      md: spacing["2"],
    },
    form: {
      fieldGap: spacing["2"],
      sectionGap: spacing["4"],
      labelGap: spacing["0.5"],
    },
    content: {
      cardPadding: spacing["3"],
      dialogPadding: spacing["4"],
      toolbarGap: spacing["1"],
      listItemGap: spacing["0"],
      tableCell: spacing["2"],
    },
    section: {
      gap: spacing["10"],
      padding: spacing["8"],
    },
    page: {
      gutter: spacing["6"],
      gap: spacing["12"],
    },
  },
  control: {
    height: {
      xs: controlHeight.xs,
      sm: controlHeight.xs,
      md: controlHeight.sm,
      lg: controlHeight.sm,
      xl: controlHeight.md,
    },
  },
} as const;

/** All density modes indexed by name */
export const densities = {
  comfortable,
  standard,
  compact,
} as const;
