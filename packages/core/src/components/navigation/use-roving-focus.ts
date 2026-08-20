import { useCallback, useRef, useState } from "react";
import type { Orientation } from "../navigation/navigation-types";

export interface RovingFocusItem {
  element: HTMLElement;
  value: string;
  disabled?: boolean;
}

export interface UseRovingFocusOptions {
  orientation?: Orientation;
  dir?: "ltr" | "rtl";
  loop?: boolean;
  currentValue?: string;
  onValueChange?: (value: string) => void;
}

export interface UseRovingFocusReturn {
  items: readonly RovingFocusItem[];
  register: (item: RovingFocusItem) => () => void;
  getItemProps: (value: string, disabled?: boolean) => RovingFocusItemProps;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  focusedValue: string | undefined;
}

export interface RovingFocusItemProps {
  tabIndex: number;
  "data-roving-focus-item": "";
  onFocus: () => void;
}

/* eslint-disable react-hooks/refs -- Hook manages refs as internal item registry */
export function useRovingFocus(options: UseRovingFocusOptions = {}): UseRovingFocusReturn {
  const {
    orientation = "horizontal",
    dir = "ltr",
    loop = false,
    currentValue,
    onValueChange,
  } = options;

  const itemsRef = useRef<RovingFocusItem[]>([]);
  const [registeredValues, setRegisteredValues] = useState<string[]>([]);
  const [focusedValue, setFocusedValueState] = useState<string | undefined>(currentValue);
  const focusedValueRef = useRef<string | undefined>(currentValue);

  const setFocusedValue = useCallback((value: string | undefined) => {
    focusedValueRef.current = value;
    setFocusedValueState(value);
  }, []);

  // Sync controlled value
  if (currentValue !== undefined && currentValue !== focusedValueRef.current) {
    setFocusedValue(currentValue);
  }

  const register = useCallback((item: RovingFocusItem) => {
    itemsRef.current = [...itemsRef.current, item];
    setRegisteredValues((prev) => [...prev, item.value]);
    return () => {
      itemsRef.current = itemsRef.current.filter((i) => i.value !== item.value);
      setRegisteredValues((prev) => prev.filter((v) => v !== item.value));
    };
  }, []);

  const getEnabledItems = useCallback((): RovingFocusItem[] => {
    return itemsRef.current.filter((i) => !i.disabled);
  }, []);

  const focusItem = useCallback(
    (item: RovingFocusItem) => {
      setFocusedValue(item.value);
      onValueChange?.(item.value);
      item.element.focus();
    },
    [onValueChange, setFocusedValue],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const enabled = getEnabledItems();
      if (enabled.length === 0) return;

      const currentIdx = enabled.findIndex((i) => i.value === focusedValueRef.current);
      let nextIdx: number | undefined;

      const isHorizontal = orientation === "horizontal";
      const isRtl = dir === "rtl";

      const isNext =
        (isHorizontal && event.key === (isRtl ? "ArrowLeft" : "ArrowRight")) ||
        (!isHorizontal && event.key === "ArrowDown");
      const isPrev =
        (isHorizontal && event.key === (isRtl ? "ArrowRight" : "ArrowLeft")) ||
        (!isHorizontal && event.key === "ArrowUp");

      if (isNext) {
        event.preventDefault();
        if (currentIdx === -1) {
          nextIdx = 0;
        } else if (currentIdx < enabled.length - 1) {
          nextIdx = currentIdx + 1;
        } else if (loop) {
          nextIdx = 0;
        }
      } else if (isPrev) {
        event.preventDefault();
        if (currentIdx === -1) {
          nextIdx = enabled.length - 1;
        } else if (currentIdx > 0) {
          nextIdx = currentIdx - 1;
        } else if (loop) {
          nextIdx = enabled.length - 1;
        }
      } else if (event.key === "Home") {
        event.preventDefault();
        nextIdx = 0;
      } else if (event.key === "End") {
        event.preventDefault();
        nextIdx = enabled.length - 1;
      }

      if (nextIdx !== undefined) {
        const target = enabled[nextIdx];
        if (target) focusItem(target);
      }
    },
    [orientation, dir, loop, getEnabledItems, focusItem],
  );

  const getItemProps = useCallback(
    (value: string, disabled?: boolean): RovingFocusItemProps => {
      const isFocused = focusedValue === value;
      const firstValue = registeredValues[0];
      const isFirst = !focusedValue && firstValue === value;
      return {
        tabIndex: isFocused || isFirst ? 0 : -1,
        "data-roving-focus-item": "" as const,
        onFocus: () => {
          if (!disabled) setFocusedValue(value);
        },
      };
    },
    [focusedValue, registeredValues, setFocusedValue],
  );

  return {
    items: itemsRef.current,
    register,
    getItemProps,
    handleKeyDown,
    focusedValue,
  };
}
/* eslint-enable react-hooks/refs */
