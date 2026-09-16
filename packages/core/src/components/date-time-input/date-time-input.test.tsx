import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import { render, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { DateTimeInput } from "./date-time-input";
import type { DateTimeLocal } from "@kairoui/utils/date";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldError } from "../field/field-error";

afterEach(cleanup);

function getDateInput(container: HTMLElement): HTMLInputElement {
  const wrapper = container.querySelector("[data-kui-part='date-time-input-date']");
  const input = wrapper?.querySelector("input[type='text']");
  if (!(input instanceof HTMLInputElement)) throw new Error("date input not found");
  return input;
}

function getTimeInput(container: HTMLElement): HTMLInputElement {
  const wrapper = container.querySelector("[data-kui-part='date-time-input-time']");
  const input = wrapper?.querySelector("input[type='text']");
  if (!(input instanceof HTMLInputElement)) throw new Error("time input not found");
  return input;
}

function getHidden(container: HTMLElement): HTMLInputElement | null {
  const el = container.querySelector("input[type='hidden']");
  return el instanceof HTMLInputElement ? el : null;
}

const SAMPLE: DateTimeLocal = {
  date: { year: 2026, month: 3, day: 5 },
  time: { hour: 14, minute: 30, second: 0, millisecond: 0 },
};

// ─── Rendering ────────────────────────────────────────────

describe("DateTimeInput: rendering", () => {
  it("renders wrapper with data-kui-component", () => {
    const { container } = render(<DateTimeInput locale="en-US" />);
    expect(container.querySelector("[data-kui-component='DateTimeInput']")).not.toBeNull();
  });

  it("renders both a date and a time sub-input", () => {
    const { container } = render(<DateTimeInput locale="en-US" />);
    expect(getDateInput(container)).toBeInstanceOf(HTMLInputElement);
    expect(getTimeInput(container)).toBeInstanceOf(HTMLInputElement);
  });

  it("exposes size via data-size", () => {
    const { container } = render(<DateTimeInput locale="en-US" size="lg" />);
    const root = container.querySelector("[data-kui-component='DateTimeInput']");
    expect(root?.getAttribute("data-size")).toBe("lg");
  });
});

// ─── Controlled ────────────────────────────────────────────

describe("DateTimeInput: controlled value", () => {
  it("displays both parts of a controlled DateTimeLocal", () => {
    const { container } = render(
      <DateTimeInput value={SAMPLE} onValueChange={() => undefined} locale="en-US" />,
    );
    expect(getDateInput(container).value).not.toBe("");
    expect(getTimeInput(container).value).not.toBe("");
  });

  it("uses defaultValue in uncontrolled mode", () => {
    const { container } = render(<DateTimeInput defaultValue={SAMPLE} locale="en-US" />);
    expect(getDateInput(container).value).not.toBe("");
    expect(getTimeInput(container).value).not.toBe("");
  });

  it("keeps a pending date visible in the sub-input when no time is set yet", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DateTimeInput onValueChange={onValueChange} locale="en-US" />);
    const dateInput = getDateInput(container);
    await user.click(dateInput);
    await user.keyboard("03/05/2026");
    dateInput.blur();
    // Composite stays null (still is null) but the pending date is preserved
    // in the sub-input display.
    expect(getDateInput(container).value).not.toBe("");
    // Composite was already null; no onValueChange emission is required.
    const emitted = onValueChange.mock.calls.map((c) => c[0] as DateTimeLocal | null);
    for (const v of emitted) expect(v).toBeNull();
  });

  it("emits a full DateTimeLocal only when both parts are set", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DateTimeInput onValueChange={onValueChange} locale="en-US" hour12={false} />,
    );
    const dateInput = getDateInput(container);
    const timeInput = getTimeInput(container);

    await user.click(dateInput);
    await user.keyboard("03/05/2026");
    dateInput.blur();

    await user.click(timeInput);
    await user.keyboard("14:30");
    timeInput.blur();

    const last = onValueChange.mock.calls.at(-1)?.[0] as DateTimeLocal | null;
    expect(last).not.toBeNull();
    expect(last?.date).toEqual({ year: 2026, month: 3, day: 5 });
    expect(last?.time.hour).toBe(14);
    expect(last?.time.minute).toBe(30);
  });

  it("preserves date part when time is cleared", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState<DateTimeLocal | null>(SAMPLE);
      return <DateTimeInput value={v} onValueChange={setV} locale="en-US" hour12={false} />;
    }
    const { container } = render(<Controlled />);
    const timeInput = getTimeInput(container);
    await user.tripleClick(timeInput);
    await user.keyboard("{Backspace}");
    timeInput.blur();
    // The date input still displays the date part even though composite is null.
    expect(getDateInput(container).value).not.toBe("");
  });
});

// ─── Min / max ────────────────────────────────────────────

describe("DateTimeInput: min/max", () => {
  it("marks the composite invalid when out of range", () => {
    const min: DateTimeLocal = {
      date: { year: 2026, month: 4, day: 1 },
      time: { hour: 0, minute: 0, second: 0, millisecond: 0 },
    };
    const { container } = render(
      <DateTimeInput value={SAMPLE} onValueChange={() => undefined} min={min} locale="en-US" />,
    );
    const root = container.querySelector("[data-kui-component='DateTimeInput']");
    expect(root?.hasAttribute("data-invalid")).toBe(true);
  });

  it("does not mark valid values invalid", () => {
    const min: DateTimeLocal = {
      date: { year: 2026, month: 1, day: 1 },
      time: { hour: 0, minute: 0, second: 0, millisecond: 0 },
    };
    const max: DateTimeLocal = {
      date: { year: 2026, month: 12, day: 31 },
      time: { hour: 23, minute: 59, second: 59, millisecond: 0 },
    };
    const { container } = render(
      <DateTimeInput
        value={SAMPLE}
        onValueChange={() => undefined}
        min={min}
        max={max}
        locale="en-US"
      />,
    );
    const root = container.querySelector("[data-kui-component='DateTimeInput']");
    expect(root?.hasAttribute("data-invalid")).toBe(false);
  });
});

// ─── State flags ────────────────────────────────────────────

describe("DateTimeInput: state flags", () => {
  it("propagates disabled to both sub-inputs", () => {
    const { container } = render(<DateTimeInput disabled locale="en-US" />);
    expect(getDateInput(container).disabled).toBe(true);
    expect(getTimeInput(container).disabled).toBe(true);
  });

  it("propagates readOnly to both sub-inputs", () => {
    const { container } = render(<DateTimeInput readOnly locale="en-US" />);
    expect(getDateInput(container).readOnly).toBe(true);
    expect(getTimeInput(container).readOnly).toBe(true);
  });

  it("propagates required to both sub-inputs", () => {
    const { container } = render(<DateTimeInput required locale="en-US" />);
    expect(getDateInput(container).required).toBe(true);
    expect(getTimeInput(container).required).toBe(true);
  });

  it("exposes invalid via data attribute", () => {
    const { container } = render(<DateTimeInput invalid locale="en-US" />);
    const root = container.querySelector("[data-kui-component='DateTimeInput']");
    expect(root?.hasAttribute("data-invalid")).toBe(true);
  });
});

// ─── Form serialization ────────────────────────────────────────────

describe("DateTimeInput: form serialization", () => {
  it("emits a hidden input with an ISO datetime-local string when name is set", () => {
    const { container } = render(
      <DateTimeInput
        value={SAMPLE}
        onValueChange={() => undefined}
        name="appointment"
        locale="en-US"
      />,
    );
    const hidden = getHidden(container);
    expect(hidden).not.toBeNull();
    expect(hidden?.name).toBe("appointment");
    expect(hidden?.value).toBe("2026-03-05T14:30");
  });

  it("emits empty hidden value when the composite is null", () => {
    const { container } = render(<DateTimeInput name="appointment" locale="en-US" />);
    const hidden = getHidden(container);
    expect(hidden).not.toBeNull();
    expect(hidden?.value).toBe("");
  });

  it("emits no hidden input when name is not provided", () => {
    const { container } = render(
      <DateTimeInput value={SAMPLE} onValueChange={() => undefined} locale="en-US" />,
    );
    expect(getHidden(container)).toBeNull();
  });

  it("does not silently convert to UTC (no Z suffix)", () => {
    const { container } = render(
      <DateTimeInput value={SAMPLE} onValueChange={() => undefined} name="x" locale="en-US" />,
    );
    const hidden = getHidden(container);
    expect(hidden?.value.endsWith("Z")).toBe(false);
    expect(hidden?.value).not.toMatch(/[+-]\d\d:?\d\d$/);
  });
});

// ─── Field integration ────────────────────────────────────────────

describe("DateTimeInput: Field integration", () => {
  it("routes aria-labelledby to the date sub-input", () => {
    const { container } = render(
      <Field>
        <Label>Meeting time</Label>
        <DateTimeInput locale="en-US" />
      </Field>,
    );
    const dateInput = getDateInput(container);
    expect(dateInput.getAttribute("aria-labelledby")).not.toBeNull();
  });

  it("routes aria-errormessage only to the date sub-input", () => {
    const { container } = render(
      <Field>
        <Label>Meeting time</Label>
        <FieldError>Invalid</FieldError>
        <DateTimeInput locale="en-US" />
      </Field>,
    );
    expect(getDateInput(container).getAttribute("aria-errormessage")).not.toBeNull();
    expect(getTimeInput(container).getAttribute("aria-errormessage")).toBeNull();
  });

  it("gives the time sub-input a default aria-label", () => {
    const { container } = render(<DateTimeInput locale="en-US" />);
    expect(getTimeInput(container).getAttribute("aria-label")).toBe("Time");
  });

  it("inherits disabled from Field context", () => {
    const { container } = render(
      <Field disabled>
        <Label>x</Label>
        <DateTimeInput locale="en-US" />
      </Field>,
    );
    expect(getDateInput(container).disabled).toBe(true);
    expect(getTimeInput(container).disabled).toBe(true);
  });
});

// ─── Time granularity passthrough ────────────────────────────────────

describe("DateTimeInput: time granularity", () => {
  it("passes step through to the time sub-input", () => {
    const { container } = render(<DateTimeInput locale="en-US" step={1} />);
    expect(getTimeInput(container).getAttribute("data-step")).toBe("1");
  });

  it("passes hour12=false through to the time sub-input", () => {
    const { container } = render(<DateTimeInput locale="en-US" hour12={false} />);
    const timeWrapper = container.querySelector("[data-kui-part='date-time-input-time']");
    expect(timeWrapper?.getAttribute("data-hour12")).toBe("false");
  });
});

// ─── SSR ────────────────────────────────────────────

describe("DateTimeInput: SSR", () => {
  it("renders without throwing on the server", () => {
    const html = renderToString(<DateTimeInput value={SAMPLE} onValueChange={() => undefined} />);
    expect(html).toContain('data-kui-component="DateTimeInput"');
  });
});
