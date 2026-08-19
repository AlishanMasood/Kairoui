import {
  forwardRef,
  createElement,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  Fragment,
} from "react";
import type { ReactNode, HTMLAttributes, RefCallback } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { warning } from "@kairoui/utils";
import { Portal } from "../overlay/portal";
import { DismissableLayer } from "../overlay/dismissable-layer";
import { FocusScope } from "../overlay/focus-scope";
import { ScrollLock } from "../overlay/scroll-lock";
import { AlertDialogContext, useAlertDialogContext } from "./alert-dialog-types";

// ─── Types ──────────────────────────────────────────────────────────

export interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export interface AlertDialogTriggerProps {
  children?: ReactNode;
  className?: string;
}

export interface AlertDialogPortalProps {
  container?: HTMLElement | null;
  children?: ReactNode;
}

export interface AlertDialogBackdropProps {
  className?: string;
  children?: ReactNode;
}

export interface AlertDialogContentProps {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
  children?: ReactNode;
}

export interface AlertDialogTitleProps {
  children?: ReactNode;
  className?: string;
}

export interface AlertDialogDescriptionProps {
  children?: ReactNode;
  className?: string;
}

export interface AlertDialogActionProps {
  children?: ReactNode;
  className?: string;
}

export interface AlertDialogCancelProps {
  children?: ReactNode;
  className?: string;
}

// ─── AlertDialog (Root) ─────────────────────────────────────────────

export const AlertDialog = forwardRef<
  HTMLDivElement,
  AlertDialogProps & HTMLAttributes<HTMLDivElement>
>(function AlertDialog(props, ref) {
  const {
    open: controlledOpen,
    defaultOpen,
    onOpenChange: onOpenChangeProp,
    children,
    ...rest
  } = props;

  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen ?? false,
    ...(onOpenChangeProp ? { onChange: onOpenChangeProp } : undefined),
  });

  const titleId = useId(undefined, { prefix: "kui-alertdialog-title" });
  const descriptionId = useId(undefined, { prefix: "kui-alertdialog-desc" });
  const contentId = useId(undefined, { prefix: "kui-alertdialog-content" });
  const triggerId = useId(undefined, { prefix: "kui-alertdialog-trigger" });
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
    },
    [setOpen],
  );

  const setCancelNode = useCallback((node: HTMLButtonElement | null) => {
    cancelRef.current = node;
  }, []);

  const ctx = useMemo<import("./alert-dialog-types").AlertDialogContextValue>(
    () => ({
      open,
      onOpenChange,
      titleId,
      descriptionId,
      contentId,
      triggerId,
      cancelRef,
      setCancelNode,
    }),
    [open, onOpenChange, titleId, descriptionId, contentId, triggerId, setCancelNode],
  );

  /* eslint-disable react-hooks/refs -- ctx contains cancelRef for initial focus */
  return createElement(
    AlertDialogContext.Provider,
    { value: ctx },
    createElement("div", { ...rest, ref, "data-kui-component": "AlertDialog" }, children),
  );
  /* eslint-enable react-hooks/refs */
});

// ─── AlertDialog.Trigger ────────────────────────────────────────────

export const AlertDialogTrigger = forwardRef<
  HTMLButtonElement,
  AlertDialogTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function AlertDialogTrigger(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useAlertDialogContext();

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
      "data-kui-component": "AlertDialogTrigger",
      className,
      onClick: () => {
        ctx.onOpenChange(true);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── AlertDialog.Portal ─────────────────────────────────────────────

export function AlertDialogPortal(props: AlertDialogPortalProps): ReactNode {
  const { container, children } = props;
  const ctx = useAlertDialogContext();
  if (!ctx.open) return null;
  return createElement(Portal, container != null ? { container } : undefined, children);
}

// ─── AlertDialog.Backdrop ───────────────────────────────────────────

export const AlertDialogBackdrop = forwardRef<
  HTMLDivElement,
  AlertDialogBackdropProps & HTMLAttributes<HTMLDivElement>
>(function AlertDialogBackdrop(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useAlertDialogContext();
  if (!ctx.open) return null;

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      "data-state": "open",
      "data-kui-component": "AlertDialogBackdrop",
      "aria-hidden": "true",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── AlertDialog.Content ────────────────────────────────────────────

export const AlertDialogContent = forwardRef<
  HTMLDivElement,
  AlertDialogContentProps & HTMLAttributes<HTMLDivElement>
>(function AlertDialogContent(props, ref) {
  const { onEscapeKeyDown, className, children, ...rest } = props;
  const ctx = useAlertDialogContext();
  const hasTitle = useRef(false);

  useEffect(() => {
    if (ctx.open) {
      const id = requestAnimationFrame(() => {
        const titleEl = document.getElementById(ctx.titleId);
        hasTitle.current = titleEl !== null;
        warning(
          hasTitle.current,
          "AlertDialog: missing <AlertDialog.Title>. Required for accessibility.",
        );
      });
      return () => {
        cancelAnimationFrame(id);
      };
    }
    return undefined;
  }, [ctx.open, ctx.titleId]);

  if (!ctx.open) return null;

  /* eslint-disable react-hooks/refs */
  const content = createElement(
    "div",
    {
      ...rest,
      ref,
      id: ctx.contentId,
      role: "alertdialog",
      "aria-modal": "true",
      "aria-labelledby": ctx.titleId,
      "aria-describedby": ctx.descriptionId,
      "data-state": "open",
      "data-kui-component": "AlertDialogContent",
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
      onPointerDownOutside: (event: PointerEvent) => {
        event.preventDefault();
      },
      disableOutsidePointerEvents: true,
    },
    content,
  );

  return createElement(
    FocusScope,
    {
      trapped: true,
      autoFocus: true,
      restoreFocus: true,
      initialFocusRef: ctx.cancelRef,
    },
    createElement(Fragment, null, createElement(ScrollLock, { enabled: true }), withDismiss),
  );
});

// ─── AlertDialog.Title ──────────────────────────────────────────────

export const AlertDialogTitle = forwardRef<
  HTMLHeadingElement,
  AlertDialogTitleProps & HTMLAttributes<HTMLHeadingElement>
>(function AlertDialogTitle(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useAlertDialogContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "h2",
    {
      ...rest,
      ref,
      id: ctx.titleId,
      "data-kui-component": "AlertDialogTitle",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── AlertDialog.Description ────────────────────────────────────────

export const AlertDialogDescription = forwardRef<
  HTMLParagraphElement,
  AlertDialogDescriptionProps & HTMLAttributes<HTMLParagraphElement>
>(function AlertDialogDescription(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useAlertDialogContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "p",
    {
      ...rest,
      ref,
      id: ctx.descriptionId,
      "data-kui-component": "AlertDialogDescription",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── AlertDialog.Action ─────────────────────────────────────────────

export const AlertDialogAction = forwardRef<
  HTMLButtonElement,
  AlertDialogActionProps & HTMLAttributes<HTMLButtonElement>
>(function AlertDialogAction(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useAlertDialogContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "data-kui-component": "AlertDialogAction",
      className,
      onClick: () => {
        ctx.onOpenChange(false);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── AlertDialog.Cancel ─────────────────────────────────────────────

export const AlertDialogCancel = forwardRef<
  HTMLButtonElement,
  AlertDialogCancelProps & HTMLAttributes<HTMLButtonElement>
>(function AlertDialogCancel(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useAlertDialogContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref: ((node: HTMLButtonElement | null) => {
        ctx.setCancelNode(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }) as RefCallback<HTMLButtonElement>,
      type: "button",
      "data-kui-component": "AlertDialogCancel",
      className,
      onClick: () => {
        ctx.onOpenChange(false);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});
