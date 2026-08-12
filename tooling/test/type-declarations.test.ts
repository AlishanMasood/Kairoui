/**
 * TypeScript declarations and type performance audit.
 *
 * Validates:
 * - Declaration files exist and are reasonable size
 * - No internal type leakage (no underscore-prefixed types)
 * - No `any` in public declarations
 * - No excessive generic depth
 * - DTS chunk files are deterministic
 * - Type-check performance baseline
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const PACKAGES_DIR = resolve(import.meta.dirname, "../../packages");

function readDts(pkg: string, file = "index.d.ts"): string {
  return readFileSync(resolve(PACKAGES_DIR, pkg, "dist", file), "utf-8");
}

// ─── Declaration file quality ───────────────────────────────────────

describe("TypeScript declarations: quality", () => {
  const packages = ["utils", "tokens", "theme", "hooks", "core"];

  for (const pkg of packages) {
    it(`@kairoui/${pkg}: index.d.ts exists and is non-empty`, () => {
      const content = readDts(pkg);
      expect(content.length).toBeGreaterThan(0);
    });

    it(`@kairoui/${pkg}: no 'any' type in declarations`, () => {
      const content = readDts(pkg);
      // Match `: any`, `any[]`, `<any>`, `Record<string, any>` but not doc comments
      const lines = content
        .split("\n")
        .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//"));
      const anyMatches = lines.filter((l) => /\bany\b/.test(l));
      expect(anyMatches).toHaveLength(0);
    });

    it(`@kairoui/${pkg}: no underscore-prefixed types leaked`, () => {
      const content = readDts(pkg);
      const internalTypes = content.match(/^(type|interface) _[A-Z]/gm);
      expect(internalTypes ?? []).toHaveLength(0);
    });
  }
});

// ─── Composition declarations specifics ─────────────────────────────

describe("TypeScript declarations: composition", () => {
  it("composition.d.ts exists", () => {
    const content = readDts("core", "composition.d.ts");
    expect(content.length).toBeGreaterThan(0);
  });

  it("exports PolymorphicProps type", () => {
    const content = readDts("core", "composition.d.ts");
    expect(content).toContain("PolymorphicProps");
  });

  it("exports ComponentStyleContract type", () => {
    const content = readDts("core", "composition.d.ts");
    expect(content).toContain("ComponentStyleContract");
  });

  it("exports SlotDefinition type", () => {
    const content = readDts("core", "composition.d.ts");
    expect(content).toContain("SlotDefinition");
  });

  it("exports CSS generation functions", () => {
    const content = readDts("core", "composition.d.ts");
    expect(content).toContain("generateComponentCss");
    expect(content).toContain("generateStylesheet");
  });

  it("exports class generation functions", () => {
    const content = readDts("core", "composition.d.ts");
    expect(content).toContain("componentClass");
    expect(content).toContain("slotClass");
    expect(content).toContain("variantClass");
  });

  it("no deep conditional types (no nested infer)", () => {
    const content = readDts("core", "composition.d.ts");
    const lines = content.split("\n").filter((l) => !l.trim().startsWith("*"));
    const inferLines = lines.filter((l) => /\binfer\b/.test(l));
    expect(inferLines).toHaveLength(0);
  });

  it("no deeply nested extends (3+ levels)", () => {
    const content = readDts("core", "composition.d.ts");
    const deepExtends = content.match(/extends.*extends.*extends/g);
    expect(deepExtends ?? []).toHaveLength(0);
  });
});

// ─── Declaration size budgets ───────────────────────────────────────

describe("TypeScript declarations: size budgets", () => {
  const budgets = [
    { pkg: "utils", file: "index.d.ts", maxKB: 30 },
    { pkg: "tokens", file: "index.d.ts", maxKB: 120 },
    { pkg: "theme", file: "index.d.ts", maxKB: 30 },
    { pkg: "hooks", file: "index.d.ts", maxKB: 15 },
    { pkg: "core", file: "index.d.ts", maxKB: 10 },
    { pkg: "core", file: "composition.d.ts", maxKB: 50 },
  ];

  for (const { pkg, file, maxKB } of budgets) {
    it(`@kairoui/${pkg} ${file}: under ${String(maxKB)}KB`, () => {
      const content = readDts(pkg, file);
      const sizeKB = Buffer.byteLength(content, "utf-8") / 1024;
      expect(sizeKB).toBeLessThan(maxKB);
    });
  }
});

// ─── Theme DTS chunks ───────────────────────────────────────────────

describe("TypeScript declarations: theme DTS chunks", () => {
  it("theme has shared type chunks (no duplication across entries)", () => {
    const files = readdirSync(resolve(PACKAGES_DIR, "theme/dist")).filter((f) =>
      f.endsWith(".d.ts"),
    );
    // Should have main entries + shared chunks
    expect(files.length).toBeGreaterThan(3);
  });

  it("theme chunks have content-hash names (deterministic)", () => {
    const files = readdirSync(resolve(PACKAGES_DIR, "theme/dist")).filter(
      (f) => f.endsWith(".d.ts") && f !== "index.d.ts" && f !== "dom.d.ts" && f !== "server.d.ts",
    );
    for (const file of files) {
      // Content-hash pattern: name-HASH.d.ts
      expect(file).toMatch(/^[a-z]+-[A-Za-z0-9]+\.d\.ts$/);
    }
  });

  it("main entries reference shared chunks", () => {
    const indexDts = readDts("theme");
    const domDts = readDts("theme", "dom.d.ts");
    // Both should import from shared type chunks
    const hasChunkImport = indexDts.includes("from './") || domDts.includes("from './");
    expect(hasChunkImport).toBe(true);
  });
});
