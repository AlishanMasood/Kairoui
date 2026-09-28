// Public types for the KairoUI Scheduler. See
// docs/architecture/PHASE14-SCHEDULER-ARCHITECTURE.md for the full
// contract. This module is data-only; no React, no DOM.

// ─── Value contracts ──────────────────────────────────────────────

/**
 * Runtime shape of a scheduler event as accepted by the layout
 * engine. `start` and `end` are wall-clock `Date` objects interpreted
 * in the browser's local timezone. `end` is **exclusive** — an event
 * 09:00 → 10:00 does not overlap 10:00 → 11:00.
 */
export interface SchedulerEvent {
  readonly id: string;
  readonly start: Date;
  readonly end: Date;
  readonly allDay: boolean;
  readonly resourceId?: string;
  readonly title: string;
  readonly description?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** Resource lane definition for the timeline view. */
export interface Resource {
  readonly id: string;
  readonly label: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

// ─── Enumerations ─────────────────────────────────────────────────

export type SchedulerViewKind = "day" | "week" | "timeline";

/** 0 = Sunday, 1 = Monday, …, 6 = Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DragBoundary = "view" | "day" | "resource" | "none";

// ─── View options ─────────────────────────────────────────────────

export interface SchedulerViewProps {
  readonly kind: SchedulerViewKind;
  readonly date: Date;
  readonly daysInView?: number;
  readonly slotMinutes?: number;
  readonly startHour?: number;
  readonly endHour?: number;
  readonly showAllDayStrip?: boolean;
}

// ─── Time model ───────────────────────────────────────────────────

/**
 * Visible date range for a view, computed from the view kind, anchor
 * date, `weekStartsOn`, and `daysInView`.
 *
 * `start` is inclusive and pinned to 00:00 of its calendar day.
 * `end` is **exclusive** and pinned to 00:00 of the day after the
 * last visible day. `days` is one start-of-day `Date` per visible
 * calendar day, in chronological order.
 */
export interface VisibleRange {
  readonly start: Date;
  readonly end: Date;
  readonly days: readonly Date[];
}

/** One row of the vertical time grid or one column of the timeline grid. */
export interface TimeSlot {
  readonly index: number;
  readonly startMinutesFromMidnight: number;
  readonly endMinutesFromMidnight: number;
}

// ─── Layout output ────────────────────────────────────────────────

export interface EventLayoutOptions {
  /** Max concurrent events rendered before overflow. Default 6. */
  readonly maxEventsPerSlot?: number;
  /** Minimum minutes an event occupies visually. Default 10. */
  readonly minRenderedMinutes?: number;
}

/**
 * A single event as laid out for the time grid. `startMs`/`endMs`
 * are milliseconds from the range start; the renderer converts them
 * into CSS geometry. `column`/`clusterColumns` come from the greedy
 * column-packing algorithm.
 */
export interface LaidOutEvent<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly event: TEvent;
  readonly column: number;
  readonly clusterColumns: number;
  readonly startMs: number;
  readonly endMs: number;
}

/**
 * Result of laying out timed events. `overflow` contains events that
 * fell beyond `maxEventsPerSlot` — the renderer surfaces them via a
 * `+N` indicator.
 */
export interface EventLayoutResult<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly laidOut: readonly LaidOutEvent<TEvent>[];
  readonly overflow: readonly TEvent[];
}

/** One all-day event's placement in the horizontal all-day strip. */
export interface AllDayLaneEntry<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly event: TEvent;
  readonly lane: number;
  readonly startDayIndex: number;
  readonly spanDays: number;
}

// ─── Bucketing outputs ────────────────────────────────────────────

/** Bucket of visible events partitioned by all-day flag. */
export interface VisibleEventBucket<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly timed: readonly TEvent[];
  readonly allDay: readonly TEvent[];
}

/**
 * Resource-scoped bucket. `resourceId` is `null` for events with no
 * `resourceId` set on the event itself.
 */
export interface ResourceBucket<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly resourceId: string | null;
  readonly resource: Resource | null;
  readonly events: readonly TEvent[];
}
