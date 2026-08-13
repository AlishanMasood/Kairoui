import { createElement, forwardRef, useRef, useEffect, useCallback } from "react";
import type { ReactNode, InputHTMLAttributes } from "react";
import { useControllableState, useMergedRefs } from "@kairoui/hooks";
import { componentClass, slotClass } from "../../composition/class-generation";
import { useFieldContext } from "../field/field-context";
import { checkboxStyleContract } from "./checkbox.styles";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type" | "checked" | "defaultChecked" | "onChange"
> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state for uncontrolled mode. */
  defaultChecked?: boolean;
  /** Whether the checkbox is in indeterminate state. */
  indeterminate?: boolean;
  /** Called when checked state changes. */
  onCheckedChange?: (checked: boolean) => void;
  /** Size variant. */
  size?: CheckboxSize;
  /** Label content rendered beside the checkbox. */
  children?: ReactNode;
}

const COMPONENT_NAME = checkboxStyleContract.name;

// Simple check/indeterminate indicator SVGs
const CheckIcon = () =>
  createElement(
    "svg",
    { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", "aria-hidden": "true" },
    createElement("path", {
      d: "M10 3L4.5 8.5L2 6",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
  );

const IndeterminateIcon = () =>
  createElement(
    "svg",
    { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", "aria-hidden": "true" },
    createElement("path", {
      d: "M2.5 6H9.5",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
    }),
  );

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, ref) {
  const {
    checked: controlledChecked,
    defaultChecked = false,
    indeterminate = false,
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
  const resolvedDisabled = disabled ?? ctx?.disabled ?? false;
  const resolvedRequired = required ?? ctx?.required ?? false;
  const resolvedId = id ?? ctx?.fieldId;

  const [isChecked, setChecked] = useControllableState({
    value: controlledChecked,
    defaultValue: defaultChecked,
    ...(onCheckedChange ? { onChange: onCheckedChange } : undefined),
    name: "Checkbox",
    state: "checked",
  });

  const internalRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(ref, internalRef);

  // Sync indeterminate property (not an HTML attribute, must be set imperatively)
  useEffect(() => {
    const el = internalRef.current;
    if (el) {
      el.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = useCallback(() => {
    if (resolvedDisabled) return;
    setChecked(!isChecked);
  }, [isChecked, setChecked, resolvedDisabled]);

  const variantClasses: string[] = [componentClass(COMPONENT_NAME)];
  if (size !== "md") {
    variantClasses.push(`kui-checkbox--${size}`);
  }
  if (className) {
    variantClasses.push(className);
  }

  const showIndicator = isChecked || indeterminate;

  return createElement(
    "label",
    {
      className: variantClasses.join(" "),
      "data-kui-component": "Checkbox",
      "data-state": indeterminate ? "indeterminate" : isChecked ? "checked" : "unchecked",
      ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
      ...(ctx?.invalid ? { "data-invalid": "" } : undefined),
    },
    // Hidden native input for form participation and accessibility
    createElement("input", {
      ...restProps,
      ref: mergedRef,
      type: "checkbox",
      id: resolvedId,
      name,
      value,
      checked: isChecked,
      disabled: resolvedDisabled,
      required: resolvedRequired,
      onChange: handleChange,
      className: slotClass(COMPONENT_NAME, "input"),
      "aria-checked": indeterminate ? "mixed" : isChecked,
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
    // Visual control box
    createElement(
      "span",
      {
        className: slotClass(COMPONENT_NAME, "control"),
        "aria-hidden": "true",
        "data-state": indeterminate ? "indeterminate" : isChecked ? "checked" : "unchecked",
      },
      showIndicator &&
        createElement(
          "span",
          { className: slotClass(COMPONENT_NAME, "indicator") },
          indeterminate ? createElement(IndeterminateIcon) : createElement(CheckIcon),
        ),
    ),
    // Label content
    children != null && createElement("span", null, children),
  );
});
