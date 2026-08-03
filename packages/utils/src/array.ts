/** Wraps a value in an array if it isn't one already. */
export function toArray<T>(value: T | readonly T[] | T[]): T[] {
  if (Array.isArray(value)) return [...value];
  return [value] as T[];
}

/** Removes null and undefined values from an array. */
export function compact<T>(arr: readonly (T | null | undefined)[]): T[] {
  return arr.filter((v): v is T => v != null);
}

/** Returns a new array with duplicate values removed (by strict equality). */
export function unique<T>(arr: readonly T[]): T[] {
  return [...new Set(arr)];
}

/** Returns a new array with duplicates removed based on a key function. */
export function uniqueBy<T>(arr: readonly T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set<unknown>();
  const result: T[] = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/** Groups array items by a key function. Preserves insertion order within groups. */
export function groupBy<T, K extends string | number>(
  arr: readonly T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  const result = Object.create(null) as Record<K, T[]>;
  for (const item of arr) {
    const key = keyFn(item);
    if (!(key in result)) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

/** Splits an array into two groups based on a predicate: [pass, fail]. */
export function partition<T>(arr: readonly T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of arr) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }
  return [pass, fail];
}

/** Clamps an index to valid array bounds. Returns -1 for empty arrays. */
export function clampIndex(index: number, length: number): number {
  if (length <= 0) return -1;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return Math.trunc(index);
}

/** Returns a new array with an item moved from one index to another. */
export function moveItem<T>(arr: readonly T[], from: number, to: number): T[] {
  if (arr.length === 0) return [];
  const result = [...arr];
  const clampedFrom = clampIndex(from, arr.length);
  const clampedTo = clampIndex(to, arr.length);
  if (clampedFrom === -1 || clampedTo === -1) return result;
  const [item] = result.splice(clampedFrom, 1);
  result.splice(clampedTo, 0, item as T);
  return result;
}

/** Returns true if two arrays are equal by strict element comparison. Shallow. */
export function arrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Returns the last element, or undefined if empty. */
export function last<T>(arr: readonly T[]): T | undefined {
  return arr[arr.length - 1];
}

/** Returns the first element, or undefined if empty. */
export function first<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}
