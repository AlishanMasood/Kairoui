/**
 * Consumer tree-shaking and export verification tests.
 *
 * These tests validate that:
 * - Importing a single export doesn't pull in unrelated modules
 * - Package exports resolve to correct built files
 * - sideEffects declarations are accurate
 * - No circular re-export chains in production code
 * - Cross-package imports work correctly
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PACKAGES_DIR = resolve(import.meta.dirname, "../../packages");

// ─── Package export map verification ────────────────────────────────

function readPkgJson(pkg: string) {
  return JSON.parse(readFileSync(resolve(PACKAGES_DIR, pkg, "package.json"), "utf-8")) as {
    exports?: Record<string, unknown>;
    sideEffects?: boolean | string[];
    type?: string;
    main?: string;
    module?: string;
    types?: string;
  };
}

function resolveExportPath(pkg: string, exportPath: string): string {
  return resolve(PACKAGES_DIR, pkg, exportPath);
}

describe("Package exports: file resolution", () => {
  const packages = ["utils", "tokens", "theme", "hooks", "icons", "core"];

  for (const pkg of packages) {
    it(`@kairoui/${pkg}: all export paths resolve to existing files`, () => {
      const pkgJson = readPkgJson(pkg);
      const exports = pkgJson.exports;
      expect(exports).toBeDefined();

      for (const [subpath, value] of Object.entries(exports!)) {
        if (subpath === "./package.json") continue;

        if (typeof value === "string") {
          expect(existsSync(resolveExportPath(pkg, value)), `${pkg} ${subpath} → ${value}`).toBe(
            true,
          );
        } else if (typeof value === "object" && value !== null) {
          const entry = value as Record<string, string>;
          if (entry["types"]) {
            expect(
              existsSync(resolveExportPath(pkg, entry["types"])),
              `${pkg} ${subpath} types → ${entry["types"]}`,
            ).toBe(true);
          }
          if (entry["import"]) {
            expect(
              existsSync(resolveExportPath(pkg, entry["import"])),
              `${pkg} ${subpath} import → ${entry["import"]}`,
            ).toBe(true);
          }
        }
      }
    });
  }
});

// ─── ESM format verification ────────────────────────────────────────

describe("Package exports: ESM format", () => {
  const jsPackages = ["utils", "tokens", "theme", "hooks", "core"];

  for (const pkg of jsPackages) {
    it(`@kairoui/${pkg}: main entry is ESM`, () => {
      const pkgJson = readPkgJson(pkg);
      expect(pkgJson.type).toBe("module");
    });

    it(`@kairoui/${pkg}: dist/index.js uses import/export syntax`, () => {
      const content = readFileSync(resolve(PACKAGES_DIR, pkg, "dist/index.js"), "utf-8");
      // ESM uses import/export, not require/module.exports
      expect(content).not.toContain("module.exports");
      expect(content).not.toContain("require(");
      expect(content).toMatch(/^(import |export |\/[/*]|var |const |let |function |"use)/m);
    });
  }
});

// ─── Type declaration verification ──────────────────────────────────

describe("Package exports: type declarations", () => {
  const jsPackages = ["utils", "tokens", "theme", "hooks", "core"];

  for (const pkg of jsPackages) {
    it(`@kairoui/${pkg}: has index.d.ts`, () => {
      expect(existsSync(resolve(PACKAGES_DIR, pkg, "dist/index.d.ts"))).toBe(true);
    });

    it(`@kairoui/${pkg}: types field points to existing file`, () => {
      const pkgJson = readPkgJson(pkg);
      if (pkgJson.types) {
        expect(existsSync(resolve(PACKAGES_DIR, pkg, pkgJson.types))).toBe(true);
      }
    });
  }
});

// ─── sideEffects declaration audit ──────────────────────────────────

describe("sideEffects declarations", () => {
  it("@kairoui/utils: sideEffects is false", () => {
    expect(readPkgJson("utils").sideEffects).toBe(false);
  });

  it("@kairoui/hooks: sideEffects is false", () => {
    expect(readPkgJson("hooks").sideEffects).toBe(false);
  });

  it("@kairoui/theme: sideEffects is false", () => {
    expect(readPkgJson("theme").sideEffects).toBe(false);
  });

  it("@kairoui/icons: sideEffects is false", () => {
    expect(readPkgJson("icons").sideEffects).toBe(false);
  });

  it("@kairoui/tokens: CSS files are marked as side-effectful", () => {
    const se = readPkgJson("tokens").sideEffects;
    expect(Array.isArray(se)).toBe(true);
    expect(se).toContain("**/*.css");
  });

  it("@kairoui/core: CSS files are marked as side-effectful", () => {
    const se = readPkgJson("core").sideEffects;
    expect(Array.isArray(se)).toBe(true);
    expect(se).toContain("**/*.css");
  });
});

// ─── No wildcard re-exports ─────────────────────────────────────────

describe("Barrel file quality", () => {
  const entries = [
    { pkg: "utils", file: "dist/index.js" },
    { pkg: "tokens", file: "dist/index.js" },
    { pkg: "theme", file: "dist/index.js" },
    { pkg: "hooks", file: "dist/index.js" },
    { pkg: "core", file: "dist/index.js" },
    { pkg: "core", file: "dist/composition.js" },
  ];

  for (const { pkg, file } of entries) {
    it(`@kairoui/${pkg} ${file}: no wildcard export *`, () => {
      const content = readFileSync(resolve(PACKAGES_DIR, pkg, file), "utf-8");
      // export * from "..." would defeat tree-shaking granularity
      const wildcardExports = content.match(/export \* from/g);
      expect(wildcardExports).toBeNull();
    });
  }
});

// ─── No default exports ─────────────────────────────────────────────

describe("Named exports only", () => {
  const entries = [
    { pkg: "utils", file: "dist/index.js" },
    { pkg: "tokens", file: "dist/index.js" },
    { pkg: "theme", file: "dist/index.js" },
    { pkg: "hooks", file: "dist/index.js" },
    { pkg: "core", file: "dist/index.js" },
    { pkg: "core", file: "dist/composition.js" },
  ];

  for (const { pkg, file } of entries) {
    it(`@kairoui/${pkg} ${file}: no default export`, () => {
      const content = readFileSync(resolve(PACKAGES_DIR, pkg, file), "utf-8");
      expect(content).not.toMatch(/export default /);
    });
  }
});

// ─── Entry point isolation ──────────────────────────────────────────

describe("Entry point isolation", () => {
  it("@kairoui/core: index.js does not import composition.js", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "core/dist/index.js"), "utf-8");
    expect(content).not.toContain("./composition");
    expect(content).not.toContain("composition.js");
  });

  it("@kairoui/theme: index.js does not import dom.js", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "theme/dist/index.js"), "utf-8");
    expect(content).not.toContain("./dom");
  });

  it("@kairoui/theme: index.js does not import server.js", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "theme/dist/index.js"), "utf-8");
    expect(content).not.toContain("./server");
  });

  it("@kairoui/theme: dom.js does not import server.js", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "theme/dist/dom.js"), "utf-8");
    expect(content).not.toContain("./server");
  });

  it("@kairoui/theme: server.js does not import dom.js", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "theme/dist/server.js"), "utf-8");
    expect(content).not.toContain("./dom");
  });
});

// ─── Cross-package externalization ──────────────────────────────────

describe("Cross-package externalization", () => {
  it("@kairoui/core index: externalizes @kairoui/theme", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "core/dist/index.js"), "utf-8");
    expect(content).toMatch(/from ['"]@kairoui\/theme['"]/);
  });

  it("@kairoui/core composition: does not bundle @kairoui/utils", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "core/dist/composition.js"), "utf-8");
    expect(content).toMatch(/from ['"]@kairoui\/utils['"]/);
  });

  it("@kairoui/core: does not bundle react", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "core/dist/index.js"), "utf-8");
    expect(content).toMatch(/from ['"]react['"]/);
    // Should not contain React's internal implementation
    expect(content).not.toContain("__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED");
  });

  it("@kairoui/theme: does not bundle @kairoui/tokens", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "theme/dist/index.js"), "utf-8");
    expect(content).toMatch(/from ['"]@kairoui\/tokens['"]/);
  });

  it("@kairoui/hooks: does not bundle @kairoui/utils", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "hooks/dist/index.js"), "utf-8");
    expect(content).toMatch(/from ['"]@kairoui\/utils['"]/);
  });
});

// ─── CSS export paths ───────────────────────────────────────────────

describe("CSS export paths", () => {
  it("@kairoui/core: styles.css exists at declared path", () => {
    expect(existsSync(resolve(PACKAGES_DIR, "core/dist/styles.css"))).toBe(true);
  });

  it("@kairoui/tokens: tokens.css exists", () => {
    expect(existsSync(resolve(PACKAGES_DIR, "tokens/dist/tokens.css"))).toBe(true);
  });

  it("@kairoui/tokens: theme CSS files exist", () => {
    expect(existsSync(resolve(PACKAGES_DIR, "tokens/dist/themes/light.css"))).toBe(true);
    expect(existsSync(resolve(PACKAGES_DIR, "tokens/dist/themes/dark.css"))).toBe(true);
  });

  it("@kairoui/tokens: density CSS files exist", () => {
    expect(existsSync(resolve(PACKAGES_DIR, "tokens/dist/density/comfortable.css"))).toBe(true);
    expect(existsSync(resolve(PACKAGES_DIR, "tokens/dist/density/standard.css"))).toBe(true);
    expect(existsSync(resolve(PACKAGES_DIR, "tokens/dist/density/compact.css"))).toBe(true);
  });

  it("@kairoui/core: styles.css does not contain inline JS", () => {
    const css = readFileSync(resolve(PACKAGES_DIR, "core/dist/styles.css"), "utf-8");
    expect(css).not.toContain("import ");
    expect(css).not.toContain("export ");
    expect(css).not.toContain("require(");
  });
});

// ─── Dev-only code pattern ──────────────────────────────────────────

describe("Dev-only code stripping", () => {
  it("@kairoui/utils: preserves process.env.NODE_ENV for consumer DCE", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "utils/dist/index.js"), "utf-8");
    expect(content).toContain('process.env.NODE_ENV !== "production"');
  });

  it("@kairoui/utils: DEV guard wraps warning functions", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "utils/dist/index.js"), "utf-8");
    expect(content).toContain("DEV");
    expect(content).toContain("warning");
  });
});

// ─── Bundle size sanity ─────────────────────────────────────────────

describe("Bundle size sanity", () => {
  const sizeChecks = [
    { pkg: "utils", file: "dist/index.js", maxKB: 20 },
    { pkg: "tokens", file: "dist/index.js", maxKB: 65 },
    { pkg: "theme", file: "dist/index.js", maxKB: 50 },
    { pkg: "hooks", file: "dist/index.js", maxKB: 15 },
    { pkg: "core", file: "dist/index.js", maxKB: 25 },
    { pkg: "core", file: "dist/composition.js", maxKB: 40 },
    { pkg: "core", file: "dist/styles.css", maxKB: 10 },
  ];

  for (const { pkg, file, maxKB } of sizeChecks) {
    it(`@kairoui/${pkg} ${file}: under ${String(maxKB)}KB`, () => {
      const size = readFileSync(resolve(PACKAGES_DIR, pkg, file), "utf-8").length;
      const sizeKB = size / 1024;
      expect(sizeKB).toBeLessThan(maxKB);
    });
  }
});
