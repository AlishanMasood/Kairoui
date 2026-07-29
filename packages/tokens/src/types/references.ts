/**
 * Token reference types.
 *
 * These distinguish between literal values, primitive references,
 * semantic references, and component references at the type level.
 */

import type { TokenValue } from "./values";

/**
 * A literal token value — a raw CSS value, not a reference to another token.
 */
export interface LiteralRef<V extends TokenValue = TokenValue> {
  readonly kind: "literal";
  readonly value: V;
}

/**
 * A reference to a primitive token by path.
 */
export interface PrimitiveRef {
  readonly kind: "primitive";
  readonly path: string;
}

/**
 * A reference to a semantic token by path.
 */
export interface SemanticRef {
  readonly kind: "semantic";
  readonly path: string;
}

/**
 * A reference to a component token by path.
 */
export interface ComponentRef {
  readonly kind: "component";
  readonly path: string;
}

/**
 * Union of all token reference types.
 * Used in theme definitions and component token mappings.
 */
export type TokenRef = LiteralRef | PrimitiveRef | SemanticRef | ComponentRef;

/**
 * A resolved token entry — the final value after all references are resolved.
 */
export interface ResolvedToken<V extends TokenValue = TokenValue> {
  readonly path: string;
  readonly cssVar: string;
  readonly value: V;
}

// ─── Factory helpers ─────────────────────────────────────────────────

/** Create a literal value reference */
export function literal<V extends TokenValue>(value: V): LiteralRef<V> {
  return { kind: "literal", value };
}

/** Create a primitive token reference */
export function primitiveRef(path: string): PrimitiveRef {
  return { kind: "primitive", path };
}

/** Create a semantic token reference */
export function semanticRef(path: string): SemanticRef {
  return { kind: "semantic", path };
}

/** Create a component token reference */
export function componentRef(path: string): ComponentRef {
  return { kind: "component", path };
}
