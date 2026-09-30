// Pure cell-state helpers. Framework-independent — consumers may
// import these to apply changes without mounting the matrix.

import type {
  PermissionCell,
  PermissionCellState,
  PermissionMatrixToggleMode,
  PermissionAction,
  PermissionSubject,
} from "./permission-matrix-types";

export const UNSET_STATE: PermissionCellState = "unset";

/**
 * Returns the cell that matches `{ subjectId, actionId }`. When no
 * cell is stored for that coordinate, returns a synthetic `unset`
 * cell so downstream code never has to null-check. The synthetic
 * cell is never persisted — it exists only for rendering.
 */
export function resolveCell(
  cells: readonly PermissionCell[],
  subjectId: string,
  actionId: string,
): PermissionCell {
  for (const cell of cells) {
    if (cell.subjectId === subjectId && cell.actionId === actionId) return cell;
  }
  return { subjectId, actionId, state: UNSET_STATE };
}

/**
 * Returns the next state produced by toggling `current` under
 * `toggleMode`.
 *
 * - `"grant-only"`: unset → granted → unset
 * - `"grant-deny"`: unset → granted → denied → unset
 * - `"grant-deny-only"`: granted ↔ denied (never unset)
 *
 * Any state other than the three canonical values is treated as
 * `unset` for the purposes of the transition. `inherited` and
 * `indeterminate` are handled by `resolveToggleTarget` — see below.
 */
export function toggleCell(
  current: PermissionCellState,
  toggleMode: PermissionMatrixToggleMode,
): PermissionCellState {
  const base: PermissionCellState =
    current === "granted" || current === "denied" || current === "unset" ? current : "unset";
  if (toggleMode === "grant-only") {
    return base === "granted" ? "unset" : "granted";
  }
  if (toggleMode === "grant-deny") {
    if (base === "unset") return "granted";
    if (base === "granted") return "denied";
    return "unset";
  }
  // grant-deny-only
  return base === "granted" ? "denied" : "granted";
}

/**
 * Higher-level toggle resolver used by the runtime. Applies the
 * `overrideOnInheritedToggle` policy: when `false` (default),
 * toggling an `inherited` or `indeterminate` cell returns `null` —
 * the runtime skips the callback and announces a rejection.
 */
export function resolveToggleTarget(
  current: PermissionCellState,
  toggleMode: PermissionMatrixToggleMode,
  overrideOnInheritedToggle: boolean,
): PermissionCellState | null {
  if (!overrideOnInheritedToggle && (current === "inherited" || current === "indeterminate")) {
    return null;
  }
  return toggleCell(current, toggleMode);
}

/**
 * Produces the list of cell changes for a bulk row / column / all
 * operation. Only cells that are neither disabled nor read-only
 * contribute a change; the resulting change's `fromState` is the
 * cell's current state and `toState` is `targetState`. Cells whose
 * current state already equals `targetState` are excluded so the
 * consumer's callback receives no-ops-free input.
 */
export function computeBulkChanges(input: {
  readonly subjects: readonly PermissionSubject[];
  readonly actions: readonly PermissionAction[];
  readonly cells: readonly PermissionCell[];
  readonly targetState: PermissionCellState;
  readonly rowSubjectId?: string;
  readonly columnActionId?: string;
}): readonly {
  readonly subjectId: string;
  readonly actionId: string;
  readonly fromState: PermissionCellState;
  readonly toState: PermissionCellState;
}[] {
  const { subjects, actions, cells, targetState, rowSubjectId, columnActionId } = input;
  const cellMap = new Map<string, PermissionCell>();
  for (const c of cells) {
    cellMap.set(`${c.subjectId}\u0000${c.actionId}`, c);
  }
  const changes: {
    readonly subjectId: string;
    readonly actionId: string;
    readonly fromState: PermissionCellState;
    readonly toState: PermissionCellState;
  }[] = [];
  for (const subject of subjects) {
    if (rowSubjectId !== undefined && subject.id !== rowSubjectId) continue;
    for (const action of actions) {
      if (columnActionId !== undefined && action.id !== columnActionId) continue;
      const cell = cellMap.get(`${subject.id}\u0000${action.id}`) ?? {
        subjectId: subject.id,
        actionId: action.id,
        state: UNSET_STATE,
      };
      if (cell.disabled === true || cell.readOnly === true) continue;
      if (cell.state === targetState) continue;
      changes.push({
        subjectId: subject.id,
        actionId: action.id,
        fromState: cell.state,
        toState: targetState,
      });
    }
  }
  return changes;
}

/**
 * Filters subjects + actions by a case-insensitive substring match
 * against `label` and `id`. `filterFn` overrides when provided.
 *
 * When a plain query matches nothing on the axis, the full input
 * is returned unfiltered so the other axis's matches still render
 * — visible rows scale to any label match, columns to any label
 * match, independently.
 */
export function filterAxis<T extends PermissionSubject | PermissionAction>(
  items: readonly T[],
  query: string,
  filterFn?: (context: {
    readonly subject?: PermissionSubject;
    readonly action?: PermissionAction;
    readonly query: string;
  }) => boolean,
  kind?: "subject" | "action",
): readonly T[] {
  if (query === "" && !filterFn) return items;
  const q = query.toLowerCase();
  const filtered = items.filter((item) => {
    if (filterFn) {
      const ctx: {
        readonly subject?: PermissionSubject;
        readonly action?: PermissionAction;
        readonly query: string;
      } =
        kind === "subject"
          ? { subject: item, query }
          : kind === "action"
            ? { action: item, query }
            : { query };
      const ok = filterFn(ctx);
      if (!ok) return false;
    }
    if (query === "") return true;
    return item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });
  if (filtered.length === 0 && query !== "" && !filterFn) {
    return items;
  }
  return filtered;
}
