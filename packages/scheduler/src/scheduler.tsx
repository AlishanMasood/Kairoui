import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useControllableState, useEventCallback, useIsomorphicLayoutEffect } from "@kairoui/hooks";
import { SchedulerContext, useScheduler } from "./scheduler-context";
import type { SchedulerContextValue } from "./scheduler-context";
import { DEFAULT_SCHEDULER_KEYMAP, type SchedulerAction, resolveKeymapAction } from "./keymap";
import type {
  AllDayLaneEntry,
  LaidOutEvent,
  Resource,
  SchedulerAllDayRenderer,
  SchedulerDayViewProps,
  SchedulerEvent,
  SchedulerEventRenderer,
  SchedulerEventTemplateProps,
  SchedulerNowIndicatorProps,
  SchedulerResourceHeaderProps,
  SchedulerRootProps,
  SchedulerSelection,
  SchedulerTimeAxisProps,
  SchedulerTimelineViewProps,
  SchedulerToolbarProps,
  SchedulerViewKind,
  SchedulerViewsProps,
  SchedulerWeekViewProps,
} from "./scheduler-types";
import {
  computeAllDayLayout,
  computeEventLayout,
  filterVisibleEvents,
  groupEventsByResource,
} from "./layout";
import {
  addDays,
  addMinutes,
  computeSlots,
  computeVisibleRange,
  differenceInMinutes,
  isSameCalendarDay,
} from "./time-utils";
import {
  defaultEventAnnouncement,
  defaultOverflowLabel,
  defaultViewChangeAnnouncement,
  formatDayHeader,
  formatHourLabel,
  formatRangeLabel,
  inferHour12,
  inferWeekStart,
} from "./scheduler-messages";
import { useDragSchedule } from "./use-drag-schedule";

// ─── Constants ─────────────────────────────────────────────────────

const DEFAULT_SLOT_MINUTES = 30;
const DEFAULT_PX_PER_MINUTE = 1.5;
const DEFAULT_TIMELINE_PX_PER_MINUTE = 2;
const DEFAULT_MAX_EVENTS = 6;
const DEFAULT_MIN_RENDERED = 10;
const DEFAULT_SNAP_MIN = 15;
const DEFAULT_MIN_DURATION_MIN = 15;
const DEFAULT_RESIZE_EDGE_PX = 8;

const NONE_SELECTION: SchedulerSelection = { kind: "none" };

// ─── EventTemplate context (secondary registration path) ──────────

interface RendererRegistryValue<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly register: (
    render: SchedulerEventRenderer<TEvent>,
    renderAllDay: SchedulerAllDayRenderer<TEvent> | null,
  ) => () => void;
}

const RendererRegistryContext = createContext<RendererRegistryValue | null>(null);
RendererRegistryContext.displayName = "SchedulerRendererRegistry";

// ─── Root ──────────────────────────────────────────────────────────

function SchedulerRoot<TEvent extends SchedulerEvent = SchedulerEvent>(
  props: SchedulerRootProps<TEvent>,
): ReactNode {
  const {
    events,
    resources: resourcesProp,
    view: viewProp,
    defaultView,
    onViewChange,
    date: dateProp,
    defaultDate,
    onDateChange,
    selection: selectionProp,
    defaultSelection,
    onSelectionChange,
    daysInView: daysInViewProp,
    slotMinutes = DEFAULT_SLOT_MINUTES,
    startHour = 0,
    endHour = 24,
    pxPerMinute = DEFAULT_PX_PER_MINUTE,
    timelinePxPerMinute = DEFAULT_TIMELINE_PX_PER_MINUTE,
    showAllDayStrip: showAllDayStripProp,
    maxEventsPerSlot = DEFAULT_MAX_EVENTS,
    minRenderedMinutes = DEFAULT_MIN_RENDERED,
    locale = "en",
    weekStartsOn: weekStartsOnProp,
    hour12: hour12Prop,
    dir = "ltr",
    timezoneLabel,
    messages,
    draggable = true,
    resizable = "both",
    snapDuration = DEFAULT_SNAP_MIN,
    dragBoundary = "view",
    minDuration = DEFAULT_MIN_DURATION_MIN,
    maxDuration,
    onEventClick,
    onCreateRange,
    onMoveEvent,
    onResizeEvent,
    onOverflowClick,
    renderEvent,
    renderAllDayEvent,
    children,
    className,
    style,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
  } = props;

  const generatedId = useId();
  const rootId = id ?? generatedId;

  const [view, setViewInternal] = useControllableState<SchedulerViewKind>({
    value: viewProp,
    defaultValue: defaultView ?? "week",
    ...(onViewChange ? { onChange: onViewChange } : undefined),
    name: "Scheduler",
    state: "view",
  });

  const initialDate = defaultDate ?? new Date();
  const [date, setDateInternal] = useControllableState<Date>({
    value: dateProp,
    defaultValue: initialDate,
    ...(onDateChange ? { onChange: onDateChange } : undefined),
    isEqual: (a, b) => a.getTime() === b.getTime(),
    name: "Scheduler",
    state: "date",
  });

  const [selection, setSelectionInternal] = useControllableState<SchedulerSelection>({
    value: selectionProp,
    defaultValue: defaultSelection ?? NONE_SELECTION,
    ...(onSelectionChange ? { onChange: onSelectionChange } : undefined),
    isEqual: schedulerSelectionEqual,
    name: "Scheduler",
    state: "selection",
  });

  const weekStartsOn = useMemo(
    () => weekStartsOnProp ?? inferWeekStart(locale),
    [locale, weekStartsOnProp],
  );
  const hour12 = useMemo(() => hour12Prop ?? inferHour12(locale), [hour12Prop, locale]);
  const daysInView = daysInViewProp ?? (view === "week" ? 7 : 1);
  const showAllDayStrip = showAllDayStripProp ?? events.some((e: SchedulerEvent) => e.allDay);

  // ── Announcer ─────────────────────────────────────────────────
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const announce = useCallback((message: string) => {
    const el = announcerRef.current;
    if (!el) return;
    // Clear/rewrite so identical repeated announcements still fire.
    el.textContent = "";

    requestAnimationFrame(() => {
      if (el.isConnected) el.textContent = message;
    });
  }, []);

  // ── Renderer registry (fallback for <Scheduler.EventTemplate>) ─
  const [registeredRenderer, setRegisteredRenderer] = useState<{
    readonly render: SchedulerEventRenderer | null;
    readonly renderAllDay: SchedulerAllDayRenderer | null;
  }>({ render: null, renderAllDay: null });

  const registerRenderer = useCallback(
    (
      render: SchedulerEventRenderer<TEvent>,
      renderAllDay: SchedulerAllDayRenderer<TEvent> | null,
    ) => {
      setRegisteredRenderer({
        render: render as SchedulerEventRenderer,
        renderAllDay: renderAllDay as SchedulerAllDayRenderer | null,
      });
      return () => {
        setRegisteredRenderer({ render: null, renderAllDay: null });
      };
    },
    [],
  );

  const effectiveRenderEvent: SchedulerEventRenderer<TEvent> | null =
    renderEvent ?? (registeredRenderer.render as SchedulerEventRenderer<TEvent> | null) ?? null;
  const effectiveRenderAllDay: SchedulerAllDayRenderer<TEvent> | null =
    renderAllDayEvent ??
    (registeredRenderer.renderAllDay as SchedulerAllDayRenderer<TEvent> | null) ??
    null;

  // ── Messages ────────────────────────────────────────────────
  const mergedMessages = useMemo(
    () => ({
      toolbarLabel: messages?.toolbarLabel ?? "Scheduler",
      previousLabel: messages?.previousLabel ?? "Previous",
      nextLabel: messages?.nextLabel ?? "Next",
      todayLabel: messages?.todayLabel ?? "Today",
      createEventLabel: messages?.createEventLabel ?? "Create event",
      viewSwitcherLabel: messages?.viewSwitcherLabel ?? "View",
      dayLabel: messages?.dayLabel ?? "Day",
      weekLabel: messages?.weekLabel ?? "Week",
      timelineLabel: messages?.timelineLabel ?? "Timeline",
      allDayLabel: messages?.allDayLabel ?? "All day",
      nowIndicatorLabel: messages?.nowIndicatorLabel ?? "Current time",
      overflowLabel: messages?.overflowLabel ?? defaultOverflowLabel,
      viewChangeAnnouncement: messages?.viewChangeAnnouncement ?? defaultViewChangeAnnouncement,
      eventAnnouncement: messages?.eventAnnouncement ?? defaultEventAnnouncement,
    }),
    [messages],
  );

  // ── Setters that fire callbacks ─────────────────────────────
  const onEventClickStable = useEventCallback(onEventClick ?? nullFn);
  const onCreateRangeStable = useEventCallback(onCreateRange ?? nullFn);
  const onMoveEventStable = useEventCallback(onMoveEvent ?? nullFn);
  const onResizeEventStable = useEventCallback(onResizeEvent ?? nullFn);
  const onOverflowClickStable = useEventCallback(onOverflowClick ?? nullFn);

  const range = useMemo(
    () => computeVisibleRange({ kind: view, date, weekStartsOn, daysInView }),
    [daysInView, date, view, weekStartsOn],
  );

  const setView = useCallback(
    (next: SchedulerViewKind) => {
      setViewInternal(next);
      const nextRange = computeVisibleRange({
        kind: next,
        date,
        weekStartsOn,
        daysInView: daysInViewProp ?? (next === "week" ? 7 : 1),
      });
      announce(mergedMessages.viewChangeAnnouncement(next, formatRangeLabel(nextRange, locale)));
    },
    [announce, date, daysInViewProp, locale, mergedMessages, setViewInternal, weekStartsOn],
  );

  // `range` participates in the memoization key set below via `date` / `view` etc.
  void range;

  const setDate = useCallback(
    (next: Date) => {
      setDateInternal(next);
    },
    [setDateInternal],
  );

  const setSelection = useCallback(
    (next: SchedulerSelection) => {
      setSelectionInternal(next);
    },
    [setSelectionInternal],
  );

  const resources = resourcesProp ?? EMPTY_RESOURCES;

  const contextValue: SchedulerContextValue = useMemo(
    () => ({
      state: { view, date, selection },
      events: events,
      resources,
      daysInView,
      slotMinutes,
      startHour,
      endHour,
      pxPerMinute,
      timelinePxPerMinute,
      showAllDayStrip,
      maxEventsPerSlot,
      minRenderedMinutes,
      locale,
      weekStartsOn,
      hour12,
      dir,
      timezoneLabel: timezoneLabel ?? null,
      messages: mergedMessages,
      draggable,
      resizable,
      snapDuration,
      dragBoundary,
      minDuration,
      maxDuration: maxDuration ?? null,
      keymap: DEFAULT_SCHEDULER_KEYMAP,
      rootId,
      renderEvent: effectiveRenderEvent as SchedulerEventRenderer | null,
      renderAllDayEvent: effectiveRenderAllDay as SchedulerAllDayRenderer | null,
      setView,
      setDate,
      setSelection,
      registerRenderer: registerRenderer as SchedulerContextValue["registerRenderer"],
      onEventClick:
        onEventClick !== undefined
          ? (onEventClickStable as SchedulerContextValue["onEventClick"])
          : null,
      onCreateRange:
        onCreateRange !== undefined
          ? (onCreateRangeStable as SchedulerContextValue["onCreateRange"])
          : null,
      onMoveEvent:
        onMoveEvent !== undefined
          ? (onMoveEventStable as SchedulerContextValue["onMoveEvent"])
          : null,
      onResizeEvent:
        onResizeEvent !== undefined
          ? (onResizeEventStable as SchedulerContextValue["onResizeEvent"])
          : null,
      onOverflowClick:
        onOverflowClick !== undefined
          ? (onOverflowClickStable as SchedulerContextValue["onOverflowClick"])
          : null,
      announce,
    }),
    [
      announce,
      date,
      daysInView,
      dir,
      dragBoundary,
      draggable,
      effectiveRenderAllDay,
      effectiveRenderEvent,
      endHour,
      events,
      hour12,
      locale,
      maxDuration,
      maxEventsPerSlot,
      mergedMessages,
      minDuration,
      minRenderedMinutes,
      onCreateRange,
      onCreateRangeStable,
      onEventClick,
      onEventClickStable,
      onMoveEvent,
      onMoveEventStable,
      onOverflowClick,
      onOverflowClickStable,
      onResizeEvent,
      onResizeEventStable,
      pxPerMinute,
      registerRenderer,
      resizable,
      resources,
      rootId,
      selection,
      setDate,
      setSelection,
      setView,
      showAllDayStrip,
      slotMinutes,
      snapDuration,
      startHour,
      timelinePxPerMinute,
      timezoneLabel,
      view,
      weekStartsOn,
    ],
  );

  return (
    <SchedulerContext.Provider value={contextValue}>
      <RendererRegistryContext.Provider
        value={{
          register: registerRenderer as RendererRegistryValue["register"],
        }}
      >
        <div
          id={rootId}
          className={joinClass("kui-scheduler", className)}
          style={style}
          role="application"
          aria-roledescription="Scheduler"
          {...(ariaLabel !== undefined
            ? { "aria-label": ariaLabel }
            : ariaLabelledBy === undefined
              ? { "aria-label": mergedMessages.toolbarLabel }
              : {})}
          {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
          {...(ariaDescribedBy !== undefined ? { "aria-describedby": ariaDescribedBy } : {})}
          dir={dir}
          data-view={view}
        >
          {children ?? <SchedulerDefaultLayout />}
          <div
            ref={announcerRef}
            aria-live="polite"
            aria-atomic="true"
            className="kui-scheduler__announcer"
            data-scheduler-announcer=""
          />
        </div>
      </RendererRegistryContext.Provider>
    </SchedulerContext.Provider>
  );
}

const EMPTY_RESOURCES: readonly Resource[] = [];
const nullFn = (): void => undefined;

function schedulerSelectionEqual(a: SchedulerSelection, b: SchedulerSelection): boolean {
  if (a === b) return true;
  if (a.kind !== b.kind) return false;
  if (a.kind === "none") return true;
  if (a.kind === "event") {
    return b.kind === "event" && a.eventId === b.eventId;
  }
  if (b.kind !== "range") return false;
  return (
    a.start.getTime() === b.start.getTime() &&
    a.end.getTime() === b.end.getTime() &&
    a.resourceId === b.resourceId
  );
}

function joinClass(...parts: readonly (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

function SchedulerDefaultLayout(): ReactNode {
  const { state } = useScheduler();
  return (
    <>
      <SchedulerToolbar />
      <SchedulerViews>
        {state.view === "day" ? (
          <SchedulerDayView />
        ) : state.view === "timeline" ? (
          <SchedulerTimelineView />
        ) : (
          <SchedulerWeekView />
        )}
      </SchedulerViews>
    </>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────

function SchedulerToolbar(props: SchedulerToolbarProps = {}): ReactNode {
  const ctx = useScheduler();
  const { className, style, children } = props;
  const range = useMemo(
    () =>
      computeVisibleRange({
        kind: ctx.state.view,
        date: ctx.state.date,
        weekStartsOn: ctx.weekStartsOn,
        daysInView: ctx.daysInView,
      }),
    [ctx.daysInView, ctx.state.date, ctx.state.view, ctx.weekStartsOn],
  );
  const rangeLabel = useMemo(() => formatRangeLabel(range, ctx.locale), [ctx.locale, range]);

  const goPrev = useCallback(() => {
    const step = ctx.daysInView;
    ctx.setDate(addDays(ctx.state.date, -step));
  }, [ctx]);
  const goNext = useCallback(() => {
    const step = ctx.daysInView;
    ctx.setDate(addDays(ctx.state.date, step));
  }, [ctx]);
  const goToday = useCallback(() => {
    ctx.setDate(new Date());
  }, [ctx]);

  // Keyboard-accessible range creation. The onCreateRange slot click
  // is only reachable with a pointer; this button gives keyboard users
  // the same affordance from the toolbar.
  const createRange = useCallback(() => {
    if (!ctx.onCreateRange) return;
    const firstDay = range.days[0];
    if (!firstDay) return;
    const rangeStart = new Date(firstDay.getTime());
    rangeStart.setHours(Math.max(9, ctx.startHour), 0, 0, 0);
    const rangeEnd = new Date(rangeStart.getTime() + 30 * 60_000);
    ctx.onCreateRange({ start: rangeStart, end: rangeEnd, allDay: false });
  }, [ctx, range.days]);

  return (
    <div
      role="toolbar"
      aria-label={ctx.messages.toolbarLabel}
      className={joinClass("kui-scheduler__toolbar", className)}
      style={style}
      data-scheduler-toolbar=""
    >
      {children ?? (
        <>
          <button
            type="button"
            className="kui-scheduler__nav"
            data-scheduler-prev=""
            onClick={goPrev}
            aria-label={ctx.messages.previousLabel}
          >
            ‹
          </button>
          <button
            type="button"
            className="kui-scheduler__nav"
            data-scheduler-today=""
            onClick={goToday}
          >
            {ctx.messages.todayLabel}
          </button>
          <button
            type="button"
            className="kui-scheduler__nav"
            data-scheduler-next=""
            onClick={goNext}
            aria-label={ctx.messages.nextLabel}
          >
            ›
          </button>
          {ctx.onCreateRange ? (
            <button
              type="button"
              className="kui-scheduler__nav"
              data-scheduler-create=""
              onClick={createRange}
              aria-label={ctx.messages.createEventLabel}
            >
              {ctx.messages.createEventLabel}
            </button>
          ) : null}
          <span
            className="kui-scheduler__range-label"
            aria-live="polite"
            data-scheduler-range-label=""
          >
            {rangeLabel}
            {ctx.timezoneLabel ? (
              <span className="kui-scheduler__tz-label" data-scheduler-tz="">
                {" "}
                ({ctx.timezoneLabel})
              </span>
            ) : null}
          </span>
          <div
            role="tablist"
            aria-label={ctx.messages.viewSwitcherLabel}
            className="kui-scheduler__view-switcher"
            data-scheduler-view-switcher=""
          >
            <ViewTab kind="day" label={ctx.messages.dayLabel} />
            <ViewTab kind="week" label={ctx.messages.weekLabel} />
            <ViewTab kind="timeline" label={ctx.messages.timelineLabel} />
          </div>
        </>
      )}
    </div>
  );
}

function ViewTab({
  kind,
  label,
}: {
  readonly kind: SchedulerViewKind;
  readonly label: string;
}): ReactNode {
  const ctx = useScheduler();
  const selected = ctx.state.view === kind;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={joinClass(
        "kui-scheduler__view-tab",
        selected && "kui-scheduler__view-tab--selected",
      )}
      onClick={() => {
        ctx.setView(kind);
      }}
      data-scheduler-view-tab={kind}
    >
      {label}
    </button>
  );
}

// ─── Views container ─────────────────────────────────────────────

function SchedulerViews(props: SchedulerViewsProps & { readonly children?: ReactNode }): ReactNode {
  const { className, style, children } = props;
  const ctx = useScheduler();
  return (
    <div
      className={joinClass("kui-scheduler__views", className)}
      style={style}
      data-scheduler-views=""
    >
      {children ??
        (ctx.state.view === "day" ? (
          <SchedulerDayView />
        ) : ctx.state.view === "timeline" ? (
          <SchedulerTimelineView />
        ) : (
          <SchedulerWeekView />
        ))}
    </div>
  );
}

// ─── Time axis ────────────────────────────────────────────────────

function SchedulerTimeAxis(props: SchedulerTimeAxisProps = {}): ReactNode {
  const { className, style } = props;
  const ctx = useScheduler();
  const slots = useMemo(
    () =>
      computeSlots({
        startHour: ctx.startHour,
        endHour: ctx.endHour,
        slotMinutes: 60,
      }),
    [ctx.endHour, ctx.startHour],
  );
  return (
    <div
      className={joinClass("kui-scheduler__time-axis", className)}
      style={style}
      role="presentation"
      data-scheduler-time-axis=""
    >
      {slots.map((slot) => {
        const hour = Math.floor(slot.startMinutesFromMidnight / 60);
        return (
          <div
            key={slot.index}
            role="rowheader"
            className="kui-scheduler__time-label"
            style={{ height: `${String(60 * ctx.pxPerMinute)}px` }}
            data-scheduler-hour={hour}
          >
            {formatHourLabel(hour, ctx.locale, ctx.hour12)}
          </div>
        );
      })}
    </div>
  );
}

// ─── NowIndicator ────────────────────────────────────────────────

function SchedulerNowIndicator(props: SchedulerNowIndicatorProps = {}): ReactNode {
  const { className, style } = props;
  const ctx = useScheduler();
  const [now, setNow] = useState<Date | null>(null);

  useIsomorphicLayoutEffect(() => {
    setNow(new Date());
    const id = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => {
      clearInterval(id);
    };
  }, []);

  if (!now) return null;

  const range = computeVisibleRange({
    kind: ctx.state.view,
    date: ctx.state.date,
    weekStartsOn: ctx.weekStartsOn,
    daysInView: ctx.daysInView,
  });
  if (now < range.start || now >= range.end) return null;

  const minutesFromMidnight = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const bandStartMinutes = ctx.startHour * 60;
  const bandEndMinutes = ctx.endHour * 60;
  if (minutesFromMidnight < bandStartMinutes || minutesFromMidnight >= bandEndMinutes) return null;
  const top = (minutesFromMidnight - bandStartMinutes) * ctx.pxPerMinute;

  return (
    <div
      className={joinClass("kui-scheduler__now-indicator", className)}
      role="presentation"
      aria-label={ctx.messages.nowIndicatorLabel}
      style={{ top: `${String(top)}px`, ...style }}
      data-scheduler-now-indicator=""
    />
  );
}

// ─── EventTemplate (declarative renderer registration) ───────────

function SchedulerEventTemplate<TEvent extends SchedulerEvent = SchedulerEvent>(
  props: SchedulerEventTemplateProps<TEvent>,
): ReactNode {
  const registry = useContext(RendererRegistryContext);
  const { render, renderAllDay } = props;
  useEffect(() => {
    if (!registry) return;
    return registry.register(
      render as unknown as SchedulerEventRenderer,
      (renderAllDay ?? null) as SchedulerAllDayRenderer | null,
    );
  }, [registry, render, renderAllDay]);
  return null;
}

// ─── ResourceHeader ──────────────────────────────────────────────

function SchedulerResourceHeader(props: SchedulerResourceHeaderProps = {}): ReactNode {
  const { className, style } = props;
  const ctx = useScheduler();
  if (ctx.resources.length === 0) return null;
  return (
    <div
      className={joinClass("kui-scheduler__resource-header", className)}
      style={style}
      role="presentation"
      data-scheduler-resource-header=""
    >
      {ctx.resources.map((resource) => (
        <div
          key={resource.id}
          role="rowheader"
          className="kui-scheduler__resource-label"
          data-scheduler-resource-id={resource.id}
        >
          {resource.label}
        </div>
      ))}
    </div>
  );
}

// ─── DayView / WeekView (shared vertical grid) ───────────────────

function SchedulerWeekView(props: SchedulerWeekViewProps = {}): ReactNode {
  return (
    <VerticalGrid
      {...(props.className !== undefined ? { className: props.className } : {})}
      {...(props.style !== undefined ? { style: props.style } : {})}
    />
  );
}

function SchedulerDayView(props: SchedulerDayViewProps = {}): ReactNode {
  return (
    <VerticalGrid
      {...(props.className !== undefined ? { className: props.className } : {})}
      {...(props.style !== undefined ? { style: props.style } : {})}
    />
  );
}

function VerticalGrid(props: {
  readonly className?: string;
  readonly style?: CSSProperties;
}): ReactNode {
  const { className, style } = props;
  const ctx = useScheduler();
  const range = useMemo(
    () =>
      computeVisibleRange({
        kind: ctx.state.view,
        date: ctx.state.date,
        weekStartsOn: ctx.weekStartsOn,
        daysInView: ctx.daysInView,
      }),
    [ctx.daysInView, ctx.state.date, ctx.state.view, ctx.weekStartsOn],
  );

  const bandStart = ctx.startHour * 60;
  const bandEnd = ctx.endHour * 60;
  const bandMinutes = bandEnd - bandStart;
  const gridHeight = bandMinutes * ctx.pxPerMinute;

  const buckets = useMemo(
    () => filterVisibleEvents(ctx.events, range.start, range.end),
    [ctx.events, range.end, range.start],
  );
  const allDayEntries = useMemo(
    () =>
      ctx.showAllDayStrip
        ? computeAllDayLayout({
            events: buckets.allDay,
            rangeStart: range.start,
            days: range.days.length,
          })
        : [],
    [buckets.allDay, ctx.showAllDayStrip, range.days.length, range.start],
  );
  const maxLane = allDayEntries.reduce((max, e) => Math.max(max, e.lane), -1);
  const allDayStripHeight = ctx.showAllDayStrip ? Math.max(1, maxLane + 1) * 24 : 0;

  const drag = useDragSchedule<SchedulerEvent>({
    range,
    snapDuration: ctx.snapDuration,
    minDuration: ctx.minDuration,
    maxDuration: ctx.maxDuration,
    dragBoundary: ctx.dragBoundary,
    pxPerMinute: ctx.pxPerMinute,
    axis: "vertical",
    onMoveEvent: ctx.onMoveEvent,
    enabled: ctx.draggable,
  });

  const gridRef = useRef<HTMLDivElement | null>(null);

  const onGridPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag.ghost) return;
      drag.updateDrag(e.clientY);
    },
    [drag],
  );
  const onGridPointerUp = useCallback(
    (_e: ReactPointerEvent<HTMLDivElement>) => {
      drag.endDrag(true);
    },
    [drag],
  );

  return (
    <div
      className={joinClass("kui-scheduler__grid", "kui-scheduler__grid--vertical", className)}
      style={style}
      data-scheduler-grid="vertical"
    >
      {/* Column header row: day labels */}
      <div className="kui-scheduler__day-header-row" role="row" data-scheduler-day-headers="">
        <div className="kui-scheduler__corner" role="presentation" />
        {range.days.map((day) => (
          <div
            key={day.getTime()}
            role="columnheader"
            className={joinClass(
              "kui-scheduler__day-header",
              isSameCalendarDay(day, new Date()) && "kui-scheduler__day-header--today",
            )}
            data-scheduler-day={day.toISOString()}
          >
            {formatDayHeader(day, ctx.locale)}
          </div>
        ))}
      </div>

      {ctx.showAllDayStrip ? (
        <div className="kui-scheduler__all-day-row" role="row" data-scheduler-all-day-row="">
          <div className="kui-scheduler__all-day-label" role="presentation">
            {ctx.messages.allDayLabel}
          </div>
          <div
            className="kui-scheduler__all-day-strip"
            role="presentation"
            style={{
              height: `${String(allDayStripHeight)}px`,
              gridTemplateColumns: `repeat(${String(range.days.length)}, minmax(0, 1fr))`,
            }}
            data-scheduler-all-day-strip=""
          >
            {allDayEntries.map((entry) => renderAllDayEvent(entry, ctx, range.days.length))}
          </div>
        </div>
      ) : null}

      <div
        className="kui-scheduler__grid-body"
        role="grid"
        aria-rowcount={Math.max(1, Math.ceil(bandMinutes / ctx.slotMinutes))}
        aria-colcount={range.days.length}
        data-scheduler-grid-body=""
        ref={gridRef}
        onPointerMove={onGridPointerMove}
        onPointerUp={onGridPointerUp}
      >
        <SchedulerTimeAxis />
        <div
          className="kui-scheduler__day-columns"
          style={{
            gridTemplateColumns: `repeat(${String(range.days.length)}, minmax(0, 1fr))`,
            height: `${String(gridHeight)}px`,
          }}
          data-scheduler-day-columns=""
        >
          {range.days.map((day, dayIndex) => (
            <DayColumn
              key={day.getTime()}
              day={day}
              dayIndex={dayIndex}
              events={buckets.timed}
              gridHeight={gridHeight}
              bandStart={bandStart}
              bandEnd={bandEnd}
            />
          ))}
          <SchedulerNowIndicator />
        </div>
      </div>
    </div>
  );
}

function DayColumn(props: {
  readonly day: Date;
  readonly dayIndex: number;
  readonly events: readonly SchedulerEvent[];
  readonly gridHeight: number;
  readonly bandStart: number;
  readonly bandEnd: number;
}): ReactNode {
  const { day, dayIndex, events, gridHeight, bandStart, bandEnd } = props;
  const ctx = useScheduler();
  const dayStart = useMemo(() => addMinutes(day, bandStart), [bandStart, day]);
  const dayEnd = useMemo(() => addMinutes(day, bandEnd), [bandEnd, day]);
  const layout = useMemo(
    () =>
      computeEventLayout({
        events,
        rangeStart: dayStart,
        rangeEnd: dayEnd,
        options: {
          maxEventsPerSlot: ctx.maxEventsPerSlot,
          minRenderedMinutes: ctx.minRenderedMinutes,
        },
      }),
    [ctx.maxEventsPerSlot, ctx.minRenderedMinutes, dayEnd, dayStart, events],
  );

  // Slots for background grid + click-to-create-range
  const slots = useMemo(
    () =>
      computeSlots({
        startHour: ctx.startHour,
        endHour: ctx.endHour,
        slotMinutes: ctx.slotMinutes,
      }),
    [ctx.endHour, ctx.slotMinutes, ctx.startHour],
  );

  const onSlotClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>, slotIndex: number) => {
      if (e.defaultPrevented) return;
      const slot = slots[slotIndex];
      if (!slot) return;
      const rangeStart = addMinutes(day, slot.startMinutesFromMidnight);
      const rangeEnd = addMinutes(day, slot.endMinutesFromMidnight);
      ctx.setSelection({
        kind: "range",
        start: rangeStart,
        end: rangeEnd,
        ...(ctx.resources.length > 0 && ctx.resources[0]
          ? { resourceId: ctx.resources[0].id }
          : {}),
      });
      if (ctx.onCreateRange) {
        ctx.onCreateRange({
          start: rangeStart,
          end: rangeEnd,
          allDay: false,
        });
      }
    },
    [ctx, day, slots],
  );

  return (
    <div
      className="kui-scheduler__day-column"
      role="presentation"
      data-scheduler-day-column={String(dayIndex)}
      data-day={day.toISOString()}
      style={{ height: `${String(gridHeight)}px` }}
    >
      {slots.map((slot) => (
        <div
          key={slot.index}
          role="gridcell"
          aria-rowindex={slot.index + 1}
          aria-colindex={dayIndex + 1}
          tabIndex={-1}
          className="kui-scheduler__slot"
          style={{
            height: `${String(ctx.slotMinutes * ctx.pxPerMinute)}px`,
          }}
          data-scheduler-slot={slot.index}
          onClick={(e) => {
            onSlotClick(e, slot.index);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSlotClick(e as unknown as ReactMouseEvent<HTMLDivElement>, slot.index);
            }
          }}
        />
      ))}
      {layout.laidOut.map((laid) => (
        <EventBox key={laid.event.id} laid={laid} dayStart={dayStart} />
      ))}
      {layout.overflow.length > 0 ? (
        <button
          type="button"
          className="kui-scheduler__overflow"
          data-scheduler-overflow=""
          onClick={() => {
            if (ctx.onOverflowClick) ctx.onOverflowClick(layout.overflow);
          }}
        >
          {ctx.messages.overflowLabel(layout.overflow.length)}
        </button>
      ) : null}
    </div>
  );
}

function EventBox(props: { readonly laid: LaidOutEvent; readonly dayStart: Date }): ReactNode {
  const { laid, dayStart } = props;
  const ctx = useScheduler();
  const isSelected =
    ctx.state.selection.kind === "event" && ctx.state.selection.eventId === laid.event.id;

  const minutesFromBandStart = differenceInMinutes(dayStart, laid.event.start) - 0 + 0; // sanity
  const eventStartMinutes = Math.max(0, minutesFromBandStart);
  const durationMinutes = Math.max(
    ctx.minRenderedMinutes,
    differenceInMinutes(laid.event.start, laid.event.end),
  );
  const clippedEndMinutes = Math.min(
    (ctx.endHour - ctx.startHour) * 60,
    eventStartMinutes + durationMinutes,
  );
  const heightMinutes = Math.max(ctx.minRenderedMinutes, clippedEndMinutes - eventStartMinutes);

  const columnWidthPct = 100 / laid.clusterColumns;
  const leftPct = laid.column * columnWidthPct;

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      handleEventKeyDown(e, laid.event, ctx);
    },
    [ctx, laid.event],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!ctx.draggable) return;
      if (e.button !== 0) return;
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const height = rect.height;
      const resizable = ctx.resizable;
      const canResizeStart = resizable === true || resizable === "start" || resizable === "both";
      const canResizeEnd = resizable === true || resizable === "end" || resizable === "both";
      if (canResizeStart && offsetY < DEFAULT_RESIZE_EDGE_PX) {
        target.setPointerCapture(e.pointerId);
      } else if (canResizeEnd && offsetY > height - DEFAULT_RESIZE_EDGE_PX) {
        target.setPointerCapture(e.pointerId);
      } else {
        target.setPointerCapture(e.pointerId);
      }
    },
    [ctx.draggable, ctx.resizable],
  );

  const onClick = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      ctx.setSelection({ kind: "event", eventId: laid.event.id });
      if (ctx.onEventClick) {
        ctx.onEventClick({ event: laid.event, nativeEvent: e.nativeEvent });
      }
    },
    [ctx, laid.event],
  );

  const style: CSSProperties = {
    position: "absolute",
    top: `${String(eventStartMinutes * ctx.pxPerMinute)}px`,
    height: `${String(heightMinutes * ctx.pxPerMinute)}px`,
    left: `${String(leftPct)}%`,
    width: `calc(${String(columnWidthPct)}% - 2px)`,
  };

  const render = ctx.renderEvent;
  const content = render ? (
    render({ event: laid.event, laidOut: laid, isSelected, isDragging: false, isResizing: false })
  ) : (
    <div className="kui-scheduler__event-default">
      <div className="kui-scheduler__event-title">{laid.event.title}</div>
      {laid.event.description ? (
        <div className="kui-scheduler__event-description">{laid.event.description}</div>
      ) : null}
    </div>
  );

  return (
    <button
      type="button"
      aria-label={ctx.messages.eventAnnouncement(laid.event)}
      aria-pressed={isSelected}
      className={joinClass("kui-scheduler__event", isSelected && "kui-scheduler__event--selected")}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      tabIndex={0}
      data-scheduler-event={laid.event.id}
      data-selected={isSelected ? "" : undefined}
    >
      {content}
    </button>
  );
}

function renderAllDayEvent(
  entry: AllDayLaneEntry,
  ctx: SchedulerContextValue,
  totalDays: number,
): ReactNode {
  const isSelected =
    ctx.state.selection.kind === "event" && ctx.state.selection.eventId === entry.event.id;
  const style: CSSProperties = {
    gridColumn: `${String(entry.startDayIndex + 1)} / span ${String(
      Math.min(entry.spanDays, totalDays - entry.startDayIndex),
    )}`,
    gridRow: String(entry.lane + 1),
  };
  const render = ctx.renderAllDayEvent;
  const content = render ? (
    render({ event: entry.event, entry, isSelected })
  ) : (
    <span className="kui-scheduler__all-day-event-title">{entry.event.title}</span>
  );
  return (
    <button
      key={entry.event.id}
      type="button"
      aria-label={ctx.messages.eventAnnouncement(entry.event)}
      aria-pressed={isSelected}
      className={joinClass(
        "kui-scheduler__all-day-event",
        isSelected && "kui-scheduler__all-day-event--selected",
      )}
      style={style}
      onClick={(e) => {
        ctx.setSelection({ kind: "event", eventId: entry.event.id });
        if (ctx.onEventClick) {
          ctx.onEventClick({ event: entry.event, nativeEvent: e.nativeEvent });
        }
      }}
      data-scheduler-all-day-event={entry.event.id}
    >
      {content}
    </button>
  );
}

function handleEventKeyDown(
  e: ReactKeyboardEvent<HTMLButtonElement>,
  event: SchedulerEvent,
  ctx: SchedulerContextValue,
): void {
  const action = resolveKeymapAction(
    { key: e.key, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey },
    ctx.keymap,
  );
  if (!action) return;
  applyEventAction(action, event, ctx, e);
}

function applyEventAction(
  action: SchedulerAction,
  event: SchedulerEvent,
  ctx: SchedulerContextValue,
  e: ReactKeyboardEvent<HTMLButtonElement>,
): void {
  const step = ctx.snapDuration;
  const moveEvent = (deltaMinutes: number): void => {
    if (!ctx.onMoveEvent) return;
    e.preventDefault();
    const nextStart = addMinutes(event.start, deltaMinutes);
    const nextEnd = addMinutes(event.end, deltaMinutes);
    void ctx.onMoveEvent({
      event,
      start: nextStart,
      end: nextEnd,
      ...(event.resourceId !== undefined ? { resourceId: event.resourceId } : {}),
    });
  };
  const resizeEvent = (deltaMinutes: number, edge: "start" | "end"): void => {
    if (!ctx.onResizeEvent) return;
    e.preventDefault();
    if (edge === "start") {
      const nextStart = addMinutes(event.start, deltaMinutes);
      const durationMin = (event.end.getTime() - nextStart.getTime()) / 60_000;
      if (durationMin < ctx.minDuration) return;
      void ctx.onResizeEvent({ event, start: nextStart, end: event.end, edge });
    } else {
      const nextEnd = addMinutes(event.end, deltaMinutes);
      const durationMin = (nextEnd.getTime() - event.start.getTime()) / 60_000;
      if (durationMin < ctx.minDuration) return;
      void ctx.onResizeEvent({ event, start: event.start, end: nextEnd, edge });
    }
  };
  switch (action) {
    case "moveUp":
      moveEvent(-step);
      return;
    case "moveDown":
      moveEvent(step);
      return;
    case "moveLeft":
      // Vertical grid: left = previous slot; timeline: left = -step minutes.
      moveEvent(-step);
      return;
    case "moveRight":
      moveEvent(step);
      return;
    case "resizeEndUp":
      resizeEvent(-step, "end");
      return;
    case "resizeEndDown":
      resizeEvent(step, "end");
      return;
    case "resizeStartUp":
      resizeEvent(-step, "start");
      return;
    case "resizeStartDown":
      resizeEvent(step, "start");
      return;
    case "prevDay":
      moveEvent(-24 * 60);
      return;
    case "nextDay":
      moveEvent(24 * 60);
      return;
    case "activate":
      e.preventDefault();
      if (ctx.onEventClick) {
        ctx.onEventClick({ event, nativeEvent: e.nativeEvent });
      }
      return;
    case "cancel":
      e.preventDefault();
      ctx.setSelection({ kind: "none" });
      return;
    case "prev":
      e.preventDefault();
      ctx.setDate(addDays(ctx.state.date, -ctx.daysInView));
      return;
    case "next":
      e.preventDefault();
      ctx.setDate(addDays(ctx.state.date, ctx.daysInView));
      return;
    case "today":
      e.preventDefault();
      ctx.setDate(new Date());
      return;
    case "delete":
      // Consumer callback not defined at this layer — the ADR treats
      // deletion as a bring-your-own concern.
      return;
    default:
      return;
  }
}

// ─── Timeline view ───────────────────────────────────────────────

function SchedulerTimelineView(props: SchedulerTimelineViewProps = {}): ReactNode {
  const { className, style } = props;
  const ctx = useScheduler();
  const range = useMemo(
    () =>
      computeVisibleRange({
        kind: ctx.state.view,
        date: ctx.state.date,
        weekStartsOn: ctx.weekStartsOn,
        daysInView: ctx.daysInView,
      }),
    [ctx.daysInView, ctx.state.date, ctx.state.view, ctx.weekStartsOn],
  );
  const bandStart = ctx.startHour * 60;
  const bandEnd = ctx.endHour * 60;
  const totalMinutes = (bandEnd - bandStart) * range.days.length;
  const timelineWidth = totalMinutes * ctx.timelinePxPerMinute;

  const buckets = useMemo(
    () => filterVisibleEvents(ctx.events, range.start, range.end),
    [ctx.events, range.end, range.start],
  );
  const resourceBuckets = useMemo(
    () => groupEventsByResource(buckets.timed, ctx.resources),
    [buckets.timed, ctx.resources],
  );
  const rangeLabel = useMemo(() => formatRangeLabel(range, ctx.locale), [ctx.locale, range]);
  return (
    <div
      className={joinClass("kui-scheduler__grid", "kui-scheduler__grid--timeline", className)}
      style={style}
      role="grid"
      aria-label={rangeLabel}
      aria-rowcount={resourceBuckets.length}
      data-scheduler-grid="timeline"
    >
      <div className="kui-scheduler__timeline-header" role="row">
        <div className="kui-scheduler__timeline-corner" role="presentation" />
        <div
          className="kui-scheduler__timeline-hours"
          style={{ width: `${String(timelineWidth)}px` }}
          role="presentation"
        >
          {range.days.map((_day, dayIndex) => {
            const slots = computeSlots({
              startHour: ctx.startHour,
              endHour: ctx.endHour,
              slotMinutes: 60,
            });
            return slots.map((slot) => {
              const hour = Math.floor(slot.startMinutesFromMidnight / 60);
              return (
                <div
                  key={`${String(dayIndex)}-${String(slot.index)}`}
                  className="kui-scheduler__timeline-hour"
                  role="columnheader"
                  style={{ width: `${String(60 * ctx.timelinePxPerMinute)}px` }}
                  data-scheduler-hour={hour}
                >
                  {formatHourLabel(hour, ctx.locale, ctx.hour12)}
                </div>
              );
            });
          })}
        </div>
      </div>
      <div className="kui-scheduler__timeline-body">
        <div className="kui-scheduler__timeline-resources" role="presentation">
          {resourceBuckets.map((bucket, rowIndex) => (
            <div
              key={bucket.resourceId ?? "__none__"}
              role="rowheader"
              className="kui-scheduler__resource-lane-label"
              data-scheduler-resource-id={bucket.resourceId ?? ""}
              aria-rowindex={rowIndex + 1}
            >
              {bucket.resource?.label ?? "—"}
            </div>
          ))}
        </div>
        <div
          className="kui-scheduler__timeline-rows"
          style={{ width: `${String(timelineWidth)}px` }}
          role="presentation"
        >
          {resourceBuckets.map((bucket, rowIndex) => (
            <TimelineRow
              key={bucket.resourceId ?? "__none__"}
              rowIndex={rowIndex}
              days={range.days}
              events={bucket.events}
              bandStart={bandStart}
              bandEnd={bandEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineRow(props: {
  readonly rowIndex: number;
  readonly days: readonly Date[];
  readonly events: readonly SchedulerEvent[];
  readonly bandStart: number;
  readonly bandEnd: number;
}): ReactNode {
  const { rowIndex, days, events, bandStart, bandEnd } = props;
  const ctx = useScheduler();
  const firstDay = days[0] ?? null;
  const lastDay = days[days.length - 1] ?? null;
  const rowStart = useMemo(
    () => (firstDay ? addMinutes(firstDay, bandStart) : new Date(0)),
    [bandStart, firstDay],
  );
  const rowEnd = useMemo(
    () => (lastDay ? addMinutes(lastDay, bandEnd) : new Date(0)),
    [bandEnd, lastDay],
  );
  const totalMinutes = differenceInMinutes(rowStart, rowEnd);
  const rowWidth = totalMinutes * ctx.timelinePxPerMinute;

  const layout = useMemo(
    () =>
      firstDay && lastDay
        ? computeEventLayout({
            events,
            rangeStart: rowStart,
            rangeEnd: rowEnd,
            options: {
              maxEventsPerSlot: ctx.maxEventsPerSlot,
              minRenderedMinutes: ctx.minRenderedMinutes,
            },
          })
        : { laidOut: [], overflow: [] },
    [ctx.maxEventsPerSlot, ctx.minRenderedMinutes, events, firstDay, lastDay, rowEnd, rowStart],
  );
  if (!firstDay || !lastDay) return null;
  const rowHeight = Math.max(48, 24 * (layout.laidOut.length > 0 ? 2 : 1));
  return (
    <div
      className="kui-scheduler__timeline-row"
      role="row"
      aria-rowindex={rowIndex + 1}
      style={{ width: `${String(rowWidth)}px`, height: `${String(rowHeight)}px` }}
      data-scheduler-timeline-row={rowIndex}
    >
      {days.map((_day, dayIndex) => {
        const slots = computeSlots({
          startHour: ctx.startHour,
          endHour: ctx.endHour,
          slotMinutes: ctx.slotMinutes,
        });
        return slots.map((slot) => (
          <div
            key={`${String(dayIndex)}-${String(slot.index)}`}
            role="gridcell"
            aria-rowindex={rowIndex + 1}
            aria-colindex={dayIndex * slots.length + slot.index + 1}
            className="kui-scheduler__timeline-slot"
            style={{ width: `${String(ctx.slotMinutes * ctx.timelinePxPerMinute)}px` }}
            data-scheduler-day-index={dayIndex}
            data-scheduler-slot={slot.index}
          />
        ));
      })}
      {layout.laidOut.map((laid) => (
        <TimelineEventBox
          key={laid.event.id}
          laid={laid}
          rowStart={rowStart}
          rowHeight={rowHeight}
        />
      ))}
    </div>
  );
}

function TimelineEventBox(props: {
  readonly laid: LaidOutEvent;
  readonly rowStart: Date;
  readonly rowHeight: number;
}): ReactNode {
  const { laid, rowStart, rowHeight } = props;
  const ctx = useScheduler();
  const isSelected =
    ctx.state.selection.kind === "event" && ctx.state.selection.eventId === laid.event.id;
  const startMinutes = differenceInMinutes(rowStart, laid.event.start);
  const endMinutes = differenceInMinutes(rowStart, laid.event.end);
  const left = Math.max(0, startMinutes * ctx.timelinePxPerMinute);
  const width = Math.max(
    ctx.minRenderedMinutes * ctx.timelinePxPerMinute,
    (endMinutes - startMinutes) * ctx.timelinePxPerMinute,
  );
  const laneHeight = rowHeight / laid.clusterColumns;
  const top = laid.column * laneHeight;
  const style: CSSProperties = {
    position: "absolute",
    top: `${String(top)}px`,
    height: `${String(laneHeight - 2)}px`,
    left: `${String(left)}px`,
    width: `${String(width)}px`,
  };
  const render = ctx.renderEvent;
  const content = render ? (
    render({ event: laid.event, laidOut: laid, isSelected, isDragging: false, isResizing: false })
  ) : (
    <div className="kui-scheduler__event-default">
      <div className="kui-scheduler__event-title">{laid.event.title}</div>
    </div>
  );
  return (
    <button
      type="button"
      aria-label={ctx.messages.eventAnnouncement(laid.event)}
      aria-pressed={isSelected}
      className={joinClass(
        "kui-scheduler__event",
        "kui-scheduler__event--timeline",
        isSelected && "kui-scheduler__event--selected",
      )}
      style={style}
      onClick={(e) => {
        ctx.setSelection({ kind: "event", eventId: laid.event.id });
        if (ctx.onEventClick) {
          ctx.onEventClick({ event: laid.event, nativeEvent: e.nativeEvent });
        }
      }}
      onKeyDown={(e) => {
        handleEventKeyDown(e, laid.event, ctx);
      }}
      tabIndex={0}
      data-scheduler-event={laid.event.id}
      data-selected={isSelected ? "" : undefined}
    >
      {content}
    </button>
  );
}

// ─── Compound component ─────────────────────────────────────────

interface SchedulerCompound {
  <TEvent extends SchedulerEvent = SchedulerEvent>(props: SchedulerRootProps<TEvent>): ReactNode;
  readonly displayName?: string;
  readonly Root: typeof SchedulerRoot;
  readonly Toolbar: typeof SchedulerToolbar;
  readonly Views: typeof SchedulerViews;
  readonly DayView: typeof SchedulerDayView;
  readonly WeekView: typeof SchedulerWeekView;
  readonly TimelineView: typeof SchedulerTimelineView;
  readonly EventTemplate: typeof SchedulerEventTemplate;
  readonly TimeAxis: typeof SchedulerTimeAxis;
  readonly ResourceHeader: typeof SchedulerResourceHeader;
  readonly NowIndicator: typeof SchedulerNowIndicator;
}

const SchedulerImpl = SchedulerRoot as unknown as SchedulerCompound & {
  displayName: string;
};
Object.assign(SchedulerImpl, {
  Root: SchedulerRoot,
  Toolbar: SchedulerToolbar,
  Views: SchedulerViews,
  DayView: SchedulerDayView,
  WeekView: SchedulerWeekView,
  TimelineView: SchedulerTimelineView,
  EventTemplate: SchedulerEventTemplate,
  TimeAxis: SchedulerTimeAxis,
  ResourceHeader: SchedulerResourceHeader,
  NowIndicator: SchedulerNowIndicator,
});
SchedulerImpl.displayName = "Scheduler";

export const Scheduler: SchedulerCompound = SchedulerImpl;

// Bare exports for consumers who prefer explicit composition.
export {
  SchedulerRoot,
  SchedulerToolbar,
  SchedulerViews,
  SchedulerDayView,
  SchedulerWeekView,
  SchedulerTimelineView,
  SchedulerEventTemplate,
  SchedulerTimeAxis,
  SchedulerResourceHeader,
  SchedulerNowIndicator,
};

// forwardRef friendly root — some consumers pass refs.
export const SchedulerForwarded = forwardRef<HTMLDivElement, SchedulerRootProps>(
  function SchedulerForwarded(_props, _ref) {
    return SchedulerRoot(_props);
  },
);
