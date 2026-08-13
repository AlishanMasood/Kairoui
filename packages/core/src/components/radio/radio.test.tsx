import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, createElement, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Radio, radioStyleContract } from "./index";
import type { RadioProps, RadioSize } from "./index";
import { Field } from "../field/field";
import { FieldDescription } from "../field/field-description";
import { RadioGroupContext } from "../selection/selection-context";
import type { RadioGroupContextValue } from "../selection/selection-context";
import { componentClass } from "../../composition/class-generation";

afterEach(cleanup);

// ─── Helper: RadioGroup mock ────────────────────────────────────────

function MockRadioGroup({
  value,
  onValueChange,
  name,
  disabled = false,
  required = false,
  children,
}: {
  value: string | undefined;
  onValueChange: (v: string) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  const ctx: RadioGroupContextValue = { value, onValueChange, name, disabled, required };
  return createElement(RadioGroupContext.Provider, { value: ctx }, children);
}
MockRadioGroup.displayName = "MockRadioGroup";

// ─── Default rendering ──────────────────────────────────────────────

describe("Radio: rendering", () => {
  it("renders a label wrapper", () => {
    const { container } = render(<Radio value="a">Option A</Radio>);
    expect(container.querySelector("[data-kui-component='Radio']")?.tagName).toBe("LABEL");
  });

  it("has data-kui-component", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector("[data-kui-component='Radio']")).not.toBeNull();
  });

  it("renders hidden native radio input", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    const input = container.querySelector('input[type="radio"]');
    expect(input).not.toBeNull();
  });

  it("renders label text", () => {
    render(<Radio value="a">Option A</Radio>);
    expect(screen.getByText("Option A")).toBeDefined();
  });

  it("renders visual control circle", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector(".kui-radio__control")).not.toBeNull();
  });

  it("applies base class", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector(".kui-radio")).not.toBeNull();
  });

  it("data-state is unchecked by default", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector("[data-state='unchecked']")).not.toBeNull();
  });
});

// ─── Size variants ──────────────────────────────────────────────────

describe("Radio: sizes", () => {
  it("default md has no modifier", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector(".kui-radio--md")).toBeNull();
  });

  it("sm adds modifier", () => {
    const { container } = render(
      <Radio value="a" size="sm">
        A
      </Radio>,
    );
    expect(container.querySelector(".kui-radio--sm")).not.toBeNull();
  });

  it("lg adds modifier", () => {
    const { container } = render(
      <Radio value="a" size="lg">
        A
      </Radio>,
    );
    expect(container.querySelector(".kui-radio--lg")).not.toBeNull();
  });
});

// ─── Standalone checked state ───────────────────────────────────────

describe("Radio: standalone checked", () => {
  it("uncontrolled: starts unchecked", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector("input")!.checked).toBe(false);
  });

  it("uncontrolled: starts checked with defaultChecked", () => {
    const { container } = render(
      <Radio value="a" defaultChecked>
        A
      </Radio>,
    );
    expect(container.querySelector("input")!.checked).toBe(true);
  });

  it("uncontrolled: checks on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Radio value="a">A</Radio>);
    const input = container.querySelector("input")!;
    await user.click(input);
    expect(input.checked).toBe(true);
  });

  it("controlled: reflects checked prop", () => {
    const { container } = render(
      <Radio value="a" checked onCheckedChange={() => {}}>
        A
      </Radio>,
    );
    expect(container.querySelector("input")!.checked).toBe(true);
  });

  it("controlled: calls onCheckedChange", async () => {
    const handler = vi.fn();
    function Controlled() {
      const [c, setC] = useState(false);
      return (
        <Radio
          value="a"
          checked={c}
          onCheckedChange={(v) => {
            setC(v);
            handler(v);
          }}
        >
          A
        </Radio>
      );
    }
    Controlled.displayName = "Controlled";
    const user = userEvent.setup();
    const { container } = render(<Controlled />);
    await user.click(container.querySelector("input")!);
    expect(handler).toHaveBeenCalledWith(true);
  });

  it("shows indicator when checked", () => {
    const { container } = render(
      <Radio value="a" checked onCheckedChange={() => {}}>
        A
      </Radio>,
    );
    expect(container.querySelector(".kui-radio__indicator")).not.toBeNull();
  });

  it("hides indicator when unchecked", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector(".kui-radio__indicator")).toBeNull();
  });
});

// ─── RadioGroup context integration ─────────────────────────────────

describe("Radio: within RadioGroup", () => {
  it("is checked when group value matches", () => {
    const { container } = render(
      <MockRadioGroup value="b" onValueChange={() => {}}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </MockRadioGroup>,
    );
    const inputs = container.querySelectorAll("input");
    expect(inputs[0]!.checked).toBe(false);
    expect(inputs[1]!.checked).toBe(true);
  });

  it("calls group onValueChange on click", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <MockRadioGroup value={undefined} onValueChange={handler}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </MockRadioGroup>,
    );
    await user.click(container.querySelectorAll("input")[1]!);
    expect(handler).toHaveBeenCalledWith("b");
  });

  it("inherits name from group", () => {
    const { container } = render(
      <MockRadioGroup value="a" onValueChange={() => {}} name="color">
        <Radio value="a">A</Radio>
      </MockRadioGroup>,
    );
    expect(container.querySelector("input")!.getAttribute("name")).toBe("color");
  });

  it("inherits disabled from group", () => {
    const { container } = render(
      <MockRadioGroup value="a" onValueChange={() => {}} disabled>
        <Radio value="a">A</Radio>
      </MockRadioGroup>,
    );
    expect(container.querySelector("input")!.disabled).toBe(true);
  });

  it("inherits required from group", () => {
    const { container } = render(
      <MockRadioGroup value="a" onValueChange={() => {}} required>
        <Radio value="a">A</Radio>
      </MockRadioGroup>,
    );
    expect(container.querySelector("input")!.required).toBe(true);
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("Radio: disabled", () => {
  it("sets disabled on input", () => {
    const { container } = render(
      <Radio value="a" disabled>
        A
      </Radio>,
    );
    expect(container.querySelector("input")!.disabled).toBe(true);
  });

  it("sets data-disabled", () => {
    const { container } = render(
      <Radio value="a" disabled>
        A
      </Radio>,
    );
    expect(container.querySelector("[data-disabled]")).not.toBeNull();
  });

  it("does not toggle when disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Radio value="a" disabled onCheckedChange={handler}>
        A
      </Radio>,
    );
    await user.click(container.querySelector("input")!);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("Radio: form", () => {
  it("submits name/value when checked", async () => {
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
          <Radio name="pick" value="yes" defaultChecked>
            Yes
          </Radio>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBe("yes");
  });

  it("does not submit when unchecked", async () => {
    const user = userEvent.setup();
    let submitted: string | null = "initial";
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("pick") as string | null;
          }}
        >
          <Radio name="pick" value="yes">
            Yes
          </Radio>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBeNull();
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("Radio: keyboard", () => {
  it("checks on Space", async () => {
    const user = userEvent.setup();
    const { container } = render(<Radio value="a">A</Radio>);
    const input = container.querySelector("input")!;
    input.focus();
    await user.keyboard(" ");
    expect(input.checked).toBe(true);
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Radio: ref", () => {
  it("forwards ref to native input", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Radio ref={ref} value="a">
        A
      </Radio>,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current!.type).toBe("radio");
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("Radio: Field integration", () => {
  it("gets id from Field", () => {
    const { container } = render(
      <Field id="choice">
        <Radio value="a">A</Radio>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("id")).toBe("choice");
  });

  it("gets disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <Radio value="a">A</Radio>
      </Field>,
    );
    expect(container.querySelector("input")!.disabled).toBe(true);
  });

  it("gets aria-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Radio value="a">A</Radio>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
  });

  it("gets aria-describedby from FieldDescription", () => {
    const { container } = render(
      <Field id="choice">
        <FieldDescription>Pick one</FieldDescription>
        <Radio value="a">A</Radio>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-describedby")).toBe("choice-desc");
  });
});

// ─── Style contract ─────────────────────────────────────────────────

describe("Radio: style contract", () => {
  it("contract name is radio", () => {
    expect(radioStyleContract.name).toBe("radio");
  });

  it("has size variants", () => {
    expect(radioStyleContract.variants!.size.sm).toBeDefined();
    expect(radioStyleContract.variants!.size.md).toBeDefined();
    expect(radioStyleContract.variants!.size.lg).toBeDefined();
  });

  it("base class matches utility", () => {
    expect(componentClass(radioStyleContract.name)).toBe("kui-radio");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Radio: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(
      <Radio name="pick" value="yes">
        Yes
      </Radio>,
    );
    expect(html).toContain('type="radio"');
    expect(html).toContain('name="pick"');
    expect(html).toContain('value="yes"');
    expect(html).toContain("Yes");
    expect(html).toContain('data-kui-component="Radio"');
  });

  it("renders checked in SSR", () => {
    const html = renderToString(
      <Radio value="a" checked onCheckedChange={() => {}}>
        A
      </Radio>,
    );
    expect(html).toContain('data-state="checked"');
  });

  it("renders disabled in SSR", () => {
    const html = renderToString(
      <Radio value="a" disabled>
        A
      </Radio>,
    );
    expect(html).toContain("disabled");
    expect(html).toContain("data-disabled");
  });

  it("renders within group in SSR", () => {
    const html = renderToString(
      <MockRadioGroup value="b" onValueChange={() => {}} name="opt">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </MockRadioGroup>,
    );
    expect(html).toContain('name="opt"');
    // B should be checked
    expect(html).toContain('data-state="checked"');
  });
});

// ─── Type inference ─────────────────────────────────────────────────

describe("Radio: types", () => {
  it("RadioSize is correct union", () => {
    expectTypeOf<RadioSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });

  it("RadioProps has expected properties", () => {
    expectTypeOf<RadioProps>().toHaveProperty("checked");
    expectTypeOf<RadioProps>().toHaveProperty("defaultChecked");
    expectTypeOf<RadioProps>().toHaveProperty("onCheckedChange");
    expectTypeOf<RadioProps>().toHaveProperty("size");
    expectTypeOf<RadioProps>().toHaveProperty("disabled");
    expectTypeOf<RadioProps>().toHaveProperty("name");
    expectTypeOf<RadioProps>().toHaveProperty("value");
  });
});
