import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../select/select";
import {
  Combobox,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxItem,
} from "../combobox/combobox";
import { NumberInput } from "../number-input/number-input";
import { Slider, SliderTrack, SliderRange, SliderThumb } from "../slider/slider";
import { RangeSlider } from "../slider/range-slider";
import { PinInput } from "../pin-input/pin-input";
import { Toggle } from "../toggle/toggle";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/toggle-group";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldDescription } from "../field/field-description";

afterEach(cleanup);

// ─── Select accessibility ───────────────────────────────────────────

describe("A11y: Select", () => {
  it("trigger has role=combobox", () => {
    render(
      <Select>
        <SelectTrigger data-testid="t" placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("t").getAttribute("role")).toBe("combobox");
  });

  it("trigger has aria-expanded", () => {
    render(
      <Select>
        <SelectTrigger data-testid="t" placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-expanded")).toBe("false");
  });

  it("trigger has aria-haspopup=listbox", () => {
    render(
      <Select>
        <SelectTrigger data-testid="t" placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-haspopup")).toBe("listbox");
  });

  it("content has role=listbox", () => {
    render(
      <Select open>
        <SelectTrigger placeholder="Pick" />
        <SelectContent data-testid="c">
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("c").getAttribute("role")).toBe("listbox");
  });

  it("items have role=option", () => {
    render(
      <Select open>
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a" data-testid="i">
            A
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("i").getAttribute("role")).toBe("option");
  });

  it("selected item has aria-selected=true", () => {
    render(
      <Select open defaultValue="a">
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a" data-testid="i">
            A
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("i").getAttribute("aria-selected")).toBe("true");
  });

  it("disabled item has aria-disabled", () => {
    render(
      <Select open>
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a" disabled data-testid="i">
            A
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("i").getAttribute("aria-disabled")).toBe("true");
  });

  it("group has role=group", () => {
    render(
      <Select open>
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectGroup data-testid="g">
            <SelectLabel>L</SelectLabel>
            <SelectItem value="a">A</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("g").getAttribute("role")).toBe("group");
  });

  it("separator has role=separator", () => {
    render(
      <Select open>
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectSeparator data-testid="s" />
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("s").getAttribute("role")).toBe("separator");
  });

  it("gets aria-labelledby from Field", () => {
    render(
      <Field id="f">
        <Label>Pick</Label>
        <Select>
          <SelectTrigger data-testid="t" placeholder="P" />
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      </Field>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-labelledby")).toBe("f-label");
  });

  it("gets aria-invalid from Field", () => {
    render(
      <Field validationState="invalid">
        <Select>
          <SelectTrigger data-testid="t" placeholder="P" />
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      </Field>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-invalid")).toBe("true");
  });
});

// ─── Combobox accessibility ─────────────────────────────────────────

describe("A11y: Combobox", () => {
  it("input has role=combobox", () => {
    render(
      <Combobox>
        <ComboboxInput data-testid="i" placeholder="S" />
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByTestId("i").getAttribute("role")).toBe("combobox");
  });

  it("input has aria-autocomplete=list", () => {
    render(
      <Combobox>
        <ComboboxInput data-testid="i" placeholder="S" />
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByTestId("i").getAttribute("aria-autocomplete")).toBe("list");
  });

  it("input has aria-expanded", () => {
    render(
      <Combobox>
        <ComboboxInput data-testid="i" placeholder="S" />
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByTestId("i").getAttribute("aria-expanded")).toBe("false");
  });

  it("input has aria-controls", () => {
    render(
      <Combobox>
        <ComboboxInput data-testid="i" placeholder="S" />
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByTestId("i").getAttribute("aria-controls")).toBeTruthy();
  });

  it("listbox has role=listbox when open", () => {
    render(
      <Combobox open>
        <ComboboxInput placeholder="S" />
        <ComboboxContent data-testid="c">
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByTestId("c").getAttribute("role")).toBe("listbox");
  });

  it("items have role=option", () => {
    render(
      <Combobox open>
        <ComboboxInput placeholder="S" />
        <ComboboxContent>
          <ComboboxItem value="a" data-testid="i">
            A
          </ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByTestId("i").getAttribute("role")).toBe("option");
  });

  it("trigger has aria-label", () => {
    render(
      <Combobox>
        <ComboboxInput placeholder="S" />
        <ComboboxTrigger data-testid="t" />
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-label")).toBe("Toggle options");
  });

  it("gets aria-labelledby from Field", () => {
    render(
      <Field id="f">
        <Label>Search</Label>
        <Combobox>
          <ComboboxInput data-testid="i" placeholder="S" />
          <ComboboxContent>
            <ComboboxItem value="a">A</ComboboxItem>
          </ComboboxContent>
        </Combobox>
      </Field>,
    );
    expect(screen.getByTestId("i").getAttribute("aria-labelledby")).toBe("f-label");
  });
});

// ─── NumberInput accessibility ───────────────────────────────────────

describe("A11y: NumberInput", () => {
  it("has role=spinbutton", () => {
    const { container } = render(<NumberInput />);
    expect(container.querySelector('[role="spinbutton"]')).not.toBeNull();
  });

  it("has aria-valuemin/max", () => {
    const { container } = render(<NumberInput min={0} max={100} defaultValue={50} />);
    const input = container.querySelector('[role="spinbutton"]')!;
    expect(input.getAttribute("aria-valuemin")).toBe("0");
    expect(input.getAttribute("aria-valuemax")).toBe("100");
  });

  it("has aria-valuenow", () => {
    const { container } = render(<NumberInput defaultValue={42} />);
    expect(container.querySelector('[role="spinbutton"]')!.getAttribute("aria-valuenow")).toBe(
      "42",
    );
  });

  it("increment button has aria-label", () => {
    const { container } = render(<NumberInput />);
    expect(
      container
        .querySelector("[data-kui-component='NumberInputIncrement']")!
        .getAttribute("aria-label"),
    ).toBe("Increment");
  });

  it("decrement button has aria-label", () => {
    const { container } = render(<NumberInput />);
    expect(
      container
        .querySelector("[data-kui-component='NumberInputDecrement']")!
        .getAttribute("aria-label"),
    ).toBe("Decrement");
  });

  it("gets aria-labelledby from Field", () => {
    const { container } = render(
      <Field id="qty">
        <Label>Quantity</Label>
        <NumberInput />
      </Field>,
    );
    expect(container.querySelector('[role="spinbutton"]')!.getAttribute("aria-labelledby")).toBe(
      "qty-label",
    );
  });

  it("gets aria-describedby from FieldDescription", () => {
    const { container } = render(
      <Field id="qty">
        <FieldDescription>Enter amount</FieldDescription>
        <NumberInput />
      </Field>,
    );
    expect(container.querySelector('[role="spinbutton"]')!.getAttribute("aria-describedby")).toBe(
      "qty-desc",
    );
  });
});

// ─── Slider accessibility ───────────────────────────────────────────

describe("A11y: Slider", () => {
  it("thumb has role=slider", () => {
    render(
      <Slider defaultValue={50}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb data-testid="t" />
      </Slider>,
    );
    expect(screen.getByTestId("t").getAttribute("role")).toBe("slider");
  });

  it("thumb has aria-valuemin/max/now", () => {
    render(
      <Slider defaultValue={50} min={0} max={100}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb data-testid="t" />
      </Slider>,
    );
    const t = screen.getByTestId("t");
    expect(t.getAttribute("aria-valuemin")).toBe("0");
    expect(t.getAttribute("aria-valuemax")).toBe("100");
    expect(t.getAttribute("aria-valuenow")).toBe("50");
  });

  it("thumb has aria-orientation", () => {
    render(
      <Slider defaultValue={50} orientation="vertical">
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb data-testid="t" />
      </Slider>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-orientation")).toBe("vertical");
  });

  it("thumb has aria-valuetext from getValueLabel", () => {
    render(
      <Slider defaultValue={50} getValueLabel={(v) => `${String(v)}%`}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb data-testid="t" />
      </Slider>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-valuetext")).toBe("50%");
  });

  it("disabled thumb has aria-disabled", () => {
    render(
      <Slider defaultValue={50} disabled>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb data-testid="t" />
      </Slider>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-disabled")).toBe("true");
  });

  it("disabled thumb has tabIndex=-1", () => {
    render(
      <Slider defaultValue={50} disabled>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb data-testid="t" />
      </Slider>,
    );
    expect(screen.getByTestId("t").getAttribute("tabindex")).toBe("-1");
  });
});

// ─── RangeSlider accessibility ──────────────────────────────────────

describe("A11y: RangeSlider", () => {
  it("both thumbs have role=slider", () => {
    render(
      <RangeSlider defaultValue={[20, 80]}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb index={0} data-testid="t0" />
        <SliderThumb index={1} data-testid="t1" />
      </RangeSlider>,
    );
    expect(screen.getByTestId("t0").getAttribute("role")).toBe("slider");
    expect(screen.getByTestId("t1").getAttribute("role")).toBe("slider");
  });

  it("thumbs have independent aria-valuenow", () => {
    render(
      <RangeSlider defaultValue={[25, 75]}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb index={0} data-testid="t0" />
        <SliderThumb index={1} data-testid="t1" />
      </RangeSlider>,
    );
    expect(screen.getByTestId("t0").getAttribute("aria-valuenow")).toBe("25");
    expect(screen.getByTestId("t1").getAttribute("aria-valuenow")).toBe("75");
  });

  it("getValueLabel receives index", () => {
    render(
      <RangeSlider defaultValue={[10, 90]} getValueLabel={(v, i) => `T${String(i)}:${String(v)}`}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb index={0} data-testid="t0" />
        <SliderThumb index={1} data-testid="t1" />
      </RangeSlider>,
    );
    expect(screen.getByTestId("t0").getAttribute("aria-valuetext")).toBe("T0:10");
    expect(screen.getByTestId("t1").getAttribute("aria-valuetext")).toBe("T1:90");
  });
});

// ─── PinInput accessibility ─────────────────────────────────────────

describe("A11y: PinInput", () => {
  it("has role=group", () => {
    const { container } = render(<PinInput />);
    expect(container.querySelector('[role="group"]')).not.toBeNull();
  });

  it("fields have aria-label with position", () => {
    const { container } = render(<PinInput length={6} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    expect(fields[0]?.getAttribute("aria-label")).toBe("Digit 1 of 6");
    expect(fields[5]?.getAttribute("aria-label")).toBe("Digit 6 of 6");
  });

  it("first field has autoComplete=one-time-code", () => {
    const { container } = render(<PinInput />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    expect(fields[0]?.getAttribute("autocomplete")).toBe("one-time-code");
  });

  it("gets aria-labelledby from Field", () => {
    const { container } = render(
      <Field id="otp">
        <Label>Verification code</Label>
        <PinInput />
      </Field>,
    );
    expect(container.querySelector('[role="group"]')?.getAttribute("aria-labelledby")).toBe(
      "otp-label",
    );
  });
});

// ─── Toggle accessibility ───────────────────────────────────────────

describe("A11y: Toggle", () => {
  it("has aria-pressed", () => {
    render(<Toggle data-testid="t">B</Toggle>);
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("false");
  });

  it("aria-pressed updates on click", async () => {
    const user = userEvent.setup();
    render(<Toggle data-testid="t">B</Toggle>);
    await user.click(screen.getByTestId("t"));
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("true");
  });

  it("native button element", () => {
    render(<Toggle data-testid="t">B</Toggle>);
    expect(screen.getByTestId("t").tagName).toBe("BUTTON");
    expect(screen.getByTestId("t").getAttribute("type")).toBe("button");
  });
});

// ─── ToggleGroup accessibility ──────────────────────────────────────

describe("A11y: ToggleGroup", () => {
  it("has role=group", () => {
    render(
      <ToggleGroup type="single" data-testid="g">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("g").getAttribute("role")).toBe("group");
  });

  it("has aria-orientation", () => {
    render(
      <ToggleGroup type="single" orientation="vertical" data-testid="g">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("g").getAttribute("aria-orientation")).toBe("vertical");
  });

  it("items have aria-pressed", () => {
    render(
      <ToggleGroup type="single" defaultValue="a">
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" data-testid="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("a").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("b").getAttribute("aria-pressed")).toBe("false");
  });

  it("disabled items have disabled attribute", () => {
    render(
      <ToggleGroup type="single" disabled>
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("a")).toBeDisabled();
  });
});

// ─── SSR accessibility attributes ───────────────────────────────────

describe("A11y: SSR", () => {
  it("Select SSR has combobox role", () => {
    const html = renderToString(
      <Select>
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("NumberInput SSR has spinbutton role", () => {
    const html = renderToString(<NumberInput defaultValue={5} min={0} max={10} />);
    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="10"');
    expect(html).toContain('aria-valuenow="5"');
  });

  it("Slider SSR has slider role", () => {
    const html = renderToString(
      <Slider defaultValue={50}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb />
      </Slider>,
    );
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuenow="50"');
  });

  it("Toggle SSR has aria-pressed", () => {
    const html = renderToString(<Toggle defaultPressed>B</Toggle>);
    expect(html).toContain('aria-pressed="true"');
  });

  it("PinInput SSR has role=group", () => {
    const html = renderToString(<PinInput length={4} />);
    expect(html).toContain('role="group"');
  });
});
