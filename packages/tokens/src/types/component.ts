/**
 * Component token collection contracts.
 *
 * Component tokens define the design decisions specific to individual UI components.
 * They reference semantic tokens (or primitives where no semantic equivalent exists).
 *
 * These contracts define the INTERFACE, not the implementation.
 * In Phase 2, they exist without corresponding component implementations.
 */

import type { TokenRef } from "./references";

// ─── Interaction States ──────────────────────────────────────────────

/**
 * Approved interaction state suffixes for component tokens.
 * Used to constrain which states are valid in component token definitions.
 */
export type InteractionState =
  | "default"
  | "hover"
  | "active"
  | "focus"
  | "selected"
  | "disabled"
  | "readOnly"
  | "loading"
  | "invalid"
  | "valid"
  | "dragging";

// ─── Component Token Contracts ───────────────────────────────────────

/** Button component tokens */
export interface ButtonTokens {
  readonly primary: {
    readonly background: TokenRef;
    readonly backgroundHover: TokenRef;
    readonly backgroundActive: TokenRef;
    readonly text: TokenRef;
    readonly border: TokenRef;
  };
  readonly secondary: {
    readonly background: TokenRef;
    readonly backgroundHover: TokenRef;
    readonly backgroundActive: TokenRef;
    readonly text: TokenRef;
    readonly border: TokenRef;
  };
  readonly ghost: {
    readonly background: TokenRef;
    readonly backgroundHover: TokenRef;
    readonly backgroundActive: TokenRef;
    readonly text: TokenRef;
  };
  readonly destructive: {
    readonly background: TokenRef;
    readonly backgroundHover: TokenRef;
    readonly backgroundActive: TokenRef;
    readonly text: TokenRef;
  };
  readonly disabled: {
    readonly background: TokenRef;
    readonly text: TokenRef;
    readonly border: TokenRef;
  };
  readonly size: {
    readonly sm: {
      readonly height: TokenRef;
      readonly paddingX: TokenRef;
      readonly fontSize: TokenRef;
    };
    readonly md: {
      readonly height: TokenRef;
      readonly paddingX: TokenRef;
      readonly fontSize: TokenRef;
    };
    readonly lg: {
      readonly height: TokenRef;
      readonly paddingX: TokenRef;
      readonly fontSize: TokenRef;
    };
  };
  readonly radius: TokenRef;
  readonly focusRing: TokenRef;
}

/** Input component tokens */
export interface InputTokens {
  readonly background: TokenRef;
  readonly backgroundDisabled: TokenRef;
  readonly text: TokenRef;
  readonly textPlaceholder: TokenRef;
  readonly border: TokenRef;
  readonly borderHover: TokenRef;
  readonly borderFocus: TokenRef;
  readonly borderInvalid: TokenRef;
  readonly radius: TokenRef;
  readonly focusRing: TokenRef;
  readonly size: {
    readonly sm: {
      readonly height: TokenRef;
      readonly paddingX: TokenRef;
      readonly fontSize: TokenRef;
    };
    readonly md: {
      readonly height: TokenRef;
      readonly paddingX: TokenRef;
      readonly fontSize: TokenRef;
    };
    readonly lg: {
      readonly height: TokenRef;
      readonly paddingX: TokenRef;
      readonly fontSize: TokenRef;
    };
  };
}

/** Dialog component tokens */
export interface DialogTokens {
  readonly background: TokenRef;
  readonly border: TokenRef;
  readonly shadow: TokenRef;
  readonly radius: TokenRef;
  readonly overlay: TokenRef;
}

/** Tab component tokens */
export interface TabTokens {
  readonly text: TokenRef;
  readonly textActive: TokenRef;
  readonly textDisabled: TokenRef;
  readonly indicator: TokenRef;
  readonly indicatorHeight: TokenRef;
  readonly background: TokenRef;
  readonly backgroundHover: TokenRef;
}

// ─── Full Component Collection ───────────────────────────────────────

/**
 * Complete component token collection.
 *
 * Each component defines its design decisions as references to
 * semantic tokens (or primitives where no semantic equivalent exists).
 */
export interface ComponentTokens {
  readonly button: ButtonTokens;
  readonly input: InputTokens;
  readonly dialog: DialogTokens;
  readonly tab: TabTokens;
}
