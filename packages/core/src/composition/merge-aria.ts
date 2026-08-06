import { mergeAriaTokenList, resolveBooleanAria } from "@kairoui/utils";
import type { BooleanAriaAttribute } from "@kairoui/utils";

// ─── Token-list relationships ──────────────────────────────────────

/** ARIA attributes that use space-separated ID token lists. */
export type AriaRelationshipAttribute =
  "aria-labelledby" | "aria-describedby" | "aria-controls" | "aria-owns" | "aria-errormessage";

/** Sources for relationship merging — consumer first, then internal. */
export interface AriaRelationshipSources {
  consumer?: string | null | undefined;
  slot?: string | null | undefined;
  internal?: string | null | undefined;
  accessibility?: string | null | undefined;
  child?: string | null | undefined;
}

/**
 * Merges ARIA token-list relationship attributes from multiple composition sources.
 * Consumer tokens appear first. Duplicates are removed. Empty output returns undefined.
 */
export function mergeAriaRelationship(sources: AriaRelationshipSources): string | undefined {
  return mergeAriaTokenList(
    sources.consumer,
    sources.slot,
    sources.internal,
    sources.accessibility,
    sources.child,
  );
}

/** Input for merging multiple relationships at once. */
export type AriaRelationshipMap = Partial<
  Record<AriaRelationshipAttribute, AriaRelationshipSources>
>;

/**
 * Merges multiple ARIA relationships from named sources.
 * Returns only attributes with non-empty values.
 */
export function mergeAriaRelationships(
  relationships: AriaRelationshipMap,
): Partial<Record<AriaRelationshipAttribute, string>> {
  const result: Partial<Record<AriaRelationshipAttribute, string>> = {};

  for (const attr of Object.keys(relationships) as AriaRelationshipAttribute[]) {
    const sources = relationships[attr];
    if (sources == null) continue;
    const merged = mergeAriaRelationship(sources);
    if (merged != null) {
      result[attr] = merged;
    }
  }

  return result;
}

// ─── Boolean ARIA reconciliation ───────────────────────────────────

/** Sources for boolean ARIA attribute reconciliation. */
export interface AriaBooleanSources {
  consumer?: boolean | undefined;
  state?: boolean | undefined;
  internal?: boolean | undefined;
}

/**
 * Reconciles a boolean ARIA attribute from multiple sources.
 * Consumer wins when explicitly set. Falls back to state, then internal.
 * Returns undefined when no source provides a value (attribute omitted).
 */
export function reconcileAriaBoolean(sources: AriaBooleanSources): boolean | undefined {
  if (sources.consumer !== undefined) return sources.consumer;
  if (sources.state !== undefined) return sources.state;
  if (sources.internal !== undefined) return sources.internal;
  return undefined;
}

/** Input for reconciling multiple boolean ARIA attributes at once. */
export type AriaBooleanMap = Partial<Record<BooleanAriaAttribute, AriaBooleanSources>>;

/**
 * Reconciles multiple boolean ARIA attributes from named sources.
 * Returns a record suitable for spreading onto an element.
 * Only includes attributes with defined values.
 */
export function reconcileAriaBooleans(attributes: AriaBooleanMap): Record<string, string> {
  const resolved: Partial<Record<BooleanAriaAttribute, boolean | undefined>> = {};

  for (const attr of Object.keys(attributes) as BooleanAriaAttribute[]) {
    const sources = attributes[attr];
    if (sources == null) continue;
    const value = reconcileAriaBoolean(sources);
    if (value !== undefined) {
      resolved[attr] = value;
    }
  }

  return resolveBooleanAria(resolved);
}

// ─── Scalar ARIA reconciliation ────────────────────────────────────

/** Sources for scalar ARIA attribute reconciliation. */
export interface AriaScalarSources {
  consumer?: string | number | undefined;
  state?: string | number | undefined;
  internal?: string | number | undefined;
}

/**
 * Reconciles a scalar ARIA attribute. Consumer wins when explicitly set.
 * Returns undefined when no source provides a value (attribute omitted).
 */
export function reconcileAriaScalar(sources: AriaScalarSources): string | number | undefined {
  if (sources.consumer !== undefined) return sources.consumer;
  if (sources.state !== undefined) return sources.state;
  if (sources.internal !== undefined) return sources.internal;
  return undefined;
}
