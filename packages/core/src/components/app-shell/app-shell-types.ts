import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── AppShell Root Props ────────────────────────────────────────────

export interface AppShellRootProps {
  /** Layout variant. Defaults to "sidebar". */
  layout?: "sidebar" | "header" | "stacked";
  /** Whether header/sidebar are fixed (sticky). Defaults to false. */
  fixed?: boolean;
  /** Header height token. Defaults to "60px". */
  headerHeight?: string | number;
  /** Sidebar width token. Defaults to "240px". */
  sidebarWidth?: string | number;
  /** Collapsed sidebar width. Defaults to "60px". */
  sidebarCollapsedWidth?: string | number;
  /** Whether sidebar is collapsed. */
  sidebarCollapsed?: boolean;
  /** Aside width. Defaults to "280px". */
  asideWidth?: string | number;
  /** Footer height. Defaults to "auto". */
  footerHeight?: string | number;
  children?: ReactNode;
  className?: string;
}

// ─── AppShell Header Props ──────────────────────────────────────────

export interface AppShellHeaderRootProps {
  /** Stick to top. Inherits from root `fixed` unless overridden. */
  fixed?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── AppShell Sidebar Props ─────────────────────────────────────────

export interface AppShellSidebarRootProps {
  /** Side of the layout. Defaults to "left". */
  side?: "left" | "right";
  className?: string;
  children?: ReactNode;
}

// ─── AppShell Main Props ────────────────────────────────────────────

export interface AppShellMainRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── AppShell Aside Props ───────────────────────────────────────────

export interface AppShellAsideRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── AppShell Footer Props ──────────────────────────────────────────

export interface AppShellFooterRootProps {
  /** Stick to bottom. */
  fixed?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── AppShell Context ───────────────────────────────────────────────

export interface AppShellContextValue {
  layout: "sidebar" | "header" | "stacked";
  fixed: boolean;
  headerHeight: string;
  sidebarWidth: string;
  sidebarCollapsedWidth: string;
  sidebarCollapsed: boolean;
  asideWidth: string;
  footerHeight: string;
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);
AppShellContext.displayName = "AppShellContext";

export function useAppShellContext(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (ctx === null) {
    throw new Error("AppShell compound components must be used within <AppShell>.");
  }
  return ctx;
}

// ─── Dimension normalization ────────────────────────────────────────

export function normalizeDimension(value: string | number | undefined, fallback: string): string {
  if (value == null) return fallback;
  return typeof value === "number" ? `${String(value)}px` : value;
}
