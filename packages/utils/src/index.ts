// @kairoui/utils — Entry point

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
