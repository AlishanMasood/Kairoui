// Default localizable strings.

import type { WorkflowStep } from "./workflow-types";

export function defaultWorkflowLabel(): string {
  return "Workflow";
}

export function defaultProgressLabel(completed: number, total: number): string {
  return `${String(completed)} of ${String(total)} steps completed`;
}

export function defaultStepAriaLabel(step: WorkflowStep, index: number, total: number): string {
  return `Step ${String(index + 1)} of ${String(total)}: ${step.label}`;
}

export function defaultOptionalLabel(): string {
  return "Optional";
}

export function defaultErrorLabel(): string {
  return "Error";
}

export function defaultCompletedLabel(): string {
  return "Completed";
}

export function defaultCurrentLabel(): string {
  return "Current";
}

export function defaultDisabledLabel(): string {
  return "Disabled";
}

export function defaultStepChangeAnnouncement(
  step: WorkflowStep,
  index: number,
  total: number,
): string {
  return `Step ${String(index + 1)} of ${String(total)}: ${step.label}`;
}
