import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const THEME_ROOT = join(import.meta.dirname, "..");
const THEME_DIST = join(THEME_ROOT, "dist");
const THEME_PKG = JSON.parse(readFileSync(join(THEME_ROOT, "package.json"), "utf-8"));
const CORE_ROOT = join(import.meta.dirname, "../../core");
const CORE_DIST = join(CORE_ROOT, "dist");
const CORE_PKG = JSON.parse(readFileSync(join(CORE_ROOT, "package.json"), "utf-8"));
const FIXTURES_DIR = join(import.meta.dirname, "../../../fixtures");

describe("package output and dependency audit", () => {
  // ─── Approved Dependencies ─────────────────────────────────────

  describe("@kairoui/theme depends only on approved packages", () => {
    it("has only @kairoui/tokens as runtime dependency", () => {
      const deps = Object.keys(THEME_PKG.dependencies ?? {});
      expect(deps).toEqual(["@kairoui/tokens"]);
    });

    it("has no peerDependencies", () => {
      expect(THEME_PKG.peerDependencies).toBeUndefined();
    });

    it("has no react in any dependency field", () => {
      const all = JSON.stringify(THEME_PKG);
      expect(all).not.toContain('"react"');
    });
  });

  // ─── Framework Independence ────────────────────────────────────

  describe("framework-independent exports do not import React", () => {
    it("dist/index.js has no React imports", () => {
      const js = readFileSync(join(THEME_DIST, "index.js"), "utf-8");
      expect(js).not.toContain("'react'");
      expect(js).not.toContain('"react"');
    });

    it("dist/dom.js has no React imports", () => {
      const js = readFileSync(join(THEME_DIST, "dom.js"), "utf-8");
      expect(js).not.toContain("'react'");
      expect(js).not.toContain('"react"');
    });

    it("dist/server.js has no React imports", () => {
      const js = readFileSync(join(THEME_DIST, "server.js"), "utf-8");
      expect(js).not.toContain("'react'");
      expect(js).not.toContain('"react"');
    });
  });

  // ─── React Peer Dependency ─────────────────────────────────────

  describe("React is a peer dependency of @kairoui/core", () => {
    it("react is in peerDependencies", () => {
      expect(CORE_PKG.peerDependencies.react).toBeDefined();
    });

    it("react is not in dependencies", () => {
      const deps = CORE_PKG.dependencies ?? {};
      expect(deps.react).toBeUndefined();
      expect(deps["react-dom"]).toBeUndefined();
    });

    it("supports React 18 and 19", () => {
      expect(CORE_PKG.peerDependencies.react).toMatch(/\^18.*\|\|.*\^19/);
    });
  });

  // ─── React Not Bundled ─────────────────────────────────────────

  describe("React is not bundled in core output", () => {
    it("core dist imports react externally", () => {
      const js = readFileSync(join(CORE_DIST, "index.js"), "utf-8");
      expect(js).toContain("from 'react'");
      // Should not contain React internals
      expect(js).not.toContain("__SECRET_INTERNALS");
      expect(js).not.toContain("ReactCurrentDispatcher");
    });
  });

  // ─── DOM Code Isolation ────────────────────────────────────────

  describe("DOM code is isolated in dom.js", () => {
    it("dom.js has no external imports", () => {
      const js = readFileSync(join(THEME_DIST, "dom.js"), "utf-8");
      expect(js).not.toMatch(/^import\s/m);
    });

    it("index.js does not contain DOM manipulation code", () => {
      const js = readFileSync(join(THEME_DIST, "index.js"), "utf-8");
      expect(js).not.toContain("document.documentElement");
      expect(js).not.toContain("setAttribute(");
      expect(js).not.toContain("matchMedia");
    });
  });

  // ─── Server Module SSR Safety ──────────────────────────────────

  describe("server module does not access browser globals at module level", () => {
    it("server.js only references browser globals inside function bodies", () => {
      const js = readFileSync(join(THEME_DIST, "server.js"), "utf-8");
      // Module-level is everything before the first function definition
      const firstFn = js.indexOf("function ");
      const moduleLevel = js.slice(0, firstFn);
      expect(moduleLevel).not.toContain("window");
      expect(moduleLevel).not.toContain("document");
      expect(moduleLevel).not.toContain("localStorage");
    });
  });

  // ─── Type Declarations ─────────────────────────────────────────

  describe("type declarations resolve", () => {
    it("index.d.ts exists and exports types", () => {
      const dts = readFileSync(join(THEME_DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("ThemeDefinition");
      expect(dts).toContain("createTheme");
    });

    it("dom.d.ts exists and exports types", () => {
      const dts = readFileSync(join(THEME_DIST, "dom.d.ts"), "utf-8");
      expect(dts).toContain("applyTheme");
    });

    it("server.d.ts exists and exports types", () => {
      const dts = readFileSync(join(THEME_DIST, "server.d.ts"), "utf-8");
      expect(dts).toContain("getNoFlashScript");
    });

    it("shared type chunks exist", () => {
      const files = readdirSync(THEME_DIST);
      const dtsChunks = files.filter(
        (f) => f.endsWith(".d.ts") && f !== "index.d.ts" && f !== "dom.d.ts" && f !== "server.d.ts",
      );
      expect(dtsChunks.length).toBeGreaterThan(0);
    });
  });

  // ─── Tree Shaking ─────────────────────────────────────────────

  describe("tree shaking works", () => {
    it("sideEffects is false", () => {
      expect(THEME_PKG.sideEffects).toBe(false);
    });

    it("all exports are ESM (import/export)", () => {
      const js = readFileSync(join(THEME_DIST, "index.js"), "utf-8");
      expect(js).toContain("export {");
      expect(js).not.toContain("module.exports");
      expect(js).not.toContain("exports.");
    });

    it("dom.js uses ESM exports", () => {
      const js = readFileSync(join(THEME_DIST, "dom.js"), "utf-8");
      expect(js).toContain("export {");
    });
  });

  // ─── Package Exports ──────────────────────────────────────────

  describe("package exports are correct", () => {
    it("exports root entry point", () => {
      expect(THEME_PKG.exports["."]).toBeDefined();
      expect(THEME_PKG.exports["."].import).toBe("./dist/index.js");
      expect(THEME_PKG.exports["."].types).toBe("./dist/index.d.ts");
    });

    it("exports dom entry point", () => {
      expect(THEME_PKG.exports["./dom"]).toBeDefined();
      expect(THEME_PKG.exports["./dom"].import).toBe("./dist/dom.js");
    });

    it("exports server entry point", () => {
      expect(THEME_PKG.exports["./server"]).toBeDefined();
      expect(THEME_PKG.exports["./server"].import).toBe("./dist/server.js");
    });

    it("exports package.json", () => {
      expect(THEME_PKG.exports["./package.json"]).toBe("./package.json");
    });

    it("does not export internal paths", () => {
      const keys = Object.keys(THEME_PKG.exports);
      expect(keys).not.toContain("./src");
      expect(keys).not.toContain("./internal");
      expect(keys).not.toContain("./dist");
    });
  });

  // ─── Private Files Excluded ────────────────────────────────────

  describe("private files are excluded from package", () => {
    it("files field only includes dist", () => {
      expect(THEME_PKG.files).toEqual(["dist"]);
    });

    it("no test files in dist", () => {
      const files = readdirSync(THEME_DIST);
      const testFiles = files.filter((f) => f.includes(".test.") || f.includes(".spec."));
      expect(testFiles).toEqual([]);
    });

    it("no src directory in dist", () => {
      expect(existsSync(join(THEME_DIST, "src"))).toBe(false);
    });

    it("no tsconfig in dist", () => {
      const files = readdirSync(THEME_DIST);
      expect(files.filter((f) => f.startsWith("tsconfig"))).toEqual([]);
    });
  });

  // ─── Source Maps ──────────────────────────────────────────────

  describe("source maps contain no machine-specific paths", () => {
    it("index.js.map uses relative paths", () => {
      const map = JSON.parse(readFileSync(join(THEME_DIST, "index.js.map"), "utf-8"));
      for (const source of map.sources) {
        expect(source).not.toMatch(/^[A-Z]:\\/);
        expect(source).not.toMatch(/^\/Users\//);
        expect(source).not.toMatch(/^\/home\//);
        expect(source).toMatch(/^\.\.\//);
      }
    });

    it("dom.js.map uses relative paths", () => {
      const map = JSON.parse(readFileSync(join(THEME_DIST, "dom.js.map"), "utf-8"));
      for (const source of map.sources) {
        expect(source).toMatch(/^\.\.\//);
      }
    });
  });

  // ─── Side Effects Declaration ──────────────────────────────────

  describe("side effects are declared correctly", () => {
    it("theme package declares no side effects", () => {
      expect(THEME_PKG.sideEffects).toBe(false);
    });

    it("core package declares CSS side effects only", () => {
      expect(CORE_PKG.sideEffects).toContain("**/*.css");
    });
  });

  // ─── Package Size ─────────────────────────────────────────────

  describe("package size is reasonable", () => {
    it("theme index.js < 50 KB", () => {
      const size = readFileSync(join(THEME_DIST, "index.js")).length;
      expect(size).toBeLessThan(50_000);
    });

    it("theme dom.js < 20 KB", () => {
      const size = readFileSync(join(THEME_DIST, "dom.js")).length;
      expect(size).toBeLessThan(20_000);
    });

    it("theme server.js < 10 KB", () => {
      const size = readFileSync(join(THEME_DIST, "server.js")).length;
      expect(size).toBeLessThan(10_000);
    });

    it("core index.js < 20 KB", () => {
      const size = readFileSync(join(CORE_DIST, "index.js")).length;
      expect(size).toBeLessThan(20_000);
    });

    it("total theme JS < 80 KB", () => {
      const total =
        readFileSync(join(THEME_DIST, "index.js")).length +
        readFileSync(join(THEME_DIST, "dom.js")).length +
        readFileSync(join(THEME_DIST, "server.js")).length;
      expect(total).toBeLessThan(80_000);
    });
  });

  // ─── Consumer Fixtures ─────────────────────────────────────────

  describe("consumer fixtures use only built output", () => {
    it("vanilla fixture imports from dist/, not src/", () => {
      const html = readFileSync(join(FIXTURES_DIR, "vanilla-theme.html"), "utf-8");
      expect(html).toContain("/dist/");
      expect(html).not.toContain("/src/");
    });

    it("multi-theme fixture imports from dist/, not src/", () => {
      const html = readFileSync(join(FIXTURES_DIR, "multi-theme.html"), "utf-8");
      expect(html).toContain("/dist/");
      expect(html).not.toContain("/src/");
    });
  });

  // ─── No Undeclared Dependencies ────────────────────────────────

  describe("no undeclared dependency exists", () => {
    it("theme index.js only imports from @kairoui/tokens", () => {
      const js = readFileSync(join(THEME_DIST, "index.js"), "utf-8");
      const imports = js.match(/from ['"]([^'"./][^'"]*)['"]/g) ?? [];
      for (const imp of imports) {
        const pkg = imp.match(/from ['"]([^'"]+)['"]/)?.[1] ?? "";
        expect(pkg).toMatch(/^@kairoui\/tokens/);
      }
    });

    it("theme dom.js has no external imports", () => {
      const js = readFileSync(join(THEME_DIST, "dom.js"), "utf-8");
      const imports = js.match(/from ['"]([^'"./][^'"]*)['"]/g) ?? [];
      expect(imports).toEqual([]);
    });

    it("theme server.js has no external imports", () => {
      const js = readFileSync(join(THEME_DIST, "server.js"), "utf-8");
      const imports = js.match(/from ['"]([^'"./][^'"]*)['"]/g) ?? [];
      expect(imports).toEqual([]);
    });

    it("core index.js only imports from react and @kairoui/theme", () => {
      const js = readFileSync(join(CORE_DIST, "index.js"), "utf-8");
      const imports = js.match(/from ['"]([^'"./][^'"]*)['"]/g) ?? [];
      for (const imp of imports) {
        const pkg = imp.match(/from ['"]([^'"]+)['"]/)?.[1] ?? "";
        expect(pkg).toMatch(/^(react|react\/jsx-runtime|@kairoui\/theme)/);
      }
    });
  });

  // ─── No Duplicate React ────────────────────────────────────────

  describe("no duplicate React copy through package configuration", () => {
    it("react is peer dependency, not dependency, preventing duplication", () => {
      expect(CORE_PKG.peerDependencies.react).toBeDefined();
      expect((CORE_PKG.dependencies ?? {}).react).toBeUndefined();
    });

    it("theme package has no react reference at all", () => {
      expect((THEME_PKG.dependencies ?? {}).react).toBeUndefined();
      expect((THEME_PKG.peerDependencies ?? {}).react).toBeUndefined();
    });
  });
});
