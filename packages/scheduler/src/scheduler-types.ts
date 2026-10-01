// Public types for the KairoUI Scheduler. See
// docs/architecture/PHASE14-SCHEDULER-ARCHITECTURE.md for the full
// contract.

import type { CSSProperties, ReactNode } from "react";

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

// ─── Selection ────────────────────────────────────────────────────

export type SchedulerSelection =
  | { readonly kind: "none" }
  | { readonly kind: "event"; readonly eventId: string }
  | {
      readonly kind: "range";
      readonly start: Date;
      readonly end: Date;
      readonly resourceId?: string;
    };

// ─── State ────────────────────────────────────────────────────────

/** Scheduler root state slice. */
export interface SchedulerState {
  readonly view: SchedulerViewKind;
  readonly date: Date;
  readonly selection: SchedulerSelection;
}

// ─── Callback payloads ───────────────────────────────────────────

export interface SchedulerEventClickPayload<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly event: TEvent;
  readonly nativeEvent: MouseEvent | KeyboardEvent;
}

export interface SchedulerRangePayload {
  readonly start: Date;
  readonly end: Date;
  readonly resourceId?: string;
  readonly allDay: boolean;
}

export interface SchedulerMovePayload<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly event: TEvent;
  readonly start: Date;
  readonly end: Date;
  readonly resourceId?: string;
}

export interface SchedulerResizePayload<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly event: TEvent;
  readonly start: Date;
  readonly end: Date;
  readonly edge: "start" | "end";
}

// ─── Localizable messages ────────────────────────────────────────

/** Announcer / label strings. Consumers override any subset. */
export interface SchedulerMessages {
  readonly toolbarLabel?: string;
  readonly previousLabel?: string;
  readonly nextLabel?: string;
  readonly todayLabel?: string;
  readonly createEventLabel?: string;
  readonly viewSwitcherLabel?: string;
  readonly dayLabel?: string;
  readonly weekLabel?: string;
  readonly timelineLabel?: string;
  readonly allDayLabel?: string;
  readonly nowIndicatorLabel?: string;
  readonly overflowLabel?: (count: number) => string;
  readonly viewChangeAnnouncement?: (view: SchedulerViewKind, rangeLabel: string) => string;
  readonly eventAnnouncement?: (event: SchedulerEvent) => string;
}

// ─── Render prop ─────────────────────────────────────────────────

/**
 * Consumer-supplied event renderer. Receives the concrete event and
 * its layout geometry. Returns the visible event content; the
 * Scheduler wraps it with `role="button"` and geometry styles.
 */
export type SchedulerEventRenderer<TEvent extends SchedulerEvent = SchedulerEvent> = (context: {
  readonly event: TEvent;
  readonly laidOut: LaidOutEvent<TEvent>;
  readonly isSelected: boolean;
  readonly isDragging: boolean;
  readonly isResizing: boolean;
}) => ReactNode;

/** Consumer-supplied all-day event renderer. */
export type SchedulerAllDayRenderer<TEvent extends SchedulerEvent = SchedulerEvent> = (context: {
  readonly event: TEvent;
  readonly entry: AllDayLaneEntry<TEvent>;
  readonly isSelected: boolean;
}) => ReactNode;

// ─── Root props ──────────────────────────────────────────────────

export interface SchedulerAccessibilityProps {
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly "aria-describedby"?: string;
}

/**
 * `<Scheduler>` root props. Owns state, receives events, wires
 * callbacks. Every interactive slice is controllable via a
 * `value` / `defaultValue` / `onXChange` triple.
 */
export interface SchedulerRootProps<
  TEvent extends SchedulerEvent = SchedulerEvent,
> extends SchedulerAccessibilityProps {
  // ── Data
  readonly events: readonly TEvent[];
  readonly resources?: readonly Resource[];

  // ── View / date (controllable)
  readonly view?: SchedulerViewKind;
  readonly defaultView?: SchedulerViewKind;
  readonly onViewChange?: (view: SchedulerViewKind) => void;

  readonly date?: Date;
  readonly defaultDate?: Date;
  readonly onDateChange?: (date: Date) => void;

  readonly selection?: SchedulerSelection;
  readonly defaultSelection?: SchedulerSelection;
  readonly onSelectionChange?: (selection: SchedulerSelection) => void;

  // ── Geometry
  readonly daysInView?: number;
  readonly slotMinutes?: number;
  readonly startHour?: number;
  readonly endHour?: number;
  readonly pxPerMinute?: number;
  readonly timelinePxPerMinute?: number;
  readonly showAllDayStrip?: boolean;
  readonly maxEventsPerSlot?: number;
  readonly minRenderedMinutes?: number;

  // ── Locale
  readonly locale?: string;
  readonly weekStartsOn?: WeekStart;
  readonly hour12?: boolean;
  readonly dir?: "ltr" | "rtl";
  readonly timezoneLabel?: string;
  readonly messages?: SchedulerMessages;

  // ── Drag / resize
  readonly draggable?: boolean;
  readonly resizable?: boolean | "start" | "end" | "both";
  readonly snapDuration?: number;
  readonly dragBoundary?: DragBoundary;
  readonly minDuration?: number;
  readonly maxDuration?: number;

  // ── Callbacks
  readonly onEventClick?: (payload: SchedulerEventClickPayload<TEvent>) => void;
  readonly onCreateRange?: (payload: SchedulerRangePayload) => void;
  readonly onMoveEvent?: (payload: SchedulerMovePayload<TEvent>) => void | Promise<void>;
  readonly onResizeEvent?: (payload: SchedulerResizePayload<TEvent>) => void | Promise<void>;
  readonly onOverflowClick?: (events: readonly TEvent[]) => void;

  // ── Rendering
  readonly renderEvent?: SchedulerEventRenderer<TEvent>;
  readonly renderAllDayEvent?: SchedulerAllDayRenderer<TEvent>;
  readonly children?: ReactNode;

  // ── DOM plumbing
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly id?: string;
}

// ─── Compound subcomponent props ─────────────────────────────────

export interface SchedulerToolbarProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface SchedulerViewsProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface SchedulerDayViewProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface SchedulerWeekViewProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface SchedulerTimelineViewProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface SchedulerNowIndicatorProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface SchedulerTimeAxisProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface SchedulerResourceHeaderProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * Slot for the consumer's event content renderer. Provides a
 * declarative alternative to the `renderEvent` prop — mount
 * `<Scheduler.EventTemplate render={...} />` anywhere inside
 * `<Scheduler>` to register a renderer. The `renderEvent` prop wins
 * when both are present.
 */
export interface SchedulerEventTemplateProps<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly render: SchedulerEventRenderer<TEvent>;
  readonly renderAllDay?: SchedulerAllDayRenderer<TEvent>;
}
