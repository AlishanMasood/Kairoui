/**
 * @vitest-environment happy-dom
 *
 * Theme engine performance benchmarks.
 *
 * Environment: Vitest + happy-dom. Timings are indicative, not production-equivalent.
 * These benchmarks establish baselines and detect regressions, not absolute production perf.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createTheme, validateTheme, composeThemes, inspectTheme } from "./index";
import { resolveTheme } from "./resolve-theme";
import { generateCssVariables } from "./css-variables";
import { serializeTheme } from "./serialize";
import { getNoFlashScript } from "./no-flash-script";
import { applyTheme } from "./apply-theme";
import { applyScopedTheme } from "./scoped-theme";

function createElement(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function timeOp(fn: () => void, iterations: number): { totalMs: number; avgMs: number } {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const totalMs = performance.now() - start;
  return { totalMs, avgMs: totalMs / iterations };
}

async function timeOpAsync(
  fn: () => Promise<void>,
  iterations: number,
): Promise<{ totalMs: number; avgMs: number }> {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const totalMs = performance.now() - start;
  return { totalMs, avgMs: totalMs / iterations };
}

const ITERATIONS = 100;

const sampleInput = {
  name: "bench-theme",
  base: "light" as const,
  description: "Benchmark theme",
  metadata: { version: "1.0.0" },
  overrides: {
    color: {
      interactive: { default: "#7c3aed", hover: "#6d28d9", active: "#5b21b6" },
      focus: { ring: "#7c3aed" },
      background: { surface: "#fafbfc" },
      text: { primary: "#111827" },
      border: { default: "#d1d5db" },
    },
  },
};

describe("theme engine benchmarks", () => {
  // ─── Theme Creation ────────────────────────────────────────────

  describe("theme creation", () => {
    it("createTheme completes in < 1ms average", () => {
      const { avgMs } = timeOp(() => {
        createTheme(sampleInput);
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(1);
    });
  });

  // ─── Theme Validation ──────────────────────────────────────────

  describe("theme validation", () => {
    it("validateTheme completes in < 1ms average", () => {
      const { avgMs } = timeOp(() => {
        validateTheme(sampleInput);
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(1);
    });

    it("validation result is correct", () => {
      const result = validateTheme(sampleInput);
      expect(result.valid).toBe(true);
    });
  });

  // ─── Theme Resolution ─────────────────────────────────────────

  describe("theme resolution", () => {
    it("resolveTheme completes in < 10ms average", async () => {
      const theme = createTheme(sampleInput);
      const { avgMs } = await timeOpAsync(async () => {
        await resolveTheme({ definition: theme });
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(10);
    });
  });

  // ─── Theme Composition ────────────────────────────────────────

  describe("theme composition", () => {
    it("composeThemes with 3 layers completes in < 1ms average", () => {
      const orgTheme = createTheme({
        name: "org",
        base: "light",
        overrides: { color: { interactive: { default: "#e63946" } } },
      });
      const { avgMs } = timeOp(() => {
        composeThemes([
          orgTheme,
          { name: "product", overrides: { color: { background: { surface: "#fafbfc" } } } },
          { name: "app", overrides: { color: { border: { default: "#dee2e6" } } } },
        ]);
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(1);
    });

    it("composeThemes with 5 layers completes in < 2ms average", () => {
      const base = createTheme({ name: "base", base: "light" });
      const { avgMs } = timeOp(() => {
        composeThemes([
          base,
          { name: "l2", overrides: { color: { interactive: { default: "#111" } } } },
          { name: "l3", overrides: { color: { background: { surface: "#222" } } } },
          { name: "l4", overrides: { color: { text: { primary: "#333" } } } },
          { name: "l5", overrides: { color: { border: { default: "#444" } } } },
        ]);
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(2);
    });
  });

  // ─── CSS Variable Generation ──────────────────────────────────

  describe("CSS variable generation", () => {
    it("generateCssVariables completes in < 10ms average", async () => {
      const theme = createTheme(sampleInput);
      const resolved = await resolveTheme({ definition: theme });
      const { avgMs } = timeOp(() => {
        generateCssVariables(resolved);
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(10);
    });
  });

  // ─── DOM Application ──────────────────────────────────────────

  describe("initial DOM application", () => {
    it("applyTheme initial call completes in < 1ms average", () => {
      const { avgMs } = timeOp(() => {
        const el = createElement();
        applyTheme(el, { mode: "light", density: "comfortable" });
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(1);
    });
  });

  describe("reapplication of unchanged theme", () => {
    it("reapply with same values completes in < 0.5ms average", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });

      const { avgMs } = timeOp(() => {
        applyTheme(el, { mode: "light", density: "comfortable" });
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(0.5);
    });
  });

  describe("light-to-dark switch", () => {
    it("mode switch completes in < 1ms average", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });

      const { avgMs } = timeOp(() => {
        applyTheme(el, { mode: "dark", density: "comfortable" });
        applyTheme(el, { mode: "light", density: "comfortable" });
      }, ITERATIONS / 2);

      expect(avgMs).toBeLessThan(1);
    });
  });

  describe("density switch", () => {
    it("density switch completes in < 1ms average", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });

      const { avgMs } = timeOp(() => {
        applyTheme(el, { mode: "light", density: "compact" });
        applyTheme(el, { mode: "light", density: "comfortable" });
      }, ITERATIONS / 2);

      expect(avgMs).toBeLessThan(1);
    });
  });

  // ─── Scoped Theme Application ─────────────────────────────────

  describe("scoped theme application", () => {
    it("applyScopedTheme completes in < 1ms average", () => {
      const { avgMs } = timeOp(() => {
        const el = createElement();
        applyScopedTheme(el, { mode: "dark", density: "compact" });
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(1);
    });
  });

  describe("nested scope updates", () => {
    it("updating 3 nested scopes completes in < 2ms average", () => {
      const outer = createElement();
      const middle = createElement();
      const inner = createElement();
      outer.appendChild(middle);
      middle.appendChild(inner);

      applyScopedTheme(outer, { mode: "dark" });
      applyScopedTheme(middle, { density: "standard" });
      applyScopedTheme(inner, { density: "compact" });

      const { avgMs } = timeOp(() => {
        applyScopedTheme(outer, { mode: "light" });
        applyScopedTheme(middle, { density: "comfortable" });
        applyScopedTheme(inner, { density: "standard" });
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(2);
    });
  });

  // ─── Serialization ────────────────────────────────────────────

  describe("serialization", () => {
    it("serializeTheme completes in < 5ms average", async () => {
      const theme = createTheme(sampleInput);
      const resolved = await resolveTheme({ definition: theme });
      const { avgMs } = timeOp(() => {
        serializeTheme(resolved);
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(5);
    });
  });

  // ─── No-Flash Script Size ─────────────────────────────────────

  describe("no-flash script size", () => {
    it("minified script is under 700 bytes", () => {
      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      expect(script.length).toBeLessThan(700);
    });

    it("script with custom options is under 700 bytes", () => {
      const script = getNoFlashScript({
        storageKey: "my-custom-app-theme-preference",
        defaultMode: "dark",
        defaultDensity: "compact",
        themeAttribute: "data-my-theme",
        densityAttribute: "data-my-density",
      });
      expect(script.length).toBeLessThan(700);
    });
  });

  // ─── Bundle Size ──────────────────────────────────────────────

  describe("theme package bundle size", () => {
    const distDir = join(import.meta.dirname, "../dist");

    it("index.js (core) is under 60 KB", () => {
      const size = readFileSync(join(distDir, "index.js")).length;
      expect(size).toBeLessThan(60_000);
    });

    it("dom.js is under 20 KB", () => {
      const size = readFileSync(join(distDir, "dom.js")).length;
      expect(size).toBeLessThan(20_000);
    });

    it("server.js is under 10 KB", () => {
      const size = readFileSync(join(distDir, "server.js")).length;
      expect(size).toBeLessThan(10_000);
    });

    it("total JS bundle is under 80 KB", () => {
      const index = readFileSync(join(distDir, "index.js")).length;
      const dom = readFileSync(join(distDir, "dom.js")).length;
      const server = readFileSync(join(distDir, "server.js")).length;
      const total = index + dom + server;
      expect(total).toBeLessThan(80_000);
    });
  });

  // ─── Inspection ───────────────────────────────────────────────

  describe("theme inspection", () => {
    it("inspectTheme completes in < 1ms average", () => {
      const theme = createTheme(sampleInput);
      const { avgMs } = timeOp(() => {
        inspectTheme(theme);
      }, ITERATIONS);

      expect(avgMs).toBeLessThan(1);
    });
  });
});
