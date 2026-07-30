import type { DensityMode, ResolvedThemeMode, ThemeDefinition, ThemeOverrides } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

/** Categories for validation errors. */
export type ValidationCategory =
  | "missing_required"
  | "invalid_value"
  | "invalid_type"
  | "unknown_key"
  | "invalid_format"
  | "circular_reference"
  | "deprecated";

/** A structured validation diagnostic. */
export interface ValidationDiagnostic {
  readonly themeName: string;
  readonly path: string;
  readonly category: ValidationCategory;
  readonly message: string;
  readonly received?: string;
  readonly expected?: string;
  readonly suggestion?: string;
}

/** Result of comprehensive validation. */
export interface ValidationReport {
  readonly valid: boolean;
  readonly diagnostics: readonly ValidationDiagnostic[];
  readonly errorCount: number;
  readonly warningCount: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const VALID_BASES: ReadonlySet<string> = new Set(["light", "dark"]);
const VALID_DENSITIES: ReadonlySet<string> = new Set(["comfortable", "standard", "compact"]);
const VALID_OVERRIDE_GROUPS: ReadonlySet<string> = new Set([
  "color",
  "typography",
  "spacing",
  "elevation",
]);
const COLOR_SUBGROUPS: ReadonlySet<string> = new Set([
  "background",
  "text",
  "border",
  "interactive",
  "status",
  "focus",
  "destructive",
]);
const THEME_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$/;
const RGBA_PATTERN = /^rgba?\(/;
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const RESOLVED_THEME_REQUIRED_KEYS = new Set([
  "color",
  "typography",
  "spacing",
  "control",
  "elevation",
  "interaction",
]);

// ─── Helpers ─────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidColorValue(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value) || RGBA_PATTERN.test(value) || value === "transparent";
}

function isValidTokenValue(value: unknown): boolean {
  return typeof value === "string" || typeof value === "number";
}

// ─── Definition Validation ───────────────────────────────────────────

/** Validate a ThemeDefinition comprehensively. */
export function validateThemeDefinition(definition: ThemeDefinition): ValidationReport {
  const diagnostics: ValidationDiagnostic[] = [];
  const name = definition.name || "(unnamed)";

  // Name
  if (!definition.name || definition.name.trim() === "") {
    diagnostics.push({
      themeName: name,
      path: "name",
      category: "missing_required",
      message: "Theme name is required.",
      expected: "non-empty string",
      suggestion: 'Provide a kebab-case identifier, e.g. "acme-brand".',
    });
  } else if (!THEME_NAME_PATTERN.test(definition.name)) {
    diagnostics.push({
      themeName: name,
      path: "name",
      category: "invalid_format",
      message: "Theme name should be lowercase kebab-case.",
      received: definition.name,
      expected: "lowercase letters, numbers, and hyphens starting with a letter",
      suggestion: `Use "${definition.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}".`,
    });
  }

  // Base
  if (!VALID_BASES.has(definition.base)) {
    diagnostics.push({
      themeName: name,
      path: "base",
      category: "invalid_value",
      message: `Invalid base theme "${definition.base}".`,
      received: definition.base,
      expected: '"light" or "dark"',
    });
  }

  // Density
  if (!VALID_DENSITIES.has(definition.defaultDensity)) {
    diagnostics.push({
      themeName: name,
      path: "defaultDensity",
      category: "invalid_value",
      message: `Invalid density "${definition.defaultDensity}".`,
      received: definition.defaultDensity,
      expected: '"comfortable", "standard", or "compact"',
    });
  }

  // Metadata
  validateMetadata(definition.metadata, name, diagnostics);

  // Overrides
  validateOverrides(definition.overrides, name, diagnostics);

  return buildReport(diagnostics);
}

// ─── Override Validation ─────────────────────────────────────────────

/** Validate a ThemeOverrides object. */
export function validateOverrides(
  overrides: ThemeOverrides,
  themeName = "(unknown)",
  diagnostics: ValidationDiagnostic[] = [],
): ValidationReport {
  const overridesObj = overrides as unknown as Record<string, unknown>;

  for (const key of Object.keys(overridesObj)) {
    if (DANGEROUS_KEYS.has(key)) {
      diagnostics.push({
        themeName,
        path: `overrides.${key}`,
        category: "invalid_value",
        message: `Dangerous key "${key}" rejected.`,
        suggestion: "Remove this key.",
      });
      continue;
    }

    if (!VALID_OVERRIDE_GROUPS.has(key)) {
      diagnostics.push({
        themeName,
        path: `overrides.${key}`,
        category: "unknown_key",
        message: `Unknown override group "${key}".`,
        received: key,
        expected: [...VALID_OVERRIDE_GROUPS].join(", "),
      });
      continue;
    }

    const group = overridesObj[key];
    if (!isPlainObject(group)) {
      diagnostics.push({
        themeName,
        path: `overrides.${key}`,
        category: "invalid_type",
        message: `Override group "${key}" must be an object.`,
        received: typeof group,
        expected: "object",
      });
      continue;
    }

    if (key === "color") {
      validateColorOverrides(group, themeName, diagnostics);
    } else {
      validateNestedOverride(group, `overrides.${key}`, themeName, diagnostics);
    }
  }

  return buildReport(diagnostics);
}

function validateColorOverrides(
  color: Record<string, unknown>,
  themeName: string,
  diagnostics: ValidationDiagnostic[],
): void {
  for (const subKey of Object.keys(color)) {
    if (DANGEROUS_KEYS.has(subKey)) {
      diagnostics.push({
        themeName,
        path: `overrides.color.${subKey}`,
        category: "invalid_value",
        message: `Dangerous key "${subKey}" rejected.`,
      });
      continue;
    }
    if (!COLOR_SUBGROUPS.has(subKey)) {
      diagnostics.push({
        themeName,
        path: `overrides.color.${subKey}`,
        category: "unknown_key",
        message: `Unknown color subcategory "${subKey}".`,
        received: subKey,
        expected: [...COLOR_SUBGROUPS].join(", "),
      });
      continue;
    }
    const subGroup = color[subKey];
    if (isPlainObject(subGroup)) {
      validateColorValues(subGroup, `overrides.color.${subKey}`, themeName, diagnostics);
    }
  }
}

function validateColorValues(
  obj: Record<string, unknown>,
  path: string,
  themeName: string,
  diagnostics: ValidationDiagnostic[],
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = `${path}.${key}`;
    if (isPlainObject(value)) {
      validateColorValues(value, fullPath, themeName, diagnostics);
    } else if (typeof value === "string") {
      if (!isValidColorValue(value) && !value.startsWith("var(")) {
        diagnostics.push({
          themeName,
          path: fullPath,
          category: "invalid_format",
          message: `Value "${value}" doesn't look like a valid color.`,
          received: value,
          expected: "hex (#rrggbb), rgba(), or transparent",
          suggestion: "Ensure the value is a valid CSS color.",
        });
      }
    } else if (value !== undefined) {
      diagnostics.push({
        themeName,
        path: fullPath,
        category: "invalid_type",
        message: `Color value must be a string.`,
        received: typeof value,
        expected: "string",
      });
    }
  }
}

function validateNestedOverride(
  obj: Record<string, unknown>,
  path: string,
  themeName: string,
  diagnostics: ValidationDiagnostic[],
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (DANGEROUS_KEYS.has(key)) {
      diagnostics.push({
        themeName,
        path: `${path}.${key}`,
        category: "invalid_value",
        message: `Dangerous key "${key}" rejected.`,
      });
      continue;
    }
    const fullPath = `${path}.${key}`;
    if (isPlainObject(value)) {
      validateNestedOverride(value, fullPath, themeName, diagnostics);
    } else if (!isValidTokenValue(value)) {
      diagnostics.push({
        themeName,
        path: fullPath,
        category: "invalid_type",
        message: "Override value must be a string or number.",
        received: typeof value,
        expected: "string or number",
      });
    }
  }
}

// ─── Metadata Validation ─────────────────────────────────────────────

function validateMetadata(
  metadata: Readonly<Record<string, string>>,
  themeName: string,
  diagnostics: ValidationDiagnostic[],
): void {
  for (const [key, value] of Object.entries(metadata)) {
    if (DANGEROUS_KEYS.has(key)) {
      diagnostics.push({
        themeName,
        path: `metadata.${key}`,
        category: "invalid_value",
        message: `Dangerous key "${key}" rejected.`,
      });
      continue;
    }
    if (typeof value !== "string") {
      diagnostics.push({
        themeName,
        path: `metadata.${key}`,
        category: "invalid_type",
        message: `Metadata value must be a string.`,
        received: typeof value,
        expected: "string",
      });
    }
  }
}

// ─── Resolved Theme Validation ───────────────────────────────────────

/** Validate a resolved theme token object for completeness. */
export function validateResolvedTheme(
  tokens: Readonly<Record<string, unknown>>,
  themeName = "(resolved)",
): ValidationReport {
  const diagnostics: ValidationDiagnostic[] = [];

  // Check top-level required keys
  for (const required of RESOLVED_THEME_REQUIRED_KEYS) {
    if (!(required in tokens)) {
      diagnostics.push({
        themeName,
        path: required,
        category: "missing_required",
        message: `Required token group "${required}" is missing.`,
        expected: "object with token values",
      });
    }
  }

  // Check for unknown top-level keys
  for (const key of Object.keys(tokens)) {
    if (!RESOLVED_THEME_REQUIRED_KEYS.has(key)) {
      diagnostics.push({
        themeName,
        path: key,
        category: "unknown_key",
        message: `Unexpected top-level key "${key}" in resolved theme.`,
        received: key,
      });
    }
  }

  // Validate leaf values are not null/undefined
  validateLeafValues(tokens, "", themeName, diagnostics);

  return buildReport(diagnostics);
}

function validateLeafValues(
  obj: Readonly<Record<string, unknown>>,
  path: string,
  themeName: string,
  diagnostics: ValidationDiagnostic[],
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (value === null || value === undefined) {
      diagnostics.push({
        themeName,
        path: fullPath,
        category: "invalid_value",
        message: "Token value is null or undefined.",
        expected: "string or number",
      });
    } else if (isPlainObject(value)) {
      validateLeafValues(value, fullPath, themeName, diagnostics);
    }
  }
}

// ─── Name Validation ─────────────────────────────────────────────────

/** Validate a theme name string. */
export function validateThemeName(name: string, themeName = "(input)"): ValidationReport {
  const diagnostics: ValidationDiagnostic[] = [];

  if (!name || name.trim() === "") {
    diagnostics.push({
      themeName,
      path: "name",
      category: "missing_required",
      message: "Theme name is required.",
      expected: "non-empty string",
    });
  } else if (!THEME_NAME_PATTERN.test(name)) {
    diagnostics.push({
      themeName,
      path: "name",
      category: "invalid_format",
      message: "Theme name should be lowercase kebab-case.",
      received: name,
      expected: "lowercase letters, numbers, and hyphens starting with a letter",
      suggestion: `Use "${name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+/, "")}".`,
    });
  }

  return buildReport(diagnostics);
}

/** Validate a base mode value. */
export function validateBaseMode(base: string, themeName = "(input)"): ValidationReport {
  const diagnostics: ValidationDiagnostic[] = [];

  if (!VALID_BASES.has(base)) {
    diagnostics.push({
      themeName,
      path: "base",
      category: "invalid_value",
      message: `Invalid base mode "${base}".`,
      received: base,
      expected: '"light" or "dark"',
    });
  }

  return buildReport(diagnostics);
}

/** Validate a density value. */
export function validateDensityValue(density: string, themeName = "(input)"): ValidationReport {
  const diagnostics: ValidationDiagnostic[] = [];

  if (!VALID_DENSITIES.has(density)) {
    diagnostics.push({
      themeName,
      path: "density",
      category: "invalid_value",
      message: `Invalid density "${density}".`,
      received: density,
      expected: '"comfortable", "standard", or "compact"',
    });
  }

  return buildReport(diagnostics);
}

// ─── Utility ─────────────────────────────────────────────────────────

function buildReport(diagnostics: ValidationDiagnostic[]): ValidationReport {
  const errorCount = diagnostics.filter(
    (d) => d.category !== "deprecated" && d.category !== "invalid_format",
  ).length;
  const warningCount = diagnostics.length - errorCount;

  return {
    valid: errorCount === 0,
    diagnostics,
    errorCount,
    warningCount,
  };
}

/** Re-export useful constants for consumer tooling. */
export const THEME_CONSTANTS = {
  validBases: ["light", "dark"] as readonly ResolvedThemeMode[],
  validDensities: ["comfortable", "standard", "compact"] as readonly DensityMode[],
  validOverrideGroups: ["color", "typography", "spacing", "elevation"] as readonly string[],
  validColorSubgroups: [...COLOR_SUBGROUPS] as readonly string[],
  namePattern: THEME_NAME_PATTERN,
} as const;
