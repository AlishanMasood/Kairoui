import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { SelectContext, useSelectContext } from "./select-types";
import type {
  SelectProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
  SelectGroupProps,
  SelectContextValue,
} from "./select-types";

// ─── Type contracts ─────────────────────────────────────────────────

describe("Select types: SelectProps", () => {
  it("has value/defaultValue/onValueChange", () => {
    expectTypeOf<SelectProps>().toHaveProperty("value");
    expectTypeOf<SelectProps>().toHaveProperty("defaultValue");
    expectTypeOf<SelectProps>().toHaveProperty("onValueChange");
  });

  it("has open/defaultOpen/onOpenChange", () => {
    expectTypeOf<SelectProps>().toHaveProperty("open");
    expectTypeOf<SelectProps>().toHaveProperty("defaultOpen");
    expectTypeOf<SelectProps>().toHaveProperty("onOpenChange");
  });

  it("has form participation props", () => {
    expectTypeOf<SelectProps>().toHaveProperty("name");
    expectTypeOf<SelectProps>().toHaveProperty("disabled");
    expectTypeOf<SelectProps>().toHaveProperty("required");
  });

  it("all props are optional", () => {
    const props: SelectProps = {};
    expect(props.value).toBeUndefined();
  });
});

describe("Select types: SelectTriggerProps", () => {
  it("has placeholder", () => {
    expectTypeOf<SelectTriggerProps>().toHaveProperty("placeholder");
  });
});

describe("Select types: SelectContentProps", () => {
  it("has position", () => {
    expectTypeOf<SelectContentProps>().toHaveProperty("position");
  });
});

describe("Select types: SelectItemProps", () => {
  it("has value (required)", () => {
    expectTypeOf<SelectItemProps>().toHaveProperty("value");
  });

  it("has label and disabled", () => {
    expectTypeOf<SelectItemProps>().toHaveProperty("label");
    expectTypeOf<SelectItemProps>().toHaveProperty("disabled");
  });

  it("value is required string", () => {
    const item: SelectItemProps = { value: "test" };
    expect(item.value).toBe("test");
  });
});

describe("Select types: SelectGroupProps", () => {
  it("has children", () => {
    expectTypeOf<SelectGroupProps>().toHaveProperty("children");
  });
});

// ─── SelectContext ──────────────────────────────────────────────────

describe("SelectContext", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useSelectContext());
    }).toThrow("Select parts must be used inside a <Select> component");
  });

  it("returns context value when inside provider", () => {
    const ctx: SelectContextValue = {
      value: "a",
      open: false,
      disabled: false,
      required: false,
      highlightedValue: undefined,
      onValueChange: () => {},
      onOpenChange: () => {},
      setHighlightedValue: () => {},
      triggerId: "trigger-1",
      contentId: "content-1",
      valueId: "value-1",
    };
    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(SelectContext.Provider, { value: ctx }, children);
    }
    Wrapper.displayName = "Wrapper";
    const { result } = renderHook(() => useSelectContext(), { wrapper: Wrapper });
    expect(result.current.value).toBe("a");
    expect(result.current.triggerId).toBe("trigger-1");
  });
});

// ─── SelectContextValue shape ───────────────────────────────────────

describe("SelectContextValue", () => {
  it("has state properties", () => {
    expectTypeOf<SelectContextValue>().toHaveProperty("value");
    expectTypeOf<SelectContextValue>().toHaveProperty("open");
    expectTypeOf<SelectContextValue>().toHaveProperty("disabled");
    expectTypeOf<SelectContextValue>().toHaveProperty("required");
    expectTypeOf<SelectContextValue>().toHaveProperty("highlightedValue");
  });

  it("has action methods", () => {
    expectTypeOf<SelectContextValue>().toHaveProperty("onValueChange");
    expectTypeOf<SelectContextValue>().toHaveProperty("onOpenChange");
    expectTypeOf<SelectContextValue>().toHaveProperty("setHighlightedValue");
  });

  it("has ARIA IDs", () => {
    expectTypeOf<SelectContextValue>().toHaveProperty("triggerId");
    expectTypeOf<SelectContextValue>().toHaveProperty("contentId");
    expectTypeOf<SelectContextValue>().toHaveProperty("valueId");
  });
});

// ─── SSR safety ─────────────────────────────────────────────────────

describe("Select types: SSR", () => {
  it("SelectContext.Provider renders on server", () => {
    const ctx: SelectContextValue = {
      value: undefined,
      open: false,
      disabled: false,
      required: false,
      highlightedValue: undefined,
      onValueChange: () => {},
      onOpenChange: () => {},
      setHighlightedValue: () => {},
      triggerId: "t",
      contentId: "c",
      valueId: "v",
    };
    const html = renderToString(
      createElement(SelectContext.Provider, { value: ctx }, createElement("div", null, "ok")),
    );
    expect(html).toContain("ok");
  });
});
