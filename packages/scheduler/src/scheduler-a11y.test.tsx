import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Scheduler } from "./scheduler";
import type { SchedulerEvent } from "./scheduler-types";

const ANCHOR = new Date(2026, 5, 17, 10, 0, 0);

describe("Scheduler accessibility", () => {
  it("root exposes role=application with aria-roledescription and aria-label fallback", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("aria-roledescription")).toBe("Scheduler");
    expect(root?.getAttribute("aria-label")).toBeTruthy();
  });

  it("toolbar has role=toolbar with an aria-label", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const toolbar = container.querySelector("[role=toolbar]");
    expect(toolbar).not.toBeNull();
    expect(toolbar?.getAttribute("aria-label")).toBeTruthy();
  });

  it("view switcher uses the tablist / tab pattern", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const tablist = container.querySelector("[role=tablist]");
    expect(tablist).not.toBeNull();
    const tabs = container.querySelectorAll("[role=tab]");
    expect(tabs.length).toBe(3);
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("time grid is a role=grid with aria-rowcount / aria-colcount", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const grid = container.querySelector<HTMLElement>("[role=grid]");
    expect(grid).not.toBeNull();
    expect(Number(grid?.getAttribute("aria-rowcount"))).toBeGreaterThan(0);
    expect(Number(grid?.getAttribute("aria-colcount"))).toBeGreaterThan(0);
  });

  it("event buttons carry role=button, aria-label, and aria-pressed", () => {
    const event: SchedulerEvent = {
      id: "a",
      start: new Date(2026, 5, 17, 9, 0),
      end: new Date(2026, 5, 17, 10, 0),
      allDay: false,
      title: "Standup",
    };
    const { container } = render(
      <Scheduler events={[event]} defaultDate={ANCHOR} defaultView="day" />,
    );
    const btn = container.querySelector<HTMLElement>("[data-scheduler-event=a]")!;
    // <button> has an implicit role=button; assert via localName instead.
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("aria-label")).toContain("Standup");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("time-axis labels use role=rowheader", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const rowheaders = container.querySelectorAll("[role=rowheader]");
    expect(rowheaders.length).toBeGreaterThan(0);
  });

  it("day-header cells use role=columnheader", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const cols = container.querySelectorAll("[role=columnheader]");
    expect(cols.length).toBeGreaterThan(0);
  });

  it("announcer region exists and is aria-live=polite", () => {
    const { container } = render(<Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" />);
    const announcer = container.querySelector("[data-scheduler-announcer]");
    expect(announcer?.getAttribute("aria-live")).toBe("polite");
    expect(announcer?.getAttribute("aria-atomic")).toBe("true");
  });

  it("aria-label overrides the default toolbar-based label", () => {
    const { container } = render(
      <Scheduler events={[]} defaultDate={ANCHOR} defaultView="day" aria-label="Team calendar" />,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("aria-label")).toBe("Team calendar");
  });

  it("aria-labelledby is applied without adding a duplicate aria-label", () => {
    const { container } = render(
      <div>
        <h1 id="cal-heading">Team calendar</h1>
        <Scheduler
          events={[]}
          defaultDate={ANCHOR}
          defaultView="day"
          aria-labelledby="cal-heading"
        />
      </div>,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("aria-labelledby")).toBe("cal-heading");
    expect(root?.getAttribute("aria-label")).toBeNull();
  });
});
