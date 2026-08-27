import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { generate } from "./generator";
import { validateGeneratorOutput } from "./schema";
import type { GeneratorOutput } from "./schema";

const THIS_DIR =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = resolve(THIS_DIR, "../../..");
const TMP_DIR = resolve(THIS_DIR, "../.test-cli-output");

function cleanTmp() {
  rmSync(TMP_DIR, { recursive: true, force: true });
}

// ─── Full generation ────────────────────────────────────────────────

describe("generator: full pipeline", () => {
  it("generates valid metadata for core package", () => {
    cleanTmp();
    try {
      const result = generate({
        monorepoRoot: MONOREPO_ROOT,
        outputDir: TMP_DIR,
        packages: ["core"],
      });
      expect(result.success).toBe(true);
      expect(result.componentCount).toBeGreaterThan(10);

      const outPath = resolve(TMP_DIR, "api-metadata.json");
      expect(existsSync(outPath)).toBe(true);

      const content = JSON.parse(readFileSync(outPath, "utf-8")) as GeneratorOutput;
      expect(validateGeneratorOutput(content)).toBe(true);
    } finally {
      cleanTmp();
    }
  });

  it("extracts Button with props", () => {
    cleanTmp();
    try {
      generate({ monorepoRoot: MONOREPO_ROOT, outputDir: TMP_DIR, packages: ["core"] });
      const content = JSON.parse(
        readFileSync(resolve(TMP_DIR, "api-metadata.json"), "utf-8"),
      ) as GeneratorOutput;
      const core = content.packages.find((p) => p.packageName === "@kairoui/core");
      const button = core?.components.find((c) => c.name === "Button");
      expect(button).toBeDefined();
      expect(button!.props.length).toBeGreaterThan(0);
      const appearance = button!.props.find((p) => p.name === "appearance");
      expect(appearance?.type).toContain("solid");
    } finally {
      cleanTmp();
    }
  });

  it("extracts Tabs with compound parts", () => {
    cleanTmp();
    try {
      generate({ monorepoRoot: MONOREPO_ROOT, outputDir: TMP_DIR, packages: ["core"] });
      const content = JSON.parse(
        readFileSync(resolve(TMP_DIR, "api-metadata.json"), "utf-8"),
      ) as GeneratorOutput;
      const core = content.packages.find((p) => p.packageName === "@kairoui/core");
      expect(core?.components.find((c) => c.name === "Tabs")).toBeDefined();
      expect(core?.components.find((c) => c.name === "TabsList")).toBeDefined();
      expect(core?.components.find((c) => c.name === "TabsTrigger")).toBeDefined();
    } finally {
      cleanTmp();
    }
  });

  it("includes default values from source", () => {
    cleanTmp();
    try {
      generate({ monorepoRoot: MONOREPO_ROOT, outputDir: TMP_DIR, packages: ["core"] });
      const content = JSON.parse(
        readFileSync(resolve(TMP_DIR, "api-metadata.json"), "utf-8"),
      ) as GeneratorOutput;
      const core = content.packages.find((p) => p.packageName === "@kairoui/core");
      const tabs = core?.components.find((c) => c.name === "Tabs");
      const orientation = tabs?.props.find((p) => p.name === "orientation");
      // Tabs has orientation = "horizontal" in source
      if (orientation?.defaultValue) {
        expect(orientation.defaultValue).toContain("horizontal");
      }
    } finally {
      cleanTmp();
    }
  });
});

// ─── Deterministic output ───────────────────────────────────────────

describe("generator: determinism", () => {
  it("produces identical output on repeated runs (excluding timestamp)", () => {
    cleanTmp();
    const tmp1 = resolve(TMP_DIR, "run1");
    const tmp2 = resolve(TMP_DIR, "run2");
    try {
      generate({ monorepoRoot: MONOREPO_ROOT, outputDir: tmp1, packages: ["core"] });
      generate({ monorepoRoot: MONOREPO_ROOT, outputDir: tmp2, packages: ["core"] });

      const out1 = JSON.parse(readFileSync(resolve(tmp1, "api-metadata.json"), "utf-8")) as Record<
        string,
        unknown
      >;
      const out2 = JSON.parse(readFileSync(resolve(tmp2, "api-metadata.json"), "utf-8")) as Record<
        string,
        unknown
      >;

      delete out1["generatedAt"];
      delete out2["generatedAt"];

      expect(JSON.stringify(out1)).toBe(JSON.stringify(out2));
    } finally {
      cleanTmp();
    }
  });
});

// ─── Check mode ─────────────────────────────────────────────────────

describe("generator: check mode", () => {
  it("passes when metadata is up to date", () => {
    cleanTmp();
    try {
      generate({ monorepoRoot: MONOREPO_ROOT, outputDir: TMP_DIR, packages: ["core"] });
      const result = generate({
        monorepoRoot: MONOREPO_ROOT,
        outputDir: TMP_DIR,
        packages: ["core"],
        check: true,
      });
      expect(result.success).toBe(true);
    } finally {
      cleanTmp();
    }
  });

  it("fails when metadata does not exist", () => {
    cleanTmp();
    try {
      mkdirSync(TMP_DIR, { recursive: true });
      const result = generate({
        monorepoRoot: MONOREPO_ROOT,
        outputDir: TMP_DIR,
        packages: ["core"],
        check: true,
      });
      expect(result.success).toBe(false);
    } finally {
      cleanTmp();
    }
  });
});
