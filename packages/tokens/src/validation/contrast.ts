/**
 * Color Contrast Validation
 *
 * WCAG 2.1 contrast ratio validation for token color pairings.
 * Pure computation — no DOM, no external APIs.
 *
 * ## WCAG Targets
 *
 * | Level | Ratio | Applies To                                    |
 * | ----- | ----- | --------------------------------------------- |
 * | AA    | 4.5:1 | Normal text (< 18pt / < 14pt bold)            |
 * | AA    | 3:1   | Large text (≥ 18pt / ≥ 14pt bold)             |
 * | AA    | 3:1   | Non-text UI components and graphical objects  |
 * | AAA   | 7:1   | Normal text (enhanced)                        |
 *
 * ## Disabled Controls
 *
 * WCAG does not require contrast compliance for disabled controls
 * (WCAG 1.4.3 exception for "inactive user interface components").
 * However, disabled text should still be perceptible. We recommend
 * a minimum 2:1 ratio as a readability floor.
 */

// ─── Core Computation ────────────────────────────────────────────────

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function parseHexToRgb(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHexToRgb(hex);
  if (!rgb) return null;
  return (
    0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2])
  );
}

export function contrastRatio(fg: string, bg: string): number | null {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Validation ──────────────────────────────────────────────────────

export interface ContrastCheckResult {
  readonly pass: boolean;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly required: number;
  readonly label: string;
  readonly theme: string;
}

export interface ContrastPairing {
  readonly fg: string;
  readonly bg: string;
  readonly fgLabel: string;
  readonly bgLabel: string;
  readonly required: number;
  readonly theme: string;
}

export function checkContrast(pairing: ContrastPairing): ContrastCheckResult {
  const ratio = contrastRatio(pairing.fg, pairing.bg);
  const safeRatio = ratio ?? 0;
  return {
    pass: safeRatio >= pairing.required,
    foreground: pairing.fg,
    background: pairing.bg,
    ratio: Math.round(safeRatio * 100) / 100,
    required: pairing.required,
    label: `${pairing.fgLabel} on ${pairing.bgLabel}`,
    theme: pairing.theme,
  };
}

export function checkAllContrasts(pairings: ContrastPairing[]): {
  results: ContrastCheckResult[];
  failures: ContrastCheckResult[];
  allPass: boolean;
} {
  const results = pairings.map(checkContrast);
  const failures = results.filter((r) => !r.pass);
  return { results, failures, allPass: failures.length === 0 };
}

export function formatFailure(result: ContrastCheckResult): string {
  return `FAIL [${result.theme}] ${result.label}: ${result.ratio}:1 (requires ${result.required}:1) — fg:${result.foreground} bg:${result.background}`;
}
