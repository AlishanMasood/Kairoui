import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  TreeView,
  TreeViewItem,
  TreeViewItemTrigger,
  TreeViewItemContent,
  TreeViewIndicator,
} from "./tree-view";

afterEach(cleanup);

function SimpleTree(props: {
  expanded?: ReadonlySet<string>;
  onExpandedChange?: (ids: ReadonlySet<string>) => void;
}) {
  return createElement(
    TreeView,
    {
      ...(props.expanded !== undefined
        ? { expandedIds: props.expanded }
        : { defaultExpandedIds: new Set(["root"]) }),
      ...(props.onExpandedChange ? { onExpandedChange: props.onExpandedChange } : undefined),
    } as never,
    createElement(
      TreeViewItem,
      { value: "root" },
      createElement(TreeViewItemTrigger, null, createElement(TreeViewIndicator), "Root"),
      createElement(
        TreeViewItemContent,
        null,
        createElement(
          TreeViewItem,
          { value: "child1" },
          createElement(TreeViewItemTrigger, null, "Child 1"),
        ),
        createElement(
          TreeViewItem,
          { value: "child2" },
          createElement(TreeViewItemTrigger, null, createElement(TreeViewIndicator), "Child 2"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "grandchild" },
              createElement(TreeViewItemTrigger, null, "Grandchild"),
            ),
          ),
        ),
      ),
    ),
  );
}

// ─── Semantic structure ─────────────────────────────────────────────

describe("TreeView: semantic structure", () => {
  it("renders root as <ul> with role=tree", () => {
    render(createElement(TreeView, { "data-testid": "tree" } as never));
    expect(screen.getByTestId("tree").tagName).toBe("UL");
    expect(screen.getByRole("tree")).toBeInTheDocument();
  });

  it("renders items with role=treeitem", () => {
    render(SimpleTree({}));
    expect(screen.getAllByRole("treeitem").length).toBeGreaterThan(0);
  });

  it("renders content group with role=group", () => {
    render(SimpleTree({}));
    const groups = document.querySelectorAll("[role='group']");
    expect(groups.length).toBeGreaterThan(0);
  });

  it("sets aria-expanded on branch items", () => {
    render(SimpleTree({}));
    const root = screen.getAllByRole("treeitem")[0]!;
    expect(root.getAttribute("aria-expanded")).toBe("true");
  });

  it("does not set aria-expanded on leaf items", () => {
    render(SimpleTree({}));
    const items = screen.getAllByRole("treeitem");
    // Leaf items are the ones with textContent exactly "Child 1" (no nested children)
    const leaf = items.find((el) => el.textContent === "Child 1")!;
    expect(leaf.getAttribute("aria-expanded")).toBeNull();
  });
});

// ─── Expansion ──────────────────────────────────────────────────────

describe("TreeView: expansion", () => {
  it("shows children when expanded", () => {
    render(SimpleTree({}));
    expect(screen.getByText("Child 1")).toBeInTheDocument();
  });

  it("hides children when collapsed", () => {
    render(
      createElement(
        TreeView,
        null,
        createElement(
          TreeViewItem,
          { value: "folder" },
          createElement(TreeViewItemTrigger, null, "Folder"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "file" },
              createElement(TreeViewItemTrigger, null, "File"),
            ),
          ),
        ),
      ),
    );
    expect(screen.queryByText("File")).not.toBeInTheDocument();
  });

  it("toggles expansion on trigger click", () => {
    render(SimpleTree({}));
    const rootTrigger = screen
      .getByText("Root")
      .closest("[data-kui-component='TreeViewItemTrigger']")!;
    fireEvent.click(rootTrigger);
    // After collapse, children should be hidden
    expect(screen.queryByText("Child 1")).not.toBeInTheDocument();
  });

  it("calls onExpandedChange", () => {
    const onChange = vi.fn();
    render(SimpleTree({ expanded: new Set(["root"]), onExpandedChange: onChange }));
    const rootTrigger = screen
      .getByText("Root")
      .closest("[data-kui-component='TreeViewItemTrigger']")!;
    fireEvent.click(rootTrigger);
    expect(onChange).toHaveBeenCalled();
  });
});

// ─── Selection ──────────────────────────────────────────────────────

describe("TreeView: selection", () => {
  it("sets aria-selected in single mode", () => {
    render(
      createElement(
        TreeView,
        { selectionMode: "single", defaultExpandedIds: new Set(["root"]) } as never,
        createElement(
          TreeViewItem,
          { value: "root" },
          createElement(TreeViewItemTrigger, null, "Root"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "a" },
              createElement(TreeViewItemTrigger, null, "A"),
            ),
          ),
        ),
      ),
    );
    const trigger = screen.getByText("A").closest("[data-kui-component='TreeViewItemTrigger']")!;
    fireEvent.click(trigger);
    const item = screen.getByText("A").closest("[role='treeitem']")!;
    expect(item.getAttribute("aria-selected")).toBe("true");
  });

  it("calls onSelectionChange", () => {
    const onChange = vi.fn();
    render(
      createElement(
        TreeView,
        {
          selectionMode: "single",
          defaultExpandedIds: new Set(["root"]),
          onSelectionChange: onChange,
        } as never,
        createElement(
          TreeViewItem,
          { value: "root" },
          createElement(TreeViewItemTrigger, null, "Root"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "a" },
              createElement(TreeViewItemTrigger, null, "A"),
            ),
          ),
        ),
      ),
    );
    const trigger = screen.getByText("A").closest("[data-kui-component='TreeViewItemTrigger']")!;
    fireEvent.click(trigger);
    expect(onChange).toHaveBeenCalled();
  });
});

// ─── Keyboard navigation ────────────────────────────────────────────

describe("TreeView: keyboard", () => {
  it("ArrowRight expands collapsed branch", () => {
    render(
      createElement(
        TreeView,
        null,
        createElement(
          TreeViewItem,
          { value: "folder" },
          createElement(TreeViewItemTrigger, { "data-testid": "trigger" } as never, "Folder"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "file" },
              createElement(TreeViewItemTrigger, null, "File"),
            ),
          ),
        ),
      ),
    );
    const trigger = screen.getByTestId("trigger");
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("ArrowLeft collapses expanded branch", () => {
    render(SimpleTree({}));
    const rootTrigger = screen
      .getByText("Root")
      .closest("[data-kui-component='TreeViewItemTrigger']")!;
    fireEvent.keyDown(rootTrigger, { key: "ArrowLeft" });
    expect(screen.queryByText("Child 1")).not.toBeInTheDocument();
  });

  it("Enter/Space activates trigger", () => {
    render(
      createElement(
        TreeView,
        null,
        createElement(
          TreeViewItem,
          { value: "folder" },
          createElement(TreeViewItemTrigger, { "data-testid": "trigger" } as never, "Folder"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "file" },
              createElement(TreeViewItemTrigger, null, "File"),
            ),
          ),
        ),
      ),
    );
    const trigger = screen.getByTestId("trigger");
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("RTL: ArrowLeft expands, ArrowRight collapses", () => {
    render(
      createElement(
        TreeView,
        { dir: "rtl" },
        createElement(
          TreeViewItem,
          { value: "folder" },
          createElement(TreeViewItemTrigger, { "data-testid": "trigger" } as never, "Folder"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "file" },
              createElement(TreeViewItemTrigger, null, "File"),
            ),
          ),
        ),
      ),
    );
    const trigger = screen.getByTestId("trigger");
    // RTL: ArrowLeft expands
    fireEvent.keyDown(trigger, { key: "ArrowLeft" });
    expect(screen.getByText("File")).toBeInTheDocument();
    // RTL: ArrowRight collapses
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    expect(screen.queryByText("File")).not.toBeInTheDocument();
  });
});

// ─── Disabled items ─────────────────────────────────────────────────

describe("TreeView: disabled items", () => {
  it("disabled item has aria-disabled", () => {
    render(
      createElement(
        TreeView,
        { defaultExpandedIds: new Set(["root"]) } as never,
        createElement(
          TreeViewItem,
          { value: "root" },
          createElement(TreeViewItemTrigger, null, "Root"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "disabled", disabled: true },
              createElement(TreeViewItemTrigger, null, "Disabled"),
            ),
          ),
        ),
      ),
    );
    const item = screen.getByText("Disabled").closest("[role='treeitem']")!;
    expect(item.getAttribute("aria-disabled")).toBe("true");
  });

  it("disabled trigger has tabindex=-1", () => {
    render(
      createElement(
        TreeView,
        { defaultExpandedIds: new Set(["root"]) } as never,
        createElement(
          TreeViewItem,
          { value: "root" },
          createElement(TreeViewItemTrigger, null, "Root"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "dis", disabled: true },
              createElement(TreeViewItemTrigger, { "data-testid": "dis-trigger" } as never, "D"),
            ),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("dis-trigger").getAttribute("tabindex")).toBe("-1");
  });
});

// ─── Indicator ──────────────────────────────────────────────────────

describe("TreeView: indicator", () => {
  it("renders expand indicator for branches", () => {
    render(SimpleTree({}));
    const indicators = document.querySelectorAll("[data-kui-component='TreeViewIndicator']");
    expect(indicators.length).toBeGreaterThan(0);
  });

  it("indicator has data-state reflecting expansion", () => {
    render(SimpleTree({}));
    const indicator = document.querySelector("[data-kui-component='TreeViewIndicator']")!;
    expect(indicator.getAttribute("data-state")).toBe("open");
  });

  it("indicator is aria-hidden", () => {
    render(SimpleTree({}));
    const indicator = document.querySelector("[data-kui-component='TreeViewIndicator']")!;
    expect(indicator.getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── Depth tracking ─────────────────────────────────────────────────

describe("TreeView: depth tracking", () => {
  it("root items have depth 0", () => {
    render(SimpleTree({}));
    const rootItem = screen.getAllByRole("treeitem")[0]!;
    expect(rootItem.getAttribute("data-depth")).toBe("0");
  });

  it("nested items have increasing depth", () => {
    render(SimpleTree({ expanded: new Set(["root", "child2"]) }));
    const items = screen.getAllByRole("treeitem");
    const grandchild = items.find((el) => el.textContent === "Grandchild")!;
    expect(Number(grandchild.getAttribute("data-depth"))).toBeGreaterThan(0);
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("TreeView: ref forwarding", () => {
  it("TreeView forwards ref", () => {
    const ref = createRef<HTMLUListElement>();
    render(createElement(TreeView, { ref }));
    expect(ref.current?.tagName).toBe("UL");
  });

  it("TreeViewItemTrigger forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      createElement(
        TreeView,
        { defaultExpandedIds: new Set(["root"]) } as never,
        createElement(
          TreeViewItem,
          { value: "root" },
          createElement(TreeViewItemTrigger, { ref }, "Root"),
        ),
      ),
    );
    expect(ref.current?.tagName).toBe("DIV");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("TreeView: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(
      createElement(
        TreeView,
        { defaultExpandedIds: new Set(["root"]) } as never,
        createElement(
          TreeViewItem,
          { value: "root" },
          createElement(TreeViewItemTrigger, null, "Root"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "child" },
              createElement(TreeViewItemTrigger, null, "Child"),
            ),
          ),
        ),
      ),
    );
    expect(html).toContain('role="tree"');
    expect(html).toContain('role="treeitem"');
    expect(html).toContain("Root");
    expect(html).toContain("Child");
  });
});

// ─── StrictMode ─────────────────────────────────────────────────────

describe("TreeView: StrictMode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, SimpleTree({})));
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getAllByRole("treeitem").length).toBeGreaterThan(0);
  });
});
