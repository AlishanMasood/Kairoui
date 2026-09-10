import {
  createElement,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { dateOnlyFromDate, isDateOnlyEqual, isValidDate } from "@kairoui/utils/date";
import { Popover, PopoverAnchor, PopoverContent, PopoverPortal } from "../popover/popover";
import { Calendar } from "../calendar/calendar";
import type { WeekStart } from "../calendar/calendar-model";
import { DateInput } from "../date-input/date-input";
import type { DateInputProps } from "../date-input/date-input";
import { useFieldContext } from "../field/field-context";
import {
  DatePickerContext,
  useDatePickerContext,
  type DatePickerContextValue,
  type DatePickerFormatFn,
  type DatePickerParseFn,
} from "./date-picker-context";

// ─── Root ────────────────────────────────────────────────────────────

export interface DatePickerOwnProps {
  /** Controlled value. `null` clears, `undefined` = uncontrolled. */
  value?: Date | null;
  /** Uncontrolled initial value. */
  defaultValue?: Date | null;
  /** Called when the selected date changes (calendar pick or typed commit). */
  onValueChange?: (value: Date | null) => void;

  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;

  /** Inclusive minimum bound. Applied to both input parse and calendar. */
  min?: Date;
  /** Inclusive maximum bound. Applied to both input parse and calendar. */
  max?: Date;
  /** Predicate returning `true` disables a candidate date in the calendar. */
  disabledDate?: (date: Date) => boolean;

  /** BCP-47 locale. Defaults to `en-US`. */
  locale?: string;
  /** Layout direction. Defaults to `ltr`. */
  dir?: "ltr" | "rtl";
  /** First day of the week in the calendar view. */
  weekStartsOn?: WeekStart;

  /** Whether the picker is disabled. */
  disabled?: boolean;
  /** Whether the picker is read-only. */
  readOnly?: boolean;
  /** Whether the picker is required (form validation). */
  required?: boolean;
  /** Explicit invalid signal (overrides parse validity). */
  invalid?: boolean;

  /** Form submission name (proxied to the hidden input in DateInput). */
  name?: string;
  /** External form ID. */
  form?: string;

  /** Custom parser (overrides `parseDateOnlyLocalized`). */
  parse?: DatePickerParseFn;
  /** Custom formatter. */
  format?: DatePickerFormatFn;

  children: ReactNode;
  className?: string;
}

export type DatePickerProps = DatePickerOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | keyof DatePickerOwnProps>;

const ROOT_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "stretch",
  width: "100%",
  position: "relative",
};

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(props, forwardedRef) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      open: controlledOpen,
      defaultOpen,
      onOpenChange,
      min,
      max,
      disabledDate,
      locale = "en-US",
      dir = "ltr",
      weekStartsOn,
      disabled,
      readOnly,
      required,
      invalid,
      name,
      form,
      parse,
      format,
      children,
      className,
      style,
      ...rootProps
    } = props;

    const fieldCtx = useFieldContext();

    const resolvedDisabled = disabled ?? fieldCtx?.disabled ?? false;
    const resolvedReadOnly = readOnly ?? fieldCtx?.readOnly ?? false;
    const resolvedRequired = required ?? fieldCtx?.required ?? false;
    const resolvedInvalid = invalid ?? fieldCtx?.invalid ?? false;

    const [value, setValue] = useControllableState<Date | null>({
      value: controlledValue,
      defaultValue: defaultValue ?? null,
      ...(onValueChange ? { onChange: onValueChange } : undefined),
      name: "DatePicker",
      state: "value",
    });

    const [open, setOpen] = useControllableState<boolean>({
      value: controlledOpen,
      defaultValue: defaultOpen ?? false,
      ...(onOpenChange ? { onChange: onOpenChange } : undefined),
      name: "DatePicker",
      state: "open",
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const lastFocusSourceRef = useRef<"input" | "trigger" | null>(null);

    const inputId = useId(undefined, { prefix: "kui-date-picker-input" });
    const triggerId = useId(undefined, { prefix: "kui-date-picker-trigger" });
    const contentId = useId(undefined, { prefix: "kui-date-picker-content" });

    const ctx = useMemo<DatePickerContextValue>(
      () => ({
        value,
        setValue,
        open,
        setOpen,
        min,
        max,
        disabledDate,
        locale,
        dir,
        disabled: resolvedDisabled,
        readOnly: resolvedReadOnly,
        required: resolvedRequired,
        invalid: resolvedInvalid,
        name,
        form,
        parse,
        format,
        inputId,
        triggerId,
        contentId,
        inputRef,
        triggerRef,
        lastFocusSourceRef,
      }),
      [
        value,
        setValue,
        open,
        setOpen,
        min,
        max,
        disabledDate,
        locale,
        dir,
        resolvedDisabled,
        resolvedReadOnly,
        resolvedRequired,
        resolvedInvalid,
        name,
        form,
        parse,
        format,
        inputId,
        triggerId,
        contentId,
      ],
    );

    const mergedStyle: CSSProperties = { ...ROOT_STYLE, ...style };

    return createElement(
      DatePickerContext.Provider,
      { value: ctx },
      createElement(
        Popover,
        { open, onOpenChange: setOpen },
        createElement(
          "div",
          {
            ...rootProps,
            ref: forwardedRef,
            className,
            style: mergedStyle,
            "data-kui-component": "DatePicker",
            "data-state": open ? "open" : "closed",
            ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
            ...(resolvedReadOnly ? { "data-readonly": "" } : undefined),
            ...(resolvedInvalid ? { "data-invalid": "" } : undefined),
            ...(weekStartsOn !== undefined
              ? { "data-week-starts-on": String(weekStartsOn) }
              : undefined),
            "data-dir": dir,
          },
          children,
        ),
      ),
    );
  },
);

// ─── DatePickerInput ────────────────────────────────────────────────

export interface DatePickerInputProps extends Omit<
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
  | "parse"
  | "format"
  | "id"
> {
  /** Optional id override; usually resolved from the picker context. */
  id?: string;
}

export const DatePickerInput = forwardRef<HTMLInputElement, DatePickerInputProps>(
  function DatePickerInput(props, forwardedRef) {
    const { id, onKeyDown, ...rest } = props;
    const ctx = useDatePickerContext();

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          ctx.lastFocusSourceRef.current = "input";
          ctx.setOpen(true);
        } else if (event.key === "ArrowUp" && event.altKey) {
          event.preventDefault();
          ctx.setOpen(false);
        }
        onKeyDown?.(event);
      },
      [ctx, onKeyDown],
    );

    // Merge the caller's ref with the picker's inputRef.
    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        (ctx.inputRef as { current: HTMLInputElement | null }).current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) {
          (forwardedRef as { current: HTMLInputElement | null }).current = node;
        }
      },
      [ctx.inputRef, forwardedRef],
    );

    return createElement(
      PopoverAnchor,
      { style: { display: "flex", flex: 1 } },
      createElement(DateInput, {
        ...rest,
        ref: setRef,
        id: id ?? ctx.inputId,
        value: ctx.value,
        onValueChange: ctx.setValue,
        locale: ctx.locale,
        disabled: ctx.disabled,
        readOnly: ctx.readOnly,
        required: ctx.required,
        invalid: ctx.invalid,
        ...(ctx.min ? { min: ctx.min } : undefined),
        ...(ctx.max ? { max: ctx.max } : undefined),
        ...(ctx.name ? { name: ctx.name } : undefined),
        ...(ctx.form ? { form: ctx.form } : undefined),
        ...(ctx.parse ? { parse: ctx.parse } : undefined),
        ...(ctx.format ? { format: ctx.format } : undefined),
        onKeyDown: handleKeyDown,
        inputProps: {
          "aria-haspopup": "dialog",
          "aria-expanded": ctx.open ? "true" : "false",
          ...(ctx.open ? { "aria-controls": ctx.contentId } : undefined),
        },
      }),
    );
  },
);

// ─── DatePickerClear ────────────────────────────────────────────────

export interface DatePickerClearProps {
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export const DatePickerClear = forwardRef<
  HTMLButtonElement,
  DatePickerClearProps & Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "aria-label">
>(function DatePickerClear(props, forwardedRef) {
  const { children, className, "aria-label": ariaLabel = "Clear date", ...rest } = props;
  const ctx = useDatePickerContext();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (ctx.disabled || ctx.readOnly) return;
      ctx.setValue(null);
      ctx.inputRef.current?.focus();
    },
    [ctx],
  );

  if (ctx.value === null || ctx.disabled || ctx.readOnly) return null;

  return createElement(
    "button",
    {
      ...rest,
      ref: forwardedRef,
      type: "button",
      "aria-label": ariaLabel,
      className,
      onClick: handleClick,
      "data-kui-component": "DatePickerClear",
    },
    children ?? "×",
  );
});

// ─── DatePickerTrigger ──────────────────────────────────────────────

export interface DatePickerTriggerProps {
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export const DatePickerTrigger = forwardRef<
  HTMLButtonElement,
  DatePickerTriggerProps & Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "aria-label">
>(function DatePickerTrigger(props, forwardedRef) {
  const { children, className, "aria-label": ariaLabel = "Open calendar", ...rest } = props;
  const ctx = useDatePickerContext();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (ctx.disabled || ctx.readOnly) return;
      ctx.lastFocusSourceRef.current = "trigger";
      ctx.setOpen(!ctx.open);
    },
    [ctx],
  );

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      (ctx.triggerRef as { current: HTMLButtonElement | null }).current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) {
        (forwardedRef as { current: HTMLButtonElement | null }).current = node;
      }
    },
    [ctx.triggerRef, forwardedRef],
  );

  return createElement(
    "button",
    {
      ...rest,
      ref: setRef,
      type: "button",
      id: ctx.triggerId,
      "aria-label": ariaLabel,
      "aria-haspopup": "dialog",
      "aria-expanded": ctx.open,
      "aria-controls": ctx.open ? ctx.contentId : undefined,
      disabled: ctx.disabled || ctx.readOnly,
      className,
      onClick: handleClick,
      "data-kui-component": "DatePickerTrigger",
      "data-state": ctx.open ? "open" : "closed",
    },
    children ?? "📅",
  );
});

// ─── DatePickerContent ──────────────────────────────────────────────

export interface DatePickerContentProps {
  children?: ReactNode;
  className?: string;
}

export const DatePickerContent = forwardRef<
  HTMLDivElement,
  DatePickerContentProps & HTMLAttributes<HTMLDivElement>
>(function DatePickerContent(props, forwardedRef) {
  const { children, className, ...rest } = props;
  const ctx = useDatePickerContext();

  return createElement(
    PopoverPortal,
    null,
    createElement(
      PopoverContent,
      {
        ...rest,
        ref: forwardedRef,
        className,
        id: ctx.contentId,
        "aria-label": "Choose date",
        "data-kui-component": "DatePickerContent",
        "data-kui-part": "date-picker-content",
      } as Parameters<typeof PopoverContent>[0],
      children,
    ),
  );
});

// ─── DatePickerCalendar ─────────────────────────────────────────────

export interface DatePickerCalendarProps {
  className?: string;
}

export const DatePickerCalendar = forwardRef<HTMLDivElement, DatePickerCalendarProps>(
  function DatePickerCalendar(props, forwardedRef) {
    const { className } = props;
    const ctx = useDatePickerContext();

    const handleValueChange = useCallback(
      (date: Date) => {
        if (!isValidDate(date)) return;
        const selected = dateOnlyFromDate(date);
        if (
          ctx.value &&
          isValidDate(ctx.value) &&
          isDateOnlyEqual(dateOnlyFromDate(ctx.value), selected)
        ) {
          // Same day re-selected — still close popover and refocus input.
          ctx.setValue(date);
        } else {
          ctx.setValue(date);
        }
        ctx.setOpen(false);
        // Return focus to the input after the popover closes.
        queueMicrotask(() => {
          ctx.inputRef.current?.focus();
        });
      },
      [ctx],
    );

    const disabledFn = ctx.disabledDate;
    const anchorValue = ctx.value && isValidDate(ctx.value) ? ctx.value : undefined;

    return createElement(Calendar, {
      ref: forwardedRef,
      ...(className ? { className } : undefined),
      onValueChange: handleValueChange,
      locale: ctx.locale,
      dir: ctx.dir,
      ...(anchorValue ? { value: anchorValue } : undefined),
      ...(ctx.min ? { min: ctx.min } : undefined),
      ...(ctx.max ? { max: ctx.max } : undefined),
      ...(disabledFn ? { disabled: disabledFn } : undefined),
    });
  },
);
