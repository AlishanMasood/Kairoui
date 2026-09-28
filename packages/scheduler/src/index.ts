// @kairoui-pro/scheduler — public API surface.
//
// Enterprise Scheduler for KairoUI. This entry exports the pure
// framework-independent layout foundation. See
// docs/architecture/PHASE14-SCHEDULER-ARCHITECTURE.md for the full
// contract. React views land in KUI-ENT-011.

export type {
  AllDayLaneEntry,
  DragBoundary,
  EventLayoutOptions,
  EventLayoutResult,
  LaidOutEvent,
  Resource,
  ResourceBucket,
  SchedulerEvent,
  SchedulerViewKind,
  SchedulerViewProps,
  TimeSlot,
  VisibleEventBucket,
  VisibleRange,
  WeekStart,
} from "./scheduler-types";

export type { SlotOptions, VisibleRangeOptions } from "./time-utils";

export {
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

export {
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
