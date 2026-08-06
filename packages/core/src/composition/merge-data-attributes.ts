/** A valid data-attribute value: string or empty string for boolean presence. */
export type DataAttrValue = string | number | boolean | undefined | null;

/** Data attribute sources for composition. */
export interface DataAttributeSources {
  /** Internal component metadata (e.g., data-kui-component). Protected. */
  metadata?: Record<string, DataAttrValue>;
  /** Internal state attributes (e.g., data-disabled, data-loading). */
  state?: Record<string, DataAttrValue>;
  /** Consumer-provided data attributes. */
  consumer?: Record<string, DataAttrValue>;
  /** Slot-level data attributes (future). */
  slot?: Record<string, DataAttrValue>;
}

// Protected prefix — consumer cannot override these
const PROTECTED_PREFIX = "data-kui-";

/**
 * Merges data attributes from multiple composition sources.
 *
 * Precedence: metadata (protected) → state → consumer → slot
 * - Protected attributes (data-kui-*) cannot be overridden by consumer.
 * - Consumer attributes override state for non-protected keys.
 * - Slot attributes override consumer.
 * - Boolean true → "" (presence attribute). Boolean false → removed.
 * - undefined/null values are removed from output.
 * - Numbers are stringified.
 */
export function mergeDataAttributes(sources: DataAttributeSources): Record<string, string> {
  // Collect all resolved entries: key → value (or null for removal)
  const entries = new Map<string, string | null>();

  // 1. Metadata (protected)
  applyToMap(entries, sources.metadata);
  // 2. State
  applyToMap(entries, sources.state);
  // 3. Consumer (skip protected keys)
  applyToMap(entries, sources.consumer, true);
  // 4. Slot (skip protected keys)
  applyToMap(entries, sources.slot, true);
  // 5. Re-apply protected metadata (always wins)
  applyToMap(entries, sources.metadata);

  // Build final output — skip null entries
  const result: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (value !== null) {
      result[key] = value;
    }
  }
  return result;
}

function applyToMap(
  map: Map<string, string | null>,
  source: Record<string, DataAttrValue> | undefined,
  skipProtected = false,
): void {
  if (!source) return;
  for (const [key, value] of Object.entries(source)) {
    if (skipProtected && key.startsWith(PROTECTED_PREFIX)) continue;
    map.set(key, resolveValue(value));
  }
}

function resolveValue(value: DataAttrValue): string | null {
  if (value === undefined || value === null || value === false) return null;
  if (value === true) return "";
  if (typeof value === "number") return String(value);
  return value;
}
