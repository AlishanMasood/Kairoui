// Pure step-state helpers. Framework-independent — consumers may
// import them directly to compute progress / resolved states without
// mounting the workflow.

import type { WorkflowStep, WorkflowStepId, WorkflowStepState } from "./workflow-types";

export interface ResolvedWorkflowStep {
  readonly step: WorkflowStep;
  readonly index: number;
  readonly resolvedState: WorkflowStepState;
  readonly isCurrent: boolean;
}

/**
 * Resolves each step's runtime state. When `currentStepId` matches a
 * step, that step's resolved state is `"current"` regardless of what
 * the consumer passed in `step.state`. All other steps use their
 * declared state, falling back to `"pending"`.
 */
export function resolveStepStates(
  steps: readonly WorkflowStep[],
  currentStepId: WorkflowStepId | null,
): readonly ResolvedWorkflowStep[] {
  const output: ResolvedWorkflowStep[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step) continue;
    const isCurrent = currentStepId !== null && step.id === currentStepId;
    const declared: WorkflowStepState = step.state ?? "pending";
    const resolvedState: WorkflowStepState = isCurrent ? "current" : declared;
    output.push({ step, index: i, resolvedState, isCurrent });
  }
  return output;
}

/**
 * Counts steps by resolved state.
 */
export function countStepsByState(
  resolved: readonly ResolvedWorkflowStep[],
): Readonly<Record<WorkflowStepState, number>> {
  const counts: Record<WorkflowStepState, number> = {
    pending: 0,
    current: 0,
    completed: 0,
    error: 0,
  };
  for (const r of resolved) {
    counts[r.resolvedState] += 1;
  }
  return counts;
}

/**
 * Computes overall progress as `{ completed, total }`. Every step
 * that resolves to `"completed"` counts toward `completed`. `total`
 * is the number of non-disabled steps.
 */
export function computeWorkflowProgress(resolved: readonly ResolvedWorkflowStep[]): {
  readonly completed: number;
  readonly total: number;
} {
  let completed = 0;
  let total = 0;
  for (const r of resolved) {
    if (r.step.disabled === true) continue;
    total += 1;
    if (r.resolvedState === "completed") completed += 1;
  }
  return { completed, total };
}

/**
 * Returns the next enabled step id in `direction`, skipping disabled
 * steps. Returns `null` when no reachable step exists.
 */
export function findAdjacentStep(
  steps: readonly WorkflowStep[],
  fromId: WorkflowStepId | null,
  direction: "next" | "previous",
): WorkflowStepId | null {
  if (steps.length === 0) return null;
  const startIndex = fromId === null ? -1 : steps.findIndex((s) => s.id === fromId);
  const delta = direction === "next" ? 1 : -1;
  let i = startIndex + delta;
  while (i >= 0 && i < steps.length) {
    const s = steps[i];
    if (s && s.disabled !== true) return s.id;
    i += delta;
  }
  return null;
}

/**
 * Returns the first enabled step id, or `null` when every step is
 * disabled or the list is empty.
 */
export function firstEnabledStep(steps: readonly WorkflowStep[]): WorkflowStepId | null {
  for (const step of steps) {
    if (step.disabled !== true) return step.id;
  }
  return null;
}

/**
 * Returns the last enabled step id, or `null` when every step is
 * disabled or the list is empty.
 */
export function lastEnabledStep(steps: readonly WorkflowStep[]): WorkflowStepId | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (step && step.disabled !== true) return step.id;
  }
  return null;
}
