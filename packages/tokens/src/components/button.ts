/**
 * Button Component Token Contract
 *
 * Defines all design decisions for the Button component without implementing it.
 * References shared control tokens for inherited properties and semantic tokens
 * for color decisions.
 *
 * ## Visual Hierarchy (highest to lowest emphasis)
 *
 * 1. Primary — filled brand background, highest visual weight. One primary per section.
 * 2. Destructive — filled danger background, for irreversible actions.
 * 3. Secondary — subtle filled background, moderate emphasis.
 * 4. Outline — transparent with visible border, low emphasis.
 * 5. Ghost — transparent, no border, minimal emphasis (toolbars, inline actions).
 */

import { sharedControlTokens } from "../controls";
import { neutral, blue, red } from "../primitives/colors";
import { spacing } from "../primitives/spacing";
import { radius } from "../primitives/borders";

// ─── Types ───────────────────────────────────────────────────────────

/** Colors for a single button state */
export interface ButtonStateColors {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly icon: string;
}

/** All states for a single button variant */
export interface ButtonVariantTokens {
  readonly default: ButtonStateColors;
  readonly hover: ButtonStateColors;
  readonly active: ButtonStateColors;
  readonly focus: ButtonStateColors;
  readonly disabled: ButtonStateColors;
  readonly loading: ButtonStateColors;
}

/** Per-size button dimensions */
export interface ButtonSizeTokens {
  readonly height: string;
  readonly paddingX: string;
  readonly gap: string;
  readonly fontSize: string;
  readonly iconSize: string;
}

/** Complete button token contract */
export interface ButtonContract {
  readonly variant: {
    readonly primary: ButtonVariantTokens;
    readonly secondary: ButtonVariantTokens;
    readonly outline: ButtonVariantTokens;
    readonly ghost: ButtonVariantTokens;
    readonly destructive: ButtonVariantTokens;
  };
  readonly size: {
    readonly sm: ButtonSizeTokens;
    readonly md: ButtonSizeTokens;
    readonly lg: ButtonSizeTokens;
  };
  readonly radius: string;
  readonly focusRing: {
    readonly width: string;
    readonly offset: string;
    readonly color: string;
  };
  readonly transition: {
    readonly duration: string;
    readonly easing: string;
    readonly properties: string;
  };
}

// ─── Default Values ──────────────────────────────────────────────────

const DISABLED: ButtonStateColors = {
  background: sharedControlTokens.disabled.background,
  text: sharedControlTokens.disabled.text,
  border: sharedControlTokens.disabled.border,
  icon: sharedControlTokens.disabled.text,
};

const LOADING_PRIMARY: ButtonStateColors = {
  background: blue["600"],
  text: "#ffffff",
  border: "transparent",
  icon: "#ffffff",
};

export const buttonTokens: ButtonContract = {
  variant: {
    primary: {
      default: { background: blue["600"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
      hover: { background: blue["700"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
      active: { background: blue["800"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
      focus: { background: blue["600"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
      disabled: DISABLED,
      loading: LOADING_PRIMARY,
    },
    secondary: {
      default: {
        background: neutral["100"],
        text: neutral["800"],
        border: "transparent",
        icon: neutral["600"],
      },
      hover: {
        background: neutral["200"],
        text: neutral["900"],
        border: "transparent",
        icon: neutral["700"],
      },
      active: {
        background: neutral["300"],
        text: neutral["900"],
        border: "transparent",
        icon: neutral["800"],
      },
      focus: {
        background: neutral["100"],
        text: neutral["800"],
        border: "transparent",
        icon: neutral["600"],
      },
      disabled: DISABLED,
      loading: {
        background: neutral["100"],
        text: neutral["500"],
        border: "transparent",
        icon: neutral["500"],
      },
    },
    outline: {
      default: {
        background: "transparent",
        text: neutral["800"],
        border: neutral["300"],
        icon: neutral["600"],
      },
      hover: {
        background: neutral["50"],
        text: neutral["900"],
        border: neutral["400"],
        icon: neutral["700"],
      },
      active: {
        background: neutral["100"],
        text: neutral["900"],
        border: neutral["400"],
        icon: neutral["800"],
      },
      focus: {
        background: "transparent",
        text: neutral["800"],
        border: blue["500"],
        icon: neutral["600"],
      },
      disabled: DISABLED,
      loading: {
        background: "transparent",
        text: neutral["500"],
        border: neutral["200"],
        icon: neutral["500"],
      },
    },
    ghost: {
      default: {
        background: "transparent",
        text: neutral["700"],
        border: "transparent",
        icon: neutral["500"],
      },
      hover: {
        background: neutral["100"],
        text: neutral["900"],
        border: "transparent",
        icon: neutral["700"],
      },
      active: {
        background: neutral["200"],
        text: neutral["900"],
        border: "transparent",
        icon: neutral["800"],
      },
      focus: {
        background: "transparent",
        text: neutral["700"],
        border: "transparent",
        icon: neutral["500"],
      },
      disabled: {
        background: "transparent",
        text: neutral["400"],
        border: "transparent",
        icon: neutral["400"],
      },
      loading: {
        background: "transparent",
        text: neutral["500"],
        border: "transparent",
        icon: neutral["500"],
      },
    },
    destructive: {
      default: { background: red["600"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
      hover: { background: red["700"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
      active: { background: red["800"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
      focus: { background: red["600"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
      disabled: DISABLED,
      loading: { background: red["600"], text: "#ffffff", border: "transparent", icon: "#ffffff" },
    },
  },
  size: {
    sm: {
      height: sharedControlTokens.size.sm.height,
      paddingX: spacing["2.5"],
      gap: spacing["1"],
      fontSize: sharedControlTokens.size.sm.fontSize,
      iconSize: sharedControlTokens.size.sm.iconSize,
    },
    md: {
      height: sharedControlTokens.size.md.height,
      paddingX: spacing["3"],
      gap: spacing["1.5"],
      fontSize: sharedControlTokens.size.md.fontSize,
      iconSize: sharedControlTokens.size.md.iconSize,
    },
    lg: {
      height: sharedControlTokens.size.lg.height,
      paddingX: spacing["4"],
      gap: spacing["2"],
      fontSize: sharedControlTokens.size.lg.fontSize,
      iconSize: sharedControlTokens.size.lg.iconSize,
    },
  },
  radius: radius.md,
  focusRing: {
    width: sharedControlTokens.focus.ringWidth,
    offset: sharedControlTokens.focus.ringOffset,
    color: sharedControlTokens.focus.ringColor,
  },
  transition: {
    duration: sharedControlTokens.transition.duration,
    easing: sharedControlTokens.transition.easing,
    properties: "color, background-color, border-color, box-shadow, opacity",
  },
} as const;
