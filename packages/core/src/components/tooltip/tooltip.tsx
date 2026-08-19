import { forwardRef, createElement, useMemo, useCallback, useRef, useEffect } from "react";
import type { ReactNode, HTMLAttributes, CSSProperties } from "react";
import { useControllableState, useId, useEventCallback } from "@kairoui/hooks";
import { Portal } from "../overlay/portal";
import { useFloatingPosition } from "../overlay/use-floating-position";
import type { TooltipProps, TooltipContentProps } from "../overlay/overlay-types";
import { TooltipContext, useTooltipContext } from "./tooltip-types";

// ─── Tooltip (Root) ─────────────────────────────────────────────────

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps & HTMLAttributes<HTMLDivElement>>(
  function Tooltip(props, ref) {
    const {
      open: controlledOpen,
      defaultOpen,
      onOpenChange: onOpenChangeProp,
      delayDuration = 700,
      closeDelay = 300,
      children,
      ...rest
    } = props;

    const [open, setOpen] = useControllableState({
      value: controlledOpen,
      defaultValue: defaultOpen ?? false,
      ...(onOpenChangeProp ? { onChange: onOpenChangeProp } : undefined),
    });

    const contentId = useId(undefined, { prefix: "kui-tooltip-content" });
    const triggerId = useId(undefined, { prefix: "kui-tooltip-trigger" });
    const anchorRef = useRef<HTMLElement | null>(null);
    const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setAnchorNode = useCallback((el: HTMLElement | null) => {
      anchorRef.current = el;
    }, []);

    const onOpenChange = useCallback(
      (next: boolean) => {
        setOpen(next);
      },
      [setOpen],
    );

    const clearTimers = useCallback(() => {
      if (openTimerRef.current != null) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
      if (closeTimerRef.current != null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }, []);

    const handleTriggerEnter = useEventCallback(() => {
      clearTimers();
      if (delayDuration === 0) {
        onOpenChange(true);
      } else {
        openTimerRef.current = setTimeout(() => {
          onOpenChange(true);
        }, delayDuration);
      }
    });

    const handleTriggerLeave = useEventCallback(() => {
      clearTimers();
      if (closeDelay === 0) {
        onOpenChange(false);
      } else {
        closeTimerRef.current = setTimeout(() => {
          onOpenChange(false);
        }, closeDelay);
      }
    });

    // Cleanup timers on unmount
    useEffect(() => clearTimers, [clearTimers]);

    // Close on Escape
    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === "Esc") {
          clearTimers();
          onOpenChange(false);
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [open, onOpenChange, clearTimers]);

    const floating = useFloatingPosition({ enabled: open, placement: "top" });

    const ctx = useMemo<import("./tooltip-types").TooltipContextValue>(
      () => ({
        open,
        onOpenChange,
        contentId,
        triggerId,
        setAnchorNode,
        setFloating: floating.refs.setFloating,
        placement: floating.placement,
        arrowPosition: floating.arrowPosition,
        floatingX: floating.x,
        floatingY: floating.y,
        transformOrigin: floating.transformOrigin,
        handleTriggerEnter,
        handleTriggerLeave,
      }),
      [
        open,
        onOpenChange,
        contentId,
        triggerId,
        setAnchorNode,
        floating.refs.setFloating,
        floating.placement,
        floating.arrowPosition,
        floating.x,
        floating.y,
        floating.transformOrigin,
        handleTriggerEnter,
        handleTriggerLeave,
      ],
    );

    /* eslint-disable react-hooks/refs -- ctx references are stable callbacks, not read during render */
    return createElement(
      TooltipContext.Provider,
      { value: ctx },
      createElement(
        "div",
        { ...rest, ref, "data-kui-component": "Tooltip", style: { display: "contents" } },
        children,
      ),
    );
    /* eslint-enable react-hooks/refs */
  },
);

// ─── Tooltip.Trigger ────────────────────────────────────────────────

export interface TooltipTriggerProps {
  children?: ReactNode;
  className?: string;
}

export const TooltipTrigger = forwardRef<
  HTMLButtonElement,
  TooltipTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function TooltipTrigger(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useTooltipContext();

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
      "aria-describedby": ctx.open ? ctx.contentId : undefined,
      "data-state": ctx.open ? "open" : "closed",
      "data-kui-component": "TooltipTrigger",
      className,
      onPointerEnter: () => {
        ctx.handleTriggerEnter();
      },
      onPointerLeave: () => {
        ctx.handleTriggerLeave();
      },
      onFocus: () => {
        ctx.handleTriggerEnter();
      },
      onBlur: () => {
        ctx.handleTriggerLeave();
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Tooltip.Portal ─────────────────────────────────────────────────

export interface TooltipPortalProps {
  container?: HTMLElement | null;
  children?: ReactNode;
}

export function TooltipPortal(props: TooltipPortalProps): ReactNode {
  const { container, children } = props;
  const ctx = useTooltipContext();
  if (!ctx.open) return null;
  return createElement(Portal, container != null ? { container } : undefined, children);
}

// ─── Tooltip.Content ────────────────────────────────────────────────

export const TooltipContent = forwardRef<
  HTMLDivElement,
  TooltipContentProps & HTMLAttributes<HTMLDivElement>
>(function TooltipContent(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useTooltipContext();

  if (!ctx.open) return null;

  const style: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    transform: `translate(${String(ctx.floatingX)}px, ${String(ctx.floatingY)}px)`,
    transformOrigin: ctx.transformOrigin,
    pointerEvents: "none",
  };

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref: (node: HTMLDivElement | null) => {
        ctx.setFloating(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      id: ctx.contentId,
      role: "tooltip",
      "data-state": "open",
      "data-side": ctx.placement.split("-")[0],
      "data-kui-component": "TooltipContent",
      className,
      style,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Tooltip.Arrow ──────────────────────────────────────────────────

export interface TooltipArrowProps {
  width?: number;
  height?: number;
  className?: string;
}

export const TooltipArrow = forwardRef<
  HTMLDivElement,
  TooltipArrowProps & HTMLAttributes<HTMLDivElement>
>(function TooltipArrow(props, ref) {
  const { width = 10, height = 5, className, ...rest } = props;
  const ctx = useTooltipContext();

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
    "data-kui-component": "TooltipArrow",
    className,
    style,
  });
  /* eslint-enable react-hooks/refs */
});
