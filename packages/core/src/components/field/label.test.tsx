import { describe, it, expect, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Label } from "./label";
import { Field } from "./field";

afterEach(cleanup);

// ─── Standalone usage ───────────────────────────────────────────────

describe("Label: standalone", () => {
  it("renders a native label element", () => {
    render(<Label data-testid="lbl">Username</Label>);
    expect(screen.getByTestId("lbl").tagName).toBe("LABEL");
  });

  it("has data-kui-component", () => {
    render(<Label data-testid="lbl">Username</Label>);
    expect(screen.getByTestId("lbl").getAttribute("data-kui-component")).toBe("Label");
  });

  it("renders children", () => {
    render(<Label data-testid="lbl">Username</Label>);
    expect(screen.getByTestId("lbl").textContent).toBe("Username");
  });

  it("accepts consumer htmlFor", () => {
    render(
      <Label data-testid="lbl" htmlFor="my-input">
        Name
      </Label>,
    );
    expect(screen.getByTestId("lbl").getAttribute("for")).toBe("my-input");
  });

  it("accepts consumer id", () => {
    render(
      <Label data-testid="lbl" id="custom-id">
        Name
      </Label>,
    );
    expect(screen.getByTestId("lbl").getAttribute("id")).toBe("custom-id");
  });

  it("does not set id or htmlFor when no context and no props", () => {
    render(<Label data-testid="lbl">Standalone</Label>);
    expect(screen.getByTestId("lbl").getAttribute("id")).toBeNull();
    expect(screen.getByTestId("lbl").getAttribute("for")).toBeNull();
  });

  it("does not set data-required standalone", () => {
    render(<Label data-testid="lbl">Name</Label>);
    expect(screen.getByTestId("lbl").hasAttribute("data-required")).toBe(false);
  });

  it("does not set data-disabled standalone", () => {
    render(<Label data-testid="lbl">Name</Label>);
    expect(screen.getByTestId("lbl").hasAttribute("data-disabled")).toBe(false);
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Name</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("passes className", () => {
    render(
      <Label data-testid="lbl" className="custom">
        Name
      </Label>,
    );
    expect(screen.getByTestId("lbl").className).toContain("custom");
  });

  it("passes style", () => {
    render(
      <Label data-testid="lbl" style={{ fontWeight: "bold" }}>
        Name
      </Label>,
    );
    expect(screen.getByTestId("lbl").style.fontWeight).toBe("bold");
  });
});

// ─── Field-integrated usage ─────────────────────────────────────────

describe("Label: within Field", () => {
  it("gets id from field context", () => {
    render(
      <Field id="email">
        <Label data-testid="lbl">Email</Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").getAttribute("id")).toBe("email-label");
  });

  it("htmlFor points to field id", () => {
    render(
      <Field id="email">
        <Label data-testid="lbl">Email</Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").getAttribute("for")).toBe("email");
  });

  it("consumer id overrides context id", () => {
    render(
      <Field id="email">
        <Label data-testid="lbl" id="my-custom-label">
          Email
        </Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").getAttribute("id")).toBe("my-custom-label");
  });

  it("consumer htmlFor overrides context htmlFor", () => {
    render(
      <Field id="email">
        <Label data-testid="lbl" htmlFor="other-input">
          Email
        </Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").getAttribute("for")).toBe("other-input");
  });

  it("sets data-required when field is required", () => {
    render(
      <Field required>
        <Label data-testid="lbl">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").hasAttribute("data-required")).toBe(true);
  });

  it("does not set data-required when field is not required", () => {
    render(
      <Field>
        <Label data-testid="lbl">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").hasAttribute("data-required")).toBe(false);
  });

  it("sets data-disabled when field is disabled", () => {
    render(
      <Field disabled>
        <Label data-testid="lbl">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").hasAttribute("data-disabled")).toBe(true);
  });

  it("does not set data-disabled when field is not disabled", () => {
    render(
      <Field>
        <Label data-testid="lbl">Name</Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").hasAttribute("data-disabled")).toBe(false);
  });

  it("forwards ref inside Field", () => {
    const ref = createRef<HTMLLabelElement>();
    render(
      <Field>
        <Label ref={ref}>Name</Label>
      </Field>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("merges consumer className inside Field", () => {
    render(
      <Field>
        <Label data-testid="lbl" className="custom-label">
          Name
        </Label>
      </Field>,
    );
    expect(screen.getByTestId("lbl").className).toContain("custom-label");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Label: SSR", () => {
  it("renders standalone to string", () => {
    const html = renderToString(<Label htmlFor="x">Name</Label>);
    expect(html).toContain("<label");
    expect(html).toContain('for="x"');
    expect(html).toContain("Name");
    expect(html).toContain('data-kui-component="Label"');
  });

  it("renders inside Field to string with generated ids", () => {
    const html = renderToString(
      <Field id="email" required disabled>
        <Label>Email</Label>
      </Field>,
    );
    expect(html).toContain('id="email-label"');
    expect(html).toContain('for="email"');
    expect(html).toContain("data-required");
    expect(html).toContain("data-disabled");
  });

  it("SSR output is hydration-safe (no random values)", () => {
    const a = renderToString(
      <Field id="f1">
        <Label>Name</Label>
      </Field>,
    );
    const b = renderToString(
      <Field id="f1">
        <Label>Name</Label>
      </Field>,
    );
    expect(a).toBe(b);
  });
});
