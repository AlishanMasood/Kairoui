import { describe, it, expect, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { FieldDescription } from "./field-description";
import { FieldError } from "./field-error";
import { Field } from "./field";
import { useFieldContext } from "./field-context";

afterEach(cleanup);

// Helper: reads field context and renders an input with ARIA attributes
function FieldConsumer({ testId = "control" }: { testId?: string }) {
  const ctx = useFieldContext();
  if (!ctx) return <span data-testid={testId}>no-ctx</span>;
  return (
    <input
      data-testid={testId}
      id={ctx.fieldId}
      aria-describedby={
        [ctx.hasDescription ? ctx.descriptionId : "", ctx.hasError ? ctx.errorId : ""]
          .filter(Boolean)
          .join(" ") || undefined
      }
      aria-errormessage={ctx.hasError ? ctx.errorId : undefined}
      aria-invalid={ctx.invalid ? "true" : undefined}
    />
  );
}
FieldConsumer.displayName = "FieldConsumer";

// ─── FieldDescription: standalone ───────────────────────────────────

describe("FieldDescription: standalone", () => {
  it("renders a span element", () => {
    render(<FieldDescription data-testid="desc">Help text</FieldDescription>);
    expect(screen.getByTestId("desc").tagName).toBe("SPAN");
  });

  it("has data-kui-component", () => {
    render(<FieldDescription data-testid="desc">Help</FieldDescription>);
    expect(screen.getByTestId("desc").getAttribute("data-kui-component")).toBe("FieldDescription");
  });

  it("renders children", () => {
    render(<FieldDescription data-testid="desc">Enter your email</FieldDescription>);
    expect(screen.getByTestId("desc").textContent).toBe("Enter your email");
  });

  it("accepts consumer id", () => {
    render(
      <FieldDescription data-testid="desc" id="custom-desc">
        Help
      </FieldDescription>,
    );
    expect(screen.getByTestId("desc").getAttribute("id")).toBe("custom-desc");
  });

  it("has no id when standalone without consumer id", () => {
    render(<FieldDescription data-testid="desc">Help</FieldDescription>);
    expect(screen.getByTestId("desc").getAttribute("id")).toBeNull();
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<FieldDescription ref={ref}>Help</FieldDescription>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("passes className", () => {
    render(
      <FieldDescription data-testid="desc" className="custom">
        Help
      </FieldDescription>,
    );
    expect(screen.getByTestId("desc").className).toContain("custom");
  });

  it("passes style", () => {
    render(
      <FieldDescription data-testid="desc" style={{ color: "gray" }}>
        Help
      </FieldDescription>,
    );
    expect(screen.getByTestId("desc").style.color).toBe("gray");
  });

  it("does not have role=alert", () => {
    render(<FieldDescription data-testid="desc">Help</FieldDescription>);
    expect(screen.getByTestId("desc").getAttribute("role")).toBeNull();
  });
});

// ─── FieldDescription: within Field ─────────────────────────────────

describe("FieldDescription: within Field", () => {
  it("gets id from field context", () => {
    render(
      <Field id="email">
        <FieldDescription data-testid="desc">Enter email</FieldDescription>
      </Field>,
    );
    expect(screen.getByTestId("desc").getAttribute("id")).toBe("email-desc");
  });

  it("consumer id overrides context id", () => {
    render(
      <Field id="email">
        <FieldDescription data-testid="desc" id="my-desc">
          Enter email
        </FieldDescription>
      </Field>,
    );
    expect(screen.getByTestId("desc").getAttribute("id")).toBe("my-desc");
  });

  it("control receives aria-describedby pointing to description", () => {
    render(
      <Field id="email">
        <FieldDescription>Helper</FieldDescription>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-describedby")).toBe("email-desc");
  });

  it("sets data-disabled when field is disabled", () => {
    render(
      <Field disabled>
        <FieldDescription data-testid="desc">Help</FieldDescription>
      </Field>,
    );
    expect(screen.getByTestId("desc").hasAttribute("data-disabled")).toBe(true);
  });

  it("does not set data-disabled when field is enabled", () => {
    render(
      <Field>
        <FieldDescription data-testid="desc">Help</FieldDescription>
      </Field>,
    );
    expect(screen.getByTestId("desc").hasAttribute("data-disabled")).toBe(false);
  });

  it("forwards ref inside Field", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Field>
        <FieldDescription ref={ref}>Help</FieldDescription>
      </Field>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

// ─── FieldError: standalone ─────────────────────────────────────────

describe("FieldError: standalone", () => {
  it("renders a span element", () => {
    render(<FieldError data-testid="err">Required</FieldError>);
    expect(screen.getByTestId("err").tagName).toBe("SPAN");
  });

  it("has data-kui-component", () => {
    render(<FieldError data-testid="err">Required</FieldError>);
    expect(screen.getByTestId("err").getAttribute("data-kui-component")).toBe("FieldError");
  });

  it("renders children", () => {
    render(<FieldError data-testid="err">Email is required</FieldError>);
    expect(screen.getByTestId("err").textContent).toBe("Email is required");
  });

  it("has role=alert", () => {
    render(<FieldError data-testid="err">Error</FieldError>);
    expect(screen.getByTestId("err").getAttribute("role")).toBe("alert");
  });

  it("has aria-live=assertive", () => {
    render(<FieldError data-testid="err">Error</FieldError>);
    expect(screen.getByTestId("err").getAttribute("aria-live")).toBe("assertive");
  });

  it("accepts consumer id", () => {
    render(
      <FieldError data-testid="err" id="custom-err">
        Error
      </FieldError>,
    );
    expect(screen.getByTestId("err").getAttribute("id")).toBe("custom-err");
  });

  it("has no id when standalone without consumer id", () => {
    render(<FieldError data-testid="err">Error</FieldError>);
    expect(screen.getByTestId("err").getAttribute("id")).toBeNull();
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<FieldError ref={ref}>Error</FieldError>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("passes className", () => {
    render(
      <FieldError data-testid="err" className="error-text">
        Error
      </FieldError>,
    );
    expect(screen.getByTestId("err").className).toContain("error-text");
  });

  it("passes style", () => {
    render(
      <FieldError data-testid="err" style={{ color: "red" }}>
        Error
      </FieldError>,
    );
    expect(screen.getByTestId("err").style.color).toBe("red");
  });
});

// ─── FieldError: within Field ───────────────────────────────────────

describe("FieldError: within Field", () => {
  it("gets id from field context", () => {
    render(
      <Field id="email" validationState="invalid">
        <FieldError data-testid="err">Required</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").getAttribute("id")).toBe("email-error");
  });

  it("consumer id overrides context id", () => {
    render(
      <Field id="email" validationState="invalid">
        <FieldError data-testid="err" id="my-err">
          Required
        </FieldError>
      </Field>,
    );
    expect(screen.getByTestId("err").getAttribute("id")).toBe("my-err");
  });

  it("control receives aria-describedby including error", () => {
    render(
      <Field id="email" validationState="invalid">
        <FieldError>Required</FieldError>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-describedby")).toBe("email-error");
  });

  it("control receives aria-errormessage pointing to error", () => {
    render(
      <Field id="email" validationState="invalid">
        <FieldError>Required</FieldError>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-errormessage")).toBe("email-error");
  });

  it("control receives aria-invalid when field is invalid", () => {
    render(
      <Field validationState="invalid">
        <FieldError>Required</FieldError>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-invalid")).toBe("true");
  });

  it("control does not get aria-invalid when valid", () => {
    render(
      <Field validationState="valid">
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-invalid")).toBeNull();
  });

  it("forwards ref inside Field", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Field validationState="invalid">
        <FieldError ref={ref}>Error</FieldError>
      </Field>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

// ─── Combined: description + error ──────────────────────────────────

describe("FieldDescription + FieldError: combined", () => {
  it("control aria-describedby includes both IDs", () => {
    render(
      <Field id="pw" validationState="invalid">
        <FieldDescription>Min 8 characters</FieldDescription>
        <FieldError>Too short</FieldError>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-describedby")).toBe("pw-desc pw-error");
  });

  it("description and error have different IDs", () => {
    render(
      <Field id="pw" validationState="invalid">
        <FieldDescription data-testid="desc">Min 8 characters</FieldDescription>
        <FieldError data-testid="err">Too short</FieldError>
      </Field>,
    );
    expect(screen.getByTestId("desc").getAttribute("id")).toBe("pw-desc");
    expect(screen.getByTestId("err").getAttribute("id")).toBe("pw-error");
  });

  it("only description in aria-describedby when no error rendered", () => {
    render(
      <Field id="pw">
        <FieldDescription>Min 8 characters</FieldDescription>
        <FieldConsumer />
      </Field>,
    );
    expect(screen.getByTestId("control").getAttribute("aria-describedby")).toBe("pw-desc");
    expect(screen.getByTestId("control").getAttribute("aria-errormessage")).toBeNull();
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("FieldDescription + FieldError: SSR", () => {
  it("FieldDescription renders to string", () => {
    const html = renderToString(
      <Field id="name">
        <FieldDescription>Your full name</FieldDescription>
      </Field>,
    );
    expect(html).toContain('id="name-desc"');
    expect(html).toContain('data-kui-component="FieldDescription"');
    expect(html).toContain("Your full name");
  });

  it("FieldError renders to string with alert role", () => {
    const html = renderToString(
      <Field id="name" validationState="invalid">
        <FieldError>Name is required</FieldError>
      </Field>,
    );
    expect(html).toContain('id="name-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("Name is required");
  });

  it("standalone FieldDescription renders without id", () => {
    const html = renderToString(<FieldDescription>Help</FieldDescription>);
    expect(html).toContain("Help");
    expect(html).not.toContain('id="');
  });

  it("standalone FieldError renders with alert semantics", () => {
    const html = renderToString(<FieldError>Error</FieldError>);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Error");
  });

  it("SSR output is deterministic", () => {
    const a = renderToString(
      <Field id="x" validationState="invalid">
        <FieldDescription>Help</FieldDescription>
        <FieldError>Err</FieldError>
      </Field>,
    );
    const b = renderToString(
      <Field id="x" validationState="invalid">
        <FieldDescription>Help</FieldDescription>
        <FieldError>Err</FieldError>
      </Field>,
    );
    expect(a).toBe(b);
  });
});
