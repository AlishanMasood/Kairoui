/**
 * Calendar grid model — framework-independent date arithmetic and grid generation.
 *
 * Timezone policy: All dates are treated as local calendar dates (no UTC conversion).
 * Uses native Date and Intl APIs only.
 */

// ─── Types ──────────────────────────────────────────────────────────

/** Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CalendarDayInfo {
  readonly date: Date;
  readonly day: number;
  readonly month: number;
  readonly year: number;
  readonly isToday: boolean;
  readonly isOutsideMonth: boolean;
  readonly isDisabled: boolean;
}

export type CalendarWeekRow = readonly CalendarDayInfo[];

export interface CalendarMonthGrid {
  readonly year: number;
  readonly month: number;
  readonly weeks: readonly CalendarWeekRow[];
}

export interface CalendarGridOptions {
  readonly year: number;
  readonly month: number;
  readonly weekStartsOn?: WeekStart;
  readonly today?: Date;
  readonly min?: Date;
  readonly max?: Date;
  readonly disabled?: (date: Date) => boolean;
}

// ─── Date utilities ─────────────────────────────────────────────────

/** Get the number of days in a given month (1-indexed month). */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Get the day of week (0-6) for the first day of a month. */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Check if two dates represent the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Check if a date falls within min/max bounds (inclusive). */
export function isDateInRange(date: Date, min?: Date, max?: Date): boolean {
  if (min && date < startOfDay(min)) return false;
  if (max && date > endOfDay(max)) return false;
  return true;
}

/** Get start of day (00:00:00.000). */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get end of day (23:59:59.999). */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Add months to a date, clamping to valid day in result month. */
export function addMonths(date: Date, count: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + count;
  d.setMonth(targetMonth);
  // Clamp if day overflowed (e.g. Jan 31 + 1 month → Feb 28)
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0);
  }
  return d;
}

// ─── Grid generation ────────────────────────────────────────────────

/** Generate a calendar month grid. */
export function generateMonthGrid(options: CalendarGridOptions): CalendarMonthGrid {
  const { year, month, weekStartsOn = 0, today = new Date(), min, max, disabled } = options;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Calculate offset from week start
  const offset = (firstDay - weekStartsOn + 7) % 7;

  const weeks: CalendarWeekRow[] = [];
  let currentWeek: CalendarDayInfo[] = [];

  // Fill leading days from previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = offset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(prevYear, prevMonth, day);
    currentWeek.push(makeDayInfo(date, month, today, min, max, disabled));
  }

  // Fill current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    currentWeek.push(makeDayInfo(date, month, today, min, max, disabled));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill trailing days from next month
  if (currentWeek.length > 0) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    let nextDay = 1;
    while (currentWeek.length < 7) {
      const date = new Date(nextYear, nextMonth, nextDay);
      currentWeek.push(makeDayInfo(date, month, today, min, max, disabled));
      nextDay++;
    }
    weeks.push(currentWeek);
  }

  return { year, month, weeks };
}

function makeDayInfo(
  date: Date,
  currentMonth: number,
  today: Date,
  min: Date | undefined,
  max: Date | undefined,
  disabled: ((date: Date) => boolean) | undefined,
): CalendarDayInfo {
  const isOutsideMonth = date.getMonth() !== currentMonth;
  const isDisabled = !isDateInRange(date, min, max) || (disabled ? disabled(date) : false);

  return {
    date,
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
    isToday: isSameDay(date, today),
    isOutsideMonth,
    isDisabled,
  };
}

// ─── Weekday labels ─────────────────────────────────────────────────

/** Get localized weekday labels starting from the configured week start. */
export function getWeekdayLabels(
  locale: string = "en",
  weekStartsOn: WeekStart = 0,
  format: "narrow" | "short" | "long" = "narrow",
): readonly string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
  const labels: string[] = [];
  // Use a known Sunday (Jan 4, 2026 is a Sunday)
  const baseSunday = new Date(2026, 0, 4);
  for (let i = 0; i < 7; i++) {
    const dayIndex = (weekStartsOn + i) % 7;
    const date = new Date(baseSunday);
    date.setDate(baseSunday.getDate() + dayIndex);
    labels.push(formatter.format(date));
  }
  return labels;
}

/** Format a month/year heading using Intl. */
export function formatMonthYear(year: number, month: number, locale: string = "en"): string {
  const date = new Date(year, month, 1);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

// ─── Focus movement ─────────────────────────────────────────────────

/** Add days to a date, returning a new Date. */
export function addDays(date: Date, count: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + count);
  return d;
}

/** Move focus by a number of days, skipping disabled dates. */
export function moveFocus(
  date: Date,
  delta: number,
  options: { min?: Date; max?: Date; disabled?: (date: Date) => boolean } = {},
): Date {
  const { min, max, disabled } = options;
  let next = addDays(date, delta);
  let attempts = 0;
  const step = delta > 0 ? 1 : -1;
  while (attempts < 365) {
    if (isDateInRange(next, min, max) && !(disabled?.(next) ?? false)) {
      return next;
    }
    next = addDays(next, step);
    attempts++;
  }
  return date;
}

/** Get the first non-disabled day in a month. */
export function getFirstFocusableDay(
  year: number,
  month: number,
  options: { min?: Date; max?: Date; disabled?: (date: Date) => boolean } = {},
): Date {
  const daysInMonth = getDaysInMonth(year, month);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (isDateInRange(date, options.min, options.max) && !(options.disabled?.(date) ?? false)) {
      return date;
    }
  }
  return new Date(year, month, 1);
}

/** Clamp a date within min/max bounds. */
export function clampDate(date: Date, min?: Date, max?: Date): Date {
  if (min && date < startOfDay(min)) return new Date(min);
  if (max && date > endOfDay(max)) return new Date(max);
  return date;
}
