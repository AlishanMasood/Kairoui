import { describe, it, expect, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Field } from "./field";
import { Label } from "./label";
import { FieldDescription } from "./field-description";
import { FieldError } from "./field-error";
import { useFieldContext } from "./field-context";

afterEach(cleanup);

// Helper: renders a control that reads field context and displays its props
function FieldConsumer({ testId = "control" }: { testId?: string }) {
  const ctx = useFieldContext();
  if (!ctx) return <span data-testid={testId}>no-context</span>;
  return (
    <input
      data-testid={testId}
      id={ctx.fieldId}
      aria-labelledby={ctx.hasLabel ? ctx.labelId : undefined}
      aria-describedby={
        [ctx.hasDescription ? ctx.descriptionId : "", ctx.hasError ? ctx.errorId : ""]
          .filter(Boolean)
          .join(" ") || undefined
      }
      aria-required={ctx.required ? "true" : undefined}
      aria-invalid={ctx.invalid ? "true" : undefined}
      disabled={ctx.disabled}
      readOnly={ctx.readOnly}
    />
  );
}
FieldConsumer.displayName = "FieldConsumer";

// ─── Field rendering ────────────────────────────────────────────────

describe("Field: rendering", () => {
  it("renders a div with data-kui-component", () => {
    render(<Field data-testid="field">content</Field>);
    const el = screen.getByTestId("field");
    expect(el.tagName).toBe("DIV");
    expect(el.getAttribute("data-kui-component")).toBe("Field");
  });

  it("renders children", () => {
    render(<Field data-testid="field">hello</Field>);
    expect(screen.getByTestId("field").textContent).toContain("hello");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Field ref={ref}>x</Field>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("passes through className and style", () => {
    render(
      <Field data-testid="field" className="custom" style={{ padding: "8px" }}>
        x
      </Field>,
    );
    const el = screen.getByTestId("field");
    expect(el.className).toContain("custom");
    expect(el.style.padding).toBe("8px");
  });

  it("sets data-invalid when validationState is invalid", () => {
    render(
      <Field data-testid="field" validationState="invalid">
        x
      </Field>,
    );
    expect(screen.getByTestId("field").hasAttribute("data-invalid")).toBe(true);
  });

  it("does not set data-invalid when valid", () => {
    render(
      <Field data-testid="field" validationState="valid">
        x
      </Field>,
    );
    expect(screen.getByTestId("field").hasAttribute("data-invalid")).toBe(false);
  });

  it("sets data-disabled when disabled", () => {
    render(
      <Field data-testid="field" disabled>
        x
      </Field>,
    );
    expect(screen.getByTestId("field").hasAttribute("data-disabled")).toBe(true);
  });
});

// ─── Label ──────────────────────────────────────────────────────────

describe("Label", () => {
  it("renders a label element", () => {
    render(
      <Field>
        <Label data-testid="label">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("label").tagName).toBe("LABEL");
  });

  it("has data-kui-component", () => {
    render(
      <Field>
        <Label data-testid="label">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("label").getAttribute("data-kui-component")).toBe("Label");
  });

  it("gets id from field context", () => {
    render(
      <Field id="my-field">
        <Label data-testid="label">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("label").getAttribute("id")).toBe("my-field-label");
  });

  it("htmlFor points to field id", () => {
    render(
      <Field id="my-field">
        <Label data-testid="label">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("label").getAttribute("for")).toBe("my-field");
  });

  it("sets data-required when field is required", () => {
    render(
      <Field required>
        <Label data-testid="label">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("label").hasAttribute("data-required")).toBe(true);
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLLabelElement>();
    render(
      <Field>
        <Label ref={ref}>Name</Label>
      </Field>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("renders outside Field without crashing", () => {
    render(<Label data-testid="label">Standalone</Label>);
    expect(screen.getByTestId("label").tagName).toBe("LABEL");
    expect(screen.getByTestId("label").getAttribute("id")).toBeNull();
  });
});

// ─── FieldDescription ───────────────────────────────────────────────

describe("FieldDescription", () => {
  it("renders a span element", () => {
    render(
      <Field>
        <FieldDescription data-testid="desc">Helper text</FieldDescription>
      </Field>,
    );
    expect(screen.getByTestId("desc").tagName).toBe("SPAN");
  });

  it("has data-kui-component", () => {
    render(
      <Field>
        <FieldDescription data-testid="desc">Helper</FieldDescription>
      </Field>,
    );
    expect(screen.getByTestId("desc").getAttribute("data-kui-component")).toBe("FieldDescription");
  });

  it("gets id from field context", () => {
    render(
      <Field id="my-field">
        <FieldDescription data-testid="desc">Helper</FieldDescription>
      </Field>,
    );
    expect(screen.getByTestId("desc").getAttribute("id")).toBe("my-field-desc");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Field>
        <FieldDescription ref={ref}>Helper</FieldDescription>
      </Field>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("renders outside Field without crashing", () => {
    render(<FieldDescription data-testid="desc">Standalone</FieldDescription>);
    expect(screen.getByTestId("desc").tagName).toBe("SPAN");
  });
});

// ─── FieldError ─────────────────────────────────────────────────────

describe("FieldError", () => {
  it("renders a span element", () => {
    render(
      <Field validationState="invalid">
        <FieldError data-testid="err">Required</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").tagName).toBe("SPAN");
  });

  it("has data-kui-component", () => {
    render(
      <Field validationState="invalid">
        <FieldError data-testid="err">Required</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").getAttribute("data-kui-component")).toBe("FieldError");
  });

  it("gets id from field context", () => {
    render(
      <Field id="my-field" validationState="invalid">
        <FieldError data-testid="err">Required</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").getAttribute("id")).toBe("my-field-error");
  });

  it("has role=alert", () => {
    render(
      <Field validationState="invalid">
        <FieldError data-testid="err">Error</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").getAttribute("role")).toBe("alert");
  });

  it("has aria-live=assertive", () => {
    render(
      <Field validationState="invalid">
        <FieldError data-testid="err">Error</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").getAttribute("aria-live")).toBe("assertive");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Field validationState="invalid">
        <FieldError ref={ref}>Error</FieldError>
      </Field>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

// ─── ID generation and ARIA relationships ───────────────────────────

describe("Field: ARIA relationships", () => {
  it("generates stable IDs from consumer-provided id", () => {
    render(
      <Field id="username">
        <Label data-testid="label">Username</Label>
        <FieldDescription data-testid="desc">Enter username</FieldDescription>
        <FieldError data-testid="err">Required</FieldError>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("label").getAttribute("id")).toBe("username-label");
    expect(screen.getByTestId("desc").getAttribute("id")).toBe("username-desc");
    expect(screen.getByTestId("err").getAttribute("id")).toBe("username-error");
    expect(screen.getByTestId("control").getAttribute("id")).toBe("username");
  });

  it("control gets aria-labelledby pointing to label", () => {
    render(
      <Field id="f1">
        <Label>Name</Label>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-labelledby")).toBe("f1-label");
  });

  it("control gets aria-describedby pointing to description", () => {
    render(
      <Field id="f1">
        <FieldDescription>Help</FieldDescription>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-describedby")).toBe("f1-desc");
  });

  it("control gets aria-describedby with both description and error", () => {
    render(
      <Field id="f1" validationState="invalid">
        <FieldDescription>Help</FieldDescription>
        <FieldError>Required</FieldError>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-describedby")).toBe("f1-desc f1-error");
  });
});

// ─── State propagation ──────────────────────────────────────────────

describe("Field: state propagation", () => {
  it("propagates disabled to control", () => {
    render(
      <Field disabled>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control")).toBeDisabled();
  });

  it("propagates readOnly to control", () => {
    render(
      <Field readOnly>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control")).toHaveAttribute("readonly");
  });

  it("propagates required to control", () => {
    render(
      <Field required>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-required")).toBe("true");
  });

  it("propagates invalid to control", () => {
    render(
      <Field validationState="invalid">
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-invalid")).toBe("true");
  });

  it("does not set aria-invalid when valid", () => {
    render(
      <Field validationState="valid">
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-invalid")).toBeNull();
  });
});

// ─── Multiple fields isolation ──────────────────────────────────────

describe("Field: isolation", () => {
  it("two fields have different IDs", () => {
    render(
      <>
        <Field id="field-a">
          <Label data-testid="label-a">A</Label>
          <FieldConsumer testId="control-a" />
        </Field>
        <Field id="field-b">
          <Label data-testid="label-b">B</Label>
          <FieldConsumer testId="control-b" />
        </Field>
      </>,
    );
    expect(screen.getByTestId("label-a").getAttribute("id")).toBe("field-a-label");
    expect(screen.getByTestId("label-b").getAttribute("id")).toBe("field-b-label");
    expect(screen.getByTestId("control-a").getAttribute("id")).toBe("field-a");
    expect(screen.getByTestId("control-b").getAttribute("id")).toBe("field-b");
  });

  it("nested fields do not leak context", () => {
    render(
      <Field id="outer">
        <Label data-testid="outer-label">Outer</Label>
        <Field id="inner">
          <Label data-testid="inner-label">Inner</Label>
          <FieldConsumer testId="inner-control" />
        </Field>
      </Field>,
    );
    expect(screen.getByTestId("inner-label").getAttribute("for")).toBe("inner");
    expect(screen.getByTestId("inner-control").getAttribute("id")).toBe("inner");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Field: SSR", () => {
  it("renders complete field to string", () => {
    const html = renderToString(
      <Field id="email" required validationState="invalid">
        <Label>Email</Label>
        <FieldDescription>Your work email</FieldDescription>
        <FieldError>Email is required</FieldError>
      </Field>,
    );
    expect(html).toContain('data-kui-component="Field"');
    expect(html).toContain('id="email-label"');
    expect(html).toContain('for="email"');
    expect(html).toContain('id="email-desc"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("data-invalid");
    expect(html).toContain("data-required");
  });

  it("generates stable IDs without consumer id", () => {
    const html = renderToString(
      <Field>
        <Label>Name</Label>
      </Field>,
    );
    // Should contain a kui-field prefix-based ID
    expect(html).toContain("kui-field-");
    expect(html).toContain("-label");
  });

  it("two fields produce different IDs in SSR", () => {
    const html = renderToString(
      <>
        <Field id="a">
          <Label>A</Label>
        </Field>
        <Field id="b">
          <Label>B</Label>
        </Field>
      </>,
    );
    expect(html).toContain('id="a-label"');
    expect(html).toContain('id="b-label"');
  });
});
