import { forwardRef, createElement, useMemo, useCallback, useRef, useState } from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { useControllableState, useId, useEventCallback } from "@kairoui/hooks";
import { Portal } from "../overlay/portal";
import { DismissableLayer } from "../overlay/dismissable-layer";
import { FocusScope } from "../overlay/focus-scope";
import { MenuContext, useMenuContext } from "../menu/menu-types";
import type { MenuRootProps, MenuContentProps } from "../menu/menu-types";
import {
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItemIndicator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../dropdown-menu/dropdown-menu";

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

// ─── ContextMenu (Root) ─────────────────────────────────────────────

export const ContextMenu = forwardRef<
  HTMLDivElement,
  MenuRootProps & HTMLAttributes<HTMLDivElement>
>(function ContextMenu(props, ref) {
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

  const triggerId = useId(undefined, { prefix: "kui-ctx-trigger" });
  const contentId = useId(undefined, { prefix: "kui-ctx-content" });
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

  /* eslint-disable react-hooks/refs -- context carries refs for positioning */
  return createElement(
    MenuContext.Provider,
    { value: ctx },
    createElement("div", { ...rest, ref, "data-kui-component": "ContextMenu" }, children),
  );
  /* eslint-enable react-hooks/refs */
});

// ─── ContextMenu.Trigger ────────────────────────────────────────────

export interface ContextMenuTriggerProps {
  children?: ReactNode;
  className?: string;
}

export const ContextMenuTrigger = forwardRef<
  HTMLDivElement,
  ContextMenuTriggerProps & HTMLAttributes<HTMLDivElement>
>(function ContextMenuTrigger(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useMenuContext();

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      ctx.onOpenChange(true);
    },
    [ctx],
  );

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref: (node: HTMLDivElement | null) => {
        ctx.setTriggerNode(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      id: ctx.triggerId,
      "data-state": ctx.open ? "open" : "closed",
      "data-kui-component": "ContextMenuTrigger",
      className,
      onContextMenu: handleContextMenu,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── ContextMenu.Portal ─────────────────────────────────────────────

export interface ContextMenuPortalProps {
  container?: HTMLElement | null;
  children?: ReactNode;
}

export function ContextMenuPortal(props: ContextMenuPortalProps): ReactNode {
  const { container, children } = props;
  const ctx = useMenuContext();
  if (!ctx.open) return null;
  return createElement(Portal, container != null ? { container } : undefined, children);
}

// ─── ContextMenu.Content ────────────────────────────────────────────

export const ContextMenuContent = forwardRef<
  HTMLDivElement,
  MenuContentProps & HTMLAttributes<HTMLDivElement>
>(function ContextMenuContent(props, ref) {
  const {
    onEscapeKeyDown,
    onPointerDownOutside,
    loop = false,
    className,
    children,
    ...rest
  } = props;
  const ctx = useMenuContext();

  /* eslint-disable react-hooks/exhaustive-deps -- ctx.setContentNode is a stable callback */
  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      ctx.setContentNode(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ctx.setContentNode, ref],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  if (!ctx.open) return null;

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
      ref: setContentRef,
      id: ctx.contentId,
      role: "menu",
      "aria-labelledby": ctx.triggerId,
      "data-state": "open",
      "data-kui-component": "ContextMenuContent",
      className,
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

// Re-export shared item components with ContextMenu prefix
export const ContextMenuItem = DropdownMenuItem;
export const ContextMenuCheckboxItem = DropdownMenuCheckboxItem;
export const ContextMenuRadioGroup = DropdownMenuRadioGroup;
export const ContextMenuRadioItem = DropdownMenuRadioItem;
export const ContextMenuItemIndicator = DropdownMenuItemIndicator;
export const ContextMenuGroup = DropdownMenuGroup;
export const ContextMenuLabel = DropdownMenuLabel;
export const ContextMenuSeparator = DropdownMenuSeparator;
