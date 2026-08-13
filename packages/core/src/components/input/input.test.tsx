import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Input, inputStyleContract } from "./index";
import type { InputProps, InputSize } from "./index";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldDescription } from "../field/field-description";
import { FieldError } from "../field/field-error";
import { componentClass } from "../../composition/class-generation";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Input: rendering", () => {
  it("renders a native input element", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input").tagName).toBe("INPUT");
  });

  it("has data-kui-component", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input").getAttribute("data-kui-component")).toBe("Input");
  });

  it("applies base class", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input").className).toContain("kui-input");
  });

  it("applies className", () => {
    render(<Input data-testid="input" className="custom" />);
    expect(screen.getByTestId("input").className).toContain("custom");
    expect(screen.getByTestId("input").className).toContain("kui-input");
  });

  it("applies style", () => {
    render(<Input data-testid="input" style={{ color: "red" }} />);
    expect(screen.getByTestId("input").style.color).toBe("red");
  });

  it("passes placeholder", () => {
    render(<Input data-testid="input" placeholder="Enter name" />);
    expect(screen.getByTestId("input").getAttribute("placeholder")).toBe("Enter name");
  });

  it("passes type", () => {
    render(<Input data-testid="input" type="email" />);
    expect(screen.getByTestId("input").getAttribute("type")).toBe("email");
  });

  it("passes name", () => {
    render(<Input data-testid="input" name="email" />);
    expect(screen.getByTestId("input").getAttribute("name")).toBe("email");
  });

  it("passes autoComplete", () => {
    render(<Input data-testid="input" autoComplete="email" />);
    expect(screen.getByTestId("input").getAttribute("autocomplete")).toBe("email");
  });
});

// ─── Size variants ──────────────────────────────────────────────────

describe("Input: sizes", () => {
  it("default md has no size modifier class", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input").className).not.toContain("kui-input--md");
  });

  it("sm adds modifier class", () => {
    render(<Input data-testid="input" size="sm" />);
    expect(screen.getByTestId("input").className).toContain("kui-input--sm");
  });

  it("lg adds modifier class", () => {
    render(<Input data-testid="input" size="lg" />);
    expect(screen.getByTestId("input").className).toContain("kui-input--lg");
  });

  it("size prop does not leak to DOM", () => {
    render(<Input data-testid="input" size="sm" />);
    // Native input size is a number; our string "sm" should not appear as attribute
    expect(screen.getByTestId("input").getAttribute("size")).toBeNull();
  });
});

// ─── Disabled state ─────────────────────────────────────────────────

describe("Input: disabled", () => {
  it("sets disabled attribute", () => {
    render(<Input data-testid="input" disabled />);
    expect(screen.getByTestId("input")).toBeDisabled();
  });

  it("sets data-disabled", () => {
    render(<Input data-testid="input" disabled />);
    expect(screen.getByTestId("input").hasAttribute("data-disabled")).toBe(true);
  });

  it("does not fire onChange when disabled", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Input data-testid="input" disabled onChange={handler} />);
    await user.type(screen.getByTestId("input"), "hello");
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── ReadOnly state ─────────────────────────────────────────────────

describe("Input: readOnly", () => {
  it("sets readOnly attribute", () => {
    render(<Input data-testid="input" readOnly />);
    expect(screen.getByTestId("input")).toHaveAttribute("readonly");
  });

  it("sets data-readonly", () => {
    render(<Input data-testid="input" readOnly />);
    expect(screen.getByTestId("input").hasAttribute("data-readonly")).toBe(true);
  });

  it("is still focusable when readOnly", () => {
    render(<Input data-testid="input" readOnly />);
    screen.getByTestId("input").focus();
    expect(document.activeElement).toBe(screen.getByTestId("input"));
  });
});

// ─── Controlled usage ───────────────────────────────────────────────

describe("Input: controlled", () => {
  it("reflects controlled value", () => {
    render(<Input data-testid="input" value="hello" onChange={() => {}} />);
    expect(screen.getByTestId("input")).toHaveValue("hello");
  });

  it("calls onChange on input", async () => {
    const handler = vi.fn();
    function Controlled() {
      const [val, setVal] = useState("");
      return (
        <Input
          data-testid="input"
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            handler(e.target.value);
          }}
        />
      );
    }
    Controlled.displayName = "Controlled";
    const user = userEvent.setup();
    render(<Controlled />);
    await user.type(screen.getByTestId("input"), "ab");
    expect(handler).toHaveBeenCalledWith("a");
    expect(handler).toHaveBeenCalledWith("ab");
    expect(screen.getByTestId("input")).toHaveValue("ab");
  });
});

// ─── Uncontrolled usage ─────────────────────────────────────────────

describe("Input: uncontrolled", () => {
  it("accepts defaultValue", () => {
    render(<Input data-testid="input" defaultValue="preset" />);
    expect(screen.getByTestId("input")).toHaveValue("preset");
  });

  it("updates value on user input", async () => {
    const user = userEvent.setup();
    render(<Input data-testid="input" defaultValue="" />);
    await user.type(screen.getByTestId("input"), "test");
    expect(screen.getByTestId("input")).toHaveValue("test");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Input: ref", () => {
  it("forwards ref to native input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("callback ref receives element", () => {
    let captured: HTMLInputElement | null = null;
    render(
      <Input
        ref={(el) => {
          captured = el;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLInputElement);
  });

  it("ref.current.focus() works", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="input" />);
    ref.current!.focus();
    expect(document.activeElement).toBe(screen.getByTestId("input"));
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("Input: Field integration", () => {
  it("gets id from Field context", () => {
    render(
      <Field id="email">
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input").getAttribute("id")).toBe("email");
  });

  it("consumer id overrides Field id", () => {
    render(
      <Field id="email">
        <Input data-testid="input" id="custom-id" />
      </Field>,
    );
    expect(screen.getByTestId("input").getAttribute("id")).toBe("custom-id");
  });

  it("gets aria-labelledby from Field + Label", () => {
    render(
      <Field id="email">
        <Label>Email</Label>
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input").getAttribute("aria-labelledby")).toBe("email-label");
  });

  it("gets aria-describedby from Field + FieldDescription", () => {
    render(
      <Field id="email">
        <FieldDescription>Enter your email</FieldDescription>
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input").getAttribute("aria-describedby")).toBe("email-desc");
  });

  it("gets aria-errormessage from Field + FieldError", () => {
    render(
      <Field id="email" validationState="invalid">
        <FieldError>Required</FieldError>
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input").getAttribute("aria-errormessage")).toBe("email-error");
  });

  it("gets disabled from Field", () => {
    render(
      <Field disabled>
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input")).toBeDisabled();
  });

  it("consumer disabled overrides Field", () => {
    render(
      <Field disabled>
        <Input data-testid="input" disabled={false} />
      </Field>,
    );
    expect(screen.getByTestId("input")).not.toBeDisabled();
  });

  it("gets readOnly from Field", () => {
    render(
      <Field readOnly>
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input")).toHaveAttribute("readonly");
  });

  it("gets required from Field", () => {
    render(
      <Field required>
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input")).toBeRequired();
  });

  it("gets aria-invalid from Field", () => {
    render(
      <Field validationState="invalid">
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input").getAttribute("aria-invalid")).toBe("true");
  });

  it("sets data-invalid from Field", () => {
    render(
      <Field validationState="invalid">
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input").hasAttribute("data-invalid")).toBe(true);
  });

  it("no data-invalid when valid", () => {
    render(
      <Field validationState="valid">
        <Input data-testid="input" />
      </Field>,
    );
    expect(screen.getByTestId("input").hasAttribute("data-invalid")).toBe(false);
  });
});

// ─── Form submission ────────────────────────────────────────────────

describe("Input: form submission", () => {
  it("submits value with native form", async () => {
    const user = userEvent.setup();
    let submittedValue: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            submittedValue = data.get("email") as string;
          }}
        >
          <Input name="email" defaultValue="test@example.com" data-testid="input" />
          <button type="submit">Submit</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Submit"));
    expect(submittedValue).toBe("test@example.com");
  });
});

// ─── Events ─────────────────────────────────────────────────────────

describe("Input: events", () => {
  it("fires onFocus", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Input data-testid="input" onFocus={handler} />);
    await user.tab();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires onBlur", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <>
        <Input data-testid="input" onBlur={handler} />
        <button>other</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires onKeyDown", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Input data-testid="input" onKeyDown={handler} />);
    screen.getByTestId("input").focus();
    await user.keyboard("a");
    expect(handler).toHaveBeenCalled();
  });
});

// ─── Style contract ─────────────────────────────────────────────────

describe("Input: style contract", () => {
  it("contract name is input", () => {
    expect(inputStyleContract.name).toBe("input");
  });

  it("has size variants", () => {
    const size = inputStyleContract.variants!.size;
    expect(size.sm).toBeDefined();
    expect(size.md).toBeDefined();
    expect(size.lg).toBeDefined();
  });

  it("has focus-visible state", () => {
    const states = inputStyleContract.slots.root.states!;
    expect(states["focusVisible"]).toBeDefined();
  });

  it("has invalid state", () => {
    const states = inputStyleContract.slots.root.states!;
    expect(states["invalid"]).toBeDefined();
  });

  it("base class matches utility", () => {
    expect(componentClass(inputStyleContract.name)).toBe("kui-input");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Input: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(<Input placeholder="Email" name="email" />);
    expect(html).toContain("<input");
    expect(html).toContain('placeholder="Email"');
    expect(html).toContain('name="email"');
    expect(html).toContain('data-kui-component="Input"');
  });

  it("renders disabled state in SSR", () => {
    const html = renderToString(<Input disabled />);
    expect(html).toContain("disabled");
    expect(html).toContain("data-disabled");
  });

  it("renders with Field context in SSR", () => {
    const html = renderToString(
      <Field id="name" required validationState="invalid">
        <Label>Name</Label>
        <Input />
      </Field>,
    );
    expect(html).toContain('id="name"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("data-invalid");
  });

  it("renders all sizes", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      expect(() => renderToString(<Input size={size} />)).not.toThrow();
    }
  });
});

// ─── Standalone (no Field) ──────────────────────────────────────────

describe("Input: standalone", () => {
  it("works without Field context", () => {
    render(<Input data-testid="input" id="standalone" placeholder="Name" />);
    expect(screen.getByTestId("input").getAttribute("id")).toBe("standalone");
    expect(screen.getByTestId("input").getAttribute("aria-labelledby")).toBeNull();
  });

  it("accepts all native props standalone", () => {
    render(
      <Input
        data-testid="input"
        id="my-input"
        name="username"
        type="text"
        disabled
        required
        readOnly
      />,
    );
    const el = screen.getByTestId("input");
    expect(el).toBeDisabled();
    expect(el).toBeRequired();
    expect(el).toHaveAttribute("readonly");
  });
});

// ─── Type inference ─────────────────────────────────────────────────

describe("Input: types", () => {
  it("InputSize is correct union", () => {
    expectTypeOf<InputSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });

  it("InputProps extends native input attributes", () => {
    const props: InputProps = {
      type: "email",
      placeholder: "test@example.com",
      name: "email",
      size: "lg",
    };
    expect(props.type).toBe("email");
  });
});
