import { createElement, forwardRef, useCallback, useRef, useMemo } from "react";
import type { HTMLAttributes, InputHTMLAttributes } from "react";
import { useControllableState } from "@kairoui/hooks";
import { useFieldContext } from "../field/field-context";

export type PinInputMode = "numeric" | "alphanumeric";

export interface PinInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Number of input fields. Defaults to 4. */
  length?: number;
  /** Controlled value string. */
  value?: string;
  /** Initial value. */
  defaultValue?: string;
  /** Called when value changes. */
  onValueChange?: (value: string) => void;
  /** Called when all fields are filled. */
  onComplete?: (value: string) => void;
  /** Input mode: "numeric" or "alphanumeric". Defaults to "numeric". */
  mode?: PinInputMode;
  /** Whether to mask input (password dots). */
  mask?: boolean;
  /** Placeholder character per field. */
  placeholder?: string;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Whether the input is read-only. */
  readOnly?: boolean;
  /** Whether a value is required. */
  required?: boolean;
  /** Form submission name. */
  name?: string;
  /** Auto-focus first field on mount. */
  autoFocus?: boolean;
}

function isValidChar(char: string, mode: PinInputMode): boolean {
  if (mode === "numeric") return /^\d$/.test(char);
  return /^[a-zA-Z0-9]$/.test(char);
}

export const PinInput = forwardRef<HTMLDivElement, PinInputProps>(function PinInput(props, ref) {
  const {
    length = 4,
    value: controlledValue,
    defaultValue = "",
    onValueChange,
    onComplete,
    mode = "numeric",
    mask = false,
    placeholder = "○",
    disabled,
    readOnly,
    required,
    name,
    autoFocus = false,
    className,
    ...restProps
  } = props;

  const fieldCtx = useFieldContext();
  const resolvedDisabled = disabled ?? fieldCtx?.disabled ?? false;
  const resolvedReadOnly = readOnly ?? fieldCtx?.readOnly ?? false;

  const [currentValue, setCurrentValue] = useControllableState<string>({
    value: controlledValue,
    defaultValue,
    ...(onValueChange ? { onChange: onValueChange } : undefined),
    name: "PinInput",
    state: "value",
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const chars = useMemo(() => {
    const arr = new Array<string>(length).fill("");
    for (let i = 0; i < Math.min(currentValue.length, length); i++) {
      arr[i] = currentValue[i] ?? "";
    }
    return arr;
  }, [currentValue, length]);

  const focusField = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), length - 1);
      inputRefs.current[clamped]?.focus();
    },
    [length],
  );

  const updateValue = useCallback(
    (newChars: string[]) => {
      const joined = newChars.join("");
      setCurrentValue(joined);
      if (joined.length === length && newChars.every((c) => c !== "")) {
        onComplete?.(joined);
      }
    },
    [length, setCurrentValue, onComplete],
  );

  const handleInput = useCallback(
    (index: number, char: string) => {
      if (resolvedDisabled || resolvedReadOnly) return;
      if (!isValidChar(char, mode)) return;

      const next = [...chars];
      next[index] = char;
      updateValue(next);

      // Auto-advance
      if (index < length - 1) {
        focusField(index + 1);
      }
    },
    [chars, length, mode, resolvedDisabled, resolvedReadOnly, updateValue, focusField],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (resolvedDisabled || resolvedReadOnly) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        const next = [...chars];
        if (next[index] !== "") {
          next[index] = "";
          updateValue(next);
        } else if (index > 0) {
          next[index - 1] = "";
          updateValue(next);
          focusField(index - 1);
        }
        return;
      }

      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusField(index - 1);
        return;
      }

      if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusField(index + 1);
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        const next = [...chars];
        next[index] = "";
        updateValue(next);
        return;
      }

      // Single character input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleInput(index, e.key);
      }
    },
    [chars, length, resolvedDisabled, resolvedReadOnly, updateValue, focusField, handleInput],
  );

  const handlePaste = useCallback(
    (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
      if (resolvedDisabled || resolvedReadOnly) return;
      e.preventDefault();

      const pasted = e.clipboardData.getData("text/plain");
      const next = [...chars];
      let cursor = index;

      for (const char of pasted) {
        if (cursor >= length) break;
        if (isValidChar(char, mode)) {
          next[cursor] = char;
          cursor++;
        }
      }

      updateValue(next);
      focusField(Math.min(cursor, length - 1));
    },
    [chars, length, mode, resolvedDisabled, resolvedReadOnly, updateValue, focusField],
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  const variantClasses = ["kui-pin-input"];
  if (className) variantClasses.push(className);

  const fields = [];
  for (let i = 0; i < length; i++) {
    fields.push(
      createElement("input", {
        key: i,
        ref: (el: HTMLInputElement | null) => {
          inputRefs.current[i] = el;
        },
        type: mask ? "password" : "text",
        inputMode: mode === "numeric" ? "numeric" : "text",
        autoComplete: i === 0 ? "one-time-code" : "off",
        "aria-label": `Digit ${String(i + 1)} of ${String(length)}`,
        value: chars[i],
        placeholder,
        disabled: resolvedDisabled,
        readOnly: resolvedReadOnly,
        maxLength: 1,
        className: "kui-pin-input__field",
        "data-kui-component": "PinInputField",
        "data-index": i,
        "data-filled": chars[i] !== "" ? "" : undefined,
        autoFocus: autoFocus && i === 0,
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          handleKeyDown(i, e);
        },
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
          handlePaste(i, e);
        },
        onFocus: handleFocus,
        onChange: () => {},
      } as InputHTMLAttributes<HTMLInputElement>),
    );
  }

  return createElement(
    "div",
    {
      ...restProps,
      ref,
      role: "group",
      "aria-label": "Pin input",
      className: variantClasses.join(" "),
      "data-kui-component": "PinInput",
      ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
      ...(fieldCtx?.invalid ? { "data-invalid": "" } : undefined),
      ...(fieldCtx?.hasLabel ? { "aria-labelledby": fieldCtx.labelId } : undefined),
    },
    ...fields,
    name &&
      createElement("input", {
        type: "hidden",
        name,
        value: currentValue,
        disabled: resolvedDisabled,
        required: required ?? fieldCtx?.required ?? false,
        "aria-hidden": "true",
        tabIndex: -1,
      }),
  );
});
