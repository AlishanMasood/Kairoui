import { createContext, useContext } from "react";

// ─── Shared Selection Types ─────────────────────────────────────────

/**
 * Base props shared by all selection controls (Checkbox, Radio, Switch).
 * These components use checked/defaultChecked (not value/defaultValue)
 * because they represent a boolean on/off or selected/unselected state.
 */
export interface SelectionControlBaseProps {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state for uncontrolled usage. */
  defaultChecked?: boolean;
  /** Called when checked state changes. Receives the new checked value. */
  onCheckedChange?: (checked: boolean) => void;
  /** Form submission name. */
  name?: string;
  /** Form submission value (defaults to "on" per HTML spec). */
  value?: string;
  /** Disables the control. */
  disabled?: boolean;
  /** Marks as required for form validation. */
  required?: boolean;
}

// ─── RadioGroup Context ─────────────────────────────────────────────

export interface RadioGroupContextValue {
  /** The currently selected value in the group. */
  value: string | undefined;
  /** Called when a radio in the group is selected. */
  onValueChange: (value: string) => void;
  /** Group name for form submission (all radios share this name). */
  name: string | undefined;
  /** Whether the entire group is disabled. */
  disabled: boolean;
  /** Whether the group is required (at least one must be selected). */
  required: boolean;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
RadioGroupContext.displayName = "RadioGroupContext";

export function useRadioGroupContext(): RadioGroupContextValue | null {
  return useContext(RadioGroupContext);
}
