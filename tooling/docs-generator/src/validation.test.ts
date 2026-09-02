import { describe, it, expect } from "vitest";
import {
  validateMetadata,
  formatDiagnostic,
  formatReport,
  isStaleAgainst,
  DIAG_CODES,
} from "./validation";
import type { GeneratorOutput, ComponentMeta } from "./schema";
import { SCHEMA_VERSION } from "./schema";

function makeComponent(overrides: Partial<ComponentMeta> = {}): ComponentMeta {
  return {
    name: "Button",
    packagePath: "@kairoui/core/components",
    propsInterface: "ButtonOwnProps",
    props: [
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        required: false,
        defaultValue: '"md"',
        description: "Size variant.",
        deprecated: false,
        deprecationMessage: undefined,
        since: undefined,
      },
    ],
    description: "Primary button.",
    sourceFile: undefined,
    since: undefined,
    import: {
      packagePath: "@kairoui/core/components",
      namedExports: ["Button"],
    },
    source: {
      filePath: undefined,
      propsInterface: "ButtonOwnProps",
    },
    ...overrides,
  };
}

function makeOutput(components: ComponentMeta[] = []): GeneratorOutput {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: "2026-01-01T00:00:00.000Z",
    generatorVersion: "0.1.0",
    packages: [
      {
        packageName: "@kairoui/core",
        entryPoint: "./components",
        components,
      },
    ],
  };
}

describe("docs-generator: validation", () => {
  describe("schema version", () => {
    it("passes with matching schema version", () => {
      const result = validateMetadata(makeOutput([makeComponent()]));
      expect(result.ok).toBe(true);
    });

    it("errors on schema version mismatch", () => {
      const out = makeOutput([makeComponent()]);
      const bad = { ...out, schemaVersion: 999 };
      const result = validateMetadata(bad);
      expect(result.ok).toBe(false);
      expect(result.diagnostics.some((d) => d.code === DIAG_CODES.SCHEMA_VERSION_MISMATCH)).toBe(
        true,
      );
    });
  });

  describe("package path validation", () => {
    it("errors on invalid packagePath prefix", () => {
      const comp = makeComponent({ packagePath: "invalid/pkg" });
      const result = validateMetadata(makeOutput([comp]));
      expect(result.ok).toBe(false);
      expect(result.diagnostics.some((d) => d.code === DIAG_CODES.INVALID_PACKAGE_PATH)).toBe(true);
    });

    it("errors when import.packagePath differs from component packagePath", () => {
      const comp = makeComponent({
        import: { packagePath: "@kairoui/wrong", namedExports: ["Button"] },
      });
      const result = validateMetadata(makeOutput([comp]));
      expect(result.ok).toBe(false);
      expect(
        result.diagnostics.some(
          (d) =>
            d.code === DIAG_CODES.INVALID_PACKAGE_PATH && d.message.includes("import.packagePath"),
        ),
      ).toBe(true);
    });

    it("errors when component is missing from namedExports", () => {
      const comp = makeComponent({
        import: { packagePath: "@kairoui/core/components", namedExports: ["Other"] },
      });
      const result = validateMetadata(makeOutput([comp]));
      expect(result.ok).toBe(false);
      expect(
        result.diagnostics.some(
          (d) => d.code === DIAG_CODES.INVALID_PACKAGE_PATH && d.message.includes("namedExports"),
        ),
      ).toBe(true);
    });
  });

  describe("prop type validation", () => {
    it("errors on empty prop type", () => {
      const comp = makeComponent({
        props: [
          {
            name: "broken",
            type: "",
            required: false,
            defaultValue: undefined,
            description: undefined,
            deprecated: false,
            deprecationMessage: undefined,
            since: undefined,
          },
        ],
      });
      const result = validateMetadata(makeOutput([comp]));
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.diagnostics.some((d) => d.code === DIAG_CODES.UNRESOLVED_TYPE)).toBe(true);
    });

    it("warns on any/never/unknown types", () => {
      const comp = makeComponent({
        props: [
          {
            name: "loose",
            type: "any",
            required: false,
            defaultValue: undefined,
            description: undefined,
            deprecated: false,
            deprecationMessage: undefined,
            since: undefined,
          },
        ],
      });
      const result = validateMetadata(makeOutput([comp]));
      expect(result.warningCount).toBeGreaterThan(0);
      expect(
        result.diagnostics.some(
          (d) => d.code === DIAG_CODES.UNRESOLVED_TYPE && d.severity === "warning",
        ),
      ).toBe(true);
    });
  });

  describe("defaults validation", () => {
    it("warns when required prop has a default", () => {
      const comp = makeComponent({
        props: [
          {
            name: "required",
            type: "string",
            required: true,
            defaultValue: '"x"',
            description: undefined,
            deprecated: false,
            deprecationMessage: undefined,
            since: undefined,
          },
        ],
      });
      const result = validateMetadata(makeOutput([comp]));
      expect(
        result.diagnostics.some(
          (d) => d.code === DIAG_CODES.DEFAULT_TYPE_MISMATCH && d.severity === "warning",
        ),
      ).toBe(true);
    });
  });

  describe("deprecated validation", () => {
    it("errors when deprecationMessage exists but deprecated=false", () => {
      const comp = makeComponent({
        props: [
          {
            name: "legacy",
            type: "string",
            required: false,
            defaultValue: undefined,
            description: undefined,
            deprecated: false,
            deprecationMessage: "Use foo instead.",
            since: undefined,
          },
        ],
      });
      const result = validateMetadata(makeOutput([comp]));
      expect(result.ok).toBe(false);
      expect(result.diagnostics.some((d) => d.code === DIAG_CODES.DEPRECATED_INCONSISTENT)).toBe(
        true,
      );
    });

    it("warns when a required prop is deprecated", () => {
      const comp = makeComponent({
        props: [
          {
            name: "old",
            type: "string",
            required: true,
            defaultValue: undefined,
            description: undefined,
            deprecated: true,
            deprecationMessage: undefined,
            since: undefined,
          },
        ],
      });
      const result = validateMetadata(makeOutput([comp]));
      expect(
        result.diagnostics.some(
          (d) => d.code === DIAG_CODES.DEPRECATED_INCONSISTENT && d.severity === "warning",
        ),
      ).toBe(true);
    });
  });

  describe("compound parts", () => {
    it("warns when compound part has no exported root", () => {
      const orphan = makeComponent({ name: "OrphanTrigger", propsInterface: "OrphanTriggerProps" });
      const result = validateMetadata(makeOutput([orphan]));
      expect(
        result.diagnostics.some(
          (d) => d.code === DIAG_CODES.COMPOUND_ORPHAN_PART && d.severity === "warning",
        ),
      ).toBe(true);
    });

    it("does not warn when compound root is exported", () => {
      const root = makeComponent({ name: "Dialog", propsInterface: "DialogRootProps" });
      const trigger = makeComponent({
        name: "DialogTrigger",
        propsInterface: "DialogTriggerProps",
        import: { packagePath: "@kairoui/core/components", namedExports: ["DialogTrigger"] },
      });
      const result = validateMetadata(makeOutput([root, trigger]));
      expect(result.diagnostics.some((d) => d.code === DIAG_CODES.COMPOUND_ORPHAN_PART)).toBe(
        false,
      );
    });
  });

  describe("duplicate detection", () => {
    it("errors on duplicate components under same path", () => {
      const dup1 = makeComponent();
      const dup2 = makeComponent();
      const result = validateMetadata(makeOutput([dup1, dup2]));
      expect(result.ok).toBe(false);
      expect(result.diagnostics.some((d) => d.code === DIAG_CODES.DUPLICATE_COMPONENT)).toBe(true);
    });
  });

  describe("empty propsInterface", () => {
    it("errors when propsInterface is empty", () => {
      const comp = makeComponent({ propsInterface: "" });
      const result = validateMetadata(makeOutput([comp]));
      expect(result.ok).toBe(false);
      expect(result.diagnostics.some((d) => d.code === DIAG_CODES.EMPTY_PROPS_INTERFACE)).toBe(
        true,
      );
    });
  });

  describe("discovered coverage", () => {
    it("warns when discovered component has no metadata", () => {
      const result = validateMetadata(makeOutput([makeComponent()]), {
        discoveredComponents: ["Button", "Missing"],
      });
      expect(
        result.diagnostics.some(
          (d) => d.code === DIAG_CODES.MISSING_METADATA && d.message.includes("Missing"),
        ),
      ).toBe(true);
    });
  });

  describe("missing descriptions", () => {
    it("warns when component and all props lack descriptions", () => {
      const comp = makeComponent({
        description: undefined,
        props: [
          {
            name: "size",
            type: "string",
            required: false,
            defaultValue: undefined,
            description: undefined,
            deprecated: false,
            deprecationMessage: undefined,
            since: undefined,
          },
        ],
      });
      const result = validateMetadata(makeOutput([comp]));
      expect(result.diagnostics.some((d) => d.code === DIAG_CODES.MISSING_DESCRIPTION)).toBe(true);
    });
  });

  describe("staleness", () => {
    it("detects when metadata differs ignoring generatedAt", () => {
      const a = makeOutput([makeComponent()]);
      const b = makeOutput([makeComponent({ description: "Different description." })]);
      expect(isStaleAgainst(a, b)).toBe(true);
    });

    it("does not consider generatedAt differences as stale", () => {
      const a = makeOutput([makeComponent()]);
      const b = { ...makeOutput([makeComponent()]), generatedAt: "2026-12-31T00:00:00.000Z" };
      expect(isStaleAgainst(a, b)).toBe(false);
    });
  });

  describe("formatting", () => {
    it("formats a diagnostic with hint", () => {
      const formatted = formatDiagnostic({
        severity: "error",
        code: "DOC001",
        message: "Test message",
        location: "Test/Location",
        hint: "Try this",
      });
      expect(formatted).toContain("ERROR");
      expect(formatted).toContain("DOC001");
      expect(formatted).toContain("Test/Location");
      expect(formatted).toContain("hint: Try this");
    });

    it("formats a passing report", () => {
      const result = validateMetadata(makeOutput([makeComponent()]));
      expect(formatReport(result)).toContain("Validation passed");
    });

    it("formats a failing report with counts", () => {
      const comp = makeComponent({ packagePath: "invalid" });
      const result = validateMetadata(makeOutput([comp]));
      const report = formatReport(result);
      expect(report).toContain("error(s)");
      expect(report).toContain("DOC003");
    });
  });
});
