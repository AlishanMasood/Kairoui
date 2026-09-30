// @kairoui-pro/workflow — public API surface.
//
// Backend-agnostic Stepper / Workflow UI. See
// docs/architecture/PHASE14-ENTERPRISE-ARCHITECTURE.md for the
// package boundary.

export type {
  WorkflowAccessibilityProps,
  WorkflowConnectorProps,
  WorkflowListProps,
  WorkflowMessages,
  WorkflowNavigatePayload,
  WorkflowNavigationMode,
  WorkflowNavProps,
  WorkflowOrientation,
  WorkflowProgressProps,
  WorkflowRootProps,
  WorkflowState,
  WorkflowStep,
  WorkflowStepChangePayload,
  WorkflowStepDescriptionProps,
  WorkflowStepIconProps,
  WorkflowStepId,
  WorkflowStepLabelProps,
  WorkflowStepProps,
  WorkflowStepRenderer,
  WorkflowStepState,
} from "./workflow-types";

export { assertValidWorkflowStep, assertValidWorkflowSteps } from "./identity";

export {
  computeWorkflowProgress,
  countStepsByState,
  findAdjacentStep,
  firstEnabledStep,
  lastEnabledStep,
  resolveStepStates,
} from "./step-state";
export type { ResolvedWorkflowStep } from "./step-state";

export { DEFAULT_WORKFLOW_KEYMAP, resolveWorkflowAction } from "./keymap";
export type { WorkflowAction, WorkflowKeyBinding, WorkflowKeymap } from "./keymap";

export {
  Workflow,
  WorkflowConnector,
  WorkflowList,
  WorkflowNav,
  WorkflowProgress,
  WorkflowRoot,
  WorkflowStep as WorkflowStepComponent,
  WorkflowStepDescription,
  WorkflowStepIcon,
  WorkflowStepLabel,
} from "./workflow";

export { WorkflowContext, useWorkflow } from "./workflow-context";
export type { WorkflowContextValue } from "./workflow-context";
