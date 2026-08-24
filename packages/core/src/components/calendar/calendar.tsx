import { forwardRef, createElement, useState, useMemo, useCallback } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { useControllableState } from "@kairoui/hooks";
import {
  generateMonthGrid,
  getWeekdayLabels,
  formatMonthYear,
  isSameDay,
  addMonths,
  moveFocus,
  getFirstFocusableDay,
} from "./calendar-model";
import type { WeekStart, CalendarDayInfo } from "./calendar-model";

// ─── Types ──────────────────────────────────────────────────────────

export interface CalendarRootProps {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  min?: Date;
  max?: Date;
  disabled?: (date: Date) => boolean;
  locale?: string;
  weekStartsOn?: WeekStart;
  dir?: "ltr" | "rtl";
  className?: string;
  children?: ReactNode;
}

// ─── Calendar ───────────────────────────────────────────────────────

export const Calendar = forwardRef<
  HTMLDivElement,
  CalendarRootProps & HTMLAttributes<HTMLDivElement>
>(function Calendar(props, ref) {
  const {
    value: controlledValue,
    defaultValue,
    onValueChange,
    min,
    max,
    disabled,
    locale = "en",
    weekStartsOn = 0,
    dir = "ltr",
    className,
    ...rest
  } = props;

  const [selectedDate, setSelectedDate] = useControllableState({
    value: controlledValue,
    defaultValue: defaultValue ?? undefined,
    ...(onValueChange ? { onChange: onValueChange } : undefined),
  } as Parameters<typeof useControllableState<Date | undefined>>[0]);

  const today = useMemo(() => new Date(), []);
  const initialMonth = selectedDate ?? defaultValue ?? today;
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());

  const constraints: { min?: Date; max?: Date; disabled?: (date: Date) => boolean } =
    useMemo(() => {
      const c: { min?: Date; max?: Date; disabled?: (date: Date) => boolean } = {};
      if (min !== undefined) c.min = min;
      if (max !== undefined) c.max = max;
      if (disabled !== undefined) c.disabled = disabled;
      return c;
    }, [min, max, disabled]);

  const [focusedDate, setFocusedDate] = useState<Date>(
    selectedDate ?? getFirstFocusableDay(viewYear, viewMonth, constraints),
  );

  const grid = useMemo(
    () =>
      generateMonthGrid({
        year: viewYear,
        month: viewMonth,
        weekStartsOn,
        today,
        ...constraints,
      }),
    [viewYear, viewMonth, weekStartsOn, today, constraints],
  );

  const weekdayLabels = useMemo(
    () => getWeekdayLabels(locale, weekStartsOn, "narrow"),
    [locale, weekStartsOn],
  );

  const heading = useMemo(
    () => formatMonthYear(viewYear, viewMonth, locale),
    [viewYear, viewMonth, locale],
  );

  const goToPrevMonth = useCallback(() => {
    const prev = addMonths(new Date(viewYear, viewMonth, 1), -1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
    setFocusedDate(getFirstFocusableDay(prev.getFullYear(), prev.getMonth(), constraints));
  }, [viewYear, viewMonth, constraints]);

  const goToNextMonth = useCallback(() => {
    const next = addMonths(new Date(viewYear, viewMonth, 1), 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setFocusedDate(getFirstFocusableDay(next.getFullYear(), next.getMonth(), constraints));
  }, [viewYear, viewMonth, constraints]);

  const selectDay = useCallback(
    (day: CalendarDayInfo) => {
      if (day.isDisabled) return;
      setSelectedDate(day.date);
      setFocusedDate(day.date);
      if (day.isOutsideMonth) {
        setViewYear(day.year);
        setViewMonth(day.month);
      }
    },
    [setSelectedDate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isRtl = dir === "rtl";
      let delta = 0;

      switch (e.key) {
        case "ArrowRight":
          delta = isRtl ? -1 : 1;
          break;
        case "ArrowLeft":
          delta = isRtl ? 1 : -1;
          break;
        case "ArrowDown":
          delta = 7;
          break;
        case "ArrowUp":
          delta = -7;
          break;
        default:
          return;
      }

      e.preventDefault();
      const next = moveFocus(focusedDate, delta, constraints);
      setFocusedDate(next);
      if (next.getMonth() !== viewMonth || next.getFullYear() !== viewYear) {
        setViewMonth(next.getMonth());
        setViewYear(next.getFullYear());
      }
    },
    [focusedDate, dir, constraints, viewMonth, viewYear],
  );

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "Calendar", "data-dir": dir, className },
    // Header
    createElement(
      "div",
      { "data-kui-component": "CalendarHeader" },
      createElement(
        "button",
        {
          type: "button",
          "aria-label": "Previous month",
          "data-kui-component": "CalendarPrev",
          onClick: goToPrevMonth,
        },
        "‹",
      ),
      createElement(
        "div",
        { "data-kui-component": "CalendarHeading", "aria-live": "polite" },
        heading,
      ),
      createElement(
        "button",
        {
          type: "button",
          "aria-label": "Next month",
          "data-kui-component": "CalendarNext",
          onClick: goToNextMonth,
        },
        "›",
      ),
    ),
    // Grid
    createElement(
      "table",
      {
        role: "grid",
        "aria-label": heading,
        "data-kui-component": "CalendarGrid",
        onKeyDown: handleKeyDown,
      },
      createElement(
        "thead",
        null,
        createElement(
          "tr",
          null,
          ...weekdayLabels.map((label, i) =>
            createElement(
              "th",
              { key: i, scope: "col", abbr: label, "data-kui-component": "CalendarWeekday" },
              label,
            ),
          ),
        ),
      ),
      createElement(
        "tbody",
        null,
        ...grid.weeks.map((week, wi) =>
          createElement(
            "tr",
            { key: wi, "data-kui-component": "CalendarWeek" },
            ...week.map((day) => {
              const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
              const isFocused = isSameDay(day.date, focusedDate);
              return createElement(
                "td",
                {
                  key: day.date.toISOString(),
                  role: "gridcell",
                  "aria-disabled": day.isDisabled || undefined,
                  "aria-selected": isSelected || undefined,
                  "data-today": day.isToday || undefined,
                  "data-outside-month": day.isOutsideMonth || undefined,
                  "data-selected": isSelected || undefined,
                  "data-disabled": day.isDisabled || undefined,
                  "data-kui-component": "CalendarDay",
                  tabIndex: isFocused ? 0 : -1,
                  onClick: () => {
                    selectDay(day);
                  },
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectDay(day);
                    }
                  },
                },
                String(day.day),
              );
            }),
          ),
        ),
      ),
    ),
  );
});
