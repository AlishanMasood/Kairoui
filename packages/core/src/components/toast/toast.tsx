import {
  forwardRef,
  createElement,
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { Portal } from "../overlay/portal";
import {
  ToastStateContext,
  useToastState,
  ToastItemContext,
  useToastItemContext,
} from "./toast-types";
import type {
  ToastData,
  CreateToastInput,
  ToastProviderProps,
  ToastViewportProps,
  ToastItemProps,
  ToastTitleProps,
  ToastDescriptionProps,
  ToastActionProps,
  ToastCloseProps,
  ToastState,
} from "./toast-types";

// ─── ID generator ───────────────────────────────────────────────────

let toastCounter = 0;
function generateToastId(): string {
  toastCounter++;
  return `kui-toast-${String(toastCounter)}`;
}

export function _resetToastCounter(): void {
  toastCounter = 0;
}

// ─── useToastManager hook ───────────────────────────────────────────

function useToastManager(defaultDuration: number): ToastState {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pausedRef = useRef(false);
  const remainingRef = useRef<Map<string, { remaining: number; started: number }>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer != null) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    remainingRef.current.delete(id);
  }, []);

  const startTimer = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0 || pausedRef.current) return;
      clearTimer(id);
      remainingRef.current.set(id, { remaining: duration, started: Date.now() });
      timersRef.current.set(
        id,
        setTimeout(() => {
          timersRef.current.delete(id);
          remainingRef.current.delete(id);
          setToasts((prev) => {
            const toast = prev.find((t) => t.id === id);
            if (toast?.onDismiss) toast.onDismiss();
            return prev.filter((t) => t.id !== id);
          });
        }, duration),
      );
    },
    [clearTimer],
  );

  const add = useCallback(
    (input: CreateToastInput): string => {
      const id = input.id ?? generateToastId();
      const toast: ToastData = { ...input, id };
      setToasts((prev) => [...prev, toast]);
      const dur = input.duration ?? defaultDuration;
      if (dur > 0) startTimer(id, dur);
      return id;
    },
    [defaultDuration, startTimer],
  );

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => {
        const toast = prev.find((t) => t.id === id);
        if (toast?.onDismiss) toast.onDismiss();
        return prev.filter((t) => t.id !== id);
      });
    },
    [clearTimer],
  );

  const dismissAll = useCallback(() => {
    for (const [id] of timersRef.current) {
      clearTimer(id);
    }
    setToasts((prev) => {
      for (const t of prev) {
        if (t.onDismiss) t.onDismiss();
      }
      return [];
    });
  }, [clearTimer]);

  const update = useCallback((id: string, data: Partial<CreateToastInput>) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...data, id } : t)));
  }, []);

  const pauseAll = useCallback(() => {
    pausedRef.current = true;
    for (const [id, timer] of timersRef.current) {
      clearTimeout(timer);
      const entry = remainingRef.current.get(id);
      if (entry) {
        entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.started));
      }
    }
    timersRef.current.clear();
  }, []);

  const resumeAll = useCallback(() => {
    pausedRef.current = false;
    const entries = Array.from(remainingRef.current.entries());
    remainingRef.current = new Map();
    for (const [id, entry] of entries) {
      if (entry.remaining > 0) {
        const now = Date.now();
        remainingRef.current.set(id, { remaining: entry.remaining, started: now });
        timersRef.current.set(
          id,
          setTimeout(() => {
            timersRef.current.delete(id);
            remainingRef.current.delete(id);
            setToasts((prev) => {
              const toast = prev.find((t) => t.id === id);
              if (toast?.onDismiss) toast.onDismiss();
              return prev.filter((t) => t.id !== id);
            });
          }, entry.remaining),
        );
      }
    }
  }, []);

  // Cleanup all timers on unmount
  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    },
    [],
  );

  return useMemo(
    () => ({ toasts, add, dismiss, dismissAll, update, pauseAll, resumeAll }),
    [toasts, add, dismiss, dismissAll, update, pauseAll, resumeAll],
  );
}

// ─── ToastProvider ──────────────────────────────────────────────────

export function ToastProvider(props: ToastProviderProps): ReactNode {
  const { defaultDuration = 5000, children } = props;
  const state = useToastManager(defaultDuration);

  return createElement(ToastStateContext.Provider, { value: state }, children);
}

// ─── ToastViewport ──────────────────────────────────────────────────

export const ToastViewport = forwardRef<
  HTMLOListElement,
  ToastViewportProps & HTMLAttributes<HTMLOListElement>
>(function ToastViewport(props, ref) {
  const { className, hotkey = "F8", ...rest } = props;
  const state = useToastState();
  const viewportRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === hotkey) {
        e.preventDefault();
        viewportRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [hotkey]);

  /* eslint-disable react-hooks/refs */
  return createElement(
    Portal,
    undefined,
    createElement(
      "ol",
      {
        ...rest,
        ref: (node: HTMLOListElement | null) => {
          viewportRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        },
        role: "region",
        "aria-label": "Notifications",
        "aria-live": "polite",
        tabIndex: -1,
        "data-kui-component": "ToastViewport",
        className,
      },
      state.toasts.map((toast) =>
        createElement(
          "li",
          { key: toast.id, "data-kui-component": "ToastViewportItem" },
          createElement(ToastItemProvider, { toast }),
        ),
      ),
    ),
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Internal: toast item wrapper that provides context ─────────────

function ToastItemProvider(props: { toast: ToastData }): ReactNode {
  const { toast } = props;
  const state = useToastState();

  const itemCtx = useMemo(
    () => ({
      id: toast.id,
      severity: toast.severity,
      dismiss: () => {
        state.dismiss(toast.id);
      },
    }),
    [toast.id, toast.severity, state],
  );

  return createElement(
    ToastItemContext.Provider,
    { value: itemCtx },
    createElement(
      ToastRoot,
      { "data-testid": `toast-${toast.id}` } as never,
      toast.title != null ? createElement(ToastTitle, null, toast.title) : null,
      toast.description != null ? createElement(ToastDescription, null, toast.description) : null,
      toast.action != null ? toast.action : null,
      createElement(ToastClose, null, "\u00d7"),
    ),
  );
}

// ─── Toast (item root) ──────────────────────────────────────────────

export const ToastRoot = forwardRef<
  HTMLDivElement,
  ToastItemProps & HTMLAttributes<HTMLDivElement>
>(function ToastRoot(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useToastItemContext();
  const state = useToastState();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "div",
    {
      ...rest,
      ref,
      role: "status",
      "aria-atomic": "true",
      "data-state": "open",
      "data-severity": ctx.severity,
      "data-kui-component": "Toast",
      className,
      onPointerEnter: () => {
        state.pauseAll();
      },
      onPointerLeave: () => {
        state.resumeAll();
      },
      onFocus: () => {
        state.pauseAll();
      },
      onBlur: () => {
        state.resumeAll();
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});

// ─── Toast.Title ────────────────────────────────────────────────────

export const ToastTitle = forwardRef<
  HTMLDivElement,
  ToastTitleProps & HTMLAttributes<HTMLDivElement>
>(function ToastTitle(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "ToastTitle", className },
    children,
  );
});

// ─── Toast.Description ──────────────────────────────────────────────

export const ToastDescription = forwardRef<
  HTMLDivElement,
  ToastDescriptionProps & HTMLAttributes<HTMLDivElement>
>(function ToastDescription(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "ToastDescription", className },
    children,
  );
});

// ─── Toast.Action ───────────────────────────────────────────────────

export const ToastAction = forwardRef<
  HTMLButtonElement,
  ToastActionProps & HTMLAttributes<HTMLButtonElement>
>(function ToastAction(props, ref) {
  const { altText, className, children, ...rest } = props;

  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "aria-label": altText,
      "data-kui-component": "ToastAction",
      className,
    },
    children,
  );
});

// ─── Toast.Close ────────────────────────────────────────────────────

export const ToastClose = forwardRef<
  HTMLButtonElement,
  ToastCloseProps & HTMLAttributes<HTMLButtonElement>
>(function ToastClose(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useToastItemContext();

  /* eslint-disable react-hooks/refs */
  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "aria-label": "Close notification",
      "data-kui-component": "ToastClose",
      className,
      onClick: () => {
        ctx.dismiss();
      },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
});
