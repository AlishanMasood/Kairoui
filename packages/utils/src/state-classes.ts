/** Approved component states for class name generation. */
export type ComponentState =
  | "disabled"
  | "readOnly"
  | "loading"
  | "focused"
  | "focusVisible"
  | "hovered"
  | "pressed"
  | "selected"
  | "invalid"
  | "valid"
  | "expanded"
  | "checked";

/** Map of state names to boolean values. */
export type StateMap = Partial<Record<ComponentState, boolean>>;

export interface StateClassOptions {
  /** Prefix for generated class names. Defaults to "kui". */
  prefix?: string;
}

// Kebab-case lookup for each state
const STATE_CLASS_MAP: Record<ComponentState, string> = {
  disabled: "is-disabled",
  readOnly: "is-read-only",
  loading: "is-loading",
  focused: "is-focused",
  focusVisible: "is-focus-visible",
  hovered: "is-hovered",
  pressed: "is-pressed",
  selected: "is-selected",
  invalid: "is-invalid",
  valid: "is-valid",
  expanded: "is-expanded",
  checked: "is-checked",
};

// Stable iteration order for deterministic output
const STATE_ORDER: readonly ComponentState[] = [
  "disabled",
  "readOnly",
  "loading",
  "focused",
  "focusVisible",
  "hovered",
  "pressed",
  "selected",
  "invalid",
  "valid",
  "expanded",
  "checked",
];

/**
 * Resolves a state map into an array of class name strings.
 * Only truthy states produce classes. Order is stable (not insertion-order dependent).
 */
export function resolveStateClasses(states: StateMap, options: StateClassOptions = {}): string[] {
  const prefix = options.prefix ?? "kui";
  const classes: string[] = [];

  for (const state of STATE_ORDER) {
    if (states[state]) {
      classes.push(`${prefix}-${STATE_CLASS_MAP[state]}`);
    }
  }

  return classes;
}

/**
 * Resolves a state map into a single space-separated class string.
 * Returns empty string if no states are active.
 */
export function stateClasses(states: StateMap, options: StateClassOptions = {}): string {
  return resolveStateClasses(states, options).join(" ");
}
