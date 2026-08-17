import { createElement, forwardRef, useCallback, useRef } from "react";
import type { HTMLAttributes, InputHTMLAttributes, ButtonHTMLAttributes } from "react";
import { useControllableState, useId, useMergedRefs } from "@kairoui/hooks";
import { useFieldContext } from "../field/field-context";

export type NumberInputSize = "sm" | "md" | "lg";

export interface NumberInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Controlled numeric value. */
  value?: number;
  /** Initial value for uncontrolled mode. */
  defaultValue?: number;
  /** Called when value changes. */
  onValueChange?: (value: number | undefined) => void;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  /** Step amount for increment/decrement. Defaults to 1. */
  step?: number;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Whether the input is read-only. */
  readOnly?: boolean;
  /** Whether a value is required. */
  required?: boolean;
  /** Form submission name. */
  name?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Size variant. */
  size?: NumberInputSize;
  /** Input element ID. */
  id?: string;
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  let result = value;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

function getPrecision(step: number): number {
  const str = String(step);
  const dotIndex = str.indexOf(".");
  if (dotIndex === -1) return 0;
  return str.length - dotIndex - 1;
}

function roundToPrecision(value: number, precision: number): number {
  if (precision === 0) return Math.round(value);
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(props, ref) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      min,
      max,
      step = 1,
      disabled,
      readOnly,
      required,
      name,
      placeholder,
      size = "md",
      id,
      className,
      ...restProps
    } = props;

    const fieldCtx = useFieldContext();
    const generatedId = useId(undefined, { prefix: "kui-num" });
    const resolvedDisabled = disabled ?? fieldCtx?.disabled ?? false;
    const resolvedReadOnly = readOnly ?? fieldCtx?.readOnly ?? false;
    const resolvedRequired = required ?? fieldCtx?.required ?? false;
    const resolvedId = id ?? fieldCtx?.fieldId ?? generatedId;

    const [numericValue, setNumericValue] = useControllableState<number | undefined>({
      value: controlledValue,
      defaultValue: defaultValue ?? undefined,
      ...(onValueChange ? { onChange: onValueChange } : undefined),
      name: "NumberInput",
      state: "value",
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = useMergedRefs(ref, inputRef);
    const precision = getPrecision(step);

    const updateValue = useCallback(
      (next: number | undefined) => {
        if (next === undefined) {
          setNumericValue(undefined);
          return;
        }
        const clamped = clamp(next, min, max);
        const rounded = roundToPrecision(clamped, precision);
        setNumericValue(rounded);
      },
      [min, max, precision, setNumericValue],
    );

    const increment = useCallback(() => {
      if (resolvedDisabled || resolvedReadOnly) return;
      const current = numericValue ?? min ?? 0;
      updateValue(current + step);
    }, [numericValue, step, min, resolvedDisabled, resolvedReadOnly, updateValue]);

    const decrement = useCallback(() => {
      if (resolvedDisabled || resolvedReadOnly) return;
      const current = numericValue ?? max ?? 0;
      updateValue(current - step);
    }, [numericValue, step, max, resolvedDisabled, resolvedReadOnly, updateValue]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        if (text === "" || text === "-") {
          setNumericValue(undefined);
          return;
        }
        const parsed = parseFloat(text);
        if (!Number.isNaN(parsed)) {
          updateValue(parsed);
        }
      },
      [setNumericValue, updateValue],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (resolvedDisabled || resolvedReadOnly) return;
        if (e.key === "ArrowUp") {
          e.preventDefault();
          increment();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          decrement();
        }
      },
      [resolvedDisabled, resolvedReadOnly, increment, decrement],
    );

    const handleBlur = useCallback(() => {
      // Clamp on blur
      if (numericValue !== undefined) {
        updateValue(numericValue);
      }
    }, [numericValue, updateValue]);

    const variantClasses = ["kui-number-input"];
    if (size !== "md") variantClasses.push(`kui-number-input--${size}`);
    if (className) variantClasses.push(className);

    const atMin = min !== undefined && numericValue !== undefined && numericValue <= min;
    const atMax = max !== undefined && numericValue !== undefined && numericValue >= max;

    return createElement(
      "div",
      {
        ...restProps,
        className: variantClasses.join(" "),
        "data-kui-component": "NumberInput",
        ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
        ...(fieldCtx?.invalid ? { "data-invalid": "" } : undefined),
      },
      // Decrement button
      createElement(
        "button",
        {
          type: "button",
          tabIndex: -1,
          "aria-label": "Decrement",
          disabled: resolvedDisabled || resolvedReadOnly || atMin,
          onClick: decrement,
          "data-kui-component": "NumberInputDecrement",
        } as ButtonHTMLAttributes<HTMLButtonElement>,
        "−",
      ),
      // Native input
      createElement("input", {
        ref: mergedRef,
        type: "text",
        inputMode: "decimal",
        id: resolvedId,
        name,
        value: numericValue !== undefined ? String(numericValue) : "",
        placeholder,
        disabled: resolvedDisabled,
        readOnly: resolvedReadOnly,
        required: resolvedRequired,
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": numericValue,
        "aria-invalid": fieldCtx?.invalid ? "true" : undefined,
        "aria-required": resolvedRequired ? "true" : undefined,
        role: "spinbutton",
        autoComplete: "off",
        onChange: handleInputChange,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        "data-kui-component": "NumberInputField",
        ...(fieldCtx?.hasLabel ? { "aria-labelledby": fieldCtx.labelId } : undefined),
        ...(fieldCtx?.hasDescription || fieldCtx?.hasError
          ? {
              "aria-describedby": [
                fieldCtx.hasDescription ? fieldCtx.descriptionId : "",
                fieldCtx.hasError ? fieldCtx.errorId : "",
              ]
                .filter(Boolean)
                .join(" "),
            }
          : undefined),
      } as InputHTMLAttributes<HTMLInputElement>),
      // Increment button
      createElement(
        "button",
        {
          type: "button",
          tabIndex: -1,
          "aria-label": "Increment",
          disabled: resolvedDisabled || resolvedReadOnly || atMax,
          onClick: increment,
          "data-kui-component": "NumberInputIncrement",
        } as ButtonHTMLAttributes<HTMLButtonElement>,
        "+",
      ),
    );
  },
);
