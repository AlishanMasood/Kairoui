import type ts from "typescript";

/**
 * Converts a TypeScript type node to a human-readable string.
 * Stub — full implementation in KUI-DOCGEN-004.
 */
export function typeToString(_checker: ts.TypeChecker, type: ts.Type): string {
  return _checker.typeToString(type);
}
