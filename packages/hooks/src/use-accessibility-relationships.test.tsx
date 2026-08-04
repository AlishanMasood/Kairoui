import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { useAccessibilityRelationships } from "./use-accessibility-relationships";

describe("useAccessibilityRelationships", () => {
  describe("ID generation", () => {
    it("generates deterministic IDs with prefix", () => {
      const { result } = renderHook(() => useAccessibilityRelationships());
      expect(result.current.fieldId).toMatch(/^kui-field-/);
      expect(result.current.labelId).toMatch(/-label$/);
      expect(result.current.descriptionId).toMatch(/-description$/);
      expect(result.current.errorId).toMatch(/-error$/);
      expect(result.current.groupId).toMatch(/-group$/);
    });

    it("uses consumer-provided ID as base", () => {
      const { result } = renderHook(() => useAccessibilityRelationships({ id: "my-input" }));
      expect(result.current.fieldId).toBe("my-input");
      expect(result.current.labelId).toBe("my-input-label");
      expect(result.current.descriptionId).toBe("my-input-description");
      expect(result.current.errorId).toBe("my-input-error");
      expect(result.current.groupId).toBe("my-input-group");
    });

    it("IDs are stable across re-renders", () => {
      const { result, rerender } = renderHook(() => useAccessibilityRelationships());
      const first = result.current.fieldId;
      rerender();
      expect(result.current.fieldId).toBe(first);
    });
  });

  describe("aria-labelledby", () => {
    it("returns undefined when no label", () => {
      const { result } = renderHook(() => useAccessibilityRelationships());
      expect(result.current.ariaLabelledBy).toBeUndefined();
    });

    it("includes label ID when hasLabel is true", () => {
      const { result } = renderHook(() =>
        useAccessibilityRelationships({ id: "f1", hasLabel: true }),
      );
      expect(result.current.ariaLabelledBy).toBe("f1-label");
    });

    it("merges consumer labelledBy with generated label", () => {
      const { result } = renderHook(() =>
        useAccessibilityRelationships({ id: "f1", hasLabel: true, labelledBy: "external-label" }),
      );
      expect(result.current.ariaLabelledBy).toBe("external-label f1-label");
    });

    it("returns consumer labelledBy when no label element", () => {
      const { result } = renderHook(() => useAccessibilityRelationships({ labelledBy: "ext" }));
      expect(result.current.ariaLabelledBy).toBe("ext");
    });
  });

  describe("aria-describedby", () => {
    it("returns undefined when no description or error", () => {
      const { result } = renderHook(() => useAccessibilityRelationships());
      expect(result.current.ariaDescribedBy).toBeUndefined();
    });

    it("includes description ID when hasDescription", () => {
      const { result } = renderHook(() =>
        useAccessibilityRelationships({ id: "f1", hasDescription: true }),
      );
      expect(result.current.ariaDescribedBy).toBe("f1-description");
    });

    it("includes error ID when hasError", () => {
      const { result } = renderHook(() =>
        useAccessibilityRelationships({ id: "f1", hasError: true }),
      );
      expect(result.current.ariaDescribedBy).toBe("f1-error");
    });

    it("includes both description and error", () => {
      const { result } = renderHook(() =>
        useAccessibilityRelationships({ id: "f1", hasDescription: true, hasError: true }),
      );
      expect(result.current.ariaDescribedBy).toBe("f1-description f1-error");
    });

    it("merges consumer describedBy", () => {
      const { result } = renderHook(() =>
        useAccessibilityRelationships({ id: "f1", hasDescription: true, describedBy: "hint" }),
      );
      expect(result.current.ariaDescribedBy).toBe("hint f1-description");
    });
  });

  describe("aria-errormessage", () => {
    it("returns undefined when no error", () => {
      const { result } = renderHook(() => useAccessibilityRelationships());
      expect(result.current.ariaErrorMessage).toBeUndefined();
    });

    it("returns error ID when hasError", () => {
      const { result } = renderHook(() =>
        useAccessibilityRelationships({ id: "f1", hasError: true }),
      );
      expect(result.current.ariaErrorMessage).toBe("f1-error");
    });
  });

  describe("required and invalid metadata", () => {
    it("passes through required", () => {
      const { result } = renderHook(() => useAccessibilityRelationships({ required: true }));
      expect(result.current.ariaRequired).toBe(true);
    });

    it("passes through invalid", () => {
      const { result } = renderHook(() => useAccessibilityRelationships({ invalid: true }));
      expect(result.current.ariaInvalid).toBe(true);
    });

    it("undefined when not set", () => {
      const { result } = renderHook(() => useAccessibilityRelationships());
      expect(result.current.ariaRequired).toBeUndefined();
      expect(result.current.ariaInvalid).toBeUndefined();
    });
  });

  describe("SSR", () => {
    it("produces valid IDs during server render", () => {
      function TestComponent() {
        const rels = useAccessibilityRelationships({ id: "ssr-field", hasLabel: true });
        return createElement("input", {
          id: rels.fieldId,
          "aria-labelledby": rels.ariaLabelledBy,
        });
      }
      const html = renderToString(createElement(TestComponent));
      expect(html).toContain('id="ssr-field"');
      expect(html).toContain('aria-labelledby="ssr-field-label"');
    });
  });
});
