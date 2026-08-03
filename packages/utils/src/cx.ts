/** A single class name input: string, falsy value, conditional object, or nested array. */
export type ClassValue =
  string | number | boolean | null | undefined | ClassValue[] | Record<string, unknown>;

/**
 * Composes class names from mixed inputs.
 * - Strings are included as-is (split by space is NOT performed — pass pre-split values).
 * - Numbers are converted to strings and included.
 * - false, null, undefined are skipped.
 * - Arrays are flattened recursively.
 * - Objects: keys with truthy values are included.
 * - Order is deterministic (insertion order).
 */
export function cx(...inputs: ClassValue[]): string {
  return processInputs(inputs);
}

function processInputs(inputs: ClassValue[]): string {
  let result = "";

  for (const input of inputs) {
    const segment = resolveInput(input);
    if (segment) {
      result = result ? `${result} ${segment}` : segment;
    }
  }

  return result;
}

function resolveInput(input: ClassValue): string {
  if (input == null || input === false || input === true) return "";

  if (typeof input === "string") return input;

  if (typeof input === "number") return String(input);

  if (Array.isArray(input)) return processInputs(input);

  // Object: include keys with truthy values
  let result = "";
  for (const key of Object.keys(input)) {
    if (input[key]) {
      result = result ? `${result} ${key}` : key;
    }
  }
  return result;
}
