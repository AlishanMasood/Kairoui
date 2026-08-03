/**
 * SameValue comparison (Object.is semantics).
 * Handles NaN === NaN and distinguishes +0 from -0.
 */
export function sameValue(a: unknown, b: unknown): boolean {
  return Object.is(a, b);
}

/**
 * Shallow equality for two values of any type.
 * - Primitives: Object.is comparison
 * - Arrays: length + element-wise Object.is
 * - Plain objects: own key count + value-wise Object.is
 * - Other objects (Date, Map, etc.): reference equality only
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    return arrayShallowEqual(a, b);
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  return objectShallowEqual(a as Record<string, unknown>, b as Record<string, unknown>);
}

/**
 * Shallow equality for two arrays.
 * Compares length and each element with Object.is.
 */
export function arrayShallowEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Shallow equality for two plain objects.
 * Compares own enumerable string keys and their values with Object.is.
 * Does not traverse prototypes or compare symbol keys.
 */
export function objectShallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  if (a === b) return true;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) {
      return false;
    }
  }
  return true;
}
