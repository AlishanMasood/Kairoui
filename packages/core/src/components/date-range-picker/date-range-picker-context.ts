import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type { DateOnly, DateRange, ParseResult } from "@kairoui/utils/date";
import type { WeekStart } from "../calendar/calendar-model";

export type DateRangePickerEndpoint = "start" | "end";

export type DateRangePickerParseFn = (input: string, locale: string) => ParseResult<DateOnly>;
export type DateRangePickerFormatFn = (value: DateOnly, locale: string) => string;

export interface DateRangePickerMessages {
  readonly selectStart: string;
  readonly selectEnd: string;
  readonly startCommitted: (date: Date) => string;
  readonly endCommitted: (range: DateRange, days: number) => string;
  readonly cleared: string;
  readonly swapped: (range: DateRange) => string;
}

export interface DateRangePickerContextValue {
  readonly value: DateRange;
  readonly setEndpoint: (endpoint: DateRangePickerEndpoint, value: Date | null) => void;
  readonly clear: () => void;

  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;

  readonly activeEndpoint: DateRangePickerEndpoint;
  readonly setActiveEndpoint: (endpoint: DateRangePickerEndpoint) => void;

  readonly previewEnd: Date | null;
  readonly setPreviewEnd: (date: Date | null) => void;

  readonly min: Date | undefined;
  readonly max: Date | undefined;
  readonly disabledDate: ((date: Date) => boolean) | undefined;
  readonly minLength: number | undefined;
  readonly maxLength: number | undefined;

  readonly locale: string;
  readonly dir: "ltr" | "rtl";
  readonly weekStartsOn: WeekStart;
  readonly hoverPreview: boolean;

  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly invalid: boolean;

  readonly name: string | undefined;
  readonly form: string | undefined;

  readonly parse: DateRangePickerParseFn | undefined;
  readonly format: DateRangePickerFormatFn | undefined;

  readonly startInputId: string;
  readonly endInputId: string;
  readonly triggerId: string;
  readonly contentId: string;
  readonly liveRegionId: string;

  readonly startInputRef: RefObject<HTMLInputElement | null>;
  readonly endInputRef: RefObject<HTMLInputElement | null>;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly lastFocusSourceRef: RefObject<"start" | "end" | "trigger" | null>;

  readonly announce: (msg: string) => void;
  readonly messages: DateRangePickerMessages;
}

export const DateRangePickerContext = createContext<DateRangePickerContextValue | null>(null);
DateRangePickerContext.displayName = "DateRangePickerContext";

export function useDateRangePickerContext(): DateRangePickerContextValue {
  const ctx = useContext(DateRangePickerContext);
  if (!ctx) {
    throw new Error("DateRangePicker parts must be rendered within <DateRangePicker>.");
  }
  return ctx;
}

export const DEFAULT_MESSAGES: DateRangePickerMessages = {
  selectStart: "Select start date.",
  selectEnd: "Select end date.",
  startCommitted: (date: Date) => {
    const iso = date.toISOString().slice(0, 10);
    return `Start date: ${iso}. Now select end date.`;
  },
  endCommitted: (_range: DateRange, days: number) =>
    `End date committed. Range: ${String(days)} day${days === 1 ? "" : "s"}.`,
  cleared: "Range cleared.",
  swapped: (range: DateRange) => {
    const s = range.start ? range.start.toISOString().slice(0, 10) : "";
    const e = range.end ? range.end.toISOString().slice(0, 10) : "";
    return `Range swapped. Start: ${s}. End: ${e}.`;
  },
};
