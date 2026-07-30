import { THEME_ATTRIBUTE, DENSITY_ATTRIBUTE } from "./selectors";
import type { DensityMode, ResolvedThemeMode } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

/** Options for applying a theme to a DOM element. */
export interface ApplyThemeOptions {
  readonly mode: ResolvedThemeMode;
  readonly density: DensityMode;
  readonly cssVariables?: Readonly<Record<string, string>>;
}

/** Metadata returned after applying a theme. */
export interface ApplyThemeResult {
  readonly target: HTMLElement;
  readonly mode: ResolvedThemeMode;
  readonly density: DensityMode;
  readonly variablesApplied: number;
  readonly cleanup: () => void;
}

// Track managed CSS properties per element
const managedProperties = new WeakMap<HTMLElement, Set<string>>();
// Cache last-applied values to skip redundant DOM writes
const lastAppliedValues = new WeakMap<HTMLElement, Map<string, string>>();
const lastAppliedMode = new WeakMap<HTMLElement, string>();
const lastAppliedDensity = new WeakMap<HTMLElement, string>();

// ─── Validation ──────────────────────────────────────────────────────

function isValidTarget(target: unknown): target is HTMLElement {
  return (
    typeof target === "object" &&
    target !== null &&
    "setAttribute" in target &&
    "style" in target &&
    typeof (target as HTMLElement).setAttribute === "function"
  );
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Apply theme attributes and CSS custom properties to a DOM element.
 *
 * Tracks which CSS properties were set by KairoUI so they can be
 * removed on reapplication or cleanup without affecting consumer styles.
 */
export function applyTheme(target: HTMLElement, options: ApplyThemeOptions): ApplyThemeResult {
  if (!isValidTarget(target)) {
    throw new TypeError("applyTheme requires a valid DOM element with setAttribute and style.");
  }

  const { mode, density, cssVariables } = options;

  // Apply data attributes only if changed
  if (lastAppliedMode.get(target) !== mode) {
    target.setAttribute(THEME_ATTRIBUTE, mode);
    lastAppliedMode.set(target, mode);
  }
  if (lastAppliedDensity.get(target) !== density) {
    target.setAttribute(DENSITY_ATTRIBUTE, density);
    lastAppliedDensity.set(target, density);
  }

  // Get previously managed properties for this element
  const previouslyManaged = managedProperties.get(target) ?? new Set<string>();
  const previousValues = lastAppliedValues.get(target) ?? new Map<string, string>();
  const currentManaged = new Set<string>();
  const currentValues = new Map<string, string>();

  // Apply new CSS custom properties, skipping unchanged values
  if (cssVariables) {
    for (const [name, value] of Object.entries(cssVariables)) {
      currentManaged.add(name);
      currentValues.set(name, value);
      if (previousValues.get(name) !== value) {
        target.style.setProperty(name, value);
      }
    }
  }

  // Remove obsolete managed properties (were set before, not in current set)
  for (const prop of previouslyManaged) {
    if (!currentManaged.has(prop)) {
      target.style.removeProperty(prop);
    }
  }

  // Update tracked set
  managedProperties.set(target, currentManaged);
  lastAppliedValues.set(target, currentValues);

  return {
    target,
    mode,
    density,
    variablesApplied: currentManaged.size,
    cleanup: () => {
      cleanupElement(target);
    },
  };
}

/**
 * Remove all KairoUI-managed attributes and CSS properties from an element.
 * Safe to call on elements without a theme or with invalid targets.
 */
export function removeTheme(target: unknown): void {
  if (!isValidTarget(target)) return;

  target.removeAttribute(THEME_ATTRIBUTE);
  target.removeAttribute(DENSITY_ATTRIBUTE);

  const managed = managedProperties.get(target);
  if (managed) {
    for (const prop of managed) {
      target.style.removeProperty(prop);
    }
    managedProperties.delete(target);
  }
  lastAppliedValues.delete(target);
  lastAppliedMode.delete(target);
  lastAppliedDensity.delete(target);
}

/** Read the current resolved theme mode from an element. */
export function readThemeMode(target: HTMLElement): ResolvedThemeMode | null {
  const value = target.getAttribute(THEME_ATTRIBUTE);
  if (value === "light" || value === "dark") return value;
  return null;
}

/** Read the current density mode from an element. */
export function readDensity(target: HTMLElement): DensityMode | null {
  const value = target.getAttribute(DENSITY_ATTRIBUTE);
  if (value === "comfortable" || value === "standard" || value === "compact") {
    return value;
  }
  return null;
}

// ─── Internal ────────────────────────────────────────────────────────

function cleanupElement(target: HTMLElement): void {
  removeTheme(target);
}
