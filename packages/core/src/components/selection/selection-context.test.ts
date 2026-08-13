import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { RadioGroupContext, useRadioGroupContext } from "./selection-context";
import type { SelectionControlBaseProps, RadioGroupContextValue } from "./selection-context";

// ─── Type contracts ─────────────────────────────────────────────────

describe("SelectionControlBaseProps: type shape", () => {
  it("has checked/defaultChecked/onCheckedChange", () => {
    expectTypeOf<SelectionControlBaseProps>().toHaveProperty("checked");
    expectTypeOf<SelectionControlBaseProps>().toHaveProperty("defaultChecked");
    expectTypeOf<SelectionControlBaseProps>().toHaveProperty("onCheckedChange");
  });

  it("has name/value for form submission", () => {
    expectTypeOf<SelectionControlBaseProps>().toHaveProperty("name");
    expectTypeOf<SelectionControlBaseProps>().toHaveProperty("value");
  });

  it("has disabled/required", () => {
    expectTypeOf<SelectionControlBaseProps>().toHaveProperty("disabled");
    expectTypeOf<SelectionControlBaseProps>().toHaveProperty("required");
  });

  it("checked is optional boolean", () => {
    const props: SelectionControlBaseProps = { checked: true };
    expect(props.checked).toBe(true);
  });

  it("all props are optional", () => {
    const empty: SelectionControlBaseProps = {};
    expect(empty.checked).toBeUndefined();
  });
});

// ─── RadioGroupContext ──────────────────────────────────────────────

describe("RadioGroupContext", () => {
  it("returns null outside provider", () => {
    const { result } = renderHook(() => useRadioGroupContext());
    expect(result.current).toBeNull();
  });

  it("returns context value inside provider", () => {
    const ctx: RadioGroupContextValue = {
      value: "a",
      onValueChange: () => {},
      name: "group",
      disabled: false,
      required: false,
    };
    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(RadioGroupContext.Provider, { value: ctx }, children);
    }
    Wrapper.displayName = "Wrapper";
    const { result } = renderHook(() => useRadioGroupContext(), { wrapper: Wrapper });
    expect(result.current).toBe(ctx);
    expect(result.current!.value).toBe("a");
    expect(result.current!.name).toBe("group");
  });

  it("RadioGroupContextValue shape", () => {
    expectTypeOf<RadioGroupContextValue>().toHaveProperty("value");
    expectTypeOf<RadioGroupContextValue>().toHaveProperty("onValueChange");
    expectTypeOf<RadioGroupContextValue>().toHaveProperty("name");
    expectTypeOf<RadioGroupContextValue>().toHaveProperty("disabled");
    expectTypeOf<RadioGroupContextValue>().toHaveProperty("required");
  });
});

// ─── SSR safety ─────────────────────────────────────────────────────

describe("Selection context: SSR", () => {
  it("RadioGroupContext.Provider renders without errors", () => {
    const ctx: RadioGroupContextValue = {
      value: "x",
      onValueChange: () => {},
      name: "rg",
      disabled: false,
      required: false,
    };
    const html = renderToString(
      createElement(RadioGroupContext.Provider, { value: ctx }, createElement("div", null, "ok")),
    );
    expect(html).toContain("ok");
  });
});
