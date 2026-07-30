/**
 * KairoUI Default Dark Theme
 *
 * A deliberately designed dark theme — NOT a mechanical inversion.
 *
 * ## Structural Differences from Light Theme
 *
 * - Page background is neutral.950 (deep blue-gray, not pure black)
 * - Surface hierarchy is inverted: page(darkest) → surface(slightly lighter) → raised(lighter still)
 * - Borders use lighter neutrals (300-400) for visibility against dark backgrounds
 * - Status colors use 400-step for icons/actions (brighter without glowing on dark)
 * - Interactive accent shifts to blue.400-500 (lighter for dark-surface contrast)
 * - Text uses neutral.50-200 for primary/secondary (high contrast without pure white)
 * - Shadows are deeper with higher opacity (shadows are less visible on dark)
 * - Focus ring uses blue.400 (lighter indigo for visibility on dark surfaces)
 * - Overlay backdrop is darker (0.75 opacity vs 0.6 in light)
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

export const darkTheme: SemanticTokens = {
  color: {
    background: {
      page: neutral["950"],
      surface: neutral["900"],
      muted: neutral["800"],
      raised: neutral["800"],
      inverse: neutral["50"],
      overlay: "rgba(0, 0, 0, 0.75)",
      hover: neutral["800"],
      active: neutral["700"],
      selected: "rgba(99, 102, 241, 0.15)",
    },
    text: {
      primary: neutral["50"],
      secondary: neutral["300"],
      muted: neutral["400"],
      disabled: neutral["600"],
      inverse: neutral["900"],
      link: blue["400"],
      linkHover: blue["300"],
    },
    border: {
      subtle: neutral["800"],
      default: neutral["700"],
      strong: neutral["500"],
      interactive: blue["400"],
      focus: blue["400"],
      disabled: neutral["700"],
    },
    interactive: {
      default: blue["500"],
      hover: blue["400"],
      active: blue["300"],
      selected: "rgba(99, 102, 241, 0.2)",
      subtle: "rgba(99, 102, 241, 0.1)",
      subtleHover: "rgba(99, 102, 241, 0.15)",
      disabled: neutral["700"],
      readOnly: neutral["800"],
    },
    status: {
      success: {
        subtle: "rgba(34, 197, 94, 0.1)",
        muted: "rgba(34, 197, 94, 0.15)",
        emphasis: green["500"],
        border: green["700"],
        text: green["400"],
        icon: green["400"],
        action: green["500"],
      },
      warning: {
        subtle: "rgba(249, 115, 22, 0.1)",
        muted: "rgba(249, 115, 22, 0.15)",
        emphasis: orange["500"],
        border: orange["700"],
        text: orange["400"],
        icon: orange["400"],
        action: orange["500"],
      },
      error: {
        subtle: "rgba(239, 68, 68, 0.1)",
        muted: "rgba(239, 68, 68, 0.15)",
        emphasis: red["500"],
        border: red["700"],
        text: red["400"],
        icon: red["400"],
        action: red["500"],
      },
      info: {
        subtle: "rgba(20, 184, 166, 0.1)",
        muted: "rgba(20, 184, 166, 0.15)",
        emphasis: teal["500"],
        border: teal["700"],
        text: teal["400"],
        icon: teal["400"],
        action: teal["500"],
      },
      neutral: {
        subtle: "rgba(107, 117, 136, 0.1)",
        muted: "rgba(107, 117, 136, 0.15)",
        emphasis: neutral["500"],
        border: neutral["600"],
        text: neutral["300"],
        icon: neutral["400"],
        action: neutral["500"],
      },
    },
    focus: {
      ring: blue["400"],
      innerRing: neutral["900"],
    },
    destructive: {
      default: red["500"],
      hover: red["400"],
      active: red["300"],
      subtle: "rgba(239, 68, 68, 0.1)",
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
    raised: shadow.md,
    overlay: shadow.lg,
    modal: shadow.xl,
    toast: shadow["2xl"],
  },

  interaction: {
    default: {
      background: "transparent",
      border: neutral["700"],
      text: neutral["50"],
      icon: neutral["400"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    hover: {
      background: neutral["800"],
      border: neutral["600"],
      text: neutral["50"],
      icon: neutral["300"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    active: {
      background: neutral["700"],
      border: neutral["500"],
      text: neutral["50"],
      icon: neutral["200"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    focused: {
      background: "transparent",
      border: blue["400"],
      text: neutral["50"],
      icon: neutral["400"],
      opacity: "1",
      focusRing: "visible",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    selected: {
      background: "rgba(99, 102, 241, 0.15)",
      border: blue["600"],
      text: blue["300"],
      icon: blue["400"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    disabled: {
      background: neutral["800"],
      border: neutral["700"],
      text: neutral["600"],
      icon: neutral["600"],
      opacity: "0.5",
      focusRing: "hidden",
      transitionDuration: duration.instant,
      transitionEasing: easing.default,
    },
    readOnly: {
      background: neutral["900"],
      border: neutral["700"],
      text: neutral["300"],
      icon: neutral["500"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.instant,
      transitionEasing: easing.default,
    },
    loading: {
      background: "transparent",
      border: neutral["700"],
      text: neutral["400"],
      icon: neutral["400"],
      opacity: "0.7",
      focusRing: "hidden",
      transitionDuration: duration.normal,
      transitionEasing: easing.default,
    },
    dragging: {
      background: "rgba(99, 102, 241, 0.1)",
      border: blue["600"],
      text: neutral["50"],
      icon: neutral["400"],
      opacity: "0.85",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    invalid: {
      background: "rgba(239, 68, 68, 0.1)",
      border: red["400"],
      text: neutral["50"],
      icon: red["400"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
    valid: {
      background: "rgba(34, 197, 94, 0.1)",
      border: green["400"],
      text: neutral["50"],
      icon: green["400"],
      opacity: "1",
      focusRing: "hidden",
      transitionDuration: duration.fast,
      transitionEasing: easing.default,
    },
  },
} as const;
