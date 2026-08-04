import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { useId } from "./use-id";

describe("useId", () => {
  describe("provided ID", () => {
    it("returns the provided ID as-is", () => {
      const { result } = renderHook(() => useId("my-custom-id"));
      expect(result.current).toBe("my-custom-id");
    });

    it("ignores prefix when ID is provided", () => {
      const { result } = renderHook(() => useId("custom", { prefix: "other" }));
      expect(result.current).toBe("custom");
    });

    it("does not modify provided ID", () => {
      const { result } = renderHook(() => useId("has:colons"));
      expect(result.current).toBe("has:colons");
    });
  });

  describe("generated ID", () => {
    it("generates an ID when no providedId", () => {
      const { result } = renderHook(() => useId());
      expect(result.current).toBeTypeOf("string");
      expect(result.current.length).toBeGreaterThan(0);
    });

    it("uses kui prefix by default", () => {
      const { result } = renderHook(() => useId(undefined));
      expect(result.current).toMatch(/^kui-/);
    });

    it("uses custom prefix", () => {
      const { result } = renderHook(() => useId(undefined, { prefix: "field" }));
      expect(result.current).toMatch(/^field-/);
    });

    it("is stable across re-renders", () => {
      const { result, rerender } = renderHook(() => useId());
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });

    it("generates unique IDs for different instances", () => {
      const { result: r1 } = renderHook(() => useId());
      const { result: r2 } = renderHook(() => useId());
      expect(r1.current).not.toBe(r2.current);
    });

    it("does not contain colons (cleaned from React ID)", () => {
      const { result } = renderHook(() => useId());
      expect(result.current).not.toContain(":");
    });
  });

  describe("empty/undefined providedId", () => {
    it("generates ID for undefined", () => {
      const { result } = renderHook(() => useId(undefined));
      expect(result.current).toMatch(/^kui-/);
    });

    it("generates ID for empty string", () => {
      const { result } = renderHook(() => useId(""));
      expect(result.current).toMatch(/^kui-/);
    });
  });

  describe("SSR", () => {
    it("produces a valid ID during server render", () => {
      function TestComponent() {
        const id = useId(undefined, { prefix: "ssr" });
        return createElement("div", { id }, "hello");
      }
      const html = renderToString(createElement(TestComponent));
      // Should contain an id attribute with our prefix
      expect(html).toMatch(/id="ssr-[^"]+"/);
    });

    it("server-rendered ID contains prefix", () => {
      function TestComponent() {
        const id = useId(undefined, { prefix: "test" });
        return createElement("span", { "data-id": id });
      }
      const html = renderToString(createElement(TestComponent));
      expect(html).toContain("test-");
    });

    it("provided ID passes through on server", () => {
      function TestComponent() {
        const id = useId("server-provided");
        return createElement("div", { id });
      }
      const html = renderToString(createElement(TestComponent));
      expect(html).toContain('id="server-provided"');
    });
  });
});
