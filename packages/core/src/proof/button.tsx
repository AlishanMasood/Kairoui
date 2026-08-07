import { forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import { defineSlots } from "../composition/slot-definitions";
import { resolveAllSlotProps } from "../composition/resolve-slot-props";
import { renderSlot, renderOptionalSlot } from "../composition/render-slot";
import { mergeProps } from "../composition/merge-props";
import type { SlotOverrides } from "../composition/resolve-slot-props";
import type { PolymorphicComponent } from "../composition/polymorphic-types";

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
 *
 * NOT a production component. Do not export from the package.
 * Exercises: slot system, event composition, ARIA, disabled/loading states,
 * polymorphic `as`, ref forwarding, consumer slot props/replacement.
 */
const ButtonImpl = forwardRef<
  unknown,
  ButtonOwnProps & { as?: ElementType } & Record<string, unknown>
>(function Button(props, ref) {
  const {
    as,
    children,
    startIcon,
    endIcon,
    loading = false,
    disabled = false,
    type = "button",
    slots: slotOverrides,
    slotProps: slotPropsOverrides,
    ...restProps
  } = props as ButtonOwnProps & { as?: ElementType } & Record<string, unknown>;

  const Element: ElementType = as ?? "button";
  const isDisabled: boolean = disabled || loading;

  const resolved = resolveAllSlotProps({
    definitions: buttonSlots,
    internalProps: {
      root: { "data-kui-component": "Button" },
      startIcon: { "aria-hidden": "true" },
      content: {},
      endIcon: { "aria-hidden": "true" },
      loadingIndicator: { "aria-hidden": "true" },
    },
    accessibilityProps: {
      root: {
        ...(Element === "button" ? { type } : {}),
        ...(isDisabled
          ? Element === "button"
            ? { disabled: true }
            : { "aria-disabled": "true" }
          : {}),
        ...(loading ? { "aria-busy": "true" } : {}),
      },
    },
    stateProps: {
      root: {
        "data-state": loading ? "loading" : isDisabled ? "disabled" : "default",
        ...(loading ? { "data-loading": "" } : {}),
        ...(isDisabled ? { "data-disabled": "" } : {}),
      },
    },
    overrides: {
      slots: { ...slotOverrides, root: slotOverrides?.root ?? Element },
      slotProps: slotPropsOverrides,
    },
  });

  // Merge root slot props with consumer rest props and ref
  const rootProps = mergeProps(resolved.root.props, restProps as Record<string, unknown>);
  rootProps["ref"] = ref;

  const hasStartIcon = startIcon != null;
  const hasEndIcon = endIcon != null;

  const rootElement = renderSlot(
    { element: resolved.root.element, props: rootProps },
    <>
      {renderOptionalSlot(resolved.startIcon, hasStartIcon, startIcon)}
      {renderSlot(resolved.content, children)}
      {renderOptionalSlot(resolved.endIcon, hasEndIcon, endIcon)}
      {renderOptionalSlot(resolved.loadingIndicator, loading, "Loading…")}
    </>,
  );

  return rootElement;
});

ButtonImpl.displayName = "Button";

export const Button: PolymorphicComponent<ButtonOwnProps, "button"> =
  ButtonImpl as unknown as PolymorphicComponent<ButtonOwnProps, "button">;
