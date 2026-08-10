import type { ElementType } from "react";
import type { SlotOverrides } from "./resolve-slot-props";

/**
 * Extracts slots + slotProps prop types from a SlotOverrides definition.
 * Use in component OwnProps interfaces to avoid repeating the generic extraction.
 */
export type SlotConsumerProps<Names extends string> = {
  slots?: SlotOverrides<Names>["slots"];
  slotProps?: SlotOverrides<Names>["slotProps"];
};

/**
 * Resolves disabled/loading accessibility attributes based on the rendered element.
 * Native button elements get `disabled`; non-native get `aria-disabled`.
 */
export function resolveDisabledProps(
  element: ElementType,
  isDisabled: boolean,
  isLoading: boolean,
): Record<string, unknown> {
  if (!isDisabled && !isLoading) return {};

  const props: Record<string, unknown> = {};

  if (isDisabled) {
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

  if (isLoading) {
    props["aria-busy"] = "true";
  }

  return props;
}

/**
 * Resolves the `type` attribute for button-like elements.
 * Only applies `type` to native <button> elements (not anchors, divs, etc.).
 */
export function resolveButtonType(
  element: ElementType,
  type: "button" | "submit" | "reset" = "button",
): Record<string, unknown> {
  if (element === "button") return { type };
  return {};
}

/**
 * Computes standard component state for data-attribute generation.
 * Returns the ComponentState shape expected by createComponent.
 */
export function computeComponentState(options: { disabled?: boolean; loading?: boolean }): {
  disabled: boolean;
  loading: boolean;
  dataState: string;
} {
  const disabled = options.disabled === true || options.loading === true;
  const loading = options.loading === true;
  return {
    disabled,
    loading,
    dataState: loading ? "loading" : disabled ? "disabled" : "default",
  };
}
