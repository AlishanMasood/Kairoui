import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ComboboxContext, useComboboxContext } from "./combobox-types";
import type {
  ComboboxProps,
  ComboboxInputProps,
  ComboboxItemProps,
  ComboboxContextValue,
} from "./combobox-types";

// ─── Type contracts ─────────────────────────────────────────────────

describe("Combobox types: ComboboxProps", () => {
  it("has value/defaultValue/onValueChange", () => {
    expectTypeOf<ComboboxProps>().toHaveProperty("value");
    expectTypeOf<ComboboxProps>().toHaveProperty("defaultValue");
    expectTypeOf<ComboboxProps>().toHaveProperty("onValueChange");
  });

  it("has inputValue/defaultInputValue/onInputValueChange", () => {
    expectTypeOf<ComboboxProps>().toHaveProperty("inputValue");
    expectTypeOf<ComboboxProps>().toHaveProperty("defaultInputValue");
    expectTypeOf<ComboboxProps>().toHaveProperty("onInputValueChange");
  });

  it("has open/defaultOpen/onOpenChange", () => {
    expectTypeOf<ComboboxProps>().toHaveProperty("open");
    expectTypeOf<ComboboxProps>().toHaveProperty("defaultOpen");
    expectTypeOf<ComboboxProps>().toHaveProperty("onOpenChange");
  });

  it("has form and state props", () => {
    expectTypeOf<ComboboxProps>().toHaveProperty("name");
    expectTypeOf<ComboboxProps>().toHaveProperty("disabled");
    expectTypeOf<ComboboxProps>().toHaveProperty("required");
    expectTypeOf<ComboboxProps>().toHaveProperty("allowCustomValue");
  });

  it("all props are optional", () => {
    const props: ComboboxProps = {};
    expect(props.value).toBeUndefined();
  });
});

describe("Combobox types: ComboboxInputProps", () => {
  it("has placeholder", () => {
    expectTypeOf<ComboboxInputProps>().toHaveProperty("placeholder");
  });
});

describe("Combobox types: ComboboxItemProps", () => {
  it("has required value", () => {
    const item: ComboboxItemProps = { value: "test" };
    expect(item.value).toBe("test");
  });

  it("has label and disabled", () => {
    expectTypeOf<ComboboxItemProps>().toHaveProperty("label");
    expectTypeOf<ComboboxItemProps>().toHaveProperty("disabled");
  });
});

// ─── ComboboxContext ────────────────────────────────────────────────

describe("ComboboxContext", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useComboboxContext());
    }).toThrow("Combobox parts must be used inside a <Combobox> component");
  });

  it("returns context value inside provider", () => {
    const ctx: ComboboxContextValue = {
      value: "a",
      inputValue: "Ap",
      open: true,
      disabled: false,
      required: false,
      allowCustomValue: false,
      highlightedValue: "apple",
      onValueChange: () => {},
      onInputValueChange: () => {},
      onOpenChange: () => {},
      setHighlightedValue: () => {},
      clearValue: () => {},
      inputId: "input-1",
      listboxId: "list-1",
      triggerId: "trigger-1",
    };
    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(ComboboxContext.Provider, { value: ctx }, children);
    }
    Wrapper.displayName = "Wrapper";
    const { result } = renderHook(() => useComboboxContext(), { wrapper: Wrapper });
    expect(result.current.value).toBe("a");
    expect(result.current.inputValue).toBe("Ap");
    expect(result.current.highlightedValue).toBe("apple");
  });
});

// ─── ComboboxContextValue shape ─────────────────────────────────────

describe("ComboboxContextValue", () => {
  it("has state properties", () => {
    expectTypeOf<ComboboxContextValue>().toHaveProperty("value");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("inputValue");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("open");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("disabled");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("required");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("allowCustomValue");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("highlightedValue");
  });

  it("has action methods", () => {
    expectTypeOf<ComboboxContextValue>().toHaveProperty("onValueChange");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("onInputValueChange");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("onOpenChange");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("setHighlightedValue");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("clearValue");
  });

  it("has ARIA IDs", () => {
    expectTypeOf<ComboboxContextValue>().toHaveProperty("inputId");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("listboxId");
    expectTypeOf<ComboboxContextValue>().toHaveProperty("triggerId");
  });
});

// ─── SSR safety ─────────────────────────────────────────────────────

describe("Combobox types: SSR", () => {
  it("ComboboxContext.Provider renders on server", () => {
    const ctx: ComboboxContextValue = {
      value: undefined,
      inputValue: "",
      open: false,
      disabled: false,
      required: false,
      allowCustomValue: false,
      highlightedValue: undefined,
      onValueChange: () => {},
      onInputValueChange: () => {},
      onOpenChange: () => {},
      setHighlightedValue: () => {},
      clearValue: () => {},
      inputId: "i",
      listboxId: "l",
      triggerId: "t",
    };
    const html = renderToString(
      createElement(ComboboxContext.Provider, { value: ctx }, createElement("div", null, "ok")),
    );
    expect(html).toContain("ok");
  });
});
