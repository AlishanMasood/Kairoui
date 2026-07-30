/**
 * Form Control Token Contracts
 *
 * Design decisions for form controls without implementing components.
 * All color/state tokens reference semantic values via shared controls.
 *
 * Accessibility: invalid/valid states use border + icon — never color alone.
 */

import { sharedControlTokens } from "../controls";
import { neutral, blue, green, red } from "../primitives/colors";
import { spacing } from "../primitives/spacing";
import { radius } from "../primitives/borders";
import { fontSize, fontWeight } from "../primitives/typography";

// ─── Shared Form State Colors ────────────────────────────────────────

export interface FormControlStateColors {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly placeholder: string;
  readonly icon: string;
}

export interface FormControlStates {
  readonly default: FormControlStateColors;
  readonly hover: FormControlStateColors;
  readonly focus: FormControlStateColors;
  readonly filled: FormControlStateColors;
  readonly disabled: FormControlStateColors;
  readonly readOnly: FormControlStateColors;
  readonly invalid: FormControlStateColors;
  readonly valid: FormControlStateColors;
}

// ─── Input / Textarea ────────────────────────────────────────────────

export interface InputSizeTokens {
  readonly height: string;
  readonly paddingX: string;
  readonly fontSize: string;
  readonly iconSize: string;
}

export interface InputContract {
  readonly states: FormControlStates;
  readonly size: {
    readonly sm: InputSizeTokens;
    readonly md: InputSizeTokens;
    readonly lg: InputSizeTokens;
  };
  readonly radius: string;
  readonly focusRing: { readonly width: string; readonly offset: string; readonly color: string };
  readonly transition: { readonly duration: string; readonly easing: string };
}

// ─── Select ──────────────────────────────────────────────────────────

export interface SelectContract {
  readonly states: FormControlStates;
  readonly size: {
    readonly sm: InputSizeTokens;
    readonly md: InputSizeTokens;
    readonly lg: InputSizeTokens;
  };
  readonly radius: string;
  readonly indicator: { readonly size: string; readonly color: string };
  readonly focusRing: { readonly width: string; readonly offset: string; readonly color: string };
  readonly transition: { readonly duration: string; readonly easing: string };
}

// ─── Checkbox ────────────────────────────────────────────────────────

export interface CheckboxContract {
  readonly size: { readonly sm: string; readonly md: string; readonly lg: string };
  readonly radius: string;
  readonly border: {
    readonly default: string;
    readonly hover: string;
    readonly focus: string;
    readonly disabled: string;
  };
  readonly background: {
    readonly unchecked: string;
    readonly checked: string;
    readonly disabled: string;
    readonly invalid: string;
  };
  readonly checkmark: { readonly color: string; readonly disabledColor: string };
  readonly focusRing: { readonly width: string; readonly offset: string; readonly color: string };
  readonly labelGap: string;
  readonly transition: { readonly duration: string; readonly easing: string };
}

// ─── Radio ───────────────────────────────────────────────────────────

export interface RadioContract {
  readonly size: { readonly sm: string; readonly md: string; readonly lg: string };
  readonly border: {
    readonly default: string;
    readonly hover: string;
    readonly focus: string;
    readonly disabled: string;
  };
  readonly background: {
    readonly unselected: string;
    readonly selected: string;
    readonly disabled: string;
  };
  readonly dot: { readonly color: string; readonly disabledColor: string };
  readonly focusRing: { readonly width: string; readonly offset: string; readonly color: string };
  readonly labelGap: string;
  readonly transition: { readonly duration: string; readonly easing: string };
}

// ─── Switch ──────────────────────────────────────────────────────────

export interface SwitchContract {
  readonly track: {
    readonly width: string;
    readonly height: string;
    readonly radius: string;
    readonly backgroundOff: string;
    readonly backgroundOn: string;
    readonly backgroundDisabled: string;
    readonly border: string;
  };
  readonly thumb: {
    readonly size: string;
    readonly color: string;
    readonly disabledColor: string;
    readonly offset: string;
  };
  readonly focusRing: { readonly width: string; readonly offset: string; readonly color: string };
  readonly labelGap: string;
  readonly transition: { readonly duration: string; readonly easing: string };
}

// ─── Form Field Layout ───────────────────────────────────────────────

export interface FormFieldContract {
  readonly label: {
    readonly fontSize: string;
    readonly fontWeight: string | number;
    readonly color: string;
    readonly disabledColor: string;
    readonly requiredIndicatorColor: string;
    readonly gap: string;
  };
  readonly description: {
    readonly fontSize: string;
    readonly color: string;
    readonly gap: string;
  };
  readonly validation: {
    readonly fontSize: string;
    readonly gap: string;
    readonly errorColor: string;
    readonly errorIcon: string;
    readonly successColor: string;
    readonly successIcon: string;
  };
  readonly spacing: {
    readonly fieldGap: string;
    readonly sectionGap: string;
  };
}

// ─── Combined Form Contracts ─────────────────────────────────────────

export interface FormControlContracts {
  readonly input: InputContract;
  readonly select: SelectContract;
  readonly checkbox: CheckboxContract;
  readonly radio: RadioContract;
  readonly switch: SwitchContract;
  readonly field: FormFieldContract;
}

// ─── Default Values ──────────────────────────────────────────────────

const DEFAULT_STATES: FormControlStates = {
  default: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["300"],
    placeholder: neutral["400"],
    icon: neutral["500"],
  },
  hover: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["400"],
    placeholder: neutral["400"],
    icon: neutral["600"],
  },
  focus: {
    background: "#ffffff",
    text: neutral["900"],
    border: blue["500"],
    placeholder: neutral["400"],
    icon: neutral["600"],
  },
  filled: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["300"],
    placeholder: neutral["400"],
    icon: neutral["600"],
  },
  disabled: {
    background: neutral["100"],
    text: neutral["400"],
    border: neutral["200"],
    placeholder: neutral["300"],
    icon: neutral["400"],
  },
  readOnly: {
    background: neutral["50"],
    text: neutral["700"],
    border: neutral["200"],
    placeholder: neutral["400"],
    icon: neutral["500"],
  },
  invalid: {
    background: "#ffffff",
    text: neutral["900"],
    border: red["500"],
    placeholder: neutral["400"],
    icon: red["500"],
  },
  valid: {
    background: "#ffffff",
    text: neutral["900"],
    border: green["500"],
    placeholder: neutral["400"],
    icon: green["500"],
  },
};

const DEFAULT_FOCUS_RING = {
  width: sharedControlTokens.focus.ringWidth,
  offset: sharedControlTokens.focus.ringOffset,
  color: sharedControlTokens.focus.ringColor,
} as const;

const DEFAULT_TRANSITION = {
  duration: sharedControlTokens.transition.duration,
  easing: sharedControlTokens.transition.easing,
} as const;

export const formControlTokens: FormControlContracts = {
  input: {
    states: DEFAULT_STATES,
    size: {
      sm: {
        height: sharedControlTokens.size.sm.height,
        paddingX: spacing["2.5"],
        fontSize: sharedControlTokens.size.sm.fontSize,
        iconSize: sharedControlTokens.size.sm.iconSize,
      },
      md: {
        height: sharedControlTokens.size.md.height,
        paddingX: spacing["3"],
        fontSize: sharedControlTokens.size.md.fontSize,
        iconSize: sharedControlTokens.size.md.iconSize,
      },
      lg: {
        height: sharedControlTokens.size.lg.height,
        paddingX: spacing["3.5"],
        fontSize: sharedControlTokens.size.lg.fontSize,
        iconSize: sharedControlTokens.size.lg.iconSize,
      },
    },
    radius: radius.md,
    focusRing: DEFAULT_FOCUS_RING,
    transition: DEFAULT_TRANSITION,
  },
  select: {
    states: DEFAULT_STATES,
    size: {
      sm: {
        height: sharedControlTokens.size.sm.height,
        paddingX: spacing["2.5"],
        fontSize: sharedControlTokens.size.sm.fontSize,
        iconSize: sharedControlTokens.size.sm.iconSize,
      },
      md: {
        height: sharedControlTokens.size.md.height,
        paddingX: spacing["3"],
        fontSize: sharedControlTokens.size.md.fontSize,
        iconSize: sharedControlTokens.size.md.iconSize,
      },
      lg: {
        height: sharedControlTokens.size.lg.height,
        paddingX: spacing["3.5"],
        fontSize: sharedControlTokens.size.lg.fontSize,
        iconSize: sharedControlTokens.size.lg.iconSize,
      },
    },
    radius: radius.md,
    indicator: { size: "1rem", color: neutral["500"] },
    focusRing: DEFAULT_FOCUS_RING,
    transition: DEFAULT_TRANSITION,
  },
  checkbox: {
    size: { sm: "1rem", md: "1.25rem", lg: "1.5rem" },
    radius: radius.sm,
    border: {
      default: neutral["300"],
      hover: neutral["400"],
      focus: blue["500"],
      disabled: neutral["200"],
    },
    background: {
      unchecked: "#ffffff",
      checked: blue["600"],
      disabled: neutral["100"],
      invalid: "#ffffff",
    },
    checkmark: { color: "#ffffff", disabledColor: neutral["400"] },
    focusRing: DEFAULT_FOCUS_RING,
    labelGap: spacing["2"],
    transition: DEFAULT_TRANSITION,
  },
  radio: {
    size: { sm: "1rem", md: "1.25rem", lg: "1.5rem" },
    border: {
      default: neutral["300"],
      hover: neutral["400"],
      focus: blue["500"],
      disabled: neutral["200"],
    },
    background: { unselected: "#ffffff", selected: blue["600"], disabled: neutral["100"] },
    dot: { color: "#ffffff", disabledColor: neutral["400"] },
    focusRing: DEFAULT_FOCUS_RING,
    labelGap: spacing["2"],
    transition: DEFAULT_TRANSITION,
  },
  switch: {
    track: {
      width: "2.5rem",
      height: "1.5rem",
      radius: radius.full,
      backgroundOff: neutral["300"],
      backgroundOn: blue["600"],
      backgroundDisabled: neutral["200"],
      border: "transparent",
    },
    thumb: { size: "1.25rem", color: "#ffffff", disabledColor: neutral["100"], offset: "0.125rem" },
    focusRing: DEFAULT_FOCUS_RING,
    labelGap: spacing["2"],
    transition: DEFAULT_TRANSITION,
  },
  field: {
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: neutral["800"],
      disabledColor: neutral["400"],
      requiredIndicatorColor: red["500"],
      gap: spacing["1.5"],
    },
    description: {
      fontSize: fontSize.xs,
      color: neutral["500"],
      gap: spacing["1"],
    },
    validation: {
      fontSize: fontSize.xs,
      gap: spacing["1"],
      errorColor: red["600"],
      errorIcon: red["500"],
      successColor: green["600"],
      successIcon: green["500"],
    },
    spacing: {
      fieldGap: spacing["4"],
      sectionGap: spacing["8"],
    },
  },
} as const;
