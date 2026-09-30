// Public types for the KairoUI Permission Matrix. See
// docs/architecture/PHASE14-PERMISSION-MATRIX-ARCHITECTURE.md.

import type { CSSProperties, ReactNode } from "react";

// ─── Identity ────────────────────────────────────────────────────

export type PermissionSubjectId = string;
export type PermissionActionId = string;

export interface PermissionSubject {
  readonly id: PermissionSubjectId;
  readonly label: string;
  readonly groupId?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface PermissionAction {
  readonly id: PermissionActionId;
  readonly label: string;
  readonly groupId?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

// ─── Cell ────────────────────────────────────────────────────────

export type PermissionCellState = "granted" | "denied" | "unset" | "inherited" | "indeterminate";

export interface PermissionCell {
  readonly subjectId: PermissionSubjectId;
  readonly actionId: PermissionActionId;
  readonly state: PermissionCellState;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly label?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

// ─── Modes ───────────────────────────────────────────────────────

export type PermissionMatrixMode = "role-permission" | "resource-action";

export type PermissionMatrixToggleMode = "grant-only" | "grant-deny" | "grant-deny-only";

// ─── Change payloads ─────────────────────────────────────────────

export interface PermissionCellChange {
  readonly subjectId: PermissionSubjectId;
  readonly actionId: PermissionActionId;
  readonly fromState: PermissionCellState;
  readonly toState: PermissionCellState;
}

export interface PermissionMatrixCellClickPayload {
  readonly subject: PermissionSubject;
  readonly action: PermissionAction;
  readonly cell: PermissionCell;
  readonly nativeEvent: MouseEvent | KeyboardEvent;
}

export interface PermissionMatrixCellChangePayload {
  readonly subject: PermissionSubject;
  readonly action: PermissionAction;
  readonly fromState: PermissionCellState;
  readonly toState: PermissionCellState;
}

export type PermissionMatrixBulkSource =
  | { readonly kind: "row"; readonly subjectId: PermissionSubjectId }
  | { readonly kind: "column"; readonly actionId: PermissionActionId }
  | { readonly kind: "all" };

export interface PermissionMatrixBulkChangePayload {
  readonly changes: readonly PermissionCellChange[];
  readonly source: PermissionMatrixBulkSource;
  readonly targetState: PermissionCellState;
}

// ─── Selection ───────────────────────────────────────────────────

export type PermissionMatrixSelection =
  | { readonly kind: "none" }
  | {
      readonly kind: "cell";
      readonly subjectId: PermissionSubjectId;
      readonly actionId: PermissionActionId;
    }
  | { readonly kind: "row"; readonly subjectId: PermissionSubjectId }
  | { readonly kind: "column"; readonly actionId: PermissionActionId }
  | { readonly kind: "all" };

// ─── State ───────────────────────────────────────────────────────

export interface PermissionMatrixState {
  readonly selection: PermissionMatrixSelection;
  readonly focusedSubjectId: PermissionSubjectId | null;
  readonly focusedActionId: PermissionActionId | null;
  readonly search: string;
}

// ─── Localizable messages ────────────────────────────────────────

export interface PermissionMatrixMessages {
  readonly matrixLabel?: string;
  readonly searchLabel?: string;
  readonly searchPlaceholder?: string;
  readonly grantedLabel?: string;
  readonly deniedLabel?: string;
  readonly unsetLabel?: string;
  readonly inheritedLabel?: string;
  readonly indeterminateLabel?: string;
  readonly disabledLabel?: string;
  readonly readOnlyLabel?: string;
  readonly selectAllLabel?: string;
  readonly selectRowLabel?: (subject: PermissionSubject) => string;
  readonly selectColumnLabel?: (action: PermissionAction) => string;
  readonly cellLabel?: (
    subject: PermissionSubject,
    action: PermissionAction,
    state: PermissionCellState,
  ) => string;
  readonly changeAnnouncement?: (
    subject: PermissionSubject,
    action: PermissionAction,
    fromState: PermissionCellState,
    toState: PermissionCellState,
  ) => string;
  readonly bulkChangeAnnouncement?: (
    source: PermissionMatrixBulkSource,
    targetState: PermissionCellState,
    count: number,
  ) => string;
  readonly rejectInheritedToggleAnnouncement?: (
    subject: PermissionSubject,
    action: PermissionAction,
  ) => string;
}

// ─── Accessibility ───────────────────────────────────────────────

export interface PermissionMatrixAccessibilityProps {
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly "aria-describedby"?: string;
}

// ─── Custom renderers ────────────────────────────────────────────

export type PermissionMatrixCellRenderer = (context: {
  readonly subject: PermissionSubject;
  readonly action: PermissionAction;
  readonly cell: PermissionCell;
  readonly isFocused: boolean;
  readonly isSelected: boolean;
}) => ReactNode;

export type PermissionMatrixEmptyStateRenderer = () => ReactNode;

// ─── Root props ──────────────────────────────────────────────────

export interface PermissionMatrixRootProps extends PermissionMatrixAccessibilityProps {
  // ── Data
  readonly subjects: readonly PermissionSubject[];
  readonly actions: readonly PermissionAction[];
  readonly cells: readonly PermissionCell[];

  // ── Presentation
  readonly mode?: PermissionMatrixMode;
  readonly toggleMode?: PermissionMatrixToggleMode;
  readonly overrideOnInheritedToggle?: boolean;
  readonly readOnly?: boolean;

  // ── Row/column toggles
  readonly enableRowToggle?: boolean;
  readonly enableColumnToggle?: boolean;
  readonly enableSelectAll?: boolean;

  // ── Search
  readonly enableSearch?: boolean;
  readonly search?: string;
  readonly defaultSearch?: string;
  readonly onSearchChange?: (query: string) => void;
  readonly filterFn?: (context: {
    readonly subject?: PermissionSubject;
    readonly action?: PermissionAction;
    readonly query: string;
  }) => boolean;

  // ── Selection (controllable)
  readonly selection?: PermissionMatrixSelection;
  readonly defaultSelection?: PermissionMatrixSelection;
  readonly onSelectionChange?: (selection: PermissionMatrixSelection) => void;

  // ── Focus (controllable)
  readonly focusedSubjectId?: PermissionSubjectId | null;
  readonly defaultFocusedSubjectId?: PermissionSubjectId | null;
  readonly onFocusedSubjectChange?: (id: PermissionSubjectId | null) => void;

  readonly focusedActionId?: PermissionActionId | null;
  readonly defaultFocusedActionId?: PermissionActionId | null;
  readonly onFocusedActionChange?: (id: PermissionActionId | null) => void;

  // ── Virtualization
  readonly virtualizeRows?: boolean;
  readonly rowHeight?: number;
  readonly viewportHeight?: number;

  // ── Locale
  readonly locale?: string;
  readonly dir?: "ltr" | "rtl";
  readonly messages?: PermissionMatrixMessages;

  // ── Callbacks
  readonly onCellClick?: (payload: PermissionMatrixCellClickPayload) => void;
  readonly onCellChange?: (payload: PermissionMatrixCellChangePayload) => void | Promise<void>;
  readonly onBulkChange?: (payload: PermissionMatrixBulkChangePayload) => void | Promise<void>;
  readonly onError?: (error: unknown) => void;

  // ── Rendering
  readonly renderCell?: PermissionMatrixCellRenderer;
  readonly renderEmptyState?: PermissionMatrixEmptyStateRenderer;
  readonly children?: ReactNode;

  // ── DOM plumbing
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly id?: string;
}

// ─── Compound subcomponent props ─────────────────────────────────

export interface PermissionMatrixHeaderProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface PermissionMatrixTableProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface PermissionMatrixColumnHeaderProps {
  readonly actionId: PermissionActionId;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface PermissionMatrixRowHeaderProps {
  readonly subjectId: PermissionSubjectId;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface PermissionMatrixCellProps {
  readonly subjectId: PermissionSubjectId;
  readonly actionId: PermissionActionId;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface PermissionMatrixEmptyStateProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface PermissionMatrixLegendItemProps {
  readonly state: PermissionCellState;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
}
