import type { StyleProperties, TokenReference } from "./style-contract";

// ─── Owner State ────────────────────────────────────────────────────

/** Standard component interaction states. */
export interface OwnerState {
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly loading?: boolean | undefined;
  readonly focused?: boolean | undefined;
  readonly focusVisible?: boolean | undefined;
  readonly hovered?: boolean | undefined;
  readonly pressed?: boolean | undefined;
  readonly selected?: boolean | undefined;
  readonly checked?: boolean | undefined;
  readonly expanded?: boolean | undefined;
  readonly invalid?: boolean | undefined;
  readonly open?: boolean | undefined;
}

/** All recognized state names. */
export type StateName = keyof OwnerState;

/** Ordered list of states for deterministic resolution (later wins). */
const STATE_PRIORITY: readonly StateName[] = [
  "hovered",
  "focused",
  "focusVisible",
  "pressed",
  "selected",
  "checked",
  "expanded",
  "open",
  "readOnly",
  "invalid",
  "loading",
  "disabled",
];

// ─── State Style Resolution ─────────────────────────────────────────

/** A map of state names to their style overrides. */
export type StateStyleDefinition = Readonly<Partial<Record<StateName, StyleProperties>>>;

/**
 * Resolves which state styles should apply given the current owner state.
 * Returns an ordered array of active states (lowest to highest priority).
 *
 * Priority order (later wins for conflicting properties):
 * hovered < focused < focusVisible < pressed < selected < checked <
 * expanded < open < readOnly < invalid < loading < disabled
 */
export function resolveActiveStates(state: OwnerState): readonly StateName[] {
  const active: StateName[] = [];
  for (const name of STATE_PRIORITY) {
    if (state[name] === true) {
      active.push(name);
    }
  }
  return active;
}

/**
 * Resolves the merged style properties for the current owner state.
 * Applies state styles in priority order — later states override earlier ones.
 *
 * Returns undefined if no state styles apply (no active states or no matching definitions).
 */
export function resolveStateStyles(
  stateStyles: StateStyleDefinition,
  state: OwnerState,
): StyleProperties | undefined {
  const active = resolveActiveStates(state);
  if (active.length === 0) return undefined;

  let hasMatch = false;
  const result: Record<string, string | TokenReference> = {};

  for (const name of active) {
    const styles = stateStyles[name];
    if (styles) {
      hasMatch = true;
      for (const key of Object.keys(styles)) {
        const value = styles[key];
        if (value !== undefined) {
          result[key] = value;
        }
      }
    }
  }

  return hasMatch ? result : undefined;
}

/**
 * Generates data-* attributes from the current owner state.
 * Returns attributes for all truthy states.
 */
export function stateToDataAttributes(state: OwnerState): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const name of STATE_PRIORITY) {
    if (state[name] === true) {
      attrs[`data-${camelToKebab(name)}`] = "";
    }
  }
  return attrs;
}

/**
 * Generates the data-state attribute value from the owner state.
 * Returns the highest-priority active state name, or "default".
 */
export function resolveDataState(state: OwnerState): string {
  for (let i = STATE_PRIORITY.length - 1; i >= 0; i--) {
    const name = STATE_PRIORITY[i];
    if (name !== undefined && state[name] === true) {
      return camelToKebab(name);
    }
  }
  return "default";
}

/** Converts camelCase to kebab-case. */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
