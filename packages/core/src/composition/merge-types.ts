/**
 * Prop-composition contracts for KairoUI.
 *
 * Defines the type-level architecture for how component props from multiple
 * sources are merged. These contracts are consumed by the future mergeProps
 * implementation and component factory.
 */

// ─── Merge Strategies ──────────────────────────────────────────────

/** How a prop is resolved when multiple sources provide it. */
export type MergeStrategy = "override" | "merge" | "compose" | "reconcile" | "protect";

/** Strategy definitions:
 * - override:   Highest-priority source wins completely.
 * - merge:      Values from all sources are combined (className, style, data-*).
 * - compose:    Multiple handlers are called in sequence (events, refs).
 * - reconcile:  Token lists are deduplicated and combined (aria-labelledby, etc.).
 * - protect:    Internal value cannot be overridden; dev warning on conflict.
 */

// ─── Prop Sources ──────────────────────────────────────────────────

/** Identifies where a prop value originated. */
export type PropSource =
  | "componentDefault"
  | "themeDefault"
  | "internal"
  | "accessibility"
  | "state"
  | "consumerRoot"
  | "consumerSlot"
  | "polymorphicTarget"
  | "child";

/** Ordered from lowest to highest priority for override strategy. */
export const PROP_SOURCE_PRIORITY: readonly PropSource[] = [
  "componentDefault",
  "themeDefault",
  "internal",
  "accessibility",
  "state",
  "consumerRoot",
  "consumerSlot",
  "polymorphicTarget",
  "child",
] as const;

// ─── Prop Categories ───────────────────────────────────────────────

/** Categorizes a prop to determine its merge strategy. */
export type PropCategory =
  | "scalar"
  | "className"
  | "style"
  | "eventHandler"
  | "ref"
  | "ariaRelationship"
  | "ariaScalar"
  | "dataAttribute"
  | "disabledState"
  | "id"
  | "role"
  | "tabIndex"
  | "children";

/** Maps each prop category to its default merge strategy. */
export type CategoryStrategyMap = {
  readonly [K in PropCategory]: MergeStrategy;
};

/** Default strategy for each category per KUI-COMP-003 precedence rules. */
export const DEFAULT_CATEGORY_STRATEGIES: CategoryStrategyMap = {
  scalar: "override",
  className: "merge",
  style: "merge",
  eventHandler: "compose",
  ref: "compose",
  ariaRelationship: "reconcile",
  ariaScalar: "override",
  dataAttribute: "merge",
  disabledState: "override",
  id: "override",
  role: "protect",
  tabIndex: "override",
  children: "override",
} as const;

// ─── Merge Plan ────────────────────────────────────────────────────

/** A merge plan entry describes how a single prop should be resolved. */
export interface MergePlanEntry {
  /** The prop key. */
  readonly prop: string;
  /** The category this prop belongs to. */
  readonly category: PropCategory;
  /** The strategy to use for this prop (overrides category default if set). */
  readonly strategy?: MergeStrategy;
  /** Whether this prop is protected from consumer override. */
  readonly protected?: boolean;
  /** Development warning key if consumer conflicts with this prop. */
  readonly warningKey?: string;
}

/** A complete merge plan for a component's props. */
export interface MergePlan {
  /** Ordered entries describing each prop's merge behavior. */
  readonly entries: readonly MergePlanEntry[];
  /** Props that are protected and produce dev warnings on override. */
  readonly protectedProps: ReadonlySet<string>;
}

// ─── Prop Source Record ────────────────────────────────────────────

/** A typed record of props from a specific source. */
export interface PropSourceRecord {
  readonly source: PropSource;
  readonly props: Readonly<Record<string, unknown>>;
}

// ─── Merge Diagnostics ─────────────────────────────────────────────

/** Diagnostic emitted during prop merging in development. */
export interface MergeDiagnostic {
  readonly type: "warning" | "error";
  readonly prop: string;
  readonly message: string;
  readonly source: PropSource;
  readonly component: string;
}

// ─── Protected Prop Definition ─────────────────────────────────────

/** Defines a prop that internal behavior protects from consumer override. */
export interface ProtectedPropDefinition {
  readonly prop: string;
  readonly reason: string;
  readonly warningMessage: string;
}
