import { createContext, useContext } from "react";
import type { RefObject } from "react";

/**
 * Runtime context shared between the DatePicker root and its parts.
 * The root wraps an internal Popover and threads state through here so
 * children don't need to consume Popover context directly.
 */
export interface DatePickerContextValue {
  readonly value: Date | null;
  readonly setValue: (value: Date | null) => void;
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;

  readonly min: Date | undefined;
  readonly max: Date | undefined;
  readonly disabledDate: ((date: Date) => boolean) | undefined;

  readonly locale: string;
  readonly dir: "ltr" | "rtl";

  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly invalid: boolean;

  readonly name: string | undefined;
  readonly form: string | undefined;

  readonly parse: DatePickerParseFn | undefined;
  readonly format: DatePickerFormatFn | undefined;

  readonly inputId: string;
  readonly triggerId: string;
  readonly contentId: string;

  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly lastFocusSourceRef: RefObject<"input" | "trigger" | null>;
}

export type DatePickerParseFn = (
  input: string,
  locale: string,
) => import("@kairoui/utils/date").ParseResult<import("@kairoui/utils/date").DateOnly>;

export type DatePickerFormatFn = (
  value: import("@kairoui/utils/date").DateOnly,
  locale: string,
) => string;

export const DatePickerContext = createContext<DatePickerContextValue | null>(null);
DatePickerContext.displayName = "DatePickerContext";

export function useDatePickerContext(): DatePickerContextValue {
  const ctx = useContext(DatePickerContext);
  if (!ctx) {
    throw new Error("DatePicker parts must be rendered within <DatePicker>.");
  }
  return ctx;
}
