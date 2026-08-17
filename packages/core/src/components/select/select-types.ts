import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── Select Value Types ─────────────────────────────────────────────

export interface SelectProps {
  /** Controlled selected value. */
  value?: string;
  /** Initial value for uncontrolled mode. */
  defaultValue?: string;
  /** Called when selection changes. */
  onValueChange?: (value: string) => void;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state. */
  defaultOpen?: boolean;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Form submission name. */
  name?: string;
  /** Whether the select is disabled. */
  disabled?: boolean;
  /** Whether a value is required. */
  required?: boolean;
  children?: ReactNode;
}

// ─── Select Trigger Types ───────────────────────────────────────────

export interface SelectTriggerProps {
  /** Placeholder text when no value is selected. */
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  id?: string;
}

// ─── Select Content Types ───────────────────────────────────────────

export type SelectContentPosition = "popper" | "item-aligned";

export interface SelectContentProps {
  /** Positioning strategy. */
  position?: SelectContentPosition;
  children?: ReactNode;
  className?: string;
}

// ─── Select Item Types ──────────────────────────────────────────────

export interface SelectItemProps {
  /** Unique value for this item. */
  value: string;
  /** Human-readable label (used for typeahead and accessible name). Falls back to text content. */
  label?: string;
  /** Whether this item is disabled. */
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

// ─── Select Group Types ─────────────────────────────────────────────

export interface SelectGroupProps {
  children?: ReactNode;
  className?: string;
}

export interface SelectLabelProps {
  children?: ReactNode;
  className?: string;
}

export interface SelectSeparatorProps {
  className?: string;
}

// ─── Select Context ─────────────────────────────────────────────────

export interface SelectContextValue {
  // State
  value: string | undefined;
  open: boolean;
  disabled: boolean;
  required: boolean;
  highlightedValue: string | undefined;

  // Actions
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  setHighlightedValue: (value: string | undefined) => void;

  // IDs for ARIA relationships
  triggerId: string;
  contentId: string;
  valueId: string;
}

export const SelectContext = createContext<SelectContextValue | null>(null);
SelectContext.displayName = "SelectContext";

export function useSelectContext(): SelectContextValue {
  const ctx = useContext(SelectContext);
  if (ctx === null) {
    throw new Error("[KairoUI] Select parts must be used inside a <Select> component.");
  }
  return ctx;
}
