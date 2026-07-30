import { THEME_ATTRIBUTE, DENSITY_ATTRIBUTE } from "./selectors";
import type { DensityMode, ResolvedThemeMode } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

/** Options for a scoped theme application. All fields are optional — set only what you want to override. */
export interface ScopedThemeOptions {
  readonly mode?: ResolvedThemeMode;
  readonly density?: DensityMode;
  readonly cssVariables?: Readonly<Record<string, string>>;
}

/** Result of applying a scoped theme. */
export interface ScopedThemeResult {
  readonly target: HTMLElement;
  readonly mode: ResolvedThemeMode | undefined;
  readonly density: DensityMode | undefined;
  readonly variablesApplied: number;
  readonly cleanup: () => void;
}

// Track managed CSS properties per scoped element
const scopedManagedProperties = new WeakMap<HTMLElement, Set<string>>();
// Track which attributes were set by the scope (so cleanup only removes what we set)
const scopedManagedAttributes = new WeakMap<HTMLElement, Set<string>>();
// Cache last-applied values to skip redundant DOM writes
const scopedLastValues = new WeakMap<HTMLElement, Map<string, string>>();
const scopedLastMode = new WeakMap<HTMLElement, string>();
const scopedLastDensity = new WeakMap<HTMLElement, string>();

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
 * Apply a scoped theme to a DOM sub-tree element.
 *
 * Unlike `applyTheme`, this only sets the attributes/variables that are
 * explicitly provided. Omitted fields inherit from the parent scope via
 * CSS cascade — no duplication needed.
 */
export function applyScopedTheme(
  target: HTMLElement,
  options: ScopedThemeOptions,
): ScopedThemeResult {
  if (!isValidTarget(target)) {
    throw new TypeError(
      "applyScopedTheme requires a valid DOM element with setAttribute and style.",
    );
  }

  const { mode, density, cssVariables } = options;

  // Track which attributes we manage on this element
  const managedAttrs = scopedManagedAttributes.get(target) ?? new Set<string>();

  // Apply mode if provided, skip if unchanged
  if (mode !== undefined) {
    if (scopedLastMode.get(target) !== mode) {
      target.setAttribute(THEME_ATTRIBUTE, mode);
      scopedLastMode.set(target, mode);
    }
    managedAttrs.add(THEME_ATTRIBUTE);
  } else if (managedAttrs.has(THEME_ATTRIBUTE)) {
    target.removeAttribute(THEME_ATTRIBUTE);
    managedAttrs.delete(THEME_ATTRIBUTE);
    scopedLastMode.delete(target);
  }

  // Apply density if provided, skip if unchanged
  if (density !== undefined) {
    if (scopedLastDensity.get(target) !== density) {
      target.setAttribute(DENSITY_ATTRIBUTE, density);
      scopedLastDensity.set(target, density);
    }
    managedAttrs.add(DENSITY_ATTRIBUTE);
  } else if (managedAttrs.has(DENSITY_ATTRIBUTE)) {
    target.removeAttribute(DENSITY_ATTRIBUTE);
    managedAttrs.delete(DENSITY_ATTRIBUTE);
    scopedLastDensity.delete(target);
  }

  scopedManagedAttributes.set(target, managedAttrs);

  // Handle CSS custom properties with diff
  const previouslyManaged = scopedManagedProperties.get(target) ?? new Set<string>();
  const previousValues = scopedLastValues.get(target) ?? new Map<string, string>();
  const currentManaged = new Set<string>();
  const currentValues = new Map<string, string>();

  if (cssVariables) {
    for (const [name, value] of Object.entries(cssVariables)) {
      currentManaged.add(name);
      currentValues.set(name, value);
      if (previousValues.get(name) !== value) {
        target.style.setProperty(name, value);
      }
    }
  }

  // Remove obsolete managed properties
  for (const prop of previouslyManaged) {
    if (!currentManaged.has(prop)) {
      target.style.removeProperty(prop);
    }
  }

  scopedManagedProperties.set(target, currentManaged);
  scopedLastValues.set(target, currentValues);

  return {
    target,
    mode,
    density,
    variablesApplied: currentManaged.size,
    cleanup: () => {
      cleanupScope(target);
    },
  };
}

/**
 * Remove a scoped theme from an element.
 * Only removes attributes and properties that were set by `applyScopedTheme`.
 * Safe to call on any element.
 */
export function removeScopedTheme(target: unknown): void {
  if (!isValidTarget(target)) return;

  // Remove managed attributes
  const managedAttrs = scopedManagedAttributes.get(target);
  if (managedAttrs) {
    for (const attr of managedAttrs) {
      target.removeAttribute(attr);
    }
    scopedManagedAttributes.delete(target);
  }

  // Remove managed CSS properties
  const managed = scopedManagedProperties.get(target);
  if (managed) {
    for (const prop of managed) {
      target.style.removeProperty(prop);
    }
    scopedManagedProperties.delete(target);
  }

  scopedLastValues.delete(target);
  scopedLastMode.delete(target);
  scopedLastDensity.delete(target);
}

// ─── Internal ────────────────────────────────────────────────────────

function cleanupScope(target: HTMLElement): void {
  removeScopedTheme(target);
}
