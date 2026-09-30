import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Scheduler } from "./scheduler";
import type { SchedulerEvent } from "./scheduler-types";

const ANCHOR = new Date(2026, 5, 17, 10, 0, 0);

describe("Scheduler SSR", () => {
  it("renders to a static string without throwing", () => {
    const html = renderToString(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    expect(html).toContain("kui-scheduler");
    expect(html).toContain('role="application"');
    expect(html).toContain('data-view="day"');
  });

  it("does not render the now-indicator on the server", () => {
    const html = renderToString(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    expect(html).not.toContain("data-scheduler-now-indicator");
  });

  it("renders events during SSR", () => {
    const event: SchedulerEvent = {
      id: "a",
      start: new Date(2026, 5, 17, 9, 0),
      end: new Date(2026, 5, 17, 10, 0),
      allDay: false,
      title: "Standup",
    };
    const html = renderToString(
      <Scheduler events={[event]} defaultDate={ANCHOR} defaultView="day" />,
    );
    expect(html).toContain('data-scheduler-event="a"');
    expect(html).toContain("Standup");
  });

  it("renders the timeline view during SSR", () => {
    const html = renderToString(
      <Scheduler
        events={[]}
        defaultDate={ANCHOR}
        defaultView="timeline"
        resources={[{ id: "r1", label: "Room A" }]}
      />,
    );
    expect(html).toContain('data-scheduler-grid="timeline"');
    expect(html).toContain("Room A");
  });

  it("does not throw when timezoneLabel is provided during SSR", () => {
    const html = renderToString(
      <Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" timezoneLabel="UTC" />,
    );
    expect(html).toContain("UTC");
  });
});
