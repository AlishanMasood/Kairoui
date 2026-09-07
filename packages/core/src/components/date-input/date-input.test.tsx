import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, useState } from "react";
import { render, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { DateInput } from "./date-input";
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

// ─── Rendering ─────────────────────────────────────────────────────

describe("DateInput: rendering", () => {
  it("renders with data-kui-component", () => {
    const { container } = render(<DateInput locale="en-US" />);
    expect(container.querySelector("[data-kui-component='DateInput']")).not.toBeNull();
  });

  it("renders a text input (not native type=date) with numeric inputMode", () => {
    const { container } = render(<DateInput locale="en-US" />);
    const input = getInput(container);
    expect(input.type).toBe("text");
    expect(input.inputMode).toBe("numeric");
  });

  it("uses locale-derived placeholder when none provided", () => {
    const { container: usContainer } = render(<DateInput locale="en-US" />);
    expect(getInput(usContainer).placeholder).toBe("MM/DD/YYYY");
    cleanup();

    const { container: gbContainer } = render(<DateInput locale="en-GB" />);
    expect(getInput(gbContainer).placeholder).toBe("DD/MM/YYYY");
    cleanup();

    const { container: jpContainer } = render(<DateInput locale="ja-JP" />);
    expect(getInput(jpContainer).placeholder).toBe("YYYY/MM/DD");
  });

  it("respects explicit placeholder", () => {
    const { container } = render(<DateInput placeholder="Select date" />);
    expect(getInput(container).placeholder).toBe("Select date");
  });

  it("applies size data attribute", () => {
    const { container } = render(<DateInput size="lg" />);
    const root = container.querySelector("[data-kui-component='DateInput']");
    expect(root?.getAttribute("data-size")).toBe("lg");
  });
});

// ─── Controlled ────────────────────────────────────────────────────

describe("DateInput: controlled value", () => {
  it("displays a formatted date for the controlled value", () => {
    const { container } = render(<DateInput value={new Date(2026, 2, 5)} locale="en-US" />);
    const input = getInput(container);
    // en-US 2-digit numeric: 03/05/2026
    expect(input.value).toContain("2026");
    expect(input.value).toContain("03");
    expect(input.value).toContain("05");
  });

  it("clears the input when value is null", () => {
    const { container } = render(<DateInput value={null} locale="en-US" />);
    expect(getInput(container).value).toBe("");
  });

  it("responds to controlled value updates", async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [v, setV] = useState<Date | null>(new Date(2026, 0, 1));
      return (
        <>
          <DateInput value={v} onValueChange={setV} locale="en-US" />
          <button
            onClick={() => {
              setV(new Date(2026, 5, 15));
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
    expect(getInput(container).value).toContain("2026");
    await user.click(getByText("set"));
    expect(getInput(container).value).toContain("06");
    await user.click(getByText("clear"));
    expect(getInput(container).value).toBe("");
  });

  it("does not commit while user is typing (focus preserves in-progress text)", async () => {
    const user = userEvent.setup();
    const { container } = render(<DateInput locale="en-US" />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "03/0");
    expect(input.value).toBe("03/0");
  });
});

// ─── Uncontrolled ──────────────────────────────────────────────────

describe("DateInput: uncontrolled", () => {
  it("uses defaultValue on initial render", () => {
    const { container } = render(<DateInput defaultValue={new Date(2026, 5, 15)} locale="en-US" />);
    expect(getInput(container).value).toContain("2026");
  });

  it("updates internal state on parse", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DateInput onValueChange={onValueChange} locale="en-US" />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "03/05/2026");
    await user.tab();
    expect(onValueChange).toHaveBeenCalled();
    const call = onValueChange.mock.calls[onValueChange.mock.calls.length - 1]![0] as Date;
    expect(call.getFullYear()).toBe(2026);
    expect(call.getMonth()).toBe(2);
    expect(call.getDate()).toBe(5);
  });
});

// ─── Parsing ───────────────────────────────────────────────────────

describe("DateInput: parsing", () => {
  it("parses en-US MDY on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DateInput onValueChange={onValueChange} locale="en-US" />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "03/05/2026");
    await user.tab();
    const result = onValueChange.mock.calls[0]![0] as Date;
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(5);
  });

  it("parses en-GB DMY on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DateInput onValueChange={onValueChange} locale="en-GB" />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "05/03/2026");
    await user.tab();
    const result = onValueChange.mock.calls[0]![0] as Date;
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(5);
  });

  it("marks invalid on unparseable input and does not silently reset", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DateInput onValueChange={onValueChange} locale="en-US" />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "abc");
    await user.tab();
    expect(input.value).toBe("abc");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("emits null when input is cleared", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DateInput
        defaultValue={new Date(2026, 0, 1)}
        onValueChange={onValueChange}
        locale="en-US"
      />,
    );
    const input = getInput(container);
    await user.click(input);
    await user.clear(input);
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("commits on Enter and blurs on Escape reverts", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DateInput
        defaultValue={new Date(2026, 0, 1)}
        onValueChange={onValueChange}
        locale="en-US"
      />,
    );
    const input = getInput(container);
    await user.click(input);
    await user.clear(input);
    await user.type(input, "12/25/2026{Enter}");
    const call = onValueChange.mock.calls[onValueChange.mock.calls.length - 1]![0] as Date;
    expect(call.getMonth()).toBe(11);
    expect(call.getDate()).toBe(25);

    // Escape reverts
    await user.click(input);
    await user.clear(input);
    await user.type(input, "wrong");
    expect(input.value).toBe("wrong");
    await user.keyboard("{Escape}");
    expect(input.value).toContain("12");
  });

  it("uses a custom parser when provided", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const customParse = vi.fn(() => ({
      ok: true as const,
      value: { year: 2030, month: 1, day: 1 },
    }));
    const { container } = render(<DateInput onValueChange={onValueChange} parse={customParse} />);
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "anything");
    await user.tab();
    expect(customParse).toHaveBeenCalled();
    const call = onValueChange.mock.calls[0]![0] as Date;
    expect(call.getFullYear()).toBe(2030);
  });

  it("uses a custom formatter when provided", () => {
    const format = vi.fn(() => "custom-2026");
    const { container } = render(<DateInput value={new Date(2026, 5, 15)} format={format} />);
    expect(getInput(container).value).toBe("custom-2026");
  });
});

// ─── Min / Max ─────────────────────────────────────────────────────

describe("DateInput: min/max", () => {
  it("rejects values below min", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DateInput min={new Date(2026, 5, 1)} onValueChange={onValueChange} locale="en-US" />,
    );
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "01/01/2026");
    await user.tab();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("rejects values above max", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DateInput max={new Date(2026, 5, 30)} onValueChange={onValueChange} locale="en-US" />,
    );
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "12/31/2026");
    await user.tab();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("accepts boundary values (inclusive)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DateInput
        min={new Date(2026, 5, 1)}
        max={new Date(2026, 5, 30)}
        onValueChange={onValueChange}
        locale="en-US"
      />,
    );
    const input = getInput(container);
    await user.click(input);
    await user.type(input, "06/30/2026");
    await user.tab();
    expect(onValueChange).toHaveBeenCalled();
  });

  it("exposes min and max as ISO data attributes", () => {
    const { container } = render(
      <DateInput min={new Date(2026, 0, 1)} max={new Date(2026, 11, 31)} />,
    );
    const input = getInput(container);
    expect(input.getAttribute("data-min")).toBe("2026-01-01");
    expect(input.getAttribute("data-max")).toBe("2026-12-31");
  });
});

// ─── State props ───────────────────────────────────────────────────

describe("DateInput: disabled / readOnly / required / invalid", () => {
  it("disabled input rejects interaction", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DateInput disabled onValueChange={onValueChange} />);
    const input = getInput(container);
    expect(input.disabled).toBe(true);
    expect(container.querySelector("[data-disabled]")).not.toBeNull();
    await user.click(input);
    await user.type(input, "01/01/2026");
    expect(input.value).toBe("");
  });

  it("readOnly prevents typing but allows focus", async () => {
    const user = userEvent.setup();
    const { container } = render(<DateInput readOnly defaultValue={new Date(2026, 0, 1)} />);
    const input = getInput(container);
    expect(input.readOnly).toBe(true);
    expect(container.querySelector("[data-readonly]")).not.toBeNull();
    await user.click(input);
    await user.type(input, "05/05/2026");
    // Value stays the original
    expect(input.value).toContain("2026");
    expect(input.value).toContain("01");
  });

  it("required is forwarded to native input", () => {
    const { container } = render(<DateInput required />);
    expect(getInput(container).required).toBe(true);
  });

  it("invalid prop sets aria-invalid and data-invalid", () => {
    const { container } = render(<DateInput invalid />);
    expect(getInput(container).getAttribute("aria-invalid")).toBe("true");
    expect(container.querySelector("[data-invalid]")).not.toBeNull();
  });
});

// ─── Clearable ─────────────────────────────────────────────────────

describe("DateInput: clearable", () => {
  it("renders a clear button when clearable + has value", () => {
    const { container } = render(<DateInput clearable defaultValue={new Date(2026, 0, 1)} />);
    expect(container.querySelector("button[aria-label='Clear date']")).not.toBeNull();
  });

  it("hides the clear button when value is empty", () => {
    const { container } = render(<DateInput clearable />);
    expect(container.querySelector("button[aria-label='Clear date']")).toBeNull();
  });

  it("clears value on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DateInput clearable defaultValue={new Date(2026, 0, 1)} onValueChange={onValueChange} />,
    );
    const clearButton = container.querySelector("button[aria-label='Clear date']");
    expect(clearButton).not.toBeNull();
    await user.click(clearButton as Element);
    expect(getInput(container).value).toBe("");
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it("does not render clear button when disabled", () => {
    const { container } = render(
      <DateInput clearable disabled defaultValue={new Date(2026, 0, 1)} />,
    );
    expect(container.querySelector("button[aria-label='Clear date']")).toBeNull();
  });
});

// ─── Field integration ────────────────────────────────────────────

describe("DateInput: Field integration", () => {
  it("inherits disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <Label>Birthdate</Label>
        <DateInput />
      </Field>,
    );
    expect(getInput(container).disabled).toBe(true);
  });

  it("inherits required from Field", () => {
    const { container } = render(
      <Field required>
        <Label>Birthdate</Label>
        <DateInput />
      </Field>,
    );
    expect(getInput(container).required).toBe(true);
  });

  it("wires aria-describedby to FieldDescription", () => {
    const { container } = render(
      <Field>
        <Label>Birthdate</Label>
        <DateInput />
        <FieldDescription>MM/DD/YYYY format</FieldDescription>
      </Field>,
    );
    expect(getInput(container).getAttribute("aria-describedby")).toBeTruthy();
  });

  it("wires aria-errormessage to FieldError when invalid", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Label>Birthdate</Label>
        <DateInput />
        <FieldError>Required</FieldError>
      </Field>,
    );
    expect(getInput(container).getAttribute("aria-errormessage")).toBeTruthy();
    expect(getInput(container).getAttribute("aria-invalid")).toBe("true");
  });
});

// ─── Form participation ──────────────────────────────────────────

describe("DateInput: native form participation", () => {
  it("emits a hidden input with the ISO value under name", () => {
    const { container } = render(<DateInput name="dob" defaultValue={new Date(2026, 2, 5)} />);
    const hidden = getHidden(container);
    expect(hidden).not.toBeNull();
    expect(hidden!.name).toBe("dob");
    expect(hidden!.value).toBe("2026-03-05");
  });

  it("hidden input is empty when value is null", () => {
    const { container } = render(<DateInput name="dob" />);
    expect(getHidden(container)!.value).toBe("");
  });

  it("does not emit a hidden input when name is absent", () => {
    const { container } = render(<DateInput defaultValue={new Date(2026, 0, 1)} />);
    expect(getHidden(container)).toBeNull();
  });

  it("submits via native <form>", () => {
    const onSubmit = vi.fn((e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      expect(data.get("dob")).toBe("2026-03-05");
    });
    const { container } = render(
      <form onSubmit={onSubmit}>
        <DateInput name="dob" defaultValue={new Date(2026, 2, 5)} />
        <button type="submit">Submit</button>
      </form>,
    );
    (container.querySelector("button[type='submit']") as HTMLButtonElement).click();
    expect(onSubmit).toHaveBeenCalled();
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────

describe("DateInput: ref forwarding", () => {
  it("forwards ref to the text input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<DateInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe("text");
  });
});

// ─── Accessibility ─────────────────────────────────────────────

describe("DateInput: accessibility", () => {
  it("uses aria-label when provided standalone", () => {
    const { container } = render(<DateInput aria-label="Start date" />);
    expect(getInput(container).getAttribute("aria-label")).toBe("Start date");
  });

  it("uses aria-labelledby when provided", () => {
    const { container } = render(
      <>
        <span id="lbl">Date</span>
        <DateInput aria-labelledby="lbl" />
      </>,
    );
    expect(getInput(container).getAttribute("aria-labelledby")).toBe("lbl");
  });
});

// ─── SSR / Hydration ────────────────────────────────────────────

describe("DateInput: SSR & hydration", () => {
  it("renders to a string without throwing", () => {
    const html = renderToString(<DateInput locale="en-US" />);
    expect(html).toContain('data-kui-component="DateInput"');
    expect(html).toContain('type="text"');
  });

  it("renders a value in SSR consistently", () => {
    const html = renderToString(
      <DateInput value={new Date(2026, 2, 5)} locale="en-US" name="dob" />,
    );
    expect(html).toContain("2026");
    expect(html).toContain('name="dob"');
    expect(html).toContain("2026-03-05");
  });
});
