import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import { render, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import {
  DateRangePicker,
  DateRangePickerStartInput,
  DateRangePickerEndInput,
  DateRangePickerClear,
  DateRangePickerTrigger,
  DateRangePickerContent,
  DateRangePickerCalendars,
} from "./date-range-picker";
import type { DateRange } from "@kairoui/utils/date";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldError } from "../field/field-error";

afterEach(cleanup);

function getStartInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector("input[data-kui-part='date-range-picker-start-input']");
  if (!(input instanceof HTMLInputElement)) throw new Error("start input not found");
  return input;
}

function getEndInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector("input[data-kui-part='date-range-picker-end-input']");
  if (!(input instanceof HTMLInputElement)) throw new Error("end input not found");
  return input;
}

function getTrigger(container: HTMLElement): HTMLButtonElement {
  const trigger = container.querySelector("[data-kui-component='DateRangePickerTrigger']");
  if (!(trigger instanceof HTMLButtonElement)) throw new Error("trigger not found");
  return trigger;
}

function isOpen(): boolean {
  return document.body.querySelector("[data-kui-part='date-range-picker-content']") !== null;
}

function getContent(): HTMLElement | null {
  const el = document.body.querySelector("[data-kui-part='date-range-picker-content']");
  return el instanceof HTMLElement ? el : null;
}

function getDayButtons(root: HTMLElement | Document = document): HTMLButtonElement[] {
  return Array.from(
    root.querySelectorAll<HTMLButtonElement>("button[data-kui-component='DateRangeCalendarDay']"),
  );
}

function findDayByLabel(day: number, root: HTMLElement | Document = document): HTMLButtonElement {
  const buttons = getDayButtons(root);
  const match = buttons.find(
    (b) => b.textContent.trim() === String(day) && b.getAttribute("data-outside-month") !== "true",
  );
  if (!match) throw new Error(`day ${String(day)} not found`);
  return match;
}

function Skeleton(props: Parameters<typeof DateRangePicker>[0]) {
  return (
    <DateRangePicker {...props}>
      <DateRangePickerStartInput />
      <DateRangePickerEndInput />
      <DateRangePickerClear />
      <DateRangePickerTrigger />
      <DateRangePickerContent>
        <DateRangePickerCalendars />
      </DateRangePickerContent>
    </DateRangePicker>
  );
}

// ─── Rendering ────────────────────────────────────────────────

describe("DateRangePicker: rendering", () => {
  it("renders root with data-kui-component", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("[data-kui-component='DateRangePicker']")).not.toBeNull();
  });

  it("renders start & end inputs and trigger", () => {
    const { container } = render(<Skeleton />);
    expect(getStartInput(container)).toBeInstanceOf(HTMLInputElement);
    expect(getEndInput(container)).toBeInstanceOf(HTMLInputElement);
    expect(getTrigger(container)).toBeInstanceOf(HTMLButtonElement);
  });

  it("throws when parts are rendered outside DateRangePicker", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<DateRangePickerStartInput />)).toThrow(/within <DateRangePicker>/);
    spy.mockRestore();
  });

  it("exposes state via data-state", () => {
    const { container } = render(<Skeleton />);
    const root = container.querySelector("[data-kui-component='DateRangePicker']");
    expect(root?.getAttribute("data-state")).toBe("closed");
  });
});

// ─── Controlled value ────────────────────────────────────────────

describe("DateRangePicker: controlled value", () => {
  it("shows the controlled range in the two inputs", () => {
    const start = new Date(2024, 0, 5);
    const end = new Date(2024, 0, 10);
    const { container } = render(
      <Skeleton value={{ start, end }} onValueChange={() => undefined} locale="en-US" />,
    );
    expect(getStartInput(container).value).not.toBe("");
    expect(getEndInput(container).value).not.toBe("");
  });

  it("uses defaultValue in uncontrolled mode", () => {
    const start = new Date(2024, 1, 2);
    const end = new Date(2024, 1, 8);
    const { container } = render(<Skeleton defaultValue={{ start, end }} locale="en-US" />);
    expect(getStartInput(container).value).not.toBe("");
    expect(getEndInput(container).value).not.toBe("");
  });

  it("fires onValueChange with normalized range when a full range is committed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Skeleton defaultOpen onValueChange={onValueChange} locale="en-US" weekStartsOn={0} />,
    );
    // Pick start = 5, end = 10 on the first visible month
    await user.click(findDayByLabel(5, getContent() ?? container));
    await user.click(findDayByLabel(10, getContent() ?? container));
    // Two calls: one for start, one for end
    expect(onValueChange).toHaveBeenCalled();
    const last = onValueChange.mock.calls.at(-1)?.[0] as DateRange;
    expect(last.start).not.toBeNull();
    expect(last.end).not.toBeNull();
    expect((last.end as Date).getTime()).toBeGreaterThanOrEqual((last.start as Date).getTime());
  });
});

// ─── Open state ────────────────────────────────────────────

describe("DateRangePicker: open state", () => {
  it("is closed by default", () => {
    render(<Skeleton />);
    expect(isOpen()).toBe(false);
  });

  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton />);
    await user.click(getTrigger(container));
    expect(isOpen()).toBe(true);
  });

  it("respects controlled open", () => {
    render(<Skeleton open onOpenChange={() => undefined} />);
    expect(isOpen()).toBe(true);
  });

  it("opens with ArrowDown on start input", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton />);
    const input = getStartInput(container);
    input.focus();
    await user.keyboard("{ArrowDown}");
    expect(isOpen()).toBe(true);
  });

  it("closes with Alt+ArrowUp on start input", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton defaultOpen />);
    const input = getStartInput(container);
    input.focus();
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(isOpen()).toBe(false);
  });

  it("Escape closes the popover", async () => {
    const user = userEvent.setup();
    render(<Skeleton defaultOpen />);
    expect(isOpen()).toBe(true);
    await user.keyboard("{Escape}");
    expect(isOpen()).toBe(false);
  });
});

// ─── Calendar range selection ────────────────────────────────

describe("DateRangePicker: calendar range selection", () => {
  it("first click commits start, second click commits end and closes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Skeleton defaultOpen onValueChange={onValueChange} weekStartsOn={0} />,
    );
    const content = getContent() ?? container;
    await user.click(findDayByLabel(3, content));
    // Still open after first click
    expect(isOpen()).toBe(true);
    await user.click(findDayByLabel(12, content));
    // Closes after end commit
    expect(isOpen()).toBe(false);
    expect(onValueChange).toHaveBeenCalled();
  });

  it("normalizes reversed ranges (end before start)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Skeleton defaultOpen onValueChange={onValueChange} weekStartsOn={0} />,
    );
    const content = getContent() ?? container;
    // Start = 15, then click before start → 5
    await user.click(findDayByLabel(15, content));
    await user.click(findDayByLabel(5, content));
    const last = onValueChange.mock.calls.at(-1)?.[0] as DateRange;
    expect((last.start as Date).getDate()).toBe(5);
    expect((last.end as Date).getDate()).toBe(15);
  });

  it("applies data-range-start and data-range-end attributes", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton defaultOpen weekStartsOn={0} />);
    const content = getContent() ?? container;
    await user.click(findDayByLabel(4, content));
    await user.click(findDayByLabel(9, content));
    // After range close, reopen to inspect
    await user.click(getTrigger(container));
    const dayButtons = getDayButtons(getContent() ?? container);
    const starts = dayButtons.filter((b) => b.getAttribute("data-range-start") === "true");
    const ends = dayButtons.filter((b) => b.getAttribute("data-range-end") === "true");
    expect(starts.length).toBeGreaterThanOrEqual(1);
    expect(ends.length).toBeGreaterThanOrEqual(1);
  });

  it("applies data-in-range to interior cells", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton defaultOpen weekStartsOn={0} />);
    const content = getContent() ?? container;
    await user.click(findDayByLabel(5, content));
    await user.click(findDayByLabel(10, content));
    await user.click(getTrigger(container));
    const dayButtons = getDayButtons(getContent() ?? container);
    const inRange = dayButtons.filter((b) => b.getAttribute("data-in-range") === "true");
    expect(inRange.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── min/max/disabledDate ────────────────────────────────

describe("DateRangePicker: min/max/disabledDate", () => {
  it("disables cells outside min/max", () => {
    const min = new Date();
    min.setDate(min.getDate() + 100);
    const max = new Date();
    max.setDate(max.getDate() + 200);
    render(<Skeleton defaultOpen min={min} max={max} />);
    const disabledCount = getDayButtons().filter((b) => b.disabled).length;
    expect(disabledCount).toBeGreaterThan(0);
  });

  it("respects disabledDate predicate", () => {
    render(<Skeleton defaultOpen disabledDate={(d) => d.getDay() === 0 /* Sunday */} />);
    const disabled = getDayButtons().filter((b) => b.disabled);
    expect(disabled.length).toBeGreaterThan(0);
  });
});

// ─── Clear ────────────────────────────────

describe("DateRangePicker: clear", () => {
  it("renders when a value is set", () => {
    const start = new Date(2024, 0, 5);
    const { container } = render(<Skeleton defaultValue={{ start, end: null }} />);
    expect(container.querySelector("[data-kui-component='DateRangePickerClear']")).not.toBeNull();
  });

  it("does not render when both endpoints are null", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("[data-kui-component='DateRangePickerClear']")).toBeNull();
  });

  it("clears value on click", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState<DateRange>({
        start: new Date(2024, 0, 5),
        end: new Date(2024, 0, 10),
      });
      return <Skeleton value={v} onValueChange={setV} />;
    }
    const { container } = render(<Controlled />);
    const clear = container.querySelector(
      "[data-kui-component='DateRangePickerClear']",
    ) as HTMLButtonElement;
    await user.click(clear);
    expect(getStartInput(container).value).toBe("");
    expect(getEndInput(container).value).toBe("");
  });
});

// ─── Form serialization ────────────────────────────────

describe("DateRangePicker: form serialization", () => {
  it("emits two hidden inputs named `${name}.start` and `${name}.end`", () => {
    const start = new Date(2024, 0, 5);
    const end = new Date(2024, 0, 10);
    const { container } = render(
      <Skeleton value={{ start, end }} onValueChange={() => undefined} name="dates" />,
    );
    const hiddenStart = container.querySelector("input[type='hidden'][name='dates.start']");
    const hiddenEnd = container.querySelector("input[type='hidden'][name='dates.end']");
    expect(hiddenStart).not.toBeNull();
    expect(hiddenEnd).not.toBeNull();
    expect((hiddenStart as HTMLInputElement).value).toBe("2024-01-05");
    expect((hiddenEnd as HTMLInputElement).value).toBe("2024-01-10");
  });

  it("emits no hidden inputs when name is not provided", () => {
    const { container } = render(
      <Skeleton
        value={{ start: new Date(2024, 0, 5), end: new Date(2024, 0, 10) }}
        onValueChange={() => undefined}
      />,
    );
    expect(container.querySelectorAll("input[type='hidden']").length).toBe(0);
  });
});

// ─── Field integration ────────────────────────────────

describe("DateRangePicker: Field integration", () => {
  it("wires aria-labelledby / describedby / errormessage on start input", () => {
    const { container } = render(
      <Field>
        <Label>Trip dates</Label>
        <FieldError>Invalid range</FieldError>
        <Skeleton />
      </Field>,
    );
    const startInput = getStartInput(container);
    expect(startInput.getAttribute("aria-labelledby")).not.toBeNull();
    expect(startInput.getAttribute("aria-errormessage")).not.toBeNull();
  });

  it("does not put aria-errormessage on end input", () => {
    const { container } = render(
      <Field>
        <Label>Trip dates</Label>
        <FieldError>Invalid range</FieldError>
        <Skeleton />
      </Field>,
    );
    const endInput = getEndInput(container);
    expect(endInput.getAttribute("aria-errormessage")).toBeNull();
  });

  it("inherits disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <Label>Trip dates</Label>
        <Skeleton />
      </Field>,
    );
    expect(getStartInput(container).disabled).toBe(true);
    expect(getEndInput(container).disabled).toBe(true);
  });
});

// ─── RTL ────────────────────────────────

describe("DateRangePicker: RTL", () => {
  it("sets dir='rtl' on the root", () => {
    const { container } = render(<Skeleton dir="rtl" />);
    const root = container.querySelector("[data-kui-component='DateRangePicker']");
    expect(root?.getAttribute("dir")).toBe("rtl");
  });
});

// ─── SSR ────────────────────────────────

describe("DateRangePicker: SSR", () => {
  it("renders without throwing on the server", () => {
    const html = renderToString(<Skeleton />);
    expect(html).toContain('data-kui-component="DateRangePicker"');
  });
});

// ─── requireComplete ────────────────────────────────

describe("DateRangePicker: requireComplete", () => {
  it("buffers partial ranges when requireComplete is set", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Skeleton defaultOpen requireComplete onValueChange={onValueChange} weekStartsOn={0} />,
    );
    const content = getContent() ?? container;
    await user.click(findDayByLabel(3, content));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(findDayByLabel(9, content));
    // Only one emission — the complete range
    expect(onValueChange).toHaveBeenCalledTimes(1);
    const arg = onValueChange.mock.calls[0]?.[0] as DateRange;
    expect(arg.start).not.toBeNull();
    expect(arg.end).not.toBeNull();
  });
});

// ─── Live region ────────────────────────────────

describe("DateRangePicker: live region", () => {
  it("renders a polite live region", () => {
    const { container } = render(<Skeleton />);
    const live = container.querySelector("[data-kui-part='date-range-picker-live']");
    expect(live).not.toBeNull();
    expect(live?.getAttribute("aria-live")).toBe("polite");
  });
});
