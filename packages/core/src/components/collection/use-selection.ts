import { useCallback } from "react";
import { useControllableState } from "@kairoui/hooks";
import type { CollectionState } from "./use-collection";

// ─── Single Selection ───────────────────────────────────────────────

export interface UseSingleSelectionOptions {
  /** Controlled selected value. */
  value?: string;
  /** Initial value for uncontrolled mode. */
  defaultValue?: string;
  /** Called when selection changes. */
  onValueChange?: (value: string) => void;
  /** Collection state for disabled-item validation. Optional. */
  collection?: CollectionState | null;
}

export interface SingleSelectionState {
  /** Currently selected value. */
  selectedValue: string | undefined;
  /** Select an item by value. Skips disabled items. */
  select: (value: string) => void;
  /** Clear the selection. */
  clear: () => void;
  /** Check if a given value is selected. */
  isSelected: (value: string) => boolean;
}

export function useSingleSelection(options: UseSingleSelectionOptions): SingleSelectionState {
  const { value, defaultValue, onValueChange, collection } = options;

  const [selectedValue, setSelectedValue] = useControllableState<string | undefined>({
    value,
    defaultValue: defaultValue ?? undefined,
    ...(onValueChange
      ? { onChange: onValueChange as (value: string | undefined) => void }
      : undefined),
    name: "Selection",
    state: "value",
  });

  const select = useCallback(
    (itemValue: string) => {
      if (collection) {
        const item = collection.getByValue(itemValue);
        if (item?.disabled) return;
      }
      setSelectedValue(itemValue);
    },
    [collection, setSelectedValue],
  );

  const clear = useCallback(() => {
    setSelectedValue(undefined);
  }, [setSelectedValue]);

  const isSelected = useCallback(
    (itemValue: string) => selectedValue === itemValue,
    [selectedValue],
  );

  return { selectedValue, select, clear, isSelected };
}

// ─── Multi Selection ────────────────────────────────────────────────

export interface UseMultiSelectionOptions {
  /** Controlled selected values. */
  value?: string[];
  /** Initial values for uncontrolled mode. */
  defaultValue?: string[];
  /** Called when selection changes. */
  onValueChange?: (value: string[]) => void;
  /** Collection state for disabled-item validation. Optional. */
  collection?: CollectionState | null;
}

export interface MultiSelectionState {
  /** Currently selected values. */
  selectedValues: string[];
  /** Toggle an item's selection. Skips disabled items. */
  toggle: (value: string) => void;
  /** Select an item (add to selection). Skips disabled items. */
  select: (value: string) => void;
  /** Deselect an item (remove from selection). */
  deselect: (value: string) => void;
  /** Clear all selections. */
  clear: () => void;
  /** Check if a given value is selected. */
  isSelected: (value: string) => boolean;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function useMultiSelection(options: UseMultiSelectionOptions): MultiSelectionState {
  const { value, defaultValue, onValueChange, collection } = options;

  const [selectedValues, setSelectedValues] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    ...(onValueChange ? { onChange: onValueChange } : undefined),
    isEqual: arraysEqual,
    name: "Selection",
    state: "value",
  });

  const isDisabled = useCallback(
    (itemValue: string): boolean => {
      if (!collection) return false;
      const item = collection.getByValue(itemValue);
      return item?.disabled === true;
    },
    [collection],
  );

  const toggle = useCallback(
    (itemValue: string) => {
      if (isDisabled(itemValue)) return;
      setSelectedValues((prev) =>
        prev.includes(itemValue) ? prev.filter((v) => v !== itemValue) : [...prev, itemValue],
      );
    },
    [isDisabled, setSelectedValues],
  );

  const select = useCallback(
    (itemValue: string) => {
      if (isDisabled(itemValue)) return;
      setSelectedValues((prev) => (prev.includes(itemValue) ? prev : [...prev, itemValue]));
    },
    [isDisabled, setSelectedValues],
  );

  const deselect = useCallback(
    (itemValue: string) => {
      setSelectedValues((prev) => prev.filter((v) => v !== itemValue));
    },
    [setSelectedValues],
  );

  const clear = useCallback(() => {
    setSelectedValues([]);
  }, [setSelectedValues]);

  const isSelected = useCallback(
    (itemValue: string) => selectedValues.includes(itemValue),
    [selectedValues],
  );

  return { selectedValues, toggle, select, deselect, clear, isSelected };
}
