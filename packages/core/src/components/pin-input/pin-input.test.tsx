import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { PinInput } from "./pin-input";
import { Field } from "../field/field";
import { Label } from "../field/label";

afterEach(cleanup);

// ─── Rendering ──────────────────────────────────────────────────────

describe("PinInput: rendering", () => {
  it("renders with data-kui-component", () => {
    const { container } = render(<PinInput />);
    expect(container.querySelector("[data-kui-component='PinInput']")).not.toBeNull();
  });

  it("renders correct number of fields", () => {
    const { container } = render(<PinInput length={6} />);
    expect(container.querySelectorAll("[data-kui-component='PinInputField']")).toHaveLength(6);
  });

  it("defaults to 4 fields", () => {
    const { container } = render(<PinInput />);
    expect(container.querySelectorAll("[data-kui-component='PinInputField']")).toHaveLength(4);
  });

  it("has role=group", () => {
    const { container } = render(<PinInput />);
    expect(container.querySelector("[role='group']")).not.toBeNull();
  });

  it("each field has aria-label", () => {
    const { container } = render(<PinInput length={3} />);
    const fields = container.querySelectorAll("input");
    expect(fields[0]?.getAttribute("aria-label")).toBe("Digit 1 of 3");
    expect(fields[2]?.getAttribute("aria-label")).toBe("Digit 3 of 3");
  });

  it("numeric mode has inputMode=numeric", () => {
    const { container } = render(<PinInput mode="numeric" />);
    expect(container.querySelector("input")?.getAttribute("inputmode")).toBe("numeric");
  });

  it("alphanumeric mode has inputMode=text", () => {
    const { container } = render(<PinInput mode="alphanumeric" />);
    expect(container.querySelector("input")?.getAttribute("inputmode")).toBe("text");
  });

  it("first field has autoComplete=one-time-code", () => {
    const { container } = render(<PinInput />);
    const fields = container.querySelectorAll("input");
    expect(fields[0]?.getAttribute("autocomplete")).toBe("one-time-code");
    expect(fields[1]?.getAttribute("autocomplete")).toBe("off");
  });

  it("mask mode uses type=password", () => {
    const { container } = render(<PinInput mask />);
    expect(container.querySelector("input")?.getAttribute("type")).toBe("password");
  });

  it("non-mask uses type=text", () => {
    const { container } = render(<PinInput />);
    expect(container.querySelector("input")?.getAttribute("type")).toBe("text");
  });
});

// ─── Value ──────────────────────────────────────────────────────────

describe("PinInput: value", () => {
  it("uncontrolled: starts empty", () => {
    const { container } = render(<PinInput />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    expect((fields[0] as HTMLInputElement).value).toBe("");
  });

  it("uncontrolled: starts with defaultValue", () => {
    const { container } = render(<PinInput defaultValue="12" length={4} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    expect((fields[0] as HTMLInputElement).value).toBe("1");
    expect((fields[1] as HTMLInputElement).value).toBe("2");
    expect((fields[2] as HTMLInputElement).value).toBe("");
  });

  it("controlled: reflects value", () => {
    const { container } = render(<PinInput value="5678" length={4} onValueChange={() => {}} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    expect((fields[0] as HTMLInputElement).value).toBe("5");
    expect((fields[3] as HTMLInputElement).value).toBe("8");
  });
});

// ─── Keyboard input ─────────────────────────────────────────────────

describe("PinInput: keyboard", () => {
  it("typing a digit fills field and auto-advances", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput onValueChange={handler} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[0] as HTMLElement).focus();
    await user.keyboard("1");
    expect(handler).toHaveBeenCalledWith("1");
  });

  it("rejects non-numeric in numeric mode", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput mode="numeric" onValueChange={handler} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[0] as HTMLElement).focus();
    await user.keyboard("a");
    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts letters in alphanumeric mode", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput mode="alphanumeric" onValueChange={handler} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[0] as HTMLElement).focus();
    await user.keyboard("a");
    expect(handler).toHaveBeenCalledWith("a");
  });

  it("Backspace clears current field", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput defaultValue="12" onValueChange={handler} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[1] as HTMLElement).focus();
    await user.keyboard("{Backspace}");
    expect(handler).toHaveBeenCalledWith("1");
  });

  it("Backspace on empty field moves to previous", async () => {
    const user = userEvent.setup();
    const { container } = render(<PinInput defaultValue="1" />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[1] as HTMLElement).focus();
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(fields[0]);
  });

  it("ArrowLeft moves focus left", async () => {
    const user = userEvent.setup();
    const { container } = render(<PinInput />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[2] as HTMLElement).focus();
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(fields[1]);
  });

  it("ArrowRight moves focus right", async () => {
    const user = userEvent.setup();
    const { container } = render(<PinInput />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[0] as HTMLElement).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(fields[1]);
  });

  it("Delete clears current field", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput defaultValue="123" onValueChange={handler} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[1] as HTMLElement).focus();
    await user.keyboard("{Delete}");
    expect(handler).toHaveBeenCalledWith("13");
  });
});

// ─── onComplete ─────────────────────────────────────────────────────

describe("PinInput: onComplete", () => {
  it("fires onComplete when all fields filled", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput length={3} defaultValue="12" onComplete={onComplete} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[2] as HTMLElement).focus();
    await user.keyboard("3");
    expect(onComplete).toHaveBeenCalledWith("123");
  });
});

// ─── Paste ──────────────────────────────────────────────────────────

describe("PinInput: paste", () => {
  it("paste fills fields from cursor position", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput length={4} onValueChange={handler} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[0] as HTMLElement).focus();
    await user.paste("1234");
    expect(handler).toHaveBeenCalledWith("1234");
  });

  it("paste skips invalid characters in numeric mode", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput length={4} mode="numeric" onValueChange={handler} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[0] as HTMLElement).focus();
    await user.paste("1a2b");
    expect(handler).toHaveBeenCalledWith("12");
  });

  it("paste from middle fills remaining fields", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<PinInput length={4} defaultValue="1" onValueChange={handler} />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    (fields[1] as HTMLElement).focus();
    await user.paste("234");
    expect(handler).toHaveBeenCalledWith("1234");
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("PinInput: disabled", () => {
  it("disables all fields", () => {
    const { container } = render(<PinInput disabled />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    fields.forEach((f) => {
      expect((f as HTMLInputElement).disabled).toBe(true);
    });
  });

  it("sets data-disabled", () => {
    const { container } = render(<PinInput disabled />);
    expect(container.querySelector("[data-disabled]")).not.toBeNull();
  });
});

// ─── ReadOnly ───────────────────────────────────────────────────────

describe("PinInput: readOnly", () => {
  it("sets readOnly on all fields", () => {
    const { container } = render(<PinInput readOnly />);
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    fields.forEach((f) => {
      expect(f).toHaveAttribute("readonly");
    });
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("PinInput: form", () => {
  it("renders hidden input with name", () => {
    const { container } = render(<PinInput name="otp" defaultValue="1234" />);
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden).not.toBeNull();
    expect(hidden.name).toBe("otp");
    expect(hidden.value).toBe("1234");
  });

  it("submits value", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("code") as string;
          }}
        >
          <PinInput name="code" defaultValue="5678" />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBe("5678");
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("PinInput: Field", () => {
  it("gets disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <PinInput />
      </Field>,
    );
    const fields = container.querySelectorAll("input:not([type='hidden'])");
    expect((fields[0] as HTMLInputElement).disabled).toBe(true);
  });

  it("gets aria-labelledby from Label", () => {
    const { container } = render(
      <Field id="code">
        <Label>Verification code</Label>
        <PinInput />
      </Field>,
    );
    expect(container.querySelector("[role='group']")?.getAttribute("aria-labelledby")).toBe(
      "code-label",
    );
  });

  it("gets data-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <PinInput />
      </Field>,
    );
    expect(container.querySelector("[data-invalid]")).not.toBeNull();
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("PinInput: ref", () => {
  it("forwards ref to root div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<PinInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute("role")).toBe("group");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("PinInput: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(<PinInput name="otp" length={6} defaultValue="123" />);
    expect(html).toContain('data-kui-component="PinInput"');
    expect(html).toContain('role="group"');
    expect(html).toContain('name="otp"');
    expect(html).toContain('inputMode="numeric"');
    // Should have 6 visible inputs + 1 hidden
    const inputCount = (html.match(/<input/g) ?? []).length;
    expect(inputCount).toBe(7);
  });
});
