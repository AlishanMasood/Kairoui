import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import {
  compareDateOnly,
  compareTimeOfDay,
  dateFromDateOnly,
  dateOnlyFromDate,
  formatDateTimeLocalISO,
  isDateOnlyEqual,
  isValidDate,
} from "@kairoui/utils/date";
import type { DateOnly, DateTimeLocal, TimeOfDay } from "@kairoui/utils/date";
import { componentClass } from "../../composition/class-generation";
import { DateInput } from "../date-input/date-input";
import type { DateInputProps } from "../date-input/date-input";
import { TimeInput } from "../time-input/time-input";
import type { TimeInputProps } from "../time-input/time-input";
import { FieldContext, useFieldContext } from "../field/field-context";
import { resolveFieldControlProps } from "../field/field-control-props";

export type DateTimeInputSize = "sm" | "md" | "lg";

const COMPONENT_NAME = "date-time-input";

/**
 * DateTimeInput — composed DateInput + TimeInput for editing a local
 * wall-clock date-time value.
 *
 * ## Timezone policy
 *
 * `DateTimeLocal` is timezone-free (see `@kairoui/utils/date`). No UTC
 * shifting is performed at the API boundary. Serialization emits an ISO
 * string in `YYYY-MM-DDTHH:MM[:SS[.sss]]` form without a `Z` suffix.
 */
export interface DateTimeInputOwnProps {
  /** Controlled value. `null` clears both parts; `undefined` = uncontrolled. */
  value?: DateTimeLocal | null;
  /** Initial value for uncontrolled mode. */
  defaultValue?: DateTimeLocal | null;
  /** Called with the combined value (or `null` if either part is empty). */
  onValueChange?: (value: DateTimeLocal | null) => void;

  /** Inclusive minimum bound. */
  min?: DateTimeLocal;
  /** Inclusive maximum bound. */
  max?: DateTimeLocal;

  /** Time granularity in seconds. Passed to the time part. Default `60`. */
  step?: number;
  /** Whether to display seconds. Passed to the time part. */
  includeSeconds?: boolean;
  /** Force 12-hour or 24-hour presentation. */
  hour12?: boolean;

  /** BCP-47 locale for display and parsing. Defaults to `en-US`. */
  locale?: string;
  /** Size variant. */
  size?: DateTimeInputSize;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Whether the input is read-only. */
  readOnly?: boolean;
  /** Whether a value is required. */
  required?: boolean;
  /** Explicit invalid signal (overrides internal range validity). */
  invalid?: boolean;

  /** Form submission name. Emits a hidden input carrying the ISO value. */
  name?: string;
  /** External form ID. */
  form?: string;

  /** Root element ID. The date sub-input receives the labelable ID. */
  id?: string;

  /** Additional props forwarded to the underlying date sub-input. */
  dateProps?: Omit<
    DateInputProps,
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "min"
    | "max"
    | "locale"
    | "disabled"
    | "readOnly"
    | "required"
    | "invalid"
    | "name"
    | "form"
    | "id"
    | "size"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "aria-errormessage"
  >;
  /** Additional props forwarded to the underlying time sub-input. */
  timeProps?: Omit<
    TimeInputProps,
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "min"
    | "max"
    | "locale"
    | "step"
    | "includeSeconds"
    | "hour12"
    | "disabled"
    | "readOnly"
    | "required"
    | "invalid"
    | "name"
    | "form"
    | "size"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "aria-errormessage"
  >;

  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
}

export type DateTimeInputProps = DateTimeInputOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    | "defaultValue"
    | "onChange"
    | keyof DateTimeInputOwnProps
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "aria-errormessage"
  >;

const ROOT_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "stretch",
  gap: 6,
};

function toValidDateTime(value: DateTimeLocal | null | undefined): DateTimeLocal | null {
  if (value === null || value === undefined) return null;
  return value;
}

function isDateTimeInRange(
  value: DateTimeLocal,
  min: DateTimeLocal | undefined,
  max: DateTimeLocal | undefined,
): boolean {
  if (min) {
    const dCmp = compareDateOnly(value.date, min.date);
    if (dCmp < 0) return false;
    if (dCmp === 0 && compareTimeOfDay(value.time, min.time) < 0) return false;
  }
  if (max) {
    const dCmp = compareDateOnly(value.date, max.date);
    if (dCmp > 0) return false;
    if (dCmp === 0 && compareTimeOfDay(value.time, max.time) > 0) return false;
  }
  return true;
}

export const DateTimeInput = forwardRef<HTMLDivElement, DateTimeInputProps>(
  function DateTimeInput(props, forwardedRef) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      min,
      max,
      step,
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
      id,
      dateProps,
      timeProps,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-errormessage": ariaErrorMessage,
      style,
      ...rootProps
    } = props;

    const fieldCtx = useFieldContext();
    const fieldControlProps = resolveFieldControlProps(fieldCtx, "input");
    const generatedId = useId(undefined, { prefix: "kui-date-time-input" });
    const timeGeneratedId = useId(undefined, { prefix: "kui-date-time-input-time" });

    const resolvedId = id ?? (fieldControlProps["id"] as string | undefined) ?? generatedId;
    const resolvedDisabled = disabled ?? fieldCtx?.disabled ?? false;
    const resolvedReadOnly = readOnly ?? fieldCtx?.readOnly ?? false;
    const resolvedRequired = required ?? fieldCtx?.required ?? false;

    const [value, setValueRaw] = useControllableState<DateTimeLocal | null>({
      value: controlledValue,
      defaultValue: defaultValue ?? null,
      ...(onValueChange ? { onChange: onValueChange } : undefined),
      name: "DateTimeInput",
      state: "value",
    });

    // Track partial edits — user may set date without time (or vice versa).
    // Only used when composite `value` is null; ignored otherwise.
    const [pendingDate, setPendingDate] = useState<DateOnly | null>(null);
    const [pendingTime, setPendingTime] = useState<TimeOfDay | null>(null);

    // Clear stale pendings whenever the composite becomes non-null.
    useEffect(() => {
      if (value !== null) {
        setPendingDate(null);
        setPendingTime(null);
      }
    }, [value]);

    const displayDate: DateOnly | null = value ? value.date : pendingDate;
    const displayTime: TimeOfDay | null = value ? value.time : pendingTime;

    const commitParts = useCallback(
      (nextDate: DateOnly | null, nextTime: TimeOfDay | null) => {
        if (nextDate && nextTime) {
          setValueRaw({ date: nextDate, time: nextTime });
          setPendingDate(null);
          setPendingTime(null);
        } else {
          setValueRaw(null);
          setPendingDate(nextDate);
          setPendingTime(nextTime);
        }
      },
      [setValueRaw],
    );

    const handleDateChange = useCallback(
      (next: Date | null) => {
        const nextDate = next && isValidDate(next) ? dateOnlyFromDate(next) : null;
        const curTime = displayTime;
        commitParts(nextDate, curTime);
      },
      [commitParts, displayTime],
    );

    const handleTimeChange = useCallback(
      (next: TimeOfDay | null) => {
        const curDate = displayDate;
        commitParts(curDate, next);
      },
      [commitParts, displayDate],
    );

    const validValue = toValidDateTime(value);
    const rangeInvalid = validValue ? !isDateTimeInRange(validValue, min, max) : false;
    const isInvalid = Boolean(invalid) || Boolean(fieldCtx?.invalid) || rangeInvalid;

    // Derive per-part bounds. Date bounds apply always; time bounds only on
    // the boundary day so the user cannot pick an out-of-range instant.
    const dateMin = min ? dateFromDateOnly(min.date) : undefined;
    const dateMax = max ? dateFromDateOnly(max.date) : undefined;

    const timeMin: TimeOfDay | undefined =
      min && displayDate && isDateOnlyEqual(displayDate, min.date) ? min.time : undefined;
    const timeMax: TimeOfDay | undefined =
      max && displayDate && isDateOnlyEqual(displayDate, max.date) ? max.time : undefined;

    const rootClass = [componentClass(COMPONENT_NAME)];
    if (size !== "md") rootClass.push(`kui-${COMPONENT_NAME}--${size}`);
    if (className) rootClass.push(className);

    const hiddenValue = validValue ? formatDateTimeLocalISO(validValue) : "";

    // Field ARIA is routed to the date sub-input (the labelable target).
    const dateAria: Record<string, string> = {};
    if (ariaLabel) dateAria["aria-label"] = ariaLabel;
    if (ariaLabelledBy) dateAria["aria-labelledby"] = ariaLabelledBy;
    else if (fieldControlProps["aria-labelledby"]) {
      dateAria["aria-labelledby"] = fieldControlProps["aria-labelledby"] as string;
    }
    if (ariaDescribedBy) dateAria["aria-describedby"] = ariaDescribedBy;
    else if (fieldControlProps["aria-describedby"]) {
      dateAria["aria-describedby"] = fieldControlProps["aria-describedby"] as string;
    }
    if (ariaErrorMessage) dateAria["aria-errormessage"] = ariaErrorMessage;
    else if (fieldControlProps["aria-errormessage"]) {
      dateAria["aria-errormessage"] = fieldControlProps["aria-errormessage"] as string;
    }

    // Time input carries a distinct default aria-label but shares describedby.
    const timePropsAriaLabel = (timeProps as { "aria-label"?: string } | undefined)?.["aria-label"];
    const timeAria: Record<string, string> = {
      "aria-label": timePropsAriaLabel ?? "Time",
    };
    if (dateAria["aria-describedby"]) {
      timeAria["aria-describedby"] = dateAria["aria-describedby"];
    }

    const mergedStyle: CSSProperties = { ...ROOT_STYLE, ...style };

    return createElement(
      "div",
      {
        ...rootProps,
        ref: forwardedRef,
        className: rootClass.join(" "),
        style: mergedStyle,
        "data-kui-component": "DateTimeInput",
        "data-size": size,
        ...(isInvalid ? { "data-invalid": "" } : undefined),
        ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
        ...(resolvedReadOnly ? { "data-readonly": "" } : undefined),
      },
      createElement(DateInput, {
        ...dateProps,
        id: resolvedId,
        value: displayDate ? dateFromDateOnly(displayDate) : null,
        onValueChange: handleDateChange,
        locale,
        size,
        disabled: resolvedDisabled,
        readOnly: resolvedReadOnly,
        required: resolvedRequired,
        invalid: isInvalid,
        ...(dateMin ? { min: dateMin } : undefined),
        ...(dateMax ? { max: dateMax } : undefined),
        ...dateAria,
        "data-kui-part": "date-time-input-date",
      } as DateInputProps),
      // TimeInput is isolated from Field context so it does not inherit
      // aria-errormessage or double-count state flags — the flags are
      // forwarded explicitly here.
      createElement(
        FieldContext.Provider,
        { value: null },
        createElement(TimeInput, {
          ...timeProps,
          id: timeGeneratedId,
          value: displayTime,
          onValueChange: handleTimeChange,
          locale,
          size,
          disabled: resolvedDisabled,
          readOnly: resolvedReadOnly,
          required: resolvedRequired,
          invalid: isInvalid,
          ...(step !== undefined ? { step } : undefined),
          ...(includeSeconds !== undefined ? { includeSeconds } : undefined),
          ...(hour12 !== undefined ? { hour12 } : undefined),
          ...(timeMin ? { min: timeMin } : undefined),
          ...(timeMax ? { max: timeMax } : undefined),
          ...timeAria,
          "data-kui-part": "date-time-input-time",
        } as TimeInputProps),
      ),
      name !== undefined
        ? createElement("input", {
            type: "hidden",
            name,
            value: hiddenValue,
            ...(form ? { form } : undefined),
            "data-kui-part": "date-time-input-hidden",
          })
        : null,
    );
  },
);
