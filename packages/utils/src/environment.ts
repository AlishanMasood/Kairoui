declare const globalThis: Record<string, unknown>;

/** Returns true when a DOM document is available. Evaluated on each call (not cached). */
export function canUseDOM(): boolean {
  return (
    typeof globalThis["document"] !== "undefined" &&
    typeof (globalThis["document"] as Record<string, unknown>)["createElement"] !== "undefined"
  );
}

/** Returns true when the `window` global is available. */
export function canUseWindow(): boolean {
  return typeof globalThis["window"] !== "undefined";
}

/** Returns true when `document` is available (may exist without full DOM, e.g., workers with polyfills). */
export function canUseDocument(): boolean {
  return typeof globalThis["document"] !== "undefined";
}

/** Returns true in a server (non-browser) environment. Evaluated on each call. */
export function isServer(): boolean {
  return !canUseDOM();
}
