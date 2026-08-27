import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractDefaultsFromSource,
  extractDefaultsFromComponentDir,
  mergeDefaultsIntoPropMeta,
} from "./defaults";

const THIS_DIR =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = resolve(THIS_DIR, "../../..");

// ─── extractDefaultsFromSource ──────────────────────────────────────

describe("extractDefaultsFromSource", () => {
  it("extracts string defaults", () => {
    const source = `const { orientation = "horizontal", dir = "ltr" } = props;`;
    const defaults = extractDefaultsFromSource(source);
    expect(defaults.find((d) => d.propName === "orientation")?.value).toBe('"horizontal"');
    expect(defaults.find((d) => d.propName === "dir")?.value).toBe('"ltr"');
  });

  it("extracts boolean defaults", () => {
    const source = `const { disabled = false, loading = true } = props;`;
    const defaults = extractDefaultsFromSource(source);
    expect(defaults.find((d) => d.propName === "disabled")?.value).toBe("false");
    expect(defaults.find((d) => d.propName === "loading")?.value).toBe("true");
  });

  it("extracts numeric defaults", () => {
    const source = `const { siblingCount = 1, delay = 200 } = props;`;
    const defaults = extractDefaultsFromSource(source);
    expect(defaults.find((d) => d.propName === "siblingCount")?.value).toBe("1");
    expect(defaults.find((d) => d.propName === "delay")?.value).toBe("200");
  });

  it("extracts null/undefined defaults", () => {
    const source = `const { value = undefined, ref = null } = props;`;
    const defaults = extractDefaultsFromSource(source);
    expect(defaults.find((d) => d.propName === "value")?.value).toBe("undefined");
    expect(defaults.find((d) => d.propName === "ref")?.value).toBe("null");
  });

  it("skips internal props starting with _", () => {
    const source = `const { _internal = "x" } = props;`;
    const defaults = extractDefaultsFromSource(source);
    expect(defaults).toHaveLength(0);
  });

  it("all results have source=destructuring", () => {
    const source = `const { x = "a" } = props;`;
    const defaults = extractDefaultsFromSource(source);
    expect(defaults[0]?.source).toBe("destructuring");
  });

  it("deduplicates by prop name", () => {
    const source = `const { a = "x" } = p1; const { a = "y" } = p2;`;
    const defaults = extractDefaultsFromSource(source);
    const aDefaults = defaults.filter((d) => d.propName === "a");
    expect(aDefaults).toHaveLength(1);
  });
});

// ─── extractDefaultsFromComponentDir (real components) ──────────────

describe("extractDefaultsFromComponentDir", () => {
  it("extracts defaults from Tabs component", () => {
    const dir = resolve(MONOREPO_ROOT, "packages/core/src/components/tabs");
    const defaults = extractDefaultsFromComponentDir(dir);
    const orientation = defaults.find((d) => d.propName === "orientation");
    expect(orientation).toBeDefined();
    expect(orientation!.value).toBe('"horizontal"');
  });

  it("extracts defaults from Calendar component", () => {
    const dir = resolve(MONOREPO_ROOT, "packages/core/src/components/calendar");
    const defaults = extractDefaultsFromComponentDir(dir);
    const locale = defaults.find((d) => d.propName === "locale");
    expect(locale).toBeDefined();
    expect(locale!.value).toBe('"en"');
  });

  it("extracts defaults from Accordion component", () => {
    const dir = resolve(MONOREPO_ROOT, "packages/core/src/components/accordion");
    const defaults = extractDefaultsFromComponentDir(dir);
    const orientation = defaults.find((d) => d.propName === "orientation");
    expect(orientation).toBeDefined();
    expect(orientation!.value).toBe('"vertical"');
  });

  it("returns empty for nonexistent directory", () => {
    const defaults = extractDefaultsFromComponentDir("/nonexistent/path");
    expect(defaults).toHaveLength(0);
  });
});

// ─── mergeDefaultsIntoPropMeta ──────────────────────────────────────

describe("mergeDefaultsIntoPropMeta", () => {
  it("merges defaults into props without existing defaultValue", () => {
    const props = [
      { name: "orientation", defaultValue: undefined },
      { name: "dir", defaultValue: undefined },
    ];
    const defaults = [
      { propName: "orientation", value: '"horizontal"', source: "destructuring" as const },
      { propName: "dir", value: '"ltr"', source: "destructuring" as const },
    ];
    const result = mergeDefaultsIntoPropMeta(props, defaults);
    expect(result[0]!.defaultValue).toBe('"horizontal"');
    expect(result[1]!.defaultValue).toBe('"ltr"');
  });

  it("preserves existing JSDoc defaults (higher priority)", () => {
    const props = [{ name: "size", defaultValue: '"md"' }];
    const defaults = [{ propName: "size", value: '"sm"', source: "destructuring" as const }];
    const result = mergeDefaultsIntoPropMeta(props, defaults);
    expect(result[0]!.defaultValue).toBe('"md"');
  });

  it("leaves props without matching defaults unchanged", () => {
    const props = [{ name: "unknown", defaultValue: undefined }];
    const result = mergeDefaultsIntoPropMeta(props, []);
    expect(result[0]!.defaultValue).toBeUndefined();
  });
});
