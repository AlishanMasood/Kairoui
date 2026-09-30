// Identity validation for Workflow input data.

import type { WorkflowStep } from "./workflow-types";

export function assertValidWorkflowStep(step: WorkflowStep): void {
  if (typeof step.id !== "string" || step.id.length === 0) {
    throw new TypeError(`Workflow: step.id must be a non-empty string`);
  }
  if (typeof step.label !== "string") {
    throw new TypeError(`Workflow: step "${step.id}".label must be a string`);
  }
  if (step.state !== undefined) {
    switch (step.state) {
      case "pending":
      case "current":
      case "completed":
      case "error":
        break;
      default:
        throw new TypeError(`Workflow: step "${step.id}".state is invalid`);
    }
  }
}

/**
 * Validates the full step list — every step conforms and no duplicate
 * ids appear.
 */
export function assertValidWorkflowSteps(steps: readonly WorkflowStep[]): void {
  const ids = new Set<string>();
  for (const step of steps) {
    assertValidWorkflowStep(step);
    if (ids.has(step.id)) {
      throw new RangeError(`Workflow: duplicate step id "${step.id}"`);
    }
    ids.add(step.id);
  }
}
