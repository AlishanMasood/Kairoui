// @kairoui-pro/scheduler — public API surface.
//
// Enterprise Scheduler for KairoUI. See
// docs/architecture/PHASE14-SCHEDULER-ARCHITECTURE.md for the full
// contract.

export type {
  AllDayLaneEntry,
  DragBoundary,
  EventLayoutOptions,
  EventLayoutResult,
  LaidOutEvent,
  Resource,
  ResourceBucket,
  SchedulerAccessibilityProps,
  SchedulerAllDayRenderer,
  SchedulerDayViewProps,
  SchedulerEvent,
  SchedulerEventClickPayload,
  SchedulerEventRenderer,
  SchedulerEventTemplateProps,
  SchedulerMessages,
  SchedulerMovePayload,
  SchedulerNowIndicatorProps,
  SchedulerRangePayload,
  SchedulerResizePayload,
  SchedulerResourceHeaderProps,
  SchedulerRootProps,
  SchedulerSelection,
  SchedulerState,
  SchedulerTimeAxisProps,
  SchedulerTimelineViewProps,
  SchedulerToolbarProps,
  SchedulerViewKind,
  SchedulerViewProps,
  SchedulerViewsProps,
  SchedulerWeekViewProps,
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

export { DEFAULT_SCHEDULER_KEYMAP, resolveKeymapAction } from "./keymap";
export type { SchedulerAction, SchedulerKeyBinding, SchedulerKeymap } from "./keymap";

export {
  Scheduler,
  SchedulerDayView,
  SchedulerEventTemplate,
  SchedulerForwarded,
  SchedulerNowIndicator,
  SchedulerResourceHeader,
  SchedulerRoot,
  SchedulerTimeAxis,
  SchedulerTimelineView,
  SchedulerToolbar,
  SchedulerViews,
  SchedulerWeekView,
} from "./scheduler";
export { SchedulerContext, useScheduler } from "./scheduler-context";
export type { SchedulerContextValue } from "./scheduler-context";
