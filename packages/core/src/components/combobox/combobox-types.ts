import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── Combobox Props ─────────────────────────────────────────────────

export interface ComboboxProps {
  /** Controlled selected value (the committed selection). */
  value?: string;
  /** Initial selected value for uncontrolled mode. */
  defaultValue?: string;
  /** Called when the selected value changes. */
  onValueChange?: (value: string) => void;
  /** Controlled input text. */
  inputValue?: string;
  /** Initial input text for uncontrolled mode. */
  defaultInputValue?: string;
  /** Called when input text changes (filtering responsibility is on the consumer). */
  onInputValueChange?: (inputValue: string) => void;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state. */
  defaultOpen?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Form submission name. */
  name?: string;
  /** Whether the combobox is disabled. */
  disabled?: boolean;
  /** Whether a value is required. */
  required?: boolean;
  /** Whether freeform input is allowed (value doesn't need to match an item). */
  allowCustomValue?: boolean;
  children?: ReactNode;
}

// ─── Combobox Input Props ───────────────────────────────────────────

export interface ComboboxInputProps {
  /** Placeholder text. */
  placeholder?: string;
  className?: string;
  id?: string;
}

// ─── Combobox Trigger Props ─────────────────────────────────────────

export interface ComboboxTriggerProps {
  children?: ReactNode;
  className?: string;
}

// ─── Combobox Clear Props ───────────────────────────────────────────

export interface ComboboxClearProps {
  children?: ReactNode;
  className?: string;
}

// ─── Combobox Content Props ─────────────────────────────────────────

export interface ComboboxContentProps {
  children?: ReactNode;
  className?: string;
}

// ─── Combobox Item Props ────────────────────────────────────────────

export interface ComboboxItemProps {
  /** Unique value for this item. */
  value: string;
  /** Human-readable label (for display and matching). Falls back to text content. */
  label?: string;
  /** Whether this item is disabled. */
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

// ─── Combobox Empty Props ───────────────────────────────────────────

export interface ComboboxEmptyProps {
  children?: ReactNode;
  className?: string;
}

// ─── Combobox Group Props ───────────────────────────────────────────

export interface ComboboxGroupProps {
  children?: ReactNode;
  className?: string;
}

export interface ComboboxLabelProps {
  children?: ReactNode;
  className?: string;
}

// ─── Combobox Context ───────────────────────────────────────────────

export interface ComboboxContextValue {
  // State
  value: string | undefined;
  inputValue: string;
  open: boolean;
  disabled: boolean;
  required: boolean;
  allowCustomValue: boolean;
  highlightedValue: string | undefined;

  // Actions
  onValueChange: (value: string) => void;
  onInputValueChange: (inputValue: string) => void;
  onOpenChange: (open: boolean) => void;
  setHighlightedValue: (value: string | undefined) => void;
  clearValue: () => void;

  // IDs for ARIA relationships
  inputId: string;
  listboxId: string;
  triggerId: string;
}

export const ComboboxContext = createContext<ComboboxContextValue | null>(null);
ComboboxContext.displayName = "ComboboxContext";

export function useComboboxContext(): ComboboxContextValue {
  const ctx = useContext(ComboboxContext);
  if (ctx === null) {
    throw new Error("[KairoUI] Combobox parts must be used inside a <Combobox> component.");
  }
  return ctx;
}
