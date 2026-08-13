import { createContext, useContext } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export type ValidationState = "valid" | "invalid";

export interface FieldContextValue {
  // Generated IDs for ARIA relationships
  fieldId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;

  // State flags propagated to controls
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;

  // Presence tracking — controls must know which slots are rendered
  hasLabel: boolean;
  hasDescription: boolean;
  hasError: boolean;

  // Registration callbacks — called by Label/Description/Error on mount
  registerLabel: () => () => void;
  registerDescription: () => () => void;
  registerError: () => () => void;
}

// ─── Context ────────────────────────────────────────────────────────

export const FieldContext = createContext<FieldContextValue | null>(null);
FieldContext.displayName = "FieldContext";

// ─── Consumer hook ──────────────────────────────────────────────────

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

/**
 * Throws if used outside a Field. Use for controls that require a Field wrapper.
 */
export function useRequiredFieldContext(componentName: string): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (ctx === null) {
    throw new Error(`[KairoUI] <${componentName}> must be used inside a <Field> component.`);
  }
  return ctx;
}
