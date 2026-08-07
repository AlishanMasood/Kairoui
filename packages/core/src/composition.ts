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

// ARIA composition
export {
  mergeAriaRelationship,
  mergeAriaRelationships,
  reconcileAriaBoolean,
  reconcileAriaBooleans,
  reconcileAriaScalar,
} from "./composition/merge-aria";
export type {
  AriaRelationshipAttribute,
  AriaRelationshipSources,
  AriaRelationshipMap,
  AriaBooleanSources,
  AriaBooleanMap,
  AriaScalarSources,
} from "./composition/merge-aria";

// Data-attribute composition
export { mergeDataAttributes } from "./composition/merge-data-attributes";
export type { DataAttrValue, DataAttributeSources } from "./composition/merge-data-attributes";

// Interaction-state reconciliation
export { reconcileInteractionState } from "./composition/reconcile-interaction";
export type {
  ReconcileInteractionInput,
  ReconcileInteractionResult,
} from "./composition/reconcile-interaction";

// Ref composition
export { composeComponentRefs } from "./composition/compose-refs";
export type { RefSources, AssignableRef } from "./composition/compose-refs";

// Generic prop merging
export { mergeProps, mergePropsAll } from "./composition/merge-props";

// Polymorphic type system
export type {
  AsElementType,
  PropsOf,
  PolymorphicOwnProps,
  PolymorphicProps,
  PolymorphicRef,
  PolymorphicComponent,
  IntrinsicElementType,
  HTMLElementType,
  NativePolymorphicProps,
} from "./composition/polymorphic-types";

// Polymorphic rendering
export { createPolymorphicComponent, renderPolymorphic } from "./composition/polymorphic-render";
export type { CreatePolymorphicOptions } from "./composition/polymorphic-render";

// asChild rendering
export { renderAsChild } from "./composition/as-child";
