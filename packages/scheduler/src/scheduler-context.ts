import { createContext, useContext } from "react";
import type {
  Resource,
  SchedulerAllDayRenderer,
  SchedulerEvent,
  SchedulerEventRenderer,
  SchedulerMessages,
  SchedulerSelection,
  SchedulerState,
  SchedulerViewKind,
  WeekStart,
} from "./scheduler-types";
import type { SchedulerKeymap } from "./keymap";

/** Context surface shared by every Scheduler subcomponent. */
export interface SchedulerContextValue<TEvent extends SchedulerEvent = SchedulerEvent> {
  readonly state: SchedulerState;
  readonly events: readonly TEvent[];
  readonly resources: readonly Resource[];

  // ── Config
  readonly daysInView: number;
  readonly slotMinutes: number;
  readonly startHour: number;
  readonly endHour: number;
  readonly pxPerMinute: number;
  readonly timelinePxPerMinute: number;
  readonly showAllDayStrip: boolean;
  readonly maxEventsPerSlot: number;
  readonly minRenderedMinutes: number;
  readonly locale: string;
  readonly weekStartsOn: WeekStart;
  readonly hour12: boolean;
  readonly dir: "ltr" | "rtl";
  readonly timezoneLabel: string | null;
  readonly messages: Required<
    Omit<SchedulerMessages, "overflowLabel" | "viewChangeAnnouncement" | "eventAnnouncement">
  > & {
    readonly overflowLabel: (count: number) => string;
    readonly viewChangeAnnouncement: (view: SchedulerViewKind, rangeLabel: string) => string;
    readonly eventAnnouncement: (event: SchedulerEvent) => string;
  };
  readonly draggable: boolean;
  readonly resizable: boolean | "start" | "end" | "both";
  readonly snapDuration: number;
  readonly dragBoundary: "view" | "day" | "resource" | "none";
  readonly minDuration: number;
  readonly maxDuration: number | null;
  readonly keymap: SchedulerKeymap;
  readonly rootId: string;

  // ── Renderers
  readonly renderEvent: SchedulerEventRenderer<TEvent> | null;
  readonly renderAllDayEvent: SchedulerAllDayRenderer<TEvent> | null;

  // ── Dispatch
  readonly setView: (view: SchedulerViewKind) => void;
  readonly setDate: (date: Date) => void;
  readonly setSelection: (selection: SchedulerSelection) => void;
  readonly registerRenderer: (
    render: SchedulerEventRenderer<TEvent>,
    renderAllDay: SchedulerAllDayRenderer<TEvent> | null,
  ) => () => void;

  // ── Callbacks
  readonly onEventClick:
    | ((payload: {
        readonly event: TEvent;
        readonly nativeEvent: MouseEvent | KeyboardEvent;
      }) => void)
    | null;
  readonly onCreateRange:
    | ((payload: {
        readonly start: Date;
        readonly end: Date;
        readonly resourceId?: string;
        readonly allDay: boolean;
      }) => void)
    | null;
  readonly onMoveEvent:
    | ((payload: {
        readonly event: TEvent;
        readonly start: Date;
        readonly end: Date;
        readonly resourceId?: string;
      }) => void | Promise<void>)
    | null;
  readonly onResizeEvent:
    | ((payload: {
        readonly event: TEvent;
        readonly start: Date;
        readonly end: Date;
        readonly edge: "start" | "end";
      }) => void | Promise<void>)
    | null;
  readonly onOverflowClick: ((events: readonly TEvent[]) => void) | null;

  // ── DOM plumbing
  readonly announce: (message: string) => void;
}

// Cast erases the generic — every consumer of `useScheduler`
// re-casts to their concrete event type. Reference identity is
// preserved so context reads are cheap.
const SchedulerContext = createContext<SchedulerContextValue | null>(null);
SchedulerContext.displayName = "SchedulerContext";

export { SchedulerContext };

/**
 * Read the current Scheduler context. Throws when used outside
 * `<Scheduler>`. Generic parameter selects the event type; the
 * runtime shape is identical.
 */
export function useScheduler<
  TEvent extends SchedulerEvent = SchedulerEvent,
>(): SchedulerContextValue<TEvent> {
  const ctx = useContext(SchedulerContext);
  if (!ctx) {
    throw new Error("useScheduler must be used inside <Scheduler>");
  }
  return ctx as unknown as SchedulerContextValue<TEvent>;
}
