import { describe, expect, it } from "vitest";
import type { LaidOutEvent, Resource, SchedulerEvent } from "./scheduler-types";
import {
  DEFAULT_MAX_EVENTS_PER_SLOT,
  DEFAULT_MIN_RENDERED_MINUTES,
  assertValidSchedulerEvent,
  bucketEventsByDay,
  computeAllDayLayout,
  computeEventLayout,
  computeMaxConcurrency,
  eventIntersectsRange,
  filterVisibleEvents,
  groupEventsByResource,
} from "./layout";

// ─── Helpers ─────────────────────────────────────────────────────

function at(y: number, mo: number, d: number, h: number, m: number = 0): Date {
  return new Date(y, mo, d, h, m, 0, 0);
}

function makeEvent(overrides: Partial<SchedulerEvent> & { id: string }): SchedulerEvent {
  return {
    id: overrides.id,
    title: overrides.title ?? overrides.id,
    start: overrides.start ?? at(2026, 5, 15, 9, 0),
    end: overrides.end ?? at(2026, 5, 15, 10, 0),
    allDay: overrides.allDay ?? false,
    ...(overrides.resourceId !== undefined ? { resourceId: overrides.resourceId } : {}),
    ...(overrides.description !== undefined ? { description: overrides.description } : {}),
    ...(overrides.meta !== undefined ? { meta: overrides.meta } : {}),
  };
}

function laidOutByEventId(laidOut: readonly LaidOutEvent[]): ReadonlyMap<string, LaidOutEvent> {
  const out = new Map<string, LaidOutEvent>();
  for (const e of laidOut) out.set(e.event.id, e);
  return out;
}

// ─── Constants ───────────────────────────────────────────────────

describe("layout constants", () => {
  it("defaults maxEventsPerSlot to 6", () => {
    expect(DEFAULT_MAX_EVENTS_PER_SLOT).toBe(6);
  });

  it("defaults minRenderedMinutes to 10", () => {
    expect(DEFAULT_MIN_RENDERED_MINUTES).toBe(10);
  });
});

// ─── assertValidSchedulerEvent ───────────────────────────────────

describe("assertValidSchedulerEvent", () => {
  it("accepts a well-formed event", () => {
    expect(() => {
      assertValidSchedulerEvent(makeEvent({ id: "e1" }));
    }).not.toThrow();
  });

  it("throws when start is Invalid Date", () => {
    expect(() => {
      assertValidSchedulerEvent(makeEvent({ id: "e1", start: new Date("bogus") }));
    }).toThrow(TypeError);
  });

  it("throws when end is Invalid Date", () => {
    expect(() => {
      assertValidSchedulerEvent(makeEvent({ id: "e1", end: new Date("bogus") }));
    }).toThrow(TypeError);
  });

  it("throws when start is after end", () => {
    expect(() => {
      assertValidSchedulerEvent(
        makeEvent({
          id: "e1",
          start: at(2026, 5, 15, 10, 0),
          end: at(2026, 5, 15, 9, 0),
        }),
      );
    }).toThrow(RangeError);
  });

  it("accepts start === end (zero-duration)", () => {
    expect(() => {
      assertValidSchedulerEvent(
        makeEvent({
          id: "e1",
          start: at(2026, 5, 15, 9, 0),
          end: at(2026, 5, 15, 9, 0),
        }),
      );
    }).not.toThrow();
  });
});

// ─── eventIntersectsRange ────────────────────────────────────────

describe("eventIntersectsRange", () => {
  const rs = at(2026, 5, 15, 9, 0);
  const re = at(2026, 5, 15, 17, 0);

  it("returns true for events entirely inside the range", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 10, 0), end: at(2026, 5, 15, 11, 0) });
    expect(eventIntersectsRange(e, rs, re)).toBe(true);
  });

  it("returns true for events partially overlapping the start", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 8, 0), end: at(2026, 5, 15, 10, 0) });
    expect(eventIntersectsRange(e, rs, re)).toBe(true);
  });

  it("returns true for events partially overlapping the end", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 16, 0), end: at(2026, 5, 15, 19, 0) });
    expect(eventIntersectsRange(e, rs, re)).toBe(true);
  });

  it("returns true for events that fully encompass the range", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 0, 0), end: at(2026, 5, 15, 23, 0) });
    expect(eventIntersectsRange(e, rs, re)).toBe(true);
  });

  it("returns false for events ending exactly at rangeStart (exclusive)", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 8, 0), end: at(2026, 5, 15, 9, 0) });
    expect(eventIntersectsRange(e, rs, re)).toBe(false);
  });

  it("returns false for events starting exactly at rangeEnd (exclusive)", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 17, 0), end: at(2026, 5, 15, 18, 0) });
    expect(eventIntersectsRange(e, rs, re)).toBe(false);
  });

  it("returns true for a zero-duration event exactly at rangeStart", () => {
    const e = makeEvent({ id: "e1", start: rs, end: rs });
    expect(eventIntersectsRange(e, rs, re)).toBe(true);
  });

  it("returns false for events entirely before the range", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 6, 0), end: at(2026, 5, 15, 7, 0) });
    expect(eventIntersectsRange(e, rs, re)).toBe(false);
  });

  it("returns false for events entirely after the range", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 18, 0), end: at(2026, 5, 15, 19, 0) });
    expect(eventIntersectsRange(e, rs, re)).toBe(false);
  });
});

// ─── filterVisibleEvents ─────────────────────────────────────────

describe("filterVisibleEvents", () => {
  const rs = at(2026, 5, 15, 0, 0);
  const re = at(2026, 5, 16, 0, 0);

  it("splits into timed + allDay buckets", () => {
    const events = [
      makeEvent({ id: "t1", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({
        id: "a1",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 16, 0),
        allDay: true,
      }),
    ];
    const bucket = filterVisibleEvents(events, rs, re);
    expect(bucket.timed).toHaveLength(1);
    expect(bucket.allDay).toHaveLength(1);
    expect(bucket.timed[0]?.id).toBe("t1");
    expect(bucket.allDay[0]?.id).toBe("a1");
  });

  it("drops events entirely outside the range", () => {
    const events = [
      makeEvent({ id: "before", start: at(2026, 5, 14, 8), end: at(2026, 5, 14, 9) }),
      makeEvent({ id: "after", start: at(2026, 5, 16, 8), end: at(2026, 5, 16, 9) }),
    ];
    const bucket = filterVisibleEvents(events, rs, re);
    expect(bucket.timed).toHaveLength(0);
    expect(bucket.allDay).toHaveLength(0);
  });

  it("throws on inverted range inputs", () => {
    expect(() => filterVisibleEvents([], re, rs)).toThrow(RangeError);
  });

  it("throws when any event is invalid", () => {
    expect(() =>
      filterVisibleEvents([makeEvent({ id: "bad", start: new Date("nope") })], rs, re),
    ).toThrow(TypeError);
  });
});

// ─── bucketEventsByDay ───────────────────────────────────────────

describe("bucketEventsByDay", () => {
  const day15 = at(2026, 5, 15, 0);
  const day16 = at(2026, 5, 16, 0);
  const day17 = at(2026, 5, 17, 0);
  const days = [day15, day16, day17] as const;

  it("assigns a same-day event to a single bucket", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) });
    const buckets = bucketEventsByDay([e], days);
    expect(buckets[0]).toEqual([e]);
    expect(buckets[1]).toEqual([]);
    expect(buckets[2]).toEqual([]);
  });

  it("assigns a cross-midnight event to both days", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 23), end: at(2026, 5, 16, 1) });
    const buckets = bucketEventsByDay([e], days);
    expect(buckets[0]).toContain(e);
    expect(buckets[1]).toContain(e);
    expect(buckets[2]).toEqual([]);
  });

  it("excludes events ending exactly at midnight from the next day's bucket", () => {
    const e = makeEvent({ id: "e1", start: at(2026, 5, 15, 23), end: at(2026, 5, 16, 0) });
    const buckets = bucketEventsByDay([e], days);
    expect(buckets[0]).toEqual([e]);
    expect(buckets[1]).toEqual([]);
  });

  it("returns an empty array when no days are provided", () => {
    expect(bucketEventsByDay([makeEvent({ id: "e1" })], [])).toEqual([]);
  });
});

// ─── groupEventsByResource ───────────────────────────────────────

describe("groupEventsByResource", () => {
  const resources: Resource[] = [
    { id: "r1", label: "Room A" },
    { id: "r2", label: "Room B" },
  ];

  it("preserves resource order and keeps empty buckets", () => {
    const events = [makeEvent({ id: "e1", resourceId: "r2" })];
    const result = groupEventsByResource(events, resources);
    expect(result).toHaveLength(2);
    expect(result[0]?.resourceId).toBe("r1");
    expect(result[0]?.events).toEqual([]);
    expect(result[1]?.resourceId).toBe("r2");
    expect(result[1]?.events).toEqual([events[0]]);
  });

  it("adds a trailing unassigned bucket only when needed", () => {
    const events = [makeEvent({ id: "e1", resourceId: "r1" })];
    const result = groupEventsByResource(events, resources);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.resourceId === null)).toBeUndefined();

    const withUnassigned = groupEventsByResource([makeEvent({ id: "e1" })], resources);
    expect(withUnassigned).toHaveLength(3);
    expect(withUnassigned[2]?.resourceId).toBeNull();
    expect(withUnassigned[2]?.resource).toBeNull();
  });

  it("treats unknown resource ids as unassigned", () => {
    const events = [makeEvent({ id: "e1", resourceId: "ghost" })];
    const result = groupEventsByResource(events, resources);
    expect(result[2]?.resourceId).toBeNull();
    expect(result[2]?.events).toEqual(events);
  });

  it("returns an empty array for zero resources and zero events", () => {
    expect(groupEventsByResource([], [])).toEqual([]);
  });
});

// ─── computeMaxConcurrency ───────────────────────────────────────

describe("computeMaxConcurrency", () => {
  it("returns 0 for an empty list", () => {
    expect(computeMaxConcurrency([])).toBe(0);
  });

  it("returns 1 for non-overlapping events", () => {
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 10), end: at(2026, 5, 15, 11) }),
      makeEvent({ id: "c", start: at(2026, 5, 15, 11), end: at(2026, 5, 15, 12) }),
    ];
    expect(computeMaxConcurrency(events)).toBe(1);
  });

  it("returns 3 for a stack of 3 overlapping events", () => {
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 12) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 10), end: at(2026, 5, 15, 11) }),
      makeEvent({ id: "c", start: at(2026, 5, 15, 10, 30), end: at(2026, 5, 15, 11, 30) }),
    ];
    expect(computeMaxConcurrency(events)).toBe(3);
  });

  it("treats abutting events as non-overlapping", () => {
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 10), end: at(2026, 5, 15, 11) }),
    ];
    expect(computeMaxConcurrency(events)).toBe(1);
  });

  it("ignores all-day events", () => {
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({
        id: "b",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 16, 0),
        allDay: true,
      }),
    ];
    expect(computeMaxConcurrency(events)).toBe(1);
  });
});

// ─── computeEventLayout: single event ────────────────────────────

describe("computeEventLayout — single event", () => {
  it("places a single event in column 0, cluster width 1", () => {
    const rangeStart = at(2026, 5, 15, 9, 0);
    const rangeEnd = at(2026, 5, 15, 17, 0);
    const event = makeEvent({
      id: "e1",
      start: at(2026, 5, 15, 10, 0),
      end: at(2026, 5, 15, 11, 0),
    });
    const result = computeEventLayout({ events: [event], rangeStart, rangeEnd });
    expect(result.laidOut).toHaveLength(1);
    expect(result.overflow).toHaveLength(0);
    const laid = result.laidOut[0];
    expect(laid?.column).toBe(0);
    expect(laid?.clusterColumns).toBe(1);
    expect(laid?.startMs).toBe(60 * 60_000);
    expect(laid?.endMs).toBe(2 * 60 * 60_000);
  });

  it("skips all-day events", () => {
    const rangeStart = at(2026, 5, 15, 0, 0);
    const rangeEnd = at(2026, 5, 16, 0, 0);
    const event = makeEvent({
      id: "e1",
      start: rangeStart,
      end: rangeEnd,
      allDay: true,
    });
    const result = computeEventLayout({ events: [event], rangeStart, rangeEnd });
    expect(result.laidOut).toHaveLength(0);
  });

  it("skips events outside the range", () => {
    const rangeStart = at(2026, 5, 15, 9, 0);
    const rangeEnd = at(2026, 5, 15, 17, 0);
    const event = makeEvent({
      id: "e1",
      start: at(2026, 5, 15, 18, 0),
      end: at(2026, 5, 15, 19, 0),
    });
    const result = computeEventLayout({ events: [event], rangeStart, rangeEnd });
    expect(result.laidOut).toHaveLength(0);
  });

  it("clips startMs / endMs to the range boundary", () => {
    const rangeStart = at(2026, 5, 15, 9, 0);
    const rangeEnd = at(2026, 5, 15, 17, 0);
    const event = makeEvent({
      id: "e1",
      start: at(2026, 5, 15, 7, 0),
      end: at(2026, 5, 15, 19, 0),
    });
    const result = computeEventLayout({ events: [event], rangeStart, rangeEnd });
    expect(result.laidOut[0]?.startMs).toBe(0);
    expect(result.laidOut[0]?.endMs).toBe(8 * 60 * 60_000);
  });
});

// ─── computeEventLayout: no overlap ──────────────────────────────

describe("computeEventLayout — non-overlapping events", () => {
  const rangeStart = at(2026, 5, 15, 0, 0);
  const rangeEnd = at(2026, 5, 16, 0, 0);

  it("packs three sequential events into column 0", () => {
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 10), end: at(2026, 5, 15, 11) }),
      makeEvent({ id: "c", start: at(2026, 5, 15, 11), end: at(2026, 5, 15, 12) }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    for (const laid of result.laidOut) {
      expect(laid.column).toBe(0);
      expect(laid.clusterColumns).toBe(1);
    }
  });

  it("treats abutting events as non-overlapping", () => {
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 10), end: at(2026, 5, 15, 11) }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    expect(result.laidOut.every((l) => l.column === 0)).toBe(true);
    expect(result.laidOut.every((l) => l.clusterColumns === 1)).toBe(true);
  });
});

// ─── computeEventLayout: overlap ─────────────────────────────────

describe("computeEventLayout — overlapping events", () => {
  const rangeStart = at(2026, 5, 15, 0, 0);
  const rangeEnd = at(2026, 5, 16, 0, 0);

  it("splits two overlapping events into columns 0 and 1", () => {
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 11) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 10), end: at(2026, 5, 15, 12) }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    const byId = laidOutByEventId(result.laidOut);
    expect(byId.get("a")?.column).toBe(0);
    expect(byId.get("b")?.column).toBe(1);
    expect(byId.get("a")?.clusterColumns).toBe(2);
    expect(byId.get("b")?.clusterColumns).toBe(2);
  });

  it("packs three concurrent events into three columns", () => {
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 12) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 10), end: at(2026, 5, 15, 11) }),
      makeEvent({ id: "c", start: at(2026, 5, 15, 10, 30), end: at(2026, 5, 15, 11, 30) }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    const cols = result.laidOut.map((l) => l.column).sort((x, y) => x - y);
    expect(cols).toEqual([0, 1, 2]);
    expect(result.laidOut.every((l) => l.clusterColumns === 3)).toBe(true);
  });

  it("reuses column 0 when a gap opens between overlaps", () => {
    // a and b are concurrent. c starts after both end → back to col 0.
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 9, 30), end: at(2026, 5, 15, 10, 30) }),
      makeEvent({ id: "c", start: at(2026, 5, 15, 11), end: at(2026, 5, 15, 12) }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    const byId = laidOutByEventId(result.laidOut);
    expect(byId.get("c")?.column).toBe(0);
    // c is its own cluster — width 1.
    expect(byId.get("c")?.clusterColumns).toBe(1);
    // a and b share cluster width 2.
    expect(byId.get("a")?.clusterColumns).toBe(2);
    expect(byId.get("b")?.clusterColumns).toBe(2);
  });

  it("propagates cluster width transitively (A–B chained through B–C)", () => {
    // a: 9–11, b: 10–13, c: 12–14. a and c do not overlap directly,
    // but b bridges them → single cluster width 3? Actually cluster
    // grouping tracks pairwise overlap chained through time, so:
    //   at 10 → a,b active (2)
    //   at 12 → b,c active (2)
    //   nothing has 3 concurrent, but the "cluster" concept still
    //   groups {a,b,c}. Column assignments: a=0, b=1 (overlaps a),
    //   c=0 (a ended before c starts). Cluster columns = max col+1 = 2.
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 11) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 10), end: at(2026, 5, 15, 13) }),
      makeEvent({ id: "c", start: at(2026, 5, 15, 12), end: at(2026, 5, 15, 14) }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    const byId = laidOutByEventId(result.laidOut);
    expect(byId.get("a")?.column).toBe(0);
    expect(byId.get("b")?.column).toBe(1);
    expect(byId.get("c")?.column).toBe(0);
    // All three share the same cluster (transitively linked by b).
    expect(byId.get("a")?.clusterColumns).toBe(2);
    expect(byId.get("b")?.clusterColumns).toBe(2);
    expect(byId.get("c")?.clusterColumns).toBe(2);
  });

  it("sorts ties on start by longer end first", () => {
    // a starts at 9:00 and lasts 2h. b starts at 9:00 and lasts 1h.
    // The longer event should take column 0 (comes first in sort).
    const events = [
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({ id: "b", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 11) }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    const byId = laidOutByEventId(result.laidOut);
    expect(byId.get("b")?.column).toBe(0);
    expect(byId.get("a")?.column).toBe(1);
  });

  it("is deterministic on complete ties (start+end) by event id", () => {
    const events = [
      makeEvent({ id: "z", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
      makeEvent({ id: "a", start: at(2026, 5, 15, 9), end: at(2026, 5, 15, 10) }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    const byId = laidOutByEventId(result.laidOut);
    expect(byId.get("a")?.column).toBe(0);
    expect(byId.get("z")?.column).toBe(1);
  });
});

// ─── computeEventLayout: overflow ────────────────────────────────

describe("computeEventLayout — overflow", () => {
  const rangeStart = at(2026, 5, 15, 0, 0);
  const rangeEnd = at(2026, 5, 16, 0, 0);

  it("passes through when concurrency <= maxEventsPerSlot", () => {
    const events = Array.from({ length: 3 }, (_, i) =>
      makeEvent({
        id: `e${String(i)}`,
        start: at(2026, 5, 15, 9),
        end: at(2026, 5, 15, 10),
      }),
    );
    const result = computeEventLayout({
      events,
      rangeStart,
      rangeEnd,
      options: { maxEventsPerSlot: 3 },
    });
    expect(result.laidOut).toHaveLength(3);
    expect(result.overflow).toHaveLength(0);
  });

  it("moves events beyond maxEventsPerSlot into overflow", () => {
    const events = Array.from({ length: 8 }, (_, i) =>
      makeEvent({
        id: `e${String(i).padStart(2, "0")}`,
        start: at(2026, 5, 15, 9),
        end: at(2026, 5, 15, 10),
      }),
    );
    const result = computeEventLayout({
      events,
      rangeStart,
      rangeEnd,
      options: { maxEventsPerSlot: 3 },
    });
    expect(result.laidOut).toHaveLength(3);
    expect(result.overflow).toHaveLength(5);
    for (const l of result.laidOut) {
      expect(l.column).toBeLessThan(3);
      expect(l.clusterColumns).toBe(3);
    }
  });

  it("clamps clusterColumns to maxEventsPerSlot even when raw width exceeds it", () => {
    const events = Array.from({ length: 8 }, (_, i) =>
      makeEvent({
        id: `e${String(i).padStart(2, "0")}`,
        start: at(2026, 5, 15, 9),
        end: at(2026, 5, 15, 10),
      }),
    );
    const result = computeEventLayout({
      events,
      rangeStart,
      rangeEnd,
      options: { maxEventsPerSlot: 3 },
    });
    expect(new Set(result.laidOut.map((l) => l.clusterColumns))).toEqual(new Set([3]));
  });

  it("throws on invalid maxEventsPerSlot", () => {
    expect(() =>
      computeEventLayout({
        events: [],
        rangeStart,
        rangeEnd,
        options: { maxEventsPerSlot: 0 },
      }),
    ).toThrow(RangeError);
    expect(() =>
      computeEventLayout({
        events: [],
        rangeStart,
        rangeEnd,
        options: { maxEventsPerSlot: 1.5 },
      }),
    ).toThrow(RangeError);
  });
});

// ─── computeEventLayout: DST safety ──────────────────────────────

describe("computeEventLayout — DST safety", () => {
  it("uses raw wall-clock instants without ms coercion across spring-forward", () => {
    // Range covers the DST-affected day.
    const rangeStart = at(2026, 2, 8, 0);
    const rangeEnd = at(2026, 2, 9, 0);
    const events = [
      makeEvent({
        id: "morning",
        start: at(2026, 2, 8, 9, 0),
        end: at(2026, 2, 8, 10, 0),
      }),
    ];
    const result = computeEventLayout({ events, rangeStart, rangeEnd });
    // startMs is the raw diff from rangeStart — the exact value
    // depends on the runtime's timezone, but must remain positive
    // and monotonic.
    expect(result.laidOut[0]?.startMs).toBeGreaterThan(0);
    expect(result.laidOut[0]?.endMs).toBeGreaterThan(result.laidOut[0]?.startMs ?? -1);
  });
});

// ─── computeEventLayout: validation ──────────────────────────────

describe("computeEventLayout — validation", () => {
  it("throws on Invalid Date range boundaries", () => {
    expect(() =>
      computeEventLayout({
        events: [],
        rangeStart: new Date("bogus"),
        rangeEnd: new Date(2026, 5, 15),
      }),
    ).toThrow(TypeError);
  });

  it("throws when any event violates the value contract", () => {
    expect(() =>
      computeEventLayout({
        events: [
          makeEvent({
            id: "bad",
            start: at(2026, 5, 15, 10),
            end: at(2026, 5, 15, 9),
          }),
        ],
        rangeStart: at(2026, 5, 15, 0),
        rangeEnd: at(2026, 5, 16, 0),
      }),
    ).toThrow(RangeError);
  });

  it("returns empty results for an empty input", () => {
    const result = computeEventLayout({
      events: [],
      rangeStart: at(2026, 5, 15, 0),
      rangeEnd: at(2026, 5, 16, 0),
    });
    expect(result.laidOut).toEqual([]);
    expect(result.overflow).toEqual([]);
  });
});

// ─── computeAllDayLayout ─────────────────────────────────────────

describe("computeAllDayLayout — single-day", () => {
  it("places a single-day event on lane 0 with span 1", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 15, 23, 59),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    expect(result).toHaveLength(1);
    expect(result[0]?.lane).toBe(0);
    expect(result[0]?.startDayIndex).toBe(0);
    expect(result[0]?.spanDays).toBe(1);
  });

  it("stacks two same-day events into lanes 0 and 1", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 15, 23, 59),
        allDay: true,
      }),
      makeEvent({
        id: "b",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 15, 23, 59),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    const lanes = result.map((r) => r.lane).sort((x, y) => x - y);
    expect(lanes).toEqual([0, 1]);
  });

  it("packs into lane 0 when the previous entry ended on an earlier day", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 15, 23, 59),
        allDay: true,
      }),
      makeEvent({
        id: "b",
        start: at(2026, 5, 16, 0),
        end: at(2026, 5, 16, 23, 59),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    expect(result.every((r) => r.lane === 0)).toBe(true);
  });
});

describe("computeAllDayLayout — multi-day", () => {
  it("computes span with exclusive-end semantics (Mon 00:00 → Tue 00:00 is 1 day)", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 16, 0),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    expect(result[0]?.startDayIndex).toBe(0);
    expect(result[0]?.spanDays).toBe(1);
  });

  it("treats a non-midnight end as covering its own day", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 17, 12, 0),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    // Covers Mon (index 0), Tue (1), Wed (2) → span 3.
    expect(result[0]?.spanDays).toBe(3);
  });

  it("clips events extending before the range to startDayIndex=0", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 13, 0),
        end: at(2026, 5, 17, 0),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    // Original: Sat (13) → Wed (16 exclusive-end = covers up to 16).
    // Clipped to range start (Mon 15) → startDayIndex = 0, endDayIndex = 1.
    expect(result[0]?.startDayIndex).toBe(0);
    expect(result[0]?.spanDays).toBe(2);
  });

  it("clips events extending past the range to endDayIndex = days - 1", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 20, 0),
        end: at(2026, 6, 5, 0),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    // startDayIndex = 5, endDayIndex clamped to 6 → span 2.
    expect(result[0]?.startDayIndex).toBe(5);
    expect(result[0]?.spanDays).toBe(2);
  });

  it("skips events entirely before the range", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 10, 0),
        end: at(2026, 5, 13, 0),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    expect(result).toHaveLength(0);
  });

  it("skips events entirely after the range", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 25, 0),
        end: at(2026, 5, 30, 0),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    expect(result).toHaveLength(0);
  });

  it("skips events whose exclusive-end lands exactly at rangeStart", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 14, 0),
        end: at(2026, 5, 15, 0), // exclusive-end: covers Sun (14) only
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    expect(result).toHaveLength(0);
  });

  it("assigns overlapping multi-day events to separate lanes", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "a",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 17, 12), // Mon–Wed
        allDay: true,
      }),
      makeEvent({
        id: "b",
        start: at(2026, 5, 16, 0),
        end: at(2026, 5, 18, 12), // Tue–Thu
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    const lanes = new Set(result.map((r) => r.lane));
    expect(lanes.size).toBe(2);
  });

  it("sorts ties on startDay by longer span first, then event id", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "short",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 15, 23, 59),
        allDay: true,
      }),
      makeEvent({
        id: "long",
        start: at(2026, 5, 15, 0),
        end: at(2026, 5, 17, 12),
        allDay: true,
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    // Long first (lane 0), short after (lane 1).
    const byId = new Map(result.map((r) => [r.event.id, r] as const));
    expect(byId.get("long")?.lane).toBe(0);
    expect(byId.get("short")?.lane).toBe(1);
  });

  it("ignores non-all-day events", () => {
    const rangeStart = at(2026, 5, 15, 0);
    const events = [
      makeEvent({
        id: "timed",
        start: at(2026, 5, 15, 9),
        end: at(2026, 5, 15, 10),
      }),
    ];
    const result = computeAllDayLayout({ events, rangeStart, days: 7 });
    expect(result).toHaveLength(0);
  });

  it("throws for invalid rangeStart", () => {
    expect(() =>
      computeAllDayLayout({ events: [], rangeStart: new Date("bogus"), days: 7 }),
    ).toThrow(TypeError);
  });

  it("throws for non-positive days", () => {
    expect(() =>
      computeAllDayLayout({ events: [], rangeStart: at(2026, 5, 15, 0), days: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      computeAllDayLayout({ events: [], rangeStart: at(2026, 5, 15, 0), days: 1.5 }),
    ).toThrow(RangeError);
  });
});
