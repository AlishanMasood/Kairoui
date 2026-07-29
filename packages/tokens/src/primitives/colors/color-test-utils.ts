/**
 * Shared test utilities for color scale validation.
 */

import { expect } from "vitest";
import type { ColorScaleStep } from "../../types/primitives";

/** All required scale steps as defined by ColorScale type */
export const REQUIRED_STEPS: ColorScaleStep[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

/** Hex color regex: #RRGGBB (6 chars, lowercase) */
export const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/;

/**
 * Convert sRGB component (0-255) to linear.
 */
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/**
 * Calculate relative luminance per WCAG 2.1.
 */
export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/**
 * Calculate WCAG contrast ratio between two colors.
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Assert a color scale has all required steps, valid hex, unique values, and correct ordering.
 */
export function assertValidColorScale(scale: Record<string, string>, name: string): void {
  // Required keys
  for (const step of REQUIRED_STEPS) {
    expect(scale[step], `${name}[${step}] should be defined`).toBeDefined();
  }

  // Exactly 11 steps
  expect(Object.keys(scale), `${name} should have 11 steps`).toHaveLength(11);

  // Valid hex format
  for (const step of REQUIRED_STEPS) {
    expect(scale[step], `${name}[${step}] should be valid hex`).toMatch(HEX_COLOR_REGEX);
  }

  // Uniqueness
  const values = Object.values(scale);
  const unique = new Set(values);
  expect(unique.size, `${name} should have unique values`).toBe(values.length);

  // Ordering (lightness decreases with step)
  for (let i = 1; i < REQUIRED_STEPS.length; i++) {
    const prev = REQUIRED_STEPS[i - 1] as ColorScaleStep;
    const curr = REQUIRED_STEPS[i] as ColorScaleStep;
    const prevLum = relativeLuminance(scale[prev] as string);
    const currLum = relativeLuminance(scale[curr] as string);
    expect(currLum, `${name}[${curr}] should be darker than ${name}[${prev}]`).toBeLessThan(
      prevLum,
    );
  }
}
