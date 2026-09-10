import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, useState } from "react";
import { render, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import {
  DatePicker,
  DatePickerInput,
  DatePickerClear,
  DatePickerTrigger,
  DatePickerContent,
  DatePickerCalendar,
} from "./date-picker";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldError } from "../field/field-error";

afterEach(cleanup);

function getInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector("input[type='text']");
  if (!(input instanceof HTMLInputElement)) throw new Error("input not found");
  return input;
}

function getTrigger(container: HTMLElement): HTMLButtonElement {
  const trigger = container.querySelector("[data-kui-component='DatePickerTrigger']");
  if (!(trigger instanceof HTMLButtonElement)) throw new Error("trigger not found");
  return trigger;
}

function getHidden(container: HTMLElement): HTMLInputElement | null {
  const el = container.querySelector("input[type='hidden']");
  return el instanceof HTMLInputElement ? el : null;
}

function isPopoverOpen(): boolean {
  return document.body.querySelector("[data-kui-part='date-picker-content']") !== null;
}

function Skeleton(props: Parameters<typeof DatePicker>[0]) {
  return (
    <DatePicker {...props}>
      <DatePickerInput />
      <DatePickerClear />
      <DatePickerTrigger />
      <DatePickerContent>
        <DatePickerCalendar />
      </DatePickerContent>
    </DatePicker>
  );
}

// ─── Rendering ─────────────────────────────────────────────────────

describe("DatePicker: rendering", () => {
  it("renders the root with data-kui-component", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("[data-kui-component='DatePicker']")).not.toBeNull();
  });

  it("renders the input and trigger", () => {
    const { container } = render(<Skeleton />);
    expect(getInput(container)).toBeInstanceOf(HTMLInputElement);
    expect(getTrigger(container)).toBeInstanceOf(HTMLButtonElement);
  });

  it("throws when parts are rendered outside DatePicker", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<DatePickerInput />)).toThrow(/within <DatePicker>/);
    spy.mockRestore();
  });

  it("exposes state via data-state", () => {
    const { container } = render(<Skeleton />);
    const root = container.querySelector("[data-kui-component='DatePicker']");
    expect(root?.getAttribute("data-state")).toBe("closed");
  });
});

// ─── Controlled / uncontrolled value ───────────────────────────────

describe("DatePicker: controlled value", () => {
  it("shows the controlled value in the input", () => {
    const { container } = render(
      <Skeleton value={new Date(2026, 2, 5)} onValueChange={() => undefined} locale="en-US" />,
    );
    expect(getInput(container).value).toContain("2026");
  });

  it("updates when the parent re-renders with a new value", async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [v, setV] = useState<Date | null>(new Date(2026, 0, 1));
      return (
        <>
          <Skeleton value={v} onValueChange={setV} locale="en-US" />
          <button
            onClick={() => {
              setV(new Date(2026, 5, 15));
            }}
          >
            set
          </button>
        </>
      );
    }
    const { container, getByText } = render(<Wrapper />);
    await user.click(getByText("set"));
    expect(getInput(container).value).toContain("06");
  });

  it("uses defaultValue in uncontrolled mode", () => {
    const { container } = render(<Skeleton defaultValue={new Date(2026, 5, 15)} locale="en-US" />);
    expect(getInput(container).value).toContain("2026");
  });
});

// ─── Controlled / uncontrolled open ────────────────────────────────

describe("DatePicker: open state", () => {
  it("is closed by default", () => {
    render(<Skeleton />);
    expect(isPopoverOpen()).toBe(false);
  });

  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton />);
    await user.click(getTrigger(container));
    expect(isPopoverOpen()).toBe(true);
  });

  it("respects controlled open", () => {
    const { rerender } = render(<Skeleton open={false} onOpenChange={() => undefined} />);
    expect(isPopoverOpen()).toBe(false);
    rerender(<Skeleton open onOpenChange={() => undefined} />);
    expect(isPopoverOpen()).toBe(true);
  });

  it("fires onOpenChange when trigger toggles", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(<Skeleton onOpenChange={onOpenChange} />);
    await user.click(getTrigger(container));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("DatePicker: keyboard", () => {
  it("opens with ArrowDown on the input", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton />);
    await user.click(getInput(container));
    await user.keyboard("{ArrowDown}");
    expect(isPopoverOpen()).toBe(true);
  });

  it("closes with Alt+ArrowUp on the input", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton defaultOpen />);
    await user.click(getInput(container));
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(isPopoverOpen()).toBe(false);
  });

  it("Escape closes the popover", async () => {
    const user = userEvent.setup();
    render(<Skeleton defaultOpen />);
    expect(isPopoverOpen()).toBe(true);
    await user.keyboard("{Escape}");
    expect(isPopoverOpen()).toBe(false);
  });
});

// ─── Manual text input ─────────────────────────────────────────────

describe("DatePicker: manual text input", () => {
  it("commits typed date on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<Skeleton locale="en-US" onValueChange={onValueChange} />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "03/05/2026");
    await user.tab();
    const call = onValueChange.mock.calls[0]![0] as Date;
    expect(call.getFullYear()).toBe(2026);
    expect(call.getMonth()).toBe(2);
    expect(call.getDate()).toBe(5);
  });

  it("does not open the popover on typed commit", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton locale="en-US" />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "03/05/2026");
    await user.tab();
    expect(isPopoverOpen()).toBe(false);
  });

  it("marks invalid input with aria-invalid", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton locale="en-US" />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "not-a-date");
    await user.tab();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});

// ─── Calendar selection ────────────────────────────────────────────

describe("DatePicker: calendar selection", () => {
  it("clicking a day selects and closes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Skeleton
        defaultValue={new Date(2026, 5, 1)}
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
      />,
    );
    const trigger = getTrigger(document.body);
    await user.click(trigger);
    const cell = document.body.querySelector("[role='gridcell']:not([aria-disabled='true'])");
    expect(cell).not.toBeNull();
    await user.click(cell as HTMLElement);
    expect(onValueChange).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

// ─── Min / Max / disabledDate ──────────────────────────────────────

describe("DatePicker: min/max/disabledDate", () => {
  it("rejects typed values below min", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Skeleton min={new Date(2026, 5, 1)} onValueChange={onValueChange} locale="en-US" />,
    );
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "01/01/2026");
    await user.tab();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("passes disabledDate to Calendar", async () => {
    const user = userEvent.setup();
    const disabledDate = (d: Date) => d.getDay() === 0; // disable Sundays
    render(<Skeleton defaultValue={new Date(2026, 5, 15)} disabledDate={disabledDate} />);
    await user.click(getTrigger(document.body));
    // Some cells should be aria-disabled
    const disabledCells = document.body.querySelectorAll('[aria-disabled="true"]');
    expect(disabledCells.length).toBeGreaterThan(0);
  });
});

// ─── Clear ─────────────────────────────────────────────────────────

describe("DatePicker: clear", () => {
  it("renders when a value is set", () => {
    const { container } = render(<Skeleton defaultValue={new Date(2026, 0, 1)} />);
    expect(container.querySelector("[data-kui-component='DatePickerClear']")).not.toBeNull();
  });

  it("does not render when value is null", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("[data-kui-component='DatePickerClear']")).toBeNull();
  });

  it("clears the value on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Skeleton defaultValue={new Date(2026, 0, 1)} onValueChange={onValueChange} />,
    );
    const clear = container.querySelector("[data-kui-component='DatePickerClear']");
    await user.click(clear as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith(null);
  });
});

// ─── State props ────────────────────────────────────────────────────

describe("DatePicker: disabled / readOnly / required / invalid", () => {
  it("disabled propagates to input and trigger", () => {
    const { container } = render(<Skeleton disabled defaultValue={new Date(2026, 0, 1)} />);
    expect(getInput(container).disabled).toBe(true);
    expect(getTrigger(container).disabled).toBe(true);
    expect(container.querySelector("[data-disabled]")).not.toBeNull();
  });

  it("readOnly disables the trigger button", () => {
    const { container } = render(<Skeleton readOnly defaultValue={new Date(2026, 0, 1)} />);
    expect(getTrigger(container).disabled).toBe(true);
    expect(container.querySelector("[data-readonly]")).not.toBeNull();
  });

  it("required is forwarded to the input", () => {
    const { container } = render(<Skeleton required />);
    expect(getInput(container).required).toBe(true);
  });

  it("invalid flag is exposed on data attribute", () => {
    const { container } = render(<Skeleton invalid />);
    expect(container.querySelector("[data-invalid]")).not.toBeNull();
    expect(getInput(container).getAttribute("aria-invalid")).toBe("true");
  });
});

// ─── Field integration ─────────────────────────────────────────────

describe("DatePicker: Field integration", () => {
  it("inherits disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <Label>Date</Label>
        <Skeleton />
      </Field>,
    );
    expect(getInput(container).disabled).toBe(true);
  });

  it("inherits validationState invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Label>Date</Label>
        <Skeleton />
        <FieldError>Required</FieldError>
      </Field>,
    );
    expect(getInput(container).getAttribute("aria-invalid")).toBe("true");
  });
});

// ─── Form participation ────────────────────────────────────────────

describe("DatePicker: form", () => {
  it("emits a hidden input under name", () => {
    const { container } = render(<Skeleton name="dob" defaultValue={new Date(2026, 2, 5)} />);
    const hidden = getHidden(container);
    expect(hidden?.name).toBe("dob");
    expect(hidden?.value).toBe("2026-03-05");
  });

  it("hidden value clears when value is null", () => {
    const { container } = render(<Skeleton name="dob" />);
    expect(getHidden(container)?.value).toBe("");
  });
});

// ─── Ref forwarding ────────────────────────────────────────────────

describe("DatePicker: ref forwarding", () => {
  it("forwards ref to the root div", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <DatePicker ref={ref}>
        <DatePickerInput />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards input ref to the underlying <input>", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <DatePicker>
        <DatePickerInput ref={ref} />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

// ─── Accessibility ─────────────────────────────────────────────────

describe("DatePicker: accessibility", () => {
  it("sets aria-haspopup on input and trigger", () => {
    const { container } = render(<Skeleton />);
    expect(getInput(container).getAttribute("aria-haspopup")).toBe("dialog");
    expect(getTrigger(container).getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("sets aria-expanded on input and trigger", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton />);
    expect(getInput(container).getAttribute("aria-expanded")).toBe("false");
    expect(getTrigger(container).getAttribute("aria-expanded")).toBe("false");
    await user.click(getTrigger(container));
    expect(getInput(container).getAttribute("aria-expanded")).toBe("true");
  });

  it("content uses role=dialog with aria-label", async () => {
    const user = userEvent.setup();
    const { container } = render(<Skeleton />);
    await user.click(getTrigger(container));
    const content = document.body.querySelector("[data-kui-part='date-picker-content']");
    expect(content?.getAttribute("role")).toBe("dialog");
    expect(content?.getAttribute("aria-label")).toBe("Choose date");
  });
});

// ─── SSR / hydration ───────────────────────────────────────────────

describe("DatePicker: SSR", () => {
  it("renders to string closed by default", () => {
    const html = renderToString(<Skeleton />);
    expect(html).toContain('data-kui-component="DatePicker"');
    expect(html).toContain('data-state="closed"');
  });

  it("SSR with a value renders the formatted display and hidden ISO", () => {
    const html = renderToString(
      <Skeleton
        value={new Date(2026, 2, 5)}
        onValueChange={() => undefined}
        name="dob"
        locale="en-US"
      />,
    );
    expect(html).toContain("2026-03-05");
    expect(html).toContain('name="dob"');
  });
});
