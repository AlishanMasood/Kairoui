import { forwardRef, createElement, useMemo, useCallback, Fragment } from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { Portal } from "../overlay/portal";
import { DismissableLayer } from "../overlay/dismissable-layer";
import { FocusScope } from "../overlay/focus-scope";
import { ScrollLock } from "../overlay/scroll-lock";
import { DrawerContext, useDrawerContext } from "./drawer-types";
import type { DrawerSide } from "./drawer-types";

// ─── Types ──────────────────────────────────────────────────────────

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which edge the drawer slides from. Defaults to "right". */
  side?: DrawerSide;
  children?: ReactNode;
}

export interface DrawerTriggerProps {
  children?: ReactNode;
  className?: string;
}

export interface DrawerPortalProps {
  container?: HTMLElement | null;
  children?: ReactNode;
}

export interface DrawerBackdropProps {
  className?: string;
  children?: ReactNode;
}

export interface DrawerContentProps {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  className?: string;
  children?: ReactNode;
}

export interface DrawerTitleProps {
  children?: ReactNode;
  className?: string;
}

export interface DrawerDescriptionProps {
  children?: ReactNode;
  className?: string;
}

export interface DrawerCloseProps {
  children?: ReactNode;
  className?: string;
}

// ─── Drawer (Root) ──────────────────────────────────────────────────

export const Drawer = forwardRef<HTMLDivElement, DrawerProps & HTMLAttributes<HTMLDivElement>>(
  function Drawer(props, ref) {
    const {
      open: controlledOpen,
      defaultOpen,
      onOpenChange: onOpenChangeProp,
      side = "right",
      children,
      ...rest
    } = props;

    const [open, setOpen] = useControllableState({
      value: controlledOpen,
      defaultValue: defaultOpen ?? false,
      ...(onOpenChangeProp ? { onChange: onOpenChangeProp } : undefined),
    });

    const titleId = useId(undefined, { prefix: "kui-drawer-title" });
    const descriptionId = useId(undefined, { prefix: "kui-drawer-desc" });
    const contentId = useId(undefined, { prefix: "kui-drawer-content" });
    const triggerId = useId(undefined, { prefix: "kui-drawer-trigger" });

    const onOpenChange = useCallback(
      (next: boolean) => {
        setOpen(next);
      },
      [setOpen],
    );

    const ctx = useMemo<import("./drawer-types").DrawerContextValue>(
      () => ({ open, side, onOpenChange, titleId, descriptionId, contentId, triggerId }),
      [open, side, onOpenChange, titleId, descriptionId, contentId, triggerId],
    );

    return createElement(
      DrawerContext.Provider,
      { value: ctx },
      /* eslint-disable react-hooks/refs */
      createElement("div", { ...rest, ref, "data-kui-component": "Drawer" }, children),
      /* eslint-enable react-hooks/refs */
    );
  },
);

// ─── Drawer.Trigger ─────────────────────────────────────────────────

export const DrawerTrigger = forwardRef<
  HTMLButtonElement,
  DrawerTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function DrawerTrigger(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useDrawerContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      id: ctx.triggerId,
      "aria-haspopup": "dialog",
      "aria-expanded": ctx.open,
      "aria-controls": ctx.open ? ctx.contentId : undefined,
      "data-state": ctx.open ? "open" : "closed",
      "data-kui-component": "DrawerTrigger",
      className,
      onClick: () => {
        ctx.onOpenChange(!ctx.open);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Drawer.Portal ──────────────────────────────────────────────────

export function DrawerPortal(props: DrawerPortalProps): ReactNode {
  const { container, children } = props;
  const ctx = useDrawerContext();
  if (!ctx.open) return null;
  return createElement(Portal, container != null ? { container } : undefined, children);
}

// ─── Drawer.Backdrop ────────────────────────────────────────────────

export const DrawerBackdrop = forwardRef<
  HTMLDivElement,
  DrawerBackdropProps & HTMLAttributes<HTMLDivElement>
>(function DrawerBackdrop(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useDrawerContext();
  if (!ctx.open) return null;

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      "data-state": "open",
      "data-kui-component": "DrawerBackdrop",
      "aria-hidden": "true",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Drawer.Content ─────────────────────────────────────────────────

export const DrawerContent = forwardRef<
  HTMLDivElement,
  DrawerContentProps & HTMLAttributes<HTMLDivElement>
>(function DrawerContent(props, ref) {
  const { onEscapeKeyDown, onPointerDownOutside, className, children, ...rest } = props;
  const ctx = useDrawerContext();

  if (!ctx.open) return null;

  /* eslint-disable react-hooks/refs */
  const content = createElement(
    "div",
    {
      ...rest,
      ref,
      id: ctx.contentId,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": ctx.titleId,
      "aria-describedby": ctx.descriptionId,
      "data-state": "open",
      "data-side": ctx.side,
      "data-kui-component": "DrawerContent",
      className,
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
      disableOutsidePointerEvents: true,
    },
    content,
  );

  return createElement(
    FocusScope,
    { trapped: true, autoFocus: true, restoreFocus: true },
    createElement(Fragment, null, createElement(ScrollLock, { enabled: true }), withDismiss),
  );
});

// ─── Drawer.Title ───────────────────────────────────────────────────

export const DrawerTitle = forwardRef<
  HTMLHeadingElement,
  DrawerTitleProps & HTMLAttributes<HTMLHeadingElement>
>(function DrawerTitle(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useDrawerContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "h2",
    {
      ...rest,
      ref,
      id: ctx.titleId,
      "data-kui-component": "DrawerTitle",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Drawer.Description ─────────────────────────────────────────────

export const DrawerDescription = forwardRef<
  HTMLParagraphElement,
  DrawerDescriptionProps & HTMLAttributes<HTMLParagraphElement>
>(function DrawerDescription(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useDrawerContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "p",
    {
      ...rest,
      ref,
      id: ctx.descriptionId,
      "data-kui-component": "DrawerDescription",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Drawer.Close ───────────────────────────────────────────────────

export const DrawerClose = forwardRef<
  HTMLButtonElement,
  DrawerCloseProps & HTMLAttributes<HTMLButtonElement>
>(function DrawerClose(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useDrawerContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "data-kui-component": "DrawerClose",
      className,
      onClick: () => {
        ctx.onOpenChange(false);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});
