import type { ThemeOverrides } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

/** Error from a merge operation. */
export interface MergeError {
  readonly path: string;
  readonly message: string;
  readonly type: "unknown_key" | "invalid_type" | "invalid_value" | "null_value";
}

/** Result of a merge operation. */
export interface MergeResult<T> {
  readonly merged: T;
  readonly errors: readonly MergeError[];
}

// ─── Schema ──────────────────────────────────────────────────────────

// Known keys per override group, used to reject unknown keys
const COLOR_GROUPS = new Set([
  "background",
  "text",
  "border",
  "interactive",
  "status",
  "focus",
  "destructive",
]);
const OVERRIDE_GROUPS = new Set(["color", "typography", "spacing", "elevation"]);

// ─── Core Merge Logic ────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasPrototypePollution(key: string): boolean {
  return key === "__proto__" || key === "constructor" || key === "prototype";
}

/**
 * Deep merge `source` into `target`, producing errors for invalid structures.
 * Only string/number leaf values are accepted.
 * null values are rejected. undefined values are skipped.
 *
 * When `strict` is true, unknown keys (not in target) are rejected.
 * When `strict` is false, new keys from source are accepted (for override accumulation).
 */
function schemaMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  errors: MergeError[],
  path: string,
  allowedKeys: Set<string> | null,
  strict = true,
): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (hasPrototypePollution(key)) {
      errors.push({
        path: path ? `${path}.${key}` : key,
        message: `Rejected key "${key}" — potential prototype pollution.`,
        type: "invalid_value",
      });
      continue;
    }

    const fullPath = path ? `${path}.${key}` : key;
    const sourceVal = source[key];

    // Skip undefined — not an override
    if (sourceVal === undefined) continue;

    // Reject null — cannot delete required tokens
    if (sourceVal === null) {
      errors.push({
        path: fullPath,
        message: "null values are not allowed — cannot delete required tokens.",
        type: "null_value",
      });
      continue;
    }

    // Check against allowed keys if a schema is provided
    if (allowedKeys !== null && !allowedKeys.has(key) && !(key in target)) {
      errors.push({
        path: fullPath,
        message: `Unknown key "${key}".`,
        type: "unknown_key",
      });
      continue;
    }

    // In strict mode, reject keys not in target
    if (strict && !(key in target) && allowedKeys === null) {
      errors.push({
        path: fullPath,
        message: `Unknown key "${key}" — not present in target.`,
        type: "unknown_key",
      });
      continue;
    }

    const targetVal = result[key];

    // Both objects → recurse
    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      result[key] = schemaMerge(targetVal, sourceVal, errors, fullPath, null, strict);
    } else if (isPlainObject(sourceVal) && targetVal === undefined) {
      // New object branch where target doesn't have it — allowed if key is valid
      result[key] = cloneDeep(sourceVal);
    } else if (typeof sourceVal === "string" || typeof sourceVal === "number") {
      result[key] = sourceVal;
    } else if (Array.isArray(sourceVal)) {
      // Arrays: replace entirely (no partial array merge)
      result[key] = Array.from(sourceVal as unknown[]);
    } else {
      errors.push({
        path: fullPath,
        message: `Invalid value type "${typeof sourceVal}" — expected string, number, or object.`,
        type: "invalid_type",
      });
    }
  }

  return result;
}

function cloneDeep(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cloneDeep);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = cloneDeep(value);
  }
  return result;
}

// ─── Public Merge Functions ──────────────────────────────────────────

/**
 * Merge override layers for the `color` group.
 * Validates against known color subcategories.
 */
export function mergeColorOverrides(
  base: NonNullable<ThemeOverrides["color"]>,
  layer: NonNullable<ThemeOverrides["color"]>,
): MergeResult<NonNullable<ThemeOverrides["color"]>> {
  const errors: MergeError[] = [];
  const merged = schemaMerge(base, layer, errors, "color", COLOR_GROUPS, false);
  return { merged: merged, errors };
}

/**
 * Merge override layers for the `typography` group.
 */
export function mergeTypographyOverrides(
  base: NonNullable<ThemeOverrides["typography"]>,
  layer: NonNullable<ThemeOverrides["typography"]>,
): MergeResult<NonNullable<ThemeOverrides["typography"]>> {
  const errors: MergeError[] = [];
  const merged = schemaMerge(base, layer, errors, "typography", null, false);
  return { merged: merged as NonNullable<ThemeOverrides["typography"]>, errors };
}

/**
 * Merge override layers for the `spacing` group.
 */
export function mergeSpacingOverrides(
  base: NonNullable<ThemeOverrides["spacing"]>,
  layer: NonNullable<ThemeOverrides["spacing"]>,
): MergeResult<NonNullable<ThemeOverrides["spacing"]>> {
  const errors: MergeError[] = [];
  const merged = schemaMerge(base, layer, errors, "spacing", null, false);
  return { merged: merged as NonNullable<ThemeOverrides["spacing"]>, errors };
}

/**
 * Merge override layers for the `elevation` group.
 */
export function mergeElevationOverrides(
  base: NonNullable<ThemeOverrides["elevation"]>,
  layer: NonNullable<ThemeOverrides["elevation"]>,
): MergeResult<NonNullable<ThemeOverrides["elevation"]>> {
  const errors: MergeError[] = [];
  const merged = schemaMerge(base, layer, errors, "elevation", null, false);
  return { merged: merged as NonNullable<ThemeOverrides["elevation"]>, errors };
}

/**
 * Merge complete ThemeOverrides objects (all groups).
 * Validates group names and delegates to group-specific mergers.
 */
export function mergeThemeOverrides(
  base: ThemeOverrides,
  layer: ThemeOverrides,
): MergeResult<ThemeOverrides> {
  const errors: MergeError[] = [];

  // Reject unknown top-level keys in the layer
  for (const key of Object.keys(layer)) {
    if (hasPrototypePollution(key)) {
      errors.push({
        path: key,
        message: `Rejected key "${key}" — potential prototype pollution.`,
        type: "invalid_value",
      });
      continue;
    }
    if (!OVERRIDE_GROUPS.has(key)) {
      errors.push({
        path: key,
        message: `Unknown override group "${key}".`,
        type: "unknown_key",
      });
    }
  }

  const baseRec = base as unknown as Record<string, unknown>;
  const layerRec = layer as unknown as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...baseRec };

  for (const group of OVERRIDE_GROUPS) {
    const baseGroup = baseRec[group];
    const layerGroup = layerRec[group];

    if (layerGroup === undefined) continue;

    if (layerGroup === null) {
      errors.push({
        path: group,
        message: "null values are not allowed — cannot delete override groups.",
        type: "null_value",
      });
      continue;
    }

    if (!isPlainObject(layerGroup)) {
      errors.push({
        path: group,
        message: `Override group "${group}" must be an object.`,
        type: "invalid_type",
      });
      continue;
    }

    if (isPlainObject(baseGroup)) {
      const allowedKeys = group === "color" ? COLOR_GROUPS : null;
      merged[group] = schemaMerge(baseGroup, layerGroup, errors, group, allowedKeys, false);
    } else {
      merged[group] = cloneDeep(layerGroup);
    }
  }

  return { merged: merged, errors };
}

/**
 * Merge metadata records. Later keys override earlier.
 * Rejects non-string values and prototype-polluting keys.
 */
export function mergeMetadata(
  base: Readonly<Record<string, string>>,
  layer: Readonly<Record<string, string>>,
): MergeResult<Readonly<Record<string, string>>> {
  const errors: MergeError[] = [];
  const merged: Record<string, string> = { ...base };

  for (const [key, value] of Object.entries(layer)) {
    if (hasPrototypePollution(key)) {
      errors.push({
        path: `metadata.${key}`,
        message: `Rejected key "${key}" — potential prototype pollution.`,
        type: "invalid_value",
      });
      continue;
    }
    if (typeof value !== "string") {
      errors.push({
        path: `metadata.${key}`,
        message: `Metadata value for "${key}" must be a string.`,
        type: "invalid_type",
      });
      continue;
    }
    merged[key] = value;
  }

  return { merged, errors };
}

/**
 * Apply a deep partial override to an object, returning a new merged copy.
 * Does not mutate inputs. Rejects null and unknown keys.
 */
export function applyPartialOverride<T extends Record<string, unknown>>(
  target: T,
  partial: Record<string, unknown>,
): MergeResult<T> {
  const errors: MergeError[] = [];
  const merged = schemaMerge(target, partial, errors, "", null);
  return { merged: merged as T, errors };
}
