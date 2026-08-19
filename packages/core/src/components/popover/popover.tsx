import { forwardRef, createElement, useMemo, useCallback, useRef, Fragment } from "react";
import type { ReactNode, HTMLAttributes, CSSProperties } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { Portal } from "../overlay/portal";
import { DismissableLayer } from "../overlay/dismissable-layer";
import { FocusScope } from "../overlay/focus-scope";
import { ScrollLock } from "../overlay/scroll-lock";
import { useFloatingPosition } from "../overlay/use-floating-position";
import type { PopoverProps, PopoverContentProps } from "../overlay/overlay-types";
import { PopoverContext, usePopoverContext } from "./popover-types";

// ─── Popover (Root) ─────────────────────────────────────────────────

export const Popover = forwardRef<HTMLDivElement, PopoverProps & HTMLAttributes<HTMLDivElement>>(
  function Popover(props, ref) {
    const {
      open: controlledOpen,
      defaultOpen,
      onOpenChange: onOpenChangeProp,
      modal = false,
      children,
      ...rest
    } = props;

    const [open, setOpen] = useControllableState({
      value: controlledOpen,
      defaultValue: defaultOpen ?? false,
      ...(onOpenChangeProp ? { onChange: onOpenChangeProp } : undefined),
    });

    const titleId = useId(undefined, { prefix: "kui-popover-title" });
    const descriptionId = useId(undefined, { prefix: "kui-popover-desc" });
    const contentId = useId(undefined, { prefix: "kui-popover-content" });
    const triggerId = useId(undefined, { prefix: "kui-popover-trigger" });
    const anchorRef = useRef<HTMLElement | null>(null);

    const setAnchorNode = useCallback((el: HTMLElement | null) => {
      anchorRef.current = el;
    }, []);

    const onOpenChange = useCallback(
      (next: boolean) => {
        setOpen(next);
      },
      [setOpen],
    );

    // Floating position is computed from anchorRef; options come from PopoverContent
    // We provide defaults here; Content overrides via its own props
    const floating = useFloatingPosition({
      enabled: open,
      placement: "bottom",
    });

    const ctx = useMemo<import("./popover-types").PopoverContextValue>(
      () => ({
        open,
        modal,
        onOpenChange,
        titleId,
        descriptionId,
        contentId,
        triggerId,
        anchorRef,
        setAnchorNode,
        placement: floating.placement,
        arrowPosition: floating.arrowPosition,
        setFloating: floating.refs.setFloating,
        floatingX: floating.x,
        floatingY: floating.y,
        transformOrigin: floating.transformOrigin,
      }),
      [
        open,
        modal,
        onOpenChange,
        titleId,
        descriptionId,
        contentId,
        triggerId,
        setAnchorNode,
        floating.placement,
        floating.arrowPosition,
        floating.refs.setFloating,
        floating.x,
        floating.y,
        floating.transformOrigin,
      ],
    );

    /* eslint-disable react-hooks/refs -- anchorRef passed through context for floating positioning */
    return createElement(
      PopoverContext.Provider,
      { value: ctx },
      createElement("div", { ...rest, ref, "data-kui-component": "Popover" }, children),
    );
    /* eslint-enable react-hooks/refs */
  },
);

// ─── Popover.Trigger ────────────────────────────────────────────────

export interface PopoverTriggerProps {
  children?: ReactNode;
  className?: string;
}

export const PopoverTrigger = forwardRef<
  HTMLButtonElement,
  PopoverTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function PopoverTrigger(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = usePopoverContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref: (node: HTMLButtonElement | null) => {
        ctx.setAnchorNode(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      type: "button",
      id: ctx.triggerId,
      "aria-haspopup": "dialog",
      "aria-expanded": ctx.open,
      "aria-controls": ctx.open ? ctx.contentId : undefined,
      "data-state": ctx.open ? "open" : "closed",
      "data-kui-component": "PopoverTrigger",
      className,
      onClick: () => {
        ctx.onOpenChange(!ctx.open);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Popover.Anchor ─────────────────────────────────────────────────

export interface PopoverAnchorProps {
  children?: ReactNode;
  className?: string;
}

export const PopoverAnchor = forwardRef<
  HTMLDivElement,
  PopoverAnchorProps & HTMLAttributes<HTMLDivElement>
>(function PopoverAnchor(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = usePopoverContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref: (node: HTMLDivElement | null) => {
        ctx.setAnchorNode(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      "data-kui-component": "PopoverAnchor",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Popover.Portal ─────────────────────────────────────────────────

export interface PopoverPortalProps {
  container?: HTMLElement | null;
  children?: ReactNode;
}

export function PopoverPortal(props: PopoverPortalProps): ReactNode {
  const { container, children } = props;
  const ctx = usePopoverContext();
  if (!ctx.open) return null;
  return createElement(Portal, container != null ? { container } : undefined, children);
}

// ─── Popover.Content ────────────────────────────────────────────────

export const PopoverContent = forwardRef<
  HTMLDivElement,
  PopoverContentProps & HTMLAttributes<HTMLDivElement>
>(function PopoverContent(props, ref) {
  const { onEscapeKeyDown, onPointerDownOutside, className, children, ...rest } = props;
  const ctx = usePopoverContext();

  if (!ctx.open) return null;

  const style: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    transform: `translate(${String(ctx.floatingX)}px, ${String(ctx.floatingY)}px)`,
    transformOrigin: ctx.transformOrigin,
  };

  /* eslint-disable react-hooks/refs */
  const content = createElement(
    "div",
    {
      ...rest,
      ref: (node: HTMLDivElement | null) => {
        ctx.setFloating(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      id: ctx.contentId,
      role: "dialog",
      "aria-labelledby": ctx.titleId,
      "aria-describedby": ctx.descriptionId,
      "data-state": "open",
      "data-side": ctx.placement.split("-")[0],
      "data-kui-component": "PopoverContent",
      className,
      style,
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
      disableOutsidePointerEvents: ctx.modal,
    },
    content,
  );

  if (ctx.modal) {
    return createElement(
      FocusScope,
      { trapped: true, autoFocus: true, restoreFocus: true },
      createElement(Fragment, null, createElement(ScrollLock, { enabled: true }), withDismiss),
    );
  }

  return createElement(
    FocusScope,
    { trapped: false, autoFocus: true, restoreFocus: true },
    withDismiss,
  );
});

// ─── Popover.Arrow ──────────────────────────────────────────────────

export interface PopoverArrowProps {
  width?: number;
  height?: number;
  className?: string;
}

export const PopoverArrow = forwardRef<
  HTMLDivElement,
  PopoverArrowProps & HTMLAttributes<HTMLDivElement>
>(function PopoverArrow(props, ref) {
  const { width = 10, height = 5, className, ...rest } = props;
  const ctx = usePopoverContext();

  const style: CSSProperties = {
    position: "absolute",
    width: `${String(width)}px`,
    height: `${String(height)}px`,
    ...(ctx.arrowPosition.x != null ? { left: `${String(ctx.arrowPosition.x)}px` } : undefined),
    ...(ctx.arrowPosition.y != null ? { top: `${String(ctx.arrowPosition.y)}px` } : undefined),
  };

  /* eslint-disable react-hooks/refs */
  return createElement("div", {
    ...rest,
    ref,
    "data-kui-component": "PopoverArrow",
    className,
    style,
  });
  /* eslint-enable react-hooks/refs */
});

// ─── Popover.Close ──────────────────────────────────────────────────

export interface PopoverCloseProps {
  children?: ReactNode;
  className?: string;
}

export const PopoverClose = forwardRef<
  HTMLButtonElement,
  PopoverCloseProps & HTMLAttributes<HTMLButtonElement>
>(function PopoverClose(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = usePopoverContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "data-kui-component": "PopoverClose",
      className,
      onClick: () => {
        ctx.onOpenChange(false);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});
