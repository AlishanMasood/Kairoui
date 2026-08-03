// Keys that must never be copied to prevent prototype pollution.
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isSafeKey(key: string): boolean {
  return !UNSAFE_KEYS.has(key);
}

/**
 * Shallow merge of two objects. Returns a new null-prototype object.
 * - Only own enumerable string keys are copied.
 * - `source` values overwrite `target` values for matching keys.
 * - `undefined` in source explicitly overwrites (use omit to remove keys).
 * - Arrays are replaced, not concatenated.
 * - Prototype-polluting keys (__proto__, constructor, prototype) are skipped.
 * - Inputs are never mutated.
 */
export function merge<T extends Record<string, unknown>, S extends Record<string, unknown>>(
  target: T,
  source: S,
): T & S {
  const result = Object.create(null) as Record<string, unknown>;

  for (const key of Object.keys(target)) {
    if (isSafeKey(key)) {
      result[key] = target[key];
    }
  }

  for (const key of Object.keys(source)) {
    if (isSafeKey(key)) {
      result[key] = source[key];
    }
  }

  return result as T & S;
}

/**
 * Shallow merge of multiple objects, applied left to right.
 * Later sources override earlier ones for matching keys.
 */
export function mergeAll(...sources: readonly Record<string, unknown>[]): Record<string, unknown> {
  const result = Object.create(null) as Record<string, unknown>;

  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (isSafeKey(key)) {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/** Options for nestedMerge behavior. */
export interface NestedMergeOptions {
  /**
   * Keys whose values should be recursively shallow-merged (one level deep).
   * Only plain objects at these keys are merged; all other types are replaced.
   */
  nestedKeys?: readonly string[];
}

/**
 * Merge with optional one-level nesting for specified keys.
 * Provides a schema-aware extension point without unbounded deep merge.
 *
 * - For keys listed in `options.nestedKeys`, if both target and source have
 *   a plain-object value, those objects are shallow-merged.
 * - All other keys follow standard shallow-merge behavior.
 * - Prototype-polluting keys are skipped at both levels.
 */
export function nestedMerge<T extends Record<string, unknown>, S extends Record<string, unknown>>(
  target: T,
  source: S,
  options: NestedMergeOptions = {},
): T & S {
  const nestedKeySet = new Set(options.nestedKeys ?? []);
  const result = Object.create(null) as Record<string, unknown>;

  for (const key of Object.keys(target)) {
    if (isSafeKey(key)) {
      result[key] = target[key];
    }
  }

  for (const key of Object.keys(source)) {
    if (!isSafeKey(key)) continue;

    const sourceVal = source[key];
    const targetVal = result[key];

    if (nestedKeySet.has(key) && isPlainObj(targetVal) && isPlainObj(sourceVal)) {
      // One-level nested merge for schema-declared keys
      const nested = Object.create(null) as Record<string, unknown>;
      for (const nk of Object.keys(targetVal)) {
        if (isSafeKey(nk)) nested[nk] = targetVal[nk];
      }
      for (const nk of Object.keys(sourceVal)) {
        if (isSafeKey(nk)) nested[nk] = sourceVal[nk];
      }
      result[key] = nested;
    } else {
      result[key] = sourceVal;
    }
  }

  return result as T & S;
}

function isPlainObj(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}
