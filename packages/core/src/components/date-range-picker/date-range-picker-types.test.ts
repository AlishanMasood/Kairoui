import { describe, it, expectTypeOf } from "vitest";
import type {
  DateRangePickerProps,
  DateRangePickerContextValue,
  DateRangePickerEndpoint,
} from "./date-range-picker";
import type { DateRangePickerMessages } from "./date-range-picker-context";
import type { DateRange } from "@kairoui/utils/date";

describe("DateRangePicker types", () => {
  it("value accepts DateRange | undefined", () => {
    expectTypeOf<DateRangePickerProps["value"]>().toEqualTypeOf<DateRange | undefined>();
  });

  it("open accepts boolean | undefined", () => {
    expectTypeOf<DateRangePickerProps["open"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("onValueChange takes DateRange", () => {
    type Fn = NonNullable<DateRangePickerProps["onValueChange"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<DateRange>();
    expectTypeOf<ReturnType<Fn>>().toBeVoid();
  });

  it("min and max are Date", () => {
    expectTypeOf<DateRangePickerProps["min"]>().toEqualTypeOf<Date | undefined>();
    expectTypeOf<DateRangePickerProps["max"]>().toEqualTypeOf<Date | undefined>();
  });

  it("minLength/maxLength accept number", () => {
    expectTypeOf<DateRangePickerProps["minLength"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<DateRangePickerProps["maxLength"]>().toEqualTypeOf<number | undefined>();
  });

  it("endpoint discriminated union", () => {
    expectTypeOf<DateRangePickerEndpoint>().toEqualTypeOf<"start" | "end">();
  });

  it("requireComplete and hoverPreview are optional booleans", () => {
    expectTypeOf<DateRangePickerProps["requireComplete"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<DateRangePickerProps["hoverPreview"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("messages is a partial override", () => {
    expectTypeOf<DateRangePickerProps["messages"]>().toEqualTypeOf<
      Partial<DateRangePickerMessages> | undefined
    >();
  });

  it("context exposes value and open", () => {
    expectTypeOf<DateRangePickerContextValue["value"]>().toEqualTypeOf<DateRange>();
    expectTypeOf<DateRangePickerContextValue["open"]>().toEqualTypeOf<boolean>();
  });

  it("context activeEndpoint is not exposed on public props", () => {
    // @ts-expect-error activeEndpoint is internal state
    type _ = DateRangePickerProps["activeEndpoint"];
  });
});
