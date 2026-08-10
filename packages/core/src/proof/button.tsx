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

// ─── Slot Definitions ───────────────────────────────────────────────

type ButtonSlotNames = "root" | "startIcon" | "content" | "endIcon" | "loadingIndicator";

const buttonSlots = defineSlots({
  root: { defaultElement: "button", required: true, public: true, role: "button" },
  startIcon: { defaultElement: "span", required: false, public: true },
  content: { defaultElement: "span", required: true, public: true },
  endIcon: { defaultElement: "span", required: false, public: true },
  loadingIndicator: { defaultElement: "span", required: false, public: false },
});

// ─── Props ──────────────────────────────────────────────────────────

export interface ButtonOwnProps extends SlotConsumerProps<ButtonSlotNames> {
  children?: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

// ─── Component ──────────────────────────────────────────────────────

/**
 * Internal proof component — validates interactive composition, slots, and accessibility.
 * Migrated to createComponent factory (KUI-COMP-030).
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
      slots: slotOverrides,
      slotProps: slotPropsOverrides,
    } = props;

    const state = computeComponentState({ disabled, loading });

    const resolved = resolveAllSlotProps({
      definitions: buttonSlots,
      internalProps: {
        startIcon: { "aria-hidden": "true" },
        content: {},
        endIcon: { "aria-hidden": "true" },
        loadingIndicator: { "aria-hidden": "true" },
      },
      overrides: { slots: slotOverrides, slotProps: slotPropsOverrides },
    });

    return {
      rootProps: { ref },
      consumedProps: ["startIcon", "endIcon", "loading", "disabled", "type", "slots", "slotProps"],
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
