import { createElement, forwardRef, useMemo } from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { useFieldContext } from "../field/field-context";
import { RadioGroupContext } from "../selection/selection-context";
import type { RadioGroupContextValue } from "../selection/selection-context";

export type RadioGroupOrientation = "horizontal" | "vertical";

export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Controlled selected value. */
  value?: string;
  /** Initial value for uncontrolled mode. */
  defaultValue?: string;
  /** Called when selection changes. */
  onValueChange?: (value: string) => void;
  /** Shared name for all radios in the group. */
  name?: string;
  /** Disables all radios in the group. */
  disabled?: boolean;
  /** At least one radio must be selected. */
  required?: boolean;
  /** Layout orientation (affects aria-orientation). */
  orientation?: RadioGroupOrientation;
  children?: ReactNode;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(props, ref) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      name: providedName,
      disabled = false,
      required = false,
      orientation = "vertical",
      children,
      id,
      ...restProps
    } = props;

    const ctx = useFieldContext();
    const generatedName = useId(providedName, { prefix: "kui-rg" });
    const resolvedDisabled = disabled || (ctx?.disabled ?? false);
    const resolvedRequired = required || (ctx?.required ?? false);
    const resolvedId = id ?? ctx?.fieldId;

    const [currentValue, setCurrentValue] = useControllableState<string | undefined>({
      value: controlledValue,
      defaultValue: defaultValue ?? undefined,
      ...(onValueChange
        ? { onChange: onValueChange as (value: string | undefined) => void }
        : undefined),
      name: "RadioGroup",
      state: "value",
    });

    const groupCtx: RadioGroupContextValue = useMemo(
      () => ({
        value: currentValue,
        onValueChange: (v: string) => {
          setCurrentValue(v);
        },
        name: generatedName,
        disabled: resolvedDisabled,
        required: resolvedRequired,
      }),
      [currentValue, setCurrentValue, generatedName, resolvedDisabled, resolvedRequired],
    );

    return createElement(
      RadioGroupContext.Provider,
      { value: groupCtx },
      createElement(
        "div",
        {
          ...restProps,
          ref,
          id: resolvedId,
          role: "radiogroup",
          "aria-orientation": orientation,
          "aria-required": resolvedRequired ? "true" : undefined,
          "aria-disabled": resolvedDisabled ? "true" : undefined,
          "data-kui-component": "RadioGroup",
          "data-orientation": orientation,
          ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
          ...(ctx?.invalid ? { "data-invalid": "" } : undefined),
          ...(ctx?.invalid ? { "aria-invalid": "true" } : undefined),
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
          ...(ctx?.hasError ? { "aria-errormessage": ctx.errorId } : undefined),
        },
        children,
      ),
    );
  },
);
