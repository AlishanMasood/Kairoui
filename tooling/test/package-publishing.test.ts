/**
 * Package publishing output verification.
 *
 * Validates that built packages contain only intended files and that
 * all required artifacts are present for npm publication.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const PACKAGES_DIR = resolve(import.meta.dirname, "../../packages");
const ROOT = resolve(import.meta.dirname, "../..");

function readPkgJson(pkg: string) {
  return JSON.parse(readFileSync(resolve(PACKAGES_DIR, pkg, "package.json"), "utf-8")) as Record<
    string,
    unknown
  >;
}

function getDistFiles(pkg: string): string[] {
  const distDir = resolve(PACKAGES_DIR, pkg, "dist");
  if (!existsSync(distDir)) return [];
  const files: string[] = [];
  function walk(dir: string, prefix: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(full).isDirectory()) {
        walk(full, rel);
      } else {
        files.push(rel);
      }
    }
  }
  walk(distDir, "");
  return files;
}

const PACKAGES = ["utils", "tokens", "theme", "hooks", "icons", "core"];

// ─── Required package metadata ──────────────────────────────────────

describe("Publishing: required metadata", () => {
  for (const pkg of PACKAGES) {
    it(`@kairoui/${pkg}: has name`, () => {
      expect(readPkgJson(pkg)["name"]).toBe(`@kairoui/${pkg}`);
    });

    it(`@kairoui/${pkg}: has version`, () => {
      expect(readPkgJson(pkg)["version"]).toBeDefined();
    });

    it(`@kairoui/${pkg}: has description`, () => {
      expect(typeof readPkgJson(pkg)["description"]).toBe("string");
      expect((readPkgJson(pkg)["description"] as string).length).toBeGreaterThan(10);
    });

    it(`@kairoui/${pkg}: has license field`, () => {
      expect(readPkgJson(pkg)["license"]).toBeDefined();
    });

    it(`@kairoui/${pkg}: has files field`, () => {
      const files = readPkgJson(pkg)["files"] as string[];
      expect(Array.isArray(files)).toBe(true);
      expect(files).toContain("dist");
    });

    it(`@kairoui/${pkg}: has type=module`, () => {
      expect(readPkgJson(pkg)["type"]).toBe("module");
    });

    it(`@kairoui/${pkg}: has README.md`, () => {
      expect(existsSync(resolve(PACKAGES_DIR, pkg, "README.md"))).toBe(true);
    });
  }
});

// ─── Dist contents verification ─────────────────────────────────────

describe("Publishing: dist contents", () => {
  for (const pkg of PACKAGES) {
    it(`@kairoui/${pkg}: dist exists`, () => {
      expect(existsSync(resolve(PACKAGES_DIR, pkg, "dist"))).toBe(true);
    });

    it(`@kairoui/${pkg}: no test files in dist`, () => {
      const files = getDistFiles(pkg);
      const testFiles = files.filter((f) => f.includes(".test.") || f.includes(".spec."));
      expect(testFiles).toHaveLength(0);
    });

    it(`@kairoui/${pkg}: no source .ts/.tsx in dist`, () => {
      const files = getDistFiles(pkg);
      const sourceFiles = files.filter(
        (f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && !f.endsWith(".d.ts"),
      );
      expect(sourceFiles).toHaveLength(0);
    });

    it(`@kairoui/${pkg}: no coverage in dist`, () => {
      const files = getDistFiles(pkg);
      expect(files.filter((f) => f.includes("coverage"))).toHaveLength(0);
    });

    it(`@kairoui/${pkg}: no node_modules in dist`, () => {
      const files = getDistFiles(pkg);
      expect(files.filter((f) => f.includes("node_modules"))).toHaveLength(0);
    });
  }
});

// ─── Export map verification ────────────────────────────────────────

describe("Publishing: export map integrity", () => {
  for (const pkg of PACKAGES) {
    it(`@kairoui/${pkg}: all export paths resolve to existing files`, () => {
      const pkgJson = readPkgJson(pkg);
      const exports = pkgJson["exports"] as Record<string, unknown>;
      expect(exports).toBeDefined();

      for (const [subpath, value] of Object.entries(exports)) {
        if (subpath === "./package.json") continue;

        if (typeof value === "string") {
          expect(
            existsSync(resolve(PACKAGES_DIR, pkg, value)),
            `${pkg} ${subpath} → ${value}`,
          ).toBe(true);
        } else if (typeof value === "object" && value !== null) {
          const entry = value as Record<string, string>;
          if (entry["types"]) {
            expect(
              existsSync(resolve(PACKAGES_DIR, pkg, entry["types"])),
              `${pkg} ${subpath} types`,
            ).toBe(true);
          }
          if (entry["import"]) {
            expect(
              existsSync(resolve(PACKAGES_DIR, pkg, entry["import"])),
              `${pkg} ${subpath} import`,
            ).toBe(true);
          }
        }
      }
    });
  }
});

// ─── No private source exposure ─────────────────────────────────────

describe("Publishing: no private source exposure", () => {
  it("@kairoui/core: dist does not contain proof components", () => {
    const files = getDistFiles("core");
    const proofFiles = files.filter((f) => f.includes("proof") || f.includes("button.styles"));
    expect(proofFiles).toHaveLength(0);
  });

  it("@kairoui/core: dist does not contain test utilities", () => {
    const files = getDistFiles("core");
    const testUtils = files.filter((f) => f.includes("fixture") || f.includes("mock"));
    expect(testUtils).toHaveLength(0);
  });

  it("no package dist contains tsconfig files", () => {
    for (const pkg of PACKAGES) {
      const files = getDistFiles(pkg);
      expect(files.filter((f) => f.includes("tsconfig"))).toHaveLength(0);
    }
  });

  it("no package dist contains .env files", () => {
    for (const pkg of PACKAGES) {
      const files = getDistFiles(pkg);
      expect(files.filter((f) => f.includes(".env"))).toHaveLength(0);
    }
  });
});

// ─── Pack size budgets ──────────────────────────────────────────────

describe("Publishing: pack size sanity", () => {
  const budgets: Record<string, number> = {
    utils: 200,
    tokens: 600,
    theme: 350,
    hooks: 50,
    icons: 5,
    core: 1200,
  };

  for (const pkg of PACKAGES) {
    it(`@kairoui/${pkg}: unpacked under ${String(budgets[pkg])}KB`, () => {
      const files = getDistFiles(pkg);
      let totalSize = 0;
      for (const file of files) {
        totalSize += statSync(resolve(PACKAGES_DIR, pkg, "dist", file)).size;
      }
      // Add package.json and README
      totalSize += statSync(resolve(PACKAGES_DIR, pkg, "package.json")).size;
      totalSize += statSync(resolve(PACKAGES_DIR, pkg, "README.md")).size;
      const sizeKB = totalSize / 1024;
      expect(sizeKB).toBeLessThan(budgets[pkg]!);
    });
  }
});

// ─── Root LICENSE exists ────────────────────────────────────────────

describe("Publishing: LICENSE", () => {
  it("root LICENSE file exists", () => {
    expect(existsSync(resolve(ROOT, "LICENSE"))).toBe(true);
  });

  it("LICENSE file has content", () => {
    const content = readFileSync(resolve(ROOT, "LICENSE"), "utf-8");
    expect(content.length).toBeGreaterThan(100);
  });
});
