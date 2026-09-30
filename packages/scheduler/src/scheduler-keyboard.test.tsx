import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Scheduler } from "./scheduler";
import type { SchedulerEvent } from "./scheduler-types";

const ANCHOR = new Date(2026, 5, 17, 10, 0, 0);

function makeEvent(id: string, hour: number, durationHours: number): SchedulerEvent {
  const start = new Date(ANCHOR);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(hour + durationHours, 0, 0, 0);
  return { id, start, end, allDay: false, title: `Event ${id}` };
}

describe("Scheduler keyboard interactions", () => {
  it("Enter on a focused event fires onEventClick", () => {
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
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onEventClick).toHaveBeenCalledOnce();
  });

  it("F2 on a focused event fires onEventClick", () => {
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
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "F2" });
    expect(onEventClick).toHaveBeenCalledOnce();
  });

  it("Escape on a focused event clears the selection", () => {
    const events = [makeEvent("a", 9, 1)];
    const { container } = render(
      <Scheduler events={events} defaultDate={ANCHOR} defaultView="day" />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(btn, { key: "Escape" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("ArrowDown on a focused event fires onMoveEvent by one slot forward", () => {
    const events = [makeEvent("a", 9, 1)];
    const onMoveEvent = vi.fn();
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        snapDuration={30}
        onMoveEvent={onMoveEvent}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "ArrowDown" });
    expect(onMoveEvent).toHaveBeenCalledOnce();
    const payload = onMoveEvent.mock.calls[0]?.[0] as { start: Date };
    expect(payload.start.getHours()).toBe(9);
    expect(payload.start.getMinutes()).toBe(30);
  });

  it("ArrowUp on a focused event fires onMoveEvent by one slot backward", () => {
    const events = [makeEvent("a", 9, 1)];
    const onMoveEvent = vi.fn();
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        snapDuration={30}
        onMoveEvent={onMoveEvent}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "ArrowUp" });
    const payload = onMoveEvent.mock.calls[0]?.[0] as { start: Date };
    expect(payload.start.getHours()).toBe(8);
    expect(payload.start.getMinutes()).toBe(30);
  });

  it("Shift+ArrowDown fires onResizeEvent with edge=end", () => {
    const events = [makeEvent("a", 9, 1)];
    const onResizeEvent = vi.fn();
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        snapDuration={30}
        onResizeEvent={onResizeEvent}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "ArrowDown", shiftKey: true });
    expect(onResizeEvent).toHaveBeenCalledOnce();
    const payload = onResizeEvent.mock.calls[0]?.[0] as { edge: "start" | "end" };
    expect(payload.edge).toBe("end");
  });

  it("Ctrl+ArrowDown fires onResizeEvent with edge=start", () => {
    // start=9, end=10. Ctrl+ArrowDown shortens by moving start forward.
    const events = [makeEvent("a", 9, 2)];
    const onResizeEvent = vi.fn();
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        snapDuration={30}
        onResizeEvent={onResizeEvent}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "ArrowDown", ctrlKey: true });
    expect(onResizeEvent).toHaveBeenCalledOnce();
    const payload = onResizeEvent.mock.calls[0]?.[0] as { edge: "start" | "end" };
    expect(payload.edge).toBe("start");
  });

  it("Alt+ArrowRight moves the event by a full day", () => {
    const events = [makeEvent("a", 9, 1)];
    const onMoveEvent = vi.fn();
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        onMoveEvent={onMoveEvent}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "ArrowRight", altKey: true });
    const payload = onMoveEvent.mock.calls[0]?.[0] as { start: Date };
    expect(payload.start.getDate()).toBe(events[0]!.start.getDate() + 1);
  });

  it("PageDown navigates to the next view period via onDateChange", () => {
    const onDateChange = vi.fn();
    const events = [makeEvent("a", 9, 1)];
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        onDateChange={onDateChange}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "PageDown" });
    expect(onDateChange).toHaveBeenCalledOnce();
  });

  it("does not fire on unmapped keys", () => {
    const events = [makeEvent("a", 9, 1)];
    const onMoveEvent = vi.fn();
    const onEventClick = vi.fn();
    const { container } = render(
      <Scheduler
        events={events}
        defaultDate={ANCHOR}
        defaultView="day"
        onMoveEvent={onMoveEvent}
        onEventClick={onEventClick}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>("[data-scheduler-event=a]")!;
    fireEvent.keyDown(btn, { key: "z" });
    expect(onMoveEvent).not.toHaveBeenCalled();
    expect(onEventClick).not.toHaveBeenCalled();
  });
});
