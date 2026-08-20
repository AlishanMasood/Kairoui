import { forwardRef, createElement, useMemo, useCallback, useRef, useEffect } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import {
  NavigationMenuContext,
  useNavigationMenuContext,
  NavigationMenuItemContext,
  useNavigationMenuItemContext,
} from "./navigation-menu-types";
import type {
  NavigationMenuRootProps,
  NavigationMenuListProps,
  NavigationMenuItemProps,
  NavigationMenuTriggerRootProps,
  NavigationMenuContentRootProps,
  NavigationMenuLinkRootProps,
  NavigationMenuIndicatorProps,
  NavigationMenuViewportRootProps,
} from "./navigation-menu-types";

// ─── NavigationMenu (Root) ──────────────────────────────────────────

export const NavigationMenu = forwardRef<
  HTMLElement,
  NavigationMenuRootProps & HTMLAttributes<HTMLElement>
>(function NavigationMenu(props, ref) {
  const {
    value: controlledValue,
    defaultValue,
    onValueChange: onValueChangeProp,
    orientation = "horizontal",
    dir = "ltr",
    delayDuration = 200,
    label = "Navigation",
    className,
    children,
    ...rest
  } = props;

  const [value, setValue] = useControllableState({
    value: controlledValue,
    defaultValue: defaultValue ?? "",
    ...(onValueChangeProp ? { onChange: onValueChangeProp } : undefined),
  });

  const baseId = useId(undefined, { prefix: "kui-navmenu" });
  const triggerRefs = useRef<Map<string, HTMLElement>>(new Map());
  const contentRefs = useRef<Map<string, HTMLElement>>(new Map());

  const onValueChange = useCallback(
    (next: string) => {
      setValue(next);
    },
    [setValue],
  );

  const ctx = useMemo(
    () => ({
      value,
      onValueChange,
      orientation,
      dir,
      delayDuration,
      baseId,
      triggerRefs,
      contentRefs,
    }),
    [value, onValueChange, orientation, dir, delayDuration, baseId],
  );

  /* eslint-disable react-hooks/refs */
  return createElement(
    NavigationMenuContext.Provider,
    { value: ctx },
    createElement(
      "nav",
      {
        ...rest,
        ref,
        "aria-label": label,
        "data-orientation": orientation,
        "data-kui-component": "NavigationMenu",
        className,
      },
      children,
    ),
  );
  /* eslint-enable react-hooks/refs */
});

// ─── NavigationMenu.List ────────────────────────────────────────────

export const NavigationMenuList = forwardRef<
  HTMLUListElement,
  NavigationMenuListProps & HTMLAttributes<HTMLUListElement>
>(function NavigationMenuList(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "ul",
    { ...rest, ref, "data-kui-component": "NavigationMenuList", className },
    children,
  );
});

// ─── NavigationMenu.Item ────────────────────────────────────────────

export function NavigationMenuItem(
  props: NavigationMenuItemProps & HTMLAttributes<HTMLLIElement>,
): ReactNode {
  const { value = "", className, children, ...rest } = props;
  const ctx = useNavigationMenuContext();
  const open = ctx.value === value && value !== "";

  const itemCtx = useMemo(
    () => ({
      value,
      open,
      triggerId: `${ctx.baseId}-trigger-${value}`,
      contentId: `${ctx.baseId}-content-${value}`,
    }),
    [value, open, ctx.baseId],
  );

  return createElement(
    NavigationMenuItemContext.Provider,
    { value: itemCtx },
    createElement(
      "li",
      { ...rest, "data-kui-component": "NavigationMenuItem", className },
      children,
    ),
  );
}

// ─── NavigationMenu.Trigger ─────────────────────────────────────────

export const NavigationMenuTrigger = forwardRef<
  HTMLButtonElement,
  NavigationMenuTriggerRootProps & HTMLAttributes<HTMLButtonElement>
>(function NavigationMenuTrigger(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useNavigationMenuContext();
  const itemCtx = useNavigationMenuItemContext();
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = itemCtx?.open ?? false;
  const value = itemCtx?.value ?? "";

  const handlePointerEnter = () => {
    delayRef.current = setTimeout(() => {
      ctx.onValueChange(value);
    }, ctx.delayDuration);
  };

  const handlePointerLeave = () => {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    ctx.onValueChange("");
  };

  const handleClick = () => {
    ctx.onValueChange(open ? "" : value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ctx.onValueChange(value);
    }
  };

  useEffect(
    () => () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    },
    [],
  );

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      id: itemCtx?.triggerId,
      "aria-haspopup": "true",
      "aria-expanded": open,
      "aria-controls": itemCtx?.contentId,
      "data-state": open ? "open" : "closed",
      "data-kui-component": "NavigationMenuTrigger",
      className,
      onClick: handleClick,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      onKeyDown: handleKeyDown,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── NavigationMenu.Content ─────────────────────────────────────────

export const NavigationMenuContent = forwardRef<
  HTMLDivElement,
  NavigationMenuContentRootProps & HTMLAttributes<HTMLDivElement>
>(function NavigationMenuContent(props, ref) {
  const { className, children, ...rest } = props;
  const itemCtx = useNavigationMenuItemContext();

  if (!itemCtx?.open) return null;

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      id: itemCtx.contentId,
      "aria-labelledby": itemCtx.triggerId,
      "data-state": "open",
      "data-kui-component": "NavigationMenuContent",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── NavigationMenu.Link ────────────────────────────────────────────

export const NavigationMenuLink = forwardRef<
  HTMLAnchorElement,
  NavigationMenuLinkRootProps & HTMLAttributes<HTMLAnchorElement>
>(function NavigationMenuLink(props, ref) {
  const { href, active = false, className, children, ...rest } = props;

  return createElement(
    "a",
    {
      ...rest,
      ref,
      href,
      "aria-current": active ? "page" : undefined,
      "data-active": active || undefined,
      "data-kui-component": "NavigationMenuLink",
      className,
    },
    children,
  );
});

// ─── NavigationMenu.Indicator ───────────────────────────────────────

export const NavigationMenuIndicator = forwardRef<
  HTMLDivElement,
  NavigationMenuIndicatorProps & HTMLAttributes<HTMLDivElement>
>(function NavigationMenuIndicator(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useNavigationMenuContext();

  if (!ctx.value) return null;

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      "data-state": "visible",
      "data-kui-component": "NavigationMenuIndicator",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── NavigationMenu.Viewport ────────────────────────────────────────

export const NavigationMenuViewport = forwardRef<
  HTMLDivElement,
  NavigationMenuViewportRootProps & HTMLAttributes<HTMLDivElement>
>(function NavigationMenuViewport(props, ref) {
  const { className, ...rest } = props;
  const ctx = useNavigationMenuContext();

  /* eslint-disable react-hooks/refs */
  return createElement("div", {
    ...rest,
    ref,
    "data-state": ctx.value ? "open" : "closed",
    "data-kui-component": "NavigationMenuViewport",
    className,
  });
  /* eslint-enable react-hooks/refs */
});
