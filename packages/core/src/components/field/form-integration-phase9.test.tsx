import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Select, SelectTrigger, SelectContent, SelectItem } from "../select/select";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxItem } from "../combobox/combobox";
import { NumberInput } from "../number-input/number-input";
import { Slider, SliderTrack, SliderRange, SliderThumb } from "../slider/slider";
import { RangeSlider } from "../slider/range-slider";
import { PinInput } from "../pin-input/pin-input";
import { Field } from "../field/field";

afterEach(cleanup);

function getFormData(form: HTMLFormElement): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of new FormData(form).entries()) {
    result[k] = v as string;
  }
  return result;
}

// ─── Select ─────────────────────────────────────────────────────────

describe("Form integration: Select", () => {
  it("submits selected value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Select name="fruit" defaultValue="banana">
            <SelectTrigger placeholder="Pick" />
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectContent>
          </Select>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["fruit"]).toBe("banana");
  });

  it("submits empty when no selection", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Select name="fruit">
            <SelectTrigger placeholder="Pick" />
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectContent>
          </Select>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["fruit"]).toBe("");
  });

  it("excludes disabled select from form", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Select name="fruit" defaultValue="apple" disabled>
            <SelectTrigger placeholder="Pick" />
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectContent>
          </Select>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["fruit"]).toBeUndefined();
  });
});

// ─── Combobox ───────────────────────────────────────────────────────

describe("Form integration: Combobox", () => {
  it("submits selected value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Combobox name="color" defaultValue="blue">
            <ComboboxInput placeholder="Search" />
            <ComboboxContent>
              <ComboboxItem value="red">Red</ComboboxItem>
              <ComboboxItem value="blue">Blue</ComboboxItem>
            </ComboboxContent>
          </Combobox>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["color"]).toBe("blue");
  });

  it("submits empty when no selection", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Combobox name="color">
            <ComboboxInput placeholder="Search" />
            <ComboboxContent>
              <ComboboxItem value="red">Red</ComboboxItem>
            </ComboboxContent>
          </Combobox>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["color"]).toBe("");
  });
});

// ─── NumberInput ────────────────────────────────────────────────────

describe("Form integration: NumberInput", () => {
  it("submits numeric value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <NumberInput name="qty" defaultValue={5} />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["qty"]).toBe("5");
  });

  it("submits empty when no value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <NumberInput name="qty" />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["qty"]).toBe("");
  });

  it("submits updated value after increment", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <NumberInput name="qty" defaultValue={3} step={1} />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    const { container } = render(<Form />);
    await user.click(container.querySelector("[data-kui-component='NumberInputIncrement']")!);
    await user.click(screen.getByText("Go"));
    expect(data["qty"]).toBe("4");
  });
});

// ─── Slider ─────────────────────────────────────────────────────────

describe("Form integration: Slider", () => {
  it("submits slider value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Slider name="volume" defaultValue={75}>
            <SliderTrack>
              <SliderRange />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["volume"]).toBe("75");
  });
});

// ─── RangeSlider ────────────────────────────────────────────────────

describe("Form integration: RangeSlider", () => {
  it("submits both range values", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <RangeSlider name="range" defaultValue={[20, 80]}>
            <SliderTrack>
              <SliderRange />
            </SliderTrack>
            <SliderThumb index={0} />
            <SliderThumb index={1} />
          </RangeSlider>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["range[0]"]).toBe("20");
    expect(data["range[1]"]).toBe("80");
  });
});

// ─── PinInput ───────────────────────────────────────────────────────

describe("Form integration: PinInput", () => {
  it("submits joined pin value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <PinInput name="otp" defaultValue="1234" length={4} />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["otp"]).toBe("1234");
  });

  it("submits partial value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <PinInput name="otp" defaultValue="12" length={4} />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["otp"]).toBe("12");
  });
});

// ─── Combined form ──────────────────────────────────────────────────

describe("Form integration: combined Phase 9 form", () => {
  it("submits all controls together", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function FullForm() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Select name="fruit" defaultValue="apple">
            <SelectTrigger placeholder="Pick" />
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectContent>
          </Select>
          <NumberInput name="qty" defaultValue={10} />
          <Slider name="vol" defaultValue={50}>
            <SliderTrack>
              <SliderRange />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <PinInput name="code" defaultValue="5678" length={4} />
          <button type="submit">Submit</button>
        </form>
      );
    }
    FullForm.displayName = "FullForm";
    render(<FullForm />);
    await user.click(screen.getByText("Submit"));
    expect(data["fruit"]).toBe("apple");
    expect(data["qty"]).toBe("10");
    expect(data["vol"]).toBe("50");
    expect(data["code"]).toBe("5678");
  });
});

// ─── Field disabled isolation ───────────────────────────────────────

describe("Form integration: Field disabled", () => {
  it("disabled Field excludes Select from form", async () => {
    const user = userEvent.setup();
    let data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Field disabled>
            <Select name="fruit" defaultValue="apple">
              <SelectTrigger placeholder="Pick" />
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <NumberInput name="qty" defaultValue={5} />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["fruit"]).toBeUndefined();
    expect(data["qty"]).toBe("5");
  });
});
