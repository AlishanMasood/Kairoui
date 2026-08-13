import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  FieldContext,
  useFieldContext,
  useRequiredFieldContext,
  resolveFieldControlProps,
  resolveValidationDataAttr,
} from "./index";
import type { FieldContextValue } from "./index";

// ─── Fixtures ───────────────────────────────────────────────────────

function makeCtx(overrides: Partial<FieldContextValue> = {}): FieldContextValue {
  return {
    fieldId: "field-1",
    labelId: "field-1-label",
    descriptionId: "field-1-description",
    errorId: "field-1-error",
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    hasLabel: true,
    hasDescription: false,
    hasError: false,
    registerLabel: () => () => {},
    registerDescription: () => () => {},
    registerError: () => () => {},
    ...overrides,
  };
}

function wrapper(ctx: FieldContextValue) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(FieldContext.Provider, { value: ctx }, children);
  }
  Wrapper.displayName = "FieldContextTestWrapper";
  return Wrapper;
}

// ─── useFieldContext ────────────────────────────────────────────────

describe("useFieldContext", () => {
  it("returns null when outside Field", () => {
    const { result } = renderHook(() => useFieldContext());
    expect(result.current).toBeNull();
  });

  it("returns context value when inside Field", () => {
    const ctx = makeCtx();
    const { result } = renderHook(() => useFieldContext(), { wrapper: wrapper(ctx) });
    expect(result.current).toBe(ctx);
  });
});

// ─── useRequiredFieldContext ────────────────────────────────────────

describe("useRequiredFieldContext", () => {
  it("throws when outside Field", () => {
    expect(() => {
      renderHook(() => useRequiredFieldContext("Input"));
    }).toThrow("<Input> must be used inside a <Field> component");
  });

  it("returns context when inside Field", () => {
    const ctx = makeCtx();
    const { result } = renderHook(() => useRequiredFieldContext("Input"), {
      wrapper: wrapper(ctx),
    });
    expect(result.current).toBe(ctx);
  });
});

// ─── resolveFieldControlProps: ID generation ────────────────────────

describe("resolveFieldControlProps: IDs", () => {
  it("returns empty object when context is null", () => {
    expect(resolveFieldControlProps(null, "input")).toEqual({});
  });

  it("sets id from fieldId", () => {
    const ctx = makeCtx();
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["id"]).toBe("field-1");
  });

  it("sets aria-labelledby when label exists", () => {
    const ctx = makeCtx({ hasLabel: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-labelledby"]).toBe("field-1-label");
  });

  it("omits aria-labelledby when no label", () => {
    const ctx = makeCtx({ hasLabel: false });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-labelledby"]).toBeUndefined();
  });
});

// ─── resolveFieldControlProps: description & error ──────────────────

describe("resolveFieldControlProps: describedby", () => {
  it("sets aria-describedby with description only", () => {
    const ctx = makeCtx({ hasDescription: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-describedby"]).toBe("field-1-description");
  });

  it("sets aria-describedby with error only", () => {
    const ctx = makeCtx({ hasError: true, invalid: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-describedby"]).toBe("field-1-error");
  });

  it("combines description + error in aria-describedby", () => {
    const ctx = makeCtx({ hasDescription: true, hasError: true, invalid: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-describedby"]).toBe("field-1-description field-1-error");
  });

  it("omits aria-describedby when neither exists", () => {
    const ctx = makeCtx({ hasDescription: false, hasError: false });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-describedby"]).toBeUndefined();
  });

  it("sets aria-errormessage when error exists", () => {
    const ctx = makeCtx({ hasError: true, invalid: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-errormessage"]).toBe("field-1-error");
  });

  it("omits aria-errormessage when no error", () => {
    const ctx = makeCtx({ hasError: false });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-errormessage"]).toBeUndefined();
  });
});

// ─── resolveFieldControlProps: required ─────────────────────────────

describe("resolveFieldControlProps: required", () => {
  it("sets required and aria-required on native input", () => {
    const ctx = makeCtx({ required: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["required"]).toBe(true);
    expect(props["aria-required"]).toBe("true");
  });

  it("sets required on textarea", () => {
    const ctx = makeCtx({ required: true });
    const props = resolveFieldControlProps(ctx, "textarea");
    expect(props["required"]).toBe(true);
  });

  it("sets required on select", () => {
    const ctx = makeCtx({ required: true });
    const props = resolveFieldControlProps(ctx, "select");
    expect(props["required"]).toBe(true);
  });

  it("only sets aria-required on non-native elements", () => {
    const ctx = makeCtx({ required: true });
    const props = resolveFieldControlProps(ctx, "div");
    expect(props["required"]).toBeUndefined();
    expect(props["aria-required"]).toBe("true");
  });

  it("omits required props when not required", () => {
    const ctx = makeCtx({ required: false });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["required"]).toBeUndefined();
    expect(props["aria-required"]).toBeUndefined();
  });
});

// ─── resolveFieldControlProps: invalid ──────────────────────────────

describe("resolveFieldControlProps: invalid", () => {
  it("sets aria-invalid when invalid", () => {
    const ctx = makeCtx({ invalid: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-invalid"]).toBe("true");
  });

  it("omits aria-invalid when valid", () => {
    const ctx = makeCtx({ invalid: false });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["aria-invalid"]).toBeUndefined();
  });
});

// ─── resolveFieldControlProps: disabled ─────────────────────────────

describe("resolveFieldControlProps: disabled", () => {
  it("sets disabled on native input", () => {
    const ctx = makeCtx({ disabled: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["disabled"]).toBe(true);
  });

  it("sets disabled on native button", () => {
    const ctx = makeCtx({ disabled: true });
    const props = resolveFieldControlProps(ctx, "button");
    expect(props["disabled"]).toBe(true);
  });

  it("sets disabled on native textarea", () => {
    const ctx = makeCtx({ disabled: true });
    const props = resolveFieldControlProps(ctx, "textarea");
    expect(props["disabled"]).toBe(true);
  });

  it("sets disabled on native select", () => {
    const ctx = makeCtx({ disabled: true });
    const props = resolveFieldControlProps(ctx, "select");
    expect(props["disabled"]).toBe(true);
  });

  it("sets aria-disabled on non-native elements", () => {
    const ctx = makeCtx({ disabled: true });
    const props = resolveFieldControlProps(ctx, "div");
    expect(props["disabled"]).toBeUndefined();
    expect(props["aria-disabled"]).toBe("true");
  });

  it("omits disabled props when not disabled", () => {
    const ctx = makeCtx({ disabled: false });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["disabled"]).toBeUndefined();
    expect(props["aria-disabled"]).toBeUndefined();
  });
});

// ─── resolveFieldControlProps: readOnly ─────────────────────────────

describe("resolveFieldControlProps: readOnly", () => {
  it("sets readOnly on native input", () => {
    const ctx = makeCtx({ readOnly: true });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["readOnly"]).toBe(true);
    expect(props["aria-readonly"]).toBe("true");
  });

  it("sets readOnly on native textarea", () => {
    const ctx = makeCtx({ readOnly: true });
    const props = resolveFieldControlProps(ctx, "textarea");
    expect(props["readOnly"]).toBe(true);
  });

  it("only sets aria-readonly on non-text elements", () => {
    const ctx = makeCtx({ readOnly: true });
    const props = resolveFieldControlProps(ctx, "div");
    expect(props["readOnly"]).toBeUndefined();
    expect(props["aria-readonly"]).toBe("true");
  });

  it("omits readOnly props when not readOnly", () => {
    const ctx = makeCtx({ readOnly: false });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["readOnly"]).toBeUndefined();
    expect(props["aria-readonly"]).toBeUndefined();
  });
});

// ─── resolveFieldControlProps: combined states ──────────────────────

describe("resolveFieldControlProps: combined states", () => {
  it("applies all states simultaneously", () => {
    const ctx = makeCtx({
      disabled: true,
      required: true,
      invalid: true,
      hasLabel: true,
      hasDescription: true,
      hasError: true,
    });
    const props = resolveFieldControlProps(ctx, "input");
    expect(props["id"]).toBe("field-1");
    expect(props["disabled"]).toBe(true);
    expect(props["required"]).toBe(true);
    expect(props["aria-required"]).toBe("true");
    expect(props["aria-invalid"]).toBe("true");
    expect(props["aria-labelledby"]).toBe("field-1-label");
    expect(props["aria-describedby"]).toBe("field-1-description field-1-error");
    expect(props["aria-errormessage"]).toBe("field-1-error");
  });
});

// ─── resolveValidationDataAttr ──────────────────────────────────────

describe("resolveValidationDataAttr", () => {
  it("returns undefined when context is null", () => {
    expect(resolveValidationDataAttr(null)).toBeUndefined();
  });

  it("returns data-invalid when invalid", () => {
    const ctx = makeCtx({ invalid: true });
    expect(resolveValidationDataAttr(ctx)).toEqual({ "data-invalid": "" });
  });

  it("returns undefined when valid", () => {
    const ctx = makeCtx({ invalid: false });
    expect(resolveValidationDataAttr(ctx)).toBeUndefined();
  });
});

// ─── SSR safety ─────────────────────────────────────────────────────

describe("Field context: SSR", () => {
  it("FieldContext.Provider renders without errors", () => {
    const ctx = makeCtx();
    const html = renderToString(
      createElement(FieldContext.Provider, { value: ctx }, createElement("div", null, "child")),
    );
    expect(html).toContain("child");
  });
});
