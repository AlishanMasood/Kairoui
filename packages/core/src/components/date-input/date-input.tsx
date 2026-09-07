import { createElement, forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, HTMLAttributes, KeyboardEvent, MouseEvent } from "react";
import {
  dateFromDateOnly,
  dateOnlyFromDate,
  formatDateOnlyISO,
  formatDateOnlyLocalized,
  getLocaleDatePartsOrder,
  isDateOnlyInRange,
  isValidDate,
  parseDateOnlyLocalized,
} from "@kairoui/utils/date";
import type { DateOnly, ParseResult } from "@kairoui/utils/date";
import { useControllableState, useId, useMergedRefs } from "@kairoui/hooks";
import { componentClass } from "../../composition/class-generation";
import { useFieldContext } from "../field/field-context";
import { resolveFieldControlProps } from "../field/field-control-props";

export type DateInputSize = "sm" | "md" | "lg";

/**
 * DateInput — locale-aware, typeable text input for calendar dates.
 *
 * Uses a free-typing `<input type="text">` (not `<input type="date">`) to give
 * consistent cross-browser behavior, honor an explicit locale, and let us keep
 * invalid intermediate input visible while the user is typing.
 */
export interface DateInputOwnProps {
  /** Controlled value. `null` clears the input; `undefined` = uncontrolled. */
  value?: Date | null;
  /** Initial value for uncontrolled mode. */
  defaultValue?: Date | null;
  /** Called with the parsed Date (or `null` when empty or unparseable). */
  onValueChange?: (value: Date | null) => void;
  /** Called with the raw input string on every keystroke. */
  onInputChange?: (input: string) => void;
  /** Inclusive minimum bound. */
  min?: Date;
  /** Inclusive maximum bound. */
  max?: Date;
  /** BCP-47 locale for display and parsing. Defaults to browser default. */
  locale?: string;
  /** Size variant. */
  size?: DateInputSize;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Whether the input is read-only. */
  readOnly?: boolean;
  /** Whether a value is required. */
  required?: boolean;
  /** Explicit invalid signal (overrides parse validity). */
  invalid?: boolean;
  /** Form submission name. */
  name?: string;
  /** External form ID (matches native `form` attr). */
  form?: string;
  /** Placeholder text. Defaults to a locale-derived pattern hint. */
  placeholder?: string;
  /** Show a clear button when there is a value. */
  clearable?: boolean;
  /** Input element ID. */
  id?: string;
  /** Custom parser override. */
  parse?: (input: string, locale: string) => ParseResult<DateOnly>;
  /** Custom formatter override. */
  format?: (value: DateOnly, locale: string) => string;
  /** className passthrough on root element. */
  className?: string;
  /** aria-label. */
  "aria-label"?: string;
  /** aria-labelledby. */
  "aria-labelledby"?: string;
  /** aria-describedby. */
  "aria-describedby"?: string;
  /** aria-errormessage. */
  "aria-errormessage"?: string;
}

export type DateInputProps = DateInputOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    | "defaultValue"
    | "onChange"
    | keyof DateInputOwnProps
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "aria-errormessage"
  >;

const COMPONENT_NAME = "date-input";

const PLACEHOLDER_MAP: Record<"YMD" | "DMY" | "MDY", string> = {
  MDY: "MM/DD/YYYY",
  DMY: "DD/MM/YYYY",
  YMD: "YYYY/MM/DD",
};

function dateToDateOnly(value: Date | null | undefined): DateOnly | null {
  if (!value || !isValidDate(value)) return null;
  return dateOnlyFromDate(value);
}

function defaultFormat(value: DateOnly, locale: string): string {
  // Numeric short form — matches placeholder pattern hint.
  return formatDateOnlyLocalized(value, locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(props, forwardedRef) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      onInputChange,
      min,
      max,
      locale = "en-US",
      size = "md",
      disabled,
      readOnly,
      required,
      invalid,
      name,
      form,
      placeholder,
      clearable = false,
      id,
      parse,
      format = defaultFormat,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-errormessage": ariaErrorMessage,
      ...rootProps
    } = props;

    const fieldCtx = useFieldContext();
    const fieldControlProps = resolveFieldControlProps(fieldCtx, "input");
    const generatedId = useId(undefined, { prefix: "kui-date-input" });

    const resolvedId = id ?? (fieldControlProps["id"] as string | undefined) ?? generatedId;
    const resolvedDisabled = disabled ?? fieldCtx?.disabled ?? false;
    const resolvedReadOnly = readOnly ?? fieldCtx?.readOnly ?? false;
    const resolvedRequired = required ?? fieldCtx?.required ?? false;

    const [value, setValue] = useControllableState<Date | null>({
      value: controlledValue,
      defaultValue: defaultValue ?? null,
      ...(onValueChange ? { onChange: onValueChange } : undefined),
      name: "DateInput",
      state: "value",
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = useMergedRefs(forwardedRef, inputRef);
    const skipNextBlurCommitRef = useRef(false);

    const displayValue = useMemo(() => {
      const dateOnly = dateToDateOnly(value);
      if (!dateOnly) return "";
      return format(dateOnly, locale);
    }, [value, format, locale]);

    // `pendingInput` holds the raw text while the user is typing or after a
    // failed parse. `null` means "show the derived displayValue" — matches
    // external value updates without an effect.
    const [pendingInput, setPendingInput] = useState<string | null>(null);
    const [parseValid, setParseValid] = useState<boolean>(true);

    // Reset pending input when the underlying value changes from outside.
    // Track previous value via ref to detect external changes.
    const lastValueRef = useRef(value);
    if (lastValueRef.current !== value && pendingInput !== null && parseValid) {
      lastValueRef.current = value;
      setPendingInput(null);
    } else if (lastValueRef.current !== value) {
      lastValueRef.current = value;
    }

    const inputText = pendingInput !== null ? pendingInput : displayValue;

    const doParse = useCallback(
      (raw: string): ParseResult<DateOnly> | null => {
        const trimmed = raw.trim();
        if (trimmed === "") return null;
        return parse ? parse(trimmed, locale) : parseDateOnlyLocalized(trimmed, locale);
      },
      [parse, locale],
    );

    const commit = useCallback(
      (raw: string) => {
        const result = doParse(raw);
        if (result === null) {
          setValue(null);
          setPendingInput(null);
          setParseValid(true);
          return;
        }
        if (!result.ok) {
          setPendingInput(raw);
          setParseValid(false);
          return;
        }
        const minOnly = min ? dateOnlyFromDate(min) : undefined;
        const maxOnly = max ? dateOnlyFromDate(max) : undefined;
        if (!isDateOnlyInRange(result.value, minOnly, maxOnly)) {
          setPendingInput(raw);
          setParseValid(false);
          return;
        }
        setParseValid(true);
        setPendingInput(null);
        setValue(dateFromDateOnly(result.value));
      },
      [doParse, min, max, setValue],
    );

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;
        setPendingInput(next);
        // Clear parse error while user is actively typing again.
        if (!parseValid) setParseValid(true);
        if (onInputChange) onInputChange(next);
      },
      [onInputChange, parseValid],
    );

    const handleBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        if (skipNextBlurCommitRef.current) {
          skipNextBlurCommitRef.current = false;
          return;
        }
        commit(event.target.value);
      },
      [commit],
    );

    const handleFocus = useCallback(() => {
      // no-op; state is derived from pendingInput vs displayValue
    }, []);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit((event.target as HTMLInputElement).value);
        } else if (event.key === "Escape") {
          event.preventDefault();
          setPendingInput(null);
          setParseValid(true);
          skipNextBlurCommitRef.current = true;
          inputRef.current?.blur();
        }
      },
      [commit],
    );

    const handleClear = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (resolvedDisabled || resolvedReadOnly) return;
        setPendingInput(null);
        setParseValid(true);
        setValue(null);
        inputRef.current?.focus();
      },
      [resolvedDisabled, resolvedReadOnly, setValue],
    );

    const isInvalid = Boolean(invalid) || Boolean(fieldCtx?.invalid) || !parseValid;

    const resolvedPlaceholder = placeholder ?? PLACEHOLDER_MAP[getLocaleDatePartsOrder(locale)];

    const rootClass = [componentClass(COMPONENT_NAME)];
    if (size !== "md") rootClass.push(`kui-${COMPONENT_NAME}--${size}`);
    if (className) rootClass.push(className);

    const inputClass = [`kui-${COMPONENT_NAME}__input`];

    const ariaAttrs: Record<string, string> = {};
    if (ariaLabel) ariaAttrs["aria-label"] = ariaLabel;
    if (ariaLabelledBy) ariaAttrs["aria-labelledby"] = ariaLabelledBy;
    else if (fieldControlProps["aria-labelledby"]) {
      ariaAttrs["aria-labelledby"] = fieldControlProps["aria-labelledby"] as string;
    }
    if (ariaDescribedBy) ariaAttrs["aria-describedby"] = ariaDescribedBy;
    else if (fieldControlProps["aria-describedby"]) {
      ariaAttrs["aria-describedby"] = fieldControlProps["aria-describedby"] as string;
    }
    if (ariaErrorMessage) ariaAttrs["aria-errormessage"] = ariaErrorMessage;
    else if (fieldControlProps["aria-errormessage"]) {
      ariaAttrs["aria-errormessage"] = fieldControlProps["aria-errormessage"] as string;
    }

    const dateOnly = dateToDateOnly(value);
    const hiddenValue = dateOnly ? formatDateOnlyISO(dateOnly) : "";

    return createElement(
      "div",
      {
        ...rootProps,
        className: rootClass.join(" "),
        "data-kui-component": "DateInput",
        "data-size": size,
        ...(isInvalid ? { "data-invalid": "" } : undefined),
        ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
        ...(resolvedReadOnly ? { "data-readonly": "" } : undefined),
      },
      createElement("input", {
        ref: mergedRef,
        type: "text",
        inputMode: "numeric",
        autoComplete: "off",
        spellCheck: false,
        id: resolvedId,
        value: inputText,
        onChange: handleChange,
        onBlur: handleBlur,
        onFocus: handleFocus,
        onKeyDown: handleKeyDown,
        disabled: resolvedDisabled,
        readOnly: resolvedReadOnly,
        required: resolvedRequired,
        placeholder: resolvedPlaceholder,
        className: inputClass.join(" "),
        "aria-invalid": isInvalid ? "true" : undefined,
        ...ariaAttrs,
        ...(min ? { "data-min": formatDateOnlyISO(dateOnlyFromDate(min)) } : undefined),
        ...(max ? { "data-max": formatDateOnlyISO(dateOnlyFromDate(max)) } : undefined),
      }),
      clearable && dateOnly && !resolvedDisabled && !resolvedReadOnly
        ? createElement(
            "button",
            {
              type: "button",
              "aria-label": "Clear date",
              className: `kui-${COMPONENT_NAME}__clear-button`,
              onClick: handleClear,
              "data-kui-slot": "clearButton",
            },
            "×",
          )
        : null,
      name
        ? createElement("input", {
            type: "hidden",
            name,
            value: hiddenValue,
            ...(form ? { form } : undefined),
          })
        : null,
    );
  },
);
