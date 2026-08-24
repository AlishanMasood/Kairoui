import type ts from "typescript";

/**
 * Converts a TypeScript type node to a human-readable string.
 * Stub — full implementation in KUI-DOCGEN-004.
 */
export function typeToString(checker: ts.TypeChecker, type: ts.Type): string {
  return checker.typeToString(type);
}
