import { createElement, forwardRef, useCallback } from "react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { useControllableState } from "@kairoui/hooks";

export type ToggleSize = "sm" | "md" | "lg";
export type ToggleAppearance = "outline" | "subtle" | "ghost";

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Controlled pressed state. */
  pressed?: boolean;
  /** Initial pressed state for uncontrolled mode. */
  defaultPressed?: boolean;
  /** Called when pressed state changes. */
  onPressedChange?: (pressed: boolean) => void;
  /** Size variant. */
  size?: ToggleSize;
  /** Appearance variant. */
  appearance?: ToggleAppearance;
  children?: ReactNode;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(props, ref) {
  const {
    pressed: controlledPressed,
    defaultPressed = false,
    onPressedChange,
    size = "md",
    appearance = "outline",
    disabled,
    children,
    className,
    ...restProps
  } = props;

  const [isPressed, setPressed] = useControllableState<boolean>({
    value: controlledPressed,
    defaultValue: defaultPressed,
    ...(onPressedChange ? { onChange: onPressedChange } : undefined),
    name: "Toggle",
    state: "pressed",
  });

  const handleClick = useCallback(() => {
    if (disabled) return;
    setPressed(!isPressed);
  }, [disabled, isPressed, setPressed]);

  const variantClasses: string[] = ["kui-toggle"];
  if (appearance !== "outline") {
    variantClasses.push(`kui-toggle--${appearance}`);
  }
  if (size !== "md") {
    variantClasses.push(`kui-toggle--${size}`);
  }
  if (className) {
    variantClasses.push(className);
  }

  return createElement(
    "button",
    {
      ...restProps,
      ref,
      type: "button",
      disabled,
      "aria-pressed": isPressed,
      className: variantClasses.join(" "),
      "data-kui-component": "Toggle",
      "data-state": isPressed ? "on" : "off",
      ...(disabled ? { "data-disabled": "" } : undefined),
      onClick: handleClick,
    },
    children,
  );
});
