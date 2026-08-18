import {
  forwardRef,
  createElement,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  Fragment,
} from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { warning } from "@kairoui/utils";
import { Portal } from "../overlay/portal";
import { DismissableLayer } from "../overlay/dismissable-layer";
import { FocusScope } from "../overlay/focus-scope";
import { ScrollLock } from "../overlay/scroll-lock";
import type {
  DialogProps,
  DialogContentProps,
  DialogTriggerProps,
  DialogCloseProps,
  DialogTitleProps,
  DialogDescriptionProps,
} from "../overlay/overlay-types";
import { DialogContext, useDialogContext } from "./dialog-types";

// ─── Dialog (Root) ──────────────────────────────────────────────────

export const Dialog = forwardRef<HTMLDivElement, DialogProps & HTMLAttributes<HTMLDivElement>>(
  function Dialog(props, ref) {
    const {
      open: controlledOpen,
      defaultOpen,
      onOpenChange: onOpenChangeProp,
      modal = true,
      children,
      ...rest
    } = props;

    const [open, setOpen] = useControllableState({
      value: controlledOpen,
      defaultValue: defaultOpen ?? false,
      ...(onOpenChangeProp ? { onChange: onOpenChangeProp } : undefined),
    });

    const titleId = useId(undefined, { prefix: "kui-dialog-title" });
    const descriptionId = useId(undefined, { prefix: "kui-dialog-desc" });
    const contentId = useId(undefined, { prefix: "kui-dialog-content" });
    const triggerId = useId(undefined, { prefix: "kui-dialog-trigger" });

    const onOpenChange = useCallback(
      (next: boolean) => {
        setOpen(next);
      },
      [setOpen],
    );

    const ctx = useMemo<import("./dialog-types").DialogContextValue>(
      () => ({
        open,
        modal,
        onOpenChange,
        titleId,
        descriptionId,
        contentId,
        triggerId,
      }),
      [open, modal, onOpenChange, titleId, descriptionId, contentId, triggerId],
    );

    return createElement(
      DialogContext.Provider,
      { value: ctx },
      /* eslint-disable react-hooks/refs */
      createElement("div", { ...rest, ref, "data-kui-component": "Dialog" }, children),
      /* eslint-enable react-hooks/refs */
    );
  },
);

// ─── Dialog.Trigger ─────────────────────────────────────────────────

export const DialogTrigger = forwardRef<
  HTMLButtonElement,
  DialogTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function DialogTrigger(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useDialogContext();

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
      "data-kui-component": "DialogTrigger",
      className,
      onClick: () => {
        ctx.onOpenChange(!ctx.open);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Dialog.Portal ──────────────────────────────────────────────────

export interface DialogPortalProps {
  container?: HTMLElement | null;
  children?: ReactNode;
}

export function DialogPortal(props: DialogPortalProps): ReactNode {
  const { container, children } = props;
  const ctx = useDialogContext();

  if (!ctx.open) return null;
  return createElement(Portal, container != null ? { container } : undefined, children);
}

// ─── Dialog.Backdrop ────────────────────────────────────────────────

export interface DialogBackdropProps {
  className?: string;
  children?: ReactNode;
}

export const DialogBackdrop = forwardRef<
  HTMLDivElement,
  DialogBackdropProps & HTMLAttributes<HTMLDivElement>
>(function DialogBackdrop(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useDialogContext();

  if (!ctx.open) return null;

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      "data-state": "open",
      "data-kui-component": "DialogBackdrop",
      "aria-hidden": "true",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Dialog.Content ─────────────────────────────────────────────────

export const DialogContent = forwardRef<
  HTMLDivElement,
  DialogContentProps & HTMLAttributes<HTMLDivElement>
>(function DialogContent(props, ref) {
  const { onEscapeKeyDown, onPointerDownOutside, className, children, ...rest } = props;
  const ctx = useDialogContext();
  const hasTitle = useRef(false);

  useEffect(() => {
    if (ctx.open) {
      // Defer check so title has time to mount
      const id = requestAnimationFrame(() => {
        const titleEl = document.getElementById(ctx.titleId);
        hasTitle.current = titleEl !== null;
        warning(
          hasTitle.current,
          "Dialog: missing <Dialog.Title>. Add one for accessibility, or use aria-label on Dialog.Content.",
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
      role: "dialog",
      "aria-modal": ctx.modal ? "true" : undefined,
      "aria-labelledby": ctx.titleId,
      "aria-describedby": ctx.descriptionId,
      "data-state": "open",
      "data-kui-component": "DialogContent",
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
      disableOutsidePointerEvents: ctx.modal,
    },
    content,
  );

  return createElement(
    FocusScope,
    {
      trapped: ctx.modal,
      autoFocus: true,
      restoreFocus: true,
    },
    createElement(
      Fragment,
      null,
      ctx.modal ? createElement(ScrollLock, { enabled: true }) : null,
      withDismiss,
    ),
  );
});

// ─── Dialog.Title ───────────────────────────────────────────────────

export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  DialogTitleProps & HTMLAttributes<HTMLHeadingElement>
>(function DialogTitle(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useDialogContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "h2",
    {
      ...rest,
      ref,
      id: ctx.titleId,
      "data-kui-component": "DialogTitle",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Dialog.Description ─────────────────────────────────────────────

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps & HTMLAttributes<HTMLParagraphElement>
>(function DialogDescription(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useDialogContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "p",
    {
      ...rest,
      ref,
      id: ctx.descriptionId,
      "data-kui-component": "DialogDescription",
      className,
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Dialog.Close ───────────────────────────────────────────────────

export const DialogClose = forwardRef<
  HTMLButtonElement,
  DialogCloseProps & HTMLAttributes<HTMLButtonElement>
>(function DialogClose(props, ref) {
  const { children, className, ...rest } = props;
  const ctx = useDialogContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "data-kui-component": "DialogClose",
      className,
      onClick: () => {
        ctx.onOpenChange(false);
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});
