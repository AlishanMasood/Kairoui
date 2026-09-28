// Wall-clock time math for the Scheduler. All functions treat `Date`
// as local wall-clock time — no timezone conversion, no UTC coercion.
// Calendar-day comparisons use `.getFullYear()` / `.getMonth()` /
// `.getDate()` so they are DST-safe.

import type { SchedulerViewProps, TimeSlot, VisibleRange, WeekStart } from "./scheduler-types";

// ─── Validation ───────────────────────────────────────────────────

/** True when `d` is a `Date` that is not `Invalid Date`. */
export function isValidSchedulerDate(d: unknown): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/**
 * Throws when `d` is not a valid `Date`. Hard boundary — Scheduler
 * refuses to lay out `Invalid Date` values because every downstream
 * calculation would silently produce `NaN`.
 */
export function assertValidSchedulerDate(d: unknown, name: string): asserts d is Date {
  if (!isValidSchedulerDate(d)) {
    throw new TypeError(`Scheduler: ${name} must be a valid Date, received ${String(d)}`);
  }
}

// ─── Basic constructors ───────────────────────────────────────────

/** Returns a new `Date` at 00:00:00.000 on the same calendar day. */
export function startOfDay(d: Date): Date {
  const out = new Date(d.getTime());
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Returns a new `Date` at 23:59:59.999 on the same calendar day. */
export function endOfDay(d: Date): Date {
  const out = new Date(d.getTime());
  out.setHours(23, 59, 59, 999);
  return out;
}

/**
 * Returns a new `Date` at 00:00 on the day `days` after `d`. Uses
 * `setDate` so DST transitions are handled by the platform.
 */
export function addDays(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + days);
  return out;
}

/** Returns a new `Date` `minutes` minutes after `d`. */
export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

/**
 * Returns a new `Date` at 00:00 on the first day of the week
 * containing `d`, honoring `weekStartsOn` (0 = Sunday, 1 = Monday, …).
 */
export function startOfWeek(d: Date, weekStartsOn: WeekStart): Date {
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  return startOfDay(addDays(d, -diff));
}

// ─── Predicates and comparisons ───────────────────────────────────

/**
 * True when `a` and `b` are the same calendar day. Uses year / month /
 * date accessors so DST does not skew the result.
 */
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** -1, 0, 1 by instant. */
export function compareDate(a: Date, b: Date): -1 | 0 | 1 {
  const ta = a.getTime();
  const tb = b.getTime();
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  return 0;
}

/**
 * Signed count of calendar days between two dates by `startOfDay`
 * midnight difference, rounded so DST does not off-by-one the result.
 * Positive when `b` is after `a`.
 */
export function differenceInCalendarDays(a: Date, b: Date): number {
  const startA = startOfDay(a).getTime();
  const startB = startOfDay(b).getTime();
  const diffMs = startB - startA;
  return Math.round(diffMs / 86_400_000);
}

/** Difference in minutes as a real number: `(b - a) / 60_000`. */
export function differenceInMinutes(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60_000;
}

/** Wall-clock minutes since 00:00 of the same calendar day. */
export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 + d.getMilliseconds() / 60_000;
}

/** Returns a new `Date` clamped to `[min, max]` by instant. */
export function clampDate(d: Date, min: Date, max: Date): Date {
  const t = d.getTime();
  if (t < min.getTime()) return new Date(min.getTime());
  if (t > max.getTime()) return new Date(max.getTime());
  return new Date(t);
}

// ─── Snap helpers ─────────────────────────────────────────────────

/**
 * Rounds `minutes` to the nearest multiple of `intervalMinutes`.
 * Ties round away from zero. Throws when `intervalMinutes <= 0`.
 */
export function snapToInterval(minutes: number, intervalMinutes: number): number {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new RangeError(
      `Scheduler: intervalMinutes must be a positive finite number, received ${String(intervalMinutes)}`,
    );
  }
  const sign = minutes >= 0 ? 1 : -1;
  return sign * Math.round(Math.abs(minutes) / intervalMinutes) * intervalMinutes;
}

/**
 * Snaps `d` to the nearest `intervalMinutes` boundary anchored at
 * `anchor`. The returned `Date` is the anchor plus a whole number of
 * `intervalMinutes`.
 */
export function snapDateToInterval(d: Date, intervalMinutes: number, anchor: Date): Date {
  const offset = differenceInMinutes(anchor, d);
  return addMinutes(anchor, snapToInterval(offset, intervalMinutes));
}

// ─── Visible range ────────────────────────────────────────────────

const DEFAULT_DAYS_IN_VIEW: Readonly<Record<"day" | "week" | "timeline", number>> = {
  day: 1,
  week: 7,
  timeline: 1,
};

export interface VisibleRangeOptions {
  readonly kind: SchedulerViewProps["kind"];
  readonly date: Date;
  readonly weekStartsOn?: WeekStart;
  readonly daysInView?: number;
}

/**
 * Computes the inclusive-start / exclusive-end range visible in a
 * view, together with one `startOfDay` `Date` per visible day.
 *
 * - `day` and `timeline` anchor on `startOfDay(date)`.
 * - `week` anchors on `startOfWeek(date, weekStartsOn)`.
 * - `daysInView` overrides the default (1 for day / timeline, 7 for
 *   week) — must be a positive integer.
 */
export function computeVisibleRange(options: VisibleRangeOptions): VisibleRange {
  assertValidSchedulerDate(options.date, "date");
  const kind = options.kind;
  const requestedDays = options.daysInView ?? DEFAULT_DAYS_IN_VIEW[kind];
  if (!Number.isInteger(requestedDays) || requestedDays < 1) {
    throw new RangeError(
      `Scheduler: daysInView must be a positive integer, received ${String(requestedDays)}`,
    );
  }

  const weekStartsOn = options.weekStartsOn ?? 1;
  const start =
    kind === "week" ? startOfWeek(options.date, weekStartsOn) : startOfDay(options.date);
  const end = addDays(start, requestedDays);

  const days: Date[] = [];
  for (let i = 0; i < requestedDays; i++) {
    days.push(addDays(start, i));
  }

  return { start, end, days };
}

// ─── Slot generation ──────────────────────────────────────────────

export interface SlotOptions {
  /** Inclusive minute-of-day (0…24 * 60). Default 0. */
  readonly startHour?: number;
  /** Exclusive minute-of-day (0…24 * 60). Default 24. */
  readonly endHour?: number;
  /** Slot size in minutes. Must divide `endHour - startHour`. Default 30. */
  readonly slotMinutes?: number;
}

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/**
 * Generates non-overlapping slots covering `[startHour, endHour)` in
 * `slotMinutes` increments. Slots are numbered from `0` upward with
 * `startMinutesFromMidnight` / `endMinutesFromMidnight` fields.
 *
 * Constraints:
 * - `startHour ∈ [0, 24]`, `endHour ∈ [0, 24]`, `startHour < endHour`.
 * - `slotMinutes` is a positive integer.
 * - `(endHour - startHour) * 60` must be an exact multiple of
 *   `slotMinutes`. The final slot never spills past `endHour`.
 */
export function computeSlots(options: SlotOptions = {}): readonly TimeSlot[] {
  const startHour = options.startHour ?? 0;
  const endHour = options.endHour ?? 24;
  const slotMinutes = options.slotMinutes ?? 30;

  if (!Number.isFinite(startHour) || startHour < 0 || startHour > 24) {
    throw new RangeError(
      `Scheduler: startHour must be a number in [0, 24], received ${String(startHour)}`,
    );
  }
  if (!Number.isFinite(endHour) || endHour < 0 || endHour > 24) {
    throw new RangeError(
      `Scheduler: endHour must be a number in [0, 24], received ${String(endHour)}`,
    );
  }
  if (startHour >= endHour) {
    throw new RangeError(
      `Scheduler: startHour (${String(startHour)}) must be strictly less than endHour (${String(endHour)})`,
    );
  }
  if (!Number.isInteger(slotMinutes) || slotMinutes < 1) {
    throw new RangeError(
      `Scheduler: slotMinutes must be a positive integer, received ${String(slotMinutes)}`,
    );
  }

  const startMinutes = startHour * MINUTES_PER_HOUR;
  const endMinutes = endHour * MINUTES_PER_HOUR;
  const span = endMinutes - startMinutes;
  if (span % slotMinutes !== 0) {
    throw new RangeError(
      `Scheduler: (endHour - startHour) * 60 (${String(span)}) must be a multiple of slotMinutes (${String(slotMinutes)})`,
    );
  }

  const slots: TimeSlot[] = [];
  let index = 0;
  for (let m = startMinutes; m < endMinutes; m += slotMinutes) {
    slots.push({
      index,
      startMinutesFromMidnight: m,
      endMinutesFromMidnight: m + slotMinutes,
    });
    index += 1;
  }
  return slots;
}

/** Full 24-hour minute count. Exported for renderers that need it. */
export const MINUTES_IN_DAY: number = MINUTES_PER_DAY;
