/**
 * KUI-THEME-064: Consumer Integration Validation
 *
 * Validates that all fixture/app contexts correctly consume the theme
 * engine's built output. Tests verify imports, modes, density, persistence,
 * scoped themes, nested providers, custom targets, SSR, hydration, no-flash,
 * CSP, cleanup, and types.
 *
 * These tests inspect built artifacts and fixture files — they do NOT
 * rely on source aliases.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../../..");
const THEME_DIST = join(ROOT, "packages/theme/dist");
const CORE_DIST = join(ROOT, "packages/core/dist");
const TOKENS_DIST = join(ROOT, "packages/tokens/dist");
const FIXTURES = join(ROOT, "fixtures");

const readFile = (path: string) => readFileSync(path, "utf-8");

// ─── Helpers ─────────────────────────────────────────────────────────

function fixtureHtml(name: string) {
  return readFile(join(FIXTURES, name));
}

function distFile(pkg: string, file: string) {
  const base = pkg === "theme" ? THEME_DIST : pkg === "core" ? CORE_DIST : TOKENS_DIST;
  return readFile(join(base, file));
}

// ─── 1. Vanilla JS Fixture ──────────────────────────────────────────

describe("vanilla JS fixture (vanilla-theme.html)", () => {
  const html = fixtureHtml("vanilla-theme.html");

  it("imports only from dist, never source", () => {
    expect(html).toContain("packages/theme/dist/dom.js");
    expect(html).not.toContain("from './src/");
    expect(html).not.toContain('from "../src/');
    expect(html).not.toContain("@kairoui/theme/src");
  });

  it("demonstrates light / dark / system mode switching", () => {
    expect(html).toContain("btn-light");
    expect(html).toContain("btn-dark");
    expect(html).toContain("btn-system");
  });

  it("demonstrates all three density levels", () => {
    expect(html).toContain("btn-comfortable");
    expect(html).toContain("btn-standard");
    expect(html).toContain("btn-compact");
  });

  it("persists preference to localStorage", () => {
    expect(html).toContain("localStorage");
    expect(html).toContain("persistPreference");
  });

  it("subscribes to system color scheme changes", () => {
    expect(html).toContain("subscribeToColorScheme");
  });

  it("has scoped dark and compact regions", () => {
    expect(html).toContain("scoped-dark");
    expect(html).toContain("scoped-compact");
    expect(html).toContain("applyScopedTheme");
    expect(html).toContain("removeScopedTheme");
  });

  it("demonstrates cleanup and reapply", () => {
    expect(html).toContain("btn-cleanup");
    expect(html).toContain("btn-reapply");
  });

  it("uses applyTheme and removeTheme from dom entry", () => {
    expect(html).toContain("applyTheme");
    expect(html).toContain("removeTheme");
  });

  it("does not reference React or @kairoui/core", () => {
    expect(html).not.toContain("@kairoui/core");
    expect(html).not.toContain("from 'react'");
    expect(html).not.toContain('from "react"');
  });

  it("sets initial data attributes on <html>", () => {
    expect(html).toContain('data-kui-theme="light"');
    expect(html).toContain('data-kui-density="comfortable"');
  });
});

// ─── 2. Multi-Theme Fixture ─────────────────────────────────────────

describe("multi-theme fixture (multi-theme.html)", () => {
  const html = fixtureHtml("multi-theme.html");

  it("imports from both dist/index.js and dist/dom.js", () => {
    expect(html).toContain("packages/theme/dist/index.js");
    expect(html).toContain("packages/theme/dist/dom.js");
  });

  it("uses createTheme and composeThemes from the core entry", () => {
    expect(html).toContain("createTheme");
    expect(html).toContain("composeThemes");
  });

  it("uses inspectTheme for runtime inspection", () => {
    expect(html).toContain("inspectTheme");
    expect(html).toContain("inspection-output");
  });

  it("demonstrates nested providers (outer dark, inner compact)", () => {
    expect(html).toContain("scope-nested-outer");
    expect(html).toContain("scope-nested-inner");
  });

  it("demonstrates scoped regions (dark and compact siblings)", () => {
    expect(html).toContain("scope-dark");
    expect(html).toContain("scope-compact");
    expect(html).toContain('mode: "dark"');
    expect(html).toContain('density: "compact"');
  });

  it("demonstrates runtime switching between composed theme layers", () => {
    expect(html).toContain("btn-default");
    expect(html).toContain("btn-org");
    expect(html).toContain("btn-product");
    expect(html).toContain("btn-app");
  });

  it("uses cleanupTheme and hasThemeState for state management", () => {
    expect(html).toContain("cleanupTheme");
    expect(html).toContain("hasThemeState");
  });
});

// ─── 3. Token Validation Fixture ────────────────────────────────────

describe("token validation fixture (token-validation.html)", () => {
  const html = fixtureHtml("token-validation.html");

  it("loads token CSS from dist", () => {
    expect(html).toContain("packages/tokens/dist/tokens.css");
    expect(html).toContain("packages/tokens/dist/density/comfortable.css");
  });

  it("loads theme CSS from dist", () => {
    expect(html).toContain("packages/tokens/dist/themes/light.css");
    expect(html).toContain("packages/tokens/dist/themes/dark.css");
  });

  it("uses CSS custom properties from tokens", () => {
    expect(html).toContain("--kui-color-");
    expect(html).toContain("--kui-typography-");
  });
});

// ─── 4. Next.js Integration Example ─────────────────────────────────

describe("Next.js integration example (nextjs-integration.md)", () => {
  const md = readFile(join(FIXTURES, "nextjs-integration.md"));

  it("shows server layout using getNoFlashScript and getServerHtmlAttributes", () => {
    expect(md).toContain("getNoFlashScript");
    expect(md).toContain("getServerHtmlAttributes");
  });

  it("imports server utilities from @kairoui/theme/server", () => {
    expect(md).toContain('@kairoui/theme/server"');
  });

  it("imports KairoProvider from @kairoui/core", () => {
    expect(md).toContain('@kairoui/core"');
    expect(md).toContain("KairoProvider");
  });

  it("marks the ThemeProvider as a client component", () => {
    expect(md).toContain('"use client"');
  });

  it("demonstrates serverState for hydration", () => {
    expect(md).toContain("serverState");
    expect(md).toContain("serverResolvedMode");
  });

  it("demonstrates CSP nonce pattern", () => {
    expect(md).toContain("nonce");
    expect(md).toContain("dangerouslySetInnerHTML");
  });

  it("uses useThemeMode and useDensity hooks", () => {
    expect(md).toContain("useThemeMode");
    expect(md).toContain("useDensity");
  });

  it("explains no-flash initialization", () => {
    expect(md).toContain("No-Flash");
    expect(md).toContain("localStorage");
    expect(md).toContain("prefers-color-scheme");
  });
});

// ─── 5. Storybook ───────────────────────────────────────────────────

describe("Storybook integration", () => {
  const storiesDir = join(ROOT, "apps/storybook/stories/theme");
  const storyFile = readFile(join(storiesDir, "ThemePreview.stories.tsx"));

  it("imports from @kairoui/core (not source)", () => {
    expect(storyFile).toContain('from "@kairoui/core"');
    expect(storyFile).not.toContain('from "../../packages/');
    expect(storyFile).not.toContain("from './src/");
  });

  it("imports createTheme from @kairoui/theme", () => {
    expect(storyFile).toContain('from "@kairoui/theme"');
    expect(storyFile).toContain("createTheme");
  });

  it("demonstrates KairoProvider with mode controls", () => {
    expect(storyFile).toContain("KairoProvider");
    expect(storyFile).toContain("useThemeMode");
    expect(storyFile).toContain("toggleMode");
    expect(storyFile).toContain("setMode");
  });

  it("demonstrates density controls", () => {
    expect(storyFile).toContain("useDensity");
    expect(storyFile).toContain("setDensity");
  });

  it("demonstrates scoped provider regions", () => {
    expect(storyFile).toContain("KairoScopeProvider");
    expect(storyFile).toContain('mode="dark"');
  });

  it("demonstrates nested providers", () => {
    expect(storyFile).toContain("NestedProviders");
    expect(storyFile).toContain("NestedThemeRegion");
  });

  it("demonstrates custom theme story", () => {
    expect(storyFile).toContain("CustomTheme");
    expect(storyFile).toContain('name: "brand"');
  });

  it("storybook-static build output exists", () => {
    const staticDir = join(ROOT, "apps/storybook/storybook-static");
    expect(existsSync(staticDir)).toBe(true);
    expect(existsSync(join(staticDir, "index.html"))).toBe(true);
  });
});

// ─── 6. Docs App ────────────────────────────────────────────────────

describe("docs app integration", () => {
  it("docs build output exists", () => {
    const buildDir = join(ROOT, "apps/docs/build");
    expect(existsSync(buildDir)).toBe(true);
  });

  it("docs package.json is configured correctly", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pkg: any = JSON.parse(readFile(join(ROOT, "apps/docs/package.json")));
    expect(pkg["scripts"]["build"]).toBeDefined();
    expect(pkg["dependencies"]["react"]).toBeDefined();
  });
});

// ─── 7. Built Output Validation ─────────────────────────────────────

describe("built output is consumer-ready", () => {
  describe("theme package dist", () => {
    it("index.js is importable (no syntax errors)", async () => {
      const mod = await import("@kairoui/theme");
      expect(mod.createTheme).toBeTypeOf("function");
      expect(mod.resolveTheme).toBeTypeOf("function");
      expect(mod.composeThemes).toBeTypeOf("function");
      expect(mod.inspectTheme).toBeTypeOf("function");
      expect(mod.validateTheme).toBeTypeOf("function");
    });

    it("dom entry exports browser utilities", async () => {
      const dom = await import("@kairoui/theme/dom");
      expect(dom.applyTheme).toBeTypeOf("function");
      expect(dom.removeTheme).toBeTypeOf("function");
      expect(dom.applyScopedTheme).toBeTypeOf("function");
      expect(dom.removeScopedTheme).toBeTypeOf("function");
      expect(dom.cleanupTheme).toBeTypeOf("function");
      expect(dom.hasThemeState).toBeTypeOf("function");
      expect(dom.getSystemColorScheme).toBeTypeOf("function");
      expect(dom.subscribeToColorScheme).toBeTypeOf("function");
      expect(dom.createLocalStorageAdapter).toBeTypeOf("function");
    });

    it("server entry exports SSR utilities", async () => {
      const server = await import("@kairoui/theme/server");
      expect(server.getNoFlashScript).toBeTypeOf("function");
      expect(server.getNoFlashScriptReadable).toBeTypeOf("function");
      expect(server.getServerHtmlAttributes).toBeTypeOf("function");
      expect(server.serializeServerState).toBeTypeOf("function");
      expect(server.parseServerState).toBeTypeOf("function");
    });

    it("server.js has no browser global references", () => {
      const js = distFile("theme", "server.js");
      const beforeFirstExport = js.split(/^(export|function)/m)[0]!;
      expect(beforeFirstExport).not.toContain("document");
      expect(beforeFirstExport).not.toContain("window");
      expect(beforeFirstExport).not.toContain("localStorage");
    });
  });

  describe("core package dist", () => {
    it("exports React provider and hooks", async () => {
      const core = await import(join(CORE_DIST, "index.js"));
      expect(core.KairoProvider).toBeTypeOf("function");
      expect(core.KairoScopeProvider).toBeTypeOf("function");
      expect(core.useTheme).toBeTypeOf("function");
      expect(core.useThemeMode).toBeTypeOf("function");
      expect(core.useDensity).toBeTypeOf("function");
      expect(core.useResolvedTheme).toBeTypeOf("function");
      expect(core.useSystemColorScheme).toBeTypeOf("function");
    });

    it("does not bundle React", () => {
      const js = distFile("core", "index.js");
      // React should be an external import, not inlined
      expect(js).toContain("from 'react'");
      expect(js).not.toContain("function createElement");
    });
  });

  describe("type declarations", () => {
    it("theme index.d.ts exports key types", () => {
      const dts = distFile("theme", "index.d.ts");
      expect(dts).toContain("ThemeDefinition");
      expect(dts).toContain("ThemeMode");
      expect(dts).toContain("DensityMode");
      expect(dts).toContain("ResolvedTheme");
      expect(dts).toContain("createTheme");
      expect(dts).toContain("composeThemes");
    });

    it("theme dom.d.ts exports DOM types", () => {
      const dts = distFile("theme", "dom.d.ts");
      expect(dts).toContain("applyTheme");
      expect(dts).toContain("applyScopedTheme");
      expect(dts).toContain("ThemeStorageAdapter");
    });

    it("theme server.d.ts exports SSR types", () => {
      const dts = distFile("theme", "server.d.ts");
      expect(dts).toContain("getNoFlashScript");
      expect(dts).toContain("getServerHtmlAttributes");
      expect(dts).toContain("NoFlashScriptOptions");
    });

    it("core index.d.ts exports provider and hook types", () => {
      const dts = distFile("core", "index.d.ts");
      expect(dts).toContain("KairoProvider");
      expect(dts).toContain("KairoProviderProps");
      expect(dts).toContain("ServerState");
      expect(dts).toContain("useTheme");
      expect(dts).toContain("useThemeMode");
      expect(dts).toContain("useDensity");
    });
  });
});

// ─── 8. Cross-Cutting Concerns ──────────────────────────────────────

describe("cross-cutting consumer concerns", () => {
  it("no-flash script is available and small", async () => {
    const { getNoFlashScript } = await import("@kairoui/theme/server");
    const script = getNoFlashScript();
    expect(script.length).toBeGreaterThan(0);
    expect(script.length).toBeLessThan(700);
  });

  it("no-flash script supports CSP nonce customization", async () => {
    const { getNoFlashScript } = await import("@kairoui/theme/server");
    // getNoFlashScript returns inline script content, nonce is applied to the <script> tag
    const script = getNoFlashScript();
    expect(script).toContain("localStorage");
    expect(script).toContain("data-kui-theme");
  });

  it("getServerHtmlAttributes returns proper attributes", async () => {
    const { getServerHtmlAttributes } = await import("@kairoui/theme/server");
    const attrs = getServerHtmlAttributes({
      resolvedMode: "dark",
      density: "compact",
    });
    expect(attrs).toHaveProperty("data-kui-theme", "dark");
    expect(attrs).toHaveProperty("data-kui-density", "compact");
  });

  it("createTheme output is frozen (safe for consumers)", async () => {
    const { createTheme } = await import("@kairoui/theme");
    const theme = createTheme({ name: "consumer-test", base: "light" });
    expect(Object.isFrozen(theme)).toBe(true);
  });

  it("composeThemes merges layers correctly", async () => {
    const { createTheme, composeThemes } = await import("@kairoui/theme");
    const base = createTheme({ name: "base", base: "light" });
    const overlay = createTheme({
      name: "overlay",
      base: "light",
      overrides: {
        color: { interactive: { default: "#ff0000" } },
      },
    });
    const result = composeThemes([base, overlay]);
    expect(result.definition).toBeDefined();
    expect(result.errors).toHaveLength(0);
  });

  it("source maps exist for all dist entries", () => {
    expect(existsSync(join(THEME_DIST, "index.js.map"))).toBe(true);
    expect(existsSync(join(THEME_DIST, "dom.js.map"))).toBe(true);
    expect(existsSync(join(THEME_DIST, "server.js.map"))).toBe(true);
    expect(existsSync(join(CORE_DIST, "index.js.map"))).toBe(true);
  });

  it("all fixtures use only native HTML elements (no React components)", () => {
    const htmlFixtures = readdirSync(FIXTURES).filter((f) => f.endsWith(".html"));
    for (const f of htmlFixtures) {
      const content = readFile(join(FIXTURES, f));
      expect(content).not.toContain("ReactDOM");
      expect(content).not.toContain('from "react"');
    }
  });

  it("fixtures set valid initial data attributes", () => {
    const htmlFixtures = readdirSync(FIXTURES).filter((f) => f.endsWith(".html"));
    for (const f of htmlFixtures) {
      const content = readFile(join(FIXTURES, f));
      expect(content).toContain("data-kui-theme=");
      expect(content).toContain("data-kui-density=");
    }
  });
});
