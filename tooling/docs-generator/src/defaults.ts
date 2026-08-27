import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ─── Types ──────────────────────────────────────────────────────────

export interface DefaultValueResult {
  readonly propName: string;
  readonly value: string;
  readonly source: "destructuring" | "jsdoc";
}

// ─── Destructuring default extraction ───────────────────────────────

// Matches: propName = "value" or propName = 123 or propName = true/false
const DESTRUCTURE_DEFAULT_RE =
  /(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|true|false|null|undefined|\d+(?:\.\d+)?)\s*[,}]/g;

export function extractDefaultsFromSource(source: string): readonly DefaultValueResult[] {
  const results: DefaultValueResult[] = [];
  const seen = new Set<string>();

  let match = DESTRUCTURE_DEFAULT_RE.exec(source);
  while (match) {
    const propName = match[1] ?? "";
    let value = match[2] ?? "";

    // Skip internal/private props
    if (propName.startsWith("_") || !propName) {
      match = DESTRUCTURE_DEFAULT_RE.exec(source);
      continue;
    }

    // Strip quotes from string literals for display
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith("`") && value.endsWith("`"))
    ) {
      value = `"${value.slice(1, -1)}"`;
    }

    if (!seen.has(propName)) {
      seen.add(propName);
      results.push({ propName, value, source: "destructuring" });
    }

    match = DESTRUCTURE_DEFAULT_RE.exec(source);
  }

  return results;
}

// ─── Component source file scanning ─────────────────────────────────

export function extractDefaultsFromComponentDir(
  componentDir: string,
): readonly DefaultValueResult[] {
  if (!existsSync(componentDir)) return [];

  const files = readdirSync(componentDir).filter(
    (f) =>
      (f.endsWith(".tsx") || f.endsWith(".ts")) &&
      !f.endsWith(".test.tsx") &&
      !f.endsWith(".test.ts"),
  );

  const results: DefaultValueResult[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const filePath = join(componentDir, file);
    if (!statSync(filePath).isFile()) continue;

    const source = readFileSync(filePath, "utf-8");
    const fileDefaults = extractDefaultsFromSource(source);

    for (const d of fileDefaults) {
      if (!seen.has(d.propName)) {
        seen.add(d.propName);
        results.push(d);
      }
    }
  }

  return results;
}

// ─── Merge defaults into extracted props ────────────────────────────

export function mergeDefaultsIntoPropMeta<
  T extends { name: string; defaultValue: string | undefined },
>(props: readonly T[], defaults: readonly DefaultValueResult[]): readonly T[] {
  const defaultMap = new Map<string, string>();
  for (const d of defaults) {
    defaultMap.set(d.propName, d.value);
  }

  return props.map((prop) => {
    // JSDoc @default takes priority (already set)
    if (prop.defaultValue !== undefined) return prop;
    const fromSource = defaultMap.get(prop.name);
    if (fromSource !== undefined) {
      return { ...prop, defaultValue: fromSource };
    }
    return prop;
  });
}
