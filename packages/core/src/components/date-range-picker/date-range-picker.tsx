/* eslint-disable react-hooks/refs, react-hooks/immutability */
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import {
  dateFromDateOnly,
  dateOnlyFromDate,
  formatDateOnlyISO,
  isDateOnlyEqual,
  isValidDate,
} from "@kairoui/utils/date";
import type { DateRange } from "@kairoui/utils/date";
import { Popover, PopoverAnchor, PopoverContent, PopoverPortal } from "../popover/popover";
import {
  addDays,
  addMonths,
  formatMonthYear,
  generateMonthGrid,
  getWeekdayLabels,
  isSameDay,
} from "../calendar/calendar-model";
import type { WeekStart } from "../calendar/calendar-model";
import { DateInput } from "../date-input/date-input";
import type { DateInputProps } from "../date-input/date-input";
import { useFieldContext } from "../field/field-context";
import { resolveFieldControlProps } from "../field/field-control-props";
import {
  DateRangePickerContext,
  DEFAULT_MESSAGES,
  useDateRangePickerContext,
  type DateRangePickerContextValue,
  type DateRangePickerEndpoint,
  type DateRangePickerFormatFn,
  type DateRangePickerMessages,
  type DateRangePickerParseFn,
} from "./date-range-picker-context";

// ─── Utilities ──────────────────────────────────────────────────────

function toValid(date: Date | null | undefined): Date | null {
  if (!date || !isValidDate(date)) return null;
  return date;
}

function daysBetween(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const startOfA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const startOfB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round(Math.abs(startOfB - startOfA) / ms) + 1;
}

function normalize(start: Date | null, end: Date | null): DateRange {
  const s = toValid(start);
  const e = toValid(end);
  if (s && e && s.getTime() > e.getTime()) return { start: e, end: s };
  if (!s && e) return { start: e, end: null };
  return { start: s, end: e };
}

function inRange(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const t = day.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

// ─── Root ────────────────────────────────────────────────────────────

export interface DateRangePickerOwnProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
  /** Fires per-endpoint commit before ordering — useful for logging user intent. */
  onEndpointCommit?: (endpoint: DateRangePickerEndpoint, value: Date | null) => void;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  min?: Date;
  max?: Date;
  disabledDate?: (date: Date) => boolean;
  /** Enforce a minimum span in days (inclusive of both endpoints). */
  minLength?: number;
  /** Enforce a maximum span in days (inclusive of both endpoints). */
  maxLength?: number;

  /** Emit only complete ranges. Partial ranges are buffered internally. */
  requireComplete?: boolean;
  /** Enable pointer-hover preview of the pending end date. Defaults to `true`. */
  hoverPreview?: boolean;

  locale?: string;
  dir?: "ltr" | "rtl";
  weekStartsOn?: WeekStart;

  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;

  name?: string;
  form?: string;

  parse?: DateRangePickerParseFn;
  format?: DateRangePickerFormatFn;

  /** Localized announcements for the live region. */
  messages?: Partial<DateRangePickerMessages>;

  children: ReactNode;
  className?: string;
}

export type DateRangePickerProps = DateRangePickerOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | keyof DateRangePickerOwnProps>;

const ROOT_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "stretch",
  gap: 6,
  width: "100%",
  position: "relative",
};

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DateRangePicker(props, forwardedRef) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      onEndpointCommit,
      open: controlledOpen,
      defaultOpen,
      onOpenChange,
      min,
      max,
      disabledDate,
      minLength,
      maxLength,
      requireComplete = false,
      hoverPreview = true,
      locale = "en-US",
      dir = "ltr",
      weekStartsOn = 0,
      disabled,
      readOnly,
      required,
      invalid,
      name,
      form,
      parse,
      format,
      messages,
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

    const [value, setValueRaw] = useControllableState<DateRange>({
      value: controlledValue,
      defaultValue: defaultValue ?? { start: null, end: null },
      ...(onValueChange ? { onChange: onValueChange } : undefined),
      name: "DateRangePicker",
      state: "value",
    });

    const [open, setOpen] = useControllableState<boolean>({
      value: controlledOpen,
      defaultValue: defaultOpen ?? false,
      ...(onOpenChange ? { onChange: onOpenChange } : undefined),
      name: "DateRangePicker",
      state: "open",
    });

    const [activeEndpoint, setActiveEndpoint] = useState<DateRangePickerEndpoint>(() =>
      value.start && !value.end ? "end" : "start",
    );
    const [previewEnd, setPreviewEnd] = useState<Date | null>(null);

    // Buffer for `requireComplete` — holds a start that has been committed
    // but not yet emitted upstream.
    const bufferedStartRef = useRef<Date | null>(null);

    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const lastFocusSourceRef = useRef<"start" | "end" | "trigger" | null>(null);

    const startInputId = useId(undefined, { prefix: "kui-dr-start" });
    const endInputId = useId(undefined, { prefix: "kui-dr-end" });
    const triggerId = useId(undefined, { prefix: "kui-dr-trigger" });
    const contentId = useId(undefined, { prefix: "kui-dr-content" });
    const liveRegionId = useId(undefined, { prefix: "kui-dr-live" });

    const [announcement, setAnnouncement] = useState("");
    const announce = useCallback((msg: string) => {
      setAnnouncement(msg);
    }, []);

    const resolvedMessages = useMemo<DateRangePickerMessages>(
      () => ({ ...DEFAULT_MESSAGES, ...messages }),
      [messages],
    );

    const setEndpoint = useCallback(
      (endpoint: DateRangePickerEndpoint, next: Date | null) => {
        onEndpointCommit?.(endpoint, next);

        // requireComplete + start commit → buffer, do not emit
        if (requireComplete && endpoint === "start") {
          bufferedStartRef.current = next;
          if (next) {
            announce(resolvedMessages.startCommitted(next));
          }
          return;
        }

        // Compute the raw pair before normalization.
        const rawStart = endpoint === "start" ? next : (bufferedStartRef.current ?? value.start);
        const rawEnd = endpoint === "end" ? next : value.end;

        const normalized = normalize(rawStart, rawEnd);
        const wasSwapped = rawStart && rawEnd && rawStart.getTime() > rawEnd.getTime();

        setValueRaw(normalized);
        bufferedStartRef.current = null;

        if (wasSwapped && normalized.start && normalized.end) {
          announce(resolvedMessages.swapped(normalized));
        } else if (endpoint === "end" && normalized.start && normalized.end) {
          const days = daysBetween(normalized.start, normalized.end);
          announce(resolvedMessages.endCommitted(normalized, days));
        } else if (endpoint === "start" && next) {
          announce(resolvedMessages.startCommitted(next));
        } else if (endpoint === "start" && !next && !normalized.start && !normalized.end) {
          announce(resolvedMessages.cleared);
        }
      },
      [
        onEndpointCommit,
        requireComplete,
        value.start,
        value.end,
        setValueRaw,
        announce,
        resolvedMessages,
      ],
    );

    const clear = useCallback(() => {
      bufferedStartRef.current = null;
      setValueRaw({ start: null, end: null });
      setActiveEndpoint("start");
      announce(resolvedMessages.cleared);
    }, [setValueRaw, announce, resolvedMessages]);

    const ctx = useMemo<DateRangePickerContextValue>(
      () => ({
        value,
        setEndpoint,
        clear,
        open,
        setOpen,
        activeEndpoint,
        setActiveEndpoint,
        previewEnd,
        setPreviewEnd,
        min,
        max,
        disabledDate,
        minLength,
        maxLength,
        locale,
        dir,
        weekStartsOn,
        hoverPreview,
        disabled: resolvedDisabled,
        readOnly: resolvedReadOnly,
        required: resolvedRequired,
        invalid: resolvedInvalid,
        name,
        form,
        parse,
        format,
        startInputId,
        endInputId,
        triggerId,
        contentId,
        liveRegionId,
        startInputRef,
        endInputRef,
        triggerRef,
        lastFocusSourceRef,
        announce,
        messages: resolvedMessages,
      }),
      [
        value,
        setEndpoint,
        clear,
        open,
        setOpen,
        activeEndpoint,
        previewEnd,
        min,
        max,
        disabledDate,
        minLength,
        maxLength,
        locale,
        dir,
        weekStartsOn,
        hoverPreview,
        resolvedDisabled,
        resolvedReadOnly,
        resolvedRequired,
        resolvedInvalid,
        name,
        form,
        parse,
        format,
        startInputId,
        endInputId,
        triggerId,
        contentId,
        liveRegionId,
        announce,
        resolvedMessages,
      ],
    );

    const mergedStyle: CSSProperties = { ...ROOT_STYLE, ...style };

    return createElement(
      DateRangePickerContext.Provider,
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
            dir,
            "data-kui-component": "DateRangePicker",
            "data-state": open ? "open" : "closed",
            ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
            ...(resolvedReadOnly ? { "data-readonly": "" } : undefined),
            ...(resolvedInvalid ? { "data-invalid": "" } : undefined),
          },
          children,
          // Visually-hidden live region.
          createElement(
            "div",
            {
              id: liveRegionId,
              role: "status",
              "aria-live": "polite",
              "aria-atomic": "true",
              style: {
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                whiteSpace: "nowrap",
                border: 0,
              } satisfies CSSProperties,
              "data-kui-part": "date-range-picker-live",
            },
            announcement,
          ),
        ),
      ),
    );
  },
);

// ─── DateRangePickerStartInput / EndInput ───────────────────────────

type EndpointInputProps = Omit<
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
>;

export type DateRangePickerStartInputProps = EndpointInputProps & { id?: string };
export type DateRangePickerEndInputProps = EndpointInputProps & { id?: string };

function makeEndpointInput(endpoint: DateRangePickerEndpoint, displayName: string) {
  const Component = forwardRef<HTMLInputElement, EndpointInputProps & { id?: string }>(
    function EndpointInput(props, forwardedRef) {
      const { id, onKeyDown, ...rest } = props;
      const ctx = useDateRangePickerContext();
      const fieldCtx = useFieldContext();
      const fieldControlProps = resolveFieldControlProps(fieldCtx, "input");

      const inputRef = endpoint === "start" ? ctx.startInputRef : ctx.endInputRef;
      const currentValue = endpoint === "start" ? ctx.value.start : ctx.value.end;
      const inputId = id ?? (endpoint === "start" ? ctx.startInputId : ctx.endInputId);

      // Only the START input carries aria-errormessage — see architecture doc.
      const ariaAttrs: Record<string, string> = {};
      if (endpoint === "start") {
        if (fieldControlProps["aria-labelledby"]) {
          ariaAttrs["aria-labelledby"] = fieldControlProps["aria-labelledby"] as string;
        }
        if (fieldControlProps["aria-describedby"]) {
          ariaAttrs["aria-describedby"] = fieldControlProps["aria-describedby"] as string;
        }
        if (fieldControlProps["aria-errormessage"]) {
          ariaAttrs["aria-errormessage"] = fieldControlProps["aria-errormessage"] as string;
        }
      } else {
        if (fieldControlProps["aria-labelledby"]) {
          ariaAttrs["aria-labelledby"] = fieldControlProps["aria-labelledby"] as string;
        }
        if (fieldControlProps["aria-describedby"]) {
          ariaAttrs["aria-describedby"] = fieldControlProps["aria-describedby"] as string;
        }
      }

      const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            ctx.lastFocusSourceRef.current = endpoint;
            ctx.setActiveEndpoint(endpoint);
            ctx.setOpen(true);
          } else if (event.key === "ArrowUp" && event.altKey) {
            event.preventDefault();
            ctx.setOpen(false);
          }
          onKeyDown?.(event);
        },
        [ctx, onKeyDown],
      );

      const setRef = useCallback(
        (node: HTMLInputElement | null) => {
          (inputRef as { current: HTMLInputElement | null }).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) {
            (forwardedRef as { current: HTMLInputElement | null }).current = node;
          }
        },
        [inputRef, forwardedRef],
      );

      const hiddenName = ctx.name !== undefined ? `${ctx.name}.${endpoint}` : undefined;

      const dateInput = createElement(DateInput, {
        ...rest,
        ref: setRef,
        id: inputId,
        value: currentValue,
        onValueChange: (v: Date | null) => {
          ctx.setEndpoint(endpoint, v);
        },
        locale: ctx.locale,
        disabled: ctx.disabled,
        readOnly: ctx.readOnly,
        required: ctx.required,
        invalid: ctx.invalid,
        ...(ctx.min ? { min: ctx.min } : undefined),
        ...(ctx.max ? { max: ctx.max } : undefined),
        ...(hiddenName ? { name: hiddenName } : undefined),
        ...(ctx.form ? { form: ctx.form } : undefined),
        ...(ctx.parse ? { parse: ctx.parse } : undefined),
        ...(ctx.format ? { format: ctx.format } : undefined),
        onKeyDown: handleKeyDown,
        inputProps: {
          "aria-haspopup": "dialog",
          "aria-expanded": ctx.open ? "true" : "false",
          ...(ctx.open ? { "aria-controls": ctx.contentId } : undefined),
          ...ariaAttrs,
          // End input must NOT carry aria-errormessage (only start does).
          ...(endpoint === "end" ? { "aria-errormessage": undefined } : undefined),
          "data-kui-part": `date-range-picker-${endpoint}-input`,
        },
      });

      // Only anchor the popover to the input the user activated most recently
      // (default: start input).
      const isAnchor =
        (ctx.lastFocusSourceRef.current === null && endpoint === "start") ||
        ctx.lastFocusSourceRef.current === endpoint;

      if (!isAnchor) return dateInput;
      return createElement(PopoverAnchor, { style: { display: "flex", flex: 1 } }, dateInput);
    },
  );
  Component.displayName = displayName;
  return Component;
}

export const DateRangePickerStartInput = makeEndpointInput("start", "DateRangePickerStartInput");
export const DateRangePickerEndInput = makeEndpointInput("end", "DateRangePickerEndInput");

// ─── DateRangePickerClear ───────────────────────────────────────────

export interface DateRangePickerClearProps {
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export const DateRangePickerClear = forwardRef<
  HTMLButtonElement,
  DateRangePickerClearProps & Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "aria-label">
>(function DateRangePickerClear(props, forwardedRef) {
  const { children, className, "aria-label": ariaLabel = "Clear range", ...rest } = props;
  const ctx = useDateRangePickerContext();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      ctx.clear();
      ctx.startInputRef.current?.focus();
    },
    [ctx],
  );

  const hasAny = ctx.value.start !== null || ctx.value.end !== null;
  if (!hasAny || ctx.disabled || ctx.readOnly) return null;

  return createElement(
    "button",
    {
      ...rest,
      ref: forwardedRef,
      type: "button",
      "aria-label": ariaLabel,
      className,
      onClick: handleClick,
      "data-kui-component": "DateRangePickerClear",
    },
    children ?? "×",
  );
});

// ─── DateRangePickerTrigger ─────────────────────────────────────────

export interface DateRangePickerTriggerProps {
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export const DateRangePickerTrigger = forwardRef<
  HTMLButtonElement,
  DateRangePickerTriggerProps & Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "aria-label">
>(function DateRangePickerTrigger(props, forwardedRef) {
  const { children, className, "aria-label": ariaLabel = "Open calendar", ...rest } = props;
  const ctx = useDateRangePickerContext();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (ctx.disabled || ctx.readOnly) return;
      ctx.lastFocusSourceRef.current = "trigger";
      // Opening from the trigger: pick activeEndpoint based on state.
      const next = !ctx.open;
      if (next) {
        if (ctx.value.start && !ctx.value.end) ctx.setActiveEndpoint("end");
        else ctx.setActiveEndpoint("start");
      }
      ctx.setOpen(next);
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
      "data-kui-component": "DateRangePickerTrigger",
      "data-state": ctx.open ? "open" : "closed",
    },
    children ?? "📅",
  );
});

// ─── DateRangePickerContent ─────────────────────────────────────────

export interface DateRangePickerContentProps {
  children?: ReactNode;
  className?: string;
}

export const DateRangePickerContent = forwardRef<
  HTMLDivElement,
  DateRangePickerContentProps & HTMLAttributes<HTMLDivElement>
>(function DateRangePickerContent(props, forwardedRef) {
  const { children, className, ...rest } = props;
  const ctx = useDateRangePickerContext();

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
        "aria-label": "Select date range",
        "data-kui-component": "DateRangePickerContent",
        "data-kui-part": "date-range-picker-content",
      } as Parameters<typeof PopoverContent>[0],
      children,
    ),
  );
});

// ─── DateRangePickerCalendars ───────────────────────────────────────

export interface DateRangePickerCalendarsProps {
  /** Number of months to render side by side. Defaults to 2. */
  months?: 1 | 2;
  className?: string;
}

interface RangeCalendarGridProps {
  viewYear: number;
  viewMonth: number;
  focusedDate: Date;
  registerCell: (iso: string, el: HTMLButtonElement | null) => void;
}

function useHandleDayClick() {
  const ctx = useDateRangePickerContext();
  return useCallback(
    (date: Date) => {
      if (ctx.activeEndpoint === "start") {
        ctx.setEndpoint("start", date);
        ctx.setActiveEndpoint("end");
        return;
      }
      // activeEndpoint === "end" — setEndpoint normalizes swaps.
      ctx.setEndpoint("end", date);
      ctx.setOpen(false);
      ctx.setPreviewEnd(null);
      queueMicrotask(() => {
        (ctx.lastFocusSourceRef.current === "start"
          ? ctx.startInputRef
          : ctx.endInputRef
        ).current?.focus();
      });
    },
    [ctx],
  );
}

function RangeCalendarGrid(props: RangeCalendarGridProps) {
  const { viewYear, viewMonth, focusedDate, registerCell } = props;
  const ctx = useDateRangePickerContext();
  const handleDayClick = useHandleDayClick();

  const grid = useMemo(
    () =>
      generateMonthGrid({
        year: viewYear,
        month: viewMonth,
        weekStartsOn: ctx.weekStartsOn,
        ...(ctx.min ? { min: ctx.min } : undefined),
        ...(ctx.max ? { max: ctx.max } : undefined),
        ...(ctx.disabledDate ? { disabled: ctx.disabledDate } : undefined),
      }),
    [viewYear, viewMonth, ctx.weekStartsOn, ctx.min, ctx.max, ctx.disabledDate],
  );

  const weekdayLabels = useMemo(
    () => getWeekdayLabels(ctx.locale, ctx.weekStartsOn, "narrow"),
    [ctx.locale, ctx.weekStartsOn],
  );

  const monthHeading = useMemo(
    () => formatMonthYear(viewYear, viewMonth, ctx.locale),
    [viewYear, viewMonth, ctx.locale],
  );

  const start = toValid(ctx.value.start);
  const end = toValid(ctx.value.end);
  const preview = ctx.hoverPreview ? toValid(ctx.previewEnd) : null;

  // Effective end for highlighting: either the committed end, or the hover preview.
  const effectiveEnd = end ?? (start && preview ? preview : null);

  // For length constraint visualization (dim out-of-range cells).
  const constraintEndMax = start && ctx.maxLength ? addDays(start, ctx.maxLength - 1) : null;
  const constraintEndMin = start && ctx.minLength ? addDays(start, ctx.minLength - 1) : null;

  return createElement(
    "div",
    {
      role: "grid",
      "aria-label": monthHeading,
      "data-kui-component": "DateRangeCalendarGrid",
      onPointerLeave: () => {
        ctx.setPreviewEnd(null);
      },
    },
    createElement("div", { "data-kui-part": "month-heading" }, monthHeading),
    createElement(
      "div",
      { role: "row", "data-kui-part": "weekday-row" },
      ...weekdayLabels.map((label, i) =>
        createElement(
          "div",
          {
            role: "columnheader",
            key: `wd-${String(i)}`,
            "data-kui-part": "weekday",
          },
          label,
        ),
      ),
    ),
    ...grid.weeks.map((week, wi) =>
      createElement(
        "div",
        { role: "row", key: `wk-${String(wi)}`, "data-kui-part": "week" },
        ...week.map((day) => {
          const isStart = start !== null && isSameDay(day.date, start);
          const isEnd = end !== null && isSameDay(day.date, end);
          const isPreviewEnd = preview !== null && !end && isSameDay(day.date, preview);
          const isInRange =
            (start && effectiveEnd && inRange(day.date, start, effectiveEnd)) === true;
          const isPreviewRange =
            preview !== null && !end && start !== null && inRange(day.date, start, preview);

          const outOfMax =
            constraintEndMax !== null &&
            ctx.activeEndpoint === "end" &&
            day.date.getTime() > constraintEndMax.getTime();
          const belowMin =
            constraintEndMin !== null &&
            ctx.activeEndpoint === "end" &&
            day.date.getTime() < (start?.getTime() ?? 0);

          const isCellDisabled = day.isDisabled || outOfMax || belowMin;
          const iso = day.date.toISOString();
          const isRovingTarget = !day.isOutsideMonth && isSameDay(day.date, focusedDate);

          return createElement(
            "button",
            {
              type: "button",
              key: iso,
              ref: (el: HTMLButtonElement | null) => {
                if (!day.isOutsideMonth) registerCell(iso, el);
              },
              role: "gridcell",
              "aria-selected": isStart || isEnd || undefined,
              "aria-disabled": isCellDisabled || undefined,
              disabled: isCellDisabled,
              tabIndex: isRovingTarget ? 0 : -1,
              onClick: () => {
                if (isCellDisabled) return;
                handleDayClick(day.date);
              },
              onPointerEnter: () => {
                if (!ctx.hoverPreview) return;
                if (ctx.activeEndpoint !== "end") return;
                if (!start) return;
                ctx.setPreviewEnd(day.date);
              },
              "data-today": day.isToday || undefined,
              "data-outside-month": day.isOutsideMonth || undefined,
              "data-selected": isStart || isEnd || undefined,
              "data-range-start": isStart || undefined,
              "data-range-end": isEnd || undefined,
              "data-in-range": isInRange || undefined,
              "data-preview-in-range": isPreviewRange && !isInRange ? true : undefined,
              "data-preview-end": isPreviewEnd || undefined,
              "data-disabled": isCellDisabled || undefined,
              "data-out-of-range": outOfMax || undefined,
              "data-kui-component": "DateRangeCalendarDay",
            },
            String(day.day),
          );
        }),
      ),
    ),
  );
}

export const DateRangePickerCalendars = forwardRef<
  HTMLDivElement,
  DateRangePickerCalendarsProps & Omit<HTMLAttributes<HTMLDivElement>, "children">
>(function DateRangePickerCalendars(props, forwardedRef) {
  const { months = 2, className, ...rest } = props;
  const ctx = useDateRangePickerContext();

  const anchor = toValid(ctx.value.start) ?? toValid(ctx.value.end) ?? new Date();

  const [viewMonth, setViewMonth] = useState(() => ({
    year: anchor.getFullYear(),
    month: anchor.getMonth(),
  }));

  const [focusedDate, setFocusedDate] = useState<Date>(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()),
  );

  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const registerCell = useCallback((iso: string, el: HTMLButtonElement | null) => {
    if (el) cellRefs.current.set(iso, el);
    else cellRefs.current.delete(iso);
  }, []);

  // Only focus the cell imperatively when a keyboard action moved focus.
  const shouldRefocusRef = useRef(false);
  useEffect(() => {
    if (!shouldRefocusRef.current) return;
    shouldRefocusRef.current = false;
    const iso = focusedDate.toISOString();
    const el = cellRefs.current.get(iso);
    el?.focus();
  }, [focusedDate]);

  const goPrev = useCallback(() => {
    setViewMonth((prev) => {
      const d = addMonths(new Date(prev.year, prev.month, 1), -1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const goNext = useCallback(() => {
    setViewMonth((prev) => {
      const d = addMonths(new Date(prev.year, prev.month, 1), 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const secondMonth = useMemo(() => {
    if (months !== 2) return null;
    const d = addMonths(new Date(viewMonth.year, viewMonth.month, 1), 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [months, viewMonth]);

  const advanceViewToInclude = useCallback(
    (next: Date) => {
      const nextY = next.getFullYear();
      const nextM = next.getMonth();
      const firstIndex = viewMonth.year * 12 + viewMonth.month;
      const lastIndex = secondMonth ? secondMonth.year * 12 + secondMonth.month : firstIndex;
      const nextIndex = nextY * 12 + nextM;
      if (nextIndex < firstIndex) {
        setViewMonth({ year: nextY, month: nextM });
      } else if (nextIndex > lastIndex) {
        const anchorFirst = secondMonth
          ? addMonths(new Date(nextY, nextM, 1), -1)
          : new Date(nextY, nextM, 1);
        setViewMonth({
          year: anchorFirst.getFullYear(),
          month: anchorFirst.getMonth(),
        });
      }
    },
    [viewMonth, secondMonth],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const isRtl = ctx.dir === "rtl";
      let delta = 0;
      switch (e.key) {
        case "ArrowRight":
          delta = isRtl ? -1 : 1;
          break;
        case "ArrowLeft":
          delta = isRtl ? 1 : -1;
          break;
        case "ArrowUp":
          delta = -7;
          break;
        case "ArrowDown":
          delta = 7;
          break;
        case "PageUp":
          delta = e.shiftKey ? -365 : -30;
          break;
        case "PageDown":
          delta = e.shiftKey ? 365 : 30;
          break;
        case "Home": {
          e.preventDefault();
          const dayOfWeek = focusedDate.getDay();
          const daysBack = (dayOfWeek - ctx.weekStartsOn + 7) % 7;
          const next = addDays(focusedDate, -daysBack);
          shouldRefocusRef.current = true;
          setFocusedDate(next);
          advanceViewToInclude(next);
          return;
        }
        case "End": {
          e.preventDefault();
          const dayOfWeek = focusedDate.getDay();
          const daysForward = 6 - ((dayOfWeek - ctx.weekStartsOn + 7) % 7);
          const next = addDays(focusedDate, daysForward);
          shouldRefocusRef.current = true;
          setFocusedDate(next);
          advanceViewToInclude(next);
          return;
        }
        default:
          return;
      }
      e.preventDefault();
      const next = addDays(focusedDate, delta);
      shouldRefocusRef.current = true;
      setFocusedDate(next);
      advanceViewToInclude(next);
    },
    [ctx.dir, ctx.weekStartsOn, focusedDate, advanceViewToInclude],
  );

  return createElement(
    "div",
    {
      ...rest,
      ref: forwardedRef,
      className,
      "data-kui-component": "DateRangePickerCalendars",
      "data-months": String(months),
      dir: ctx.dir,
      onKeyDown: handleKeyDown,
    },
    createElement(
      "div",
      { "data-kui-part": "nav" },
      createElement(
        "button",
        {
          type: "button",
          onClick: goPrev,
          "aria-label": "Previous month",
          "data-kui-part": "prev-button",
        },
        ctx.dir === "rtl" ? "›" : "‹",
      ),
      createElement(
        "button",
        {
          type: "button",
          onClick: goNext,
          "aria-label": "Next month",
          "data-kui-part": "next-button",
        },
        ctx.dir === "rtl" ? "‹" : "›",
      ),
    ),
    createElement(
      "div",
      { style: { display: "flex", gap: 12 }, "data-kui-part": "calendars" },
      createElement(RangeCalendarGrid, {
        viewYear: viewMonth.year,
        viewMonth: viewMonth.month,
        focusedDate,
        registerCell,
      }),
      secondMonth
        ? createElement(RangeCalendarGrid, {
            viewYear: secondMonth.year,
            viewMonth: secondMonth.month,
            focusedDate,
            registerCell,
          })
        : null,
    ),
  );
});

// Suppress unused import warnings for utilities kept for tests / future work.
void formatDateOnlyISO;
void dateFromDateOnly;
void dateOnlyFromDate;
void isDateOnlyEqual;
