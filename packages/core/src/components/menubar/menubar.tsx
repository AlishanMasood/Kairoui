import {
  forwardRef,
  createElement,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { useId } from "@kairoui/hooks";
import { Portal } from "../overlay/portal";
import { DismissableLayer } from "../overlay/dismissable-layer";
import { FocusScope } from "../overlay/focus-scope";
import { MenuContext } from "../menu/menu-types";
import {
  MenubarContext,
  useMenubarContext,
  MenubarMenuContext,
  useMenubarMenuContext,
} from "./menubar-types";
import type {
  MenubarRootProps,
  MenubarMenuProps,
  MenubarTriggerProps,
  MenubarContentProps,
} from "./menubar-types";

// ─── Keyboard helpers ───────────────────────────────────────────────

function getMenuItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])',
    ),
  );
}

// ─── Menubar (Root) ─────────────────────────────────────────────────

export const Menubar = forwardRef<
  HTMLDivElement,
  MenubarRootProps & HTMLAttributes<HTMLDivElement>
>(function Menubar(props, ref) {
  const {
    value: controlledValue,
    onValueChange: onValueChangeProp,
    dir = "ltr",
    loop = true,
    className,
    children,
    ...rest
  } = props;

  const [openValue, setOpenValue] = useState(controlledValue ?? "");

  // Sync controlled value during render (avoids setState-in-effect)
  if (controlledValue !== undefined && controlledValue !== openValue) {
    setOpenValue(controlledValue);
  }

  const onValueChange = useCallback(
    (next: string) => {
      setOpenValue(next);
      onValueChangeProp?.(next);
    },
    [onValueChangeProp],
  );

  const triggerRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerTrigger = useCallback((menuValue: string, element: HTMLElement) => {
    triggerRefs.current.set(menuValue, element);
    return () => {
      triggerRefs.current.delete(menuValue);
    };
  }, []);

  const ctx = useMemo(
    () => ({
      value: openValue,
      onValueChange,
      dir,
      loop,
      hasOpenMenu: openValue !== "",
      triggerRefs,
      registerTrigger,
    }),
    [openValue, onValueChange, dir, loop, registerTrigger],
  );

  /* eslint-disable react-hooks/refs */
  return createElement(
    MenubarContext.Provider,
    { value: ctx },
    createElement(
      "div",
      {
        ...rest,
        ref,
        role: "menubar",
        "aria-orientation": "horizontal",
        "data-kui-component": "Menubar",
        className,
      },
      children,
    ),
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Menubar.Menu ───────────────────────────────────────────────────

export function MenubarMenu(props: MenubarMenuProps): ReactNode {
  const { value, children } = props;
  const barCtx = useMenubarContext();
  const baseId = useId(undefined, { prefix: "kui-menubar" });
  const open = barCtx.value === value;

  const menuCtx = useMemo(
    () => ({ value, open, triggerId: `${baseId}-trigger`, contentId: `${baseId}-content` }),
    [value, open, baseId],
  );

  return createElement(MenubarMenuContext.Provider, { value: menuCtx }, children);
}

// ─── Menubar.Trigger ────────────────────────────────────────────────

export const MenubarTrigger = forwardRef<
  HTMLButtonElement,
  MenubarTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function MenubarTrigger(props, ref) {
  const { disabled = false, className, children, ...rest } = props;
  const barCtx = useMenubarContext();
  const menuCtx = useMenubarMenuContext();
  const elRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (elRef.current) return barCtx.registerTrigger(menuCtx.value, elRef.current);
    return undefined;
  }, [barCtx, menuCtx.value]);

  const handleClick = () => {
    if (disabled) return;
    barCtx.onValueChange(menuCtx.open ? "" : menuCtx.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isRtl = barCtx.dir === "rtl";
    const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const prevKey = isRtl ? "ArrowRight" : "ArrowLeft";

    if (e.key === nextKey || e.key === prevKey) {
      e.preventDefault();
      const triggers = Array.from(barCtx.triggerRefs.current.values());
      const idx = elRef.current ? triggers.indexOf(elRef.current) : -1;
      let next: number;
      if (e.key === nextKey) {
        next = idx < triggers.length - 1 ? idx + 1 : barCtx.loop ? 0 : idx;
      } else {
        next = idx > 0 ? idx - 1 : barCtx.loop ? triggers.length - 1 : idx;
      }
      const target = triggers[next];
      if (target) {
        target.focus();
        if (barCtx.hasOpenMenu) {
          const targetValue = Array.from(barCtx.triggerRefs.current.entries()).find(
            ([, el]) => el === target,
          )?.[0];
          if (targetValue) barCtx.onValueChange(targetValue);
        }
      }
    } else if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) barCtx.onValueChange(menuCtx.value);
    }
  };

  const handlePointerEnter = () => {
    if (barCtx.hasOpenMenu && !disabled) barCtx.onValueChange(menuCtx.value);
  };

  /* eslint-disable react-hooks/refs */
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
      role: "menuitem",
      id: menuCtx.triggerId,
      "aria-haspopup": "menu",
      "aria-expanded": menuCtx.open,
      "aria-disabled": disabled || undefined,
      "data-state": menuCtx.open ? "open" : "closed",
      "data-kui-component": "MenubarTrigger",
      tabIndex: 0,
      className,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      onPointerEnter: handlePointerEnter,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Menubar.Content ────────────────────────────────────────────────

export const MenubarContent = forwardRef<
  HTMLDivElement,
  MenubarContentProps & HTMLAttributes<HTMLDivElement>
>(function MenubarContent(props, ref) {
  const { loop: itemLoop = false, onEscapeKeyDown, className, children, ...rest } = props;
  const barCtx = useMenubarContext();
  const menuCtx = useMenubarMenuContext();

  // Provide MenuContext for shared menu item components
  const menuContextValue = useMemo(
    () => ({
      open: true,
      dir: barCtx.dir,
      highlightedValue: undefined,
      onOpenChange: (open: boolean) => {
        if (!open) barCtx.onValueChange("");
      },
      setHighlightedValue: () => {},
      onItemSelect: () => {
        barCtx.onValueChange("");
      },
      triggerId: menuCtx.triggerId,
      contentId: menuCtx.contentId,
      triggerRef: { current: null },
      contentRef: { current: null },
      setTriggerNode: () => {},
      setContentNode: () => {},
    }),
    [barCtx, menuCtx.triggerId, menuCtx.contentId],
  );

  if (!menuCtx.open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const container = e.currentTarget as HTMLElement;
    const items = getMenuItems(container);
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = idx < items.length - 1 ? idx + 1 : itemLoop ? 0 : idx;
      items[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = idx > 0 ? idx - 1 : itemLoop ? items.length - 1 : idx;
      items[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  /* eslint-disable react-hooks/refs */
  const content = createElement(
    MenuContext.Provider,
    { value: menuContextValue },
    createElement(
      "div",
      {
        ...rest,
        ref,
        role: "menu",
        id: menuCtx.contentId,
        "aria-labelledby": menuCtx.triggerId,
        "data-state": "open",
        "data-kui-component": "MenubarContent",
        className,
        onKeyDown: handleKeyDown,
      },
      children,
    ),
  );
  /* eslint-enable react-hooks/refs */

  const withDismiss = createElement(
    DismissableLayer,
    {
      onDismiss: () => {
        barCtx.onValueChange("");
      },
      ...(onEscapeKeyDown ? { onEscapeKeyDown } : undefined),
    },
    content,
  );

  return createElement(
    Portal,
    undefined,
    createElement(FocusScope, { trapped: true, autoFocus: true, restoreFocus: true }, withDismiss),
  );
});
