import type { Meta, StoryObj } from "@storybook/react";
import { Scheduler } from "@kairoui-pro/scheduler";
import type { SchedulerEvent } from "@kairoui-pro/scheduler";
import { useMemo, useState } from "react";
// eslint-disable-next-line import-x/no-internal-modules
import "@kairoui-pro/scheduler/styles.css";

function anchoredAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function eventAt(id: string, hour: number, durationMinutes: number, title: string): SchedulerEvent {
  const start = anchoredAt(hour);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return { id, start, end, allDay: false, title };
}

const SAMPLE_EVENTS: SchedulerEvent[] = [
  eventAt("standup", 9, 30, "Standup"),
  eventAt("design", 10, 90, "Design review"),
  eventAt("lunch", 12, 60, "Lunch"),
  eventAt("focus", 14, 120, "Focus block"),
  eventAt("1on1", 16, 30, "1:1"),
];

function OneWeek() {
  const [view, setView] = useState<"day" | "week" | "timeline">("week");
  const [date, setDate] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<readonly SchedulerEvent[]>(SAMPLE_EVENTS);
  return (
    <div style={{ height: 640, width: 960 }}>
      <Scheduler
        events={events}
        view={view}
        date={date}
        onViewChange={setView}
        onDateChange={setDate}
        onMoveEvent={({ event, start, end }) => {
          setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end } : e)));
        }}
        onResizeEvent={({ event, start, end }) => {
          setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end } : e)));
        }}
      />
    </div>
  );
}

function CustomRenderer() {
  const events = useMemo(() => SAMPLE_EVENTS, []);
  return (
    <div style={{ height: 640, width: 960 }}>
      <Scheduler
        events={events}
        defaultView="day"
        renderEvent={({ event, isSelected }) => (
          <div style={{ padding: 4 }}>
            <strong>{event.title}</strong>
            <br />
            <small>
              {event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} —{" "}
              {event.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </small>
            {isSelected ? " ★" : null}
          </div>
        )}
      />
    </div>
  );
}

function Timeline() {
  const [events, setEvents] = useState<readonly SchedulerEvent[]>(() =>
    SAMPLE_EVENTS.map((e, i) => ({ ...e, resourceId: `r${String((i % 3) + 1)}` })),
  );
  return (
    <div style={{ height: 640, width: 1024 }}>
      <Scheduler
        events={events}
        defaultView="timeline"
        resources={[
          { id: "r1", label: "Room A" },
          { id: "r2", label: "Room B" },
          { id: "r3", label: "Room C" },
        ]}
        onMoveEvent={({ event, start, end }) => {
          setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end } : e)));
        }}
      />
    </div>
  );
}

function RTL() {
  return (
    <div style={{ height: 640, width: 960 }} dir="rtl">
      <Scheduler
        events={SAMPLE_EVENTS}
        defaultView="week"
        dir="rtl"
        locale="ar"
        timezoneLabel="UTC"
      />
    </div>
  );
}

const meta: Meta<typeof Scheduler> = {
  title: "Pro / Scheduler",
  component: Scheduler,
  parameters: {
    docs: {
      description: {
        component:
          "Enterprise Scheduler with day / week / resource-timeline views, drag-to-reschedule, edge-resize, and overlap-aware event layout. Ships in `@kairoui-pro/scheduler`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Scheduler>;

export const Default: Story = { render: () => <OneWeek /> };
export const CustomEventRenderer: Story = { render: () => <CustomRenderer /> };
export const ResourceTimeline: Story = { render: () => <Timeline /> };
export const RightToLeft: Story = { render: () => <RTL /> };
