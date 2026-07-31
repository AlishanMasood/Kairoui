// Deduplication set for warnings that should only fire once per session
const emittedWarnings = new Set<string>();

declare const process: { env: Record<string, string | undefined> } | undefined;

function isDev(): boolean {
  try {
    return typeof process !== "undefined" && process.env["NODE_ENV"] !== "production";
  } catch {
    return true;
  }
}

/**
 * Emit a development-only warning. No-ops in production.
 * Deduplicates by key to avoid spamming the console.
 */
export function devWarn(key: string, message: string): void {
  if (!isDev()) return;
  if (emittedWarnings.has(key)) return;
  emittedWarnings.add(key);
  console.warn(`[KairoUI] ${message}`);
}

/**
 * Emit a development-only warning every time (no deduplication).
 * Use for warnings that are context-dependent (e.g., per-render issues).
 */
export function devWarnAlways(message: string): void {
  if (!isDev()) return;
  console.warn(`[KairoUI] ${message}`);
}

/** Reset emitted warnings (for testing). */
export function resetDevWarnings(): void {
  emittedWarnings.clear();
}

// ─── Specific Diagnostics ────────────────────────────────────────────

export function warnInvalidThemeDefinition(name: string, details: string): void {
  devWarn(`invalid-definition:${name}`, `Invalid theme definition "${name}": ${details}`);
}

export function warnUnknownOverrideKey(path: string): void {
  devWarn(`unknown-key:${path}`, `Unknown override key at "${path}". This key will be ignored.`);
}

export function warnControlledUncontrolledSwitch(prop: string): void {
  devWarn(
    `controlled-switch:${prop}`,
    `KairoProvider switched between controlled and uncontrolled "${prop}". ` +
      `This is not supported. Choose either \`${prop}\` (controlled) or \`default${prop.charAt(0).toUpperCase()}${prop.slice(1)}\` (uncontrolled) for the component's lifetime.`,
  );
}

export function warnMissingProvider(hookName: string): void {
  devWarnAlways(
    `${hookName}() called outside of <KairoProvider>. ` +
      `Wrap your component tree in <KairoProvider> to use theme hooks.`,
  );
}

export function warnInvalidPersistedData(key: string, reason: string): void {
  devWarn(
    `invalid-persisted:${key}`,
    `Invalid persisted theme data in "${key}": ${reason}. The stored value will be ignored.`,
  );
}

export function warnUnsupportedStorage(reason: string): void {
  devWarn(
    "unsupported-storage",
    `Theme storage unavailable: ${reason}. Preferences will not be persisted.`,
  );
}

export function warnInvalidTarget(detail: string): void {
  devWarn(
    "invalid-target",
    `Invalid theme target: ${detail}. Theme attributes will not be applied.`,
  );
}

export function warnDuplicateTarget(scopeId: string): void {
  devWarn(
    `duplicate-target:${scopeId}`,
    `Multiple KairoProviders are targeting the same element (scope: ${scopeId}). ` +
      `Only one provider should own a given target element.`,
  );
}

export function warnDomApplicationFailed(detail: string): void {
  devWarn("dom-failed", `Failed to apply theme to DOM: ${detail}.`);
}

export function warnInvalidServerState(reason: string): void {
  devWarn(
    "invalid-server-state",
    `Invalid serialized server state: ${reason}. Server state will be ignored.`,
  );
}

export function warnDeprecatedApi(name: string, replacement: string): void {
  devWarn(`deprecated:${name}`, `"${name}" is deprecated. Use "${replacement}" instead.`);
}

export function warnInvalidNestedScope(detail: string): void {
  devWarn("invalid-nested-scope", `Invalid nested scope configuration: ${detail}.`);
}
