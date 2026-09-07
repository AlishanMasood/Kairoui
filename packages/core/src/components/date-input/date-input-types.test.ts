import { describe, it, expectTypeOf } from "vitest";
import type { DateInputProps, DateInputSize, DateInputOwnProps } from "./date-input";
import type { DateOnly, ParseResult } from "@kairoui/utils/date";

describe("DateInput types", () => {
  it("value accepts Date | null | undefined", () => {
    expectTypeOf<DateInputOwnProps["value"]>().toEqualTypeOf<Date | null | undefined>();
  });

  it("defaultValue accepts Date | null | undefined", () => {
    expectTypeOf<DateInputOwnProps["defaultValue"]>().toEqualTypeOf<Date | null | undefined>();
  });

  it("onValueChange signature", () => {
    type Fn = NonNullable<DateInputOwnProps["onValueChange"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<Date | null>();
    expectTypeOf<ReturnType<Fn>>().toBeVoid();
  });

  it("min and max are Date", () => {
    expectTypeOf<DateInputOwnProps["min"]>().toEqualTypeOf<Date | undefined>();
    expectTypeOf<DateInputOwnProps["max"]>().toEqualTypeOf<Date | undefined>();
  });

  it("size is a discrete union", () => {
    expectTypeOf<DateInputSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });

  it("parse override returns ParseResult<DateOnly>", () => {
    type ParseFn = NonNullable<DateInputOwnProps["parse"]>;
    expectTypeOf<ReturnType<ParseFn>>().toEqualTypeOf<ParseResult<DateOnly>>();
  });

  it("format override receives DateOnly + locale and returns string", () => {
    type FormatFn = NonNullable<DateInputOwnProps["format"]>;
    expectTypeOf<Parameters<FormatFn>[0]>().toEqualTypeOf<DateOnly>();
    expectTypeOf<Parameters<FormatFn>[1]>().toEqualTypeOf<string>();
    expectTypeOf<ReturnType<FormatFn>>().toEqualTypeOf<string>();
  });

  it("DateInputProps composes with div HTML attributes", () => {
    // `id`, `role`, and other HTML div attrs are allowed
    type Test = DateInputProps["role"];
    expectTypeOf<Test>().toEqualTypeOf<React.AriaRole | undefined>();
  });

  it("required is boolean | undefined", () => {
    expectTypeOf<DateInputOwnProps["required"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("invalid is boolean | undefined", () => {
    expectTypeOf<DateInputOwnProps["invalid"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("clearable is boolean | undefined", () => {
    expectTypeOf<DateInputOwnProps["clearable"]>().toEqualTypeOf<boolean | undefined>();
  });
});
