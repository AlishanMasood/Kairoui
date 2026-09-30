import { createContext, useCallback, useContext, useId, useMemo, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { useControllableState, useEventCallback } from "@kairoui/hooks";
import { WorkflowContext, useWorkflow } from "./workflow-context";
import type { WorkflowContextValue } from "./workflow-context";
import { DEFAULT_WORKFLOW_KEYMAP, type WorkflowAction, resolveWorkflowAction } from "./keymap";
import type {
  WorkflowConnectorProps,
  WorkflowListProps,
  WorkflowNavigatePayload,
  WorkflowProgressProps,
  WorkflowRootProps,
  WorkflowStep,
  WorkflowStepChangePayload,
  WorkflowStepDescriptionProps,
  WorkflowStepIconProps,
  WorkflowStepId,
  WorkflowStepLabelProps,
  WorkflowStepProps,
  WorkflowStepRenderer,
  WorkflowStepState,
} from "./workflow-types";
import { assertValidWorkflowSteps } from "./identity";
import {
  computeWorkflowProgress,
  findAdjacentStep,
  firstEnabledStep,
  lastEnabledStep,
  resolveStepStates,
} from "./step-state";
import {
  defaultCompletedLabel,
  defaultCurrentLabel,
  defaultDisabledLabel,
  defaultErrorLabel,
  defaultOptionalLabel,
  defaultProgressLabel,
  defaultStepAriaLabel,
  defaultStepChangeAnnouncement,
  defaultWorkflowLabel,
} from "./workflow-messages";

// ─── Root ────────────────────────────────────────────────────────

function WorkflowRoot(props: WorkflowRootProps): ReactNode {
  const {
    steps,
    currentStepId: currentStepIdProp,
    defaultCurrentStepId,
    onCurrentStepChange,
    focusedStepId: focusedStepIdProp,
    defaultFocusedStepId,
    onFocusedStepChange,
    orientation = "horizontal",
    navigationMode = "linear",
    showConnectors = true,
    showIndex = true,
    showProgress = false,
    locale = "en",
    dir = "ltr",
    messages,
    onStepClick,
    onStepChange,
    onNavigate,
    renderStep,
    children,
    className,
    style,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
  } = props;

  assertValidWorkflowSteps(steps);

  const generatedId = useId();
  const rootId = id ?? generatedId;
  const listId = `${rootId}-list`;

  const [currentStepId, setCurrentStepIdInternal] = useControllableState<WorkflowStepId | null>({
    value: currentStepIdProp,
    defaultValue: defaultCurrentStepId ?? null,
    ...(onCurrentStepChange ? { onChange: onCurrentStepChange } : undefined),
    name: "Workflow",
    state: "currentStepId",
  });

  const [focusedStepId, setFocusedStepIdInternal] = useControllableState<WorkflowStepId | null>({
    value: focusedStepIdProp,
    defaultValue: defaultFocusedStepId ?? currentStepId ?? firstEnabledStep(steps),
    ...(onFocusedStepChange ? { onChange: onFocusedStepChange } : undefined),
    name: "Workflow",
    state: "focusedStepId",
  });

  // ── Messages
  const mergedMessages = useMemo(
    () => ({
      workflowLabel: messages?.workflowLabel ?? defaultWorkflowLabel(),
      progressLabel: messages?.progressLabel ?? defaultProgressLabel,
      stepAriaLabel: messages?.stepAriaLabel ?? defaultStepAriaLabel,
      optionalLabel: messages?.optionalLabel ?? defaultOptionalLabel(),
      errorLabel: messages?.errorLabel ?? defaultErrorLabel(),
      completedLabel: messages?.completedLabel ?? defaultCompletedLabel(),
      currentLabel: messages?.currentLabel ?? defaultCurrentLabel(),
      disabledLabel: messages?.disabledLabel ?? defaultDisabledLabel(),
      stepChangeAnnouncement: messages?.stepChangeAnnouncement ?? defaultStepChangeAnnouncement,
    }),
    [messages],
  );

  // ── Resolved state
  const resolved = useMemo(() => resolveStepStates(steps, currentStepId), [currentStepId, steps]);
  const progress = useMemo(() => computeWorkflowProgress(resolved), [resolved]);

  // ── Announcer
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const announce = useCallback((message: string) => {
    const el = announcerRef.current;
    if (!el) return;
    el.textContent = "";
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        if (el.isConnected) el.textContent = message;
      });
    } else {
      el.textContent = message;
    }
  }, []);

  // ── Stable callbacks
  const onStepClickStable = useEventCallback(onStepClick ?? (() => undefined));
  const onStepChangeStable = useEventCallback(onStepChange ?? (() => undefined));
  const onNavigateStable = useEventCallback(onNavigate ?? (() => undefined));

  const setCurrentStepId = useCallback(
    (next: WorkflowStepId | null) => {
      setCurrentStepIdInternal(next);
    },
    [setCurrentStepIdInternal],
  );
  const setFocusedStepId = useCallback(
    (next: WorkflowStepId | null) => {
      setFocusedStepIdInternal(next);
    },
    [setFocusedStepIdInternal],
  );

  const activateStep = useCallback(
    (stepId: WorkflowStepId, nativeEvent: MouseEvent | KeyboardEvent | null) => {
      const step = steps.find((s) => s.id === stepId);
      if (!step) return;
      if (step.disabled === true) return;
      const previousStepId = currentStepId;
      const payload: WorkflowStepChangePayload = {
        step,
        previousStepId,
        nativeEvent,
      };
      onStepClickStable(payload);
      if (step.id !== previousStepId) {
        setCurrentStepIdInternal(step.id);
        onStepChangeStable(payload);
        const index = steps.findIndex((s) => s.id === step.id);
        announce(mergedMessages.stepChangeAnnouncement(step, index, steps.length));
      }
    },
    [
      announce,
      currentStepId,
      mergedMessages,
      onStepChangeStable,
      onStepClickStable,
      setCurrentStepIdInternal,
      steps,
    ],
  );

  const navigate = useCallback(
    (direction: "next" | "previous", nativeEvent: MouseEvent | KeyboardEvent | null) => {
      const nextId = findAdjacentStep(steps, currentStepId, direction);
      const payload: WorkflowNavigatePayload = {
        direction,
        fromStepId: currentStepId,
        nativeEvent,
      };
      onNavigateStable(payload);
      if (nextId !== null) {
        activateStep(nextId, nativeEvent);
      }
    },
    [activateStep, currentStepId, onNavigateStable, steps],
  );

  const getResolvedState = useCallback(
    (stepId: WorkflowStepId): WorkflowStepState | null => {
      const r = resolved.find((s) => s.step.id === stepId);
      return r ? r.resolvedState : null;
    },
    [resolved],
  );

  const contextValue: WorkflowContextValue = useMemo(
    () => ({
      state: {
        currentStepId,
        focusedStepId,
      },
      steps,
      resolved,
      progress,
      orientation,
      navigationMode,
      showConnectors,
      showIndex,
      showProgress,
      locale,
      dir,
      rootId,
      listId,
      keymap: DEFAULT_WORKFLOW_KEYMAP,
      messages: mergedMessages,
      renderStep: renderStep ?? null,
      setCurrentStepId,
      setFocusedStepId,
      activateStep,
      navigate,
      getResolvedState,
      onStepClick:
        onStepClick !== undefined
          ? (onStepClickStable as WorkflowContextValue["onStepClick"])
          : null,
      onNavigate:
        onNavigate !== undefined ? (onNavigateStable as WorkflowContextValue["onNavigate"]) : null,
      announce,
    }),
    [
      activateStep,
      announce,
      currentStepId,
      dir,
      focusedStepId,
      getResolvedState,
      listId,
      locale,
      mergedMessages,
      navigate,
      navigationMode,
      onNavigate,
      onNavigateStable,
      onStepClick,
      onStepClickStable,
      orientation,
      progress,
      renderStep,
      resolved,
      rootId,
      setCurrentStepId,
      setFocusedStepId,
      showConnectors,
      showIndex,
      showProgress,
      steps,
    ],
  );

  return (
    <WorkflowContext.Provider value={contextValue}>
      <div
        id={rootId}
        className={joinClass("kui-workflow", `kui-workflow--${orientation}`, className)}
        style={style}
        role="group"
        {...(ariaLabel !== undefined
          ? { "aria-label": ariaLabel }
          : ariaLabelledBy === undefined
            ? { "aria-label": mergedMessages.workflowLabel }
            : {})}
        {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
        {...(ariaDescribedBy !== undefined ? { "aria-describedby": ariaDescribedBy } : {})}
        dir={dir}
        data-workflow-orientation={orientation}
        data-workflow-navigation-mode={navigationMode}
      >
        {children ?? <DefaultLayout />}
        <div
          ref={announcerRef}
          aria-live="polite"
          aria-atomic="true"
          className="kui-workflow__announcer"
          data-workflow-announcer=""
        />
      </div>
    </WorkflowContext.Provider>
  );
}

function joinClass(...parts: readonly (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function DefaultLayout(): ReactNode {
  const ctx = useWorkflow();
  return (
    <>
      {ctx.showProgress ? <WorkflowProgress /> : null}
      <WorkflowList>
        {ctx.steps.map((step) => (
          <WorkflowStepComponent key={step.id} stepId={step.id} />
        ))}
      </WorkflowList>
    </>
  );
}

// ─── List ────────────────────────────────────────────────────────

function WorkflowList(props: WorkflowListProps = {}): ReactNode {
  const ctx = useWorkflow();
  const { className, style, children } = props;

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const action = resolveWorkflowAction(
        {
          key: e.key,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        },
        ctx.keymap,
      );
      if (!action) return;
      dispatchKeyboardAction(action, e, ctx);
    },
    [ctx],
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      id={ctx.listId}
      role="list"
      aria-label={ctx.messages.workflowLabel}
      className={joinClass("kui-workflow__list", className)}
      style={style}
      data-workflow-list=""
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

// ─── Step ────────────────────────────────────────────────────────

const StepInternalContext = createContext<{
  readonly step: WorkflowStep;
  readonly index: number;
  readonly resolvedState: WorkflowStepState;
  readonly isCurrent: boolean;
  readonly isFocused: boolean;
} | null>(null);
StepInternalContext.displayName = "WorkflowStepContext";

function useStepContext(): {
  readonly step: WorkflowStep;
  readonly index: number;
  readonly resolvedState: WorkflowStepState;
  readonly isCurrent: boolean;
  readonly isFocused: boolean;
} {
  const value = useContext(StepInternalContext);
  if (!value) throw new Error("WorkflowStep subcomponents must be used inside <Workflow.Step>");
  return value;
}

function WorkflowStepComponent(props: WorkflowStepProps): ReactNode {
  const ctx = useWorkflow();
  const { stepId, className, style, children } = props;
  const index = ctx.steps.findIndex((s) => s.id === stepId);
  const step = ctx.steps[index];
  const resolvedEntry = ctx.resolved.find((r) => r.step.id === stepId);

  const onClick = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      ctx.activateStep(stepId, e.nativeEvent);
      ctx.setFocusedStepId(stepId);
    },
    [ctx, stepId],
  );

  const onFocus = useCallback(() => {
    ctx.setFocusedStepId(stepId);
  }, [ctx, stepId]);

  const stepContext = useMemo(() => {
    if (!step || !resolvedEntry) return null;
    return {
      step,
      index,
      resolvedState: resolvedEntry.resolvedState,
      isCurrent: resolvedEntry.isCurrent,
      isFocused: ctx.state.focusedStepId === stepId,
    };
  }, [ctx.state.focusedStepId, index, resolvedEntry, step, stepId]);

  if (!step || !resolvedEntry || !stepContext) return null;

  const { resolvedState, isCurrent, isFocused } = stepContext;
  const isDisabled = step.disabled === true;
  const isError = resolvedState === "error";
  const isCompleted = resolvedState === "completed";
  const isOptional = step.optional === true;
  const total = ctx.steps.length;

  const showConnector = ctx.showConnectors && index < ctx.steps.length - 1;

  const rendered = ctx.renderStep
    ? ctx.renderStep({ step, index, state: resolvedState, isCurrent, isFocused })
    : (defaultStepBody(
        step,
        index,
        resolvedState,
        ctx.showIndex,
        ctx.messages,
      ) satisfies ReactNode);

  return (
    <StepInternalContext.Provider value={stepContext}>
      <div
        role="listitem"
        aria-posinset={index + 1}
        aria-setsize={total}
        className={joinClass(
          "kui-workflow__step-wrapper",
          `kui-workflow__step-wrapper--${resolvedState}`,
          isCurrent && "kui-workflow__step-wrapper--current",
          isDisabled && "kui-workflow__step-wrapper--disabled",
          isOptional && "kui-workflow__step-wrapper--optional",
        )}
        style={style}
        data-workflow-step-wrapper={stepId}
        data-workflow-step-state={resolvedState}
      >
        <button
          type="button"
          aria-current={isCurrent ? "step" : undefined}
          aria-label={ctx.messages.stepAriaLabel(step, index, total)}
          aria-disabled={isDisabled || undefined}
          aria-describedby={
            step.description !== undefined ? `${ctx.rootId}-desc-${stepId}` : undefined
          }
          className={joinClass(
            "kui-workflow__step",
            `kui-workflow__step--${resolvedState}`,
            isCurrent && "kui-workflow__step--current",
            isDisabled && "kui-workflow__step--disabled",
            isOptional && "kui-workflow__step--optional",
            className,
          )}
          disabled={isDisabled}
          tabIndex={isFocused ? 0 : -1}
          data-workflow-step={stepId}
          data-workflow-step-index={index}
          onClick={onClick}
          onFocus={onFocus}
        >
          {children ?? rendered}
        </button>
        {step.description !== undefined ? (
          <div
            id={`${ctx.rootId}-desc-${stepId}`}
            className="kui-workflow__step-description-offscreen"
          >
            {step.description}
          </div>
        ) : null}
        {showConnector ? <WorkflowConnector /> : null}
        <span
          className="kui-workflow__step-sr-status"
          aria-hidden="true"
          data-workflow-status={resolvedState}
        >
          {isCurrent
            ? ctx.messages.currentLabel
            : isCompleted
              ? ctx.messages.completedLabel
              : isError
                ? ctx.messages.errorLabel
                : isDisabled
                  ? ctx.messages.disabledLabel
                  : null}
        </span>
      </div>
    </StepInternalContext.Provider>
  );
}

function defaultStepBody(
  step: WorkflowStep,
  index: number,
  resolvedState: WorkflowStepState,
  showIndex: boolean,
  messages: WorkflowContextValue["messages"],
): ReactNode {
  return (
    <>
      <WorkflowStepIconInline
        step={step}
        index={index}
        state={resolvedState}
        showIndex={showIndex}
      />
      <span className="kui-workflow__step-body">
        <span className="kui-workflow__step-label">
          {step.label}
          {step.optional === true ? (
            <span className="kui-workflow__step-optional-hint">
              {" ("}
              {messages.optionalLabel}
              {")"}
            </span>
          ) : null}
        </span>
        {step.description !== undefined ? (
          <span className="kui-workflow__step-description">{step.description}</span>
        ) : null}
      </span>
    </>
  );
}

function WorkflowStepIconInline(props: {
  readonly step: WorkflowStep;
  readonly index: number;
  readonly state: WorkflowStepState;
  readonly showIndex: boolean;
}): ReactNode {
  const { state, index, showIndex } = props;
  const content =
    state === "completed" ? "✓" : state === "error" ? "!" : showIndex ? String(index + 1) : "";
  return (
    <span
      className={joinClass("kui-workflow__step-icon", `kui-workflow__step-icon--${state}`)}
      aria-hidden="true"
      data-workflow-step-icon={state}
    >
      {content}
    </span>
  );
}

// ─── Icon / Label / Description compound children ─────────────────

function WorkflowStepIcon(props: WorkflowStepIconProps = {}): ReactNode {
  const { className, style, children } = props;
  const { step, index, resolvedState } = useStepContext();
  return children !== undefined ? (
    <span
      className={joinClass(
        "kui-workflow__step-icon",
        `kui-workflow__step-icon--${resolvedState}`,
        className,
      )}
      style={style}
      aria-hidden="true"
      data-workflow-step-icon={resolvedState}
    >
      {children}
    </span>
  ) : (
    <WorkflowStepIconInline step={step} index={index} state={resolvedState} showIndex />
  );
}

function WorkflowStepLabel(props: WorkflowStepLabelProps = {}): ReactNode {
  const { className, style, children } = props;
  const { step } = useStepContext();
  return (
    <span
      className={joinClass("kui-workflow__step-label", className)}
      style={style}
      data-workflow-step-label=""
    >
      {children ?? step.label}
    </span>
  );
}

function WorkflowStepDescription(props: WorkflowStepDescriptionProps = {}): ReactNode {
  const { className, style, children } = props;
  const { step } = useStepContext();
  if (children === undefined && step.description === undefined) return null;
  return (
    <span
      className={joinClass("kui-workflow__step-description", className)}
      style={style}
      data-workflow-step-description=""
    >
      {children ?? step.description}
    </span>
  );
}

// ─── Connector ───────────────────────────────────────────────────

function WorkflowConnector(props: WorkflowConnectorProps = {}): ReactNode {
  const { className, style } = props;
  return (
    <span
      className={joinClass("kui-workflow__connector", className)}
      style={style}
      role="presentation"
      aria-hidden="true"
      data-workflow-connector=""
    />
  );
}

// ─── Progress ────────────────────────────────────────────────────

function WorkflowProgress(props: WorkflowProgressProps = {}): ReactNode {
  const ctx = useWorkflow();
  const { className, style } = props;
  const { completed, total } = ctx.progress;
  const value = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div
      className={joinClass("kui-workflow__progress", className)}
      style={style}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={ctx.messages.progressLabel(completed, total)}
      data-workflow-progress=""
    >
      <div
        className="kui-workflow__progress-bar"
        style={{ width: `${String(value)}%` }}
        data-workflow-progress-bar=""
      />
    </div>
  );
}

// ─── Nav (Prev / Next buttons) ───────────────────────────────────

function WorkflowNav(): ReactNode {
  const ctx = useWorkflow();
  const prevId = findAdjacentStep(ctx.steps, ctx.state.currentStepId, "previous");
  const nextId = findAdjacentStep(ctx.steps, ctx.state.currentStepId, "next");
  return (
    <div className="kui-workflow__nav" data-workflow-nav="">
      <button
        type="button"
        disabled={prevId === null}
        className="kui-workflow__nav-btn"
        data-workflow-nav-prev=""
        onClick={(e) => {
          ctx.navigate("previous", e.nativeEvent);
        }}
      >
        Previous
      </button>
      <button
        type="button"
        disabled={nextId === null}
        className="kui-workflow__nav-btn"
        data-workflow-nav-next=""
        onClick={(e) => {
          ctx.navigate("next", e.nativeEvent);
        }}
      >
        Next
      </button>
    </div>
  );
}

// ─── Keyboard dispatcher ─────────────────────────────────────────

function dispatchKeyboardAction(
  action: WorkflowAction,
  e: ReactKeyboardEvent<HTMLDivElement>,
  ctx: WorkflowContextValue,
): void {
  const { steps, orientation, dir } = ctx;
  const focusedId = ctx.state.focusedStepId;
  const focused = steps.findIndex((s) => s.id === focusedId);
  const currentIdx = focused >= 0 ? focused : 0;

  const previousKeyForOrientation = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
  const nextKeyForOrientation = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
  const orthPrev = orientation === "vertical" ? "ArrowLeft" : "ArrowUp";
  const orthNext = orientation === "vertical" ? "ArrowRight" : "ArrowDown";

  // Only navigate on the axis matching orientation. Orthogonal arrows
  // are treated as no-ops so the user's keyboard focus stays put.
  if (e.key === orthPrev || e.key === orthNext) return;

  const moveFocusRelative = (fromIndex: number, delta: number): void => {
    let i = fromIndex + delta;
    while (i >= 0 && i < steps.length) {
      const s = steps[i];
      if (s && s.disabled !== true) {
        ctx.setFocusedStepId(s.id);
        focusStep(ctx.listId, s.id);
        return;
      }
      i += delta;
    }
  };

  switch (action) {
    case "moveFocusPrevious": {
      e.preventDefault();
      // RTL swap only for horizontal orientation.
      const rtlDelta =
        orientation === "horizontal" && dir === "rtl" && e.key === previousKeyForOrientation
          ? 1
          : -1;
      moveFocusRelative(currentIdx, rtlDelta);
      return;
    }
    case "moveFocusNext": {
      e.preventDefault();
      const rtlDelta =
        orientation === "horizontal" && dir === "rtl" && e.key === nextKeyForOrientation ? -1 : 1;
      moveFocusRelative(currentIdx, rtlDelta);
      return;
    }
    case "moveFocusFirst": {
      e.preventDefault();
      const id = firstEnabledStep(steps);
      if (id !== null) {
        ctx.setFocusedStepId(id);
        focusStep(ctx.listId, id);
      }
      return;
    }
    case "moveFocusLast": {
      e.preventDefault();
      const id = lastEnabledStep(steps);
      if (id !== null) {
        ctx.setFocusedStepId(id);
        focusStep(ctx.listId, id);
      }
      return;
    }
    case "activate": {
      e.preventDefault();
      if (focusedId !== null) {
        ctx.activateStep(focusedId, e.nativeEvent);
      }
      return;
    }
    default:
      return;
  }
}

function focusStep(listId: string, stepId: string): void {
  const list = document.getElementById(listId);
  if (!list) return;
  const el = list.querySelector<HTMLElement>(`[data-workflow-step="${cssEscape(stepId)}"]`);
  el?.focus();
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}

// ─── Compound + exports ──────────────────────────────────────────

interface WorkflowCompound {
  (props: WorkflowRootProps): ReactNode;
  readonly displayName?: string;
  readonly Root: typeof WorkflowRoot;
  readonly List: typeof WorkflowList;
  readonly Step: typeof WorkflowStepComponent;
  readonly StepIcon: typeof WorkflowStepIcon;
  readonly StepLabel: typeof WorkflowStepLabel;
  readonly StepDescription: typeof WorkflowStepDescription;
  readonly Connector: typeof WorkflowConnector;
  readonly Progress: typeof WorkflowProgress;
  readonly Nav: typeof WorkflowNav;
}

const WorkflowImpl = WorkflowRoot as unknown as WorkflowCompound & {
  displayName: string;
};
Object.assign(WorkflowImpl, {
  Root: WorkflowRoot,
  List: WorkflowList,
  Step: WorkflowStepComponent,
  StepIcon: WorkflowStepIcon,
  StepLabel: WorkflowStepLabel,
  StepDescription: WorkflowStepDescription,
  Connector: WorkflowConnector,
  Progress: WorkflowProgress,
  Nav: WorkflowNav,
});
WorkflowImpl.displayName = "Workflow";

export const Workflow: WorkflowCompound = WorkflowImpl;

export {
  WorkflowRoot,
  WorkflowList,
  WorkflowStepComponent as WorkflowStep,
  WorkflowStepIcon,
  WorkflowStepLabel,
  WorkflowStepDescription,
  WorkflowConnector,
  WorkflowProgress,
  WorkflowNav,
};

export type { WorkflowStepRenderer };
