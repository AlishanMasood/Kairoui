declare const process: { env: { NODE_ENV?: string } };
declare const console: { warn(...args: unknown[]): void; error(...args: unknown[]): void };

const DEV = process.env.NODE_ENV !== "production";

/**
 * Throws if condition is falsy. Narrows the type of condition to truthy.
 * Always throws in both development and production — never swallowed.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[KairoUI] ${message}`);
  }
}

/**
 * Logs a console warning in development when condition is falsy.
 * No-op in production. Does not throw.
 */
export function warning(condition: unknown, message: string): void {
  if (DEV && !condition) {
    console.warn(`[KairoUI] ${message}`);
  }
}

const warnedKeys = new Set<string>();

/**
 * Logs a console warning in development, at most once per key.
 * Subsequent calls with the same key are silently skipped.
 */
export function warnOnce(key: string, message: string): void {
  if (DEV && !warnedKeys.has(key)) {
    warnedKeys.add(key);
    console.warn(`[KairoUI] ${message}`);
  }
}

const erroredKeys = new Set<string>();

/**
 * Logs a console error in development, at most once per key.
 * Does not throw — use invariant for fatal errors.
 */
export function errorOnce(key: string, message: string): void {
  if (DEV && !erroredKeys.has(key)) {
    erroredKeys.add(key);
    console.error(`[KairoUI] ${message}`);
  }
}
