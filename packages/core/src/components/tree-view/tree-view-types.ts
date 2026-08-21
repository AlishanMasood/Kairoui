import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { RowId, SelectionMode } from "../data/data-types";

// ─── TreeView.Root ──────────────────────────────────────────────────

export interface TreeViewRootProps {
  expandedIds?: ReadonlySet<RowId>;
  defaultExpandedIds?: ReadonlySet<RowId>;
  onExpandedChange?: (ids: ReadonlySet<RowId>) => void;
  selectionMode?: SelectionMode;
  selectedIds?: ReadonlySet<RowId>;
  defaultSelectedIds?: ReadonlySet<RowId>;
  onSelectionChange?: (ids: ReadonlySet<RowId>) => void;
  dir?: "ltr" | "rtl";
  className?: string;
  children?: ReactNode;
}

// ─── TreeView.Item ──────────────────────────────────────────────────

export interface TreeViewItemRootProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── TreeView.ItemTrigger ───────────────────────────────────────────

export interface TreeViewItemTriggerRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── TreeView.ItemContent ───────────────────────────────────────────

export interface TreeViewItemContentRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── TreeView.Indicator ─────────────────────────────────────────────

export interface TreeViewIndicatorRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── Context ────────────────────────────────────────────────────────

export interface TreeViewContextValue {
  expandedIds: ReadonlySet<RowId>;
  onExpandedChange: (ids: ReadonlySet<RowId>) => void;
  toggleExpanded: (id: RowId) => void;
  selectionMode: SelectionMode;
  selectedIds: ReadonlySet<RowId>;
  onSelectionChange: (ids: ReadonlySet<RowId>) => void;
  toggleSelected: (id: RowId) => void;
  dir: "ltr" | "rtl";
}

export const TreeViewContext = createContext<TreeViewContextValue | null>(null);
TreeViewContext.displayName = "TreeViewContext";

export function useTreeViewContext(): TreeViewContextValue {
  const ctx = useContext(TreeViewContext);
  if (ctx === null) {
    throw new Error("TreeView compound components must be used within <TreeView>.");
  }
  return ctx;
}

// ─── Item Context ───────────────────────────────────────────────────

export interface TreeViewItemContextValue {
  value: string;
  disabled: boolean;
  expanded: boolean;
  selected: boolean;
  depth: number;
  hasChildren: boolean;
}

export const TreeViewItemContext = createContext<TreeViewItemContextValue | null>(null);
TreeViewItemContext.displayName = "TreeViewItemContext";

export function useTreeViewItemContext(): TreeViewItemContextValue {
  const ctx = useContext(TreeViewItemContext);
  if (ctx === null) {
    throw new Error("TreeViewItem sub-components must be used within <TreeViewItem>.");
  }
  return ctx;
}
