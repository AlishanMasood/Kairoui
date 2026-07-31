// @kairoui/theme/server — Server-safe theme utilities
//
// Exports for SSR: no-flash script generation, server-safe defaults.
// Never accesses browser globals.

export type { NoFlashScriptOptions } from "./no-flash-script";

export { getNoFlashScript, getNoFlashScriptReadable } from "./no-flash-script";

export type { ServerThemeState, SerializeServerStateOptions } from "./server-state";

export { serializeServerState, parseServerState, getServerHtmlAttributes } from "./server-state";
