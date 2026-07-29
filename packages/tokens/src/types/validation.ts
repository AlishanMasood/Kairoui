/**
 * Token validation result contracts.
 *
 * Used by the token validation pipeline to report
 * issues with token definitions, references, and generated output.
 */

import type { ThemeName, DensityName } from "./theme";

// ─── Validation Severity ─────────────────────────────────────────────

/** Severity level for validation issues */
export type ValidationSeverity = "error" | "warning";

// ─── Validation Error Types ──────────────────────────────────────────

/** Specific error codes for token validation failures */
export type ValidationErrorCode =
  | "MISSING_REQUIRED_TOKEN"
  | "INVALID_CATEGORY"
  | "INVALID_TOKEN_VALUE"
  | "INVALID_REFERENCE"
  | "CIRCULAR_REFERENCE"
  | "UNRESOLVED_REFERENCE"
  | "INVALID_THEME_NAME"
  | "INVALID_DENSITY_NAME"
  | "CONTRAST_FAILURE"
  | "DEPRECATED_TOKEN_USAGE"
  | "DUPLICATE_CSS_VARIABLE"
  | "NAMING_VIOLATION";

/** A single validation error */
export interface ValidationError {
  readonly code: ValidationErrorCode;
  readonly severity: ValidationSeverity;
  readonly path: string;
  readonly message: string;
  readonly expected?: string;
  readonly received?: string;
}

// ─── Validation Result ───────────────────────────────────────────────

/** Result of validating a token collection or theme */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
  readonly tokenCount: number;
  readonly resolvedCount: number;
}

// ─── Token Manifest ──────────────────────────────────────────────────

/** Generated token manifest — a complete inventory of all tokens in the system */
export interface TokenManifest {
  readonly version: string;
  readonly generatedAt: string;
  readonly primitiveCount: number;
  readonly semanticCount: number;
  readonly componentCount: number;
  readonly themes: readonly ThemeName[];
  readonly densities: readonly DensityName[];
  readonly tokens: readonly ManifestEntry[];
}

/** A single entry in the token manifest */
export interface ManifestEntry {
  readonly path: string;
  readonly cssVar: string;
  readonly layer: "primitive" | "semantic" | "component";
  readonly category: string;
  readonly deprecated?: boolean;
  readonly deprecatedMessage?: string;
}
