import { describe, it, expect, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Input } from "../input/input";
import { Textarea } from "../textarea/textarea";
import { Checkbox } from "../checkbox/checkbox";
import { Radio } from "../radio/radio";
import { RadioGroup } from "../radio-group/radio-group";
import { Switch } from "../switch/switch";
import { Field } from "./field";
import { Label } from "./label";

afterEach(cleanup);

// ─── Helpers ────────────────────────────────────────────────────────

function getFormData(form: HTMLFormElement): Record<string, string | string[]> {
  const fd = new FormData(form);
  const result: Record<string, string | string[]> = {};
  for (const [key, val] of fd.entries()) {
    const existing = result[key];
    if (existing !== undefined) {
      if (Array.isArray(existing)) {
        existing.push(val as string);
      } else {
        result[key] = [existing, val as string];
      }
    } else {
      result[key] = val as string;
    }
  }
  return result;
}

// ─── Input: form submission ─────────────────────────────────────────

describe("Form: Input", () => {
  it("submits text value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          data-testid="form"
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Input name="username" defaultValue="alice" />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["username"]).toBe("alice");
  });

  it("submits empty string when empty", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Input name="field" defaultValue="" />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["field"]).toBe("");
  });

  it("excludes disabled input from FormData", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Input name="disabled-field" defaultValue="val" disabled />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["disabled-field"]).toBeUndefined();
  });

  it("includes readOnly input in FormData", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Input name="ro" defaultValue="locked" readOnly />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["ro"]).toBe("locked");
  });

  it("submits controlled value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      const [val, setVal] = useState("initial");
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Input
            name="ctrl"
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
            }}
          />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["ctrl"]).toBe("initial");
  });

  it("submits input type=email", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Input name="email" type="email" defaultValue="a@b.com" />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["email"]).toBe("a@b.com");
  });
});

// ─── Textarea: form submission ──────────────────────────────────────

describe("Form: Textarea", () => {
  it("submits textarea value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Textarea name="message" defaultValue="Hello world" />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["message"]).toBe("Hello world");
  });

  it("excludes disabled textarea (disabled attribute is set)", () => {
    const { container } = render(
      <form>
        <Textarea name="msg" defaultValue="val" disabled />
      </form>,
    );
    const ta = container.querySelector("textarea")!;
    expect(ta.disabled).toBe(true);
    // Native browser excludes disabled textareas from FormData;
    // happy-dom does not fully replicate this, so we verify the attribute.
  });

  it("includes readOnly textarea", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Textarea name="msg" defaultValue="locked" readOnly />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["msg"]).toBe("locked");
  });
});

// ─── Checkbox: form submission ──────────────────────────────────────

describe("Form: Checkbox", () => {
  it("submits value when checked", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Checkbox name="agree" value="yes" defaultChecked>
            Agree
          </Checkbox>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["agree"]).toBe("yes");
  });

  it("omits unchecked checkbox from FormData", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Checkbox name="agree" value="yes">
            Agree
          </Checkbox>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["agree"]).toBeUndefined();
  });

  it("uses default value 'on' when no value prop", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Checkbox name="flag" defaultChecked>
            Flag
          </Checkbox>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["flag"]).toBe("on");
  });

  it("excludes disabled checked checkbox", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Checkbox name="agree" defaultChecked disabled>
            Agree
          </Checkbox>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["agree"]).toBeUndefined();
  });

  it("toggles and submits updated state", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Checkbox name="opt" value="yes">
            Opt in
          </Checkbox>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    const { container } = render(<Form />);
    // Check it
    await user.click(container.querySelector('input[type="checkbox"]')!);
    await user.click(screen.getByText("Go"));
    expect(data["opt"]).toBe("yes");
  });
});

// ─── RadioGroup: form submission ────────────────────────────────────

describe("Form: RadioGroup", () => {
  it("submits selected radio value", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <RadioGroup name="color" defaultValue="blue">
            <Radio value="red">Red</Radio>
            <Radio value="blue">Blue</Radio>
            <Radio value="green">Green</Radio>
          </RadioGroup>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["color"]).toBe("blue");
  });

  it("omits when no radio selected", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <RadioGroup name="color">
            <Radio value="red">Red</Radio>
            <Radio value="blue">Blue</Radio>
          </RadioGroup>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["color"]).toBeUndefined();
  });

  it("submits changed selection", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <RadioGroup name="size" defaultValue="sm">
            <Radio value="sm">Small</Radio>
            <Radio value="lg">Large</Radio>
          </RadioGroup>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    const { container } = render(<Form />);
    // Switch to large
    await user.click(container.querySelectorAll('input[type="radio"]')[1]!);
    await user.click(screen.getByText("Go"));
    expect(data["size"]).toBe("lg");
  });

  it("excludes disabled group", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <RadioGroup name="color" defaultValue="red" disabled>
            <Radio value="red">Red</Radio>
            <Radio value="blue">Blue</Radio>
          </RadioGroup>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["color"]).toBeUndefined();
  });
});

// ─── Switch: form submission ────────────────────────────────────────

describe("Form: Switch", () => {
  it("submits value when checked", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Switch name="notify" value="yes" defaultChecked>
            Notify
          </Switch>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["notify"]).toBe("yes");
  });

  it("omits unchecked switch", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Switch name="notify" value="yes">
            Notify
          </Switch>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["notify"]).toBeUndefined();
  });

  it("toggles and submits updated state", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Switch name="dark" value="on">
            Dark mode
          </Switch>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    const { container } = render(<Form />);
    // Toggle on
    await user.click(container.querySelector('button[role="switch"]')!);
    await user.click(screen.getByText("Go"));
    expect(data["dark"]).toBe("on");
  });

  it("excludes disabled switch", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Switch name="notify" value="yes" defaultChecked disabled>
            Notify
          </Switch>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["notify"]).toBeUndefined();
  });
});

// ─── Combined form ──────────────────────────────────────────────────

describe("Form: combined controls", () => {
  it("submits all controls in one form", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function FullForm() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Input name="username" defaultValue="alice" />
          <Textarea name="bio" defaultValue="Hello" />
          <Checkbox name="agree" value="yes" defaultChecked>
            Agree
          </Checkbox>
          <RadioGroup name="plan" defaultValue="pro">
            <Radio value="free">Free</Radio>
            <Radio value="pro">Pro</Radio>
          </RadioGroup>
          <Switch name="notify" value="on" defaultChecked>
            Notify
          </Switch>
          <button type="submit">Submit</button>
        </form>
      );
    }
    FullForm.displayName = "FullForm";
    render(<FullForm />);
    await user.click(screen.getByText("Submit"));
    expect(data["username"]).toBe("alice");
    expect(data["bio"]).toBe("Hello");
    expect(data["agree"]).toBe("yes");
    expect(data["plan"]).toBe("pro");
    expect(data["notify"]).toBe("on");
  });

  it("disabled Field excludes controls from FormData", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Field disabled>
            <Label>Name</Label>
            <Input name="name" defaultValue="bob" />
          </Field>
          <Input name="other" defaultValue="visible" />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["name"]).toBeUndefined();
    expect(data["other"]).toBe("visible");
  });
});

// ─── Form reset ─────────────────────────────────────────────────────

describe("Form: reset", () => {
  it("resets input to defaultValue", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Input name="name" defaultValue="initial" data-testid="input" />
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByTestId("input");
    await user.clear(input);
    await user.type(input, "changed");
    expect(input.value).toBe("changed");
    await user.click(screen.getByText("Reset"));
    expect(input.value).toBe("initial");
  });

  it("resets textarea to defaultValue", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Textarea name="msg" defaultValue="original" data-testid="ta" />
        <button type="reset">Reset</button>
      </form>,
    );
    const ta = screen.getByTestId("ta");
    await user.clear(ta);
    await user.type(ta, "new");
    expect(ta.value).toBe("new");
    await user.click(screen.getByText("Reset"));
    expect(ta.value).toBe("original");
  });
});

// ─── Nested Field forms ─────────────────────────────────────────────

describe("Form: nested Fields", () => {
  it("multiple Fields in one form submit independently", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Field id="f1" required>
            <Label>First</Label>
            <Input name="first" defaultValue="one" />
          </Field>
          <Field id="f2">
            <Label>Second</Label>
            <Input name="second" defaultValue="two" />
          </Field>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["first"]).toBe("one");
    expect(data["second"]).toBe("two");
  });

  it("Field disabled only affects its own controls", async () => {
    const user = userEvent.setup();
    let data: Record<string, string | string[]> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            data = getFormData(e.currentTarget);
          }}
        >
          <Field disabled>
            <Input name="disabled-input" defaultValue="x" />
          </Field>
          <Field>
            <Input name="enabled-input" defaultValue="y" />
          </Field>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["disabled-input"]).toBeUndefined();
    expect(data["enabled-input"]).toBe("y");
  });
});
