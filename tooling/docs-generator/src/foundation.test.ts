import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createGeneratorOutput, normalizeComponents } from "./normalization";
import { writeMetadata } from "./serialization";
import type { ComponentMeta, GeneratorOutput, PackageDocMeta } from "./schema";

const TMP_DIR = resolve(import.meta.dirname, "../.test-output");

// ─── normalizeComponents ────────────────────────────────────────────

describe("normalizeComponents", () => {
  it("wraps components in PackageDocMeta", () => {
    const components: ComponentMeta[] = [
      {
        name: "Button",
        packagePath: "@kairoui/core/components",
        propsInterface: "ButtonOwnProps",
        props: [],
        description: "A button",
        sourceFile: "src/components/button/button.tsx",
        since: undefined,
        import: { packagePath: "@kairoui/core/components", namedExports: ["Button"] },
        source: { filePath: "src/components/button/button.tsx", propsInterface: "ButtonOwnProps" },
      },
    ];
    const result = normalizeComponents(components, "@kairoui/core", "./components");
    expect(result.packageName).toBe("@kairoui/core");
    expect(result.entryPoint).toBe("./components");
    expect(result.components).toHaveLength(1);
    expect(result.components[0]!.name).toBe("Button");
  });

  it("handles empty components", () => {
    const result = normalizeComponents([], "@kairoui/core", "./components");
    expect(result.components).toHaveLength(0);
  });
});

// ─── createGeneratorOutput ──────────────────────────────────────────

describe("createGeneratorOutput", () => {
  it("creates output with timestamp, version, and schema version", () => {
    const output = createGeneratorOutput([]);
    expect(output.generatedAt).toBeDefined();
    expect(output.generatorVersion).toBe("0.1.0");
    expect(output.schemaVersion).toBe(1);
    expect(output.packages).toHaveLength(0);
  });

  it("includes provided packages", () => {
    const pkg: PackageDocMeta = {
      packageName: "@kairoui/core",
      entryPoint: "./components",
      components: [],
    };
    const output = createGeneratorOutput([pkg]);
    expect(output.packages).toHaveLength(1);
  });

  it("generatedAt is a valid ISO timestamp", () => {
    const output = createGeneratorOutput([]);
    const parsed = new Date(output.generatedAt);
    expect(parsed.getTime()).not.toBeNaN();
  });
});

// ─── writeMetadata ──────────────────────────────────────────────────

describe("writeMetadata", () => {
  const outFile = resolve(TMP_DIR, "test-output.json");

  it("writes valid JSON to file", () => {
    try {
      mkdirSync(TMP_DIR, { recursive: true });
      const output = createGeneratorOutput([]);
      writeMetadata(output, outFile);
      expect(existsSync(outFile)).toBe(true);
      const content = JSON.parse(readFileSync(outFile, "utf-8")) as GeneratorOutput;
      expect(content.generatorVersion).toBe("0.1.0");
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  it("creates directories recursively", () => {
    const nested = resolve(TMP_DIR, "a/b/c/output.json");
    try {
      const output = createGeneratorOutput([]);
      writeMetadata(output, nested);
      expect(existsSync(nested)).toBe(true);
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });
});
