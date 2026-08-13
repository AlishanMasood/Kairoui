import type { ElementType } from "react";
import type { FieldContextValue } from "./field-context";

/**
 * Builds the aria/attribute props that a form control (Input, Textarea, Checkbox, etc.)
 * should spread on its root element based on field context.
 *
 * Returns an empty object if no field context is available (standalone usage).
 */
export function resolveFieldControlProps(
  ctx: FieldContextValue | null,
  element: ElementType,
): Record<string, unknown> {
  if (!ctx) return {};

  const props: Record<string, unknown> = {};

  // ID — the control is the target of the label's `htmlFor`
  props["id"] = ctx.fieldId;

  // ARIA labelledby — only when label is rendered
  if (ctx.hasLabel) {
    props["aria-labelledby"] = ctx.labelId;
  }

  // ARIA describedby — combine description + error
  const describedBy: string[] = [];
  if (ctx.hasDescription) describedBy.push(ctx.descriptionId);
  if (ctx.hasError) describedBy.push(ctx.errorId);
  if (describedBy.length > 0) {
    props["aria-describedby"] = describedBy.join(" ");
  }

  // ARIA errormessage — only when error is present
  if (ctx.hasError) {
    props["aria-errormessage"] = ctx.errorId;
  }

  // Required
  if (ctx.required) {
    if (element === "input" || element === "textarea" || element === "select") {
      props["required"] = true;
    }
    props["aria-required"] = "true";
  }

  // Invalid
  if (ctx.invalid) {
    props["aria-invalid"] = "true";
  }

  // Disabled
  if (ctx.disabled) {
    if (
      element === "button" ||
      element === "input" ||
      element === "select" ||
      element === "textarea"
    ) {
      props["disabled"] = true;
    } else {
      props["aria-disabled"] = "true";
    }
  }

  // Read-only
  if (ctx.readOnly) {
    if (element === "input" || element === "textarea") {
      props["readOnly"] = true;
    }
    props["aria-readonly"] = "true";
  }

  return props;
}

/**
 * Resolves the validation data attribute for CSS styling.
 */
export function resolveValidationDataAttr(
  ctx: FieldContextValue | null,
): Record<string, string> | undefined {
  if (!ctx) return undefined;
  if (ctx.invalid) return { "data-invalid": "" };
  return undefined;
}
