import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── Sidebar Root Props ─────────────────────────────────────────────

export interface SidebarRootProps {
  /** Whether sidebar is collapsed. */
  collapsed?: boolean;
  /** Default collapsed state for uncontrolled mode. */
  defaultCollapsed?: boolean;
  /** Called when collapsed state changes. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Width when expanded. Defaults to "240px". */
  width?: string | number;
  /** Width when collapsed. Defaults to "60px". */
  collapsedWidth?: string | number;
  /** Side of the layout. Defaults to "left". */
  side?: "left" | "right";
  children?: ReactNode;
  className?: string;
}

// ─── Sidebar Header Props ───────────────────────────────────────────

export interface SidebarHeaderProps {
  className?: string;
  children?: ReactNode;
}

// ─── Sidebar Content Props ──────────────────────────────────────────

export interface SidebarContentProps {
  className?: string;
  children?: ReactNode;
}

// ─── Sidebar Footer Props ───────────────────────────────────────────

export interface SidebarFooterProps {
  className?: string;
  children?: ReactNode;
}

// ─── Sidebar Group Props ────────────────────────────────────────────

export interface SidebarGroupProps {
  /** Collapsible group (renders as disclosure). */
  collapsible?: boolean;
  /** Default open state for collapsible groups. */
  defaultOpen?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Sidebar GroupLabel Props ───────────────────────────────────────

export interface SidebarGroupLabelProps {
  className?: string;
  children?: ReactNode;
}

// ─── Sidebar Item Props ─────────────────────────────────────────────

export interface SidebarItemProps {
  /** Whether this item is the current/active page. */
  active?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Sidebar Link Props ─────────────────────────────────────────────

export interface SidebarLinkProps {
  href?: string;
  /** Whether this link is the current page. */
  active?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Sidebar Trigger Props ──────────────────────────────────────────

export interface SidebarTriggerProps {
  className?: string;
  children?: ReactNode;
}

// ─── Sidebar Context ────────────────────────────────────────────────

export interface SidebarContextValue {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  width: string | number;
  collapsedWidth: string | number;
  side: "left" | "right";
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);
SidebarContext.displayName = "SidebarContext";

export function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (ctx === null) {
    throw new Error("Sidebar compound components must be used within <Sidebar>.");
  }
  return ctx;
}
