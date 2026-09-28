import { describe, it, expectTypeOf } from "vitest";
import type {
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

describe("SchedulerEvent shape", () => {
  it("requires id, start, end, allDay, title", () => {
    const e: SchedulerEvent = {
      id: "e1",
      start: new Date(),
      end: new Date(),
      allDay: false,
      title: "Meeting",
    };
    expectTypeOf(e).toEqualTypeOf<SchedulerEvent>();
  });

  it("accepts optional resourceId / description / meta", () => {
    const e: SchedulerEvent = {
      id: "e1",
      start: new Date(),
      end: new Date(),
      allDay: false,
      title: "Meeting",
      resourceId: "r1",
      description: "notes",
      meta: { color: "red" },
    };
    expectTypeOf(e.resourceId).toEqualTypeOf<string | undefined>();
    expectTypeOf(e.description).toEqualTypeOf<string | undefined>();
  });
});

describe("Resource shape", () => {
  it("requires id + label", () => {
    const r: Resource = { id: "r1", label: "Room A" };
    expectTypeOf(r).toEqualTypeOf<Resource>();
  });
});

describe("SchedulerViewKind + WeekStart + DragBoundary literal unions", () => {
  it("accepts the three view kinds", () => {
    const v: SchedulerViewKind[] = ["day", "week", "timeline"];
    expectTypeOf(v).toEqualTypeOf<SchedulerViewKind[]>();
  });

  it("accepts 0..6 for WeekStart", () => {
    const w: WeekStart[] = [0, 1, 2, 3, 4, 5, 6];
    expectTypeOf(w).toEqualTypeOf<WeekStart[]>();
  });

  it("accepts view / day / resource / none for DragBoundary", () => {
    const b: DragBoundary[] = ["view", "day", "resource", "none"];
    expectTypeOf(b).toEqualTypeOf<DragBoundary[]>();
  });
});

describe("SchedulerViewProps optional fields", () => {
  it("only requires kind + date", () => {
    const p: SchedulerViewProps = {
      kind: "day",
      date: new Date(),
    };
    expectTypeOf(p).toEqualTypeOf<SchedulerViewProps>();
  });
});

describe("VisibleRange / TimeSlot / VisibleEventBucket / ResourceBucket", () => {
  it("VisibleRange carries start, end, days", () => {
    const r: VisibleRange = {
      start: new Date(),
      end: new Date(),
      days: [new Date()],
    };
    expectTypeOf(r.days).toEqualTypeOf<readonly Date[]>();
  });

  it("TimeSlot carries index + minutes bounds", () => {
    const s: TimeSlot = {
      index: 0,
      startMinutesFromMidnight: 0,
      endMinutesFromMidnight: 30,
    };
    expectTypeOf(s.index).toBeNumber();
  });

  it("VisibleEventBucket splits into timed + allDay", () => {
    const b: VisibleEventBucket = { timed: [], allDay: [] };
    expectTypeOf(b.timed).toEqualTypeOf<readonly SchedulerEvent[]>();
  });

  it("ResourceBucket flags null resource for unassigned events", () => {
    const b: ResourceBucket = { resourceId: null, resource: null, events: [] };
    expectTypeOf(b.resourceId).toEqualTypeOf<string | null>();
    expectTypeOf(b.resource).toEqualTypeOf<Resource | null>();
  });
});

describe("Layout output shapes", () => {
  it("LaidOutEvent carries geometry + cluster info", () => {
    const e: LaidOutEvent = {
      event: {
        id: "e1",
        start: new Date(),
        end: new Date(),
        allDay: false,
        title: "t",
      },
      column: 0,
      clusterColumns: 1,
      startMs: 0,
      endMs: 60_000,
    };
    expectTypeOf(e.clusterColumns).toBeNumber();
  });

  it("EventLayoutResult splits laidOut + overflow", () => {
    const r: EventLayoutResult = { laidOut: [], overflow: [] };
    expectTypeOf(r.laidOut).toEqualTypeOf<readonly LaidOutEvent[]>();
    expectTypeOf(r.overflow).toEqualTypeOf<readonly SchedulerEvent[]>();
  });

  it("AllDayLaneEntry carries lane, startDayIndex, spanDays", () => {
    const a: AllDayLaneEntry = {
      event: {
        id: "e1",
        start: new Date(),
        end: new Date(),
        allDay: true,
        title: "t",
      },
      lane: 0,
      startDayIndex: 0,
      spanDays: 1,
    };
    expectTypeOf(a.spanDays).toBeNumber();
  });

  it("EventLayoutOptions is all-optional", () => {
    const empty: EventLayoutOptions = {};
    expectTypeOf(empty).toEqualTypeOf<EventLayoutOptions>();
    const full: EventLayoutOptions = {
      maxEventsPerSlot: 6,
      minRenderedMinutes: 10,
    };
    expectTypeOf(full.maxEventsPerSlot).toEqualTypeOf<number | undefined>();
  });
});

describe("Generic parameter propagation", () => {
  interface CalendarEvent extends SchedulerEvent {
    readonly color: string;
  }

  it("LaidOutEvent<TEvent> preserves the concrete event type", () => {
    const l: LaidOutEvent<CalendarEvent> = {
      event: {
        id: "e1",
        start: new Date(),
        end: new Date(),
        allDay: false,
        title: "t",
        color: "red",
      },
      column: 0,
      clusterColumns: 1,
      startMs: 0,
      endMs: 0,
    };
    expectTypeOf(l.event.color).toBeString();
  });

  it("EventLayoutResult<TEvent> propagates through overflow", () => {
    const r: EventLayoutResult<CalendarEvent> = { laidOut: [], overflow: [] };
    expectTypeOf(r.overflow).toEqualTypeOf<readonly CalendarEvent[]>();
  });
});
