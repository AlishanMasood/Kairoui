// @kairoui/utils — Entry point

export { invariant, warning, warnOnce, errorOnce } from "./assertion";
export {
  isDefined,
  isNullish,
  isString,
  isNumber,
  isFiniteNumber,
  isBoolean,
  isFunction,
  isObject,
  isPlainObject,
  isPromiseLike,
} from "./type-guards";
export {
  objectKeys,
  objectEntries,
  objectFromEntries,
  pick,
  omit,
  mapValues,
  filterObject,
  hasOwn,
  removeUndefined,
  createNullObject,
} from "./object";
export {
  toArray,
  compact,
  unique,
  uniqueBy,
  groupBy,
  partition,
  clampIndex,
  moveItem,
  arrayEqual,
  last,
  first,
} from "./array";
export { sameValue, shallowEqual, arrayShallowEqual, objectShallowEqual } from "./equality";
export { merge, mergeAll, nestedMerge } from "./merge";
export type { NestedMergeOptions } from "./merge";
export {
  joinId,
  sanitizeIdPart,
  toKebabCase,
  toDataAttributeName,
  toAriaId,
  capitalize,
  trimWhitespace,
  generateId,
  resetIdCounter,
} from "./string";
export { cx } from "./cx";
export type { ClassValue } from "./cx";

/**
 * A no-op function. Useful as a default callback or placeholder.
 */
export function noop(): void {
  // intentionally empty
}

/**
 * Identity function — returns the value passed to it.
 */
export function identity<T>(value: T): T {
  return value;
}

/**
 * Returns true when running in a browser environment with DOM access.
 * Safe to call on the server — returns false without throwing.
 */
export const canUseDOM: boolean =
  typeof (globalThis as Record<string, unknown>)["document"] !== "undefined";

/**
 * Returns true when running in a server (non-browser) environment.
 */
export const isServer: boolean = !canUseDOM;
