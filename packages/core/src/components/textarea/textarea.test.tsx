import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Textarea, textareaStyleContract } from "./index";
import type { TextareaProps, TextareaSize, TextareaResize } from "./index";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldDescription } from "../field/field-description";
import { FieldError } from "../field/field-error";
import { componentClass } from "../../composition/class-generation";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Textarea: rendering", () => {
  it("renders a native textarea element", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta").tagName).toBe("TEXTAREA");
  });

  it("has data-kui-component", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta").getAttribute("data-kui-component")).toBe("Textarea");
  });

  it("applies base class", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta").className).toContain("kui-textarea");
  });

  it("applies className", () => {
    render(<Textarea data-testid="ta" className="custom" />);
    expect(screen.getByTestId("ta").className).toContain("custom");
    expect(screen.getByTestId("ta").className).toContain("kui-textarea");
  });

  it("applies style", () => {
    render(<Textarea data-testid="ta" style={{ color: "blue" }} />);
    expect(screen.getByTestId("ta").style.color).toBe("blue");
  });

  it("passes placeholder", () => {
    render(<Textarea data-testid="ta" placeholder="Enter message" />);
    expect(screen.getByTestId("ta").getAttribute("placeholder")).toBe("Enter message");
  });

  it("passes rows", () => {
    render(<Textarea data-testid="ta" rows={5} />);
    expect(screen.getByTestId("ta").getAttribute("rows")).toBe("5");
  });

  it("passes cols", () => {
    render(<Textarea data-testid="ta" cols={40} />);
    expect(screen.getByTestId("ta").getAttribute("cols")).toBe("40");
  });

  it("passes name", () => {
    render(<Textarea data-testid="ta" name="message" />);
    expect(screen.getByTestId("ta").getAttribute("name")).toBe("message");
  });
});

// ─── Size variants ──────────────────────────────────────────────────

describe("Textarea: sizes", () => {
  it("default md has no modifier class", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta").className).not.toContain("kui-textarea--md");
  });

  it("sm adds modifier class", () => {
    render(<Textarea data-testid="ta" size="sm" />);
    expect(screen.getByTestId("ta").className).toContain("kui-textarea--sm");
  });

  it("lg adds modifier class", () => {
    render(<Textarea data-testid="ta" size="lg" />);
    expect(screen.getByTestId("ta").className).toContain("kui-textarea--lg");
  });
});

// ─── Resize ─────────────────────────────────────────────────────────

describe("Textarea: resize", () => {
  it("default resize is vertical (no inline style needed)", () => {
    render(<Textarea data-testid="ta" />);
    // Default "vertical" is in CSS contract, no inline style override needed
    expect(screen.getByTestId("ta").style.resize).toBe("");
  });

  it("resize=none applies inline style", () => {
    render(<Textarea data-testid="ta" resize="none" />);
    expect(screen.getByTestId("ta").style.resize).toBe("none");
  });

  it("resize=both applies inline style", () => {
    render(<Textarea data-testid="ta" resize="both" />);
    expect(screen.getByTestId("ta").style.resize).toBe("both");
  });

  it("resize=horizontal applies inline style", () => {
    render(<Textarea data-testid="ta" resize="horizontal" />);
    expect(screen.getByTestId("ta").style.resize).toBe("horizontal");
  });
});

// ─── Disabled state ─────────────────────────────────────────────────

describe("Textarea: disabled", () => {
  it("sets disabled attribute", () => {
    render(<Textarea data-testid="ta" disabled />);
    expect(screen.getByTestId("ta")).toBeDisabled();
  });

  it("sets data-disabled", () => {
    render(<Textarea data-testid="ta" disabled />);
    expect(screen.getByTestId("ta").hasAttribute("data-disabled")).toBe(true);
  });
});

// ─── ReadOnly state ─────────────────────────────────────────────────

describe("Textarea: readOnly", () => {
  it("sets readOnly attribute", () => {
    render(<Textarea data-testid="ta" readOnly />);
    expect(screen.getByTestId("ta")).toHaveAttribute("readonly");
  });

  it("sets data-readonly", () => {
    render(<Textarea data-testid="ta" readOnly />);
    expect(screen.getByTestId("ta").hasAttribute("data-readonly")).toBe(true);
  });

  it("is still focusable", () => {
    render(<Textarea data-testid="ta" readOnly />);
    screen.getByTestId("ta").focus();
    expect(document.activeElement).toBe(screen.getByTestId("ta"));
  });
});

// ─── Controlled usage ───────────────────────────────────────────────

describe("Textarea: controlled", () => {
  it("reflects controlled value", () => {
    render(<Textarea data-testid="ta" value="hello" onChange={() => {}} />);
    expect(screen.getByTestId("ta")).toHaveValue("hello");
  });

  it("calls onChange on input", async () => {
    function Controlled() {
      const [val, setVal] = useState("");
      return (
        <Textarea
          data-testid="ta"
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
          }}
        />
      );
    }
    Controlled.displayName = "Controlled";
    const user = userEvent.setup();
    render(<Controlled />);
    await user.type(screen.getByTestId("ta"), "ab");
    expect(screen.getByTestId("ta")).toHaveValue("ab");
  });
});

// ─── Uncontrolled usage ─────────────────────────────────────────────

describe("Textarea: uncontrolled", () => {
  it("accepts defaultValue", () => {
    render(<Textarea data-testid="ta" defaultValue="preset" />);
    expect(screen.getByTestId("ta")).toHaveValue("preset");
  });

  it("updates on user input", async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="ta" defaultValue="" />);
    await user.type(screen.getByTestId("ta"), "test");
    expect(screen.getByTestId("ta")).toHaveValue("test");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Textarea: ref", () => {
  it("forwards ref to native textarea", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("ref.current.focus() works", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} data-testid="ta" />);
    ref.current!.focus();
    expect(document.activeElement).toBe(screen.getByTestId("ta"));
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("Textarea: Field integration", () => {
  it("gets id from Field context", () => {
    render(
      <Field id="msg">
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta").getAttribute("id")).toBe("msg");
  });

  it("consumer id overrides Field", () => {
    render(
      <Field id="msg">
        <Textarea data-testid="ta" id="custom" />
      </Field>,
    );
    expect(screen.getByTestId("ta").getAttribute("id")).toBe("custom");
  });

  it("gets aria-labelledby from Label", () => {
    render(
      <Field id="msg">
        <Label>Message</Label>
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta").getAttribute("aria-labelledby")).toBe("msg-label");
  });

  it("gets aria-describedby from FieldDescription", () => {
    render(
      <Field id="msg">
        <FieldDescription>Be concise</FieldDescription>
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta").getAttribute("aria-describedby")).toBe("msg-desc");
  });

  it("gets aria-errormessage from FieldError", () => {
    render(
      <Field id="msg" validationState="invalid">
        <FieldError>Required</FieldError>
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta").getAttribute("aria-errormessage")).toBe("msg-error");
  });

  it("gets disabled from Field", () => {
    render(
      <Field disabled>
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta")).toBeDisabled();
  });

  it("gets readOnly from Field", () => {
    render(
      <Field readOnly>
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta")).toHaveAttribute("readonly");
  });

  it("gets required from Field", () => {
    render(
      <Field required>
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta")).toBeRequired();
  });

  it("gets aria-invalid from Field", () => {
    render(
      <Field validationState="invalid">
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta").getAttribute("aria-invalid")).toBe("true");
  });

  it("sets data-invalid from Field", () => {
    render(
      <Field validationState="invalid">
        <Textarea data-testid="ta" />
      </Field>,
    );
    expect(screen.getByTestId("ta").hasAttribute("data-invalid")).toBe(true);
  });
});

// ─── Form submission ────────────────────────────────────────────────

describe("Textarea: form submission", () => {
  it("submits value with native form", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            submitted = data.get("msg") as string;
          }}
        >
          <Textarea name="msg" defaultValue="Hello world" />
          <button type="submit">Submit</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Submit"));
    expect(submitted).toBe("Hello world");
  });
});

// ─── Events ─────────────────────────────────────────────────────────

describe("Textarea: events", () => {
  it("fires onFocus", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Textarea data-testid="ta" onFocus={handler} />);
    await user.tab();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires onBlur", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <>
        <Textarea data-testid="ta" onBlur={handler} />
        <button>other</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── Style contract ─────────────────────────────────────────────────

describe("Textarea: style contract", () => {
  it("contract name is textarea", () => {
    expect(textareaStyleContract.name).toBe("textarea");
  });

  it("has size variants", () => {
    const size = textareaStyleContract.variants!.size;
    expect(size.sm).toBeDefined();
    expect(size.md).toBeDefined();
    expect(size.lg).toBeDefined();
  });

  it("has focus-visible state", () => {
    expect(textareaStyleContract.slots.root.states!["focusVisible"]).toBeDefined();
  });

  it("has invalid state", () => {
    expect(textareaStyleContract.slots.root.states!["invalid"]).toBeDefined();
  });

  it("base class matches utility", () => {
    expect(componentClass(textareaStyleContract.name)).toBe("kui-textarea");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Textarea: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(<Textarea placeholder="Message" name="msg" />);
    expect(html).toContain("<textarea");
    expect(html).toContain('placeholder="Message"');
    expect(html).toContain('name="msg"');
    expect(html).toContain('data-kui-component="Textarea"');
  });

  it("renders disabled in SSR", () => {
    const html = renderToString(<Textarea disabled />);
    expect(html).toContain("disabled");
    expect(html).toContain("data-disabled");
  });

  it("renders with Field context in SSR", () => {
    const html = renderToString(
      <Field id="bio" required validationState="invalid">
        <Textarea />
      </Field>,
    );
    expect(html).toContain('id="bio"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("data-invalid");
  });

  it("renders all sizes", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      expect(() => renderToString(<Textarea size={size} />)).not.toThrow();
    }
  });
});

// ─── Type inference ─────────────────────────────────────────────────

describe("Textarea: types", () => {
  it("TextareaSize is correct union", () => {
    expectTypeOf<TextareaSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });

  it("TextareaResize is correct union", () => {
    expectTypeOf<TextareaResize>().toEqualTypeOf<"none" | "vertical" | "horizontal" | "both">();
  });

  it("TextareaProps extends native textarea attributes", () => {
    const props: TextareaProps = {
      rows: 5,
      cols: 40,
      placeholder: "text",
      size: "lg",
      resize: "none",
    };
    expect(props.rows).toBe(5);
  });
});
