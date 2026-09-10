import { describe, it, expectTypeOf } from "vitest";
import type { TimeInputProps, TimeInputSize, TimeInputOwnProps } from "./time-input";
import type { ParseResult, TimeOfDay } from "@kairoui/utils/date";

describe("TimeInput types", () => {
  it("value accepts TimeOfDay | null | undefined", () => {
    expectTypeOf<TimeInputOwnProps["value"]>().toEqualTypeOf<TimeOfDay | null | undefined>();
  });

  it("defaultValue accepts TimeOfDay | null | undefined", () => {
    expectTypeOf<TimeInputOwnProps["defaultValue"]>().toEqualTypeOf<TimeOfDay | null | undefined>();
  });

  it("onValueChange signature", () => {
    type Fn = NonNullable<TimeInputOwnProps["onValueChange"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<TimeOfDay | null>();
    expectTypeOf<ReturnType<Fn>>().toBeVoid();
  });

  it("min and max are TimeOfDay", () => {
    expectTypeOf<TimeInputOwnProps["min"]>().toEqualTypeOf<TimeOfDay | undefined>();
    expectTypeOf<TimeInputOwnProps["max"]>().toEqualTypeOf<TimeOfDay | undefined>();
  });

  it("size is a discrete union", () => {
    expectTypeOf<TimeInputSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });

  it("step is number", () => {
    expectTypeOf<TimeInputOwnProps["step"]>().toEqualTypeOf<number | undefined>();
  });

  it("hour12 is boolean | undefined", () => {
    expectTypeOf<TimeInputOwnProps["hour12"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("includeSeconds is boolean | undefined", () => {
    expectTypeOf<TimeInputOwnProps["includeSeconds"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("parse override returns ParseResult<TimeOfDay>", () => {
    type ParseFn = NonNullable<TimeInputOwnProps["parse"]>;
    expectTypeOf<ReturnType<ParseFn>>().toEqualTypeOf<ParseResult<TimeOfDay>>();
  });

  it("format override receives TimeOfDay + context and returns string", () => {
    type FormatFn = NonNullable<TimeInputOwnProps["format"]>;
    expectTypeOf<Parameters<FormatFn>[0]>().toEqualTypeOf<TimeOfDay>();
    expectTypeOf<Parameters<FormatFn>[1]>().toEqualTypeOf<{
      locale: string;
      hour12: boolean;
      includeSeconds: boolean;
    }>();
    expectTypeOf<ReturnType<FormatFn>>().toEqualTypeOf<string>();
  });

  it("TimeInputProps composes with div HTML attributes", () => {
    type Test = TimeInputProps["role"];
    expectTypeOf<Test>().toEqualTypeOf<React.AriaRole | undefined>();
  });
});
