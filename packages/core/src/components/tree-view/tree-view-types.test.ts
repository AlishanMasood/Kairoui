import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";
import {
  TreeViewContext,
  useTreeViewContext,
  TreeViewItemContext,
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
import type { RowId } from "../data/data-types";

// ─── Context availability ───────────────────────────────────────────

describe("TreeView architecture: contexts", () => {
  it("useTreeViewContext throws outside provider", () => {
    expect(() => renderHook(() => useTreeViewContext())).toThrow(
      "TreeView compound components must be used within <TreeView>.",
    );
  });

  it("useTreeViewContext returns value inside provider", () => {
    const value: TreeViewContextValue = {
      expandedIds: new Set(["a"]),
      onExpandedChange: () => {},
      toggleExpanded: () => {},
      selectionMode: "single",
      selectedIds: new Set(),
      onSelectionChange: () => {},
      toggleSelected: () => {},
      dir: "ltr",
    };
    const { result } = renderHook(() => useTreeViewContext(), {
      wrapper: ({ children }) => createElement(TreeViewContext.Provider, { value }, children),
    });
    expect(result.current.expandedIds.has("a")).toBe(true);
    expect(result.current.selectionMode).toBe("single");
  });

  it("useTreeViewItemContext throws outside provider", () => {
    expect(() => renderHook(() => useTreeViewItemContext())).toThrow(
      "TreeViewItem sub-components must be used within <TreeViewItem>.",
    );
  });

  it("useTreeViewItemContext returns value inside provider", () => {
    const value: TreeViewItemContextValue = {
      value: "item-1",
      disabled: false,
      expanded: true,
      selected: false,
      depth: 1,
      hasChildren: true,
    };
    const { result } = renderHook(() => useTreeViewItemContext(), {
      wrapper: ({ children }) => createElement(TreeViewItemContext.Provider, { value }, children),
    });
    expect(result.current.value).toBe("item-1");
    expect(result.current.depth).toBe(1);
    expect(result.current.hasChildren).toBe(true);
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("TreeView architecture: type contracts", () => {
  it("TreeViewRootProps supports expansion", () => {
    expectTypeOf<TreeViewRootProps>().toHaveProperty("expandedIds");
    expectTypeOf<TreeViewRootProps>().toHaveProperty("defaultExpandedIds");
    expectTypeOf<TreeViewRootProps>().toHaveProperty("onExpandedChange");
  });

  it("TreeViewRootProps supports selection", () => {
    expectTypeOf<TreeViewRootProps>().toHaveProperty("selectionMode");
    expectTypeOf<TreeViewRootProps>().toHaveProperty("selectedIds");
    expectTypeOf<TreeViewRootProps>().toHaveProperty("defaultSelectedIds");
    expectTypeOf<TreeViewRootProps>().toHaveProperty("onSelectionChange");
  });

  it("TreeViewRootProps supports RTL", () => {
    expectTypeOf<TreeViewRootProps>().toHaveProperty("dir");
    expectTypeOf<TreeViewRootProps["dir"]>().toEqualTypeOf<"ltr" | "rtl" | undefined>();
  });

  it("TreeViewItemRootProps requires value", () => {
    expectTypeOf<TreeViewItemRootProps>().toHaveProperty("value");
    expectTypeOf<TreeViewItemRootProps["value"]>().toEqualTypeOf<string>();
  });

  it("TreeViewItemRootProps supports disabled", () => {
    expectTypeOf<TreeViewItemRootProps>().toHaveProperty("disabled");
    expectTypeOf<TreeViewItemRootProps["disabled"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("TreeViewItemTriggerRootProps has children", () => {
    expectTypeOf<TreeViewItemTriggerRootProps>().toHaveProperty("children");
  });

  it("TreeViewItemContentRootProps has children", () => {
    expectTypeOf<TreeViewItemContentRootProps>().toHaveProperty("children");
  });

  it("TreeViewIndicatorRootProps has children", () => {
    expectTypeOf<TreeViewIndicatorRootProps>().toHaveProperty("children");
  });

  it("TreeViewContextValue has expansion toggle", () => {
    expectTypeOf<TreeViewContextValue>().toHaveProperty("toggleExpanded");
    type Fn = TreeViewContextValue["toggleExpanded"];
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<RowId>();
  });

  it("TreeViewContextValue has selection toggle", () => {
    expectTypeOf<TreeViewContextValue>().toHaveProperty("toggleSelected");
    type Fn = TreeViewContextValue["toggleSelected"];
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<RowId>();
  });

  it("TreeViewItemContextValue has depth and hasChildren", () => {
    expectTypeOf<TreeViewItemContextValue>().toHaveProperty("depth");
    expectTypeOf<TreeViewItemContextValue>().toHaveProperty("hasChildren");
    expectTypeOf<TreeViewItemContextValue["depth"]>().toEqualTypeOf<number>();
    expectTypeOf<TreeViewItemContextValue["hasChildren"]>().toEqualTypeOf<boolean>();
  });

  it("selection IDs use ReadonlySet<RowId>", () => {
    expectTypeOf<TreeViewRootProps["selectedIds"]>().toEqualTypeOf<
      ReadonlySet<RowId> | undefined
    >();
    expectTypeOf<TreeViewRootProps["expandedIds"]>().toEqualTypeOf<
      ReadonlySet<RowId> | undefined
    >();
  });
});
