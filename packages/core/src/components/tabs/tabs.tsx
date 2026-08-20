import {
  forwardRef,
  createElement,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import type { HTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import {
  TabsInternalContext,
  useTabsInternalContext,
  getTabTriggerId,
  getTabContentId,
} from "./tabs-types";
import type {
  TabsRootProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from "./tabs-types";
import { useRovingFocus } from "../navigation/use-roving-focus";
import type { UseRovingFocusReturn } from "../navigation/use-roving-focus";

const RovingContext = createContext<UseRovingFocusReturn | null>(null);
RovingContext.displayName = "TabsRovingContext";

// ─── Tabs (Root) ────────────────────────────────────────────────────

export const Tabs = forwardRef<HTMLDivElement, TabsRootProps & HTMLAttributes<HTMLDivElement>>(
  function Tabs(props, ref) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange: onValueChangeProp,
      orientation = "horizontal",
      activationMode = "automatic",
      dir = "ltr",
      className,
      children,
      ...rest
    } = props;

    const [value, setValue] = useControllableState({
      value: controlledValue,
      defaultValue: defaultValue ?? "",
      ...(onValueChangeProp ? { onChange: onValueChangeProp } : undefined),
    });

    const baseId = useId(undefined, { prefix: "kui-tabs" });

    const onValueChange = useCallback(
      (next: string) => {
        setValue(next);
      },
      [setValue],
    );

    const ctx = useMemo(
      () => ({ value, onValueChange, orientation, activationMode, dir, baseId }),
      [value, onValueChange, orientation, activationMode, dir, baseId],
    );

    return createElement(
      TabsInternalContext.Provider,
      { value: ctx },
      createElement(
        "div",
        {
          ...rest,
          ref,
          "data-orientation": orientation,
          "data-kui-component": "Tabs",
          className,
        },
        children,
      ),
    );
  },
);

// ─── Tabs.List ──────────────────────────────────────────────────────

export const TabsList = forwardRef<HTMLDivElement, TabsListProps & HTMLAttributes<HTMLDivElement>>(
  function TabsList(props, ref) {
    const { loop = true, className, children, ...rest } = props;
    const ctx = useTabsInternalContext();

    const roving = useRovingFocus({
      orientation: ctx.orientation,
      dir: ctx.dir,
      loop,
    });

    return createElement(
      "div",
      {
        ...rest,
        ref,
        role: "tablist",
        "aria-orientation": ctx.orientation,
        "data-orientation": ctx.orientation,
        "data-kui-component": "TabsList",
        className,
        onKeyDown: roving.handleKeyDown,
      },
      createElement(RovingContext.Provider, { value: roving }, children),
    );
  },
);

// ─── Tabs.Trigger ───────────────────────────────────────────────────

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  TabsTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function TabsTrigger(props, ref) {
  const { value, disabled = false, className, children, ...rest } = props;
  const ctx = useTabsInternalContext();
  const rovingCtx = useContext(RovingContext);
  const isSelected = ctx.value === value;
  const triggerId = getTabTriggerId(ctx.baseId, value);
  const contentId = getTabContentId(ctx.baseId, value);
  const elRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (elRef.current && rovingCtx) {
      return rovingCtx.register({ element: elRef.current, value, disabled });
    }
    return undefined;
  }, [rovingCtx, value, disabled]);

  const itemProps = rovingCtx?.getItemProps(value, disabled);

  const handleFocus = () => {
    itemProps?.onFocus();
    if (ctx.activationMode === "automatic" && !disabled) {
      ctx.onValueChange(value);
    }
  };

  const handleClick = () => {
    if (!disabled) ctx.onValueChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (ctx.activationMode === "manual" && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (!disabled) ctx.onValueChange(value);
    }
  };

  return createElement(
    "button",
    {
      ...rest,
      ref: (node: HTMLButtonElement | null) => {
        elRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      type: "button",
      role: "tab",
      id: triggerId,
      "aria-selected": isSelected,
      "aria-controls": contentId,
      "aria-disabled": disabled || undefined,
      "data-state": isSelected ? "active" : "inactive",
      "data-disabled": disabled || undefined,
      "data-kui-component": "TabsTrigger",
      tabIndex: itemProps?.tabIndex ?? (isSelected ? 0 : -1),
      className,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
    },
    children,
  );
});

// ─── Tabs.Content ───────────────────────────────────────────────────

export const TabsContent = forwardRef<
  HTMLDivElement,
  TabsContentProps & HTMLAttributes<HTMLDivElement>
>(function TabsContent(props, ref) {
  const { value, lazy = false, keepMounted = false, className, children, ...rest } = props;
  const ctx = useTabsInternalContext();
  const isSelected = ctx.value === value;
  const triggerId = getTabTriggerId(ctx.baseId, value);
  const contentId = getTabContentId(ctx.baseId, value);
  const [hasBeenActive, setHasBeenActive] = useState(isSelected);

  if (isSelected && !hasBeenActive) {
    setHasBeenActive(true);
  }

  const shouldMount = lazy ? (keepMounted ? hasBeenActive : isSelected) : true;

  if (!shouldMount) return null;

  return createElement(
    "div",
    {
      ...rest,
      ref,
      role: "tabpanel",
      id: contentId,
      "aria-labelledby": triggerId,
      "data-state": isSelected ? "active" : "inactive",
      "data-kui-component": "TabsContent",
      tabIndex: 0,
      hidden: !isSelected || undefined,
      className,
    },
    children,
  );
});
