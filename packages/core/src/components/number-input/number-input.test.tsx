import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { NumberInput } from "./number-input";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldDescription } from "../field/field-description";

afterEach(cleanup);

// ─── Rendering ──────────────────────────────────────────────────────

describe("NumberInput: rendering", () => {
  it("renders with data-kui-component", () => {
    const { container } = render(<NumberInput />);
    expect(container.querySelector("[data-kui-component='NumberInput']")).not.toBeNull();
  });

  it("renders input with role=spinbutton", () => {
    const { container } = render(<NumberInput />);
    expect(container.querySelector('[role="spinbutton"]')).not.toBeNull();
  });

  it("renders increment and decrement buttons", () => {
    const { container } = render(<NumberInput />);
    expect(container.querySelector("[data-kui-component='NumberInputIncrement']")).not.toBeNull();
    expect(container.querySelector("[data-kui-component='NumberInputDecrement']")).not.toBeNull();
  });

  it("shows placeholder", () => {
    const { container } = render(<NumberInput placeholder="0" />);
    expect(container.querySelector("input")!.getAttribute("placeholder")).toBe("0");
  });

  it("has inputMode=decimal", () => {
    const { container } = render(<NumberInput />);
    expect(container.querySelector("input")!.getAttribute("inputmode")).toBe("decimal");
  });
});

// ─── Value ──────────────────────────────────────────────────────────

describe("NumberInput: value", () => {
  it("uncontrolled: starts empty", () => {
    const { container } = render(<NumberInput />);
    expect(container.querySelector("input")!.value).toBe("");
  });

  it("uncontrolled: starts with defaultValue", () => {
    const { container } = render(<NumberInput defaultValue={5} />);
    expect(container.querySelector("input")!.value).toBe("5");
  });

  it("controlled: reflects value prop", () => {
    const { container } = render(<NumberInput value={42} onValueChange={() => {}} />);
    expect(container.querySelector("input")!.value).toBe("42");
  });

  it("calls onValueChange on input", async () => {
    const handler = vi.fn();
    function Controlled() {
      const [v, setV] = useState<number | undefined>(10);
      return (
        <NumberInput
          value={v}
          onValueChange={(n) => {
            setV(n);
            handler(n);
          }}
        />
      );
    }
    Controlled.displayName = "Controlled";
    const user = userEvent.setup();
    const { container } = render(<Controlled />);
    const input = container.querySelector("input")!;
    await user.clear(input);
    await user.type(input, "25");
    expect(handler).toHaveBeenCalledWith(25);
  });

  it("empty input sets undefined", async () => {
    const handler = vi.fn();
    function Ctrl() {
      const [v, setV] = useState<number | undefined>(5);
      return (
        <NumberInput
          value={v}
          onValueChange={(n) => {
            setV(n);
            handler(n);
          }}
        />
      );
    }
    Ctrl.displayName = "Ctrl";
    const user = userEvent.setup();
    const { container } = render(<Ctrl />);
    await user.clear(container.querySelector("input")!);
    expect(handler).toHaveBeenCalledWith(undefined);
  });
});

// ─── Increment/Decrement ────────────────────────────────────────────

describe("NumberInput: increment/decrement", () => {
  it("increment button increases value", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={5} step={1} />);
    await user.click(container.querySelector("[data-kui-component='NumberInputIncrement']")!);
    expect(container.querySelector("input")!.value).toBe("6");
  });

  it("decrement button decreases value", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={5} step={1} />);
    await user.click(container.querySelector("[data-kui-component='NumberInputDecrement']")!);
    expect(container.querySelector("input")!.value).toBe("4");
  });

  it("respects step value", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={0} step={0.5} />);
    await user.click(container.querySelector("[data-kui-component='NumberInputIncrement']")!);
    expect(container.querySelector("input")!.value).toBe("0.5");
  });

  it("increment from empty starts at min or 0", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput min={2} step={1} />);
    await user.click(container.querySelector("[data-kui-component='NumberInputIncrement']")!);
    expect(container.querySelector("input")!.value).toBe("3");
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("NumberInput: keyboard", () => {
  it("ArrowUp increments", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={10} />);
    container.querySelector("input")!.focus();
    await user.keyboard("{ArrowUp}");
    expect(container.querySelector("input")!.value).toBe("11");
  });

  it("ArrowDown decrements", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={10} />);
    container.querySelector("input")!.focus();
    await user.keyboard("{ArrowDown}");
    expect(container.querySelector("input")!.value).toBe("9");
  });
});

// ─── Clamping ───────────────────────────────────────────────────────

describe("NumberInput: clamping", () => {
  it("clamps to max on increment", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={9} max={10} />);
    await user.click(container.querySelector("[data-kui-component='NumberInputIncrement']")!);
    expect(container.querySelector("input")!.value).toBe("10");
    await user.click(container.querySelector("[data-kui-component='NumberInputIncrement']")!);
    expect(container.querySelector("input")!.value).toBe("10");
  });

  it("clamps to min on decrement", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={1} min={0} />);
    await user.click(container.querySelector("[data-kui-component='NumberInputDecrement']")!);
    expect(container.querySelector("input")!.value).toBe("0");
    await user.click(container.querySelector("[data-kui-component='NumberInputDecrement']")!);
    expect(container.querySelector("input")!.value).toBe("0");
  });

  it("increment button disabled at max", () => {
    const { container } = render(<NumberInput defaultValue={10} max={10} />);
    const btn = container.querySelector(
      "[data-kui-component='NumberInputIncrement']",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("decrement button disabled at min", () => {
    const { container } = render(<NumberInput defaultValue={0} min={0} />);
    const btn = container.querySelector(
      "[data-kui-component='NumberInputDecrement']",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("sets aria-valuemin and aria-valuemax", () => {
    const { container } = render(<NumberInput min={0} max={100} defaultValue={50} />);
    const input = container.querySelector("input")!;
    expect(input.getAttribute("aria-valuemin")).toBe("0");
    expect(input.getAttribute("aria-valuemax")).toBe("100");
  });

  it("sets aria-valuenow", () => {
    const { container } = render(<NumberInput defaultValue={42} />);
    expect(container.querySelector("input")!.getAttribute("aria-valuenow")).toBe("42");
  });
});

// ─── Precision ──────────────────────────────────────────────────────

describe("NumberInput: precision", () => {
  it("step=0.1 maintains one decimal", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={0.1} step={0.1} />);
    await user.click(container.querySelector("[data-kui-component='NumberInputIncrement']")!);
    expect(container.querySelector("input")!.value).toBe("0.2");
  });

  it("step=0.01 maintains two decimals", async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberInput defaultValue={1.01} step={0.01} />);
    await user.click(container.querySelector("[data-kui-component='NumberInputIncrement']")!);
    expect(container.querySelector("input")!.value).toBe("1.02");
  });
});

// ─── Disabled/ReadOnly ──────────────────────────────────────────────

describe("NumberInput: disabled", () => {
  it("disables input", () => {
    const { container } = render(<NumberInput disabled />);
    expect(container.querySelector("input")!.disabled).toBe(true);
  });

  it("disables buttons", () => {
    const { container } = render(<NumberInput disabled />);
    const btns = container.querySelectorAll("button");
    btns.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });

  it("readOnly disables buttons but not input", () => {
    const { container } = render(<NumberInput readOnly defaultValue={5} />);
    expect(container.querySelector("input")!).toHaveAttribute("readonly");
    const btns = container.querySelectorAll("button");
    btns.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("NumberInput: form", () => {
  it("submits value with form", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("qty") as string;
          }}
        >
          <NumberInput name="qty" defaultValue={3} />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBe("3");
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("NumberInput: Field", () => {
  it("gets disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <NumberInput />
      </Field>,
    );
    expect(container.querySelector("input")!.disabled).toBe(true);
  });

  it("gets aria-labelledby from Label", () => {
    const { container } = render(
      <Field id="qty">
        <Label>Quantity</Label>
        <NumberInput />
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-labelledby")).toBe("qty-label");
  });

  it("gets aria-describedby from FieldDescription", () => {
    const { container } = render(
      <Field id="qty">
        <FieldDescription>Enter amount</FieldDescription>
        <NumberInput />
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-describedby")).toBe("qty-desc");
  });

  it("gets data-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <NumberInput />
      </Field>,
    );
    expect(container.querySelector("[data-invalid]")).not.toBeNull();
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("NumberInput: ref", () => {
  it("forwards ref to input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<NumberInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current!.getAttribute("role")).toBe("spinbutton");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("NumberInput: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(<NumberInput name="qty" defaultValue={5} min={0} max={10} />);
    expect(html).toContain('data-kui-component="NumberInput"');
    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('name="qty"');
    expect(html).toContain('value="5"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="10"');
  });
});
