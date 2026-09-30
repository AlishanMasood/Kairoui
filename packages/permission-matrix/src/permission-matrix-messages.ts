// Default localizable strings.

import type {
  PermissionAction,
  PermissionCellState,
  PermissionMatrixBulkSource,
  PermissionSubject,
} from "./permission-matrix-types";

export function defaultMatrixLabel(): string {
  return "Permission matrix";
}

export function defaultSearchLabel(): string {
  return "Filter permissions";
}

export function defaultSearchPlaceholder(): string {
  return "Search subjects or actions…";
}

export function defaultStateLabel(state: PermissionCellState): string {
  switch (state) {
    case "granted":
      return "Granted";
    case "denied":
      return "Denied";
    case "unset":
      return "Not set";
    case "inherited":
      return "Inherited";
    case "indeterminate":
      return "Mixed";
  }
}

export function defaultSelectAllLabel(): string {
  return "Select all cells";
}

export function defaultSelectRowLabel(subject: PermissionSubject): string {
  return `Select all permissions for ${subject.label}`;
}

export function defaultSelectColumnLabel(action: PermissionAction): string {
  return `Select all subjects for ${action.label}`;
}

export function defaultCellLabel(
  subject: PermissionSubject,
  action: PermissionAction,
  state: PermissionCellState,
): string {
  return `${subject.label} — ${action.label}: ${defaultStateLabel(state)}`;
}

export function defaultChangeAnnouncement(
  subject: PermissionSubject,
  action: PermissionAction,
  _fromState: PermissionCellState,
  toState: PermissionCellState,
): string {
  return `${subject.label}, ${action.label}: ${defaultStateLabel(toState)}.`;
}

export function defaultBulkChangeAnnouncement(
  source: PermissionMatrixBulkSource,
  targetState: PermissionCellState,
  count: number,
): string {
  const scope =
    source.kind === "row"
      ? `Row ${source.subjectId}`
      : source.kind === "column"
        ? `Column ${source.actionId}`
        : "All cells";
  return `${scope}: ${String(count)} cells set to ${defaultStateLabel(targetState)}.`;
}

export function defaultRejectInheritedToggleAnnouncement(
  subject: PermissionSubject,
  action: PermissionAction,
): string {
  return `${subject.label}, ${action.label}: inherited value cannot be toggled.`;
}
