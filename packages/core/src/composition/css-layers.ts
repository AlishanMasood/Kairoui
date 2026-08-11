/**
 * CSS cascade-layer strategy for KairoUI.
 *
 * Layer order (lowest → highest priority):
 *   kui.reset → kui.base → kui.components → kui.utilities → kui.overrides
 *
 * Consumer styles outside any layer always win over layered styles,
 * keeping overrides predictable without needing !important.
 */

export const CSS_LAYERS = [
  "kui.reset",
  "kui.base",
  "kui.components",
  "kui.utilities",
  "kui.overrides",
] as const;

export type CssLayer = (typeof CSS_LAYERS)[number];

/** Generates the `@layer` order declaration that must appear first in the stylesheet. */
export function generateLayerOrder(): string {
  return `@layer ${CSS_LAYERS.join(", ")};`;
}

/** Wraps CSS content inside a `@layer` block. Returns empty string for empty input. */
export function wrapInLayer(layer: CssLayer, css: string): string {
  if (!css) return "";
  const indented = css
    .split("\n")
    .map((line) => (line ? `  ${line}` : ""))
    .join("\n");
  return `@layer ${layer} {\n${indented}\n}`;
}
