/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * Bundle size measurement script for KairoUI.
 * Measures raw, minified, and gzip sizes for all package outputs
 * and representative consumer bundles.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { gzipSync } from "node:zlib";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const MEASURE_DIR = resolve(ROOT, ".size-baseline");

interface SizeEntry {
  file: string;
  raw: number;
  minified: number;
  gzip: number;
}

function measure(filePath: string): SizeEntry {
  const content = readFileSync(filePath, "utf-8");
  const raw = Buffer.byteLength(content, "utf-8");

  const ext = filePath.endsWith(".css") ? "css" : "js";
  let minified = raw;
  let minContent = content;

  try {
    const tmpIn = resolve(MEASURE_DIR, `_min_input.${ext}`);
    const tmpOut = resolve(MEASURE_DIR, `_min_output.${ext}`);
    writeFileSync(tmpIn, content, "utf-8");
    execSync(`npx esbuild "${tmpIn}" --minify --outfile="${tmpOut}" --allow-overwrite`, {
      encoding: "utf-8",
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    minContent = readFileSync(tmpOut, "utf-8");
    minified = Buffer.byteLength(minContent, "utf-8");
  } catch {
    // If minification fails, use raw size
  }

  const gzip = gzipSync(minContent, { level: 9 }).length;

  return { file: basename(filePath), raw, minified, gzip };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function printTable(title: string, entries: SizeEntry[]): string {
  const lines: string[] = [];
  lines.push(`### ${title}\n`);
  lines.push("| File | Raw | Minified | Gzip |");
  lines.push("|------|-----|----------|------|");
  for (const e of entries) {
    lines.push(
      `| ${e.file} | ${formatBytes(e.raw)} | ${formatBytes(e.minified)} | ${formatBytes(e.gzip)} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

// ─── Measure all package dist files ─────────────────────────────────

const packages: { name: string; dir: string; files: string[] }[] = [
  {
    name: "@kairoui/utils",
    dir: "packages/utils/dist",
    files: ["index.js", "dom.js", "events.js"],
  },
  {
    name: "@kairoui/tokens",
    dir: "packages/tokens/dist",
    files: [
      "index.js",
      "tokens.css",
      "themes/light.css",
      "themes/dark.css",
      "density/comfortable.css",
      "density/standard.css",
      "density/compact.css",
    ],
  },
  {
    name: "@kairoui/theme",
    dir: "packages/theme/dist",
    files: ["index.js", "dom.js", "server.js"],
  },
  {
    name: "@kairoui/hooks",
    dir: "packages/hooks/dist",
    files: ["index.js"],
  },
  {
    name: "@kairoui/icons",
    dir: "packages/icons/dist",
    files: ["index.js"],
  },
  {
    name: "@kairoui/core",
    dir: "packages/core/dist",
    files: ["index.js", "composition.js", "styles.css"],
  },
];

// ─── Consumer bundle simulation ─────────────────────────────────────

interface ConsumerBundle {
  name: string;
  code: string;
}

const consumerBundles: ConsumerBundle[] = [
  {
    name: "single-utility",
    code: `import { invariant } from "@kairoui/utils";\nconsole.log(invariant);`,
  },
  {
    name: "single-hook",
    code: `import { useControllableState } from "@kairoui/hooks";\nconsole.log(useControllableState);`,
  },
  {
    name: "theme-only",
    code: `import { createTheme, resolveTheme } from "@kairoui/theme";\nconsole.log(createTheme, resolveTheme);`,
  },
  {
    name: "composition-only",
    code: `import { mergeProps, componentClass, generateComponentCss } from "@kairoui/core/composition";\nconsole.log(mergeProps, componentClass, generateComponentCss);`,
  },
  {
    name: "styling-only",
    code: `import { generateStylesheet, CSS_LAYERS, measureCssSize } from "@kairoui/core/composition";\nconsole.log(generateStylesheet, CSS_LAYERS, measureCssSize);`,
  },
];

function measureConsumerBundle(bundle: ConsumerBundle): SizeEntry | null {
  const tmpFile = resolve(MEASURE_DIR, `${bundle.name}.ts`);
  writeFileSync(tmpFile, bundle.code, "utf-8");

  try {
    const result = execSync(
      [
        "npx esbuild",
        `"${tmpFile}"`,
        "--bundle",
        "--format=esm",
        "--platform=browser",
        "--minify",
        "--tree-shaking=true",
        `--external:react`,
        `--external:react-dom`,
        `--external:react/jsx-runtime`,
      ].join(" "),
      { encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] },
    );

    const raw = Buffer.byteLength(result, "utf-8");
    const gzip = gzipSync(result, { level: 9 }).length;
    return { file: bundle.name, raw, minified: raw, gzip };
  } catch {
    return null;
  }
}

// ─── Main ───────────────────────────────────────────────────────────

mkdirSync(MEASURE_DIR, { recursive: true });

const report: string[] = [];
report.push("# KairoUI Bundle Size Baseline\n");
report.push(`Generated: ${new Date().toISOString().split("T")[0]}\n`);

// Package sizes
report.push("## Package Output Sizes\n");
let totalRaw = 0;
let totalMin = 0;
let totalGzip = 0;

for (const pkg of packages) {
  const entries: SizeEntry[] = [];
  for (const file of pkg.files) {
    const fullPath = resolve(ROOT, pkg.dir, file);
    if (existsSync(fullPath)) {
      const entry = measure(fullPath);
      entries.push(entry);
      totalRaw += entry.raw;
      totalMin += entry.minified;
      totalGzip += entry.gzip;
    }
  }
  report.push(printTable(pkg.name, entries));
}

report.push("### Totals\n");
report.push(`| | Raw | Minified | Gzip |`);
report.push(`|---|-----|----------|------|`);
report.push(
  `| All packages | ${formatBytes(totalRaw)} | ${formatBytes(totalMin)} | ${formatBytes(totalGzip)} |\n`,
);

// Consumer bundles
report.push("## Consumer Bundle Sizes (tree-shaken, minified)\n");
report.push("Simulated consumer importing specific APIs, bundled with esbuild.\n");
report.push("| Scenario | Minified | Gzip |");
report.push("|----------|----------|------|");

for (const bundle of consumerBundles) {
  const result = measureConsumerBundle(bundle);
  if (result) {
    report.push(
      `| ${bundle.name} | ${formatBytes(result.minified)} | ${formatBytes(result.gzip)} |`,
    );
  } else {
    report.push(`| ${bundle.name} | FAILED | — |`);
  }
}
report.push("");

// CSS breakdown
report.push("## CSS Size Breakdown\n");
const cssFiles = [
  { label: "Component styles", path: "packages/core/dist/styles.css" },
  { label: "Token variables", path: "packages/tokens/dist/tokens.css" },
  { label: "Light theme", path: "packages/tokens/dist/themes/light.css" },
  { label: "Dark theme", path: "packages/tokens/dist/themes/dark.css" },
  { label: "Density: comfortable", path: "packages/tokens/dist/density/comfortable.css" },
  { label: "Density: standard", path: "packages/tokens/dist/density/standard.css" },
  { label: "Density: compact", path: "packages/tokens/dist/density/compact.css" },
];

report.push("| File | Raw | Minified | Gzip |");
report.push("|------|-----|----------|------|");
for (const { label, path } of cssFiles) {
  const fullPath = resolve(ROOT, path);
  if (existsSync(fullPath)) {
    const entry = measure(fullPath);
    report.push(
      `| ${label} | ${formatBytes(entry.raw)} | ${formatBytes(entry.minified)} | ${formatBytes(entry.gzip)} |`,
    );
  }
}
report.push("");

// Largest modules
report.push("## Largest JS Modules\n");

const allJsEntries: (SizeEntry & { pkg: string })[] = [];
for (const pkg of packages) {
  for (const file of pkg.files) {
    if (!file.endsWith(".js")) continue;
    const fullPath = resolve(ROOT, pkg.dir, file);
    if (existsSync(fullPath)) {
      const entry = measure(fullPath);
      allJsEntries.push({ ...entry, pkg: pkg.name });
    }
  }
}
allJsEntries.sort((a, b) => b.raw - a.raw);

report.push("| Package | File | Raw | Minified | Gzip |");
report.push("|---------|------|-----|----------|------|");
for (const e of allJsEntries.slice(0, 10)) {
  report.push(
    `| ${e.pkg} | ${e.file} | ${formatBytes(e.raw)} | ${formatBytes(e.minified)} | ${formatBytes(e.gzip)} |`,
  );
}
report.push("");

const output = report.join("\n");
const reportPath = resolve(ROOT, "BUNDLE-SIZE-BASELINE.md");
writeFileSync(reportPath, output, "utf-8");
console.log(output);
console.log(`\nReport written to BUNDLE-SIZE-BASELINE.md`);
