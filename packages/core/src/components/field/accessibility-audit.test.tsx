import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Button } from "../button/button";
import { IconButton } from "../icon-button/icon-button";
import { Input } from "../input/input";
import { Textarea } from "../textarea/textarea";
import { Checkbox } from "../checkbox/checkbox";
import { Radio } from "../radio/radio";
import { RadioGroup } from "../radio-group/radio-group";
import { Switch } from "../switch/switch";
import { Field } from "./field";
import { Label } from "./label";
import { FieldDescription } from "./field-description";
import { FieldError } from "./field-error";

afterEach(cleanup);

// ─── Button accessibility ───────────────────────────────────────────

describe("A11y: Button", () => {
  it("renders native <button> with implicit role", () => {
    render(<Button data-testid="btn">Save</Button>);
    expect(screen.getByTestId("btn").tagName).toBe("BUTTON");
  });

  it("supports aria-label", () => {
    render(
      <Button data-testid="btn" aria-label="Close dialog">
        ×
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-label")).toBe("Close dialog");
  });

  it("sets aria-busy when loading", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-busy")).toBe("true");
  });

  it("uses native disabled for button element", () => {
    render(
      <Button data-testid="btn" disabled>
        Save
      </Button>,
    );
    expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(true);
  });

  it("uses aria-disabled for non-button targets", () => {
    render(
      <Button as="a" href="#" data-testid="btn" disabled>
        Link
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── IconButton accessibility ───────────────────────────────────────

describe("A11y: IconButton", () => {
  it("passes aria-label to element", () => {
    const { container } = render(
      <IconButton aria-label="Close">
        <svg />
      </IconButton>,
    );
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("aria-label")).toBe("Close");
  });

  it("icon slot is aria-hidden", () => {
    const { container } = render(
      <IconButton aria-label="Close">
        <svg />
      </IconButton>,
    );
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});

// ─── Checkbox accessibility ─────────────────────────────────────────

describe("A11y: Checkbox", () => {
  it("uses native input[type=checkbox]", () => {
    const { container } = render(<Checkbox>Accept</Checkbox>);
    expect(container.querySelector('input[type="checkbox"]')).not.toBeNull();
  });

  it("aria-checked=mixed when indeterminate", () => {
    const { container } = render(<Checkbox indeterminate>All</Checkbox>);
    expect(container.querySelector("input")!.getAttribute("aria-checked")).toBe("mixed");
  });

  it("aria-checked=true when checked", () => {
    const { container } = render(
      <Checkbox checked onCheckedChange={() => {}}>
        X
      </Checkbox>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-checked")).toBe("true");
  });

  it("aria-required from Field", () => {
    const { container } = render(
      <Field required>
        <Checkbox>Accept</Checkbox>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-required")).toBe("true");
  });

  it("aria-errormessage from Field + FieldError", () => {
    const { container } = render(
      <Field id="terms" validationState="invalid">
        <Checkbox>Accept</Checkbox>
        <FieldError>Required</FieldError>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-errormessage")).toBe("terms-error");
  });

  it("aria-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Checkbox>Accept</Checkbox>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
  });

  it("aria-describedby includes description and error", () => {
    const { container } = render(
      <Field id="terms" validationState="invalid">
        <FieldDescription>Must agree</FieldDescription>
        <FieldError>Required</FieldError>
        <Checkbox>Accept</Checkbox>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-describedby")).toBe(
      "terms-desc terms-error",
    );
  });
});

// ─── Radio accessibility ────────────────────────────────────────────

describe("A11y: Radio", () => {
  it("uses native input[type=radio]", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector('input[type="radio"]')).not.toBeNull();
  });

  it("aria-required from Field", () => {
    const { container } = render(
      <Field required>
        <Radio value="a">A</Radio>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-required")).toBe("true");
  });

  it("aria-errormessage from Field + FieldError", () => {
    const { container } = render(
      <Field id="choice" validationState="invalid">
        <Radio value="a">A</Radio>
        <FieldError>Required</FieldError>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-errormessage")).toBe(
      "choice-error",
    );
  });

  it("aria-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Radio value="a">A</Radio>
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
  });
});

// ─── RadioGroup accessibility ───────────────────────────────────────

describe("A11y: RadioGroup", () => {
  it("has role=radiogroup", () => {
    render(
      <RadioGroup data-testid="rg">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("role")).toBe("radiogroup");
  });

  it("has aria-orientation", () => {
    render(
      <RadioGroup data-testid="rg" orientation="horizontal">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("aria-invalid from Field", () => {
    render(
      <Field validationState="invalid">
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-invalid")).toBe("true");
  });

  it("aria-errormessage from Field + FieldError", () => {
    render(
      <Field id="plan" validationState="invalid">
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
        <FieldError>Required</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-errormessage")).toBe("plan-error");
  });

  it("aria-required when required", () => {
    render(
      <RadioGroup data-testid="rg" required>
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-required")).toBe("true");
  });

  it("aria-disabled when disabled", () => {
    render(
      <RadioGroup data-testid="rg" disabled>
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Switch accessibility ───────────────────────────────────────────

describe("A11y: Switch", () => {
  it("has role=switch", () => {
    const { container } = render(<Switch>Notify</Switch>);
    expect(container.querySelector('[role="switch"]')).not.toBeNull();
  });

  it("aria-checked reflects state", () => {
    const { container } = render(<Switch defaultChecked>On</Switch>);
    expect(container.querySelector("button")!.getAttribute("aria-checked")).toBe("true");
  });

  it("aria-required from Field", () => {
    const { container } = render(
      <Field required>
        <Switch>Notify</Switch>
      </Field>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-required")).toBe("true");
  });

  it("aria-errormessage from Field + FieldError", () => {
    const { container } = render(
      <Field id="notify" validationState="invalid">
        <Switch>Notify</Switch>
        <FieldError>Required</FieldError>
      </Field>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-errormessage")).toBe(
      "notify-error",
    );
  });

  it("aria-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Switch>Notify</Switch>
      </Field>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-invalid")).toBe("true");
  });

  it("hidden form input is aria-hidden", () => {
    const { container } = render(<Switch name="notify">Notify</Switch>);
    const hidden = container.querySelector('input[type="checkbox"]');
    expect(hidden?.getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── Input accessibility ────────────────────────────────────────────

describe("A11y: Input", () => {
  it("gets aria-labelledby from Field + Label", () => {
    const { container } = render(
      <Field id="email">
        <Label>Email</Label>
        <Input />
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-labelledby")).toBe("email-label");
  });

  it("gets aria-describedby from Field + FieldDescription", () => {
    const { container } = render(
      <Field id="email">
        <FieldDescription>Work email</FieldDescription>
        <Input />
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-describedby")).toBe("email-desc");
  });

  it("gets aria-errormessage from Field + FieldError", () => {
    const { container } = render(
      <Field id="email" validationState="invalid">
        <FieldError>Required</FieldError>
        <Input />
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-errormessage")).toBe("email-error");
  });

  it("gets aria-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Input />
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
  });

  it("gets aria-required from Field", () => {
    const { container } = render(
      <Field required>
        <Input />
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-required")).toBe("true");
  });

  it("gets aria-readonly from Field", () => {
    const { container } = render(
      <Field readOnly>
        <Input />
      </Field>,
    );
    expect(container.querySelector("input")!.getAttribute("aria-readonly")).toBe("true");
  });
});

// ─── Textarea accessibility ─────────────────────────────────────────

describe("A11y: Textarea", () => {
  it("gets aria-required from Field", () => {
    const { container } = render(
      <Field required>
        <Textarea />
      </Field>,
    );
    expect(container.querySelector("textarea")!.getAttribute("aria-required")).toBe("true");
  });

  it("gets aria-errormessage from Field + FieldError", () => {
    const { container } = render(
      <Field id="msg" validationState="invalid">
        <FieldError>Required</FieldError>
        <Textarea />
      </Field>,
    );
    expect(container.querySelector("textarea")!.getAttribute("aria-errormessage")).toBe(
      "msg-error",
    );
  });
});

// ─── FieldError as live region ──────────────────────────────────────

describe("A11y: FieldError live region", () => {
  it("has role=alert", () => {
    render(
      <Field validationState="invalid">
        <FieldError data-testid="err">Error msg</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").getAttribute("role")).toBe("alert");
  });

  it("has aria-live=assertive", () => {
    render(
      <Field validationState="invalid">
        <FieldError data-testid="err">Error msg</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").getAttribute("aria-live")).toBe("assertive");
  });
});

// ─── SSR accessibility attributes ───────────────────────────────────

describe("A11y: SSR output", () => {
  it("Checkbox has aria-required in SSR", () => {
    const html = renderToString(
      <Field required>
        <Checkbox>Accept</Checkbox>
      </Field>,
    );
    expect(html).toContain('aria-required="true"');
  });

  it("RadioGroup has aria-invalid in SSR", () => {
    const html = renderToString(
      <Field validationState="invalid">
        <RadioGroup>
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(html).toContain('aria-invalid="true"');
  });

  it("Switch has aria-required in SSR", () => {
    const html = renderToString(
      <Field required>
        <Switch>Notify</Switch>
      </Field>,
    );
    expect(html).toContain('aria-required="true"');
  });
});
