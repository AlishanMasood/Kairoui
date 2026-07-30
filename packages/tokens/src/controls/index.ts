/**
 * Shared Control Token Contracts
 *
 * Defines the common design decisions shared across interactive controls
 * (Button, Input, Select, Combobox, Checkbox, Radio, Switch).
 *
 * Individual components inherit from these defaults and override
 * only what makes them visually distinct.
 *
 * ## Inheritance model
 *
 * Controls MAY inherit:
 * - Heights, padding, and typography per size
 * - Border radius and width
 * - Focus ring treatment
 * - Disabled/readOnly/loading visual treatment
 * - Icon sizing and gaps
 * - Transition timing
 *
 * Controls MUST define independently:
 * - Background colors (buttons are filled, inputs are surfaced)
 * - Border colors in non-shared states (e.g., input invalid)
 * - Variant-specific styles (button primary vs secondary)
 * - Component-unique anatomy (input placeholder, switch track)
 */

import { lightTheme } from "../themes/light";
import { neutral } from "../primitives/colors";
import { spacing } from "../primitives/spacing";
import { radius, borderWidth, focusRing } from "../primitives/borders";
import {
  fontSize,
  fontFamily,
  fontWeight,
  lineHeight,
  letterSpacing,
} from "../primitives/typography";
import { controlHeight, iconSize } from "../primitives/sizing";
import { duration, easing } from "../primitives/motion";

// ─── Types ───────────────────────────────────────────────────────────

/** Per-size control dimensions */
export interface ControlSizeTokens {
  readonly height: string;
  readonly paddingX: string;
  readonly paddingY: string;
  readonly fontSize: string;
  readonly lineHeight: number | string;
  readonly iconSize: string;
  readonly iconGap: string;
}

/** Border tokens across states */
export interface ControlBorderTokens {
  readonly width: string;
  readonly radius: string;
  readonly colorDefault: string;
  readonly colorHover: string;
  readonly colorFocus: string;
  readonly colorDisabled: string;
  readonly colorReadOnly: string;
  readonly colorInvalid: string;
}

/** Focus ring tokens */
export interface ControlFocusTokens {
  readonly ringWidth: string;
  readonly ringOffset: string;
  readonly ringColor: string;
  readonly innerRingColor: string;
}

/** Disabled state tokens */
export interface ControlDisabledTokens {
  readonly opacity: string;
  readonly background: string;
  readonly text: string;
  readonly border: string;
}

/** Read-only state tokens */
export interface ControlReadOnlyTokens {
  readonly background: string;
  readonly text: string;
  readonly border: string;
}

/** Loading state tokens */
export interface ControlLoadingTokens {
  readonly opacity: string;
  readonly text: string;
}

/** Transition tokens */
export interface ControlTransitionTokens {
  readonly duration: string;
  readonly easing: string;
  readonly properties: string;
}

/** Complete shared control contract */
export interface SharedControlTokens {
  readonly size: {
    readonly xs: ControlSizeTokens;
    readonly sm: ControlSizeTokens;
    readonly md: ControlSizeTokens;
    readonly lg: ControlSizeTokens;
    readonly xl: ControlSizeTokens;
  };
  readonly border: ControlBorderTokens;
  readonly focus: ControlFocusTokens;
  readonly disabled: ControlDisabledTokens;
  readonly readOnly: ControlReadOnlyTokens;
  readonly loading: ControlLoadingTokens;
  readonly transition: ControlTransitionTokens;
  readonly typography: {
    readonly fontFamily: string;
    readonly fontWeight: string | number;
    readonly letterSpacing: string;
  };
}

// ─── Default Values ──────────────────────────────────────────────────

export const sharedControlTokens: SharedControlTokens = {
  size: {
    xs: {
      height: controlHeight.xs,
      paddingX: spacing["2"],
      paddingY: spacing["0.5"],
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
      iconSize: iconSize.xs,
      iconGap: spacing["1"],
    },
    sm: {
      height: controlHeight.sm,
      paddingX: spacing["2.5"],
      paddingY: spacing["1"],
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      iconSize: iconSize.sm,
      iconGap: spacing["1"],
    },
    md: {
      height: controlHeight.md,
      paddingX: spacing["3"],
      paddingY: spacing["1.5"],
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      iconSize: iconSize.md,
      iconGap: spacing["1.5"],
    },
    lg: {
      height: controlHeight.lg,
      paddingX: spacing["4"],
      paddingY: spacing["2"],
      fontSize: fontSize.lg,
      lineHeight: lineHeight.normal,
      iconSize: iconSize.lg,
      iconGap: spacing["2"],
    },
    xl: {
      height: controlHeight.xl,
      paddingX: spacing["5"],
      paddingY: spacing["2.5"],
      fontSize: fontSize.lg,
      lineHeight: lineHeight.normal,
      iconSize: iconSize.lg,
      iconGap: spacing["2"],
    },
  },
  border: {
    width: borderWidth.default,
    radius: radius.md,
    colorDefault: lightTheme.color.border.default,
    colorHover: lightTheme.color.border.interactive,
    colorFocus: lightTheme.color.border.focus,
    colorDisabled: lightTheme.color.border.disabled,
    colorReadOnly: lightTheme.color.border.default,
    colorInvalid: lightTheme.color.status.error.border,
  },
  focus: {
    ringWidth: focusRing.width,
    ringOffset: focusRing.offset,
    ringColor: lightTheme.color.focus.ring,
    innerRingColor: lightTheme.color.focus.innerRing,
  },
  disabled: {
    opacity: "0.6",
    background: neutral["100"],
    text: neutral["400"],
    border: neutral["200"],
  },
  readOnly: {
    background: neutral["50"],
    text: neutral["700"],
    border: neutral["200"],
  },
  loading: {
    opacity: "0.7",
    text: neutral["500"],
  },
  transition: {
    duration: duration.fast,
    easing: easing.default,
    properties: "color, background-color, border-color, box-shadow, opacity",
  },
  typography: {
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
} as const;
