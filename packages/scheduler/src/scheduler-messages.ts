// Default localizable strings and small `Intl` formatters used by the
// Scheduler. Everything here is pure; the React tree consumes it via
// `useMemo`.

import type { SchedulerEvent, SchedulerViewKind, VisibleRange, WeekStart } from "./scheduler-types";

/** Overflow indicator label — "`+ N more`". */
export function defaultOverflowLabel(count: number): string {
  return `+${String(count)} more`;
}

/** Announce a view change over the live region. */
export function defaultViewChangeAnnouncement(view: SchedulerViewKind, rangeLabel: string): string {
  const viewLabel = view === "day" ? "Day view" : view === "week" ? "Week view" : "Timeline view";
  return `${viewLabel}, ${rangeLabel}`;
}

/** Announce a single event when focused. */
export function defaultEventAnnouncement(event: SchedulerEvent): string {
  return `${event.title}, ${event.start.toLocaleString()}`;
}

/** Formats the toolbar range label for the currently-visible range. */
export function formatRangeLabel(range: VisibleRange, locale: string): string {
  const first = range.days[0];
  const last = range.days[range.days.length - 1];
  if (!first || !last) return "";
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (first.getTime() === last.getTime()) {
    return dateFmt.format(first);
  }
  return `${dateFmt.format(first)} – ${dateFmt.format(last)}`;
}

/** Formats a single hour label. `hour12` toggles 12/24-hour rendering. */
export function formatHourLabel(hour: number, locale: string, hour12: boolean): string {
  const d = new Date(2020, 0, 1, hour, 0);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: hour === Math.floor(hour) ? undefined : "2-digit",
    hour12,
  }).format(d);
}

/** Formats a weekday header ("Mon 15"). */
export function formatDayHeader(date: Date, locale: string): string {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
  return `${weekday} ${String(date.getDate())}`;
}

/** True when the browser's `Intl.Locale` exposes `getWeekInfo` (Chrome 130+). */
function hasGetWeekInfo(): boolean {
  try {
    const l = new Intl.Locale("en-US");
    return typeof (l as unknown as { getWeekInfo?: unknown }).getWeekInfo === "function";
  } catch {
    return false;
  }
}

/**
 * Derives `weekStartsOn` from a locale. Falls back to `1` (Monday /
 * ISO 8601) when the platform exposes no week-info API.
 */
export function inferWeekStart(locale: string): WeekStart {
  if (!hasGetWeekInfo()) return 1;
  try {
    const l = new Intl.Locale(locale);
    const info = (
      l as unknown as { getWeekInfo?: () => { firstDay: number } | undefined }
    ).getWeekInfo?.();
    const firstDay = info?.firstDay;
    if (firstDay === undefined) return 1;
    // Intl reports firstDay in ISO 8601: 1=Mon..7=Sun. Convert to
    // JS getDay() indexing where 0=Sun..6=Sat.
    const converted = firstDay === 7 ? 0 : firstDay;
    if (converted >= 0 && converted <= 6) return converted as WeekStart;
    return 1;
  } catch {
    return 1;
  }
}

/**
 * Derives 12h vs 24h preference from a locale. Falls back to 12h
 * for `en-US`/`en-CA`/`en-AU`/`en-NZ`, 24h otherwise.
 */
export function inferHour12(locale: string): boolean {
  try {
    const fmt = new Intl.DateTimeFormat(locale, { hour: "numeric" });
    const resolved = fmt.resolvedOptions();
    if (typeof resolved.hour12 === "boolean") return resolved.hour12;
  } catch {
    /* fallthrough */
  }
  return /^en-(US|CA|AU|NZ)/i.test(locale);
}
