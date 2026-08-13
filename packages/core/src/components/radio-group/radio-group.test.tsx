import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { RadioGroup } from "./index";
import type { RadioGroupProps, RadioGroupOrientation } from "./index";
import { Radio } from "../radio/index";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldDescription } from "../field/field-description";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("RadioGroup: rendering", () => {
  it("renders a div with role=radiogroup", () => {
    render(
      <RadioGroup data-testid="rg">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    const el = screen.getByTestId("rg");
    expect(el.tagName).toBe("DIV");
    expect(el.getAttribute("role")).toBe("radiogroup");
  });

  it("has data-kui-component", () => {
    render(
      <RadioGroup data-testid="rg">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("data-kui-component")).toBe("RadioGroup");
  });

  it("has aria-orientation vertical by default", () => {
    render(
      <RadioGroup data-testid="rg">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-orientation")).toBe("vertical");
  });

  it("supports horizontal orientation", () => {
    render(
      <RadioGroup data-testid="rg" orientation="horizontal">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-orientation")).toBe("horizontal");
    expect(screen.getByTestId("rg").getAttribute("data-orientation")).toBe("horizontal");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <RadioGroup ref={ref}>
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("passes className", () => {
    render(
      <RadioGroup data-testid="rg" className="custom">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").className).toContain("custom");
  });
});

// ─── Controlled usage ───────────────────────────────────────────────

describe("RadioGroup: controlled", () => {
  it("selects radio matching value", () => {
    const { container } = render(
      <RadioGroup value="b" onValueChange={() => {}}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
        <Radio value="c">C</Radio>
      </RadioGroup>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    expect(inputs[0]!.checked).toBe(false);
    expect(inputs[1]!.checked).toBe(true);
    expect(inputs[2]!.checked).toBe(false);
  });

  it("calls onValueChange when radio is clicked", async () => {
    const handler = vi.fn();
    function Controlled() {
      const [v, setV] = useState("a");
      return (
        <RadioGroup
          value={v}
          onValueChange={(next) => {
            setV(next);
            handler(next);
          }}
        >
          <Radio value="a">A</Radio>
          <Radio value="b">B</Radio>
        </RadioGroup>
      );
    }
    Controlled.displayName = "Controlled";
    const user = userEvent.setup();
    const { container } = render(<Controlled />);
    await user.click(container.querySelectorAll('input[type="radio"]')[1]!);
    expect(handler).toHaveBeenCalledWith("b");
    expect(container.querySelectorAll('input[type="radio"]')[1]!.checked).toBe(true);
  });
});

// ─── Uncontrolled usage ─────────────────────────────────────────────

describe("RadioGroup: uncontrolled", () => {
  it("starts with defaultValue selected", () => {
    const { container } = render(
      <RadioGroup defaultValue="b">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    expect(container.querySelectorAll('input[type="radio"]')[1]!.checked).toBe(true);
  });

  it("starts with nothing selected when no defaultValue", () => {
    const { container } = render(
      <RadioGroup>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    expect(inputs[0]!.checked).toBe(false);
    expect(inputs[1]!.checked).toBe(false);
  });

  it("updates selection on click", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RadioGroup defaultValue="a">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    await user.click(inputs[1]!);
    expect(inputs[0]!.checked).toBe(false);
    expect(inputs[1]!.checked).toBe(true);
  });
});

// ─── Name propagation ───────────────────────────────────────────────

describe("RadioGroup: name", () => {
  it("propagates name to all radios", () => {
    const { container } = render(
      <RadioGroup name="color">
        <Radio value="red">Red</Radio>
        <Radio value="blue">Blue</Radio>
      </RadioGroup>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    expect(inputs[0]!.getAttribute("name")).toBe("color");
    expect(inputs[1]!.getAttribute("name")).toBe("color");
  });

  it("generates a name when not provided", () => {
    const { container } = render(
      <RadioGroup>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    const name = inputs[0]!.getAttribute("name");
    expect(name).toBeTruthy();
    expect(inputs[1]!.getAttribute("name")).toBe(name);
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("RadioGroup: disabled", () => {
  it("disables all radios", () => {
    const { container } = render(
      <RadioGroup disabled>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    expect(inputs[0]!.disabled).toBe(true);
    expect(inputs[1]!.disabled).toBe(true);
  });

  it("sets aria-disabled on group", () => {
    render(
      <RadioGroup data-testid="rg" disabled>
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-disabled")).toBe("true");
  });

  it("sets data-disabled on group", () => {
    render(
      <RadioGroup data-testid="rg" disabled>
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").hasAttribute("data-disabled")).toBe(true);
  });

  it("does not change value when disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <RadioGroup disabled onValueChange={handler}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    await user.click(container.querySelectorAll('input[type="radio"]')[1]!);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Required ───────────────────────────────────────────────────────

describe("RadioGroup: required", () => {
  it("sets aria-required on group", () => {
    render(
      <RadioGroup data-testid="rg" required>
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-required")).toBe("true");
  });

  it("propagates required to radios", () => {
    const { container } = render(
      <RadioGroup required>
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(container.querySelector('input[type="radio"]')!.required).toBe(true);
  });
});

// ─── Form submission ────────────────────────────────────────────────

describe("RadioGroup: form", () => {
  it("submits selected value", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("size") as string;
          }}
        >
          <RadioGroup name="size" defaultValue="md">
            <Radio value="sm">Small</Radio>
            <Radio value="md">Medium</Radio>
            <Radio value="lg">Large</Radio>
          </RadioGroup>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBe("md");
  });

  it("submits changed value", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("pick") as string;
          }}
        >
          <RadioGroup name="pick" defaultValue="a">
            <Radio value="a">A</Radio>
            <Radio value="b">B</Radio>
          </RadioGroup>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    const { container } = render(<Form />);
    await user.click(container.querySelectorAll('input[type="radio"]')[1]!);
    await user.click(screen.getAllByText("Go")[1]!);
    expect(submitted).toBe("b");
  });
});

// ─── Keyboard navigation ────────────────────────────────────────────

describe("RadioGroup: keyboard", () => {
  it("Space selects focused radio", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RadioGroup defaultValue="a">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    inputs[1]!.focus();
    await user.keyboard(" ");
    expect(inputs[1]!.checked).toBe(true);
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("RadioGroup: Field integration", () => {
  it("gets id from Field", () => {
    render(
      <Field id="plan">
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByTestId("rg").getAttribute("id")).toBe("plan");
  });

  it("gets disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <RadioGroup>
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(container.querySelector('input[type="radio"]')!.disabled).toBe(true);
  });

  it("gets required from Field", () => {
    render(
      <Field required>
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-required")).toBe("true");
  });

  it("gets aria-labelledby from Label", () => {
    render(
      <Field id="plan">
        <Label>Choose plan</Label>
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-labelledby")).toBe("plan-label");
  });

  it("gets aria-describedby from FieldDescription", () => {
    render(
      <Field id="plan">
        <FieldDescription>Select one</FieldDescription>
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-describedby")).toBe("plan-desc");
  });

  it("gets data-invalid from Field", () => {
    render(
      <Field validationState="invalid">
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByTestId("rg").hasAttribute("data-invalid")).toBe(true);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("RadioGroup: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(
      <RadioGroup name="color" defaultValue="red">
        <Radio value="red">Red</Radio>
        <Radio value="blue">Blue</Radio>
      </RadioGroup>,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('data-kui-component="RadioGroup"');
    expect(html).toContain('name="color"');
    expect(html).toContain('value="red"');
    expect(html).toContain('value="blue"');
  });

  it("renders with Field in SSR", () => {
    const html = renderToString(
      <Field id="plan" required>
        <Label>Plan</Label>
        <RadioGroup>
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('id="plan"');
    expect(html).toContain('aria-required="true"');
  });

  it("selected radio is checked in SSR", () => {
    const html = renderToString(
      <RadioGroup defaultValue="b">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>,
    );
    // The B radio should have data-state="checked"
    const bIndex = html.indexOf('value="b"');
    const checkedBefore = html.lastIndexOf('data-state="checked"', bIndex);
    expect(checkedBefore).toBeGreaterThan(-1);
  });
});

// ─── Type inference ─────────────────────────────────────────────────

describe("RadioGroup: types", () => {
  it("RadioGroupOrientation is correct union", () => {
    expectTypeOf<RadioGroupOrientation>().toEqualTypeOf<"horizontal" | "vertical">();
  });

  it("RadioGroupProps has expected properties", () => {
    expectTypeOf<RadioGroupProps>().toHaveProperty("value");
    expectTypeOf<RadioGroupProps>().toHaveProperty("defaultValue");
    expectTypeOf<RadioGroupProps>().toHaveProperty("onValueChange");
    expectTypeOf<RadioGroupProps>().toHaveProperty("name");
    expectTypeOf<RadioGroupProps>().toHaveProperty("disabled");
    expectTypeOf<RadioGroupProps>().toHaveProperty("required");
    expectTypeOf<RadioGroupProps>().toHaveProperty("orientation");
  });
});
