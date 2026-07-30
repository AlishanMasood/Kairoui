import type {
  CreateThemeInput,
  DensityMode,
  ResolvedThemeMode,
  ThemeDefinition,
  ThemeOverrides,
  ThemeValidationError,
  ThemeValidationResult,
} from "./types";

const VALID_BASES: readonly ResolvedThemeMode[] = ["light", "dark"];
const VALID_DENSITIES: readonly DensityMode[] = ["comfortable", "standard", "compact"];
const VALID_OVERRIDE_GROUPS = new Set(["color", "typography", "spacing", "elevation"]);

function validateInput(input: CreateThemeInput): ThemeValidationResult {
  const errors: ThemeValidationError[] = [];

  if (typeof input.name !== "string" || input.name.trim() === "") {
    errors.push({
      path: "name",
      message: "Theme name is required and must be a non-empty string.",
    });
  }

  if (!VALID_BASES.includes(input.base)) {
    errors.push({
      path: "base",
      message: `Invalid base theme "${input.base}". Must be "light" or "dark".`,
    });
  }

  if (input.defaultDensity !== undefined && !VALID_DENSITIES.includes(input.defaultDensity)) {
    errors.push({
      path: "defaultDensity",
      message: `Invalid density "${input.defaultDensity}". Must be "comfortable", "standard", or "compact".`,
    });
  }

  if (input.metadata !== undefined) {
    for (const [key, value] of Object.entries(input.metadata)) {
      if (typeof value !== "string") {
        errors.push({
          path: `metadata.${key}`,
          message: `Metadata value for "${key}" must be a string.`,
        });
      }
    }
  }

  if (input.overrides !== undefined) {
    for (const key of Object.keys(input.overrides)) {
      if (!VALID_OVERRIDE_GROUPS.has(key)) {
        errors.push({
          path: `overrides.${key}`,
          message: `Unknown override group "${key}". Valid groups: ${[...VALID_OVERRIDE_GROUPS].join(", ")}.`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function deepFreeze<T extends object>(obj: T): Readonly<T> {
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  }
  return Object.freeze(obj);
}

/**
 * Create a validated, immutable theme definition.
 *
 * The returned definition is unresolved — it stores the configuration
 * needed to produce a resolved theme at runtime, but does not compute
 * final token values.
 *
 * @throws Error with validation details if the input is invalid.
 */
export function createTheme(input: CreateThemeInput): ThemeDefinition {
  const result = validateInput(input);
  if (!result.valid) {
    const details = result.errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
    throw new Error(`Invalid theme configuration:\n${details}`);
  }

  const overrides: ThemeOverrides = input.overrides ? structuredClone(input.overrides) : {};

  const metadata: Record<string, string> = input.metadata ? structuredClone(input.metadata) : {};

  const definition: ThemeDefinition = {
    name: input.name.trim(),
    base: input.base,
    description: input.description ?? "",
    defaultDensity: input.defaultDensity ?? "comfortable",
    overrides,
    metadata,
  };

  return deepFreeze(definition);
}

/** Validate a theme input without creating the definition. */
export function validateTheme(input: CreateThemeInput): ThemeValidationResult {
  return validateInput(input);
}
