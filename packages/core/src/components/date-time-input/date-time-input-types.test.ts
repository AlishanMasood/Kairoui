import { describe, it, expectTypeOf } from "vitest";
import type { DateTimeInputProps, DateTimeInputOwnProps } from "./date-time-input";
import type { DateTimeLocal } from "@kairoui/utils/date";

describe("DateTimeInput types", () => {
  it("value accepts DateTimeLocal | null | undefined", () => {
    expectTypeOf<DateTimeInputOwnProps["value"]>().toEqualTypeOf<
      DateTimeLocal | null | undefined
    >();
  });

  it("min and max accept DateTimeLocal | undefined", () => {
    expectTypeOf<DateTimeInputOwnProps["min"]>().toEqualTypeOf<DateTimeLocal | undefined>();
    expectTypeOf<DateTimeInputOwnProps["max"]>().toEqualTypeOf<DateTimeLocal | undefined>();
  });

  it("onValueChange signature", () => {
    type Fn = NonNullable<DateTimeInputOwnProps["onValueChange"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<DateTimeLocal | null>();
    expectTypeOf<ReturnType<Fn>>().toBeVoid();
  });

  it("step, includeSeconds, hour12 are optional", () => {
    expectTypeOf<DateTimeInputOwnProps["step"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<DateTimeInputOwnProps["includeSeconds"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<DateTimeInputOwnProps["hour12"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("public API does not expose per-part sub-values", () => {
    // @ts-expect-error partsRef is internal
    type _ = DateTimeInputProps["partsRef"];
  });

  it("public API does not expose timezone selection", () => {
    // @ts-expect-error explicitly out of scope per KUI-ADV-009
    type _tz = DateTimeInputProps["timeZone"];
  });
});
