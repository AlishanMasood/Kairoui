/**
 * Token Schema Validation
 *
 * Build-time and test-time validation for token definitions.
 * Detects structural, referential, and naming errors with actionable messages.
 */

import type { ValidationError, ValidationErrorCode, ValidationSeverity } from "../types/validation";
import { tokenPathToCssVar } from "../naming";

// ─── Result Type ─────────────────────────────────────────────────────

export interface SchemaValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly errorCount: number;
  readonly warningCount: number;
}

// ─── Error Builder ───────────────────────────────────────────────────

function err(
  code: ValidationErrorCode,
  severity: ValidationSeverity,
  path: string,
  message: string,
  expected?: string,
  received?: string,
): ValidationError {
  const base: {
    code: ValidationErrorCode;
    severity: ValidationSeverity;
    path: string;
    message: string;
    expected?: string;
    received?: string;
  } = { code, severity, path, message };
  if (expected !== undefined) base.expected = expected;
  if (received !== undefined) base.received = received;
  return base;
}

// ─── Core Validators ─────────────────────────────────────────────────

const VALID_STATES = new Set([
  "default",
  "hover",
  "active",
  "focus",
  "focused",
  "selected",
  "disabled",
  "readOnly",
  "loading",
  "dragging",
  "invalid",
  "valid",
  "filled",
]);

const VALID_SIZES = new Set(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"]);

const VALID_THEME_NAMES = new Set(["light", "dark"]);
const VALID_DENSITY_NAMES = new Set(["comfortable", "standard", "compact"]);

function isValidLeafValue(value: unknown): boolean {
  if (typeof value === "string") return value.length > 0;
  if (typeof value === "number") return true;
  return false;
}

// ─── Public Validation Functions ─────────────────────────────────────

/**
 * Validate a token object against a reference schema (shape matching).
 * Detects missing keys, unknown keys, and invalid leaf values.
 */
export function validateTokenSchema(
  tokens: Record<string, unknown>,
  referenceSchema: Record<string, unknown>,
  label = "tokens",
): SchemaValidationResult {
  const errors: ValidationError[] = [];
  validateShape(tokens, referenceSchema, "", label, errors);
  return buildResult(errors);
}

/**
 * Validate that a theme object has no missing or unknown keys
 * relative to a reference theme.
 */
export function validateThemeStructure(
  theme: Record<string, unknown>,
  reference: Record<string, unknown>,
  themeName: string,
): SchemaValidationResult {
  if (!VALID_THEME_NAMES.has(themeName) && themeName !== "custom") {
    return buildResult([
      err(
        "INVALID_THEME_NAME",
        "error",
        themeName,
        `Invalid theme name "${themeName}". Use: light, dark, or custom.`,
        "light | dark",
        themeName,
      ),
    ]);
  }
  const errors: ValidationError[] = [];
  validateShape(theme, reference, "", `theme(${themeName})`, errors);
  return buildResult(errors);
}

/**
 * Validate density structure against a reference.
 */
export function validateDensityStructure(
  density: Record<string, unknown>,
  reference: Record<string, unknown>,
  densityName: string,
): SchemaValidationResult {
  if (!VALID_DENSITY_NAMES.has(densityName)) {
    return buildResult([
      err(
        "INVALID_DENSITY_NAME",
        "error",
        densityName,
        `Invalid density name "${densityName}". Use: comfortable, standard, or compact.`,
        "comfortable | standard | compact",
        densityName,
      ),
    ]);
  }
  const errors: ValidationError[] = [];
  validateShape(density, reference, "", `density(${densityName})`, errors);
  return buildResult(errors);
}

/**
 * Detect duplicate CSS variable names in a token set.
 */
export function validateNoDuplicateCssVars(
  tokens: Record<string, unknown>,
): SchemaValidationResult {
  const errors: ValidationError[] = [];
  const seen = new Map<string, string>();
  collectCssVars(tokens, "", seen, errors);
  return buildResult(errors);
}

/**
 * Validate that no private/internal tokens leak into a public export set.
 * Private tokens are those whose path segments start with "_".
 */
export function validateNoPrivateLeakage(tokens: Record<string, unknown>): SchemaValidationResult {
  const errors: ValidationError[] = [];
  checkPrivateLeakage(tokens, "", errors);
  return buildResult(errors);
}

/**
 * Validate an override object against a base — unknown keys produce errors.
 */
export function validateOverrideKeys(
  override: Record<string, unknown>,
  base: Record<string, unknown>,
  label = "override",
): SchemaValidationResult {
  const errors: ValidationError[] = [];
  checkUnknownKeys(override, base, "", label, errors);
  return buildResult(errors);
}

/**
 * Validate state names in a component token object.
 */
export function validateStateNames(
  states: Record<string, unknown>,
  path = "states",
): SchemaValidationResult {
  const errors: ValidationError[] = [];
  for (const key of Object.keys(states)) {
    if (!VALID_STATES.has(key)) {
      errors.push(
        err(
          "INVALID_CATEGORY",
          "error",
          `${path}.${key}`,
          `Unknown state "${key}". Approved states: ${[...VALID_STATES].join(", ")}.`,
          "approved state name",
          key,
        ),
      );
    }
  }
  return buildResult(errors);
}

/**
 * Validate size names in a component token object.
 */
export function validateSizeNames(
  sizes: Record<string, unknown>,
  path = "sizes",
): SchemaValidationResult {
  const errors: ValidationError[] = [];
  for (const key of Object.keys(sizes)) {
    if (!VALID_SIZES.has(key)) {
      errors.push(
        err(
          "INVALID_CATEGORY",
          "error",
          `${path}.${key}`,
          `Unknown size "${key}". Approved sizes: ${[...VALID_SIZES].join(", ")}.`,
          "approved size name",
          key,
        ),
      );
    }
  }
  return buildResult(errors);
}

/**
 * Validate leaf values are non-empty and the correct type.
 */
export function validateLeafValues(
  tokens: Record<string, unknown>,
  label = "tokens",
): SchemaValidationResult {
  const errors: ValidationError[] = [];
  checkLeafValues(tokens, "", label, errors);
  return buildResult(errors);
}

// ─── Internal Helpers ────────────────────────────────────────────────

function validateShape(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
  prefix: string,
  label: string,
  errors: ValidationError[],
): void {
  // Check for missing keys
  for (const key of Object.keys(expected)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!(key in actual)) {
      errors.push(
        err(
          "MISSING_REQUIRED_TOKEN",
          "error",
          path,
          `Missing required token "${path}" in ${label}. Add this token to satisfy the contract.`,
        ),
      );
    } else {
      const expectedVal = expected[key];
      const actualVal = actual[key];
      if (expectedVal !== null && typeof expectedVal === "object" && !Array.isArray(expectedVal)) {
        if (actualVal !== null && typeof actualVal === "object" && !Array.isArray(actualVal)) {
          validateShape(
            actualVal as Record<string, unknown>,
            expectedVal as Record<string, unknown>,
            path,
            label,
            errors,
          );
        } else {
          errors.push(
            err(
              "INVALID_TOKEN_VALUE",
              "error",
              path,
              `Expected object at "${path}" in ${label}, got ${typeof actualVal}.`,
              "object",
              typeof actualVal,
            ),
          );
        }
      } else if (!isValidLeafValue(actualVal)) {
        errors.push(
          err(
            "INVALID_TOKEN_VALUE",
            "error",
            path,
            `Invalid value at "${path}" in ${label}. Expected string or number.`,
            "string | number",
            String(actualVal),
          ),
        );
      }
    }
  }

  // Check for unknown keys
  for (const key of Object.keys(actual)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!(key in expected)) {
      errors.push(
        err(
          "INVALID_CATEGORY",
          "warning",
          path,
          `Unknown key "${key}" at "${path}" in ${label}. Remove or check for typos.`,
        ),
      );
    }
  }
}

function collectCssVars(
  obj: Record<string, unknown>,
  prefix: string,
  seen: Map<string, string>,
  errors: ValidationError[],
): void {
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      collectCssVars(value as Record<string, unknown>, path, seen, errors);
    } else {
      const cssVar = tokenPathToCssVar(path);
      const existing = seen.get(cssVar);
      if (existing !== undefined) {
        errors.push(
          err(
            "DUPLICATE_CSS_VARIABLE",
            "error",
            path,
            `Duplicate CSS variable "${cssVar}" — first defined at "${existing}". Rename one of the tokens.`,
            existing,
            path,
          ),
        );
      } else {
        seen.set(cssVar, path);
      }
    }
  }
}

function checkPrivateLeakage(
  obj: Record<string, unknown>,
  prefix: string,
  errors: ValidationError[],
): void {
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (key.startsWith("_")) {
      errors.push(
        err(
          "NAMING_VIOLATION",
          "error",
          path,
          `Private token "${path}" leaked into public exports. Remove underscore-prefixed keys from public API.`,
        ),
      );
    }
    const value = obj[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      checkPrivateLeakage(value as Record<string, unknown>, path, errors);
    }
  }
}

function checkUnknownKeys(
  override: Record<string, unknown>,
  base: Record<string, unknown>,
  prefix: string,
  label: string,
  errors: ValidationError[],
): void {
  for (const key of Object.keys(override)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!(key in base)) {
      errors.push(
        err(
          "INVALID_CATEGORY",
          "error",
          path,
          `Unknown key "${key}" in ${label} at "${path}". This key does not exist in the base schema.`,
        ),
      );
    } else {
      const overrideVal = override[key];
      const baseVal = base[key];
      if (
        overrideVal !== null &&
        typeof overrideVal === "object" &&
        !Array.isArray(overrideVal) &&
        baseVal !== null &&
        typeof baseVal === "object" &&
        !Array.isArray(baseVal)
      ) {
        checkUnknownKeys(
          overrideVal as Record<string, unknown>,
          baseVal as Record<string, unknown>,
          path,
          label,
          errors,
        );
      }
    }
  }
}

function checkLeafValues(
  obj: Record<string, unknown>,
  prefix: string,
  label: string,
  errors: ValidationError[],
): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      checkLeafValues(value as Record<string, unknown>, path, label, errors);
    } else if (value === undefined || value === null) {
      errors.push(
        err(
          "INVALID_TOKEN_VALUE",
          "error",
          path,
          `Null or undefined value at "${path}" in ${label}.`,
          "string | number",
          String(value),
        ),
      );
    } else if (typeof value === "string" && value.length === 0) {
      errors.push(
        err(
          "INVALID_TOKEN_VALUE",
          "error",
          path,
          `Empty string at "${path}" in ${label}. Provide a valid CSS value.`,
          "non-empty string",
          '""',
        ),
      );
    }
  }
}

function buildResult(errors: ValidationError[]): SchemaValidationResult {
  const errorList = errors.filter((e) => e.severity === "error");
  const warningList = errors.filter((e) => e.severity === "warning");
  return {
    valid: errorList.length === 0,
    errors,
    errorCount: errorList.length,
    warningCount: warningList.length,
  };
}
