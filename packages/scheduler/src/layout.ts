// Pure, framework-independent layout algorithms for the Scheduler.
//
// - `assertValidSchedulerEvent` boundary-checks a `SchedulerEvent`.
// - `filterVisibleEvents` splits a stream into visible timed / all-day
//   buckets against a `VisibleRange`.
// - `computeEventLayout` performs greedy column packing for
//   overlapping timed events per the KUI-ENT-009 ADR.
// - `computeAllDayLayout` assigns lanes for multi-day all-day events
//   in the all-day strip.
// - `bucketEventsByDay`, `groupEventsByResource`, and
//   `computeMaxConcurrency` support the three views.

import type {
  AllDayLaneEntry,
  EventLayoutOptions,
  EventLayoutResult,
  LaidOutEvent,
  Resource,
  ResourceBucket,
  SchedulerEvent,
  VisibleEventBucket,
} from "./scheduler-types";
import {
  addDays,
  assertValidSchedulerDate,
  compareDate,
  differenceInCalendarDays,
  startOfDay,
} from "./time-utils";

// ─── Constants ────────────────────────────────────────────────────

export const DEFAULT_MAX_EVENTS_PER_SLOT = 6;
export const DEFAULT_MIN_RENDERED_MINUTES = 10;

// ─── Validation ───────────────────────────────────────────────────

/**
 * Throws when `event` violates the Scheduler data-model contract:
 * both `start` and `end` must be valid `Date`s and `start` must be
 * less than or equal to `end`. Consumers who need "inverted range"
 * behavior get it during interactive drag — the reducer normalizes
 * there. Static input is rejected.
 */
export function assertValidSchedulerEvent(event: SchedulerEvent): void {
  assertValidSchedulerDate(event.start, `event "${event.id}".start`);
  assertValidSchedulerDate(event.end, `event "${event.id}".end`);
  if (event.start.getTime() > event.end.getTime()) {
    throw new RangeError(
      `Scheduler: event "${event.id}" has start (${event.start.toISOString()}) after end (${event.end.toISOString()})`,
    );
  }
}

// ─── Range intersection ──────────────────────────────────────────

/**
 * True when `event` intersects `[rangeStart, rangeEnd)`. An event that
 * ends exactly at `rangeStart` does not intersect. An event that
 * starts exactly at `rangeEnd` does not intersect. Zero-duration
 * events at `rangeStart` are treated as intersecting.
 */
export function eventIntersectsRange(
  event: SchedulerEvent,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const start = event.start.getTime();
  const end = event.end.getTime();
  const rs = rangeStart.getTime();
  const re = rangeEnd.getTime();
  if (start >= re) return false;
  if (end < rs) return false;
  if (end === rs && start !== end) return false;
  return true;
}

/**
 * Partitions `events` into visible timed + all-day buckets. Every
 * event is validated first; invalid events throw.
 */
export function filterVisibleEvents<TEvent extends SchedulerEvent>(
  events: readonly TEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): VisibleEventBucket<TEvent> {
  assertValidSchedulerDate(rangeStart, "rangeStart");
  assertValidSchedulerDate(rangeEnd, "rangeEnd");
  if (rangeStart.getTime() > rangeEnd.getTime()) {
    throw new RangeError(
      `Scheduler: rangeStart (${rangeStart.toISOString()}) must be at or before rangeEnd (${rangeEnd.toISOString()})`,
    );
  }

  const timed: TEvent[] = [];
  const allDay: TEvent[] = [];
  for (const event of events) {
    assertValidSchedulerEvent(event);
    if (!eventIntersectsRange(event, rangeStart, rangeEnd)) continue;
    if (event.allDay) {
      allDay.push(event);
    } else {
      timed.push(event);
    }
  }
  return { timed, allDay };
}

// ─── Day bucketing ────────────────────────────────────────────────

/**
 * For each `day` in `days`, returns the subset of `events` that
 * intersects that calendar day. Bucketing is by wall-clock day, so an
 * event 23:00 → 01:00 next day appears in two buckets.
 *
 * `days` is expected to be a chronological list of `startOfDay`
 * anchors (as produced by `computeVisibleRange`).
 */
export function bucketEventsByDay<TEvent extends SchedulerEvent>(
  events: readonly TEvent[],
  days: readonly Date[],
): readonly (readonly TEvent[])[] {
  if (days.length === 0) return [];
  const buckets: TEvent[][] = days.map(() => []);
  for (const event of events) {
    for (let i = 0; i < days.length; i++) {
      const dayStart = days[i];
      if (dayStart === undefined) continue;
      const nextDayStart = addDays(dayStart, 1);
      if (eventIntersectsRange(event, dayStart, nextDayStart)) {
        const bucket = buckets[i];
        if (bucket !== undefined) bucket.push(event);
      }
    }
  }
  return buckets;
}

// ─── Resource grouping ───────────────────────────────────────────

/**
 * Groups events by `resourceId`, preserving the order of `resources`.
 * Events without a `resourceId` land in a trailing bucket with
 * `resourceId: null` and `resource: null`. Empty buckets are
 * preserved so consumers can render empty lanes.
 */
export function groupEventsByResource<TEvent extends SchedulerEvent>(
  events: readonly TEvent[],
  resources: readonly Resource[],
): readonly ResourceBucket<TEvent>[] {
  const byId = new Map<string, TEvent[]>();
  const unassigned: TEvent[] = [];
  for (const resource of resources) {
    byId.set(resource.id, []);
  }
  for (const event of events) {
    const key = event.resourceId;
    if (key === undefined) {
      unassigned.push(event);
      continue;
    }
    const bucket = byId.get(key);
    if (bucket !== undefined) {
      bucket.push(event);
    } else {
      // Unknown resourceId → treated as unassigned so nothing is
      // silently dropped. Consumers can validate ids upstream.
      unassigned.push(event);
    }
  }
  const result: ResourceBucket<TEvent>[] = [];
  for (const resource of resources) {
    const events = byId.get(resource.id) ?? [];
    result.push({ resourceId: resource.id, resource, events });
  }
  if (unassigned.length > 0) {
    result.push({ resourceId: null, resource: null, events: unassigned });
  }
  return result;
}

// ─── Concurrency / column packing ────────────────────────────────

/**
 * Maximum number of pairwise-overlapping timed events in `events`.
 * Used by consumers who need to size gutters or overflow indicators.
 * All-day events are excluded — they occupy the horizontal strip and
 * do not stack against timed events.
 */
export function computeMaxConcurrency(events: readonly SchedulerEvent[]): number {
  const timed = events.filter((e) => !e.allDay);
  if (timed.length === 0) return 0;
  interface Endpoint {
    readonly t: number;
    readonly kind: "end" | "start";
  }
  const endpoints: Endpoint[] = [];
  for (const e of timed) {
    endpoints.push({ t: e.start.getTime(), kind: "start" });
    endpoints.push({ t: e.end.getTime(), kind: "end" });
  }
  // Ends resolve before starts at the same instant so `[09:00, 10:00)`
  // and `[10:00, 11:00)` count as one concurrent, not two.
  endpoints.sort((a, b) => {
    if (a.t !== b.t) return a.t - b.t;
    if (a.kind === b.kind) return 0;
    return a.kind === "end" ? -1 : 1;
  });

  let active = 0;
  let max = 0;
  for (const ep of endpoints) {
    if (ep.kind === "start") {
      active += 1;
      if (active > max) max = active;
    } else {
      active -= 1;
    }
  }
  return max;
}

/**
 * Greedy column packing for overlapping timed events.
 *
 * Algorithm (per KUI-ENT-009 ADR):
 * 1. Sort by `start` ascending, ties broken by `end` descending.
 * 2. Walk. For each event, place in the leftmost column whose last
 *    placed event ended at or before this event's `start`.
 * 3. Group events into clusters — maximal chains of transitively-
 *    overlapping events. Every event in a cluster gets the same
 *    `clusterColumns` count.
 * 4. If a cluster's column count exceeds `maxEventsPerSlot`, the
 *    excess events are removed from the layout and returned as
 *    `overflow`; the cluster's `clusterColumns` clamps to
 *    `maxEventsPerSlot`.
 *
 * The returned `laidOut` list is stable — its order matches the sort
 * order — so consumers can iterate deterministically.
 */
export function computeEventLayout<TEvent extends SchedulerEvent>(input: {
  readonly events: readonly TEvent[];
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
  readonly options?: EventLayoutOptions;
}): EventLayoutResult<TEvent> {
  const { events, rangeStart, rangeEnd, options } = input;
  const maxEventsPerSlot = options?.maxEventsPerSlot ?? DEFAULT_MAX_EVENTS_PER_SLOT;
  if (!Number.isInteger(maxEventsPerSlot) || maxEventsPerSlot < 1) {
    throw new RangeError(
      `Scheduler: maxEventsPerSlot must be a positive integer, received ${String(maxEventsPerSlot)}`,
    );
  }
  assertValidSchedulerDate(rangeStart, "rangeStart");
  assertValidSchedulerDate(rangeEnd, "rangeEnd");

  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = rangeEnd.getTime();

  interface Placement {
    readonly event: TEvent;
    readonly startMs: number;
    readonly endMs: number;
    readonly rawStartMs: number;
    readonly rawEndMs: number;
    column: number;
    clusterId: number;
    dropped: boolean;
  }

  const placements: Placement[] = [];
  for (const event of events) {
    assertValidSchedulerEvent(event);
    if (event.allDay) continue;
    if (!eventIntersectsRange(event, rangeStart, rangeEnd)) continue;
    const rawStartMs = event.start.getTime();
    const rawEndMs = event.end.getTime();
    const clippedStart = Math.max(rawStartMs, rangeStartMs);
    const clippedEnd = Math.min(rawEndMs, rangeEndMs);
    placements.push({
      event,
      startMs: clippedStart - rangeStartMs,
      endMs: clippedEnd - rangeStartMs,
      rawStartMs,
      rawEndMs,
      column: -1,
      clusterId: -1,
      dropped: false,
    });
  }

  placements.sort((a, b) => {
    if (a.rawStartMs !== b.rawStartMs) return a.rawStartMs - b.rawStartMs;
    if (a.rawEndMs !== b.rawEndMs) return b.rawEndMs - a.rawEndMs;
    // Deterministic tiebreaker by id — keeps output stable.
    if (a.event.id < b.event.id) return -1;
    if (a.event.id > b.event.id) return 1;
    return 0;
  });

  // ── Column assignment ───────────────────────────────────────────
  // `columnLastEnd[c]` is the raw end ms of the last event placed in
  // column `c`. A new event fits in column `c` when its raw start is
  // >= columnLastEnd[c].
  const columnLastEnd: number[] = [];
  for (const p of placements) {
    let placed = false;
    for (let c = 0; c < columnLastEnd.length; c++) {
      const last = columnLastEnd[c];
      if (last !== undefined && last <= p.rawStartMs) {
        p.column = c;
        columnLastEnd[c] = p.rawEndMs;
        placed = true;
        break;
      }
    }
    if (!placed) {
      p.column = columnLastEnd.length;
      columnLastEnd.push(p.rawEndMs);
    }
  }

  // ── Cluster grouping ────────────────────────────────────────────
  // Walk in sort order. Extend the current cluster while any prior
  // event's end reaches into the next event's start.
  let clusterId = -1;
  let clusterMaxEnd = -Infinity;
  const clusterWidths = new Map<number, number>();
  for (const p of placements) {
    if (p.rawStartMs >= clusterMaxEnd) {
      clusterId += 1;
      clusterMaxEnd = p.rawEndMs;
    } else if (p.rawEndMs > clusterMaxEnd) {
      clusterMaxEnd = p.rawEndMs;
    }
    p.clusterId = clusterId;
    const width = Math.max(clusterWidths.get(clusterId) ?? 0, p.column + 1);
    clusterWidths.set(clusterId, width);
  }

  // ── Overflow handling ───────────────────────────────────────────
  // Events with `column >= maxEventsPerSlot` are dropped from
  // `laidOut` and returned via `overflow` in sort order.
  const overflow: TEvent[] = [];
  for (const p of placements) {
    if (p.column >= maxEventsPerSlot) {
      p.dropped = true;
      overflow.push(p.event);
    }
  }

  const laidOut: LaidOutEvent<TEvent>[] = [];
  for (const p of placements) {
    if (p.dropped) continue;
    const rawWidth = clusterWidths.get(p.clusterId) ?? 1;
    const clusterColumns = Math.min(rawWidth, maxEventsPerSlot);
    laidOut.push({
      event: p.event,
      column: p.column,
      clusterColumns,
      startMs: p.startMs,
      endMs: p.endMs,
    });
  }

  return { laidOut, overflow };
}

// ─── All-day lane assignment ─────────────────────────────────────

/**
 * Assigns each visible all-day event to a horizontal lane in the
 * all-day strip.
 *
 * - Events are clipped to `[rangeStart, rangeStart + days)` — an
 *   all-day event that begins before `rangeStart` still shows the
 *   portion within the view.
 * - Lane assignment is greedy: an event takes the lowest-indexed lane
 *   whose last-placed event ended (calendar-day-wise) before this
 *   event's start day.
 * - Sort order: earlier start first; ties broken by longer span
 *   first so long bars stack low. Ties on span broken by event id.
 * - Events that fall entirely outside the range are skipped.
 * - Events with `allDay: false` are ignored — this function only
 *   accepts pre-filtered all-day inputs.
 */
export function computeAllDayLayout<TEvent extends SchedulerEvent>(input: {
  readonly events: readonly TEvent[];
  readonly rangeStart: Date;
  readonly days: number;
}): readonly AllDayLaneEntry<TEvent>[] {
  const { events, rangeStart, days } = input;
  assertValidSchedulerDate(rangeStart, "rangeStart");
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError(`Scheduler: days must be a positive integer, received ${String(days)}`);
  }

  const rangeStartDay = startOfDay(rangeStart);
  const rangeEndDay = addDays(rangeStartDay, days);

  interface Slot {
    readonly event: TEvent;
    readonly startDayIndex: number;
    readonly spanDays: number;
  }

  const slots: Slot[] = [];
  for (const event of events) {
    if (!event.allDay) continue;
    assertValidSchedulerEvent(event);
    if (compareDate(event.start, rangeEndDay) >= 0) continue;

    // Exclusive-end semantics for all-day events: an event whose
    // `end` is exactly at midnight does not cover the day of its
    // `end`. So `end = Tue 00:00` means "covers Monday only".
    const rawStartDayIndex = differenceInCalendarDays(rangeStartDay, event.start);
    let rawEndDayIndex = differenceInCalendarDays(rangeStartDay, event.end);
    if (event.end.getTime() === startOfDay(event.end).getTime()) {
      rawEndDayIndex -= 1;
    }
    const startDayIndex = Math.max(0, rawStartDayIndex);
    const endDayIndex = Math.min(days - 1, rawEndDayIndex);
    if (endDayIndex < startDayIndex) continue;
    const spanDays = endDayIndex - startDayIndex + 1;
    slots.push({ event, startDayIndex, spanDays });
  }

  slots.sort((a, b) => {
    if (a.startDayIndex !== b.startDayIndex) return a.startDayIndex - b.startDayIndex;
    if (a.spanDays !== b.spanDays) return b.spanDays - a.spanDays;
    if (a.event.id < b.event.id) return -1;
    if (a.event.id > b.event.id) return 1;
    return 0;
  });

  // `laneNextFreeDay[lane]` = next day index that lane can accept.
  const laneNextFreeDay: number[] = [];
  const entries: AllDayLaneEntry<TEvent>[] = [];
  for (const slot of slots) {
    let assigned = -1;
    for (let lane = 0; lane < laneNextFreeDay.length; lane++) {
      const nextFree = laneNextFreeDay[lane];
      if (nextFree !== undefined && nextFree <= slot.startDayIndex) {
        assigned = lane;
        laneNextFreeDay[lane] = slot.startDayIndex + slot.spanDays;
        break;
      }
    }
    if (assigned === -1) {
      assigned = laneNextFreeDay.length;
      laneNextFreeDay.push(slot.startDayIndex + slot.spanDays);
    }
    entries.push({
      event: slot.event,
      lane: assigned,
      startDayIndex: slot.startDayIndex,
      spanDays: slot.spanDays,
    });
  }
  return entries;
}
