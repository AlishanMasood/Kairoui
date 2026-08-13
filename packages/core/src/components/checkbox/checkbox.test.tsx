import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Checkbox, checkboxStyleContract } from "./index";
import type { CheckboxProps, CheckboxSize } from "./index";
import { Field } from "../field/field";
import { FieldDescription } from "../field/field-description";
import { FieldError } from "../field/field-error";
import { componentClass } from "../../composition/class-generation";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Checkbox: rendering", () => {
  it("renders a label wrapper", () => {
    render(<Checkbox data-testid="cb">Accept</Checkbox>);
    const wrapper = screen.getByText("Accept").closest("[data-kui-component]");
    expect(wrapper?.tagName).toBe("LABEL");
  });

  it("has data-kui-component", () => {
    render(<Checkbox>Accept</Checkbox>);
    expect(
      screen
        .getByText("Accept")
        .closest("[data-kui-component]")
        ?.getAttribute("data-kui-component"),
    ).toBe("Checkbox");
  });

  it("renders hidden native input", () => {
    const { container } = render(<Checkbox>Terms</Checkbox>);
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).not.toBeNull();
  });

  it("renders label text", () => {
    render(<Checkbox>Accept terms</Checkbox>);
    expect(screen.getByText("Accept terms")).toBeDefined();
  });

  it("renders visual control box", () => {
    const { container } = render(<Checkbox>X</Checkbox>);
    expect(container.querySelector(".kui-checkbox__control")).not.toBeNull();
  });

  it("applies base class", () => {
    const { container } = render(<Checkbox>X</Checkbox>);
    expect(container.querySelector(".kui-checkbox")).not.toBeNull();
  });

  it("applies className", () => {
    const { container } = render(<Checkbox className="custom">X</Checkbox>);
    expect(container.querySelector(".custom")).not.toBeNull();
  });

  it("data-state is unchecked by default", () => {
    const { container } = render(<Checkbox>X</Checkbox>);
    expect(container.querySelector("[data-state='unchecked']")).not.toBeNull();
  });
});

// ─── Size variants ──────────────────────────────────────────────────

describe("Checkbox: sizes", () => {
  it("default md has no modifier class", () => {
    const { container } = render(<Checkbox>X</Checkbox>);
    expect(container.querySelector(".kui-checkbox--md")).toBeNull();
  });

  it("sm adds modifier class", () => {
    const { container } = render(<Checkbox size="sm">X</Checkbox>);
    expect(container.querySelector(".kui-checkbox--sm")).not.toBeNull();
  });

  it("lg adds modifier class", () => {
    const { container } = render(<Checkbox size="lg">X</Checkbox>);
    expect(container.querySelector(".kui-checkbox--lg")).not.toBeNull();
  });
});

// ─── Unchecked/Checked state ────────────────────────────────────────

describe("Checkbox: checked state", () => {
  it("uncontrolled: starts unchecked", () => {
    const { container } = render(<Checkbox>X</Checkbox>);
    const input = container.querySelector("input")!;
    expect(input.checked).toBe(false);
  });

  it("uncontrolled: starts checked with defaultChecked", () => {
    const { container } = render(<Checkbox defaultChecked>X</Checkbox>);
    const input = container.querySelector("input")!;
    expect(input.checked).toBe(true);
  });

  it("uncontrolled: toggles on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox>Accept</Checkbox>);
    const input = container.querySelector("input")!;
    await user.click(input);
    expect(input.checked).toBe(true);
    await user.click(input);
    expect(input.checked).toBe(false);
  });

  it("controlled: reflects checked prop", () => {
    const { container } = render(
      <Checkbox checked onCheckedChange={() => {}}>
        X
      </Checkbox>,
    );
    expect(container.querySelector("input")!.checked).toBe(true);
  });

  it("controlled: calls onCheckedChange", async () => {
    const handler = vi.fn();
    function Controlled() {
      const [c, setC] = useState(false);
      return (
        <Checkbox
          checked={c}
          onCheckedChange={(v) => {
            setC(v);
            handler(v);
          }}
        >
          X
        </Checkbox>
      );
    }
    Controlled.displayName = "Controlled";
    const user = userEvent.setup();
    const { container } = render(<Controlled />);
    await user.click(container.querySelector("input")!);
    expect(handler).toHaveBeenCalledWith(true);
    await user.click(container.querySelector("input")!);
    expect(handler).toHaveBeenCalledWith(false);
  });

  it("data-state reflects checked", () => {
    const { container } = render(
      <Checkbox checked onCheckedChange={() => {}}>
        X
      </Checkbox>,
    );
    expect(container.querySelector("[data-state='checked']")).not.toBeNull();
  });
});

// ─── Indeterminate ──────────────────────────────────────────────────

describe("Checkbox: indeterminate", () => {
  it("sets aria-checked=mixed", () => {
    const { container } = render(<Checkbox indeterminate>X</Checkbox>);
    expect(container.querySelector("input")!.getAttribute("aria-checked")).toBe("mixed");
  });

  it("data-state is indeterminate", () => {
    const { container } = render(<Checkbox indeterminate>X</Checkbox>);
    expect(container.querySelector("[data-state='indeterminate']")).not.toBeNull();
  });

  it("shows indeterminate indicator", () => {
    const { container } = render(<Checkbox indeterminate>X</Checkbox>);
    expect(container.querySelector(".kui-checkbox__indicator")).not.toBeNull();
  });

  it("shows check indicator when checked (not indeterminate)", () => {
    const { container } = render(
      <Checkbox checked onCheckedChange={() => {}}>
        X
      </Checkbox>,
    );
    expect(container.querySelector(".kui-checkbox__indicator")).not.toBeNull();
  });

  it("hides indicator when unchecked and not indeterminate", () => {
    const { container } = render(<Checkbox>X</Checkbox>);
    expect(container.querySelector(".kui-checkbox__indicator")).toBeNull();
  });
});

// ─── Disabled state ─────────────────────────────────────────────────

describe("Checkbox: disabled", () => {
  it("sets disabled on native input", () => {
    const { container } = render(<Checkbox disabled>X</Checkbox>);
    expect(container.querySelector("input")!.disabled).toBe(true);
  });

  it("sets data-disabled", () => {
    const { container } = render(<Checkbox disabled>X</Checkbox>);
    expect(container.querySelector("[data-disabled]")).not.toBeNull();
  });

  it("does not toggle when disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Checkbox disabled onCheckedChange={handler}>
        X
      </Checkbox>,
    );
    await user.click(container.querySelector("input")!);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("Checkbox: form", () => {
  it("submits name/value with native form", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            submitted = data.get("agree") as string;
          }}
        >
          <Checkbox name="agree" value="yes" defaultChecked>
            Agree
          </Checkbox>
          <button type="submit">Submit</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Submit"));
    expect(submitted).toBe("yes");
  });

  it("does not submit unchecked checkbox", async () => {
    const user = userEvent.setup();
    let submitted: string | null = "initial";
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            submitted = data.get("agree") as string | null;
          }}
        >
          <Checkbox name="agree" value="yes">
            Agree
          </Checkbox>
          <button type="submit">Submit</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Submit"));
    expect(submitted).toBeNull();
  });

  it("uses value='on' by default", () => {
    const { container } = render(<Checkbox name="terms">Terms</Checkbox>);
    expect(container.querySelector("input")!.getAttribute("value")).toBe("on");
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("Checkbox: keyboard", () => {
  it("toggles on Space", async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox>X</Checkbox>);
    const input = container.querySelector("input")!;
    input.focus();
    await user.keyboard(" ");
    expect(input.checked).toBe(true);
  });

  it("does not toggle on Enter (native behavior)", async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox>X</Checkbox>);
    const input = container.querySelector("input")!;
    input.focus();
    await user.keyboard("{Enter}");
    expect(input.checked).toBe(false);
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Checkbox: ref", () => {
  it("forwards ref to native input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref}>X</Checkbox>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current!.type).toBe("checkbox");
  });

  it("callback ref receives input", () => {
    let captured: HTMLInputElement | null = null;
    render(
      <Checkbox
        ref={(el) => {
          captured = el;
        }}
      >
        X
      </Checkbox>,
    );
    expect(captured).toBeInstanceOf(HTMLInputElement);
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("Checkbox: Field integration", () => {
  it("gets id from Field", () => {
    const { container } = render(
      <Field id="terms">
        <Checkbox>Accept</Checkbox>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("id")).toBe("terms");
  });

  it("gets disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <Checkbox>X</Checkbox>
      </Field>,
    );
    expect(container.querySelector("input")!.disabled).toBe(true);
  });

  it("gets required from Field", () => {
    const { container } = render(
      <Field required>
        <Checkbox>X</Checkbox>
      </Field>,
    );
    expect(container.querySelector("input")!.required).toBe(true);
  });

  it("gets aria-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Checkbox>X</Checkbox>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
  });

  it("gets aria-describedby from FieldDescription", () => {
    const { container } = render(
      <Field id="terms">
        <FieldDescription>Must agree</FieldDescription>
        <Checkbox>X</Checkbox>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-describedby")).toBe("terms-desc");
  });

  it("gets aria-describedby from FieldError", () => {
    const { container } = render(
      <Field id="terms" validationState="invalid">
        <FieldError>Required</FieldError>
        <Checkbox>X</Checkbox>
      </Field>,
    );
    const describedBy = container.querySelector("input")!.getAttribute("aria-describedby");
    expect(describedBy).toContain("terms-error");
  });
});

// ─── Style contract ─────────────────────────────────────────────────

describe("Checkbox: style contract", () => {
  it("contract name is checkbox", () => {
    expect(checkboxStyleContract.name).toBe("checkbox");
  });

  it("has size variants", () => {
    expect(checkboxStyleContract.variants!.size.sm).toBeDefined();
    expect(checkboxStyleContract.variants!.size.md).toBeDefined();
    expect(checkboxStyleContract.variants!.size.lg).toBeDefined();
  });

  it("base class matches utility", () => {
    expect(componentClass(checkboxStyleContract.name)).toBe("kui-checkbox");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Checkbox: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(<Checkbox name="terms">Accept</Checkbox>);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('name="terms"');
    expect(html).toContain("Accept");
    expect(html).toContain('data-kui-component="Checkbox"');
  });

  it("renders checked state in SSR", () => {
    const html = renderToString(
      <Checkbox checked onCheckedChange={() => {}}>
        X
      </Checkbox>,
    );
    expect(html).toContain('data-state="checked"');
  });

  it("renders indeterminate in SSR", () => {
    const html = renderToString(<Checkbox indeterminate>X</Checkbox>);
    expect(html).toContain('aria-checked="mixed"');
    expect(html).toContain('data-state="indeterminate"');
  });

  it("renders disabled in SSR", () => {
    const html = renderToString(<Checkbox disabled>X</Checkbox>);
    expect(html).toContain("disabled");
    expect(html).toContain("data-disabled");
  });

  it("renders with Field in SSR", () => {
    const html = renderToString(
      <Field id="agree" required validationState="invalid">
        <Checkbox>Accept</Checkbox>
      </Field>,
    );
    expect(html).toContain('id="agree"');
    expect(html).toContain('aria-invalid="true"');
  });
});

// ─── Type inference ─────────────────────────────────────────────────

describe("Checkbox: types", () => {
  it("CheckboxSize is correct union", () => {
    expectTypeOf<CheckboxSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });

  it("CheckboxProps has expected properties", () => {
    expectTypeOf<CheckboxProps>().toHaveProperty("checked");
    expectTypeOf<CheckboxProps>().toHaveProperty("defaultChecked");
    expectTypeOf<CheckboxProps>().toHaveProperty("indeterminate");
    expectTypeOf<CheckboxProps>().toHaveProperty("onCheckedChange");
    expectTypeOf<CheckboxProps>().toHaveProperty("size");
    expectTypeOf<CheckboxProps>().toHaveProperty("disabled");
    expectTypeOf<CheckboxProps>().toHaveProperty("name");
    expectTypeOf<CheckboxProps>().toHaveProperty("value");
  });
});
