/**
 * Bundle size budget enforcement.
 *
 * Budgets are based on measured baselines (KUI-HARDEN-003/009) with defined headroom:
 * - warn: current + 20% — triggers CI warning, signals growth to review
 * - fail: current + 50% — hard failure, requires explicit budget update
 *
 * To update budgets after intentional growth:
 * 1. Run `npx tsx scripts/measure-sizes.ts` to get new measurements
 * 2. Update the BUDGETS array below with new values
 * 3. Document the reason in the commit message
 */
import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const PACKAGES_DIR = resolve(import.meta.dirname, "../../packages");

interface BudgetEntry {
  pkg: string;
  file: string;
  /** Current measured baseline in bytes (raw). */
  baseline: number;
  /** Hard fail threshold in bytes (raw). Exceeding this fails CI. */
  maxRaw: number;
  /** Gzip budget in bytes. */
  maxGzip: number;
}

// Budgets: baseline measured 2026-08-12, headroom = baseline × 1.5 (50%)
const BUDGETS: BudgetEntry[] = [
  { pkg: "utils", file: "dist/index.js", baseline: 16977, maxRaw: 25500, maxGzip: 6000 },
  { pkg: "utils", file: "dist/dom.js", baseline: 10342, maxRaw: 15500, maxGzip: 4500 },
  { pkg: "utils", file: "dist/events.js", baseline: 4067, maxRaw: 6100, maxGzip: 2000 },
  { pkg: "tokens", file: "dist/index.js", baseline: 63350, maxRaw: 95000, maxGzip: 18000 },
  { pkg: "theme", file: "dist/index.js", baseline: 47169, maxRaw: 71000, maxGzip: 14000 },
  { pkg: "theme", file: "dist/dom.js", baseline: 16009, maxRaw: 24000, maxGzip: 6000 },
  { pkg: "theme", file: "dist/server.js", baseline: 5526, maxRaw: 8300, maxGzip: 3000 },
  { pkg: "hooks", file: "dist/index.js", baseline: 6572, maxRaw: 10000, maxGzip: 3000 },
  { pkg: "core", file: "dist/index.js", baseline: 14427, maxRaw: 22000, maxGzip: 5000 },
  { pkg: "core", file: "dist/composition.js", baseline: 30382, maxRaw: 46000, maxGzip: 11000 },
  { pkg: "core", file: "dist/primitives/index.js", baseline: 22676, maxRaw: 34000, maxGzip: 7000 },
  {
    pkg: "core",
    file: "dist/components/index.js",
    baseline: 202522,
    maxRaw: 305000,
    maxGzip: 50000,
  },
  { pkg: "core", file: "dist/styles.css", baseline: 4031, maxRaw: 15000, maxGzip: 3000 },
];

function measure(filePath: string) {
  const content = readFileSync(filePath);
  const raw = content.length;
  const gzip = gzipSync(content, { level: 9 }).length;
  return { raw, gzip };
}

// ─── Raw size budgets ───────────────────────────────────────────────

describe("Bundle budgets: raw size", () => {
  for (const budget of BUDGETS) {
    it(`@kairoui/${budget.pkg} ${budget.file}: under ${String(Math.round(budget.maxRaw / 1024))}KB raw`, () => {
      const filePath = resolve(PACKAGES_DIR, budget.pkg, budget.file);
      const { raw } = measure(filePath);
      if (raw > budget.maxRaw) {
        throw new Error(
          `BUDGET EXCEEDED: ${budget.pkg}/${budget.file}\n` +
            `  Baseline: ${String(budget.baseline)} bytes\n` +
            `  Current:  ${String(raw)} bytes (+${String(Math.round(((raw - budget.baseline) / budget.baseline) * 100))}%)\n` +
            `  Budget:   ${String(budget.maxRaw)} bytes\n` +
            `  Action:   Review the change causing growth. If intentional, update BUDGETS in bundle-budgets.test.ts`,
        );
      }
    });
  }
});

// ─── Gzip size budgets ──────────────────────────────────────────────

describe("Bundle budgets: gzip size", () => {
  for (const budget of BUDGETS) {
    it(`@kairoui/${budget.pkg} ${budget.file}: under ${String(Math.round(budget.maxGzip / 1024))}KB gzip`, () => {
      const filePath = resolve(PACKAGES_DIR, budget.pkg, budget.file);
      const { gzip } = measure(filePath);
      if (gzip > budget.maxGzip) {
        throw new Error(
          `GZIP BUDGET EXCEEDED: ${budget.pkg}/${budget.file}\n` +
            `  Current gzip: ${String(gzip)} bytes\n` +
            `  Budget:       ${String(budget.maxGzip)} bytes\n` +
            `  Action:       Review the change causing growth. If intentional, update BUDGETS.`,
        );
      }
    });
  }
});

// ─── Growth warnings (soft threshold) ───────────────────────────────

describe("Bundle budgets: growth warnings", () => {
  const WARNING_THRESHOLD = 1.2; // 20% above baseline

  for (const budget of BUDGETS) {
    it(`@kairoui/${budget.pkg} ${budget.file}: within 20% of baseline`, () => {
      const filePath = resolve(PACKAGES_DIR, budget.pkg, budget.file);
      const { raw } = measure(filePath);
      const warnAt = Math.round(budget.baseline * WARNING_THRESHOLD);
      if (raw > warnAt) {
        console.warn(
          `⚠️  SIZE WARNING: ${budget.pkg}/${budget.file} grew to ${String(raw)} bytes ` +
            `(+${String(Math.round(((raw - budget.baseline) / budget.baseline) * 100))}% from baseline ${String(budget.baseline)})`,
        );
      }
      // This section always passes — warnings are informational
      expect(raw).toBeGreaterThan(0);
    });
  }
});

// ─── CSS-specific budgets ───────────────────────────────────────────

describe("Bundle budgets: CSS output", () => {
  const cssFiles = [
    { pkg: "core", file: "dist/styles.css", maxRaw: 15000 },
    { pkg: "tokens", file: "dist/tokens.css", maxRaw: 50000 },
    { pkg: "tokens", file: "dist/themes/light.css", maxRaw: 25000 },
    { pkg: "tokens", file: "dist/themes/dark.css", maxRaw: 25000 },
    { pkg: "tokens", file: "dist/density/comfortable.css", maxRaw: 3000 },
    { pkg: "tokens", file: "dist/density/standard.css", maxRaw: 3000 },
    { pkg: "tokens", file: "dist/density/compact.css", maxRaw: 3000 },
  ];

  for (const { pkg, file, maxRaw } of cssFiles) {
    it(`@kairoui/${pkg} ${file}: under ${String(Math.round(maxRaw / 1024))}KB`, () => {
      const filePath = resolve(PACKAGES_DIR, pkg, file);
      const size = statSync(filePath).size;
      expect(size).toBeLessThan(maxRaw);
    });
  }
});

// ─── Total framework size budget ────────────────────────────────────

describe("Bundle budgets: total framework", () => {
  it("total JS runtime under 500KB raw", () => {
    const jsFiles = BUDGETS.filter((b) => b.file.endsWith(".js"));
    let total = 0;
    for (const budget of jsFiles) {
      const filePath = resolve(PACKAGES_DIR, budget.pkg, budget.file);
      total += statSync(filePath).size;
    }
    expect(total).toBeLessThan(500 * 1024);
  });

  it("total JS runtime under 110KB gzip", () => {
    const jsFiles = BUDGETS.filter((b) => b.file.endsWith(".js"));
    let total = 0;
    for (const budget of jsFiles) {
      const filePath = resolve(PACKAGES_DIR, budget.pkg, budget.file);
      const content = readFileSync(filePath);
      total += gzipSync(content, { level: 9 }).length;
    }
    expect(total).toBeLessThan(110 * 1024);
  });
});

// ─── Tree-shaking isolation ─────────────────────────────────────────

describe("Bundle budgets: tree-shaking isolation", () => {
  it("components/index.js does not import from primitives/index.js", () => {
    const content = readFileSync(
      resolve(PACKAGES_DIR, "core", "dist", "components", "index.js"),
      "utf-8",
    );
    // Should not contain references to primitive components (Box, Flex, Stack, etc.)
    expect(content).not.toContain("createPolymorphicComponent");
    expect(content).not.toContain('"Box"');
    expect(content).not.toContain('"Flex"');
    expect(content).not.toContain('"Stack"');
  });

  it("primitives/index.js does not import from components/index.js", () => {
    const content = readFileSync(
      resolve(PACKAGES_DIR, "core", "dist", "primitives", "index.js"),
      "utf-8",
    );
    // Should not contain interactive component code
    expect(content).not.toContain("useControllableState");
    expect(content).not.toContain("FieldContext");
    expect(content).not.toContain('"Checkbox"');
    expect(content).not.toContain('"Switch"');
  });

  it("index.js does not bundle composition or primitives inline", () => {
    const content = readFileSync(resolve(PACKAGES_DIR, "core", "dist", "index.js"), "utf-8");
    // Root index is providers/hooks only — should be small
    expect(content.length).toBeLessThan(25000);
  });

  it("sideEffects is configured correctly in package.json", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(PACKAGES_DIR, "core", "package.json"), "utf-8"),
    ) as { sideEffects: string[] };
    expect(pkg.sideEffects).toEqual(["**/*.css"]);
  });
});
