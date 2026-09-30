import { createContext, useContext } from "react";
import type {
  PermissionAction,
  PermissionActionId,
  PermissionCell,
  PermissionCellState,
  PermissionMatrixCellRenderer,
  PermissionMatrixEmptyStateRenderer,
  PermissionMatrixMode,
  PermissionMatrixSelection,
  PermissionMatrixState,
  PermissionMatrixToggleMode,
  PermissionSubject,
  PermissionSubjectId,
} from "./permission-matrix-types";
import type { PermissionMatrixKeymap } from "./keymap";

export interface PermissionMatrixContextValue {
  readonly state: PermissionMatrixState;
  readonly subjects: readonly PermissionSubject[];
  readonly actions: readonly PermissionAction[];
  readonly cells: readonly PermissionCell[];
  readonly visibleSubjects: readonly PermissionSubject[];
  readonly visibleActions: readonly PermissionAction[];
  readonly cellIndex: ReadonlyMap<string, PermissionCell>;

  // ── Config
  readonly mode: PermissionMatrixMode;
  readonly toggleMode: PermissionMatrixToggleMode;
  readonly overrideOnInheritedToggle: boolean;
  readonly readOnly: boolean;
  readonly enableRowToggle: boolean;
  readonly enableColumnToggle: boolean;
  readonly enableSelectAll: boolean;
  readonly enableSearch: boolean;
  readonly virtualizeRows: boolean;
  readonly rowHeight: number | null;
  readonly viewportHeight: number | null;
  readonly locale: string;
  readonly dir: "ltr" | "rtl";
  readonly rootId: string;
  readonly gridId: string;
  readonly keymap: PermissionMatrixKeymap;

  // ── Messages (resolved)
  readonly messages: {
    readonly matrixLabel: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly grantedLabel: string;
    readonly deniedLabel: string;
    readonly unsetLabel: string;
    readonly inheritedLabel: string;
    readonly indeterminateLabel: string;
    readonly disabledLabel: string;
    readonly readOnlyLabel: string;
    readonly selectAllLabel: string;
    readonly selectRowLabel: (subject: PermissionSubject) => string;
    readonly selectColumnLabel: (action: PermissionAction) => string;
    readonly cellLabel: (
      subject: PermissionSubject,
      action: PermissionAction,
      state: PermissionCellState,
    ) => string;
    readonly changeAnnouncement: (
      subject: PermissionSubject,
      action: PermissionAction,
      fromState: PermissionCellState,
      toState: PermissionCellState,
    ) => string;
    readonly bulkChangeAnnouncement: (
      source:
        | { readonly kind: "row"; readonly subjectId: string }
        | { readonly kind: "column"; readonly actionId: string }
        | { readonly kind: "all" },
      targetState: PermissionCellState,
      count: number,
    ) => string;
    readonly rejectInheritedToggleAnnouncement: (
      subject: PermissionSubject,
      action: PermissionAction,
    ) => string;
  };

  // ── Renderers
  readonly renderCell: PermissionMatrixCellRenderer | null;
  readonly renderEmptyState: PermissionMatrixEmptyStateRenderer | null;

  // ── Dispatch
  readonly setSelection: (selection: PermissionMatrixSelection) => void;
  readonly setFocusedSubjectId: (id: PermissionSubjectId | null) => void;
  readonly setFocusedActionId: (id: PermissionActionId | null) => void;
  readonly setSearch: (query: string) => void;
  readonly toggleCellAt: (subjectId: PermissionSubjectId, actionId: PermissionActionId) => void;
  readonly bulkSetTo: (
    source:
      | { readonly kind: "row"; readonly subjectId: PermissionSubjectId }
      | { readonly kind: "column"; readonly actionId: PermissionActionId }
      | { readonly kind: "all" },
    targetState: PermissionCellState,
  ) => void;

  // ── Callbacks
  readonly onCellClick:
    | ((payload: {
        readonly subject: PermissionSubject;
        readonly action: PermissionAction;
        readonly cell: PermissionCell;
        readonly nativeEvent: MouseEvent | KeyboardEvent;
      }) => void)
    | null;

  // ── DOM plumbing
  readonly announce: (message: string) => void;
  readonly registerSearchInput: (el: HTMLInputElement | null) => void;
  readonly focusSearchInput: () => void;
}

const PermissionMatrixContext = createContext<PermissionMatrixContextValue | null>(null);
PermissionMatrixContext.displayName = "PermissionMatrixContext";

export { PermissionMatrixContext };

export function usePermissionMatrix(): PermissionMatrixContextValue {
  const ctx = useContext(PermissionMatrixContext);
  if (!ctx) {
    throw new Error("usePermissionMatrix must be used inside <PermissionMatrix>");
  }
  return ctx;
}
