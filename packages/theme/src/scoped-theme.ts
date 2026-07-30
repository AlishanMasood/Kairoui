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

  // Apply mode if provided
  if (mode !== undefined) {
    target.setAttribute(THEME_ATTRIBUTE, mode);
    managedAttrs.add(THEME_ATTRIBUTE);
  } else if (managedAttrs.has(THEME_ATTRIBUTE)) {
    // Previously set by scope, now omitted — remove it
    target.removeAttribute(THEME_ATTRIBUTE);
    managedAttrs.delete(THEME_ATTRIBUTE);
  }

  // Apply density if provided
  if (density !== undefined) {
    target.setAttribute(DENSITY_ATTRIBUTE, density);
    managedAttrs.add(DENSITY_ATTRIBUTE);
  } else if (managedAttrs.has(DENSITY_ATTRIBUTE)) {
    target.removeAttribute(DENSITY_ATTRIBUTE);
    managedAttrs.delete(DENSITY_ATTRIBUTE);
  }

  scopedManagedAttributes.set(target, managedAttrs);

  // Handle CSS custom properties
  const previouslyManaged = scopedManagedProperties.get(target) ?? new Set<string>();
  const currentManaged = new Set<string>();

  if (cssVariables) {
    for (const [name, value] of Object.entries(cssVariables)) {
      target.style.setProperty(name, value);
      currentManaged.add(name);
    }
  }

  // Remove obsolete managed properties
  for (const prop of previouslyManaged) {
    if (!currentManaged.has(prop)) {
      target.style.removeProperty(prop);
    }
  }

  scopedManagedProperties.set(target, currentManaged);

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
}

// ─── Internal ────────────────────────────────────────────────────────

function cleanupScope(target: HTMLElement): void {
  removeScopedTheme(target);
}
