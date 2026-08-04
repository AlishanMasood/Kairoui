import { useId } from "./use-id";
import { mergeAriaTokenList } from "@kairoui/utils";

export interface UseAccessibilityRelationshipsOptions {
  /** Consumer-provided ID. If set, used as the base ID. */
  id?: string;
  /** Whether a description element exists. */
  hasDescription?: boolean;
  /** Whether an error message element exists. */
  hasError?: boolean;
  /** Whether a label element exists. */
  hasLabel?: boolean;
  /** Consumer-provided aria-labelledby (merged, not overwritten). */
  labelledBy?: string;
  /** Consumer-provided aria-describedby (merged, not overwritten). */
  describedBy?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Whether the field is invalid. */
  invalid?: boolean;
}

export interface AccessibilityRelationships {
  /** The base ID for the field/control. */
  fieldId: string;
  /** ID for the label element. */
  labelId: string;
  /** ID for the description element. */
  descriptionId: string;
  /** ID for the error message element. */
  errorId: string;
  /** ID for a group wrapper if needed. */
  groupId: string;
  /** Value for aria-labelledby (includes consumer + generated label). */
  ariaLabelledBy: string | undefined;
  /** Value for aria-describedby (includes consumer + description/error). */
  ariaDescribedBy: string | undefined;
  /** Value for aria-errormessage. */
  ariaErrorMessage: string | undefined;
  /** Whether the field is required (for aria-required). */
  ariaRequired: boolean | undefined;
  /** Whether the field is invalid (for aria-invalid). */
  ariaInvalid: boolean | undefined;
}

/**
 * Hook for generating deterministic accessibility IDs and relationships.
 *
 * - Preserves consumer-provided IDs (never overwrites).
 * - Merges consumer aria-labelledby/describedby with generated IDs.
 * - SSR-safe (uses React's useId for deterministic generation).
 * - Does not make component assumptions beyond generic field patterns.
 */
export function useAccessibilityRelationships(
  options: UseAccessibilityRelationshipsOptions = {},
): AccessibilityRelationships {
  const {
    id,
    hasDescription = false,
    hasError = false,
    hasLabel = false,
    labelledBy,
    describedBy,
    required,
    invalid,
  } = options;

  const generatedId = useId(id, { prefix: "kui-field" });

  const fieldId = generatedId;
  const labelId = `${generatedId}-label`;
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;
  const groupId = `${generatedId}-group`;

  // Build aria-labelledby: consumer value + label ID if label exists
  const ariaLabelledBy = mergeAriaTokenList(labelledBy, hasLabel ? labelId : undefined);

  // Build aria-describedby: consumer value + description + error
  const ariaDescribedBy = mergeAriaTokenList(
    describedBy,
    hasDescription ? descriptionId : undefined,
    hasError ? errorId : undefined,
  );

  // aria-errormessage only when error exists
  const ariaErrorMessage = hasError ? errorId : undefined;

  return {
    fieldId,
    labelId,
    descriptionId,
    errorId,
    groupId,
    ariaLabelledBy,
    ariaDescribedBy,
    ariaErrorMessage,
    ariaRequired: required,
    ariaInvalid: invalid,
  };
}
