import { createElement, forwardRef, useCallback } from "react";
import type { ReactNode, InputHTMLAttributes } from "react";
import { useControllableState } from "@kairoui/hooks";
import { componentClass, slotClass } from "../../composition/class-generation";
import { useFieldContext } from "../field/field-context";
import { useRadioGroupContext } from "../selection/selection-context";
import { radioStyleContract } from "./radio.styles";

export type RadioSize = "sm" | "md" | "lg";

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type" | "checked" | "defaultChecked" | "onChange"
> {
  /** Controlled checked state (standalone usage). */
  checked?: boolean;
  /** Initial checked for uncontrolled standalone usage. */
  defaultChecked?: boolean;
  /** Called when selection changes (standalone). */
  onCheckedChange?: (checked: boolean) => void;
  /** Size variant. */
  size?: RadioSize;
  /** Form value submitted when selected. */
  value?: string;
  /** Label content rendered beside the radio. */
  children?: ReactNode;
}

const COMPONENT_NAME = radioStyleContract.name;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(props, ref) {
  const {
    checked: controlledChecked,
    defaultChecked = false,
    onCheckedChange,
    size = "md",
    children,
    className,
    disabled,
    required,
    name,
    value = "on",
    id,
    ...restProps
  } = props;

  const ctx = useFieldContext();
  const groupCtx = useRadioGroupContext();

  // Resolve state from group context or own props
  const isGrouped = groupCtx !== null;
  const groupChecked = isGrouped ? groupCtx.value === value : undefined;

  const resolvedDisabled = disabled ?? groupCtx?.disabled ?? ctx?.disabled ?? false;
  const resolvedRequired = required ?? groupCtx?.required ?? ctx?.required ?? false;
  const resolvedName = name ?? groupCtx?.name;
  const resolvedId = id ?? ctx?.fieldId;

  const [isChecked, setChecked] = useControllableState({
    value: isGrouped ? groupChecked : controlledChecked,
    defaultValue: defaultChecked,
    ...(isGrouped
      ? {
          onChange: () => {
            groupCtx.onValueChange(value);
          },
        }
      : onCheckedChange
        ? { onChange: onCheckedChange }
        : undefined),
    name: "Radio",
    state: "checked",
  });

  const handleChange = useCallback(() => {
    if (resolvedDisabled) return;
    if (!isChecked) {
      setChecked(true);
    }
  }, [isChecked, setChecked, resolvedDisabled]);

  const variantClasses: string[] = [componentClass(COMPONENT_NAME)];
  if (size !== "md") {
    variantClasses.push(`kui-radio--${size}`);
  }
  if (className) {
    variantClasses.push(className);
  }

  return createElement(
    "label",
    {
      className: variantClasses.join(" "),
      "data-kui-component": "Radio",
      "data-state": isChecked ? "checked" : "unchecked",
      ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
      ...(ctx?.invalid ? { "data-invalid": "" } : undefined),
    },
    // Hidden native radio input
    createElement("input", {
      ...restProps,
      ref,
      type: "radio",
      id: resolvedId,
      name: resolvedName,
      value,
      checked: isChecked,
      disabled: resolvedDisabled,
      required: resolvedRequired,
      onChange: handleChange,
      className: slotClass(COMPONENT_NAME, "input"),
      ...(ctx?.hasLabel ? { "aria-labelledby": ctx.labelId } : undefined),
      ...(ctx?.hasDescription || ctx?.hasError
        ? {
            "aria-describedby": [
              ctx.hasDescription ? ctx.descriptionId : "",
              ctx.hasError ? ctx.errorId : "",
            ]
              .filter(Boolean)
              .join(" "),
          }
        : undefined),
      ...(ctx?.invalid ? { "aria-invalid": "true" } : undefined),
    }),
    // Visual control circle
    createElement(
      "span",
      {
        className: slotClass(COMPONENT_NAME, "control"),
        "aria-hidden": "true",
        "data-state": isChecked ? "checked" : "unchecked",
      },
      isChecked && createElement("span", { className: slotClass(COMPONENT_NAME, "indicator") }),
    ),
    // Label content
    children != null && createElement("span", null, children),
  );
});
