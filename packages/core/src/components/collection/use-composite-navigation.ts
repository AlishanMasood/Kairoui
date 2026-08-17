import { useCallback, useRef, useState } from "react";
import type { RegisteredItem } from "./use-collection";
import type { NavigationDirection } from "./collection-types";
import { resolveNextItem } from "./collection-navigation";

export type CompositeOrientation = "horizontal" | "vertical" | "both";

export interface UseCompositeNavigationOptions {
  /** Ordered items to navigate through. */
  items: readonly RegisteredItem[];
  /** Layout orientation — determines which arrow keys are active. */
  orientation?: CompositeOrientation;
  /** Whether navigation wraps at boundaries. Defaults to true. */
  loop?: boolean;
  /** Called when highlighted item changes. */
  onHighlightChange?: (value: string | undefined) => void;
  /** Called when an item is activated (Enter/Space). */
  onSelect?: (value: string) => void;
  /** Typeahead configuration. */
  typeahead?: boolean;
  /** Typeahead debounce in ms. Defaults to 500. */
  typeaheadTimeout?: number;
}

export interface CompositeNavigationState {
  /** Currently highlighted item value. */
  highlightedValue: string | undefined;
  /** Set highlighted value directly. */
  setHighlightedValue: (value: string | undefined) => void;
  /** Keyboard event handler to spread on the composite container. */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useCompositeNavigation(
  options: UseCompositeNavigationOptions,
): CompositeNavigationState {
  const {
    items,
    orientation = "vertical",
    loop = true,
    onHighlightChange,
    onSelect,
    typeahead = false,
    typeaheadTimeout = 500,
  } = options;

  const [highlightedValue, setHighlightedValueInternal] = useState<string | undefined>(undefined);
  const typeaheadBufferRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setHighlightedValue = useCallback(
    (value: string | undefined) => {
      setHighlightedValueInternal(value);
      onHighlightChange?.(value);
    },
    [onHighlightChange],
  );

  const navigate = useCallback(
    (direction: NavigationDirection) => {
      const resolvedItems = loop ? items : items; // resolveNextItem already wraps; we clamp below if !loop

      const next = resolveNextItem(resolvedItems, highlightedValue, direction);
      if (!next) return;

      // If not looping, don't wrap
      if (!loop && highlightedValue !== undefined) {
        const enabled = items.filter((i) => !i.disabled);
        const currentIdx = enabled.findIndex((i) => i.value === highlightedValue);
        if (direction === "next" && currentIdx === enabled.length - 1) return;
        if (direction === "previous" && currentIdx === 0) return;
      }

      setHighlightedValue(next.value);
    },
    [items, highlightedValue, loop, setHighlightedValue],
  );

  const handleTypeahead = useCallback(
    (char: string) => {
      if (!typeahead) return;

      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current);
      }

      typeaheadBufferRef.current += char.toLowerCase();

      const match = items.find(
        (i) => !i.disabled && i.label.toLowerCase().startsWith(typeaheadBufferRef.current),
      );
      if (match) {
        setHighlightedValue(match.value);
      }

      typeaheadTimerRef.current = setTimeout(() => {
        typeaheadBufferRef.current = "";
      }, typeaheadTimeout);
    },
    [typeahead, typeaheadTimeout, items, setHighlightedValue],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isVertical = orientation === "vertical" || orientation === "both";
      const isHorizontal = orientation === "horizontal" || orientation === "both";

      let direction: NavigationDirection | null = null;

      switch (e.key) {
        case "ArrowDown":
          if (isVertical) direction = "next";
          break;
        case "ArrowUp":
          if (isVertical) direction = "previous";
          break;
        case "ArrowRight":
          if (isHorizontal) direction = "next";
          break;
        case "ArrowLeft":
          if (isHorizontal) direction = "previous";
          break;
        case "Home":
          direction = "first";
          break;
        case "End":
          direction = "last";
          break;
        case "Enter":
        case " ":
          if (highlightedValue !== undefined) {
            e.preventDefault();
            onSelect?.(highlightedValue);
          }
          return;
        default:
          // Typeahead: single printable character
          if (typeahead && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleTypeahead(e.key);
          }
          return;
      }

      if (direction) {
        e.preventDefault();
        navigate(direction);
      }
    },
    [orientation, highlightedValue, onSelect, typeahead, handleTypeahead, navigate],
  );

  return {
    highlightedValue,
    setHighlightedValue,
    handleKeyDown,
  };
}
