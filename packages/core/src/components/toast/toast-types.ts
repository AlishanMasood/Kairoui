import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── Toast Severity ─────────────────────────────────────────────────

export type ToastSeverity = "info" | "success" | "warning" | "error";

// ─── Toast Placement ────────────────────────────────────────────────

export type ToastViewportPlacement =
  "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end";

// ─── Toast Data ─────────────────────────────────────────────────────

export interface ToastData {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  severity?: ToastSeverity;
  /** Auto-dismiss duration in ms. 0 = persistent. Defaults to 5000. */
  duration?: number;
  /** Called when the toast is dismissed (by user or timeout). */
  onDismiss?: () => void;
}

export type CreateToastInput = Omit<ToastData, "id"> & { id?: string };

// ─── Toast Provider ─────────────────────────────────────────────────

export interface ToastProviderProps {
  /** Maximum visible toasts. Defaults to 5. */
  maxVisible?: number;
  /** Default duration for toasts in ms. Defaults to 5000. */
  defaultDuration?: number;
  /** Viewport placement. Defaults to "bottom-end". */
  placement?: ToastViewportPlacement;
  /** Pause timers on hover/focus. Defaults to true. */
  pauseOnHover?: boolean;
  /** Label for the viewport region (screen-reader). Defaults to "Notifications". */
  label?: string;
  children?: ReactNode;
}

// ─── Toast Viewport ─────────────────────────────────────────────────

export interface ToastViewportProps {
  className?: string;
  /** Hotkey to focus the viewport. Defaults to "F8". */
  hotkey?: string;
}

// ─── Toast (item) ───────────────────────────────────────────────────

export interface ToastItemProps {
  className?: string;
  children?: ReactNode;
}

export interface ToastTitleProps {
  className?: string;
  children?: ReactNode;
}

export interface ToastDescriptionProps {
  className?: string;
  children?: ReactNode;
}

export interface ToastActionProps {
  /** Accessible label for the action (required). */
  altText: string;
  className?: string;
  children?: ReactNode;
}

export interface ToastCloseProps {
  className?: string;
  children?: ReactNode;
}

// ─── State Manager ──────────────────────────────────────────────────

export interface ToastState {
  toasts: ToastData[];
  add: (toast: CreateToastInput) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, data: Partial<CreateToastInput>) => void;
  pauseAll: () => void;
  resumeAll: () => void;
}

export const ToastStateContext = createContext<ToastState | null>(null);
ToastStateContext.displayName = "ToastStateContext";

export function useToastState(): ToastState {
  const ctx = useContext(ToastStateContext);
  if (ctx === null) {
    throw new Error("Toast components must be used within <ToastProvider>.");
  }
  return ctx;
}

// ─── Toast Item Context ─────────────────────────────────────────────

export interface ToastItemContextValue {
  id: string;
  severity: ToastSeverity | undefined;
  dismiss: () => void;
}

export const ToastItemContext = createContext<ToastItemContextValue | null>(null);
ToastItemContext.displayName = "ToastItemContext";

export function useToastItemContext(): ToastItemContextValue {
  const ctx = useContext(ToastItemContext);
  if (ctx === null) {
    throw new Error("Toast sub-components must be used within a Toast item.");
  }
  return ctx;
}
