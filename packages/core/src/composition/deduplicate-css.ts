/**
 * CSS deduplication and ordering utilities for generated stylesheets.
 *
 * Safe deduplication rules:
 * - Identical rules (same selector + body) → keep last occurrence (preserves cascade)
 * - Duplicate contracts with the same name → keep last occurrence
 * - Empty rules → remove
 *
 * Unsafe (never done):
 * - Merging rules with different selectors (changes cascade semantics)
 * - Reordering rules across semantic boundaries
 */

import type { GenerateCssInput } from "./generate-css";

// ─── Rule Deduplication ─────────────────────────────────────────────

/**
 * Removes duplicate rules from CSS output.
 * A rule is considered duplicate if its full text (selector + body) is identical.
 * Keeps the LAST occurrence to preserve cascade override semantics.
 */
export function deduplicateRules(css: string): string {
  if (!css) return "";

  const sections = css.split("\n\n").filter((s) => s.trim());
  if (sections.length === 0) return css;

  // Track seen rules. Keep last occurrence.
  const seen = new Map<string, number>();
  for (const [i, section] of sections.entries()) {
    seen.set(section, i);
  }

  const kept = new Set(seen.values());
  return sections.filter((_, i) => kept.has(i)).join("\n\n");
}

// ─── Contract Deduplication ─────────────────────────────────────────

/**
 * Deduplicates contracts by resolved component name.
 * If multiple contracts share the same name, the LAST one wins.
 */
export function deduplicateContracts(contracts: readonly GenerateCssInput[]): GenerateCssInput[] {
  const nameMap = new Map<string, GenerateCssInput>();
  for (const input of contracts) {
    const name = input.componentName ?? input.contract.name;
    nameMap.set(name, input);
  }
  return [...nameMap.values()];
}

// ─── CSS Size Metrics ───────────────────────────────────────────────

export interface CssSizeMetrics {
  /** Total byte size (UTF-8). */
  readonly bytes: number;
  /** Number of CSS rules. */
  readonly ruleCount: number;
  /** Number of unique selectors. */
  readonly uniqueSelectors: number;
  /** Number of declarations across all rules. */
  readonly declarationCount: number;
}

function extractSelector(section: string): string {
  const braceIdx = section.indexOf("{");
  return braceIdx >= 0 ? section.slice(0, braceIdx).trim() : "";
}

/** Measures the size and complexity of generated CSS. */
export function measureCssSize(css: string): CssSizeMetrics {
  if (!css) return { bytes: 0, ruleCount: 0, uniqueSelectors: 0, declarationCount: 0 };

  const sections = css.split("\n\n").filter((s) => s.includes("{"));
  const selectors = new Set(sections.map(extractSelector));
  const declarationCount = sections.reduce((sum, section) => {
    return sum + section.split("\n").filter((l) => l.trim().endsWith(";")).length;
  }, 0);

  return {
    bytes: new TextEncoder().encode(css).length,
    ruleCount: sections.length,
    uniqueSelectors: selectors.size,
    declarationCount,
  };
}
