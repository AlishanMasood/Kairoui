import { describe, it, expectTypeOf } from "vitest";
import type {
  CollectionItem,
  SingleSelectionValue,
  MultiSelectionValue,
  SingleSelectionProps,
  MultiSelectionProps,
  HighlightState,
  NavigationDirection,
  TypeaheadConfig,
  FormParticipationProps,
} from "./collection-types";

// ─── CollectionItem ─────────────────────────────────────────────────

describe("CollectionItem type", () => {
  it("has required value and label", () => {
    expectTypeOf<CollectionItem>().toHaveProperty("value");
    expectTypeOf<CollectionItem>().toHaveProperty("label");
  });

  it("has optional disabled", () => {
    expectTypeOf<CollectionItem>().toHaveProperty("disabled");
    const item: CollectionItem = { value: "a", label: "A" };
    expectTypeOf(item.disabled).toEqualTypeOf<boolean | undefined>();
  });

  it("value and label are strings", () => {
    const item: CollectionItem = { value: "x", label: "X" };
    expectTypeOf(item.value).toBeString();
    expectTypeOf(item.label).toBeString();
  });
});

// ─── Selection types ────────────────────────────────────────────────

describe("Selection types", () => {
  it("SingleSelectionValue is string | undefined", () => {
    expectTypeOf<SingleSelectionValue>().toEqualTypeOf<string | undefined>();
  });

  it("MultiSelectionValue is string[]", () => {
    expectTypeOf<MultiSelectionValue>().toEqualTypeOf<string[]>();
  });
});

// ─── SingleSelectionProps ───────────────────────────────────────────

describe("SingleSelectionProps", () => {
  it("has value/defaultValue/onValueChange", () => {
    expectTypeOf<SingleSelectionProps>().toHaveProperty("value");
    expectTypeOf<SingleSelectionProps>().toHaveProperty("defaultValue");
    expectTypeOf<SingleSelectionProps>().toHaveProperty("onValueChange");
  });

  it("all props are optional", () => {
    const props: SingleSelectionProps = {};
    expectTypeOf(props).toExtend<SingleSelectionProps>();
  });

  it("onValueChange receives string", () => {
    const fn: NonNullable<SingleSelectionProps["onValueChange"]> = (v) => {
      expectTypeOf(v).toBeString();
    };
    fn("test");
  });
});

// ─── MultiSelectionProps ────────────────────────────────────────────

describe("MultiSelectionProps", () => {
  it("has value/defaultValue/onValueChange", () => {
    expectTypeOf<MultiSelectionProps>().toHaveProperty("value");
    expectTypeOf<MultiSelectionProps>().toHaveProperty("defaultValue");
    expectTypeOf<MultiSelectionProps>().toHaveProperty("onValueChange");
  });

  it("onValueChange receives string[]", () => {
    const fn: NonNullable<MultiSelectionProps["onValueChange"]> = (v) => {
      expectTypeOf(v).toEqualTypeOf<string[]>();
    };
    fn(["a", "b"]);
  });
});

// ─── HighlightState ─────────────────────────────────────────────────

describe("HighlightState", () => {
  it("has highlightedValue", () => {
    expectTypeOf<HighlightState>().toHaveProperty("highlightedValue");
  });

  it("highlightedValue is string | undefined", () => {
    const state: HighlightState = { highlightedValue: undefined };
    expectTypeOf(state.highlightedValue).toEqualTypeOf<string | undefined>();
  });
});

// ─── NavigationDirection ────────────────────────────────────────────

describe("NavigationDirection", () => {
  it("is a union of navigation directions", () => {
    expectTypeOf<NavigationDirection>().toEqualTypeOf<"next" | "previous" | "first" | "last">();
  });
});

// ─── TypeaheadConfig ────────────────────────────────────────────────

describe("TypeaheadConfig", () => {
  it("has enabled and timeout", () => {
    expectTypeOf<TypeaheadConfig>().toHaveProperty("enabled");
    expectTypeOf<TypeaheadConfig>().toHaveProperty("timeout");
  });

  it("all props are optional", () => {
    const cfg: TypeaheadConfig = {};
    expectTypeOf(cfg).toExtend<TypeaheadConfig>();
  });
});

// ─── FormParticipationProps ─────────────────────────────────────────

describe("FormParticipationProps", () => {
  it("has name/required/disabled", () => {
    expectTypeOf<FormParticipationProps>().toHaveProperty("name");
    expectTypeOf<FormParticipationProps>().toHaveProperty("required");
    expectTypeOf<FormParticipationProps>().toHaveProperty("disabled");
  });

  it("all props are optional", () => {
    const props: FormParticipationProps = {};
    expectTypeOf(props).toExtend<FormParticipationProps>();
  });
});
