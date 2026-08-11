import type { ReactNode } from "react";
import { defineSlots } from "../composition/slot-definitions";
import { resolveAllSlotProps } from "../composition/resolve-slot-props";
import { renderSlot, renderOptionalSlot } from "../composition/render-slot";
import { createComponent } from "../composition/create-component";
import {
  resolveDisabledProps,
  resolveButtonType,
  computeComponentState,
} from "../composition/authoring-helpers";
import type { SlotConsumerProps } from "../composition/authoring-helpers";
import { componentClass, slotClass } from "../composition/class-generation";
import { buttonStyleContract } from "./button.styles";

// ─── Slot Definitions ───────────────────────────────────────────────

type ButtonSlotNames = "root" | "startIcon" | "content" | "endIcon" | "loadingIndicator";

const buttonSlots = defineSlots({
  root: { defaultElement: "button", required: true, public: true, role: "button" },
  startIcon: { defaultElement: "span", required: false, public: true },
  content: { defaultElement: "span", required: true, public: true },
  endIcon: { defaultElement: "span", required: false, public: true },
  loadingIndicator: { defaultElement: "span", required: false, public: false },
});

const COMPONENT_NAME = buttonStyleContract.name;

// ─── Props ──────────────────────────────────────────────────────────

export interface ButtonOwnProps extends SlotConsumerProps<ButtonSlotNames> {
  children?: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  appearance?: "solid" | "outline" | "subtle";
  size?: "sm" | "md" | "lg";
}

// ─── Component ──────────────────────────────────────────────────────

/**
 * Internal proof component — validates interactive composition, slots, variants, and styling.
 * Migrated to Phase 6 styling engine (KUI-STYLE-030).
 */
export const Button = createComponent<ButtonOwnProps, "button">({
  displayName: "Button",
  defaultElement: "button",
  useComponent: ({ props, ref, element }) => {
    const {
      children,
      startIcon,
      endIcon,
      loading = false,
      disabled = false,
      type = "button",
      appearance = "solid",
      size = "md",
      slots: slotOverrides,
      slotProps: slotPropsOverrides,
    } = props;

    const state = computeComponentState({ disabled, loading });

    const resolved = resolveAllSlotProps({
      definitions: buttonSlots,
      internalProps: {
        startIcon: {
          "aria-hidden": "true",
          className: slotClass(COMPONENT_NAME, "startIcon"),
        },
        content: {
          className: slotClass(COMPONENT_NAME, "content"),
        },
        endIcon: {
          "aria-hidden": "true",
          className: slotClass(COMPONENT_NAME, "endIcon"),
        },
        loadingIndicator: {
          "aria-hidden": "true",
          className: slotClass(COMPONENT_NAME, "loadingIndicator"),
        },
      },
      overrides: { slots: slotOverrides, slotProps: slotPropsOverrides },
    });

    // Build variant class names
    const variantClasses: string[] = [componentClass(COMPONENT_NAME)];
    if (appearance !== "solid") {
      variantClasses.push(`kui-button--${appearance}`);
    }
    if (size !== "md") {
      variantClasses.push(`kui-button--${size}`);
    }

    return {
      rootProps: { ref, className: variantClasses.join(" ") },
      consumedProps: [
        "startIcon",
        "endIcon",
        "loading",
        "disabled",
        "type",
        "appearance",
        "size",
        "slots",
        "slotProps",
      ],
      state,
      accessibilityProps: {
        ...resolveButtonType(element, type),
        ...resolveDisabledProps(element, state.disabled, state.loading),
      },
      children: (
        <>
          {renderOptionalSlot(resolved.startIcon, startIcon != null, startIcon)}
          {renderSlot(resolved.content, children)}
          {renderOptionalSlot(resolved.endIcon, endIcon != null, endIcon)}
          {renderOptionalSlot(resolved.loadingIndicator, loading, "Loading…")}
        </>
      ),
    };
  },
});

export { buttonStyleContract };
