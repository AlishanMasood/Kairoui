import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Orientation } from "../navigation/navigation-types";

// ─── Tabs Root Props ────────────────────────────────────────────────

export interface TabsRootProps {
  /** Controlled active tab value. */
  value?: string;
  /** Initial active tab for uncontrolled mode. */
  defaultValue?: string;
  /** Called when active tab changes. */
  onValueChange?: (value: string) => void;
  /** Layout orientation. Determines arrow key behavior. Defaults to "horizontal". */
  orientation?: Orientation;
  /** "automatic" activates on focus; "manual" requires Enter/Space. Defaults to "automatic". */
  activationMode?: "automatic" | "manual";
  /** Text direction for RTL support. Defaults to "ltr". */
  dir?: "ltr" | "rtl";
  children?: ReactNode;
  className?: string;
}

// ─── Tabs List Props ────────────────────────────────────────────────

export interface TabsListProps {
  /** Wrap keyboard navigation at boundaries. Defaults to true. */
  loop?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Tabs Trigger Props ─────────────────────────────────────────────

export interface TabsTriggerProps {
  /** Value identifying which panel this trigger activates. */
  value: string;
  /** Whether this trigger is disabled. */
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Tabs Content Props ─────────────────────────────────────────────

export interface TabsContentProps {
  /** Value identifying which trigger activates this panel. */
  value: string;
  /** Only mount when active (unmount when inactive). Defaults to false. */
  lazy?: boolean;
  /** After first activation, keep mounted even when inactive. Defaults to false. */
  keepMounted?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Tabs Context ───────────────────────────────────────────────────

export interface TabsInternalContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
  orientation: Orientation;
  activationMode: "automatic" | "manual";
  dir: "ltr" | "rtl";
  baseId: string;
}

export const TabsInternalContext = createContext<TabsInternalContextValue | null>(null);
TabsInternalContext.displayName = "TabsInternalContext";

export function useTabsInternalContext(): TabsInternalContextValue {
  const ctx = useContext(TabsInternalContext);
  if (ctx === null) {
    throw new Error("Tabs compound components must be used within <Tabs>.");
  }
  return ctx;
}

// ─── ID generation helpers ──────────────────────────────────────────

export function getTabTriggerId(baseId: string, value: string): string {
  return `${baseId}-trigger-${value}`;
}

export function getTabContentId(baseId: string, value: string): string {
  return `${baseId}-content-${value}`;
}
