import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Scheduler } from "./scheduler";
import type { SchedulerEvent } from "./scheduler-types";

const ANCHOR = new Date(2026, 5, 17, 10, 0, 0);

function makeManyEvents(count: number): SchedulerEvent[] {
  const events: SchedulerEvent[] = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(ANCHOR);
    start.setHours(8 + (i % 10), (i % 4) * 15, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    events.push({
      id: `e${String(i)}`,
      start,
      end,
      allDay: false,
      title: `Event ${String(i)}`,
    });
  }
  return events;
}

describe("Scheduler performance", () => {
  it("renders 200 events in the day view under a generous budget", () => {
    const events = makeManyEvents(200);
    const t0 = performance.now();
    const { container } = render(
      <Scheduler events={events} defaultDate={ANCHOR} defaultView="day" maxEventsPerSlot={6} />,
    );
    const t1 = performance.now();
    // Rendered event nodes should be at most maxEventsPerSlot per cluster.
    const nodes = container.querySelectorAll("[data-scheduler-event]");
    expect(nodes.length).toBeGreaterThan(0);
    // Generous budget; the layout pipeline is O(n log n) with a small
    // constant. Adjust upward if runners get slower — the goal is to
    // catch accidental O(n^2) regressions, not to lock a wall-clock.
    expect(t1 - t0).toBeLessThan(5000);
  });

  it("renders a week with 500 timed events without throwing", () => {
    const events = makeManyEvents(500);
    const { container } = render(
      <Scheduler events={events} defaultDate={ANCHOR} defaultView="week" maxEventsPerSlot={4} />,
    );
    expect(container.querySelector("[data-scheduler-grid=vertical]")).not.toBeNull();
  });

  it("renders 50 resources in the timeline view", () => {
    const resources = Array.from({ length: 50 }, (_v, i) => ({
      id: `r${String(i)}`,
      label: `Resource ${String(i)}`,
    }));
    const { container } = render(
      <Scheduler events={[]} defaultDate={ANCHOR} defaultView="timeline" resources={resources} />,
    );
    const rows = container.querySelectorAll("[data-scheduler-timeline-row]");
    expect(rows.length).toBe(50);
  });
});
