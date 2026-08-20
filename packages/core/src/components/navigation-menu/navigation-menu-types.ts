import { createContext, useContext } from "react";
import type { ReactNode, RefObject } from "react";
import type { Orientation } from "../navigation/navigation-types";

// ─── NavigationMenu Root Props ──────────────────────────────────────

export interface NavigationMenuRootProps {
  /** Currently active/open item value. */
  value?: string;
  /** Initial active item for uncontrolled mode. */
  defaultValue?: string;
  /** Called when active item changes. */
  onValueChange?: (value: string) => void;
  /** Orientation (for keyboard). Defaults to "horizontal". */
  orientation?: Orientation;
  dir?: "ltr" | "rtl";
  /** Delay before content opens on hover (ms). Defaults to 200. */
  delayDuration?: number;
  children?: ReactNode;
  className?: string;
}

// ─── NavigationMenu List Props ──────────────────────────────────────

export interface NavigationMenuListProps {
  className?: string;
  children?: ReactNode;
}

// ─── NavigationMenu Item Props ──────────────────────────────────────

export interface NavigationMenuItemProps {
  /** Unique value for this item. Required if it has content. */
  value?: string;
  className?: string;
  children?: ReactNode;
}

// ─── NavigationMenu Trigger Props ───────────────────────────────────

export interface NavigationMenuTriggerRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── NavigationMenu Content Props ───────────────────────────────────

export interface NavigationMenuContentRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── NavigationMenu Link Props ──────────────────────────────────────

export interface NavigationMenuLinkRootProps {
  href?: string;
  /** Whether this link represents the current page. */
  active?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── NavigationMenu Indicator Props ─────────────────────────────────

export interface NavigationMenuIndicatorProps {
  className?: string;
  children?: ReactNode;
}

// ─── NavigationMenu Viewport Props ──────────────────────────────────

export interface NavigationMenuViewportRootProps {
  className?: string;
}

// ─── NavigationMenu Context ─────────────────────────────────────────

export interface NavigationMenuContextValue {
  value: string;
  onValueChange: (value: string) => void;
  orientation: Orientation;
  dir: "ltr" | "rtl";
  delayDuration: number;
  baseId: string;
  triggerRefs: RefObject<Map<string, HTMLElement>>;
  contentRefs: RefObject<Map<string, HTMLElement>>;
}

export const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(null);
NavigationMenuContext.displayName = "NavigationMenuContext";

export function useNavigationMenuContext(): NavigationMenuContextValue {
  const ctx = useContext(NavigationMenuContext);
  if (ctx === null) {
    throw new Error("NavigationMenu compound components must be used within <NavigationMenu>.");
  }
  return ctx;
}

// ─── NavigationMenu Item Context ────────────────────────────────────

export interface NavigationMenuItemContextValue {
  value: string;
  open: boolean;
  triggerId: string;
  contentId: string;
}

export const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue | null>(null);
NavigationMenuItemContext.displayName = "NavigationMenuItemContext";

export function useNavigationMenuItemContext(): NavigationMenuItemContextValue | null {
  return useContext(NavigationMenuItemContext);
}
