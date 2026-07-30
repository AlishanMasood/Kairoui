// ─── Types ───────────────────────────────────────────────────────────

/** Snapshot of original values before KairoUI took ownership. */
interface OriginalState {
  attributes: Map<string, string | null>;
  cssProperties: Map<string, string>;
}

/** Result of a cleanup operation. */
export interface CleanupResult {
  readonly attributesRemoved: number;
  readonly propertiesRemoved: number;
  readonly valuesRestored: number;
  readonly alreadyClean: boolean;
}

// ─── State Tracking ──────────────────────────────────────────────────

// Stores original values per element before KairoUI overwrote them
const originalStates = new WeakMap<HTMLElement, OriginalState>();
// Tracks managed properties per element (shared with apply-theme)
const managedCssProps = new WeakMap<HTMLElement, Set<string>>();
// Tracks managed attributes per element
const managedAttrs = new WeakMap<HTMLElement, Set<string>>();

// ─── Validation ──────────────────────────────────────────────────────

function isValidTarget(target: unknown): target is HTMLElement {
  return (
    typeof target === "object" &&
    target !== null &&
    "setAttribute" in target &&
    "removeAttribute" in target &&
    "style" in target &&
    typeof (target as HTMLElement).setAttribute === "function"
  );
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Record that KairoUI is about to set an attribute on a target.
 * Saves the original value (or null if it didn't exist) for later restoration.
 */
export function trackAttribute(target: HTMLElement, attr: string, value: string): void {
  let state = originalStates.get(target);
  if (!state) {
    state = { attributes: new Map(), cssProperties: new Map() };
    originalStates.set(target, state);
  }

  // Only save the original value on first capture (don't overwrite with KairoUI values)
  if (!state.attributes.has(attr)) {
    state.attributes.set(attr, target.getAttribute(attr));
  }

  target.setAttribute(attr, value);

  let attrs = managedAttrs.get(target);
  if (!attrs) {
    attrs = new Set();
    managedAttrs.set(target, attrs);
  }
  attrs.add(attr);
}

/**
 * Record that KairoUI is about to set a CSS property on a target.
 * Saves the original value for later restoration.
 */
export function trackCssProperty(target: HTMLElement, name: string, value: string): void {
  let state = originalStates.get(target);
  if (!state) {
    state = { attributes: new Map(), cssProperties: new Map() };
    originalStates.set(target, state);
  }

  // Only save on first capture
  if (!state.cssProperties.has(name)) {
    const existing = target.style.getPropertyValue(name);
    state.cssProperties.set(name, existing);
  }

  target.style.setProperty(name, value);

  let props = managedCssProps.get(target);
  if (!props) {
    props = new Set();
    managedCssProps.set(target, props);
  }
  props.add(name);
}

/**
 * Remove a managed CSS property. If the property had a pre-existing value
 * before KairoUI, restore it. Otherwise remove the property entirely.
 */
export function untrackCssProperty(target: HTMLElement, name: string): boolean {
  const state = originalStates.get(target);
  const originalValue = state?.cssProperties.get(name);

  if (originalValue !== undefined && originalValue !== "") {
    target.style.setProperty(name, originalValue);
  } else {
    target.style.removeProperty(name);
  }

  state?.cssProperties.delete(name);

  const props = managedCssProps.get(target);
  if (props) {
    props.delete(name);
  }

  return originalValue !== undefined && originalValue !== "";
}

/**
 * Perform a full cleanup of all KairoUI-managed state on a target element.
 * Restores original attribute and CSS property values where they existed.
 * Safe to call multiple times. Safe to call on already-cleaned or invalid targets.
 */
export function cleanupTheme(target: unknown): CleanupResult {
  if (!isValidTarget(target)) {
    return { attributesRemoved: 0, propertiesRemoved: 0, valuesRestored: 0, alreadyClean: true };
  }

  const state = originalStates.get(target);
  const attrs = managedAttrs.get(target);
  const props = managedCssProps.get(target);

  if (!state && !attrs && !props) {
    return { attributesRemoved: 0, propertiesRemoved: 0, valuesRestored: 0, alreadyClean: true };
  }

  let attributesRemoved = 0;
  let propertiesRemoved = 0;
  let valuesRestored = 0;

  // Restore or remove managed attributes
  if (attrs) {
    for (const attr of attrs) {
      const originalValue = state?.attributes.get(attr);
      if (originalValue !== undefined && originalValue !== null) {
        target.setAttribute(attr, originalValue);
        valuesRestored++;
      } else {
        target.removeAttribute(attr);
      }
      attributesRemoved++;
    }
    managedAttrs.delete(target);
  }

  // Restore or remove managed CSS properties
  if (props) {
    for (const prop of props) {
      const originalValue = state?.cssProperties.get(prop);
      if (originalValue !== undefined && originalValue !== "") {
        target.style.setProperty(prop, originalValue);
        valuesRestored++;
      } else {
        target.style.removeProperty(prop);
      }
      propertiesRemoved++;
    }
    managedCssProps.delete(target);
  }

  // Clean up original state tracking
  originalStates.delete(target);

  return { attributesRemoved, propertiesRemoved, valuesRestored, alreadyClean: false };
}

/**
 * Check if an element has any KairoUI-managed state.
 */
export function hasThemeState(target: unknown): boolean {
  if (!isValidTarget(target)) return false;
  const attrs = managedAttrs.get(target);
  const props = managedCssProps.get(target);
  return (attrs !== undefined && attrs.size > 0) || (props !== undefined && props.size > 0);
}

/**
 * Get the set of CSS property names currently managed by KairoUI on a target.
 * Returns an empty set if no properties are managed.
 */
export function getManagedProperties(target: HTMLElement): ReadonlySet<string> {
  return managedCssProps.get(target) ?? new Set();
}

/**
 * Get the set of attribute names currently managed by KairoUI on a target.
 */
export function getManagedAttributes(target: HTMLElement): ReadonlySet<string> {
  return managedAttrs.get(target) ?? new Set();
}
