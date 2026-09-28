import { describe, expect, it } from "vitest";
import {
  MINUTES_IN_DAY,
  addDays,
  addMinutes,
  assertValidSchedulerDate,
  clampDate,
  compareDate,
  computeSlots,
  computeVisibleRange,
  differenceInCalendarDays,
  differenceInMinutes,
  endOfDay,
  isSameCalendarDay,
  isValidSchedulerDate,
  minutesSinceMidnight,
  snapDateToInterval,
  snapToInterval,
  startOfDay,
  startOfWeek,
} from "./time-utils";

// ─── Validation ───────────────────────────────────────────────────

describe("isValidSchedulerDate", () => {
  it("accepts valid Date instances", () => {
    expect(isValidSchedulerDate(new Date(2026, 5, 15, 9, 0))).toBe(true);
  });

  it("rejects Invalid Date", () => {
    expect(isValidSchedulerDate(new Date("not a date"))).toBe(false);
  });

  it("rejects non-Date values", () => {
    expect(isValidSchedulerDate(null)).toBe(false);
    expect(isValidSchedulerDate(undefined)).toBe(false);
    expect(isValidSchedulerDate("2026-06-15")).toBe(false);
    expect(isValidSchedulerDate(1_700_000_000_000)).toBe(false);
    expect(isValidSchedulerDate({})).toBe(false);
  });
});

describe("assertValidSchedulerDate", () => {
  it("passes through valid dates", () => {
    expect(() => {
      assertValidSchedulerDate(new Date(2026, 5, 15), "start");
    }).not.toThrow();
  });

  it("throws TypeError with the parameter name for Invalid Date", () => {
    expect(() => {
      assertValidSchedulerDate(new Date("bogus"), "event.start");
    }).toThrow(TypeError);
    expect(() => {
      assertValidSchedulerDate(new Date("bogus"), "event.start");
    }).toThrow(/event\.start/);
  });

  it("throws for non-Date inputs", () => {
    expect(() => {
      assertValidSchedulerDate("2026-06-15", "date");
    }).toThrow(TypeError);
  });
});

// ─── Day boundaries ───────────────────────────────────────────────

describe("startOfDay / endOfDay", () => {
  it("clamps startOfDay to 00:00:00.000", () => {
    const d = new Date(2026, 5, 15, 17, 42, 30, 500);
    const start = startOfDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
    expect(start.getDate()).toBe(15);
  });

  it("clamps endOfDay to 23:59:59.999", () => {
    const d = new Date(2026, 5, 15, 8, 0, 0);
    const end = endOfDay(d);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
    expect(end.getDate()).toBe(15);
  });

  it("returns a new Date without mutating input", () => {
    const d = new Date(2026, 5, 15, 12, 0);
    const originalMs = d.getTime();
    startOfDay(d);
    endOfDay(d);
    expect(d.getTime()).toBe(originalMs);
  });
});

// ─── addDays / addMinutes ─────────────────────────────────────────

describe("addDays", () => {
  it("adds calendar days", () => {
    const d = new Date(2026, 5, 15, 10, 0);
    const result = addDays(d, 3);
    expect(result.getDate()).toBe(18);
    expect(result.getHours()).toBe(10);
  });

  it("supports negative deltas", () => {
    const d = new Date(2026, 5, 15);
    expect(addDays(d, -1).getDate()).toBe(14);
  });

  it("rolls month boundaries correctly", () => {
    const d = new Date(2026, 0, 31);
    const result = addDays(d, 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(1);
  });

  it("rolls year boundaries correctly", () => {
    const d = new Date(2026, 11, 31);
    const result = addDays(d, 1);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it("returns identical wall-clock time across DST transitions", () => {
    // US DST spring-forward 2026: March 8. Adding a day starting at
    // 10:00 stays at 10:00 wall-clock even though the instant shifts.
    const d = new Date(2026, 2, 7, 10, 0);
    const result = addDays(d, 1);
    expect(result.getDate()).toBe(8);
    expect(result.getHours()).toBe(10);
  });
});

describe("addMinutes", () => {
  it("adds minutes precisely", () => {
    const d = new Date(2026, 5, 15, 10, 0);
    const result = addMinutes(d, 45);
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(45);
  });

  it("crosses hour and day boundaries", () => {
    const d = new Date(2026, 5, 15, 23, 30);
    const result = addMinutes(d, 60);
    expect(result.getDate()).toBe(16);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(30);
  });

  it("supports negative deltas", () => {
    const d = new Date(2026, 5, 15, 0, 30);
    const result = addMinutes(d, -60);
    expect(result.getDate()).toBe(14);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(30);
  });
});

// ─── startOfWeek ─────────────────────────────────────────────────

describe("startOfWeek", () => {
  // June 15, 2026 is a Monday.
  it("returns the same day when weekStartsOn matches getDay", () => {
    const monday = new Date(2026, 5, 15, 14, 0);
    const result = startOfWeek(monday, 1);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(0);
  });

  it("returns previous Sunday when weekStartsOn=0 and day is mid-week", () => {
    const thursday = new Date(2026, 5, 18, 14, 0);
    const result = startOfWeek(thursday, 0);
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(14);
    expect(result.getHours()).toBe(0);
  });

  it("returns the same week's Monday for a Sunday with weekStartsOn=1", () => {
    const sunday = new Date(2026, 5, 21);
    const result = startOfWeek(sunday, 1);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(15);
  });

  it("supports Saturday-start weeks", () => {
    const wednesday = new Date(2026, 5, 17);
    const result = startOfWeek(wednesday, 6);
    expect(result.getDay()).toBe(6);
    expect(result.getDate()).toBe(13);
  });
});

// ─── Predicates ──────────────────────────────────────────────────

describe("isSameCalendarDay", () => {
  it("returns true for identical calendar days across times", () => {
    const a = new Date(2026, 5, 15, 0, 0);
    const b = new Date(2026, 5, 15, 23, 59);
    expect(isSameCalendarDay(a, b)).toBe(true);
  });

  it("returns false for adjacent days", () => {
    const a = new Date(2026, 5, 15, 23, 59);
    const b = new Date(2026, 5, 16, 0, 0);
    expect(isSameCalendarDay(a, b)).toBe(false);
  });

  it("returns false across month/year boundaries", () => {
    const a = new Date(2026, 11, 31);
    const b = new Date(2027, 0, 1);
    expect(isSameCalendarDay(a, b)).toBe(false);
  });
});

describe("compareDate", () => {
  it("returns -1, 0, 1", () => {
    const a = new Date(2026, 5, 15);
    const b = new Date(2026, 5, 16);
    expect(compareDate(a, b)).toBe(-1);
    expect(compareDate(b, a)).toBe(1);
    expect(compareDate(a, new Date(a.getTime()))).toBe(0);
  });
});

// ─── Differences ─────────────────────────────────────────────────

describe("differenceInCalendarDays", () => {
  it("returns 0 for the same day at different times", () => {
    const a = new Date(2026, 5, 15, 8, 0);
    const b = new Date(2026, 5, 15, 20, 0);
    expect(differenceInCalendarDays(a, b)).toBe(0);
  });

  it("returns positive when b is after a", () => {
    const a = new Date(2026, 5, 15);
    const b = new Date(2026, 5, 18);
    expect(differenceInCalendarDays(a, b)).toBe(3);
  });

  it("returns negative when b is before a", () => {
    const a = new Date(2026, 5, 18);
    const b = new Date(2026, 5, 15);
    expect(differenceInCalendarDays(a, b)).toBe(-3);
  });

  it("survives DST spring-forward (US)", () => {
    // March 7 → March 8, 2026 in US timezones = 23-hour day.
    const a = new Date(2026, 2, 7);
    const b = new Date(2026, 2, 8);
    expect(differenceInCalendarDays(a, b)).toBe(1);
  });

  it("survives DST fall-back (US)", () => {
    // November 1, 2026 = fall-back = 25-hour day.
    const a = new Date(2026, 9, 31);
    const b = new Date(2026, 10, 1);
    expect(differenceInCalendarDays(a, b)).toBe(1);
  });

  it("spans month and year boundaries", () => {
    const a = new Date(2026, 0, 15);
    const b = new Date(2027, 0, 15);
    expect(differenceInCalendarDays(a, b)).toBe(365);
  });
});

describe("differenceInMinutes", () => {
  it("returns positive when b is after a", () => {
    const a = new Date(2026, 5, 15, 9, 0);
    const b = new Date(2026, 5, 15, 10, 30);
    expect(differenceInMinutes(a, b)).toBe(90);
  });

  it("handles fractional minutes", () => {
    const a = new Date(2026, 5, 15, 9, 0, 0);
    const b = new Date(2026, 5, 15, 9, 0, 30);
    expect(differenceInMinutes(a, b)).toBe(0.5);
  });
});

describe("minutesSinceMidnight", () => {
  it("returns 0 at midnight", () => {
    expect(minutesSinceMidnight(new Date(2026, 5, 15, 0, 0, 0))).toBe(0);
  });

  it("returns 570 at 09:30", () => {
    expect(minutesSinceMidnight(new Date(2026, 5, 15, 9, 30, 0))).toBe(570);
  });

  it("includes seconds and milliseconds", () => {
    const d = new Date(2026, 5, 15, 9, 30, 30, 500);
    expect(minutesSinceMidnight(d)).toBeCloseTo(570.5 + 500 / 60_000, 6);
  });

  it("returns close to MINUTES_IN_DAY just before midnight", () => {
    expect(minutesSinceMidnight(new Date(2026, 5, 15, 23, 59, 59, 999))).toBeLessThan(
      MINUTES_IN_DAY,
    );
  });
});

// ─── clampDate ───────────────────────────────────────────────────

describe("clampDate", () => {
  const min = new Date(2026, 5, 15, 9, 0);
  const max = new Date(2026, 5, 15, 17, 0);

  it("returns copies within the range", () => {
    const inRange = new Date(2026, 5, 15, 12, 0);
    const clamped = clampDate(inRange, min, max);
    expect(clamped.getTime()).toBe(inRange.getTime());
    expect(clamped).not.toBe(inRange);
  });

  it("clamps to min when below", () => {
    const early = new Date(2026, 5, 15, 6, 0);
    expect(clampDate(early, min, max).getTime()).toBe(min.getTime());
  });

  it("clamps to max when above", () => {
    const late = new Date(2026, 5, 15, 20, 0);
    expect(clampDate(late, min, max).getTime()).toBe(max.getTime());
  });
});

// ─── Snap helpers ────────────────────────────────────────────────

describe("snapToInterval", () => {
  it("rounds to the nearest interval", () => {
    expect(snapToInterval(0, 15)).toBe(0);
    expect(snapToInterval(7, 15)).toBe(0);
    expect(snapToInterval(8, 15)).toBe(15);
    expect(snapToInterval(22, 15)).toBe(15);
    expect(snapToInterval(23, 15)).toBe(30);
  });

  it("rounds ties away from zero", () => {
    expect(snapToInterval(7.5, 15)).toBe(15);
    expect(snapToInterval(-7.5, 15)).toBe(-15);
  });

  it("supports negative inputs", () => {
    expect(snapToInterval(-8, 15)).toBe(-15);
    expect(snapToInterval(-14, 15)).toBe(-15);
  });

  it("passes exact multiples through untouched", () => {
    expect(snapToInterval(60, 15)).toBe(60);
    expect(snapToInterval(-60, 15)).toBe(-60);
  });

  it("throws on non-positive intervals", () => {
    expect(() => snapToInterval(10, 0)).toThrow(RangeError);
    expect(() => snapToInterval(10, -5)).toThrow(RangeError);
    expect(() => snapToInterval(10, Number.NaN)).toThrow(RangeError);
  });
});

describe("snapDateToInterval", () => {
  const anchor = new Date(2026, 5, 15, 9, 0);

  it("snaps forward to the nearest boundary", () => {
    const d = new Date(2026, 5, 15, 9, 7);
    const snapped = snapDateToInterval(d, 15, anchor);
    expect(snapped.getMinutes()).toBe(0);
  });

  it("snaps backward to the nearest boundary", () => {
    const d = new Date(2026, 5, 15, 9, 23);
    const snapped = snapDateToInterval(d, 15, anchor);
    expect(snapped.getMinutes()).toBe(30);
  });

  it("snaps to anchor when the offset is zero", () => {
    const snapped = snapDateToInterval(anchor, 15, anchor);
    expect(snapped.getTime()).toBe(anchor.getTime());
  });

  it("snaps before the anchor for negative offsets", () => {
    // -10 minutes from anchor → nearest 15-minute boundary is -15 → 08:45.
    const d = new Date(2026, 5, 15, 8, 50);
    const snapped = snapDateToInterval(d, 15, anchor);
    expect(snapped.getHours()).toBe(8);
    expect(snapped.getMinutes()).toBe(45);
  });
});

// ─── Visible range ───────────────────────────────────────────────

describe("computeVisibleRange", () => {
  it("returns a single day for kind=day", () => {
    const anchor = new Date(2026, 5, 15, 14, 30);
    const range = computeVisibleRange({ kind: "day", date: anchor });
    expect(range.days).toHaveLength(1);
    expect(range.start.getDate()).toBe(15);
    expect(range.start.getHours()).toBe(0);
    expect(range.end.getDate()).toBe(16);
    expect(range.end.getHours()).toBe(0);
  });

  it("anchors kind=week on weekStartsOn=1 by default", () => {
    // June 17, 2026 is a Wednesday.
    const wed = new Date(2026, 5, 17, 12, 0);
    const range = computeVisibleRange({ kind: "week", date: wed });
    expect(range.days).toHaveLength(7);
    expect(range.start.getDay()).toBe(1);
    expect(range.start.getDate()).toBe(15);
    expect(range.end.getDate()).toBe(22);
  });

  it("honors weekStartsOn=0 (Sunday)", () => {
    const wed = new Date(2026, 5, 17);
    const range = computeVisibleRange({ kind: "week", date: wed, weekStartsOn: 0 });
    expect(range.start.getDay()).toBe(0);
    expect(range.start.getDate()).toBe(14);
  });

  it("honors daysInView override", () => {
    const anchor = new Date(2026, 5, 15);
    const range = computeVisibleRange({ kind: "week", date: anchor, daysInView: 3 });
    expect(range.days).toHaveLength(3);
    expect(range.end.getDate()).toBe(18);
  });

  it("populates days chronologically from startOfDay", () => {
    const anchor = new Date(2026, 5, 15, 12, 30);
    const range = computeVisibleRange({ kind: "week", date: anchor });
    for (let i = 0; i < range.days.length; i++) {
      const day = range.days[i];
      expect(day).toBeDefined();
      if (day === undefined) continue;
      expect(day.getHours()).toBe(0);
      expect(day.getMinutes()).toBe(0);
      if (i > 0) {
        const prev = range.days[i - 1];
        expect(prev).toBeDefined();
        if (prev === undefined) continue;
        expect(day.getTime() - prev.getTime()).toBeGreaterThan(0);
      }
    }
  });

  it("treats kind=timeline like day with daysInView=1", () => {
    const anchor = new Date(2026, 5, 15, 8, 0);
    const range = computeVisibleRange({ kind: "timeline", date: anchor });
    expect(range.days).toHaveLength(1);
    expect(range.start.getDate()).toBe(15);
    expect(range.end.getDate()).toBe(16);
  });

  it("throws for Invalid Date input", () => {
    expect(() => computeVisibleRange({ kind: "day", date: new Date("bogus") })).toThrow(TypeError);
  });

  it("throws on non-positive daysInView", () => {
    const anchor = new Date(2026, 5, 15);
    expect(() => computeVisibleRange({ kind: "day", date: anchor, daysInView: 0 })).toThrow(
      RangeError,
    );
    expect(() => computeVisibleRange({ kind: "day", date: anchor, daysInView: -1 })).toThrow(
      RangeError,
    );
    expect(() => computeVisibleRange({ kind: "day", date: anchor, daysInView: 1.5 })).toThrow(
      RangeError,
    );
  });
});

// ─── computeSlots ────────────────────────────────────────────────

describe("computeSlots", () => {
  it("returns 48 30-minute slots covering [0, 24)", () => {
    const slots = computeSlots();
    expect(slots).toHaveLength(48);
    expect(slots[0]?.startMinutesFromMidnight).toBe(0);
    expect(slots[47]?.endMinutesFromMidnight).toBe(24 * 60);
  });

  it("supports non-default hour bands", () => {
    const slots = computeSlots({ startHour: 9, endHour: 17, slotMinutes: 60 });
    expect(slots).toHaveLength(8);
    expect(slots[0]?.startMinutesFromMidnight).toBe(9 * 60);
    expect(slots[7]?.endMinutesFromMidnight).toBe(17 * 60);
  });

  it("supports 15-minute slots", () => {
    const slots = computeSlots({ slotMinutes: 15 });
    expect(slots).toHaveLength(96);
  });

  it("numbers slots from 0 upward and contiguously", () => {
    const slots = computeSlots({ startHour: 8, endHour: 10, slotMinutes: 30 });
    expect(slots.map((s) => s.index)).toEqual([0, 1, 2, 3]);
    expect(slots[0]?.endMinutesFromMidnight).toBe(slots[1]?.startMinutesFromMidnight);
  });

  it("throws when the band is not divisible by the slot size", () => {
    // 8→17 is 9h = 540min. 540/60 is exact; 540/50 is not.
    expect(() => computeSlots({ startHour: 8, endHour: 17, slotMinutes: 60 })).not.toThrow();
    expect(() => computeSlots({ startHour: 8, endHour: 17, slotMinutes: 50 })).toThrow(RangeError);
  });

  it("throws on invalid hour bounds", () => {
    expect(() => computeSlots({ startHour: -1, endHour: 24 })).toThrow(RangeError);
    expect(() => computeSlots({ startHour: 0, endHour: 25 })).toThrow(RangeError);
    expect(() => computeSlots({ startHour: 10, endHour: 10 })).toThrow(RangeError);
    expect(() => computeSlots({ startHour: 12, endHour: 8 })).toThrow(RangeError);
  });

  it("throws on non-integer slot minutes", () => {
    expect(() => computeSlots({ slotMinutes: 15.5 })).toThrow(RangeError);
    expect(() => computeSlots({ slotMinutes: 0 })).toThrow(RangeError);
  });

  it("exposes MINUTES_IN_DAY = 1440", () => {
    expect(MINUTES_IN_DAY).toBe(1440);
  });
});
