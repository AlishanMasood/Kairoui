import { describe, it, expect } from "vitest";
import {
  clampDateOnly,
  compareDateOnly,
  compareTimeOfDay,
  dateFromDateOnly,
  dateFromDateTimeLocal,
  dateOnlyFromDate,
  dateTimeLocalFromDate,
  daysInMonth,
  formatDateOnlyISO,
  formatDateOnlyLocalized,
  formatDateTimeLocalISO,
  formatTimeOfDayISO,
  formatTimeOfDayLocalized,
  getLocaleDatePartsOrder,
  getLocaleDateSeparator,
  isDateOnlyEqual,
  isDateOnlyInRange,
  isLeapYear,
  isTimeOfDayEqual,
  isTimeOfDayInRange,
  isValidDate,
  isValidDateOnly,
  isValidTimeOfDay,
  localePrefers12HourTime,
  parseDateOnlyISO,
  parseDateOnlyLocalized,
  parseDateTimeLocalISO,
  parseTimeOfDayISO,
  parseTimeOfDayLocalized,
  timeOfDayFromDate,
  tryDateOnly,
  tryTimeOfDay,
} from "./date";

// ─── Leap year & days in month ──────────────────────────────────────

describe("isLeapYear", () => {
  it("classifies common leap years", () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2004)).toBe(true);
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2400)).toBe(true);
  });

  it("classifies non-leap century years", () => {
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2200)).toBe(false);
    expect(isLeapYear(2300)).toBe(false);
  });

  it("classifies non-leap normal years", () => {
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2026)).toBe(false);
  });
});

describe("daysInMonth", () => {
  it("returns 29 for February in leap years", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it("returns 28 for February in non-leap years", () => {
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(1900, 2)).toBe(28);
  });

  it("returns 30 for April, June, September, November", () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 6)).toBe(30);
    expect(daysInMonth(2026, 9)).toBe(30);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  it("returns 31 for January, March, May, July, August, October, December", () => {
    for (const m of [1, 3, 5, 7, 8, 10, 12]) {
      expect(daysInMonth(2026, m)).toBe(31);
    }
  });
});

// ─── Guards ─────────────────────────────────────────────────────────

describe("isValidDate", () => {
  it("accepts a valid Date", () => {
    expect(isValidDate(new Date(2026, 0, 15))).toBe(true);
  });

  it("rejects Invalid Date", () => {
    expect(isValidDate(new Date("not-a-date"))).toBe(false);
  });

  it("rejects non-Date values", () => {
    expect(isValidDate("2026-01-15")).toBe(false);
    expect(isValidDate(1234)).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
    expect(isValidDate({})).toBe(false);
  });
});

describe("isValidDateOnly", () => {
  it("accepts well-formed DateOnly", () => {
    expect(isValidDateOnly({ year: 2026, month: 1, day: 15 })).toBe(true);
  });

  it("accepts leap-year Feb 29", () => {
    expect(isValidDateOnly({ year: 2024, month: 2, day: 29 })).toBe(true);
  });

  it("rejects Feb 29 in a non-leap year", () => {
    expect(isValidDateOnly({ year: 2023, month: 2, day: 29 })).toBe(false);
  });

  it("rejects month out of range", () => {
    expect(isValidDateOnly({ year: 2026, month: 0, day: 1 })).toBe(false);
    expect(isValidDateOnly({ year: 2026, month: 13, day: 1 })).toBe(false);
  });

  it("rejects day out of range", () => {
    expect(isValidDateOnly({ year: 2026, month: 4, day: 31 })).toBe(false);
    expect(isValidDateOnly({ year: 2026, month: 1, day: 0 })).toBe(false);
  });

  it("rejects non-integer components", () => {
    expect(isValidDateOnly({ year: 2026, month: 1.5, day: 1 })).toBe(false);
    expect(isValidDateOnly({ year: 2026, month: 1, day: "1" })).toBe(false);
  });

  it("rejects null and non-objects", () => {
    expect(isValidDateOnly(null)).toBe(false);
    expect(isValidDateOnly("2026-01-15")).toBe(false);
  });
});

describe("isValidTimeOfDay", () => {
  it("accepts 00:00:00.000", () => {
    expect(isValidTimeOfDay({ hour: 0, minute: 0, second: 0, millisecond: 0 })).toBe(true);
  });

  it("accepts 23:59:59.999 (upper boundary)", () => {
    expect(isValidTimeOfDay({ hour: 23, minute: 59, second: 59, millisecond: 999 })).toBe(true);
  });

  it("rejects hour 24", () => {
    expect(isValidTimeOfDay({ hour: 24, minute: 0, second: 0, millisecond: 0 })).toBe(false);
  });

  it("rejects negative components", () => {
    expect(isValidTimeOfDay({ hour: -1, minute: 0, second: 0, millisecond: 0 })).toBe(false);
    expect(isValidTimeOfDay({ hour: 0, minute: -1, second: 0, millisecond: 0 })).toBe(false);
  });

  it("rejects minute/second overflow", () => {
    expect(isValidTimeOfDay({ hour: 0, minute: 60, second: 0, millisecond: 0 })).toBe(false);
    expect(isValidTimeOfDay({ hour: 0, minute: 0, second: 60, millisecond: 0 })).toBe(false);
    expect(isValidTimeOfDay({ hour: 0, minute: 0, second: 0, millisecond: 1000 })).toBe(false);
  });
});

// ─── Constructors ───────────────────────────────────────────────────

describe("tryDateOnly", () => {
  it("returns ok for a valid date", () => {
    const r = tryDateOnly(2026, 3, 5);
    expect(r).toEqual({ ok: true, value: { year: 2026, month: 3, day: 5 } });
  });

  it("returns fail with actionable message for invalid month", () => {
    const r = tryDateOnly(2026, 13, 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/month/i);
  });

  it("returns fail for Feb 30 with day-max messaging", () => {
    const r = tryDateOnly(2024, 2, 30);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/day.*29/);
  });

  it("returns fail for non-integer year", () => {
    const r = tryDateOnly(2026.5, 1, 1);
    expect(r.ok).toBe(false);
  });
});

describe("tryTimeOfDay", () => {
  it("returns ok with defaults for seconds and ms", () => {
    const r = tryTimeOfDay(13, 30);
    expect(r).toEqual({
      ok: true,
      value: { hour: 13, minute: 30, second: 0, millisecond: 0 },
    });
  });

  it("returns fail for hour 24", () => {
    const r = tryTimeOfDay(24, 0);
    expect(r.ok).toBe(false);
  });
});

// ─── Conversions ────────────────────────────────────────────────────

describe("dateFromDateOnly / dateOnlyFromDate", () => {
  it("round-trips a calendar date", () => {
    const d: import("./date").DateOnly = { year: 2026, month: 3, day: 5 };
    const asDate = dateFromDateOnly(d);
    expect(asDate.getFullYear()).toBe(2026);
    expect(asDate.getMonth()).toBe(2);
    expect(asDate.getDate()).toBe(5);
    expect(asDate.getHours()).toBe(0);
    expect(dateOnlyFromDate(asDate)).toEqual(d);
  });

  it("does NOT UTC-shift a DateOnly", () => {
    const d = dateFromDateOnly({ year: 2026, month: 1, day: 15 });
    // getDate() returns the LOCAL day; if UTC-shifted, some timezones would flip it.
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(0);
    expect(d.getFullYear()).toBe(2026);
  });
});

describe("timeOfDayFromDate", () => {
  it("extracts local time components", () => {
    const d = new Date(2026, 0, 15, 13, 30, 45, 500);
    expect(timeOfDayFromDate(d)).toEqual({
      hour: 13,
      minute: 30,
      second: 45,
      millisecond: 500,
    });
  });
});

describe("dateFromDateTimeLocal / dateTimeLocalFromDate", () => {
  it("round-trips", () => {
    const dt: import("./date").DateTimeLocal = {
      date: { year: 2026, month: 6, day: 15 },
      time: { hour: 9, minute: 30, second: 0, millisecond: 0 },
    };
    const asDate = dateFromDateTimeLocal(dt);
    expect(asDate.getFullYear()).toBe(2026);
    expect(asDate.getMonth()).toBe(5);
    expect(asDate.getDate()).toBe(15);
    expect(asDate.getHours()).toBe(9);
    expect(dateTimeLocalFromDate(asDate)).toEqual(dt);
  });
});

// ─── Comparisons ────────────────────────────────────────────────────

describe("compareDateOnly", () => {
  const a = { year: 2026, month: 3, day: 5 };
  const b = { year: 2026, month: 3, day: 5 };
  const later = { year: 2026, month: 3, day: 6 };
  const earlier = { year: 2025, month: 12, day: 31 };

  it("returns 0 when equal", () => {
    expect(compareDateOnly(a, b)).toBe(0);
    expect(isDateOnlyEqual(a, b)).toBe(true);
  });

  it("returns -1 when a < b", () => {
    expect(compareDateOnly(earlier, a)).toBe(-1);
  });

  it("returns 1 when a > b", () => {
    expect(compareDateOnly(later, a)).toBe(1);
  });

  it("orders by year, then month, then day", () => {
    expect(
      compareDateOnly({ year: 2025, month: 12, day: 31 }, { year: 2026, month: 1, day: 1 }),
    ).toBe(-1);
    expect(
      compareDateOnly({ year: 2026, month: 1, day: 31 }, { year: 2026, month: 2, day: 1 }),
    ).toBe(-1);
  });
});

describe("compareTimeOfDay", () => {
  it("orders by hour, minute, second, ms", () => {
    const a = { hour: 9, minute: 30, second: 0, millisecond: 0 };
    const later = { hour: 9, minute: 30, second: 0, millisecond: 1 };
    expect(compareTimeOfDay(a, later)).toBe(-1);
    expect(isTimeOfDayEqual(a, a)).toBe(true);
  });
});

// ─── Ranges ─────────────────────────────────────────────────────────

describe("isDateOnlyInRange", () => {
  const d = { year: 2026, month: 6, day: 15 };
  const min = { year: 2026, month: 1, day: 1 };
  const max = { year: 2026, month: 12, day: 31 };

  it("accepts values inside inclusive bounds", () => {
    expect(isDateOnlyInRange(d, min, max)).toBe(true);
  });

  it("accepts boundary values", () => {
    expect(isDateOnlyInRange(min, min, max)).toBe(true);
    expect(isDateOnlyInRange(max, min, max)).toBe(true);
  });

  it("rejects values outside bounds", () => {
    expect(isDateOnlyInRange({ year: 2025, month: 12, day: 31 }, min, max)).toBe(false);
    expect(isDateOnlyInRange({ year: 2027, month: 1, day: 1 }, min, max)).toBe(false);
  });

  it("treats undefined bounds as open", () => {
    expect(isDateOnlyInRange(d, undefined, max)).toBe(true);
    expect(isDateOnlyInRange(d, min, undefined)).toBe(true);
    expect(isDateOnlyInRange(d)).toBe(true);
  });
});

describe("isTimeOfDayInRange", () => {
  const t = { hour: 12, minute: 0, second: 0, millisecond: 0 };
  const min = { hour: 9, minute: 0, second: 0, millisecond: 0 };
  const max = { hour: 17, minute: 0, second: 0, millisecond: 0 };
  it("accepts values inside bounds", () => {
    expect(isTimeOfDayInRange(t, min, max)).toBe(true);
  });
  it("rejects values outside bounds", () => {
    expect(isTimeOfDayInRange({ hour: 8, minute: 59, second: 0, millisecond: 0 }, min, max)).toBe(
      false,
    );
  });
});

describe("clampDateOnly", () => {
  const min = { year: 2026, month: 1, day: 1 };
  const max = { year: 2026, month: 12, day: 31 };
  it("returns min when below range", () => {
    expect(clampDateOnly({ year: 2025, month: 6, day: 1 }, min, max)).toEqual(min);
  });
  it("returns max when above range", () => {
    expect(clampDateOnly({ year: 2027, month: 6, day: 1 }, min, max)).toEqual(max);
  });
  it("returns input when in range", () => {
    const inside = { year: 2026, month: 6, day: 15 };
    expect(clampDateOnly(inside, min, max)).toEqual(inside);
  });
});

// ─── ISO parsing ────────────────────────────────────────────────────

describe("parseDateOnlyISO", () => {
  it("parses a valid ISO date", () => {
    expect(parseDateOnlyISO("2026-03-05")).toEqual({
      ok: true,
      value: { year: 2026, month: 3, day: 5 },
    });
  });

  it("parses Feb 29 in a leap year", () => {
    expect(parseDateOnlyISO("2024-02-29").ok).toBe(true);
  });

  it("rejects Feb 29 in a non-leap year", () => {
    const r = parseDateOnlyISO("2023-02-29");
    expect(r.ok).toBe(false);
  });

  it("rejects wrong format", () => {
    expect(parseDateOnlyISO("2026/03/05").ok).toBe(false);
    expect(parseDateOnlyISO("03-05-2026").ok).toBe(false);
    expect(parseDateOnlyISO("").ok).toBe(false);
    expect(parseDateOnlyISO("2026-3-5").ok).toBe(false);
  });

  it("does NOT UTC-shift the value (regression: string 'YYYY-MM-DD' is UTC in new Date())", () => {
    const r = parseDateOnlyISO("2026-01-01");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ year: 2026, month: 1, day: 1 });
  });
});

describe("parseTimeOfDayISO", () => {
  it("parses HH:MM", () => {
    expect(parseTimeOfDayISO("09:30")).toEqual({
      ok: true,
      value: { hour: 9, minute: 30, second: 0, millisecond: 0 },
    });
  });

  it("parses HH:MM:SS", () => {
    expect(parseTimeOfDayISO("09:30:45")).toEqual({
      ok: true,
      value: { hour: 9, minute: 30, second: 45, millisecond: 0 },
    });
  });

  it("parses HH:MM:SS.SSS", () => {
    expect(parseTimeOfDayISO("09:30:45.123")).toEqual({
      ok: true,
      value: { hour: 9, minute: 30, second: 45, millisecond: 123 },
    });
  });

  it("pads shorter millisecond fractions", () => {
    expect(parseTimeOfDayISO("09:30:45.5")).toEqual({
      ok: true,
      value: { hour: 9, minute: 30, second: 45, millisecond: 500 },
    });
    expect(parseTimeOfDayISO("09:30:45.05")).toEqual({
      ok: true,
      value: { hour: 9, minute: 30, second: 45, millisecond: 50 },
    });
  });

  it("accepts 00:00 (lower boundary)", () => {
    expect(parseTimeOfDayISO("00:00").ok).toBe(true);
  });

  it("accepts 23:59:59.999 (upper boundary)", () => {
    expect(parseTimeOfDayISO("23:59:59.999").ok).toBe(true);
  });

  it("rejects 24:00 (24-hour clock has no 24)", () => {
    expect(parseTimeOfDayISO("24:00").ok).toBe(false);
  });

  it("rejects wrong format", () => {
    expect(parseTimeOfDayISO("9:30").ok).toBe(false);
    expect(parseTimeOfDayISO("09:30 AM").ok).toBe(false);
    expect(parseTimeOfDayISO("").ok).toBe(false);
  });
});

describe("parseDateTimeLocalISO", () => {
  it("parses YYYY-MM-DDTHH:MM", () => {
    expect(parseDateTimeLocalISO("2026-03-05T09:30").ok).toBe(true);
  });

  it("accepts space separator", () => {
    expect(parseDateTimeLocalISO("2026-03-05 09:30").ok).toBe(true);
  });

  it("parses seconds and ms", () => {
    const r = parseDateTimeLocalISO("2026-03-05T09:30:45.500");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.time.millisecond).toBe(500);
    }
  });

  it("fails clearly for invalid date component", () => {
    const r = parseDateTimeLocalISO("2023-02-29T09:30");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/date/);
  });
});

// ─── ISO formatting ─────────────────────────────────────────────────

describe("formatDateOnlyISO", () => {
  it("emits YYYY-MM-DD with zero padding", () => {
    expect(formatDateOnlyISO({ year: 2026, month: 3, day: 5 })).toBe("2026-03-05");
    expect(formatDateOnlyISO({ year: 2026, month: 12, day: 31 })).toBe("2026-12-31");
  });

  it("pads years under 1000", () => {
    expect(formatDateOnlyISO({ year: 999, month: 1, day: 1 })).toBe("0999-01-01");
  });
});

describe("formatTimeOfDayISO", () => {
  it("emits HH:MM when seconds and ms are zero", () => {
    expect(formatTimeOfDayISO({ hour: 9, minute: 5, second: 0, millisecond: 0 })).toBe("09:05");
  });

  it("emits HH:MM:SS when seconds are non-zero", () => {
    expect(formatTimeOfDayISO({ hour: 9, minute: 5, second: 30, millisecond: 0 })).toBe("09:05:30");
  });

  it("emits HH:MM:SS.sss when milliseconds are non-zero", () => {
    expect(formatTimeOfDayISO({ hour: 9, minute: 5, second: 30, millisecond: 500 })).toBe(
      "09:05:30.500",
    );
  });

  it("honors includeSeconds override", () => {
    expect(
      formatTimeOfDayISO(
        { hour: 9, minute: 5, second: 0, millisecond: 0 },
        { includeSeconds: true },
      ),
    ).toBe("09:05:00");
  });
});

describe("formatDateTimeLocalISO", () => {
  it("joins date + time with T", () => {
    const dt = {
      date: { year: 2026, month: 3, day: 5 },
      time: { hour: 9, minute: 30, second: 0, millisecond: 0 },
    };
    expect(formatDateTimeLocalISO(dt)).toBe("2026-03-05T09:30");
  });
});

// ─── Locale detection ──────────────────────────────────────────────

describe("getLocaleDatePartsOrder", () => {
  it("returns MDY for en-US", () => {
    expect(getLocaleDatePartsOrder("en-US")).toBe("MDY");
  });

  it("returns DMY for en-GB", () => {
    expect(getLocaleDatePartsOrder("en-GB")).toBe("DMY");
  });

  it("returns YMD for ja-JP", () => {
    expect(getLocaleDatePartsOrder("ja-JP")).toBe("YMD");
  });

  it("defaults to en-US when locale is undefined", () => {
    expect(getLocaleDatePartsOrder()).toBe("MDY");
  });
});

describe("getLocaleDateSeparator", () => {
  it("returns a single character", () => {
    const sep = getLocaleDateSeparator("en-US");
    expect(sep.length).toBe(1);
  });
});

describe("localePrefers12HourTime", () => {
  it("returns true for en-US", () => {
    expect(localePrefers12HourTime("en-US")).toBe(true);
  });

  it("returns false for en-GB (24-hour convention)", () => {
    // en-GB uses 24h by default in Intl
    expect(localePrefers12HourTime("en-GB")).toBe(false);
  });
});

// ─── Localized parsing ─────────────────────────────────────────────

describe("parseDateOnlyLocalized", () => {
  it("parses MDY input for en-US", () => {
    expect(parseDateOnlyLocalized("03/05/2026", "en-US")).toEqual({
      ok: true,
      value: { year: 2026, month: 3, day: 5 },
    });
  });

  it("parses DMY input for en-GB", () => {
    expect(parseDateOnlyLocalized("05/03/2026", "en-GB")).toEqual({
      ok: true,
      value: { year: 2026, month: 3, day: 5 },
    });
  });

  it("parses YMD input for ja-JP", () => {
    expect(parseDateOnlyLocalized("2026/03/05", "ja-JP")).toEqual({
      ok: true,
      value: { year: 2026, month: 3, day: 5 },
    });
  });

  it("distinguishes ambiguous dates between MDY and DMY correctly", () => {
    // 04/05 = Apr 5 in MDY, May 4 in DMY
    const us = parseDateOnlyLocalized("04/05/2026", "en-US");
    const gb = parseDateOnlyLocalized("04/05/2026", "en-GB");
    expect(us.ok && us.value).toEqual({ year: 2026, month: 4, day: 5 });
    expect(gb.ok && gb.value).toEqual({ year: 2026, month: 5, day: 4 });
  });

  it("accepts hyphen and dot separators", () => {
    expect(parseDateOnlyLocalized("03-05-2026", "en-US").ok).toBe(true);
    expect(parseDateOnlyLocalized("03.05.2026", "en-US").ok).toBe(true);
  });

  it("expands two-digit years into 2000-2099", () => {
    const r = parseDateOnlyLocalized("03/05/26", "en-US");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.year).toBe(2026);
  });

  it("rejects natural language", () => {
    expect(parseDateOnlyLocalized("March 5, 2026", "en-US").ok).toBe(false);
    expect(parseDateOnlyLocalized("today", "en-US").ok).toBe(false);
  });

  it("rejects wrong segment count", () => {
    expect(parseDateOnlyLocalized("03/05", "en-US").ok).toBe(false);
    expect(parseDateOnlyLocalized("2026", "en-US").ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(parseDateOnlyLocalized("", "en-US").ok).toBe(false);
    expect(parseDateOnlyLocalized("   ", "en-US").ok).toBe(false);
  });
});

describe("parseTimeOfDayLocalized", () => {
  it("parses 24-hour form", () => {
    expect(parseTimeOfDayLocalized("13:30")).toEqual({
      ok: true,
      value: { hour: 13, minute: 30, second: 0, millisecond: 0 },
    });
  });

  it("parses 24-hour form with seconds", () => {
    expect(parseTimeOfDayLocalized("13:30:45").ok).toBe(true);
  });

  it("parses 12-hour PM", () => {
    const r = parseTimeOfDayLocalized("1:30 PM");
    expect(r.ok && r.value.hour).toBe(13);
  });

  it("parses 12-hour AM", () => {
    const r = parseTimeOfDayLocalized("1:30 AM");
    expect(r.ok && r.value.hour).toBe(1);
  });

  it("converts 12 AM to 00:xx", () => {
    const r = parseTimeOfDayLocalized("12:00 AM");
    expect(r.ok && r.value.hour).toBe(0);
  });

  it("keeps 12 PM as 12:xx", () => {
    const r = parseTimeOfDayLocalized("12:00 PM");
    expect(r.ok && r.value.hour).toBe(12);
  });

  it("is case-insensitive on AM/PM", () => {
    expect(parseTimeOfDayLocalized("1:30 pm").ok).toBe(true);
    expect(parseTimeOfDayLocalized("1:30 Pm").ok).toBe(true);
    expect(parseTimeOfDayLocalized("1:30 a.m.").ok).toBe(true);
  });

  it("rejects 13:00 PM (invalid 12-hour hour)", () => {
    expect(parseTimeOfDayLocalized("13:00 PM").ok).toBe(false);
  });

  it("enforces hour12=true", () => {
    expect(parseTimeOfDayLocalized("13:30", { hour12: true }).ok).toBe(false);
    expect(parseTimeOfDayLocalized("1:30 PM", { hour12: true }).ok).toBe(true);
  });

  it("enforces hour12=false", () => {
    expect(parseTimeOfDayLocalized("1:30 PM", { hour12: false }).ok).toBe(false);
    expect(parseTimeOfDayLocalized("13:30", { hour12: false }).ok).toBe(true);
  });

  it("rejects natural language", () => {
    expect(parseTimeOfDayLocalized("noon").ok).toBe(false);
    expect(parseTimeOfDayLocalized("half past one").ok).toBe(false);
  });

  it("rejects out-of-range 24-hour values", () => {
    expect(parseTimeOfDayLocalized("24:00").ok).toBe(false);
    expect(parseTimeOfDayLocalized("12:60").ok).toBe(false);
  });
});

// ─── Localized formatting ──────────────────────────────────────────

describe("formatDateOnlyLocalized", () => {
  it("formats via Intl.DateTimeFormat with default locale", () => {
    const out = formatDateOnlyLocalized({ year: 2026, month: 3, day: 5 }, "en-US");
    expect(out).toContain("3");
    expect(out).toContain("5");
    expect(out).toContain("2026");
  });

  it("respects explicit format options", () => {
    const out = formatDateOnlyLocalized({ year: 2026, month: 3, day: 5 }, "en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    expect(out).toContain("March");
    expect(out).toContain("2026");
  });
});

describe("formatTimeOfDayLocalized", () => {
  it("formats a time with default options (hour + minute)", () => {
    const out = formatTimeOfDayLocalized(
      { hour: 13, minute: 30, second: 0, millisecond: 0 },
      "en-US",
    );
    expect(out.length).toBeGreaterThan(0);
  });

  it("respects hour12 override in options", () => {
    const out = formatTimeOfDayLocalized(
      { hour: 13, minute: 30, second: 0, millisecond: 0 },
      "en-US",
      { hour: "numeric", minute: "2-digit", hour12: false },
    );
    expect(out).toMatch(/^13[:. ]30$/);
  });
});
