import type { ReactNode } from "react";
import { warning } from "@kairoui/utils";
import { defineSlots } from "../../composition/slot-definitions";
import { resolveAllSlotProps } from "../../composition/resolve-slot-props";
import { renderSlot, renderOptionalSlot } from "../../composition/render-slot";
import { createComponent } from "../../composition/create-component";
import {
  resolveDisabledProps,
  resolveButtonType,
  computeComponentState,
} from "../../composition/authoring-helpers";
import type { SlotConsumerProps } from "../../composition/authoring-helpers";
import { componentClass, slotClass } from "../../composition/class-generation";
import { iconButtonStyleContract } from "./icon-button.styles";

// ─── Slot Definitions ───────────────────────────────────────────────

export type IconButtonSlotNames = "root" | "icon" | "loadingIndicator";

const iconButtonSlots = defineSlots({
  root: { defaultElement: "button", required: true, public: true, role: "button" },
  icon: { defaultElement: "span", required: true, public: true },
  loadingIndicator: { defaultElement: "span", required: false, public: false },
});

const COMPONENT_NAME = iconButtonStyleContract.name;

// ─── Props ──────────────────────────────────────────────────────────

export type IconButtonAppearance = "solid" | "outline" | "subtle" | "ghost";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonOwnProps extends SlotConsumerProps<IconButtonSlotNames> {
  /** Icon content (required). */
  children: ReactNode;
  /** Accessible label (required for screen readers). */
  "aria-label"?: string;
  /** ID of element providing accessible label. */
  "aria-labelledby"?: string;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  appearance?: IconButtonAppearance;
  size?: IconButtonSize;
}

// ─── Dev-mode accessible name check ─────────────────────────────────

function warnMissingAccessibleName(): void {
  warning(
    false,
    'IconButton requires an accessible name. Provide "aria-label" or "aria-labelledby".',
  );
}

// ─── Component ──────────────────────────────────────────────────────

export const IconButton = createComponent<IconButtonOwnProps, "button">({
  displayName: "IconButton",
  defaultElement: "button",
  useComponent: ({ props, ref, element }) => {
    const {
      children,
      loading = false,
      disabled = false,
      type = "button",
      appearance = "subtle",
      size = "md",
      slots: slotOverrides,
      slotProps: slotPropsOverrides,
    } = props;

    const ariaLabel = props["aria-label"];
    const ariaLabelledBy = props["aria-labelledby"];

    if (!ariaLabel && !ariaLabelledBy) {
      warnMissingAccessibleName();
    }

    const state = computeComponentState({ disabled, loading });

    const resolved = resolveAllSlotProps({
      definitions: iconButtonSlots,
      internalProps: {
        icon: {
          "aria-hidden": "true",
          className: slotClass(COMPONENT_NAME, "icon"),
        },
        loadingIndicator: {
          "aria-hidden": "true",
          className: slotClass(COMPONENT_NAME, "loadingIndicator"),
        },
      },
      overrides: { slots: slotOverrides, slotProps: slotPropsOverrides },
    });

    const variantClasses: string[] = [componentClass(COMPONENT_NAME)];
    if (appearance !== "subtle") {
      variantClasses.push(`kui-icon-button--${appearance}`);
    }
    if (size !== "md") {
      variantClasses.push(`kui-icon-button--${size}`);
    }

    return {
      rootProps: { ref, className: variantClasses.join(" ") },
      consumedProps: ["loading", "disabled", "type", "appearance", "size", "slots", "slotProps"],
      state,
      accessibilityProps: {
        ...resolveButtonType(element, type),
        ...resolveDisabledProps(element, state.disabled, state.loading),
      },
      children: (
        <>
          {renderSlot(resolved.icon, children)}
          {renderOptionalSlot(resolved.loadingIndicator, loading, "…")}
        </>
      ),
    };
  },
});

export { iconButtonStyleContract };
