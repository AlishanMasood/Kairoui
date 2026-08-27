import { describe, it, expect } from "vitest";
import {
  getCompoundRoot,
  groupCompoundComponents,
  getCompoundPartNames,
  isCompoundPart,
} from "./compound";
import type { ComponentMeta, CompoundComponentMeta } from "./schema";

function makeMeta(name: string): ComponentMeta {
  return {
    name,
    packagePath: "@kairoui/core/components",
    propsInterface: `${name}Props`,
    props: [],
    description: undefined,
    sourceFile: undefined,
    since: undefined,
    import: { packagePath: "@kairoui/core/components", namedExports: [name] },
    source: { filePath: undefined, propsInterface: `${name}Props` },
  };
}

// ─── getCompoundRoot ────────────────────────────────────────────────

describe("getCompoundRoot", () => {
  it("extracts root from DialogTrigger", () => {
    expect(getCompoundRoot("DialogTrigger")).toBe("Dialog");
  });

  it("extracts root from TabsList", () => {
    expect(getCompoundRoot("TabsList")).toBe("Tabs");
  });

  it("extracts root from AccordionContent", () => {
    expect(getCompoundRoot("AccordionContent")).toBe("Accordion");
  });

  it("extracts root from AppShellHeader", () => {
    expect(getCompoundRoot("AppShellHeader")).toBe("AppShell");
  });

  it("extracts root from BreadcrumbsSeparator", () => {
    expect(getCompoundRoot("BreadcrumbsSeparator")).toBe("Breadcrumbs");
  });

  it("extracts root from EmptyStateIcon", () => {
    expect(getCompoundRoot("EmptyStateIcon")).toBe("EmptyState");
  });

  it("returns undefined for standalone components", () => {
    expect(getCompoundRoot("Button")).toBeUndefined();
    expect(getCompoundRoot("Checkbox")).toBeUndefined();
    expect(getCompoundRoot("Calendar")).toBeUndefined();
  });

  it("returns undefined for single-word parts", () => {
    expect(getCompoundRoot("Trigger")).toBeUndefined();
    expect(getCompoundRoot("Content")).toBeUndefined();
  });
});

// ─── groupCompoundComponents ────────────────────────────────────────

describe("groupCompoundComponents", () => {
  it("groups Dialog compound components", () => {
    const components = [
      makeMeta("Dialog"),
      makeMeta("DialogTrigger"),
      makeMeta("DialogContent"),
      makeMeta("DialogTitle"),
      makeMeta("DialogClose"),
      makeMeta("Button"),
    ];
    const groups = groupCompoundComponents(components);
    const dialog = groups.find((g) => g.name === "Dialog");
    expect(dialog).toBeDefined();
    expect(dialog!.parts).toHaveLength(5);
    expect(dialog!.parts[0]!.name).toBe("Dialog");
  });

  it("groups Tabs compound components", () => {
    const components = [
      makeMeta("Tabs"),
      makeMeta("TabsList"),
      makeMeta("TabsTrigger"),
      makeMeta("TabsContent"),
    ];
    const groups = groupCompoundComponents(components);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.name).toBe("Tabs");
    expect(groups[0]!.parts).toHaveLength(4);
  });

  it("groups AppShell compound components", () => {
    const components = [
      makeMeta("AppShell"),
      makeMeta("AppShellHeader"),
      makeMeta("AppShellSidebar"),
      makeMeta("AppShellMain"),
      makeMeta("AppShellFooter"),
      makeMeta("AppShellAside"),
    ];
    const groups = groupCompoundComponents(components);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.name).toBe("AppShell");
  });

  it("does not group orphan parts without root", () => {
    const components = [makeMeta("DialogTrigger"), makeMeta("DialogContent")];
    const groups = groupCompoundComponents(components);
    expect(groups).toHaveLength(0);
  });

  it("standalone components are not grouped", () => {
    const components = [makeMeta("Button"), makeMeta("Checkbox"), makeMeta("Switch")];
    const groups = groupCompoundComponents(components);
    expect(groups).toHaveLength(0);
  });

  it("groups are sorted alphabetically", () => {
    const components = [
      makeMeta("Tabs"),
      makeMeta("TabsList"),
      makeMeta("Dialog"),
      makeMeta("DialogTrigger"),
      makeMeta("Accordion"),
      makeMeta("AccordionItem"),
    ];
    const groups = groupCompoundComponents(components);
    expect(groups.map((g) => g.name)).toEqual(["Accordion", "Dialog", "Tabs"]);
  });

  it("parts within a group are sorted (root first)", () => {
    const components = [
      makeMeta("TabsTrigger"),
      makeMeta("TabsContent"),
      makeMeta("Tabs"),
      makeMeta("TabsList"),
    ];
    const groups = groupCompoundComponents(components);
    const parts = groups[0]!.parts.map((p) => p.name);
    expect(parts[0]).toBe("Tabs");
    expect(parts.slice(1)).toEqual(["TabsContent", "TabsList", "TabsTrigger"]);
  });

  it("preserves packagePath from root", () => {
    const components = [makeMeta("Dialog"), makeMeta("DialogTrigger")];
    const groups = groupCompoundComponents(components);
    expect(groups[0]!.packagePath).toBe("@kairoui/core/components");
  });
});

// ─── getCompoundPartNames ───────────────────────────────────────────

describe("getCompoundPartNames", () => {
  it("returns all part names", () => {
    const group: CompoundComponentMeta = {
      name: "Dialog",
      packagePath: "@kairoui/core/components",
      parts: [makeMeta("Dialog"), makeMeta("DialogTrigger"), makeMeta("DialogContent")],
    };
    expect(getCompoundPartNames(group)).toEqual(["Dialog", "DialogTrigger", "DialogContent"]);
  });
});

// ─── isCompoundPart ─────────────────────────────────────────────────

describe("isCompoundPart", () => {
  const groups: CompoundComponentMeta[] = [
    {
      name: "Dialog",
      packagePath: "@kairoui/core/components",
      parts: [makeMeta("Dialog"), makeMeta("DialogTrigger"), makeMeta("DialogContent")],
    },
  ];

  it("returns true for a part", () => {
    expect(isCompoundPart("DialogTrigger", groups)).toBe(true);
  });

  it("returns false for the root component itself", () => {
    expect(isCompoundPart("Dialog", groups)).toBe(false);
  });

  it("returns false for unrelated component", () => {
    expect(isCompoundPart("Button", groups)).toBe(false);
  });
});
