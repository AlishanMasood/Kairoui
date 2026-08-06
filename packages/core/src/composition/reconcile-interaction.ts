/**
 * Interaction-state reconciliation for the composition layer.
 *
 * Determines whether to use native `disabled`, `aria-disabled`, `readOnly`,
 * `aria-readonly`, or `aria-busy` based on the target element type and
 * the component's interaction state.
 */

/** Elements that support the native `disabled` attribute. */
const NATIVE_DISABLED_ELEMENTS = new Set([
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "fieldset",
]);

/** Elements that support the native `readOnly` attribute. */
const NATIVE_READONLY_ELEMENTS = new Set(["input", "textarea"]);

export interface ReconcileInteractionInput {
  /** Whether the component is disabled. */
  disabled?: boolean;
  /** Whether the component is read-only. */
  readOnly?: boolean;
  /** Whether the component is in a loading state. */
  loading?: boolean;
  /**
   * The HTML element tag name (lowercase) for the root element.
   * Used to determine native attribute support.
   * If undefined, assumes a non-native element.
   */
  elementType?: string;
}

export interface ReconcileInteractionResult {
  /** Native `disabled` attribute (only for native controls). */
  disabled?: boolean;
  /** Native `readOnly` attribute (only for input/textarea). */
  readOnly?: boolean;
  /** `aria-disabled` for non-native elements or loading state. */
  "aria-disabled"?: "true";
  /** `aria-readonly` for non-native elements. */
  "aria-readonly"?: "true";
  /** `aria-busy` for loading state. */
  "aria-busy"?: "true";
  /** `data-disabled` for CSS targeting. */
  "data-disabled"?: "";
  /** `data-readonly` for CSS targeting. */
  "data-readonly"?: "";
  /** `data-loading` for CSS targeting. */
  "data-loading"?: "";
  /** Whether event handlers should be suppressed. */
  shouldSuppressEvents: boolean;
  /** Guidance for tabIndex adjustment. */
  tabIndexOverride?: number;
}

/**
 * Reconciles interaction state into native attributes, ARIA attributes,
 * data attributes, and behavioral flags.
 *
 * Precedence: disabled > loading > readOnly
 *
 * Native controls (button, input, etc.):
 * - `disabled` → native `disabled` attribute (removes from tab order automatically)
 * - `loading` → `aria-disabled` + `aria-busy` (stays focusable)
 * - `readOnly` → native `readOnly` (input/textarea) or `aria-readonly`
 *
 * Non-native elements (div[role=button], custom widgets):
 * - `disabled` → `aria-disabled` (stays focusable for screen readers)
 * - `loading` → `aria-disabled` + `aria-busy`
 * - `readOnly` → `aria-readonly`
 *
 * All states produce corresponding `data-*` attributes for CSS.
 */
export function reconcileInteractionState(
  input: ReconcileInteractionInput,
): ReconcileInteractionResult {
  const { disabled = false, readOnly = false, loading = false, elementType } = input;
  const isNativeDisabled = elementType != null && NATIVE_DISABLED_ELEMENTS.has(elementType);
  const isNativeReadonly = elementType != null && NATIVE_READONLY_ELEMENTS.has(elementType);

  const result: ReconcileInteractionResult = {
    shouldSuppressEvents: false,
  };

  // Disabled takes highest precedence
  if (disabled) {
    result["data-disabled"] = "";
    result.shouldSuppressEvents = !isNativeDisabled;

    if (isNativeDisabled) {
      result.disabled = true;
    } else {
      result["aria-disabled"] = "true";
    }

    return result;
  }

  // Loading implies disabled behavior with aria-busy
  if (loading) {
    result["data-loading"] = "";
    result["aria-disabled"] = "true";
    result["aria-busy"] = "true";
    result.shouldSuppressEvents = true;
    return result;
  }

  // Read-only: focusable, visible, not editable
  if (readOnly) {
    result["data-readonly"] = "";

    if (isNativeReadonly) {
      result.readOnly = true;
    } else {
      result["aria-readonly"] = "true";
    }

    return result;
  }

  return result;
}
