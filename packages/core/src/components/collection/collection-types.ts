// ─── Collection Item Types ──────────────────────────────────────────

/**
 * Represents a single item in a collection (Select, Combobox, ToggleGroup, etc.).
 * Items are identified by a string `value` (unique within the collection).
 */
export interface CollectionItem {
  /** Unique string value identifying this item. Used for selection and form submission. */
  value: string;
  /** Human-readable label. Used for typeahead and accessible names. */
  label: string;
  /** Whether this item is disabled (cannot be selected or highlighted). */
  disabled?: boolean;
}

// ─── Selection Types ────────────────────────────────────────────────

/** Single-selection state: one value or none. */
export type SingleSelectionValue = string | undefined;

/** Multi-selection state: zero or more values. */
export type MultiSelectionValue = string[];

/**
 * Props contract for single-selection components (Select, Combobox single).
 * Uses value/defaultValue/onValueChange pattern.
 */
export interface SingleSelectionProps {
  /** Controlled selected value. */
  value?: string;
  /** Initial value for uncontrolled mode. */
  defaultValue?: string;
  /** Called when selection changes. */
  onValueChange?: (value: string) => void;
}

/**
 * Props contract for multi-selection components (Combobox multi, ToggleGroup multi).
 * Uses value/defaultValue/onValueChange with arrays.
 */
export interface MultiSelectionProps {
  /** Controlled selected values. */
  value?: string[];
  /** Initial values for uncontrolled mode. */
  defaultValue?: string[];
  /** Called when selection changes. */
  onValueChange?: (value: string[]) => void;
}

// ─── Highlight (Active Descendant) Types ────────────────────────────

/**
 * Represents which item in a collection is currently highlighted
 * (receives visual focus indicator, announced by screen reader via aria-activedescendant).
 */
export interface HighlightState {
  /** Value of the currently highlighted item, or undefined if none. */
  highlightedValue: string | undefined;
}

// ─── Navigation Direction ───────────────────────────────────────────

export type NavigationDirection = "next" | "previous" | "first" | "last";

// ─── Typeahead ──────────────────────────────────────────────────────

/**
 * Configuration for keyboard typeahead (type-to-select) in collection components.
 */
export interface TypeaheadConfig {
  /** Whether typeahead is enabled. Defaults to true. */
  enabled?: boolean;
  /** Debounce timeout in ms before resetting the search buffer. Defaults to 500. */
  timeout?: number;
}

// ─── Form Participation ─────────────────────────────────────────────

/**
 * Props for native form participation via hidden input.
 * Used by components that don't render a native <select> or <input>.
 */
export interface FormParticipationProps {
  /** Form submission name. */
  name?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Whether the field is disabled. */
  disabled?: boolean;
}
