// Public types for the KairoUI Workflow / Stepper.
//
// Backend-agnostic — no workflow engine, no rule execution, no
// persistence. The component renders steps and reports navigation
// intent; the consumer owns transitions.

import type { CSSProperties, ReactNode } from "react";

// ─── Identity ────────────────────────────────────────────────────

export type WorkflowStepId = string;

/** State of a single step. Mutually exclusive per step. */
export type WorkflowStepState = "pending" | "current" | "completed" | "error";

export interface WorkflowStep {
  readonly id: WorkflowStepId;
  readonly label: string;
  readonly description?: string;
  /**
   * Resolved state for this step. When the consumer passes
   * `currentStepId` on the root, the runtime overrides matching
   * steps' state with `"current"` — the value here is used only
   * for non-current steps. See `resolveStepStates`.
   */
  readonly state?: WorkflowStepState;
  /** Marks the step as optional — rendered as a hint next to the label. */
  readonly optional?: boolean;
  /** Marks the step non-interactive. Focus is skipped. */
  readonly disabled?: boolean;
  /** Consumer metadata — untouched by the runtime. */
  readonly meta?: Readonly<Record<string, unknown>>;
}

// ─── Orientation ─────────────────────────────────────────────────

export type WorkflowOrientation = "horizontal" | "vertical";

// ─── Navigation mode ─────────────────────────────────────────────

/**
 * `"linear"` — the consumer prefers strict forward progression. The
 * runtime lets non-linear jumps happen (backwards / skip) but exposes
 * the mode through context so custom renderers can style
 * unreachable steps if they want. The runtime does **not** block
 * navigation — that is a consumer concern.
 *
 * `"non-linear"` — no ordering hint; every enabled step is
 * navigable.
 */
export type WorkflowNavigationMode = "linear" | "non-linear";

// ─── Callback payloads ───────────────────────────────────────────

export interface WorkflowStepChangePayload {
  readonly step: WorkflowStep;
  readonly previousStepId: WorkflowStepId | null;
  readonly nativeEvent: MouseEvent | KeyboardEvent | null;
}

export interface WorkflowNavigatePayload {
  readonly direction: "next" | "previous";
  readonly fromStepId: WorkflowStepId | null;
  readonly nativeEvent: MouseEvent | KeyboardEvent | null;
}

// ─── Selection / focus ──────────────────────────────────────────

export interface WorkflowState {
  readonly currentStepId: WorkflowStepId | null;
  readonly focusedStepId: WorkflowStepId | null;
}

// ─── Localizable messages ────────────────────────────────────────

export interface WorkflowMessages {
  readonly workflowLabel?: string;
  readonly progressLabel?: (completed: number, total: number) => string;
  readonly stepAriaLabel?: (step: WorkflowStep, index: number, total: number) => string;
  readonly optionalLabel?: string;
  readonly errorLabel?: string;
  readonly completedLabel?: string;
  readonly currentLabel?: string;
  readonly disabledLabel?: string;
  readonly stepChangeAnnouncement?: (step: WorkflowStep, index: number, total: number) => string;
}

// ─── Accessibility ───────────────────────────────────────────────

export interface WorkflowAccessibilityProps {
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly "aria-describedby"?: string;
}

// ─── Custom renderer ─────────────────────────────────────────────

export type WorkflowStepRenderer = (context: {
  readonly step: WorkflowStep;
  readonly index: number;
  readonly state: WorkflowStepState;
  readonly isCurrent: boolean;
  readonly isFocused: boolean;
}) => ReactNode;

// ─── Root props ──────────────────────────────────────────────────

export interface WorkflowRootProps extends WorkflowAccessibilityProps {
  // ── Data
  readonly steps: readonly WorkflowStep[];

  // ── Current step (controllable)
  readonly currentStepId?: WorkflowStepId | null;
  readonly defaultCurrentStepId?: WorkflowStepId | null;
  readonly onCurrentStepChange?: (id: WorkflowStepId | null) => void;

  // ── Focus (controllable)
  readonly focusedStepId?: WorkflowStepId | null;
  readonly defaultFocusedStepId?: WorkflowStepId | null;
  readonly onFocusedStepChange?: (id: WorkflowStepId | null) => void;

  // ── Presentation
  readonly orientation?: WorkflowOrientation;
  readonly navigationMode?: WorkflowNavigationMode;
  readonly showConnectors?: boolean;
  readonly showIndex?: boolean;
  readonly showProgress?: boolean;

  // ── Locale
  readonly locale?: string;
  readonly dir?: "ltr" | "rtl";
  readonly messages?: WorkflowMessages;

  // ── Callbacks
  readonly onStepClick?: (payload: WorkflowStepChangePayload) => void;
  readonly onStepChange?: (payload: WorkflowStepChangePayload) => void;
  readonly onNavigate?: (payload: WorkflowNavigatePayload) => void;

  // ── Rendering
  readonly renderStep?: WorkflowStepRenderer;
  readonly children?: ReactNode;

  // ── DOM plumbing
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly id?: string;
}

// ─── Compound subcomponent props ─────────────────────────────────

export interface WorkflowListProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface WorkflowStepProps {
  readonly stepId: WorkflowStepId;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface WorkflowStepIconProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface WorkflowStepLabelProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface WorkflowStepDescriptionProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export interface WorkflowConnectorProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface WorkflowProgressProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface WorkflowNavProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}
