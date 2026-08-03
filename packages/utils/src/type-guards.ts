/** Returns true if value is not `null` and not `undefined`. */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

/** Returns true if value is `null` or `undefined`. */
export function isNullish(value: unknown): value is null | undefined {
  return value == null;
}

/** Returns true if value is a primitive string (not a boxed String). */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** Returns true if value is a primitive number (including NaN/Infinity). */
export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

/** Returns true if value is a finite number (excludes NaN and ±Infinity). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Returns true if value is a primitive boolean (not a boxed Boolean). */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Returns true if value is a function. */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isFunction(value: unknown): value is Function {
  return typeof value === "function";
}

/** Returns true if value is a non-null object (includes arrays, dates, etc.). */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/** Returns true if value is a plain object (created by `{}`, `Object.create(null)`, or `new Object()`). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/** Returns true if value is thenable (has a `.then` method). */
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "then" in value &&
    typeof (value as Record<string, unknown>)["then"] === "function"
  );
}
