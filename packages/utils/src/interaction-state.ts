export interface InteractionStateInput {
  /** Element is fully disabled (no interaction, no form submission). */
  disabled?: boolean;
  /** Element is read-only (visible, focusable, not editable). */
  readOnly?: boolean;
  /** Element is in a loading state (interaction should be blocked). */
  loading?: boolean;
  /** Whether the element is a native control (button, input, select, textarea). */
  nativeControl?: boolean;
}

export interface InteractionStateResult {
  /** Whether interaction is completely blocked (disabled or loading). */
  isInteractionBlocked: boolean;
  /** Whether the element should use native `disabled` attribute. */
  useNativeDisabled: boolean;
  /** Whether `aria-disabled="true"` should be set. */
  useAriaDisabled: boolean;
  /** Whether `aria-readonly="true"` should be set. */
  useAriaReadOnly: boolean;
  /** Whether `aria-busy="true"` should be set. */
  useAriaBusy: boolean;
  /**
   * Focusability guidance:
   * - "focusable": element should remain in tab order
   * - "not-focusable": element should be removed from tab order
   * - "unchanged": no override needed
   */
  focusability: "focusable" | "not-focusable" | "unchanged";
  /** Whether event handlers should prevent default and stop propagation. */
  shouldPreventEvents: boolean;
}

/**
 * Resolves the interaction state for a component element.
 *
 * State precedence:
 * 1. `disabled` takes highest priority — blocks all interaction.
 * 2. `loading` implies disabled behavior but uses aria-busy instead of native disabled.
 * 3. `readOnly` allows focus and visibility but prevents mutation.
 *
 * For native controls (button, input, select, textarea):
 * - `disabled` → native `disabled` attribute (removes from tab order automatically)
 * - `loading` → `aria-disabled` + `aria-busy` (keeps in tab order for screen readers)
 *
 * For non-native elements (div[role=button], custom widgets):
 * - `disabled` → `aria-disabled` (must manually manage focus and events)
 * - `loading` → `aria-disabled` + `aria-busy`
 */
export function resolveInteractionState(input: InteractionStateInput): InteractionStateResult {
  const { disabled = false, readOnly = false, loading = false, nativeControl = false } = input;

  // Disabled takes highest precedence
  if (disabled) {
    return {
      isInteractionBlocked: true,
      useNativeDisabled: nativeControl,
      useAriaDisabled: !nativeControl,
      useAriaReadOnly: false,
      useAriaBusy: false,
      focusability: nativeControl ? "not-focusable" : "focusable",
      shouldPreventEvents: !nativeControl,
    };
  }

  // Loading implies disabled behavior with aria-busy
  if (loading) {
    return {
      isInteractionBlocked: true,
      useNativeDisabled: false,
      useAriaDisabled: true,
      useAriaReadOnly: false,
      useAriaBusy: true,
      focusability: "focusable",
      shouldPreventEvents: true,
    };
  }

  // Read-only: focusable, visible, not editable
  if (readOnly) {
    return {
      isInteractionBlocked: false,
      useNativeDisabled: false,
      useAriaDisabled: false,
      useAriaReadOnly: true,
      useAriaBusy: false,
      focusability: "unchanged",
      shouldPreventEvents: false,
    };
  }

  // Default: no restrictions
  return {
    isInteractionBlocked: false,
    useNativeDisabled: false,
    useAriaDisabled: false,
    useAriaReadOnly: false,
    useAriaBusy: false,
    focusability: "unchanged",
    shouldPreventEvents: false,
  };
}
