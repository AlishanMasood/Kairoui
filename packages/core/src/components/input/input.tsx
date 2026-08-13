import { createElement, forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { componentClass } from "../../composition/class-generation";
import { useFieldContext } from "../field/field-context";
import { resolveFieldControlProps } from "../field/field-control-props";
import { inputStyleContract } from "./input.styles";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Size variant. */
  size?: InputSize;
}

const COMPONENT_NAME = inputStyleContract.name;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const { size = "md", className, id, disabled, readOnly, required, ...restProps } = props;
  const ctx = useFieldContext();
  const fieldProps = resolveFieldControlProps(ctx, "input");

  const variantClasses: string[] = [componentClass(COMPONENT_NAME)];
  if (size !== "md") {
    variantClasses.push(`kui-input--${size}`);
  }
  if (className) {
    variantClasses.push(className);
  }

  // Consumer props override field context props
  const resolvedId = id ?? (fieldProps["id"] as string | undefined);
  const resolvedDisabled = disabled ?? (fieldProps["disabled"] as boolean | undefined);
  const resolvedReadOnly = readOnly ?? (fieldProps["readOnly"] as boolean | undefined);
  const resolvedRequired = required ?? (fieldProps["required"] as boolean | undefined);

  return createElement("input", {
    ...restProps,
    ...fieldProps,
    ref,
    id: resolvedId,
    disabled: resolvedDisabled,
    readOnly: resolvedReadOnly,
    required: resolvedRequired,
    className: variantClasses.join(" "),
    "data-kui-component": "Input",
    ...(ctx?.invalid ? { "data-invalid": "" } : undefined),
    ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
    ...(resolvedReadOnly ? { "data-readonly": "" } : undefined),
  });
});
