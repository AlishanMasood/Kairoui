import { createElement, forwardRef, useCallback } from "react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { useControllableState } from "@kairoui/hooks";
import { componentClass, slotClass } from "../../composition/class-generation";
import { useFieldContext } from "../field/field-context";
import { switchStyleContract } from "./switch.styles";

export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value"
> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state for uncontrolled mode. */
  defaultChecked?: boolean;
  /** Called when checked state changes. */
  onCheckedChange?: (checked: boolean) => void;
  /** Size variant. */
  size?: SwitchSize;
  /** Form submission name. */
  name?: string;
  /** Form submission value when checked. */
  value?: string;
  /** Label content rendered beside the switch. */
  children?: ReactNode;
}

const COMPONENT_NAME = switchStyleContract.name;

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(props, ref) {
  const {
    checked: controlledChecked,
    defaultChecked = false,
    onCheckedChange,
    size = "md",
    children,
    className,
    disabled,
    name,
    value = "on",
    id,
    type,
    ...restProps
  } = props;

  const ctx = useFieldContext();
  const resolvedDisabled = disabled ?? ctx?.disabled ?? false;
  const resolvedId = id ?? ctx?.fieldId;

  const [isChecked, setChecked] = useControllableState({
    value: controlledChecked,
    defaultValue: defaultChecked,
    ...(onCheckedChange ? { onChange: onCheckedChange } : undefined),
    name: "Switch",
    state: "checked",
  });

  const handleClick = useCallback(() => {
    if (resolvedDisabled) return;
    setChecked(!isChecked);
  }, [isChecked, setChecked, resolvedDisabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (resolvedDisabled) return;
      if (e.key === "Enter") {
        e.preventDefault();
        setChecked(!isChecked);
      }
    },
    [isChecked, setChecked, resolvedDisabled],
  );

  const variantClasses: string[] = [componentClass(COMPONENT_NAME)];
  if (size !== "md") {
    variantClasses.push(`kui-switch--${size}`);
  }
  if (className) {
    variantClasses.push(className);
  }

  return createElement(
    "label",
    {
      className: variantClasses.join(" "),
      "data-kui-component": "Switch",
      "data-state": isChecked ? "checked" : "unchecked",
      ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
      ...(ctx?.invalid ? { "data-invalid": "" } : undefined),
    },
    // Hidden checkbox for native form participation
    name &&
      createElement("input", {
        type: "checkbox",
        name,
        value,
        checked: isChecked,
        disabled: resolvedDisabled,
        onChange: () => {},
        className: slotClass(COMPONENT_NAME, "input"),
        tabIndex: -1,
        "aria-hidden": "true",
      }),
    // The button with role="switch"
    createElement(
      "button",
      {
        ...restProps,
        ref,
        type: type ?? "button",
        id: resolvedId,
        role: "switch",
        "aria-checked": isChecked,
        disabled: resolvedDisabled,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        className: slotClass(COMPONENT_NAME, "track"),
        "data-state": isChecked ? "checked" : "unchecked",
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
      },
      createElement("span", {
        className: slotClass(COMPONENT_NAME, "thumb"),
        "data-state": isChecked ? "checked" : "unchecked",
        "aria-hidden": "true",
      }),
    ),
    // Label content
    children != null && createElement("span", null, children),
  );
});
