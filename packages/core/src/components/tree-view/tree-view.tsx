import { forwardRef, createElement, useMemo, useCallback, Children, isValidElement } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { useControllableState } from "@kairoui/hooks";
import type { RowId } from "../data/data-types";
import {
  TreeViewContext,
  TreeViewItemContext,
  useTreeViewContext,
  useTreeViewItemContext,
} from "./tree-view-types";
import type {
  TreeViewRootProps,
  TreeViewItemRootProps,
  TreeViewItemTriggerRootProps,
  TreeViewItemContentRootProps,
  TreeViewIndicatorRootProps,
  TreeViewContextValue,
  TreeViewItemContextValue,
} from "./tree-view-types";
import { toggleRowSelection } from "../data-table/selection-utils";

const EMPTY_SET: ReadonlySet<RowId> = new Set<RowId>();

// ─── TreeView (Root) ────────────────────────────────────────────────

export const TreeView = forwardRef<
  HTMLUListElement,
  TreeViewRootProps & HTMLAttributes<HTMLUListElement>
>(function TreeView(props, ref) {
  const {
    expandedIds: controlledExpanded,
    defaultExpandedIds,
    onExpandedChange: onExpandedChangeProp,
    selectionMode = "none",
    selectedIds: controlledSelected,
    defaultSelectedIds,
    onSelectionChange: onSelectionChangeProp,
    dir = "ltr",
    className,
    children,
    ...rest
  } = props;

  const [expandedIds, setExpandedIds] = useControllableState<ReadonlySet<RowId>>({
    value: controlledExpanded,
    defaultValue: defaultExpandedIds ?? EMPTY_SET,
    ...(onExpandedChangeProp ? { onChange: onExpandedChangeProp } : undefined),
  });

  const [selectedIds, setSelectedIds] = useControllableState<ReadonlySet<RowId>>({
    value: controlledSelected,
    defaultValue: defaultSelectedIds ?? EMPTY_SET,
    ...(onSelectionChangeProp ? { onChange: onSelectionChangeProp } : undefined),
  });

  const toggleExpanded = useCallback(
    (id: RowId) => {
      setExpandedIds((prev: ReadonlySet<RowId>) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [setExpandedIds],
  );

  const toggleSelected = useCallback(
    (id: RowId) => {
      setSelectedIds((prev: ReadonlySet<RowId>) => toggleRowSelection(prev, id, selectionMode));
    },
    [setSelectedIds, selectionMode],
  );

  const onExpandedChange = useCallback(
    (ids: ReadonlySet<RowId>) => {
      setExpandedIds(ids);
    },
    [setExpandedIds],
  );

  const onSelectionChange = useCallback(
    (ids: ReadonlySet<RowId>) => {
      setSelectedIds(ids);
    },
    [setSelectedIds],
  );

  const ctx: TreeViewContextValue = useMemo(
    () => ({
      expandedIds,
      onExpandedChange,
      toggleExpanded,
      selectionMode,
      selectedIds,
      onSelectionChange,
      toggleSelected,
      dir,
    }),
    [
      expandedIds,
      onExpandedChange,
      toggleExpanded,
      selectionMode,
      selectedIds,
      onSelectionChange,
      toggleSelected,
      dir,
    ],
  );

  return createElement(
    TreeViewContext.Provider,
    { value: ctx },
    createElement(
      "ul",
      { ...rest, ref, role: "tree", "data-kui-component": "TreeView", className },
      children,
    ),
  );
});

// ─── TreeView.Item ──────────────────────────────────────────────────

// Detect presence of TreeViewItemContent among children at render time
const CONTENT_MARKER = Symbol.for("kui-tree-content");
const ITEM_MARKER = Symbol.for("kui-tree-item");

function hasChildContent(children: ReactNode): boolean {
  let found = false;
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type as unknown as Record<symbol, unknown>)[CONTENT_MARKER] === true
    ) {
      found = true;
    }
  });
  return found;
}

interface TreeViewItemInternalProps extends TreeViewItemRootProps, HTMLAttributes<HTMLLIElement> {
  _depth?: number;
}

export const TreeViewItem = forwardRef<HTMLLIElement, TreeViewItemInternalProps>(
  function TreeViewItem(props, ref) {
    const { value, disabled = false, _depth = 0, className, children, ...rest } = props;
    const treeCtx = useTreeViewContext();
    const expanded = treeCtx.expandedIds.has(value);
    const selected = treeCtx.selectedIds.has(value);
    const hasChildren = hasChildContent(children);

    const itemCtx: TreeViewItemContextValue = useMemo(
      () => ({ value, disabled, expanded, selected, depth: _depth, hasChildren }),
      [value, disabled, expanded, selected, _depth, hasChildren],
    );

    return createElement(
      TreeViewItemContext.Provider,
      { value: itemCtx },
      createElement(
        "li",
        {
          ...rest,
          ref,
          role: "treeitem",
          "aria-expanded": hasChildren ? expanded : undefined,
          "aria-selected": treeCtx.selectionMode !== "none" ? selected : undefined,
          "aria-disabled": disabled || undefined,
          "data-state": hasChildren ? (expanded ? "open" : "closed") : undefined,
          "data-selected": selected || undefined,
          "data-disabled": disabled || undefined,
          "data-depth": String(_depth),
          "data-kui-component": "TreeViewItem",
          className,
        },
        children,
      ),
    );
  },
);

// ─── TreeView.ItemTrigger ───────────────────────────────────────────

export const TreeViewItemTrigger = forwardRef<
  HTMLDivElement,
  TreeViewItemTriggerRootProps & HTMLAttributes<HTMLDivElement>
>(function TreeViewItemTrigger(props, ref) {
  const { className, children, ...rest } = props;
  const treeCtx = useTreeViewContext();
  const itemCtx = useTreeViewItemContext();

  const handleClick = () => {
    if (itemCtx.disabled) return;
    if (itemCtx.hasChildren) {
      treeCtx.toggleExpanded(itemCtx.value);
    }
    if (treeCtx.selectionMode !== "none") {
      treeCtx.toggleSelected(itemCtx.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (itemCtx.disabled) return;
    const isRtl = treeCtx.dir === "rtl";
    const expandKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const collapseKey = isRtl ? "ArrowRight" : "ArrowLeft";

    if (e.key === expandKey && itemCtx.hasChildren && !itemCtx.expanded) {
      e.preventDefault();
      treeCtx.toggleExpanded(itemCtx.value);
    } else if (e.key === collapseKey && itemCtx.expanded) {
      e.preventDefault();
      treeCtx.toggleExpanded(itemCtx.value);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return createElement(
    "div",
    {
      ...rest,
      ref,
      role: "button",
      tabIndex: itemCtx.disabled ? -1 : 0,
      "aria-disabled": itemCtx.disabled || undefined,
      "data-kui-component": "TreeViewItemTrigger",
      className,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    children,
  );
});

// ─── TreeView.ItemContent ───────────────────────────────────────────

export const TreeViewItemContent = forwardRef<
  HTMLUListElement,
  TreeViewItemContentRootProps & HTMLAttributes<HTMLUListElement>
>(function TreeViewItemContent(props, ref) {
  const { className, children, ...rest } = props;
  const itemCtx = useTreeViewItemContext();

  if (!itemCtx.expanded) return null;

  // Inject _depth into child TreeViewItem elements
  const enhancedChildren = Children.map(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type as unknown as Record<symbol, unknown>)[ITEM_MARKER] === true
    ) {
      return createElement(child.type, {
        ...(child.props as Record<string, unknown>),
        _depth: itemCtx.depth + 1,
      } as never);
    }
    return child;
  });

  return createElement(
    "ul",
    { ...rest, ref, role: "group", "data-kui-component": "TreeViewItemContent", className },
    enhancedChildren,
  );
});
(TreeViewItemContent as unknown as Record<symbol, unknown>)[CONTENT_MARKER] = true;
TreeViewItemContent.displayName = "TreeViewItemContent";

// Set markers for detection
(TreeViewItem as unknown as Record<symbol, unknown>)[ITEM_MARKER] = true;
(TreeViewItem as unknown as { displayName: string }).displayName = "TreeViewItem";

// ─── TreeView.Indicator ─────────────────────────────────────────────

export const TreeViewIndicator = forwardRef<
  HTMLSpanElement,
  TreeViewIndicatorRootProps & HTMLAttributes<HTMLSpanElement>
>(function TreeViewIndicator(props, ref) {
  const { className, children, ...rest } = props;
  const itemCtx = useTreeViewItemContext();

  if (!itemCtx.hasChildren) return null;

  return createElement(
    "span",
    {
      ...rest,
      ref,
      "aria-hidden": "true",
      "data-state": itemCtx.expanded ? "open" : "closed",
      "data-kui-component": "TreeViewIndicator",
      className,
    },
    children ?? (itemCtx.expanded ? "▾" : "▸"),
  );
});
