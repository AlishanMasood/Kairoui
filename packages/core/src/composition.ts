// @kairoui/core/composition — Component composition infrastructure
//
// This entry point exports composition primitives used by all KairoUI components:
// - Prop merging contracts and types
// - Component factory (future)
// - Slot resolution (future)
// - Polymorphic rendering (future)

// Public types — contracts for prop composition
export type {
  MergeStrategy,
  PropSource,
  PropCategory,
  CategoryStrategyMap,
  MergePlanEntry,
  MergePlan,
  PropSourceRecord,
  MergeDiagnostic,
  ProtectedPropDefinition,
} from "./composition/merge-types";

export { PROP_SOURCE_PRIORITY, DEFAULT_CATEGORY_STRATEGIES } from "./composition/merge-types";
