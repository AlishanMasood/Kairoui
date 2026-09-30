// Identity validation for Permission Matrix input data. Throws at
// the pipeline boundary — no ambiguous matrix is rendered.

import type {
  PermissionAction,
  PermissionCell,
  PermissionSubject,
} from "./permission-matrix-types";

export function assertValidPermissionSubject(subject: PermissionSubject): void {
  if (typeof subject.id !== "string" || subject.id.length === 0) {
    throw new TypeError(`PermissionMatrix: subject.id must be a non-empty string`);
  }
  if (typeof subject.label !== "string") {
    throw new TypeError(`PermissionMatrix: subject "${subject.id}".label must be a string`);
  }
}

export function assertValidPermissionAction(action: PermissionAction): void {
  if (typeof action.id !== "string" || action.id.length === 0) {
    throw new TypeError(`PermissionMatrix: action.id must be a non-empty string`);
  }
  if (typeof action.label !== "string") {
    throw new TypeError(`PermissionMatrix: action "${action.id}".label must be a string`);
  }
}

export function assertValidPermissionCell(cell: PermissionCell): void {
  if (typeof cell.subjectId !== "string" || cell.subjectId.length === 0) {
    throw new TypeError(`PermissionMatrix: cell.subjectId must be a non-empty string`);
  }
  if (typeof cell.actionId !== "string" || cell.actionId.length === 0) {
    throw new TypeError(
      `PermissionMatrix: cell (${cell.subjectId}, ...).actionId must be a non-empty string`,
    );
  }
  switch (cell.state) {
    case "granted":
    case "denied":
    case "unset":
    case "inherited":
    case "indeterminate":
      return;
    default:
      throw new TypeError(
        `PermissionMatrix: cell (${cell.subjectId}, ${cell.actionId}).state is invalid`,
      );
  }
}

/**
 * Validates the full input set: no duplicate subject / action ids,
 * and every cell references a known subject and action.
 */
export function assertValidPermissionInput(
  subjects: readonly PermissionSubject[],
  actions: readonly PermissionAction[],
  cells: readonly PermissionCell[],
): void {
  const subjectIds = new Set<string>();
  for (const s of subjects) {
    assertValidPermissionSubject(s);
    if (subjectIds.has(s.id)) {
      throw new RangeError(`PermissionMatrix: duplicate subject id "${s.id}"`);
    }
    subjectIds.add(s.id);
  }
  const actionIds = new Set<string>();
  for (const a of actions) {
    assertValidPermissionAction(a);
    if (actionIds.has(a.id)) {
      throw new RangeError(`PermissionMatrix: duplicate action id "${a.id}"`);
    }
    actionIds.add(a.id);
  }
  const cellKeys = new Set<string>();
  for (const c of cells) {
    assertValidPermissionCell(c);
    const key = `${c.subjectId}\u0000${c.actionId}`;
    if (cellKeys.has(key)) {
      throw new RangeError(`PermissionMatrix: duplicate cell (${c.subjectId}, ${c.actionId})`);
    }
    cellKeys.add(key);
    if (!subjectIds.has(c.subjectId)) {
      throw new RangeError(`PermissionMatrix: cell references unknown subject "${c.subjectId}"`);
    }
    if (!actionIds.has(c.actionId)) {
      throw new RangeError(`PermissionMatrix: cell references unknown action "${c.actionId}"`);
    }
  }
}
