/** Type-safe Object.keys — returns `(keyof T)[]` instead of `string[]`. */
export function objectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/** Type-safe Object.entries — preserves key literal types. */
export function objectEntries<T extends Record<string, unknown>>(
  obj: T,
): [keyof T & string, T[keyof T & string]][] {
  return Object.entries(obj) as [keyof T & string, T[keyof T & string]][];
}

/** Type-safe Object.fromEntries. */
export function objectFromEntries<K extends string, V>(
  entries: Iterable<readonly [K, V]>,
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

/** Returns a new object with only the specified keys. Shallow copy. */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = Object.create(null) as Pick<T, K>;
  for (const key of keys) {
    if (hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/** Returns a new object without the specified keys. Shallow copy. */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const keysToOmit = new Set<string | number | symbol>(keys);
  const result = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!keysToOmit.has(key)) {
      result[key] = obj[key];
    }
  }
  return result as Omit<T, K>;
}

/** Returns a new object with values transformed by the mapper. Shallow. */
export function mapValues<T extends Record<string, unknown>, U>(
  obj: T,
  fn: (value: T[keyof T & string], key: keyof T & string) => U,
): Record<keyof T & string, U> {
  const result = Object.create(null) as Record<string, U>;
  for (const key of Object.keys(obj)) {
    result[key] = fn(obj[key] as T[keyof T & string], key);
  }
  return result;
}

/** Returns a new object with only entries that pass the predicate. Shallow. */
export function filterObject<T extends Record<string, unknown>>(
  obj: T,
  predicate: (value: T[keyof T & string], key: keyof T & string) => boolean,
): Partial<T> {
  const result = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (predicate(obj[key] as T[keyof T & string], key)) {
      result[key] = obj[key];
    }
  }
  return result as Partial<T>;
}

/** Type-safe own-property check. Does not traverse the prototype chain. */
export function hasOwn<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Returns a new object with all `undefined` values removed. Shallow. */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result as Partial<T>;
}

/** Creates an object with null prototype — safe from prototype pollution. */
export function createNullObject<T extends Record<string, unknown>>(source?: T): T {
  const obj = Object.create(null) as T;
  if (source) {
    for (const key of Object.keys(source)) {
      (obj as Record<string, unknown>)[key] = source[key];
    }
  }
  return obj;
}
