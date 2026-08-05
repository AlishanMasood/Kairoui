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

// Class-name composition
export { mergeClassNames, mergeClassNameSources } from "./composition/merge-class-names";
export type { ClassNameSources } from "./composition/merge-class-names";

// Style-object composition
export { mergeStyles } from "./composition/merge-styles";
export type { StyleObject, StyleSource } from "./composition/merge-styles";

// Event-handler composition
export { mergeEventHandlers, composeHandlers } from "./composition/merge-event-handlers";
export type {
  EventHandlerSource,
  EventHandlerSources,
  MergeEventHandlersOptions,
} from "./composition/merge-event-handlers";
