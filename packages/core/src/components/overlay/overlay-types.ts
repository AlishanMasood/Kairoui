import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── Placement ──────────────────────────────────────────────────────

export type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

export type Side = "top" | "bottom" | "left" | "right";
export type Alignment = "start" | "center" | "end";

// ─── Portal ─────────────────────────────────────────────────────────

export interface PortalProps {
  /** Target container. Defaults to document.body. */
  container?: HTMLElement | null;
  children?: ReactNode;
}

// ─── Presence ───────────────────────────────────────────────────────

export interface PresenceProps {
  /** Whether the child is currently present (mounted). */
  present: boolean;
  children: ReactNode | ((props: { present: boolean }) => ReactNode);
}

// ─── Floating Positioning ───────────────────────────────────────────

export interface FloatingPositionOptions {
  /** Desired placement relative to anchor. */
  placement?: Placement;
  /** Offset in px from the anchor. */
  offset?: number;
  /** Whether to flip when overflowing viewport. */
  flip?: boolean;
  /** Whether to shift along the axis to stay in viewport. */
  shift?: boolean;
  /** Padding from viewport edges in px. */
  collisionPadding?: number;
}

export interface FloatingPositionResult {
  /** Computed x position. */
  x: number;
  /** Computed y position. */
  y: number;
  /** Final resolved placement after collision adjustments. */
  placement: Placement;
  /** CSS transform-origin for animations. */
  transformOrigin: string;
}

// ─── Dismissable Layer ──────────────────────────────────────────────

export interface DismissableLayerProps {
  /** Called when the layer should dismiss (after consumer handlers). */
  onDismiss?: () => void;
  /** Called on Escape key. Call event.preventDefault() to cancel dismissal. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Called on pointer down outside. Call event.preventDefault() to cancel dismissal. */
  onPointerDownOutside?: (event: PointerEvent) => void;
  /** Called when focus moves outside. Call event.preventDefault() to cancel dismissal. */
  onFocusOutside?: (event: FocusEvent) => void;
  /** Whether Escape dismissal is disabled. */
  disableEscapeKeyDown?: boolean;
  /** When true, pointer events outside the layer are blocked (modal behavior). */
  disableOutsidePointerEvents?: boolean;
  /** Elements excluded from "outside" detection (e.g., portaled triggers). */
  branches?: ReadonlyArray<HTMLElement | null>;
  children?: ReactNode;
}

// ─── Focus Scope ────────────────────────────────────────────────────

export interface FocusScopeProps {
  /** Trap focus within this scope (for modal overlays). */
  trapped?: boolean;
  /** Whether the scope is active. Defaults to true. */
  enabled?: boolean;
  /** Restore focus to previously focused element on unmount. */
  restoreFocus?: boolean;
  /** Focus the first tabbable element on mount. Defaults to true when trapped. */
  autoFocus?: boolean;
  /** Element to focus on mount (takes priority over autoFocus). */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children?: ReactNode;
}

// ─── Scroll Lock ────────────────────────────────────────────────────

export interface ScrollLockProps {
  /** Whether scroll locking is active. */
  enabled?: boolean;
}

// ─── Overlay Mode ───────────────────────────────────────────────────

export type OverlayMode = "modal" | "non-modal";

// ─── Overlay Stack Context ──────────────────────────────────────────

export interface OverlayStackContextValue {
  /** Register this overlay in the stack. Returns cleanup function. */
  register: (id: string) => () => void;
  /** Whether this overlay is the topmost in the stack. */
  isTopmost: (id: string) => boolean;
}

export const OverlayStackContext = createContext<OverlayStackContextValue | null>(null);
OverlayStackContext.displayName = "OverlayStackContext";

export function useOverlayStackContext(): OverlayStackContextValue | null {
  return useContext(OverlayStackContext);
}

// ─── Dialog Types ───────────────────────────────────────────────────

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: ReactNode;
}

export interface DialogContentProps {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  className?: string;
  children?: ReactNode;
}

export interface DialogTriggerProps {
  children?: ReactNode;
  className?: string;
}

export interface DialogCloseProps {
  children?: ReactNode;
  className?: string;
}

export interface DialogTitleProps {
  children?: ReactNode;
  className?: string;
}

export interface DialogDescriptionProps {
  children?: ReactNode;
  className?: string;
}

// ─── Popover Types ──────────────────────────────────────────────────

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: ReactNode;
}

export interface PopoverContentProps extends FloatingPositionOptions {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  className?: string;
  children?: ReactNode;
}

// ─── Tooltip Types ──────────────────────────────────────────────────

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Delay before showing in ms. */
  delayDuration?: number;
  /** Delay before hiding in ms. */
  closeDelay?: number;
  children?: ReactNode;
}

export interface TooltipContentProps extends FloatingPositionOptions {
  className?: string;
  children?: ReactNode;
}

// ─── Menu Types ─────────────────────────────────────────────────────

export interface MenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export interface MenuContentProps extends FloatingPositionOptions {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
  children?: ReactNode;
}

export interface MenuItemProps {
  /** Called when item is selected. */
  onSelect?: () => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

// ─── Toast Types ────────────────────────────────────────────────────

export type ToastPlacement =
  "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end";

export interface ToastProps {
  /** Auto-dismiss duration in ms. 0 = persistent. */
  duration?: number;
  /** Placement of toast container. */
  placement?: ToastPlacement;
  children?: ReactNode;
}

// ─── Feedback Component Types ───────────────────────────────────────

export interface ProgressProps {
  /** Current value (0-100). */
  value?: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Accessible label. */
  label?: string;
  /** Whether progress is indeterminate. */
  indeterminate?: boolean;
}

export interface SpinnerProps {
  /** Size variant. */
  size?: "sm" | "md" | "lg";
  /** Accessible label. Defaults to "Loading". */
  label?: string;
}

export interface SkeletonProps {
  /** Width. */
  width?: string | number;
  /** Height. */
  height?: string | number;
  /** Border radius. */
  radius?: string;
  /** Whether to animate. Defaults to true. */
  animate?: boolean;
}
