import { createElement, forwardRef, useMemo, useCallback, createContext, useContext } from "react";
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from "react";
import { useControllableState } from "@kairoui/hooks";

export type ToggleGroupType = "single" | "multiple";
export type ToggleGroupOrientation = "horizontal" | "vertical";

// ─── Context ────────────────────────────────────────────────────────

interface ToggleGroupContextValue {
  type: ToggleGroupType;
  value: string[];
  onItemToggle: (itemValue: string) => void;
  disabled: boolean;
  size: "sm" | "md" | "lg";
  appearance: "outline" | "subtle" | "ghost";
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);
ToggleGroupContext.displayName = "ToggleGroupContext";

// ─── ToggleGroup Props ──────────────────────────────────────────────

export interface ToggleGroupSingleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  orientation?: ToggleGroupOrientation;
  loop?: boolean;
  size?: "sm" | "md" | "lg";
  appearance?: "outline" | "subtle" | "ghost";
  children?: ReactNode;
}

export interface ToggleGroupMultipleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
  orientation?: ToggleGroupOrientation;
  loop?: boolean;
  size?: "sm" | "md" | "lg";
  appearance?: "outline" | "subtle" | "ghost";
  children?: ReactNode;
}

export type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

// ─── ToggleGroup Item Props ─────────────────────────────────────────

export interface ToggleGroupItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
}

// ─── ToggleGroup ────────────────────────────────────────────────────

export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  function ToggleGroup(props, ref) {
    const {
      type,
      disabled = false,
      orientation = "horizontal",
      size = "md",
      appearance = "outline",
      children,
      className,
      ...restProps
    } = props;

    // Strip non-DOM props that leak via discriminated union
    const {
      value: _value,
      defaultValue: _defaultValue,
      onValueChange: _onValueChange,
      loop: _loop,
      ...domProps
    } = restProps as Record<string, unknown>;

    // Single selection state
    const singleProps = type === "single" ? props : null;
    const [singleValue, setSingleValue] = useControllableState<string>({
      value: singleProps?.value,
      defaultValue: singleProps?.defaultValue ?? "",
      ...(singleProps?.onValueChange ? { onChange: singleProps.onValueChange } : undefined),
      name: "ToggleGroup",
      state: "value",
    });

    // Multiple selection state
    const multiProps = type === "multiple" ? props : null;
    const [multiValue, setMultiValue] = useControllableState<string[]>({
      value: multiProps?.value,
      defaultValue: multiProps?.defaultValue ?? [],
      ...(multiProps?.onValueChange ? { onChange: multiProps.onValueChange } : undefined),
      isEqual: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
      name: "ToggleGroup",
      state: "value",
    });

    const currentValues = useMemo(
      () => (type === "single" ? (singleValue ? [singleValue] : []) : multiValue),
      [type, singleValue, multiValue],
    );

    const onItemToggle = useCallback(
      (itemValue: string) => {
        if (disabled) return;
        if (type === "single") {
          setSingleValue(singleValue === itemValue ? "" : itemValue);
        } else {
          setMultiValue((prev) =>
            prev.includes(itemValue) ? prev.filter((v) => v !== itemValue) : [...prev, itemValue],
          );
        }
      },
      [type, disabled, singleValue, setSingleValue, setMultiValue],
    );

    const ctx: ToggleGroupContextValue = useMemo(
      () => ({ type, value: currentValues, onItemToggle, disabled, size, appearance }),
      [type, currentValues, onItemToggle, disabled, size, appearance],
    );

    const variantClasses = ["kui-toggle-group"];
    if (className) variantClasses.push(className);

    return createElement(
      ToggleGroupContext.Provider,
      { value: ctx },
      createElement(
        "div",
        {
          ...domProps,
          ref,
          role: "group",
          "aria-orientation": orientation,
          className: variantClasses.join(" "),
          "data-kui-component": "ToggleGroup",
          "data-orientation": orientation,
          ...(disabled ? { "data-disabled": "" } : undefined),
        },
        children,
      ),
    );
  },
);

// ─── ToggleGroup Item ───────────────────────────────────────────────

export const ToggleGroupItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  function ToggleGroupItem(props, ref) {
    const { value, disabled: itemDisabled, children, className, ...restProps } = props;
    const ctx = useContext(ToggleGroupContext);

    if (!ctx) {
      throw new Error("[KairoUI] ToggleGroupItem must be used inside a ToggleGroup.");
    }

    const isPressed = ctx.value.includes(value);
    const resolvedDisabled = itemDisabled ?? ctx.disabled;

    const handleClick = useCallback(() => {
      if (resolvedDisabled) return;
      ctx.onItemToggle(value);
    }, [ctx, value, resolvedDisabled]);

    const variantClasses = ["kui-toggle"];
    if (ctx.appearance !== "outline") {
      variantClasses.push(`kui-toggle--${ctx.appearance}`);
    }
    if (ctx.size !== "md") {
      variantClasses.push(`kui-toggle--${ctx.size}`);
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
        disabled: resolvedDisabled,
        "aria-pressed": isPressed,
        className: variantClasses.join(" "),
        "data-kui-component": "ToggleGroupItem",
        "data-state": isPressed ? "on" : "off",
        ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
        onClick: handleClick,
      },
      children,
    );
  },
);
