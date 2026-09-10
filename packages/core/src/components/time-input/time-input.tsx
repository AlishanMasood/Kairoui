import { createElement, forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, HTMLAttributes, KeyboardEvent, MouseEvent } from "react";
import {
  formatTimeOfDayISO,
  formatTimeOfDayLocalized,
  isTimeOfDayInRange,
  isValidTimeOfDay,
  localePrefers12HourTime,
  parseTimeOfDayLocalized,
  tryTimeOfDay,
} from "@kairoui/utils/date";
import type { ParseResult, TimeOfDay } from "@kairoui/utils/date";
import { useControllableState, useId, useMergedRefs } from "@kairoui/hooks";
import { componentClass } from "../../composition/class-generation";
import { useFieldContext } from "../field/field-context";
import { resolveFieldControlProps } from "../field/field-control-props";

export type TimeInputSize = "sm" | "md" | "lg";

/**
 * TimeInput — locale-aware, typeable text input for a time of day.
 *
 * Uses a free-typing `<input type="text">` (not `<input type="time">`) to
 * honor an explicit locale and keep invalid intermediate input visible while
 * the user is typing.
 *
 * Emits and accepts `TimeOfDay` — a timezone-free wall-clock value. Time-only
 * values never coerce through `Date` because they have no anchoring day.
 */
export interface TimeInputOwnProps {
  /** Controlled value. `null` clears the input; `undefined` = uncontrolled. */
  value?: TimeOfDay | null;
  /** Initial value for uncontrolled mode. */
  defaultValue?: TimeOfDay | null;
  /** Called with the parsed TimeOfDay (or `null` when empty or unparseable). */
  onValueChange?: (value: TimeOfDay | null) => void;
  /** Called with the raw input string on every keystroke. */
  onInputChange?: (input: string) => void;
  /** Inclusive minimum bound. */
  min?: TimeOfDay;
  /** Inclusive maximum bound. */
  max?: TimeOfDay;
  /**
   * Granularity in seconds. Values are snapped to the nearest multiple.
   * Default `60` (rounds to whole minutes).
   */
  step?: number;
  /**
   * Whether to display and validate seconds. Defaults to `true` when `step`
   * is less than 60 or the min/max bounds carry non-zero seconds.
   */
  includeSeconds?: boolean;
  /**
   * Force 12-hour or 24-hour presentation. When `undefined`, follows the
   * locale (via `Intl.DateTimeFormat`).
   */
  hour12?: boolean;
  /** BCP-47 locale for display and parsing. Defaults to `en-US`. */
  locale?: string;
  /** Size variant. */
  size?: TimeInputSize;
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
  /** Placeholder text. Defaults to a locale/hour12-derived hint. */
  placeholder?: string;
  /** Show a clear button when there is a value. */
  clearable?: boolean;
  /** Input element ID. */
  id?: string;
  /**
   * Custom parser override. Receives the locale/hour12 context so custom
   * implementations can honor the same conventions.
   */
  parse?: (
    input: string,
    context: { locale: string; hour12: boolean; includeSeconds: boolean },
  ) => ParseResult<TimeOfDay>;
  /** Custom formatter override. */
  format?: (
    value: TimeOfDay,
    context: { locale: string; hour12: boolean; includeSeconds: boolean },
  ) => string;
  /** className passthrough on root element. */
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
}

export type TimeInputProps = TimeInputOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    | "defaultValue"
    | "onChange"
    | keyof TimeInputOwnProps
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "aria-errormessage"
  >;

const COMPONENT_NAME = "time-input";

function toValidTimeOfDay(value: TimeOfDay | null | undefined): TimeOfDay | null {
  if (!value) return null;
  return isValidTimeOfDay(value) ? value : null;
}

function timeHasSeconds(t: TimeOfDay | undefined): boolean {
  return t !== undefined && (t.second !== 0 || t.millisecond !== 0);
}

function snapToStep(t: TimeOfDay, stepSeconds: number): TimeOfDay {
  if (stepSeconds <= 0) return t;
  const total = t.hour * 3600 + t.minute * 60 + t.second;
  const snapped = Math.round(total / stepSeconds) * stepSeconds;
  const clamped = Math.max(0, Math.min(24 * 3600 - 1, snapped));
  const hour = Math.floor(clamped / 3600);
  const minute = Math.floor((clamped % 3600) / 60);
  const second = clamped % 60;
  return { hour, minute, second, millisecond: 0 };
}

function defaultFormat(
  value: TimeOfDay,
  context: { locale: string; hour12: boolean; includeSeconds: boolean },
): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: context.hour12,
    ...(context.includeSeconds ? { second: "2-digit" } : undefined),
  };
  return formatTimeOfDayLocalized(value, context.locale, options);
}

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  function TimeInput(props, forwardedRef) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      onInputChange,
      min,
      max,
      step = 60,
      includeSeconds,
      hour12,
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
    const generatedId = useId(undefined, { prefix: "kui-time-input" });

    const resolvedId = id ?? (fieldControlProps["id"] as string | undefined) ?? generatedId;
    const resolvedDisabled = disabled ?? fieldCtx?.disabled ?? false;
    const resolvedReadOnly = readOnly ?? fieldCtx?.readOnly ?? false;
    const resolvedRequired = required ?? fieldCtx?.required ?? false;

    const resolvedHour12 = hour12 ?? localePrefers12HourTime(locale);
    const resolvedIncludeSeconds =
      includeSeconds ?? (step < 60 || timeHasSeconds(min) || timeHasSeconds(max));

    const [value, setValue] = useControllableState<TimeOfDay | null>({
      value: controlledValue,
      defaultValue: defaultValue ?? null,
      ...(onValueChange ? { onChange: onValueChange } : undefined),
      name: "TimeInput",
      state: "value",
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = useMergedRefs(forwardedRef, inputRef);
    const skipNextBlurCommitRef = useRef(false);

    const formatCtx = useMemo(
      () => ({ locale, hour12: resolvedHour12, includeSeconds: resolvedIncludeSeconds }),
      [locale, resolvedHour12, resolvedIncludeSeconds],
    );

    const displayValue = useMemo(() => {
      const t = toValidTimeOfDay(value);
      if (!t) return "";
      return format(t, formatCtx);
    }, [value, format, formatCtx]);

    const [pendingInput, setPendingInput] = useState<string | null>(null);
    const [parseValid, setParseValid] = useState<boolean>(true);

    const lastValueRef = useRef(value);
    if (lastValueRef.current !== value && pendingInput !== null && parseValid) {
      lastValueRef.current = value;
      setPendingInput(null);
    } else if (lastValueRef.current !== value) {
      lastValueRef.current = value;
    }

    const inputText = pendingInput !== null ? pendingInput : displayValue;

    const doParse = useCallback(
      (raw: string): ParseResult<TimeOfDay> | null => {
        const trimmed = raw.trim();
        if (trimmed === "") return null;
        if (parse) {
          return parse(trimmed, formatCtx);
        }
        return parseTimeOfDayLocalized(trimmed, hour12 !== undefined ? { hour12 } : {});
      },
      [parse, formatCtx, hour12],
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
        const snapped = snapToStep(result.value, step);
        const snappedResult = tryTimeOfDay(
          snapped.hour,
          snapped.minute,
          snapped.second,
          snapped.millisecond,
        );
        if (!snappedResult.ok) {
          setPendingInput(raw);
          setParseValid(false);
          return;
        }
        if (!isTimeOfDayInRange(snappedResult.value, min, max)) {
          setPendingInput(raw);
          setParseValid(false);
          return;
        }
        setParseValid(true);
        setPendingInput(null);
        setValue(snappedResult.value);
      },
      [doParse, min, max, step, setValue],
    );

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;
        setPendingInput(next);
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

    const resolvedPlaceholder =
      placeholder ??
      (resolvedIncludeSeconds
        ? resolvedHour12
          ? "hh:mm:ss AM"
          : "HH:MM:SS"
        : resolvedHour12
          ? "hh:mm AM"
          : "HH:MM");

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

    const validValue = toValidTimeOfDay(value);
    const hiddenValue = validValue
      ? formatTimeOfDayISO(validValue, {
          includeSeconds: resolvedIncludeSeconds,
        })
      : "";

    return createElement(
      "div",
      {
        ...rootProps,
        className: rootClass.join(" "),
        "data-kui-component": "TimeInput",
        "data-size": size,
        "data-hour12": resolvedHour12 ? "true" : "false",
        ...(isInvalid ? { "data-invalid": "" } : undefined),
        ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
        ...(resolvedReadOnly ? { "data-readonly": "" } : undefined),
      },
      createElement("input", {
        ref: mergedRef,
        type: "text",
        inputMode: resolvedHour12 ? "text" : "numeric",
        autoComplete: "off",
        spellCheck: false,
        id: resolvedId,
        value: inputText,
        onChange: handleChange,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        disabled: resolvedDisabled,
        readOnly: resolvedReadOnly,
        required: resolvedRequired,
        placeholder: resolvedPlaceholder,
        className: inputClass.join(" "),
        "aria-invalid": isInvalid ? "true" : undefined,
        ...ariaAttrs,
        ...(min
          ? {
              "data-min": formatTimeOfDayISO(min, { includeSeconds: resolvedIncludeSeconds }),
            }
          : undefined),
        ...(max
          ? {
              "data-max": formatTimeOfDayISO(max, { includeSeconds: resolvedIncludeSeconds }),
            }
          : undefined),
        "data-step": String(step),
      }),
      clearable && validValue && !resolvedDisabled && !resolvedReadOnly
        ? createElement(
            "button",
            {
              type: "button",
              "aria-label": "Clear time",
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
