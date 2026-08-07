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

  const hasOverrides = slotOverrides != null || slotPropsOverrides != null;
  const overrides: SlotOverrides<ButtonSlotNames> | undefined = hasOverrides
    ? {
        ...(slotOverrides ? { slots: slotOverrides } : {}),
        ...(slotPropsOverrides ? { slotProps: slotPropsOverrides } : {}),
      }
    : undefined;

  const resolveOptions = {
    definitions: buttonSlots,
    internalProps: {
      root: { "data-kui-component": "Button" } as Record<string, unknown>,
      startIcon: { "aria-hidden": "true" } as Record<string, unknown>,
      content: {} as Record<string, unknown>,
      endIcon: { "aria-hidden": "true" } as Record<string, unknown>,
      loadingIndicator: { "aria-hidden": "true" } as Record<string, unknown>,
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
      } as Record<string, unknown>,
    },
    stateProps: {
      root: {
        "data-state": loading ? "loading" : isDisabled ? "disabled" : "default",
        ...(loading ? { "data-loading": "" } : {}),
        ...(isDisabled ? { "data-disabled": "" } : {}),
      } as Record<string, unknown>,
    },
  };

  const resolved = overrides
    ? resolveAllSlotProps({ ...resolveOptions, overrides })
    : resolveAllSlotProps(resolveOptions);

  // Merge root slot props with consumer rest props and ref
  const rootProps = mergeProps(resolved.root.props, restProps as Record<string, unknown>);
  rootProps["ref"] = ref;

  const hasStartIcon = startIcon != null;
  const hasEndIcon = endIcon != null;
  const rootEl: ElementType =
    (slotOverrides as Record<string, ElementType> | undefined)?.["root"] ?? Element;

  const rootElement = renderSlot(
    { element: rootEl, props: rootProps },
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
