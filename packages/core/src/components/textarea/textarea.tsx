import { createElement, forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { componentClass } from "../../composition/class-generation";
import { useFieldContext } from "../field/field-context";
import { resolveFieldControlProps } from "../field/field-control-props";
import { textareaStyleContract } from "./textarea.styles";

export type TextareaSize = "sm" | "md" | "lg";
export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Size variant. */
  size?: TextareaSize;
  /** Resize behavior. Defaults to "vertical". */
  resize?: TextareaResize;
}

const COMPONENT_NAME = textareaStyleContract.name;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    const {
      size = "md",
      resize = "vertical",
      className,
      id,
      disabled,
      readOnly,
      required,
      style,
      ...restProps
    } = props;
    const ctx = useFieldContext();
    const fieldProps = resolveFieldControlProps(ctx, "textarea");

    const variantClasses: string[] = [componentClass(COMPONENT_NAME)];
    if (size !== "md") {
      variantClasses.push(`kui-textarea--${size}`);
    }
    if (className) {
      variantClasses.push(className);
    }

    const resolvedId = id ?? (fieldProps["id"] as string | undefined);
    const resolvedDisabled = disabled ?? (fieldProps["disabled"] as boolean | undefined);
    const resolvedReadOnly = readOnly ?? (fieldProps["readOnly"] as boolean | undefined);
    const resolvedRequired = required ?? (fieldProps["required"] as boolean | undefined);

    const mergedStyle = resize !== "vertical" ? { ...style, resize } : style;

    return createElement("textarea", {
      ...restProps,
      ...fieldProps,
      ref,
      id: resolvedId,
      disabled: resolvedDisabled,
      readOnly: resolvedReadOnly,
      required: resolvedRequired,
      className: variantClasses.join(" "),
      style: mergedStyle,
      "data-kui-component": "Textarea",
      ...(ctx?.invalid ? { "data-invalid": "" } : undefined),
      ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
      ...(resolvedReadOnly ? { "data-readonly": "" } : undefined),
    });
  },
);
