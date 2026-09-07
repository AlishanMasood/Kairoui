/**
 * Date/time value contracts, parsing, and formatting.
 *
 * ## Timezone Policy
 *
 * - `DateOnly` and `TimeOfDay` are **timezone-free**. They describe wall-clock
 *   calendar and time-of-day components with no anchoring instant.
 * - `DateTimeLocal` is a **local wall-clock** instant — a calendar date plus a
 *   time of day interpreted in the browser's local timezone. Reading the same
 *   DateTimeLocal in a different timezone produces a different instant.
 * - Conversions between these types and the native `Date` object use the
 *   browser's local timezone. No UTC shifting occurs at the API boundary.
 * - Explicitly zoned or UTC values are out of scope for this module.
 *
 * ## Framework independence
 *
 * All functions here are pure and depend only on the platform `Date` and
 * `Intl.DateTimeFormat`. No React, no DOM.
 */

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Timezone-free calendar date. Component values match the local calendar
 * as read by a human — never UTC-shifted.
 *
 * `month` is 1-indexed (matches ISO-8601), unlike the platform `Date` API
 * which uses 0-11 internally.
 */
export interface DateOnly {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** Timezone-free time of day using 24-hour clock. */
export interface TimeOfDay {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
}

/**
 * Local wall-clock date-time. Not zoned — different browsers in different
 * timezones will produce different `Date` instants from the same value.
 */
export interface DateTimeLocal {
  readonly date: DateOnly;
  readonly time: TimeOfDay;
}

/**
 * Two-endpoint range. Either endpoint can be `null` to represent an
 * incomplete selection (e.g., mid-drag in a range picker).
 */
export interface DateRange<T = Date> {
  readonly start: T | null;
  readonly end: T | null;
}

/**
 * Discriminated result of a parsing attempt. Success carries the parsed
 * value; failure carries an actionable, human-readable reason.
 */
export type ParseResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string };

/** Segment ordering used by a locale's numeric date format. */
export type DatePartsOrder = "YMD" | "DMY" | "MDY";

// ─── Result helpers ─────────────────────────────────────────────────

function ok<T>(value: T): ParseResult<T> {
  return { ok: true, value };
}

function fail<T>(reason: string): ParseResult<T> {
  return { ok: false, reason };
}

// ─── Basic predicates ───────────────────────────────────────────────

/** True when `year` is a Gregorian leap year. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in `month` (1-12) for the given year. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

function isInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n);
}

/** True when `d` is a `Date` and not `Invalid Date`. */
export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/** True when `x` conforms to `DateOnly` with a valid Gregorian date. */
export function isValidDateOnly(x: unknown): x is DateOnly {
  if (typeof x !== "object" || x === null) return false;
  const d = x as Partial<DateOnly>;
  if (!isInt(d.year) || !isInt(d.month) || !isInt(d.day)) return false;
  if (d.month < 1 || d.month > 12) return false;
  if (d.day < 1 || d.day > daysInMonth(d.year, d.month)) return false;
  return true;
}

/** True when `x` conforms to `TimeOfDay` with valid 24-hour components. */
export function isValidTimeOfDay(x: unknown): x is TimeOfDay {
  if (typeof x !== "object" || x === null) return false;
  const t = x as Partial<TimeOfDay>;
  if (!isInt(t.hour) || !isInt(t.minute) || !isInt(t.second) || !isInt(t.millisecond)) {
    return false;
  }
  return (
    t.hour >= 0 &&
    t.hour <= 23 &&
    t.minute >= 0 &&
    t.minute <= 59 &&
    t.second >= 0 &&
    t.second <= 59 &&
    t.millisecond >= 0 &&
    t.millisecond <= 999
  );
}

// ─── Constructors returning ParseResult ─────────────────────────────

/** Constructs a `DateOnly`, validating each component. */
export function tryDateOnly(year: number, month: number, day: number): ParseResult<DateOnly> {
  if (!isInt(year)) return fail("year must be an integer");
  if (!isInt(month) || month < 1 || month > 12) {
    return fail("month must be an integer between 1 and 12");
  }
  const maxDay = daysInMonth(year, month);
  if (!isInt(day) || day < 1 || day > maxDay) {
    return fail(`day must be an integer between 1 and ${String(maxDay)}`);
  }
  return ok({ year, month, day });
}

/** Constructs a `TimeOfDay`, validating each component. Missing seconds/ms default to 0. */
export function tryTimeOfDay(
  hour: number,
  minute: number,
  second = 0,
  millisecond = 0,
): ParseResult<TimeOfDay> {
  if (!isInt(hour) || hour < 0 || hour > 23) {
    return fail("hour must be an integer between 0 and 23");
  }
  if (!isInt(minute) || minute < 0 || minute > 59) {
    return fail("minute must be an integer between 0 and 59");
  }
  if (!isInt(second) || second < 0 || second > 59) {
    return fail("second must be an integer between 0 and 59");
  }
  if (!isInt(millisecond) || millisecond < 0 || millisecond > 999) {
    return fail("millisecond must be an integer between 0 and 999");
  }
  return ok({ hour, minute, second, millisecond });
}

// ─── Conversion: DateOnly ⇄ Date ────────────────────────────────────

/** Returns a browser-local Date at 00:00:00.000 for the given calendar date. */
export function dateFromDateOnly(d: DateOnly): Date {
  return new Date(d.year, d.month - 1, d.day, 0, 0, 0, 0);
}

/** Extracts the local calendar date from a Date, ignoring its time. */
export function dateOnlyFromDate(d: Date): DateOnly {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

// ─── Conversion: TimeOfDay ⇄ Date ───────────────────────────────────

/** Extracts the local time of day from a Date. */
export function timeOfDayFromDate(d: Date): TimeOfDay {
  return {
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
    millisecond: d.getMilliseconds(),
  };
}

// ─── Conversion: DateTimeLocal ⇄ Date ───────────────────────────────

/** Returns a browser-local Date for the given wall-clock date/time. */
export function dateFromDateTimeLocal(dt: DateTimeLocal): Date {
  return new Date(
    dt.date.year,
    dt.date.month - 1,
    dt.date.day,
    dt.time.hour,
    dt.time.minute,
    dt.time.second,
    dt.time.millisecond,
  );
}

/** Extracts a local wall-clock date/time from a Date. */
export function dateTimeLocalFromDate(d: Date): DateTimeLocal {
  return { date: dateOnlyFromDate(d), time: timeOfDayFromDate(d) };
}

// ─── Comparison ─────────────────────────────────────────────────────

/** Three-way comparison of two `DateOnly` values. */
export function compareDateOnly(a: DateOnly, b: DateOnly): -1 | 0 | 1 {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  return 0;
}

/** Three-way comparison of two `TimeOfDay` values. */
export function compareTimeOfDay(a: TimeOfDay, b: TimeOfDay): -1 | 0 | 1 {
  if (a.hour !== b.hour) return a.hour < b.hour ? -1 : 1;
  if (a.minute !== b.minute) return a.minute < b.minute ? -1 : 1;
  if (a.second !== b.second) return a.second < b.second ? -1 : 1;
  if (a.millisecond !== b.millisecond) return a.millisecond < b.millisecond ? -1 : 1;
  return 0;
}

export function isDateOnlyEqual(a: DateOnly, b: DateOnly): boolean {
  return compareDateOnly(a, b) === 0;
}

export function isTimeOfDayEqual(a: TimeOfDay, b: TimeOfDay): boolean {
  return compareTimeOfDay(a, b) === 0;
}

// ─── Range checks ───────────────────────────────────────────────────

/** True when `d ∈ [min, max]` inclusive. `undefined` bounds are open. */
export function isDateOnlyInRange(d: DateOnly, min?: DateOnly, max?: DateOnly): boolean {
  if (min && compareDateOnly(d, min) < 0) return false;
  if (max && compareDateOnly(d, max) > 0) return false;
  return true;
}

/** True when `t ∈ [min, max]` inclusive. `undefined` bounds are open. */
export function isTimeOfDayInRange(t: TimeOfDay, min?: TimeOfDay, max?: TimeOfDay): boolean {
  if (min && compareTimeOfDay(t, min) < 0) return false;
  if (max && compareTimeOfDay(t, max) > 0) return false;
  return true;
}

/** Clamps a `DateOnly` to `[min, max]` (inclusive). */
export function clampDateOnly(d: DateOnly, min?: DateOnly, max?: DateOnly): DateOnly {
  if (min && compareDateOnly(d, min) < 0) return min;
  if (max && compareDateOnly(d, max) > 0) return max;
  return d;
}

// ─── ISO parsing ────────────────────────────────────────────────────

const DATE_ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_ISO_RE = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const DATE_TIME_ISO_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

/** Strict `YYYY-MM-DD` parser. Timezone-free — no UTC conversion. */
export function parseDateOnlyISO(input: string): ParseResult<DateOnly> {
  const m = DATE_ISO_RE.exec(input);
  if (!m) return fail("expected format YYYY-MM-DD");
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return tryDateOnly(year, month, day);
}

/** Strict 24-hour `HH:MM[:SS[.sss]]` parser. */
export function parseTimeOfDayISO(input: string): ParseResult<TimeOfDay> {
  const m = TIME_ISO_RE.exec(input);
  if (!m) return fail("expected format HH:MM[:SS[.sss]]");
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = m[3] !== undefined ? Number(m[3]) : 0;
  const millisecond = m[4] !== undefined ? Number(m[4].padEnd(3, "0")) : 0;
  return tryTimeOfDay(hour, minute, second, millisecond);
}

/** Strict `YYYY-MM-DDTHH:MM[:SS[.sss]]` parser (T or space separator). */
export function parseDateTimeLocalISO(input: string): ParseResult<DateTimeLocal> {
  const m = DATE_TIME_ISO_RE.exec(input);
  if (!m) return fail("expected format YYYY-MM-DDTHH:MM[:SS[.sss]]");
  const dateResult = tryDateOnly(Number(m[1]), Number(m[2]), Number(m[3]));
  if (!dateResult.ok) return fail(`date: ${dateResult.reason}`);
  const second = m[6] !== undefined ? Number(m[6]) : 0;
  const millisecond = m[7] !== undefined ? Number(m[7].padEnd(3, "0")) : 0;
  const timeResult = tryTimeOfDay(Number(m[4]), Number(m[5]), second, millisecond);
  if (!timeResult.ok) return fail(`time: ${timeResult.reason}`);
  return ok({ date: dateResult.value, time: timeResult.value });
}

// ─── ISO formatting ─────────────────────────────────────────────────

function pad2(n: number): string {
  return n < 10 ? `0${String(n)}` : String(n);
}

function pad3(n: number): string {
  if (n < 10) return `00${String(n)}`;
  if (n < 100) return `0${String(n)}`;
  return String(n);
}

function pad4(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs < 10) return `${sign}000${String(abs)}`;
  if (abs < 100) return `${sign}00${String(abs)}`;
  if (abs < 1000) return `${sign}0${String(abs)}`;
  return `${sign}${String(abs)}`;
}

export interface TimeFormatISOOptions {
  /** Emit `:SS` even when seconds are zero. Defaults to `true` when seconds != 0. */
  readonly includeSeconds?: boolean;
  /** Emit `.SSS` even when milliseconds are zero. Defaults to `true` when ms != 0. */
  readonly includeMilliseconds?: boolean;
}

/** Emits `YYYY-MM-DD`. */
export function formatDateOnlyISO(d: DateOnly): string {
  return `${pad4(d.year)}-${pad2(d.month)}-${pad2(d.day)}`;
}

/** Emits `HH:MM[:SS[.sss]]`. */
export function formatTimeOfDayISO(t: TimeOfDay, options: TimeFormatISOOptions = {}): string {
  const includeSeconds = options.includeSeconds ?? (t.second !== 0 || t.millisecond !== 0);
  const includeMilliseconds = options.includeMilliseconds ?? t.millisecond !== 0;
  let out = `${pad2(t.hour)}:${pad2(t.minute)}`;
  if (includeSeconds || includeMilliseconds) out += `:${pad2(t.second)}`;
  if (includeMilliseconds) out += `.${pad3(t.millisecond)}`;
  return out;
}

/** Emits `YYYY-MM-DDTHH:MM[:SS[.sss]]`. */
export function formatDateTimeLocalISO(dt: DateTimeLocal, options?: TimeFormatISOOptions): string {
  return `${formatDateOnlyISO(dt.date)}T${formatTimeOfDayISO(dt.time, options)}`;
}

// ─── Localized parsing & formatting ─────────────────────────────────

const LOCALE_ORDER_CACHE = new Map<string, DatePartsOrder>();
const LOCALE_SEP_CACHE = new Map<string, string>();
const LOCALE_HOUR12_CACHE = new Map<string, boolean>();

function normalizeLocale(locale?: string): string {
  return locale ?? "en-US";
}

/**
 * Returns the segment ordering `Intl.DateTimeFormat` uses for a locale's
 * short numeric date. Falls back to `MDY` if detection fails.
 */
export function getLocaleDatePartsOrder(locale?: string): DatePartsOrder {
  const key = normalizeLocale(locale);
  const cached = LOCALE_ORDER_CACHE.get(key);
  if (cached) return cached;

  const order = detectDatePartsOrder(key);
  LOCALE_ORDER_CACHE.set(key, order);
  return order;
}

function detectDatePartsOrder(locale: string): DatePartsOrder {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(2000, 0, 2));
    const seq: string[] = [];
    for (const p of parts) {
      if (p.type === "year") seq.push("Y");
      else if (p.type === "month") seq.push("M");
      else if (p.type === "day") seq.push("D");
    }
    const joined = seq.join("");
    if (joined === "YMD" || joined === "DMY" || joined === "MDY") return joined;
  } catch {
    // fall through
  }
  return "MDY";
}

/** Returns the primary separator character a locale uses between date segments. */
export function getLocaleDateSeparator(locale?: string): string {
  const key = normalizeLocale(locale);
  const cached = LOCALE_SEP_CACHE.get(key);
  if (cached !== undefined) return cached;

  let sep = "/";
  try {
    const parts = new Intl.DateTimeFormat(key, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(2000, 0, 2));
    const literal = parts.find((p) => p.type === "literal");
    if (literal && literal.value.length > 0) {
      // First non-space character wins.
      const trimmed = literal.value.trim();
      if (trimmed.length > 0) sep = trimmed.charAt(0);
    }
  } catch {
    // keep default
  }
  LOCALE_SEP_CACHE.set(key, sep);
  return sep;
}

/** True if the locale defaults to a 12-hour clock (AM/PM). */
export function localePrefers12HourTime(locale?: string): boolean {
  const key = normalizeLocale(locale);
  const cached = LOCALE_HOUR12_CACHE.get(key);
  if (cached !== undefined) return cached;

  let result = false;
  try {
    const parts = new Intl.DateTimeFormat(key, {
      hour: "numeric",
      minute: "numeric",
    }).formatToParts(new Date(2000, 0, 1, 13, 30));
    result = parts.some((p) => p.type === "dayPeriod");
  } catch {
    // keep default
  }
  LOCALE_HOUR12_CACHE.set(key, result);
  return result;
}

const NUMERIC_SEG_RE = /^\d{1,4}$/;

/**
 * Parses a numeric date string in the locale's expected order. Accepts
 * `/`, `-`, and `.` as separators regardless of the locale's canonical
 * separator. Rejects natural language.
 */
export function parseDateOnlyLocalized(input: string, locale?: string): ParseResult<DateOnly> {
  const trimmed = input.trim();
  if (trimmed.length === 0) return fail("input is empty");

  const segments = trimmed.split(/[/\-.]/);
  if (segments.length !== 3) return fail("expected 3 numeric segments separated by / - or .");
  for (const s of segments) {
    if (!NUMERIC_SEG_RE.test(s)) return fail("segments must be digits only");
  }

  const order = getLocaleDatePartsOrder(locale);
  let year: number;
  let month: number;
  let day: number;
  switch (order) {
    case "YMD":
      year = Number(segments[0]);
      month = Number(segments[1]);
      day = Number(segments[2]);
      break;
    case "DMY":
      day = Number(segments[0]);
      month = Number(segments[1]);
      year = Number(segments[2]);
      break;
    case "MDY":
      month = Number(segments[0]);
      day = Number(segments[1]);
      year = Number(segments[2]);
      break;
  }

  if (year < 100) year += 2000; // Two-digit years land in 2000-2099.
  return tryDateOnly(year, month, day);
}

const TIME_12H_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?$/i;
const TIME_24H_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

export interface LocalizedTimeParseOptions {
  /** `true` requires AM/PM; `false` requires 24-hour; `undefined` accepts either. */
  readonly hour12?: boolean;
}

/** Parses `HH:MM[:SS]` in 12- or 24-hour form. Case-insensitive AM/PM. */
export function parseTimeOfDayLocalized(
  input: string,
  options: LocalizedTimeParseOptions = {},
): ParseResult<TimeOfDay> {
  const trimmed = input.trim();
  if (trimmed.length === 0) return fail("input is empty");

  const twelve = TIME_12H_RE.exec(trimmed);
  if (twelve) {
    if (options.hour12 === false) return fail("expected 24-hour format");
    let hour = Number(twelve[1]);
    const minute = Number(twelve[2]);
    const second = twelve[3] !== undefined ? Number(twelve[3]) : 0;
    const period = twelve[4]?.toLowerCase();
    if (hour < 1 || hour > 12) return fail("12-hour hour must be between 1 and 12");
    if (period === "a") {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }
    return tryTimeOfDay(hour, minute, second, 0);
  }

  if (options.hour12 === true) return fail("expected 12-hour format with AM/PM");

  const twentyFour = TIME_24H_RE.exec(trimmed);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    const minute = Number(twentyFour[2]);
    const second = twentyFour[3] !== undefined ? Number(twentyFour[3]) : 0;
    return tryTimeOfDay(hour, minute, second, 0);
  }

  return fail("expected HH:MM[:SS] optionally followed by AM/PM");
}

/** Formats a `DateOnly` via `Intl.DateTimeFormat`. */
export function formatDateOnlyLocalized(
  d: DateOnly,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(normalizeLocale(locale), options).format(dateFromDateOnly(d));
}

/** Formats a `TimeOfDay` via `Intl.DateTimeFormat`, using an anchor date. */
export function formatTimeOfDayLocalized(
  t: TimeOfDay,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const anchor = new Date(2000, 0, 1, t.hour, t.minute, t.second, t.millisecond);
  const opts: Intl.DateTimeFormatOptions = options ?? { hour: "numeric", minute: "2-digit" };
  return new Intl.DateTimeFormat(normalizeLocale(locale), opts).format(anchor);
}
