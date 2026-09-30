import { describe, it, expect, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Scheduler } from "./scheduler";
import type { SchedulerEvent } from "./scheduler-types";

// ─── Fixtures ──────────────────────────────────────────────────────

const ANCHOR = new Date(2026, 5, 17, 10, 0, 0);

function makeEvent(id: string, hour: number, durationHours: number): SchedulerEvent {
  const start = new Date(ANCHOR);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(hour + durationHours, 0, 0, 0);
  return {
    id,
    start,
    end,
    allDay: false,
    title: `Event ${id}`,
  };
}

// ─── Core rendering ───────────────────────────────────────────────

describe("<Scheduler> root", () => {
  it("renders a role=application root with data-view", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-view")).toBe("day");
    expect(root?.getAttribute("aria-roledescription")).toBe("Scheduler");
  });

  it("renders the default toolbar + view when no children are supplied", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    expect(container.querySelector("[data-scheduler-toolbar]")).not.toBeNull();
    expect(container.querySelector("[data-scheduler-views]")).not.toBeNull();
    expect(container.querySelector("[data-scheduler-grid=vertical]")).not.toBeNull();
  });

  it("renders the timeline grid when defaultView=timeline", () => {
    const { container } = render(
      <Scheduler
        events={[]}
        defaultView="timeline"
        defaultDate={ANCHOR}
        resources={[{ id: "r1", label: "Room A" }]}
      />,
    );
    expect(container.querySelector("[data-scheduler-grid=timeline]")).not.toBeNull();
  });

  it("attaches className / style / id / aria-label to the root", () => {
    const { container } = render(
      <Scheduler
        events={[]}
        defaultDate={ANCHOR}
        defaultView="day"
        className="my-cal"
        style={{ height: 300 }}
        id="cal"
        aria-label="Team calendar"
      />,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("id")).toBe("cal");
    expect(root?.getAttribute("aria-label")).toBe("Team calendar");
    expect(root?.className).toContain("my-cal");
    expect(root?.style.height).toBe("300px");
  });

  it("renders a live-polite announcer region", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const announcer = container.querySelector("[data-scheduler-announcer]");
    expect(announcer).not.toBeNull();
    expect(announcer?.getAttribute("aria-live")).toBe("polite");
  });
});

// ─── Toolbar navigation ───────────────────────────────────────────

describe("Toolbar navigation", () => {
  it("advances the anchor date when Next is pressed and fires onDateChange", () => {
    const onDateChange = vi.fn();
    const { container } = render(
      <Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" onDateChange={onDateChange} />,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>("[data-scheduler-next]")!);
    expect(onDateChange).toHaveBeenCalledOnce();
    const nextDate = onDateChange.mock.calls[0]?.[0] as Date;
    // Day view daysInView=1 by default → +1 day.
    expect(nextDate.getDate()).toBe(18);
  });

  it("goes back a period on Previous", () => {
    const onDateChange = vi.fn();
    const { container } = render(
      <Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" onDateChange={onDateChange} />,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>("[data-scheduler-prev]")!);
    expect(onDateChange).toHaveBeenCalledOnce();
    const prev = onDateChange.mock.calls[0]?.[0] as Date;
    expect(prev.getDate()).toBe(16);
  });

  it("changes view via the tab buttons and fires onViewChange", () => {
    const onViewChange = vi.fn();
    const { container } = render(
      <Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" onViewChange={onViewChange} />,
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>('[data-scheduler-view-tab="timeline"]')!,
    );
    expect(onViewChange).toHaveBeenCalledWith("timeline");
  });
});

// ─── Event rendering ──────────────────────────────────────────────

describe("Event rendering", () => {
  it("renders one button per visible timed event", () => {
    const events = [makeEvent("a", 9, 1), makeEvent("b", 14, 2)];
    const { container } = render(
      <Scheduler events={events} defaultDate={ANCHOR} defaultView="day" />,
    );
    const nodes = container.querySelectorAll("[data-scheduler-event]");
    expect(nodes.length).toBe(2);
  });

  it("selects an event on click and applies aria-pressed", () => {
    const events = [makeEvent("a", 9, 1)];
    const { container } = render(
      <Scheduler events={events} defaultDate={ANCHOR} defaultView="day" />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("fires onEventClick with the concrete event", () => {
    const events = [makeEvent("a", 9, 1)];
    const onEventClick = vi.fn();
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        onEventClick={onEventClick}
      />,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!);
    expect(onEventClick).toHaveBeenCalledOnce();
    const call = onEventClick.mock.calls[0]?.[0] as { event: { id: string } };
    expect(call.event.id).toBe("a");
  });

  it("uses the renderEvent prop to render custom event content", () => {
    const events = [makeEvent("a", 9, 1)];
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        renderEvent={({ event }) => <span data-testid="custom">{event.title}!</span>}
      />,
    );
    const custom = container.querySelector("[data-testid=custom]");
    expect(custom?.textContent).toBe("Event a!");
  });
});

// ─── All-day events ───────────────────────────────────────────────

describe("All-day layout", () => {
  const holidayStart = new Date(ANCHOR);
  holidayStart.setHours(0, 0, 0, 0);
  const holidayEnd = new Date(holidayStart);
  holidayEnd.setDate(holidayEnd.getDate() + 1);

  const allDayEvent: SchedulerEvent = {
    id: "holiday",
    start: holidayStart,
    end: holidayEnd,
    allDay: true,
    title: "Off-site",
  };

  it("renders the all-day strip when any all-day event is present", () => {
    const { container } = render(
      <Scheduler events={[allDayEvent]} defaultDate={ANCHOR} defaultView="day" />,
    );
    expect(container.querySelector("[data-scheduler-all-day-strip]")).not.toBeNull();
    expect(container.querySelector("[data-scheduler-all-day-event=holiday]")).not.toBeNull();
  });

  it("hides the strip when showAllDayStrip=false", () => {
    const { container } = render(
      <Scheduler
        events={[allDayEvent]}
        defaultDate={ANCHOR}
        defaultView="day"
        showAllDayStrip={false}
      />,
    );
    expect(container.querySelector("[data-scheduler-all-day-strip]")).toBeNull();
  });
});

// ─── Timeline resources ───────────────────────────────────────────

describe("Timeline view", () => {
  it("renders one row per resource plus the unassigned row when needed", () => {
    const events = [
      { ...makeEvent("a", 9, 1), resourceId: "r1" },
      { ...makeEvent("b", 10, 1), resourceId: "r2" },
      makeEvent("c", 11, 1),
    ];
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="timeline"
        resources={[
          { id: "r1", label: "Room A" },
          { id: "r2", label: "Room B" },
        ]}
      />,
    );
    const rows = container.querySelectorAll("[data-scheduler-timeline-row]");
    expect(rows.length).toBe(3);
  });
});

// ─── Locale / RTL / timezone label ──────────────────────────────

describe("Locale, direction, timezone label", () => {
  it("applies dir=rtl on the root when dir=rtl", () => {
    const { container } = render(
      <Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" dir="rtl" />,
    );
    expect(container.querySelector<HTMLElement>("[role=application]")?.getAttribute("dir")).toBe(
      "rtl",
    );
  });

  it("renders the timezone label next to the toolbar range", () => {
    const { container } = render(
      <Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" timezoneLabel="UTC" />,
    );
    const label = container.querySelector("[data-scheduler-tz]");
    expect(label?.textContent).toContain("UTC");
  });
});

// ─── Range creation via empty slot click ─────────────────────────

describe("Range creation", () => {
  it("fires onCreateRange when an empty slot is clicked", () => {
    const onCreateRange = vi.fn();
    const { container } = render(
      <Scheduler
        events={[]}
        defaultDate={ANCHOR}
        defaultView="day"
        onCreateRange={onCreateRange}
      />,
    );
    const slot = container.querySelector<HTMLDivElement>("[data-scheduler-slot='18']");
    expect(slot).not.toBeNull();
    fireEvent.click(slot!);
    expect(onCreateRange).toHaveBeenCalledOnce();
    const payload = onCreateRange.mock.calls[0]?.[0] as { allDay: boolean; start: Date };
    expect(payload.allDay).toBe(false);
    expect(payload.start.getHours()).toBe(9);
  });
});

// ─── Overflow indicator ──────────────────────────────────────────

describe("Overflow", () => {
  it("renders +N when concurrency exceeds maxEventsPerSlot", () => {
    const events: SchedulerEvent[] = [];
    for (let i = 0; i < 8; i++) {
      events.push(makeEvent(`e${String(i)}`, 9, 1));
    }
    const onOverflowClick = vi.fn();
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        maxEventsPerSlot={3}
        onOverflowClick={onOverflowClick}
      />,
    );
    const overflow = container.querySelector<HTMLButtonElement>("[data-scheduler-overflow]");
    expect(overflow).not.toBeNull();
    expect(overflow?.textContent).toMatch(/\+5/);
    fireEvent.click(overflow!);
    expect(onOverflowClick).toHaveBeenCalledOnce();
  });
});
