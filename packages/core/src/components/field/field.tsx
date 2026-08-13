import { createElement, useCallback, useMemo, useState, forwardRef } from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { useId } from "@kairoui/hooks";
import { FieldContext } from "./field-context";
import type { FieldContextValue, ValidationState } from "./field-context";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Consumer-provided base ID. If omitted, a stable ID is generated. */
  id?: string;
  /** Disables all controls within this field. */
  disabled?: boolean;
  /** Makes all controls within this field read-only. */
  readOnly?: boolean;
  /** Marks the field as required. */
  required?: boolean;
  /** Validation state. When "invalid", triggers error display. */
  validationState?: ValidationState;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(props, ref) {
  const {
    children,
    id: providedId,
    disabled = false,
    readOnly = false,
    required = false,
    validationState,
    ...restProps
  } = props;

  const fieldId = useId(providedId, { prefix: "kui-field" });
  const labelId = `${fieldId}-label`;
  const descriptionId = `${fieldId}-desc`;
  const errorId = `${fieldId}-error`;

  const [hasLabel, setHasLabel] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const [hasError, setHasError] = useState(false);

  const registerLabel = useCallback(() => {
    setHasLabel(true);
    return () => {
      setHasLabel(false);
    };
  }, []);

  const registerDescription = useCallback(() => {
    setHasDescription(true);
    return () => {
      setHasDescription(false);
    };
  }, []);

  const registerError = useCallback(() => {
    setHasError(true);
    return () => {
      setHasError(false);
    };
  }, []);

  const invalid = validationState === "invalid";

  const ctx: FieldContextValue = useMemo(
    () => ({
      fieldId,
      labelId,
      descriptionId,
      errorId,
      disabled,
      readOnly,
      required,
      invalid,
      hasLabel,
      hasDescription,
      hasError,
      registerLabel,
      registerDescription,
      registerError,
    }),
    [
      fieldId,
      labelId,
      descriptionId,
      errorId,
      disabled,
      readOnly,
      required,
      invalid,
      hasLabel,
      hasDescription,
      hasError,
      registerLabel,
      registerDescription,
      registerError,
    ],
  );

  return createElement(
    FieldContext.Provider,
    { value: ctx },
    createElement(
      "div",
      {
        ...restProps,
        ref,
        "data-kui-component": "Field",
        ...(invalid ? { "data-invalid": "" } : undefined),
        ...(disabled ? { "data-disabled": "" } : undefined),
      },
      children,
    ),
  );
});
