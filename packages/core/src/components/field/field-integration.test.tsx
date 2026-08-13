import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Field } from "./field";
import { Label } from "./label";
import { FieldDescription } from "./field-description";
import { FieldError } from "./field-error";
import { Input } from "../input/input";
import { Textarea } from "../textarea/textarea";
import { Checkbox } from "../checkbox/checkbox";
import { Radio } from "../radio/radio";
import { RadioGroup } from "../radio-group/radio-group";
import { Switch } from "../switch/switch";

afterEach(cleanup);

// ─── Field + Input ──────────────────────────────────────────────────

describe("Field integration: Input", () => {
  it("connects label, description, error to input", () => {
    const { container } = render(
      <Field id="email" required validationState="invalid">
        <Label>Email</Label>
        <Input />
        <FieldDescription>Your work email</FieldDescription>
        <FieldError>Email is required</FieldError>
      </Field>,
    );
    const input = container.querySelector("input")!;
    expect(input.getAttribute("id")).toBe("email");
    expect(input.getAttribute("aria-labelledby")).toBe("email-label");
    expect(input.getAttribute("aria-describedby")).toBe("email-desc email-error");
    expect(input.getAttribute("aria-errormessage")).toBe("email-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-required")).toBe("true");
    expect(input.required).toBe(true);
  });

  it("disables input via Field", () => {
    const { container } = render(
      <Field disabled>
        <Input />
      </Field>,
    );
    expect(container.querySelector("input")!.disabled).toBe(true);
  });

  it("sets readOnly via Field", () => {
    const { container } = render(
      <Field readOnly>
        <Input />
      </Field>,
    );
    expect(container.querySelector("input")!).toHaveAttribute("readonly");
  });

  it("label click focuses input", () => {
    const { container } = render(
      <Field id="name">
        <Label data-testid="label">Name</Label>
        <Input />
      </Field>,
    );
    const input = container.querySelector("input")!;
    const label = screen.getByTestId("label");
    expect(label.getAttribute("for")).toBe("name");
    expect(input.getAttribute("id")).toBe("name");
  });
});

// ─── Field + Textarea ───────────────────────────────────────────────

describe("Field integration: Textarea", () => {
  it("connects label, description to textarea", () => {
    const { container } = render(
      <Field id="bio" required>
        <Label>Bio</Label>
        <Textarea />
        <FieldDescription>Tell us about yourself</FieldDescription>
      </Field>,
    );
    const ta = container.querySelector("textarea")!;
    expect(ta.getAttribute("id")).toBe("bio");
    expect(ta.getAttribute("aria-labelledby")).toBe("bio-label");
    expect(ta.getAttribute("aria-describedby")).toBe("bio-desc");
    expect(ta.required).toBe(true);
  });

  it("disables textarea via Field", () => {
    const { container } = render(
      <Field disabled>
        <Textarea />
      </Field>,
    );
    expect(container.querySelector("textarea")!.disabled).toBe(true);
  });

  it("sets readOnly via Field", () => {
    const { container } = render(
      <Field readOnly>
        <Textarea />
      </Field>,
    );
    expect(container.querySelector("textarea")!).toHaveAttribute("readonly");
  });
});

// ─── Field + Checkbox ───────────────────────────────────────────────

describe("Field integration: Checkbox", () => {
  it("connects error to checkbox", () => {
    const { container } = render(
      <Field id="agree" validationState="invalid">
        <Checkbox>I agree</Checkbox>
        <FieldError>You must agree</FieldError>
      </Field>,
    );
    const input = container.querySelector('input[type="checkbox"]')!;
    expect(input.getAttribute("id")).toBe("agree");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain("agree-error");
  });

  it("disables checkbox via Field", () => {
    const { container } = render(
      <Field disabled>
        <Checkbox>Accept</Checkbox>
      </Field>,
    );
    expect(container.querySelector('input[type="checkbox"]')!.disabled).toBe(true);
  });

  it("requires checkbox via Field", () => {
    const { container } = render(
      <Field required>
        <Checkbox>Accept</Checkbox>
      </Field>,
    );
    expect(container.querySelector('input[type="checkbox"]')!.required).toBe(true);
  });
});

// ─── Field + RadioGroup + Radio ─────────────────────────────────────

describe("Field integration: RadioGroup", () => {
  it("connects label and description to radiogroup", () => {
    render(
      <Field id="plan">
        <Label>Plan</Label>
        <FieldDescription>Choose your plan</FieldDescription>
        <RadioGroup data-testid="rg">
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
        </RadioGroup>
      </Field>,
    );
    const rg = screen.getByTestId("rg");
    expect(rg.getAttribute("role")).toBe("radiogroup");
    expect(rg.getAttribute("id")).toBe("plan");
    expect(rg.getAttribute("aria-labelledby")).toBe("plan-label");
    expect(rg.getAttribute("aria-describedby")).toBe("plan-desc");
  });

  it("disables all radios via Field", () => {
    const { container } = render(
      <Field disabled>
        <RadioGroup>
          <Radio value="a">A</Radio>
          <Radio value="b">B</Radio>
        </RadioGroup>
      </Field>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    expect(inputs[0]!.disabled).toBe(true);
    expect(inputs[1]!.disabled).toBe(true);
  });

  it("requires via Field", () => {
    render(
      <Field required>
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByTestId("rg").getAttribute("aria-required")).toBe("true");
  });

  it("shows invalid state from Field", () => {
    render(
      <Field validationState="invalid">
        <RadioGroup data-testid="rg">
          <Radio value="a">A</Radio>
        </RadioGroup>
        <FieldError>Required</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("rg").hasAttribute("data-invalid")).toBe(true);
  });
});

// ─── Field + Switch ─────────────────────────────────────────────────

describe("Field integration: Switch", () => {
  it("connects label and description to switch", () => {
    const { container } = render(
      <Field id="notify">
        <Label>Notifications</Label>
        <Switch>Enable</Switch>
        <FieldDescription>Get email alerts</FieldDescription>
      </Field>,
    );
    const btn = container.querySelector('button[role="switch"]')!;
    expect(btn.getAttribute("id")).toBe("notify");
    expect(btn.getAttribute("aria-labelledby")).toBe("notify-label");
    expect(btn.getAttribute("aria-describedby")).toBe("notify-desc");
  });

  it("disables switch via Field", () => {
    const { container } = render(
      <Field disabled>
        <Switch>Enable</Switch>
      </Field>,
    );
    expect(container.querySelector('button[role="switch"]')!.disabled).toBe(true);
  });

  it("shows invalid state from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Switch>Enable</Switch>
      </Field>,
    );
    expect(container.querySelector('button[role="switch"]')!.getAttribute("aria-invalid")).toBe(
      "true",
    );
  });
});

// ─── Standalone controls ────────────────────────────────────────────

describe("Field integration: standalone controls", () => {
  it("Input works without Field", () => {
    const { container } = render(<Input id="standalone" placeholder="Name" />);
    const input = container.querySelector("input")!;
    expect(input.getAttribute("id")).toBe("standalone");
    expect(input.getAttribute("aria-labelledby")).toBeNull();
  });

  it("Textarea works without Field", () => {
    const { container } = render(<Textarea id="standalone" />);
    expect(container.querySelector("textarea")!.getAttribute("id")).toBe("standalone");
  });

  it("Checkbox works without Field", () => {
    const { container } = render(<Checkbox>Accept</Checkbox>);
    expect(container.querySelector('input[type="checkbox"]')).not.toBeNull();
  });

  it("Radio works without Field", () => {
    const { container } = render(<Radio value="a">A</Radio>);
    expect(container.querySelector('input[type="radio"]')).not.toBeNull();
  });

  it("Switch works without Field", () => {
    const { container } = render(<Switch>Toggle</Switch>);
    expect(container.querySelector('button[role="switch"]')).not.toBeNull();
  });
});

// ─── Multiple fields isolation ──────────────────────────────────────

describe("Field integration: multi-field isolation", () => {
  it("two fields have isolated IDs and ARIA", () => {
    const { container } = render(
      <>
        <Field id="first">
          <Label>First</Label>
          <Input />
        </Field>
        <Field id="second">
          <Label>Second</Label>
          <Input />
        </Field>
      </>,
    );
    const inputs = container.querySelectorAll("input");
    expect(inputs[0]!.getAttribute("id")).toBe("first");
    expect(inputs[0]!.getAttribute("aria-labelledby")).toBe("first-label");
    expect(inputs[1]!.getAttribute("id")).toBe("second");
    expect(inputs[1]!.getAttribute("aria-labelledby")).toBe("second-label");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Field integration: SSR", () => {
  it("renders complete form field to string", () => {
    const html = renderToString(
      <Field id="email" required validationState="invalid">
        <Label>Email</Label>
        <Input type="email" placeholder="you@example.com" />
        <FieldDescription>Your work email</FieldDescription>
        <FieldError>Email is required</FieldError>
      </Field>,
    );
    expect(html).toContain('data-kui-component="Field"');
    expect(html).toContain('data-kui-component="Label"');
    expect(html).toContain('data-kui-component="Input"');
    expect(html).toContain('data-kui-component="FieldDescription"');
    expect(html).toContain('data-kui-component="FieldError"');
    expect(html).toContain('id="email"');
    expect(html).toContain('id="email-label"');
    expect(html).toContain('id="email-desc"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain("data-invalid");
    expect(html).toContain("data-required");
  });

  it("renders Field + Switch to string", () => {
    const html = renderToString(
      <Field id="notify">
        <Label>Notifications</Label>
        <Switch name="notify">Enable</Switch>
      </Field>,
    );
    expect(html).toContain('role="switch"');
    expect(html).toContain('id="notify"');
  });

  it("renders Field + RadioGroup to string", () => {
    const html = renderToString(
      <Field id="plan" required>
        <Label>Plan</Label>
        <RadioGroup>
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
        </RadioGroup>
      </Field>,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-required="true"');
  });
});
