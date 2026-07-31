import type { DensityMode, ResolvedThemeMode, ThemeMode } from "./types";
import { PREFERENCE_VERSION } from "./preference";

// ─── Types ───────────────────────────────────────────────────────────

/** Serialized server theme state for hydration. */
export interface ServerThemeState {
  readonly v: number;
  readonly mode: ThemeMode;
  readonly resolvedMode: ResolvedThemeMode;
  readonly density: DensityMode;
  readonly themeName: string;
}

/** Options for serializing server theme state. */
export interface SerializeServerStateOptions {
  readonly mode?: ThemeMode;
  readonly resolvedMode?: ResolvedThemeMode;
  readonly density?: DensityMode;
  readonly themeName?: string;
}

// ─── Validation ──────────────────────────────────────────────────────

const VALID_MODES = new Set(["light", "dark", "system"]);
const VALID_RESOLVED = new Set(["light", "dark"]);
const VALID_DENSITIES = new Set(["comfortable", "standard", "compact"]);

function isValidMode(v: unknown): v is ThemeMode {
  return typeof v === "string" && VALID_MODES.has(v);
}

function isValidResolved(v: unknown): v is ResolvedThemeMode {
  return typeof v === "string" && VALID_RESOLVED.has(v);
}

function isValidDensity(v: unknown): v is DensityMode {
  return typeof v === "string" && VALID_DENSITIES.has(v);
}

function isPlainString(v: unknown): v is string {
  return typeof v === "string";
}

// ─── Escaping ────────────────────────────────────────────────────────

/**
 * Serialize to JSON and escape dangerous HTML characters.
 *
 * Standard JSON.stringify output is NOT safe for inline `<script>` because
 * a string containing `</script>` would close the script tag. We replace
 * dangerous characters with their unicode escape sequences in a way that
 * JSON.parse still interprets correctly.
 */
function safeJsonStringify(value: unknown): string {
  // JSON.stringify, then replace dangerous characters within string values
  const json = JSON.stringify(value);
  // Replace characters that can break HTML context.
  // We use code-point replacements that are valid inside JSON strings.
  let result = "";
  for (let i = 0; i < json.length; i++) {
    const ch = json.charAt(i);
    const code = ch.charCodeAt(0);
    if (code === 0x3c) {
      result += "\\u003c"; // <
    } else if (code === 0x3e) {
      result += "\\u003e"; // >
    } else if (code === 0x26) {
      result += "\\u0026"; // &
    } else if (code === 0x2028) {
      result += "\\u2028";
    } else if (code === 0x2029) {
      result += "\\u2029";
    } else {
      result += ch;
    }
  }
  return result;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Serialize the initial server theme state to a safe JSON string.
 *
 * The output is safe for inline insertion in HTML `<script>` tags:
 * - Escapes `<`, `>`, `&`, and line separators
 * - Rejects non-string/executable values
 * - Contains only validated theme preference data
 */
export function serializeServerState(options: SerializeServerStateOptions = {}): string {
  const state: ServerThemeState = {
    v: PREFERENCE_VERSION,
    mode: isValidMode(options.mode) ? options.mode : "system",
    resolvedMode: isValidResolved(options.resolvedMode) ? options.resolvedMode : "light",
    density: isValidDensity(options.density) ? options.density : "comfortable",
    themeName: isPlainString(options.themeName) ? options.themeName : "",
  };

  return safeJsonStringify(state);
}

/**
 * Generate the HTML attributes for the initial server render.
 * Returns a record suitable for spreading onto the `<html>` element.
 */
export function getServerHtmlAttributes(options: SerializeServerStateOptions = {}): {
  "data-kui-theme": ResolvedThemeMode;
  "data-kui-density": DensityMode;
} {
  return {
    "data-kui-theme": isValidResolved(options.resolvedMode) ? options.resolvedMode : "light",
    "data-kui-density": isValidDensity(options.density) ? options.density : "comfortable",
  };
}

/**
 * Parse a serialized server state string back into a validated object.
 * Returns null for invalid input.
 */
export function parseServerState(json: string): ServerThemeState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;

  if (obj["v"] !== PREFERENCE_VERSION) return null;
  if (!isValidMode(obj["mode"])) return null;
  if (!isValidResolved(obj["resolvedMode"])) return null;
  if (!isValidDensity(obj["density"])) return null;
  if (!isPlainString(obj["themeName"])) return null;

  // Reject prototype-polluting keys as own properties
  if (
    Object.hasOwn(obj, "__proto__") ||
    Object.hasOwn(obj, "constructor") ||
    Object.hasOwn(obj, "prototype")
  ) {
    return null;
  }

  return {
    v: PREFERENCE_VERSION,
    mode: obj["mode"],
    resolvedMode: obj["resolvedMode"],
    density: obj["density"],
    themeName: obj["themeName"],
  };
}
