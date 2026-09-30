import { createContext, useContext } from "react";
import type {
  WorkflowNavigatePayload,
  WorkflowNavigationMode,
  WorkflowOrientation,
  WorkflowState,
  WorkflowStep,
  WorkflowStepChangePayload,
  WorkflowStepId,
  WorkflowStepRenderer,
  WorkflowStepState,
} from "./workflow-types";
import type { WorkflowKeymap } from "./keymap";
import type { ResolvedWorkflowStep } from "./step-state";

export interface WorkflowContextValue {
  readonly state: WorkflowState;
  readonly steps: readonly WorkflowStep[];
  readonly resolved: readonly ResolvedWorkflowStep[];
  readonly progress: { readonly completed: number; readonly total: number };

  // ── Config
  readonly orientation: WorkflowOrientation;
  readonly navigationMode: WorkflowNavigationMode;
  readonly showConnectors: boolean;
  readonly showIndex: boolean;
  readonly showProgress: boolean;
  readonly locale: string;
  readonly dir: "ltr" | "rtl";
  readonly rootId: string;
  readonly listId: string;
  readonly keymap: WorkflowKeymap;

  // ── Messages
  readonly messages: {
    readonly workflowLabel: string;
    readonly progressLabel: (completed: number, total: number) => string;
    readonly stepAriaLabel: (step: WorkflowStep, index: number, total: number) => string;
    readonly optionalLabel: string;
    readonly errorLabel: string;
    readonly completedLabel: string;
    readonly currentLabel: string;
    readonly disabledLabel: string;
    readonly stepChangeAnnouncement: (step: WorkflowStep, index: number, total: number) => string;
  };

  // ── Renderer
  readonly renderStep: WorkflowStepRenderer | null;

  // ── Dispatch
  readonly setCurrentStepId: (id: WorkflowStepId | null) => void;
  readonly setFocusedStepId: (id: WorkflowStepId | null) => void;
  readonly activateStep: (
    stepId: WorkflowStepId,
    nativeEvent: MouseEvent | KeyboardEvent | null,
  ) => void;
  readonly navigate: (
    direction: "next" | "previous",
    nativeEvent: MouseEvent | KeyboardEvent | null,
  ) => void;
  readonly getResolvedState: (stepId: WorkflowStepId) => WorkflowStepState | null;

  // ── Callbacks
  readonly onStepClick: ((payload: WorkflowStepChangePayload) => void) | null;
  readonly onNavigate: ((payload: WorkflowNavigatePayload) => void) | null;

  // ── DOM plumbing
  readonly announce: (message: string) => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);
WorkflowContext.displayName = "WorkflowContext";

export { WorkflowContext };

export function useWorkflow(): WorkflowContextValue {
  const ctx = useContext(WorkflowContext);
  if (!ctx) {
    throw new Error("useWorkflow must be used inside <Workflow>");
  }
  return ctx;
}
