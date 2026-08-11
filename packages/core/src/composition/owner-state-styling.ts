import type { OwnerState } from "./state-styles";
import { resolveActiveStates, stateToDataAttributes, resolveDataState } from "./state-styles";
import type { ComponentState } from "./component-factory-contract";

// ─── Types ──────────────────────────────────────────────────────────

/** Complete owner-state styling output — everything needed to style a component from its state. */
export interface OwnerStateStyleResult {
  /** Data attributes for CSS state selectors (data-disabled, data-loading, etc.). */
  readonly dataAttributes: Record<string, string>;
  /** The data-state attribute value ("default", "disabled", "loading", etc.). */
  readonly dataState: string;
  /** Active state names for style resolution (priority-ordered). */
  readonly activeStates: readonly string[];
  /** The ComponentState for the factory (disabled, loading, dataState). */
  readonly factoryState: ComponentState;
}

// ─── Integration ────────────────────────────────────────────────────

/**
 * Resolves owner state into all styling outputs.
 *
 * This is the bridge between Phase 5 component state and Phase 6 styling:
 * - Generates data-* attributes for CSS selectors (never exposes full state object to DOM)
 * - Computes data-state value
 * - Lists active states for style resolution
 * - Produces ComponentState for the factory
 */
export function resolveOwnerStateStyling(state: OwnerState): OwnerStateStyleResult {
  return {
    dataAttributes: stateToDataAttributes(state),
    dataState: resolveDataState(state),
    activeStates: resolveActiveStates(state),
    factoryState: {
      disabled: state.disabled === true || state.loading === true,
      loading: state.loading === true,
      dataState: resolveDataState(state),
    },
  };
}

/**
 * Creates an OwnerState from component props.
 * Maps common component prop patterns to the standardized OwnerState interface.
 */
export function ownerStateFromProps(props: {
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  loading?: boolean | undefined;
  selected?: boolean | undefined;
  checked?: boolean | undefined;
  expanded?: boolean | undefined;
  open?: boolean | undefined;
  invalid?: boolean | undefined;
}): OwnerState {
  return {
    disabled: props.disabled === true,
    readOnly: props.readOnly === true,
    loading: props.loading === true,
    selected: props.selected === true,
    checked: props.checked === true,
    expanded: props.expanded === true,
    open: props.open === true,
    invalid: props.invalid === true,
  };
}

/**
 * Merges owner state data attributes into a props object.
 * Only adds data attributes — never passes the OwnerState object to the DOM.
 */
export function applyStateToProps(
  props: Record<string, unknown>,
  state: OwnerState,
): Record<string, unknown> {
  const result = { ...props };
  const attrs = stateToDataAttributes(state);
  for (const [key, value] of Object.entries(attrs)) {
    result[key] = value;
  }
  result["data-state"] = resolveDataState(state);
  return result;
}
