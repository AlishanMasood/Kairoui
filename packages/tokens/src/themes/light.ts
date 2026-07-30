/**
 * KairoUI Default Light Theme
 *
 * Maps all semantic tokens to primitive values for the light color scheme.
 *
 * ## Design Choices
 *
 * - Page background uses neutral.50 (slight warmth, not pure white)
 * - Surfaces create a clear 3-level hierarchy: page → surface → raised
 * - Accent usage is restrained — brand indigo appears only on interactive elements
 * - Text contrast exceeds WCAG AA on all intended background pairings
 * - Focus treatment uses a 2px indigo ring with white inner ring for visibility
 */

import type { SemanticTokens } from "../types/semantic";
import { neutral, blue, green, red, orange, teal } from "../primitives/colors";
import { spacing } from "../primitives/spacing";
import { controlHeight } from "../primitives/sizing";
import { shadow } from "../primitives/shadows";
import { duration, easing } from "../primitives/motion";
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} from "../primitives/typography";

export const lightTheme: SemanticTokens = {
  color: {
    background: {
      page: neutral["50"],
      surface: "#ffffff",
      muted: neutral["100"],
      raised: "#ffffff",
      inverse: neutral["900"],
      overlay: "rgba(19, 24, 34, 0.6)",
      hover: neutral["100"],
      active: neutral["200"],
      selected: blue["50"],
    },
    text: {
      primary: neutral["900"],
      secondary: neutral["600"],
      muted: neutral["500"],
      disabled: neutral["400"],
      inverse: "#ffffff",
      link: blue["600"],
      linkHover: blue["700"],
    },
    border: {
      subtle: neutral["100"],
      default: neutral["200"],
      strong: neutral["400"],
      interactive: blue["500"],
      focus: blue["600"],
      disabled: neutral["200"],
    },
    interactive: {
      default: blue["600"],
      hover: blue["700"],
      active: blue["800"],
      selected: blue["100"],
      subtle: blue["50"],
      subtleHover: blue["100"],
      disabled: neutral["300"],
      readOnly: neutral["200"],
    },
    status: {
      success: {
        subtle: green["50"],
        muted: green["100"],
        emphasis: green["600"],
        border: green["300"],
        text: green["700"],
        icon: green["600"],
        action: green["600"],
      },
      warning: {
        subtle: orange["50"],
        muted: orange["100"],
        emphasis: orange["600"],
        border: orange["300"],
        text: orange["700"],
        icon: orange["500"],
        action: orange["600"],
      },
      error: {
        subtle: red["50"],
        muted: red["100"],
        emphasis: red["600"],
        border: red["300"],
        text: red["700"],
        icon: red["600"],
        action: red["600"],
      },
      info: {
        subtle: teal["50"],
        muted: teal["100"],
        emphasis: teal["600"],
        border: teal["300"],
        text: teal["700"],
        icon: teal["600"],
        action: teal["600"],
      },
      neutral: {
        subtle: neutral["50"],
        muted: neutral["100"],
        emphasis: neutral["600"],
        border: neutral["300"],
        text: neutral["700"],
        icon: neutral["500"],
        action: neutral["600"],
      },
    },
    focus: {
      ring: blue["500"],
      innerRing: "#ffffff",
    },
    destructive: {
      default: red["600"],
      hover: red["700"],
      active: red["800"],
      subtle: red["50"],
      text: "#ffffff",
    },
  },

  typography: {
    display: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize["3xl"],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
    },
    pageTitle: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize["2xl"],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.tight,
    },
    sectionTitle: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.xl,
      lineHeight: lineHeight.snug,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
    },
    componentTitle: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.lg,
      lineHeight: lineHeight.snug,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
    body: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    bodyStrong: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
    label: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
    metadata: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.wide,
    },
    caption: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    code: {
      fontFamily: fontFamily.mono,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    numeric: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
      fontVariantNumeric: "tabular-nums",
    },
    numericEmphasized: {
      fontFamily: fontFamily.sans,
      fontSize: fontSize.lg,
      lineHeight: lineHeight.snug,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.tight,
      fontVariantNumeric: "tabular-nums",
    },
  },

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

  elevation: {
    raised: shadow.sm,
    overlay: shadow.md,
    modal: shadow.lg,
    toast: shadow.xl,
  },

  interaction: {
    default: {
      background: "transparent",
      border: neutral["200"],
      text: neutral["900"],
      icon: neutral["600"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    hover: {
      background: neutral["100"],
      border: neutral["300"],
      text: neutral["900"],
      icon: neutral["700"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    active: {
      background: neutral["200"],
      border: neutral["400"],
      text: neutral["900"],
      icon: neutral["800"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    focused: {
      background: "transparent",
      border: blue["500"],
      text: neutral["900"],
      icon: neutral["600"],
      opacity: "1",
      focusRing: "visible",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    selected: {
      background: blue["50"],
      border: blue["200"],
      text: blue["800"],
      icon: blue["600"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    disabled: {
      background: neutral["100"],
      border: neutral["200"],
      text: neutral["400"],
      icon: neutral["400"],
      opacity: "0.6",
      focusRing: "hidden",
      transitionDuration: duration.instant,
      transitionEasing: easing.default,
    },
    readOnly: {
      background: neutral["50"],
      border: neutral["200"],
      text: neutral["700"],
      icon: neutral["500"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.instant,
      transitionEasing: easing.default,
    },
    loading: {
      background: "transparent",
      border: neutral["200"],
      text: neutral["500"],
      icon: neutral["500"],
      opacity: "0.8",
      focusRing: "hidden",
      transitionDuration: duration.normal,
      transitionEasing: easing.default,
    },
    dragging: {
      background: blue["50"],
      border: blue["200"],
      text: neutral["900"],
      icon: neutral["600"],
      opacity: "0.9",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    invalid: {
      background: red["50"],
      border: red["500"],
      text: neutral["900"],
      icon: red["600"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    valid: {
      background: green["50"],
      border: green["500"],
      text: neutral["900"],
      icon: green["600"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
  },
} as const;
