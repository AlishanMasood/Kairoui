import { describe, it, expect } from "vitest";
import {
  resolveDisabledProps,
  resolveButtonType,
  computeComponentState,
} from "./authoring-helpers";

describe("resolveDisabledProps", () => {
  it("returns empty for non-disabled, non-loading", () => {
    expect(resolveDisabledProps("button", false, false)).toEqual({});
  });

  it("returns native disabled for button element", () => {
    expect(resolveDisabledProps("button", true, false)).toEqual({ disabled: true });
  });

  it("returns native disabled for input element", () => {
    expect(resolveDisabledProps("input", true, false)).toEqual({ disabled: true });
  });

  it("returns native disabled for select element", () => {
    expect(resolveDisabledProps("select", true, false)).toEqual({ disabled: true });
  });

  it("returns native disabled for textarea element", () => {
    expect(resolveDisabledProps("textarea", true, false)).toEqual({ disabled: true });
  });

  it("returns aria-disabled for non-native elements", () => {
    expect(resolveDisabledProps("a", true, false)).toEqual({ "aria-disabled": "true" });
  });

  it("returns aria-disabled for div", () => {
    expect(resolveDisabledProps("div", true, false)).toEqual({ "aria-disabled": "true" });
  });

  it("returns aria-disabled for custom components", () => {
    const Custom = () => null;
    expect(resolveDisabledProps(Custom, true, false)).toEqual({ "aria-disabled": "true" });
  });

  it("returns aria-busy when loading", () => {
    expect(resolveDisabledProps("button", false, true)).toEqual({ "aria-busy": "true" });
  });

  it("combines disabled + loading", () => {
    expect(resolveDisabledProps("button", true, true)).toEqual({
      disabled: true,
      "aria-busy": "true",
    });
  });

  it("combines aria-disabled + loading for non-native", () => {
    expect(resolveDisabledProps("a", true, true)).toEqual({
      "aria-disabled": "true",
      "aria-busy": "true",
    });
  });
});

describe("resolveButtonType", () => {
  it("returns type for native button", () => {
    expect(resolveButtonType("button")).toEqual({ type: "button" });
  });

  it("returns specified type for button", () => {
    expect(resolveButtonType("button", "submit")).toEqual({ type: "submit" });
    expect(resolveButtonType("button", "reset")).toEqual({ type: "reset" });
  });

  it("returns empty for non-button elements", () => {
    expect(resolveButtonType("a")).toEqual({});
    expect(resolveButtonType("div")).toEqual({});
    expect(resolveButtonType("span")).toEqual({});
  });

  it("returns empty for custom components", () => {
    const Custom = () => null;
    expect(resolveButtonType(Custom)).toEqual({});
  });
});

describe("computeComponentState", () => {
  it("returns default state when neither disabled nor loading", () => {
    expect(computeComponentState({})).toEqual({
      disabled: false,
      loading: false,
      dataState: "default",
    });
  });

  it("returns disabled state", () => {
    expect(computeComponentState({ disabled: true })).toEqual({
      disabled: true,
      loading: false,
      dataState: "disabled",
    });
  });

  it("returns loading state", () => {
    expect(computeComponentState({ loading: true })).toEqual({
      disabled: true,
      loading: true,
      dataState: "loading",
    });
  });

  it("loading implies disabled", () => {
    const state = computeComponentState({ loading: true });
    expect(state.disabled).toBe(true);
  });

  it("loading + disabled returns loading state", () => {
    expect(computeComponentState({ disabled: true, loading: true })).toEqual({
      disabled: true,
      loading: true,
      dataState: "loading",
    });
  });
});
