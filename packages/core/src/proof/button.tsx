import type { ReactNode } from "react";
import { defineSlots } from "../composition/slot-definitions";
import { resolveAllSlotProps } from "../composition/resolve-slot-props";
import { renderSlot, renderOptionalSlot } from "../composition/render-slot";
import type { SlotOverrides } from "../composition/resolve-slot-props";
import { createComponent } from "../composition/create-component";

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

export interface ButtonOwnProps {
  children?: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  slots?: SlotOverrides<ButtonSlotNames>["slots"];
  slotProps?: SlotOverrides<ButtonSlotNames>["slotProps"];
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

    const isDisabled = disabled || loading;

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

    const hasStartIcon = startIcon != null;
    const hasEndIcon = endIcon != null;

    const slotChildren = (
      <>
        {renderOptionalSlot(resolved.startIcon, hasStartIcon, startIcon)}
        {renderSlot(resolved.content, children)}
        {renderOptionalSlot(resolved.endIcon, hasEndIcon, endIcon)}
        {renderOptionalSlot(resolved.loadingIndicator, loading, "Loading…")}
      </>
    );

    return {
      rootProps: { ref },
      consumedProps: ["startIcon", "endIcon", "loading", "disabled", "type", "slots", "slotProps"],
      state: {
        disabled: isDisabled,
        loading,
        dataState: loading ? "loading" : isDisabled ? "disabled" : "default",
      },
      accessibilityProps: {
        ...(element === "button" ? { type } : {}),
        ...(isDisabled
          ? element === "button"
            ? { disabled: true }
            : { "aria-disabled": "true" }
          : {}),
        ...(loading ? { "aria-busy": "true" } : {}),
      },
      children: slotChildren,
    };
  },
});
