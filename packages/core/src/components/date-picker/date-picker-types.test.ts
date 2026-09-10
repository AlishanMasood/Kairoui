import { describe, it, expectTypeOf } from "vitest";
import type {
  DatePickerOwnProps,
  DatePickerProps,
  DatePickerInputProps,
  DatePickerCalendarProps,
  DatePickerContextValue,
} from "./date-picker";
import type { WeekStart } from "../calendar/calendar-model";

describe("DatePicker types", () => {
  it("value accepts Date | null | undefined", () => {
    expectTypeOf<DatePickerOwnProps["value"]>().toEqualTypeOf<Date | null | undefined>();
  });

  it("open accepts boolean | undefined", () => {
    expectTypeOf<DatePickerOwnProps["open"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("onValueChange signature", () => {
    type Fn = NonNullable<DatePickerOwnProps["onValueChange"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<Date | null>();
    expectTypeOf<ReturnType<Fn>>().toBeVoid();
  });

  it("onOpenChange signature", () => {
    type Fn = NonNullable<DatePickerOwnProps["onOpenChange"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<boolean>();
    expectTypeOf<ReturnType<Fn>>().toBeVoid();
  });

  it("min and max are Date", () => {
    expectTypeOf<DatePickerOwnProps["min"]>().toEqualTypeOf<Date | undefined>();
    expectTypeOf<DatePickerOwnProps["max"]>().toEqualTypeOf<Date | undefined>();
  });

  it("disabledDate is a Date predicate", () => {
    type Fn = NonNullable<DatePickerOwnProps["disabledDate"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<Date>();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<boolean>();
  });

  it("weekStartsOn is WeekStart | undefined", () => {
    expectTypeOf<DatePickerOwnProps["weekStartsOn"]>().toEqualTypeOf<WeekStart | undefined>();
  });

  it("children is required", () => {
    expectTypeOf<DatePickerOwnProps["children"]>().toEqualTypeOf<React.ReactNode>();
  });

  it("DatePickerProps composes div HTML attributes", () => {
    expectTypeOf<DatePickerProps["role"]>().toEqualTypeOf<React.AriaRole | undefined>();
  });

  it("DatePickerInputProps hides value/defaultValue/onValueChange (owned by root)", () => {
    // These should not be present on the input part
    type PublicKeys = keyof DatePickerInputProps;
    expectTypeOf<
      Exclude<PublicKeys, "value" | "defaultValue" | "onValueChange">
    >().toEqualTypeOf<PublicKeys>();
  });

  it("DatePickerCalendarProps only exposes className", () => {
    expectTypeOf<DatePickerCalendarProps>().toEqualTypeOf<{ className?: string }>();
  });

  it("Context exposes value, open, and refs", () => {
    expectTypeOf<DatePickerContextValue["value"]>().toEqualTypeOf<Date | null>();
    expectTypeOf<DatePickerContextValue["open"]>().toEqualTypeOf<boolean>();
    expectTypeOf<DatePickerContextValue["inputRef"]>().toExtend<{
      current: HTMLInputElement | null;
    }>();
  });
});
