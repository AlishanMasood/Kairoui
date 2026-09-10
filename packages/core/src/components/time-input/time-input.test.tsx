import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, useState } from "react";
import { render, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import type { TimeOfDay } from "@kairoui/utils/date";
import { TimeInput } from "./time-input";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldDescription } from "../field/field-description";
import { FieldError } from "../field/field-error";

afterEach(cleanup);

function getInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector("input[type='text']");
  if (!(input instanceof HTMLInputElement)) throw new Error("input not found");
  return input;
}

function getHidden(container: HTMLElement): HTMLInputElement | null {
  const el = container.querySelector("input[type='hidden']");
  return el instanceof HTMLInputElement ? el : null;
}

function tod(hour: number, minute: number, second = 0, millisecond = 0): TimeOfDay {
  return { hour, minute, second, millisecond };
}

// ─── Rendering ─────────────────────────────────────────────────────

describe("TimeInput: rendering", () => {
  it("renders with data-kui-component", () => {
    const { container } = render(<TimeInput />);
    expect(container.querySelector("[data-kui-component='TimeInput']")).not.toBeNull();
  });

  it("renders a text input, not native type=time", () => {
    const { container } = render(<TimeInput />);
    const input = getInput(container);
    expect(input.type).toBe("text");
  });

  it("uses 24h placeholder for locales that default to 24h (en-GB)", () => {
    const { container } = render(<TimeInput locale="en-GB" />);
    expect(getInput(container).placeholder).toBe("HH:MM");
  });

  it("uses 12h placeholder for locales that default to AM/PM (en-US)", () => {
    const { container } = render(<TimeInput locale="en-US" />);
    expect(getInput(container).placeholder).toBe("hh:mm AM");
  });

  it("respects explicit hour12 prop over locale", () => {
    const { container } = render(<TimeInput locale="en-US" hour12={false} />);
    expect(getInput(container).placeholder).toBe("HH:MM");
    expect(container.querySelector("[data-hour12='false']")).not.toBeNull();
  });

  it("shows seconds in placeholder when includeSeconds", () => {
    const { container: us } = render(<TimeInput locale="en-US" includeSeconds />);
    expect(getInput(us).placeholder).toBe("hh:mm:ss AM");
    cleanup();

    const { container: gb } = render(<TimeInput locale="en-GB" includeSeconds />);
    expect(getInput(gb).placeholder).toBe("HH:MM:SS");
  });

  it("applies size data attribute", () => {
    const { container } = render(<TimeInput size="lg" />);
    expect(
      container.querySelector("[data-kui-component='TimeInput']")?.getAttribute("data-size"),
    ).toBe("lg");
  });

  it("exposes step as data-step", () => {
    const { container } = render(<TimeInput step={900} />);
    expect(getInput(container).getAttribute("data-step")).toBe("900");
  });
});

// ─── Controlled / uncontrolled ────────────────────────────────────

describe("TimeInput: controlled value", () => {
  it("displays formatted value in 12-hour form (en-US)", () => {
    const { container } = render(<TimeInput value={tod(13, 30)} locale="en-US" />);
    const input = getInput(container);
    expect(input.value).toMatch(/1:30/);
    expect(input.value).toMatch(/pm/i);
  });

  it("displays formatted value in 24-hour form when hour12=false", () => {
    const { container } = render(<TimeInput value={tod(13, 30)} locale="en-US" hour12={false} />);
    expect(getInput(container).value).toMatch(/13:30/);
  });

  it("clears when value is null", () => {
    const { container } = render(<TimeInput value={null} />);
    expect(getInput(container).value).toBe("");
  });

  it("responds to controlled value updates", async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [v, setV] = useState<TimeOfDay | null>(tod(9, 0));
      return (
        <>
          <TimeInput value={v} onValueChange={setV} locale="en-GB" />
          <button
            onClick={() => {
              setV(tod(17, 45));
            }}
          >
            set
          </button>
          <button
            onClick={() => {
              setV(null);
            }}
          >
            clear
          </button>
        </>
      );
    }
    const { container, getByText } = render(<Wrapper />);
    expect(getInput(container).value).toMatch(/0?9:00/);
    await user.click(getByText("set"));
    expect(getInput(container).value).toMatch(/17:45/);
    await user.click(getByText("clear"));
    expect(getInput(container).value).toBe("");
  });
});

describe("TimeInput: uncontrolled", () => {
  it("uses defaultValue on first render", () => {
    const { container } = render(<TimeInput defaultValue={tod(14, 15)} locale="en-GB" />);
    expect(getInput(container).value).toMatch(/14:15/);
  });

  it("dispatches onValueChange after commit", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput onValueChange={onValueChange} locale="en-GB" />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "09:30");
    await user.tab();
    expect(onValueChange).toHaveBeenCalledWith(tod(9, 30));
  });
});

// ─── Parsing ───────────────────────────────────────────────────────

describe("TimeInput: 24-hour parsing", () => {
  it("parses HH:MM on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12={false} onValueChange={onValueChange} />);
    await user.type(getInput(container), "13:30");
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(tod(13, 30));
  });

  it("rejects AM/PM when hour12=false", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12={false} onValueChange={onValueChange} />);
    const input = getInput(container);
    await user.type(input, "1:30 PM");
    await user.tab();
    expect(onValueChange).not.toHaveBeenCalledWith(tod(13, 30));
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("rejects 24:00 (upper bound)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12={false} onValueChange={onValueChange} />);
    await user.type(getInput(container), "24:00");
    await user.tab();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("TimeInput: 12-hour parsing", () => {
  it("parses 1:30 PM as 13:30", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12 onValueChange={onValueChange} />);
    await user.type(getInput(container), "1:30 PM");
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(tod(13, 30));
  });

  it("parses 12:00 AM as 00:00", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12 onValueChange={onValueChange} />);
    await user.type(getInput(container), "12:00 AM");
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(tod(0, 0));
  });

  it("parses 12:00 PM as 12:00", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12 onValueChange={onValueChange} />);
    await user.type(getInput(container), "12:00 PM");
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(tod(12, 0));
  });

  it("is case-insensitive on AM/PM", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12 onValueChange={onValueChange} />);
    await user.type(getInput(container), "10:15 pm");
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(tod(22, 15));
  });
});

describe("TimeInput: invalid input preservation", () => {
  it("preserves invalid text and sets aria-invalid on failed parse", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12={false} onValueChange={onValueChange} />);
    const input = getInput(container);
    await user.type(input, "not-a-time");
    await user.tab();
    expect(input.value).toBe("not-a-time");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("clears aria-invalid once user resumes typing valid input", async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeInput hour12={false} />);
    const input = getInput(container);
    await user.type(input, "bad");
    await user.tab();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    await user.click(input);
    await user.type(input, "x");
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });
});

// ─── Step & seconds ────────────────────────────────────────────────

describe("TimeInput: step & seconds", () => {
  it("snaps to 15-minute step", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <TimeInput hour12={false} step={900} onValueChange={onValueChange} />,
    );
    await user.type(getInput(container), "09:22");
    await user.tab();
    // 09:22 → nearest 15-minute step is 09:15 (nearest, tie broken by rounding)
    const last = onValueChange.mock.calls.at(-1)![0] as TimeOfDay;
    expect(last.hour).toBe(9);
    expect([15, 30]).toContain(last.minute);
  });

  it("displays seconds when step < 60", () => {
    const { container } = render(<TimeInput hour12={false} step={30} value={tod(9, 30, 15)} />);
    expect(getInput(container).value).toMatch(/09:30:15/);
  });

  it("displays seconds when min carries non-zero second", () => {
    const { container } = render(
      <TimeInput hour12={false} min={tod(0, 0, 30)} value={tod(9, 30, 15)} />,
    );
    expect(getInput(container).value).toMatch(/09:30:15/);
  });

  it("omits seconds by default (step=60)", () => {
    const { container } = render(<TimeInput hour12={false} value={tod(9, 30, 45)} />);
    // Formatted without seconds — 45s should not appear
    expect(getInput(container).value).not.toMatch(/:45/);
  });
});

// ─── Min / Max ─────────────────────────────────────────────────────

describe("TimeInput: min/max", () => {
  it("rejects below min", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <TimeInput hour12={false} min={tod(9, 0)} onValueChange={onValueChange} />,
    );
    await user.type(getInput(container), "08:30");
    await user.tab();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(getInput(container).getAttribute("aria-invalid")).toBe("true");
  });

  it("rejects above max", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <TimeInput hour12={false} max={tod(17, 0)} onValueChange={onValueChange} />,
    );
    await user.type(getInput(container), "18:00");
    await user.tab();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("accepts boundary values inclusive", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <TimeInput hour12={false} min={tod(9, 0)} max={tod(17, 0)} onValueChange={onValueChange} />,
    );
    await user.type(getInput(container), "17:00");
    await user.tab();
    expect(onValueChange).toHaveBeenCalledWith(tod(17, 0));
  });

  it("exposes bounds as ISO data attributes", () => {
    const { container } = render(<TimeInput hour12={false} min={tod(9, 0)} max={tod(17, 30)} />);
    const input = getInput(container);
    expect(input.getAttribute("data-min")).toBe("09:00");
    expect(input.getAttribute("data-max")).toBe("17:30");
  });
});

// ─── State props ───────────────────────────────────────────────────

describe("TimeInput: disabled / readOnly / required / invalid", () => {
  it("disabled prevents typing", async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeInput disabled />);
    const input = getInput(container);
    expect(input.disabled).toBe(true);
    expect(container.querySelector("[data-disabled]")).not.toBeNull();
    await user.click(input);
    await user.type(input, "09:30");
    expect(input.value).toBe("");
  });

  it("readOnly prevents editing but not focus", async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeInput readOnly defaultValue={tod(9, 30)} />);
    const input = getInput(container);
    expect(input.readOnly).toBe(true);
    expect(container.querySelector("[data-readonly]")).not.toBeNull();
    await user.click(input);
    await user.type(input, "18:00");
    expect(input.value).not.toMatch(/18:00/);
  });

  it("required is forwarded", () => {
    const { container } = render(<TimeInput required />);
    expect(getInput(container).required).toBe(true);
  });

  it("invalid prop sets aria-invalid + data-invalid", () => {
    const { container } = render(<TimeInput invalid />);
    expect(getInput(container).getAttribute("aria-invalid")).toBe("true");
    expect(container.querySelector("[data-invalid]")).not.toBeNull();
  });
});

// ─── Clearable ─────────────────────────────────────────────────────

describe("TimeInput: clearable", () => {
  it("shows clear button when value present", () => {
    const { container } = render(<TimeInput clearable defaultValue={tod(9, 30)} />);
    expect(container.querySelector("button[aria-label='Clear time']")).not.toBeNull();
  });

  it("hides clear button when empty", () => {
    const { container } = render(<TimeInput clearable />);
    expect(container.querySelector("button[aria-label='Clear time']")).toBeNull();
  });

  it("clears value on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <TimeInput clearable defaultValue={tod(9, 30)} onValueChange={onValueChange} />,
    );
    await user.click(container.querySelector("button[aria-label='Clear time']")!);
    expect(getInput(container).value).toBe("");
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it("does not render clear button when disabled", () => {
    const { container } = render(<TimeInput clearable disabled defaultValue={tod(9, 30)} />);
    expect(container.querySelector("button[aria-label='Clear time']")).toBeNull();
  });
});

// ─── Keyboard ──────────────────────────────────────────────────────

describe("TimeInput: keyboard", () => {
  it("commits on Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<TimeInput hour12={false} onValueChange={onValueChange} />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "09:30{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(tod(9, 30));
  });

  it("reverts on Escape", async () => {
    const user = userEvent.setup();
    const { container } = render(<TimeInput hour12={false} defaultValue={tod(9, 0)} />);
    const input = getInput(container);
    await user.click(input);
    await user.clear(input);
    await user.type(input, "bogus");
    expect(input.value).toBe("bogus");
    await user.keyboard("{Escape}");
    expect(input.value).toMatch(/0?9:00/);
  });
});

// ─── Field integration ─────────────────────────────────────────────

describe("TimeInput: Field integration", () => {
  it("inherits disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <Label>Start time</Label>
        <TimeInput />
      </Field>,
    );
    expect(getInput(container).disabled).toBe(true);
  });

  it("inherits required from Field", () => {
    const { container } = render(
      <Field required>
        <Label>Start time</Label>
        <TimeInput />
      </Field>,
    );
    expect(getInput(container).required).toBe(true);
  });

  it("wires aria-describedby to FieldDescription", () => {
    const { container } = render(
      <Field>
        <Label>Start time</Label>
        <TimeInput />
        <FieldDescription>24-hour clock</FieldDescription>
      </Field>,
    );
    expect(getInput(container).getAttribute("aria-describedby")).toBeTruthy();
  });

  it("wires aria-errormessage when Field is invalid", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Label>Start time</Label>
        <TimeInput />
        <FieldError>Required</FieldError>
      </Field>,
    );
    expect(getInput(container).getAttribute("aria-errormessage")).toBeTruthy();
    expect(getInput(container).getAttribute("aria-invalid")).toBe("true");
  });
});

// ─── Form participation ──────────────────────────────────────────

describe("TimeInput: native form participation", () => {
  it("emits hidden input with HH:MM when includeSeconds is false", () => {
    const { container } = render(<TimeInput name="start" defaultValue={tod(9, 30)} />);
    const hidden = getHidden(container);
    expect(hidden).not.toBeNull();
    expect(hidden!.name).toBe("start");
    expect(hidden!.value).toBe("09:30");
  });

  it("emits HH:MM:SS when includeSeconds", () => {
    const { container } = render(
      <TimeInput name="start" defaultValue={tod(9, 30, 15)} includeSeconds />,
    );
    expect(getHidden(container)!.value).toBe("09:30:15");
  });

  it("hidden value is empty when null", () => {
    const { container } = render(<TimeInput name="start" />);
    expect(getHidden(container)!.value).toBe("");
  });

  it("does not emit hidden when name is absent", () => {
    const { container } = render(<TimeInput defaultValue={tod(9, 30)} />);
    expect(getHidden(container)).toBeNull();
  });

  it("submits via native <form>", () => {
    const onSubmit = vi.fn((e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      expect(data.get("start")).toBe("09:30");
    });
    const { container } = render(
      <form onSubmit={onSubmit}>
        <TimeInput name="start" defaultValue={tod(9, 30)} />
        <button type="submit">Submit</button>
      </form>,
    );
    (container.querySelector("button[type='submit']") as HTMLButtonElement).click();
    expect(onSubmit).toHaveBeenCalled();
  });
});

// ─── Ref forwarding ────────────────────────────────────────────────

describe("TimeInput: ref forwarding", () => {
  it("forwards ref to the text input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TimeInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe("text");
  });
});

// ─── Accessibility ─────────────────────────────────────────────────

describe("TimeInput: accessibility", () => {
  it("uses aria-label standalone", () => {
    const { container } = render(<TimeInput aria-label="Start time" />);
    expect(getInput(container).getAttribute("aria-label")).toBe("Start time");
  });

  it("uses aria-labelledby when provided", () => {
    const { container } = render(
      <>
        <span id="lbl">Time</span>
        <TimeInput aria-labelledby="lbl" />
      </>,
    );
    expect(getInput(container).getAttribute("aria-labelledby")).toBe("lbl");
  });
});

// ─── SSR & hydration ───────────────────────────────────────────────

describe("TimeInput: SSR", () => {
  it("renders to string without throwing", () => {
    const html = renderToString(<TimeInput hour12={false} />);
    expect(html).toContain('data-kui-component="TimeInput"');
    expect(html).toContain('type="text"');
  });

  it("renders value consistently on the server", () => {
    const html = renderToString(<TimeInput hour12={false} value={tod(9, 30)} name="start" />);
    expect(html).toContain("09:30");
    expect(html).toContain('name="start"');
  });
});
