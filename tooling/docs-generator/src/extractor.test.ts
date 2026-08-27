import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createProgramFromFiles } from "./discovery";
import { extractComponentMeta, findPropsInterface, stringifyType } from "./extractor";

const THIS_DIR =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = resolve(THIS_DIR, "../../..");
const CORE_COMPONENTS_DTS = resolve(MONOREPO_ROOT, "packages/core/dist/components/index.d.ts");

function getProgram() {
  return createProgramFromFiles([CORE_COMPONENTS_DTS]);
}

// ─── Primitive component: Button ────────────────────────────────────

describe("extraction: Button (primitive component)", () => {
  it("extracts ButtonOwnProps", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS);
    if (!sf) throw new Error("Source file not found");

    const meta = extractComponentMeta(
      checker,
      sf,
      "Button",
      "ButtonOwnProps",
      "@kairoui/core/components",
    );
    expect(meta).toBeDefined();
    expect(meta!.name).toBe("Button");
    expect(meta!.props.length).toBeGreaterThan(0);
  });

  it("finds expected Button props", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "Button",
      "ButtonOwnProps",
      "@kairoui/core/components",
    );
    const propNames = meta!.props.map((p) => p.name);
    expect(propNames).toContain("children");
    expect(propNames).toContain("disabled");
    expect(propNames).toContain("loading");
    expect(propNames).toContain("appearance");
    expect(propNames).toContain("size");
  });

  it("marks all Button props as optional", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "Button",
      "ButtonOwnProps",
      "@kairoui/core/components",
    );
    for (const prop of meta!.props) {
      expect(prop.required).toBe(false);
    }
  });

  it("extracts literal union types for appearance", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "Button",
      "ButtonOwnProps",
      "@kairoui/core/components",
    );
    const appearance = meta!.props.find((p) => p.name === "appearance");
    expect(appearance).toBeDefined();
    expect(appearance!.type).toContain("solid");
    expect(appearance!.type).toContain("outline");
  });

  it("does not include inherited HTML attributes", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "Button",
      "ButtonOwnProps",
      "@kairoui/core/components",
    );
    const propNames = meta!.props.map((p) => p.name);
    // These are native HTML/React attributes — should NOT appear
    expect(propNames).not.toContain("onClick");
    expect(propNames).not.toContain("className");
    expect(propNames).not.toContain("id");
    expect(propNames).not.toContain("style");
    expect(propNames).not.toContain("tabIndex");
  });
});

// ─── Compound component: Tabs ───────────────────────────────────────

describe("extraction: Tabs (compound component)", () => {
  it("extracts TabsRootProps", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "Tabs",
      "TabsRootProps",
      "@kairoui/core/components",
    );
    expect(meta).toBeDefined();
    const propNames = meta!.props.map((p) => p.name);
    expect(propNames).toContain("value");
    expect(propNames).toContain("defaultValue");
    expect(propNames).toContain("onValueChange");
    expect(propNames).toContain("orientation");
  });

  it("extracts TabsTriggerProps", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "TabsTrigger",
      "TabsTriggerProps",
      "@kairoui/core/components",
    );
    expect(meta).toBeDefined();
    const propNames = meta!.props.map((p) => p.name);
    expect(propNames).toContain("value");
    expect(propNames).toContain("disabled");
  });
});

// ─── DataTable (generic component) ──────────────────────────────────

describe("extraction: DataTable (generic)", () => {
  it("extracts DataTableRootProps", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "DataTable",
      "DataTableRootProps",
      "@kairoui/core/components",
    );
    expect(meta).toBeDefined();
    const propNames = meta!.props.map((p) => p.name);
    expect(propNames).toContain("data");
    expect(propNames).toContain("columns");
    expect(propNames).toContain("getRowId");
  });

  it("data prop shows readonly array type", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "DataTable",
      "DataTableRootProps",
      "@kairoui/core/components",
    );
    const dataProp = meta!.props.find((p) => p.name === "data");
    expect(dataProp).toBeDefined();
    expect(dataProp!.type).toContain("readonly");
  });
});

// ─── Callback props ─────────────────────────────────────────────────

describe("extraction: callback props", () => {
  it("onValueChange shows function signature", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "Tabs",
      "TabsRootProps",
      "@kairoui/core/components",
    );
    const cb = meta!.props.find((p) => p.name === "onValueChange");
    expect(cb).toBeDefined();
    expect(cb!.type).toContain("=>");
  });
});

// ─── Calendar ───────────────────────────────────────────────────────

describe("extraction: Calendar", () => {
  it("extracts CalendarRootProps", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "Calendar",
      "CalendarRootProps",
      "@kairoui/core/components",
    );
    expect(meta).toBeDefined();
    const propNames = meta!.props.map((p) => p.name);
    expect(propNames).toContain("value");
    expect(propNames).toContain("min");
    expect(propNames).toContain("max");
    expect(propNames).toContain("locale");
    expect(propNames).toContain("weekStartsOn");
  });
});

// ─── Type stringification ───────────────────────────────────────────

describe("stringifyType", () => {
  it("produces readable output for primitive types", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const type = findPropsInterface(checker, sf, "TabsRootProps");
    expect(type).toBeDefined();
    const props = type!.getProperties();
    const valueProp = props.find((p) => p.getName() === "value");
    expect(valueProp).toBeDefined();
    const propType = checker.getTypeOfSymbol(valueProp!);
    const str = stringifyType(checker, propType);
    expect(str).toContain("string");
  });
});

// ─── TreeView ───────────────────────────────────────────────────────

describe("extraction: TreeView", () => {
  it("extracts TreeViewRootProps", () => {
    const { program, checker } = getProgram();
    const sf = program.getSourceFile(CORE_COMPONENTS_DTS)!;
    const meta = extractComponentMeta(
      checker,
      sf,
      "TreeView",
      "TreeViewRootProps",
      "@kairoui/core/components",
    );
    expect(meta).toBeDefined();
    const propNames = meta!.props.map((p) => p.name);
    expect(propNames).toContain("expandedIds");
    expect(propNames).toContain("selectionMode");
    expect(propNames).toContain("dir");
  });
});
