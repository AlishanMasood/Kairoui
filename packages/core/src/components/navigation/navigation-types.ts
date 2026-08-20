import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── Shared Navigation Types ────────────────────────────────────────

export type Orientation = "horizontal" | "vertical";

export interface NavigationItemData {
  value: string;
  label: string;
  disabled?: boolean;
  href?: string;
}

// ─── Tabs ───────────────────────────────────────────────────────────

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: Orientation;
  /** Activation mode: "automatic" activates on focus, "manual" requires Enter/Space. */
  activationMode?: "automatic" | "manual";
  dir?: "ltr" | "rtl";
  children?: ReactNode;
}

export interface TabListProps {
  /** Loop keyboard navigation. */
  loop?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface TabProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface TabPanelProps {
  value: string;
  /** Lazy mount: only render when active. */
  lazy?: boolean;
  /** Keep mounted after first activation. */
  keepMounted?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Accordion ──────────────────────────────────────────────────────

export type AccordionType = "single" | "multiple";

export interface AccordionSingleProps {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Allow collapsing all items. */
  collapsible?: boolean;
  orientation?: Orientation;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  children?: ReactNode;
}

export interface AccordionMultipleProps {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  orientation?: Orientation;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  children?: ReactNode;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export interface AccordionItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface AccordionTriggerProps {
  className?: string;
  children?: ReactNode;
}

export interface AccordionContentProps {
  className?: string;
  children?: ReactNode;
}

// ─── Breadcrumbs ────────────────────────────────────────────────────

export interface BreadcrumbsProps {
  /** Separator between items. Defaults to "/". */
  separator?: ReactNode;
  /** Maximum items before collapsing. 0 = no collapse. */
  maxItems?: number;
  className?: string;
  children?: ReactNode;
}

export interface BreadcrumbItemProps {
  /** Whether this is the current page (last item). */
  current?: boolean;
  href?: string;
  className?: string;
  children?: ReactNode;
}

export interface BreadcrumbLinkProps {
  href?: string;
  className?: string;
  children?: ReactNode;
}

export interface BreadcrumbSeparatorProps {
  className?: string;
  children?: ReactNode;
}

// ─── Pagination ─────────────────────────────────────────────────────

export interface PaginationProps {
  /** Current page (1-indexed). */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Total number of pages. */
  totalPages: number;
  /** Number of sibling pages shown around current. Defaults to 1. */
  siblingCount?: number;
  /** Number of boundary pages. Defaults to 1. */
  boundaryCount?: number;
  dir?: "ltr" | "rtl";
  className?: string;
  children?: ReactNode;
}

export interface PaginationItemProps {
  page: number;
  className?: string;
  children?: ReactNode;
}

export interface PaginationPreviousProps {
  className?: string;
  children?: ReactNode;
}

export interface PaginationNextProps {
  className?: string;
  children?: ReactNode;
}

export interface PaginationEllipsisProps {
  className?: string;
}

// ─── NavigationMenu ─────────────────────────────────────────────────

export interface NavigationMenuProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: Orientation;
  dir?: "ltr" | "rtl";
  children?: ReactNode;
}

export interface NavigationMenuListProps {
  className?: string;
  children?: ReactNode;
}

export interface NavigationMenuItemProps {
  value?: string;
  className?: string;
  children?: ReactNode;
}

export interface NavigationMenuTriggerProps {
  className?: string;
  children?: ReactNode;
}

export interface NavigationMenuContentProps {
  className?: string;
  children?: ReactNode;
}

export interface NavigationMenuLinkProps {
  href?: string;
  active?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface NavigationMenuViewportProps {
  className?: string;
}

// ─── Sidebar Navigation ─────────────────────────────────────────────

export interface SidebarNavProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  width?: string | number;
  collapsedWidth?: string | number;
  orientation?: Orientation;
  children?: ReactNode;
  className?: string;
}

export interface SidebarNavGroupProps {
  label?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children?: ReactNode;
  className?: string;
}

export interface SidebarNavItemProps {
  href?: string;
  active?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

// ─── Application Layout ─────────────────────────────────────────────

export interface AppShellProps {
  /** Layout variant. */
  layout?: "sidebar" | "header" | "stacked";
  /** Fixed header/sidebar behavior. */
  fixed?: boolean;
  children?: ReactNode;
  className?: string;
}

export interface AppShellHeaderProps {
  /** Fixed to top. */
  fixed?: boolean;
  height?: string | number;
  children?: ReactNode;
  className?: string;
}

export interface AppShellSidebarProps {
  /** Width when expanded. */
  width?: string | number;
  /** Width when collapsed. */
  collapsedWidth?: string | number;
  /** Whether sidebar is collapsed. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Side of the layout. */
  side?: "left" | "right";
  children?: ReactNode;
  className?: string;
}

export interface AppShellMainProps {
  children?: ReactNode;
  className?: string;
}

export interface AppShellFooterProps {
  fixed?: boolean;
  height?: string | number;
  children?: ReactNode;
  className?: string;
}

export interface AppShellAsideProps {
  width?: string | number;
  children?: ReactNode;
  className?: string;
}

// ─── Tabs Context ───────────────────────────────────────────────────

export interface TabsContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
  orientation: Orientation;
  activationMode: "automatic" | "manual";
  dir: "ltr" | "rtl";
}

export const TabsContext = createContext<TabsContextValue | null>(null);
TabsContext.displayName = "TabsContext";

export function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (ctx === null) {
    throw new Error("Tabs compound components must be used within <Tabs>.");
  }
  return ctx;
}

// ─── Accordion Context ──────────────────────────────────────────────

export interface AccordionContextValue {
  type: AccordionType;
  value: string[];
  onItemToggle: (itemValue: string) => void;
  collapsible: boolean;
  orientation: Orientation;
  dir: "ltr" | "rtl";
  disabled: boolean;
}

export const AccordionContext = createContext<AccordionContextValue | null>(null);
AccordionContext.displayName = "AccordionContext";

export function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (ctx === null) {
    throw new Error("Accordion compound components must be used within <Accordion>.");
  }
  return ctx;
}

// ─── Accordion Item Context ─────────────────────────────────────────

export interface AccordionItemContextValue {
  value: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
}

export const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);
AccordionItemContext.displayName = "AccordionItemContext";

export function useAccordionItemContext(): AccordionItemContextValue {
  const ctx = useContext(AccordionItemContext);
  if (ctx === null) {
    throw new Error("AccordionTrigger/Content must be used within <AccordionItem>.");
  }
  return ctx;
}

// ─── Pagination Context ─────────────────────────────────────────────

export interface PaginationContextValue {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  dir: "ltr" | "rtl";
}

export const PaginationContext = createContext<PaginationContextValue | null>(null);
PaginationContext.displayName = "PaginationContext";

export function usePaginationContext(): PaginationContextValue {
  const ctx = useContext(PaginationContext);
  if (ctx === null) {
    throw new Error("Pagination components must be used within <Pagination>.");
  }
  return ctx;
}
