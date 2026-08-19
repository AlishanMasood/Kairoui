import {
  forwardRef,
  createElement,
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react";
import type { ReactNode, HTMLAttributes, CSSProperties } from "react";
import { useControllableState, useId, useEventCallback } from "@kairoui/hooks";
import { Portal } from "../overlay/portal";
import { DismissableLayer } from "../overlay/dismissable-layer";
import { FocusScope } from "../overlay/focus-scope";
import { useFloatingPosition } from "../overlay/use-floating-position";
import {
  MenuContext,
  useMenuContext,
  MenuRadioGroupContext,
  useMenuRadioGroupContext,
} from "../menu/menu-types";
import type {
  MenuRootProps,
  MenuTriggerProps,
  MenuContentProps,
  MenuItemProps,
  MenuCheckboxItemProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuItemIndicatorProps,
  MenuGroupProps,
  MenuLabelProps,
  MenuSeparatorProps,
  MenuArrowProps,
} from "../menu/menu-types";

// ─── Keyboard navigation helpers ────────────────────────────────────

function getMenuItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])',
    ),
  );
}

function focusItem(items: HTMLElement[], index: number): void {
  const item = items[index];
  if (item) item.focus();
}

// ─── DropdownMenu (Root) ────────────────────────────────────────────

export const DropdownMenu = forwardRef<
  HTMLDivElement,
  MenuRootProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenu(props, ref) {
  const {
    open: controlledOpen,
    defaultOpen,
    onOpenChange: onOpenChangeProp,
    dir = "ltr",
    children,
    ...rest
  } = props;

  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen ?? false,
    ...(onOpenChangeProp ? { onChange: onOpenChangeProp } : undefined),
  });

  const triggerId = useId(undefined, { prefix: "kui-dm-trigger" });
  const contentId = useId(undefined, { prefix: "kui-dm-content" });
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const [highlightedValue, setHighlightedValue] = useState<string | undefined>(undefined);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) setHighlightedValue(undefined);
    },
    [setOpen],
  );

  const onItemSelect = useEventCallback(() => {
    onOpenChange(false);
  });

  const setTriggerNode = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);

  const setContentNode = useCallback((node: HTMLElement | null) => {
    contentRef.current = node;
  }, []);

  const ctx = useMemo(
    () => ({
      open,
      dir,
      highlightedValue,
      onOpenChange,
      setHighlightedValue,
      onItemSelect,
      triggerId,
      contentId,
      triggerRef,
      contentRef,
      setTriggerNode,
      setContentNode,
    }),
    [
      open,
      dir,
      highlightedValue,
      onOpenChange,
      setHighlightedValue,
      onItemSelect,
      triggerId,
      contentId,
      setTriggerNode,
      setContentNode,
    ],
  );

  /* eslint-disable react-hooks/refs -- context carries refs for anchor positioning */
  return createElement(
    MenuContext.Provider,
    { value: ctx },
    createElement("div", { ...rest, ref, "data-kui-component": "DropdownMenu" }, children),
  );
  /* eslint-enable react-hooks/refs */
});

// ─── DropdownMenu.Trigger ───────────────────────────────────────────

export const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement,
  MenuTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function DropdownMenuTrigger(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useMenuContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref: (node: HTMLButtonElement | null) => {
        ctx.setTriggerNode(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      type: "button",
      id: ctx.triggerId,
      "aria-haspopup": "menu",
      "aria-expanded": ctx.open,
      "aria-controls": ctx.open ? ctx.contentId : undefined,
      "data-state": ctx.open ? "open" : "closed",
      "data-kui-component": "DropdownMenuTrigger",
      className,
      onClick: () => {
        ctx.onOpenChange(!ctx.open);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          ctx.onOpenChange(true);
        }
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── DropdownMenu.Portal ────────────────────────────────────────────

export interface DropdownMenuPortalProps {
  container?: HTMLElement | null;
  children?: ReactNode;
}

export function DropdownMenuPortal(props: DropdownMenuPortalProps): ReactNode {
  const { container, children } = props;
  const ctx = useMenuContext();
  if (!ctx.open) return null;
  return createElement(Portal, container != null ? { container } : undefined, children);
}

// ─── DropdownMenu.Content ───────────────────────────────────────────

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  MenuContentProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenuContent(props, ref) {
  const {
    placement = "bottom-start",
    onEscapeKeyDown,
    onPointerDownOutside,
    loop = false,
    className,
    children,
    ...rest
  } = props;
  const ctx = useMenuContext();

  const floating = useFloatingPosition({ enabled: ctx.open, placement });
  const setAnchor = floating.refs.setAnchor;
  const setFloatingRef = floating.refs.setFloating;

  useEffect(() => {
    if (ctx.triggerRef.current) {
      setAnchor(ctx.triggerRef.current);
    }
  }, [ctx.open, ctx.triggerRef, setAnchor]);

  /* eslint-disable react-hooks/exhaustive-deps -- ctx.setContentNode is a stable callback */
  const contentRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      ctx.setContentNode(node);
      setFloatingRef(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ctx.setContentNode, setFloatingRef, ref],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  if (!ctx.open) return null;

  const style: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    transform: `translate(${String(floating.x)}px, ${String(floating.y)}px)`,
    transformOrigin: floating.transformOrigin,
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const container = ctx.contentRef.current;
    if (!container) return;
    const items = getMenuItems(container);
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : loop ? 0 : currentIndex;
        focusItem(items, next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : loop ? items.length - 1 : currentIndex;
        focusItem(items, prev);
        break;
      }
      case "Home": {
        e.preventDefault();
        focusItem(items, 0);
        break;
      }
      case "End": {
        e.preventDefault();
        focusItem(items, items.length - 1);
        break;
      }
      default:
        break;
    }
  };

  /* eslint-disable react-hooks/refs */
  const content = createElement(
    "div",
    {
      ...rest,
      ref: contentRefCallback,
      id: ctx.contentId,
      role: "menu",
      "aria-labelledby": ctx.triggerId,
      "data-state": "open",
      "data-kui-component": "DropdownMenuContent",
      className,
      style,
      onKeyDown: handleKeyDown,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */

  const withDismiss = createElement(
    DismissableLayer,
    {
      onDismiss: () => {
        ctx.onOpenChange(false);
      },
      ...(onEscapeKeyDown ? { onEscapeKeyDown } : undefined),
      ...(onPointerDownOutside ? { onPointerDownOutside } : undefined),
    },
    content,
  );

  return createElement(
    FocusScope,
    { trapped: true, autoFocus: true, restoreFocus: true },
    withDismiss,
  );
});

// ─── DropdownMenu.Item ──────────────────────────────────────────────

export const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  MenuItemProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenuItem(props, ref) {
  const { onSelect, disabled = false, textValue: _textValue, children, className, ...rest } = props;
  const ctx = useMenuContext();

  const handleClick = () => {
    if (disabled) return;
    if (onSelect) onSelect();
    ctx.onItemSelect("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onSelect) onSelect();
      ctx.onItemSelect("");
    }
  };

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      role: "menuitem",
      tabIndex: disabled ? -1 : 0,
      "aria-disabled": disabled || undefined,
      "data-disabled": disabled || undefined,
      "data-kui-component": "DropdownMenuItem",
      className,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── DropdownMenu.CheckboxItem ──────────────────────────────────────

export const DropdownMenuCheckboxItem = forwardRef<
  HTMLDivElement,
  MenuCheckboxItemProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenuCheckboxItem(props, ref) {
  const {
    checked: controlledChecked,
    defaultChecked,
    onCheckedChange,
    onSelect,
    disabled = false,
    textValue: _textValue,
    children,
    className,
    ...rest
  } = props;
  const ctx = useMenuContext();

  const [checked, setChecked] = useControllableState({
    value: controlledChecked,
    defaultValue: defaultChecked ?? false,
    ...(onCheckedChange ? { onChange: onCheckedChange } : undefined),
  });

  const handleClick = () => {
    if (disabled) return;
    setChecked(!checked);
    if (onSelect) onSelect();
    ctx.onItemSelect("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setChecked(!checked);
      if (onSelect) onSelect();
      ctx.onItemSelect("");
    }
  };

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      role: "menuitemcheckbox",
      "aria-checked": checked,
      tabIndex: disabled ? -1 : 0,
      "aria-disabled": disabled || undefined,
      "data-disabled": disabled || undefined,
      "data-state": checked ? "checked" : "unchecked",
      "data-kui-component": "DropdownMenuCheckboxItem",
      className,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── DropdownMenu.RadioGroup ────────────────────────────────────────

export function DropdownMenuRadioGroup(
  props: MenuRadioGroupProps & HTMLAttributes<HTMLDivElement>,
): ReactNode {
  const {
    value: controlledValue,
    defaultValue,
    onValueChange: onValueChangeProp,
    children,
    ...rest
  } = props;

  const [value, setValue] = useControllableState({
    value: controlledValue,
    defaultValue: defaultValue ?? "",
    ...(onValueChangeProp ? { onChange: onValueChangeProp } : undefined),
  });

  const radioCtx = useMemo(() => ({ value, onValueChange: setValue }), [value, setValue]);

  return createElement(
    MenuRadioGroupContext.Provider,
    { value: radioCtx },
    createElement(
      "div",
      { ...rest, role: "group", "data-kui-component": "DropdownMenuRadioGroup" },
      children,
    ),
  );
}

// ─── DropdownMenu.RadioItem ─────────────────────────────────────────

export const DropdownMenuRadioItem = forwardRef<
  HTMLDivElement,
  MenuRadioItemProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenuRadioItem(props, ref) {
  const {
    value,
    onSelect,
    disabled = false,
    textValue: _textValue,
    children,
    className,
    ...rest
  } = props;
  const ctx = useMenuContext();
  const radioCtx = useMenuRadioGroupContext();
  const isChecked = radioCtx?.value === value;

  const handleClick = () => {
    if (disabled) return;
    radioCtx?.onValueChange(value);
    if (onSelect) onSelect();
    ctx.onItemSelect(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      radioCtx?.onValueChange(value);
      if (onSelect) onSelect();
      ctx.onItemSelect(value);
    }
  };

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      role: "menuitemradio",
      "aria-checked": isChecked,
      tabIndex: disabled ? -1 : 0,
      "aria-disabled": disabled || undefined,
      "data-disabled": disabled || undefined,
      "data-state": isChecked ? "checked" : "unchecked",
      "data-kui-component": "DropdownMenuRadioItem",
      className,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── DropdownMenu.ItemIndicator ─────────────────────────────────────

export const DropdownMenuItemIndicator = forwardRef<
  HTMLSpanElement,
  MenuItemIndicatorProps & HTMLAttributes<HTMLSpanElement>
>(function DropdownMenuItemIndicator(props, ref) {
  const { children, className, ...rest } = props;

  return createElement(
    "span",
    { ...rest, ref, "data-kui-component": "DropdownMenuItemIndicator", className },
    children,
  );
});

// ─── DropdownMenu.Group ─────────────────────────────────────────────

export const DropdownMenuGroup = forwardRef<
  HTMLDivElement,
  MenuGroupProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenuGroup(props, ref) {
  const { children, className, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, role: "group", "data-kui-component": "DropdownMenuGroup", className },
    children,
  );
});

// ─── DropdownMenu.Label ─────────────────────────────────────────────

export const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  MenuLabelProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenuLabel(props, ref) {
  const { children, className, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "DropdownMenuLabel", className },
    children,
  );
});

// ─── DropdownMenu.Separator ─────────────────────────────────────────

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  MenuSeparatorProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenuSeparator(props, ref) {
  const { className, ...rest } = props;

  return createElement("div", {
    ...rest,
    ref,
    role: "separator",
    "data-kui-component": "DropdownMenuSeparator",
    className,
  });
});

// ─── DropdownMenu.Arrow ─────────────────────────────────────────────

export const DropdownMenuArrow = forwardRef<
  HTMLDivElement,
  MenuArrowProps & HTMLAttributes<HTMLDivElement>
>(function DropdownMenuArrow(props, ref) {
  const { width = 10, height = 5, className, ...rest } = props;
  const style: CSSProperties = {
    position: "absolute",
    width: `${String(width)}px`,
    height: `${String(height)}px`,
  };

  return createElement("div", {
    ...rest,
    ref,
    "data-kui-component": "DropdownMenuArrow",
    className,
    style,
  });
});
