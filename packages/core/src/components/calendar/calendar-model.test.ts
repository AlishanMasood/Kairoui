import { describe, it, expect } from "vitest";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  isSameDay,
  isDateInRange,
  startOfDay,
  endOfDay,
  addMonths,
  generateMonthGrid,
  getWeekdayLabels,
  formatMonthYear,
  addDays,
  moveFocus,
  getFirstFocusableDay,
  clampDate,
} from "./calendar-model";
import type { CalendarGridOptions } from "./calendar-model";

// ─── getDaysInMonth ─────────────────────────────────────────────────

describe("getDaysInMonth", () => {
  it("January has 31 days", () => {
    expect(getDaysInMonth(2026, 0)).toBe(31);
  });

  it("February 2024 (leap year) has 29 days", () => {
    expect(getDaysInMonth(2024, 1)).toBe(29);
  });

  it("February 2026 (non-leap) has 28 days", () => {
    expect(getDaysInMonth(2026, 1)).toBe(28);
  });

  it("April has 30 days", () => {
    expect(getDaysInMonth(2026, 3)).toBe(30);
  });
});

// ─── getFirstDayOfMonth ─────────────────────────────────────────────

describe("getFirstDayOfMonth", () => {
  it("returns day of week for first of month", () => {
    // Jan 1, 2026 is Thursday (4)
    expect(getFirstDayOfMonth(2026, 0)).toBe(4);
  });

  it("returns 0 for Sunday start", () => {
    // March 1, 2026 is Sunday (0)
    expect(getFirstDayOfMonth(2026, 2)).toBe(0);
  });
});

// ─── isSameDay ──────────────────────────────────────────────────────

describe("isSameDay", () => {
  it("same date returns true", () => {
    expect(isSameDay(new Date(2026, 0, 15), new Date(2026, 0, 15))).toBe(true);
  });

  it("different time same day returns true", () => {
    expect(isSameDay(new Date(2026, 0, 15, 9, 0), new Date(2026, 0, 15, 18, 30))).toBe(true);
  });

  it("different day returns false", () => {
    expect(isSameDay(new Date(2026, 0, 15), new Date(2026, 0, 16))).toBe(false);
  });

  it("different month returns false", () => {
    expect(isSameDay(new Date(2026, 0, 15), new Date(2026, 1, 15))).toBe(false);
  });
});

// ─── isDateInRange ──────────────────────────────────────────────────

describe("isDateInRange", () => {
  it("returns true when no constraints", () => {
    expect(isDateInRange(new Date(2026, 5, 15))).toBe(true);
  });

  it("returns true when within range", () => {
    expect(isDateInRange(new Date(2026, 5, 15), new Date(2026, 5, 1), new Date(2026, 5, 30))).toBe(
      true,
    );
  });

  it("returns false when before min", () => {
    expect(isDateInRange(new Date(2026, 4, 31), new Date(2026, 5, 1))).toBe(false);
  });

  it("returns false when after max", () => {
    expect(isDateInRange(new Date(2026, 6, 1), undefined, new Date(2026, 5, 30))).toBe(false);
  });

  it("min date itself is in range", () => {
    expect(isDateInRange(new Date(2026, 5, 1), new Date(2026, 5, 1))).toBe(true);
  });

  it("max date itself is in range", () => {
    expect(isDateInRange(new Date(2026, 5, 30), undefined, new Date(2026, 5, 30))).toBe(true);
  });
});

// ─── startOfDay / endOfDay ──────────────────────────────────────────

describe("startOfDay / endOfDay", () => {
  it("startOfDay sets to 00:00:00.000", () => {
    const d = startOfDay(new Date(2026, 5, 15, 14, 30, 45, 123));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });

  it("endOfDay sets to 23:59:59.999", () => {
    const d = endOfDay(new Date(2026, 5, 15, 8, 0));
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
    expect(d.getSeconds()).toBe(59);
    expect(d.getMilliseconds()).toBe(999);
  });

  it("does not mutate original date", () => {
    const original = new Date(2026, 5, 15, 12, 0);
    startOfDay(original);
    expect(original.getHours()).toBe(12);
  });
});

// ─── addMonths ──────────────────────────────────────────────────────

describe("addMonths", () => {
  it("adds 1 month", () => {
    const result = addMonths(new Date(2026, 0, 15), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(15);
  });

  it("subtracts 1 month", () => {
    const result = addMonths(new Date(2026, 5, 15), -1);
    expect(result.getMonth()).toBe(4);
  });

  it("wraps year forward", () => {
    const result = addMonths(new Date(2026, 11, 15), 1);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(0);
  });

  it("wraps year backward", () => {
    const result = addMonths(new Date(2026, 0, 15), -1);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(11);
  });

  it("clamps day when overflowing (Jan 31 + 1 month → Feb 28)", () => {
    const result = addMonths(new Date(2026, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });

  it("clamps correctly for leap year (Jan 31 + 1 month in 2024 → Feb 29)", () => {
    const result = addMonths(new Date(2024, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
  });
});

// ─── generateMonthGrid ──────────────────────────────────────────────

describe("generateMonthGrid", () => {
  const baseOptions: CalendarGridOptions = {
    year: 2026,
    month: 0, // January 2026
    today: new Date(2026, 0, 15),
  };

  it("generates weeks array", () => {
    const grid = generateMonthGrid(baseOptions);
    expect(grid.weeks.length).toBeGreaterThanOrEqual(4);
    expect(grid.weeks.length).toBeLessThanOrEqual(6);
  });

  it("each week has exactly 7 days", () => {
    const grid = generateMonthGrid(baseOptions);
    for (const week of grid.weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("marks today correctly", () => {
    const grid = generateMonthGrid(baseOptions);
    const todayDay = grid.weeks.flat().find((d) => d.isToday);
    expect(todayDay).toBeDefined();
    expect(todayDay!.day).toBe(15);
    expect(todayDay!.month).toBe(0);
  });

  it("marks outside-month days", () => {
    const grid = generateMonthGrid(baseOptions);
    const outsideDays = grid.weeks.flat().filter((d) => d.isOutsideMonth);
    expect(outsideDays.length).toBeGreaterThan(0);
    outsideDays.forEach((d) => {
      expect(d.month).not.toBe(0);
    });
  });

  it("all current month days are present", () => {
    const grid = generateMonthGrid(baseOptions);
    const inMonth = grid.weeks.flat().filter((d) => !d.isOutsideMonth);
    expect(inMonth).toHaveLength(31); // January has 31 days
  });

  it("respects weekStartsOn=1 (Monday start)", () => {
    const grid = generateMonthGrid({ ...baseOptions, weekStartsOn: 1 });
    // First day in grid should be a Monday or earlier
    const firstDay = grid.weeks[0]![0]!;
    expect(firstDay.date.getDay()).toBe(1); // Monday
  });

  it("respects min constraint", () => {
    const grid = generateMonthGrid({
      ...baseOptions,
      min: new Date(2026, 0, 10),
    });
    const disabledBefore = grid.weeks.flat().filter((d) => d.day < 10 && !d.isOutsideMonth);
    disabledBefore.forEach((d) => {
      expect(d.isDisabled).toBe(true);
    });
  });

  it("respects max constraint", () => {
    const grid = generateMonthGrid({
      ...baseOptions,
      max: new Date(2026, 0, 20),
    });
    const disabledAfter = grid.weeks.flat().filter((d) => d.day > 20 && !d.isOutsideMonth);
    disabledAfter.forEach((d) => {
      expect(d.isDisabled).toBe(true);
    });
  });

  it("respects custom disabled function", () => {
    const grid = generateMonthGrid({
      ...baseOptions,
      disabled: (date) => date.getDay() === 0 || date.getDay() === 6, // weekends
    });
    const weekendDays = grid.weeks
      .flat()
      .filter((d) => !d.isOutsideMonth && (d.date.getDay() === 0 || d.date.getDay() === 6));
    weekendDays.forEach((d) => {
      expect(d.isDisabled).toBe(true);
    });
  });

  it("returns correct year and month", () => {
    const grid = generateMonthGrid(baseOptions);
    expect(grid.year).toBe(2026);
    expect(grid.month).toBe(0);
  });

  it("works for February leap year", () => {
    const grid = generateMonthGrid({ year: 2024, month: 1, today: new Date(2024, 1, 15) });
    const inMonth = grid.weeks.flat().filter((d) => !d.isOutsideMonth);
    expect(inMonth).toHaveLength(29);
  });

  it("works for year transitions (December)", () => {
    const grid = generateMonthGrid({ year: 2025, month: 11, today: new Date(2025, 11, 25) });
    expect(grid.year).toBe(2025);
    expect(grid.month).toBe(11);
    const inMonth = grid.weeks.flat().filter((d) => !d.isOutsideMonth);
    expect(inMonth).toHaveLength(31);
  });
});

// ─── getWeekdayLabels ───────────────────────────────────────────────

describe("getWeekdayLabels", () => {
  it("returns 7 labels", () => {
    const labels = getWeekdayLabels("en", 0);
    expect(labels).toHaveLength(7);
  });

  it("starts with Sunday when weekStartsOn=0", () => {
    const labels = getWeekdayLabels("en", 0, "short");
    expect(labels[0]).toMatch(/Sun/i);
  });

  it("starts with Monday when weekStartsOn=1", () => {
    const labels = getWeekdayLabels("en", 1, "short");
    expect(labels[0]).toMatch(/Mon/i);
  });

  it("narrow format returns single characters", () => {
    const labels = getWeekdayLabels("en", 0, "narrow");
    labels.forEach((l) => {
      expect(l.length).toBeLessThanOrEqual(2);
    });
  });
});

// ─── formatMonthYear ────────────────────────────────────────────────

describe("formatMonthYear", () => {
  it("formats January 2026 in English", () => {
    const result = formatMonthYear(2026, 0, "en");
    expect(result).toContain("January");
    expect(result).toContain("2026");
  });

  it("formats different months correctly", () => {
    expect(formatMonthYear(2026, 11, "en")).toContain("December");
  });
});

// ─── addDays ────────────────────────────────────────────────────────

describe("addDays", () => {
  it("adds 1 day", () => {
    const result = addDays(new Date(2026, 0, 15), 1);
    expect(result.getDate()).toBe(16);
  });

  it("subtracts 1 day", () => {
    const result = addDays(new Date(2026, 0, 15), -1);
    expect(result.getDate()).toBe(14);
  });

  it("crosses month boundary forward", () => {
    const result = addDays(new Date(2026, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(1);
  });

  it("crosses month boundary backward", () => {
    const result = addDays(new Date(2026, 1, 1), -1);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(31);
  });

  it("adds 7 days (one week)", () => {
    const result = addDays(new Date(2026, 0, 15), 7);
    expect(result.getDate()).toBe(22);
  });

  it("crosses year boundary", () => {
    const result = addDays(new Date(2025, 11, 31), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it("does not mutate original", () => {
    const original = new Date(2026, 0, 15);
    addDays(original, 5);
    expect(original.getDate()).toBe(15);
  });
});

// ─── moveFocus ──────────────────────────────────────────────────────

describe("moveFocus", () => {
  it("moves forward by 1 day", () => {
    const result = moveFocus(new Date(2026, 0, 15), 1);
    expect(result.getDate()).toBe(16);
  });

  it("moves backward by 1 day", () => {
    const result = moveFocus(new Date(2026, 0, 15), -1);
    expect(result.getDate()).toBe(14);
  });

  it("moves forward by 7 days (week)", () => {
    const result = moveFocus(new Date(2026, 0, 15), 7);
    expect(result.getDate()).toBe(22);
  });

  it("skips disabled dates when moving forward", () => {
    const result = moveFocus(new Date(2026, 0, 15), 1, {
      disabled: (d) => d.getDate() === 16,
    });
    expect(result.getDate()).toBe(17);
  });

  it("skips disabled dates when moving backward", () => {
    const result = moveFocus(new Date(2026, 0, 15), -1, {
      disabled: (d) => d.getDate() === 14,
    });
    expect(result.getDate()).toBe(13);
  });

  it("respects min constraint", () => {
    const result = moveFocus(new Date(2026, 0, 2), -1, {
      min: new Date(2026, 0, 2),
    });
    // Can't go before min, should stay at original
    expect(result.getDate()).toBe(2);
  });

  it("respects max constraint", () => {
    const result = moveFocus(new Date(2026, 0, 30), 1, {
      max: new Date(2026, 0, 30),
    });
    expect(result.getDate()).toBe(30);
  });

  it("skips multiple disabled dates", () => {
    const result = moveFocus(new Date(2026, 0, 15), 1, {
      disabled: (d) => d.getDate() === 16 || d.getDate() === 17,
    });
    expect(result.getDate()).toBe(18);
  });
});

// ─── getFirstFocusableDay ───────────────────────────────────────────

describe("getFirstFocusableDay", () => {
  it("returns first day when no constraints", () => {
    const result = getFirstFocusableDay(2026, 0);
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(0);
  });

  it("skips disabled first days", () => {
    const result = getFirstFocusableDay(2026, 0, {
      disabled: (d) => d.getDate() <= 3,
    });
    expect(result.getDate()).toBe(4);
  });

  it("respects min constraint", () => {
    const result = getFirstFocusableDay(2026, 0, {
      min: new Date(2026, 0, 10),
    });
    expect(result.getDate()).toBe(10);
  });

  it("returns first day if entire month is disabled", () => {
    const result = getFirstFocusableDay(2026, 0, {
      disabled: () => true,
    });
    expect(result.getDate()).toBe(1);
  });
});

// ─── clampDate ──────────────────────────────────────────────────────

describe("clampDate", () => {
  it("returns same date when within range", () => {
    const date = new Date(2026, 0, 15);
    const result = clampDate(date, new Date(2026, 0, 1), new Date(2026, 0, 31));
    expect(isSameDay(result, date)).toBe(true);
  });

  it("clamps to min when before", () => {
    const result = clampDate(new Date(2025, 11, 31), new Date(2026, 0, 1));
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it("clamps to max when after", () => {
    const result = clampDate(new Date(2026, 1, 1), undefined, new Date(2026, 0, 31));
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(31);
  });

  it("returns same date with no constraints", () => {
    const date = new Date(2026, 5, 15);
    const result = clampDate(date);
    expect(isSameDay(result, date)).toBe(true);
  });
});
