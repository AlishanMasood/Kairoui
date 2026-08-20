import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import {
  AccordionInternalContext,
  useAccordionInternalContext,
  useAccordionItemInternalContext,
  getAccordionTriggerId,
  getAccordionContentId,
} from "./accordion-types";
import type {
  AccordionRootProps,
  AccordionItemRootProps,
  AccordionHeaderProps,
  AccordionContentRootProps,
  AccordionInternalContextValue,
  AccordionItemInternalContextValue,
} from "./accordion-types";

// ─── Context ────────────────────────────────────────────────────────

describe("Accordion architecture: context", () => {
  it("useAccordionInternalContext throws outside provider", () => {
    expect(() => renderHook(() => useAccordionInternalContext())).toThrow(
      "Accordion compound components must be used within <Accordion>.",
    );
  });

  it("useAccordionItemInternalContext throws outside provider", () => {
    expect(() => renderHook(() => useAccordionItemInternalContext())).toThrow(
      "AccordionTrigger/Header/Content must be used within <AccordionItem>.",
    );
  });

  it("context provides expected shape", () => {
    const value: AccordionInternalContextValue = {
      type: "single",
      value: ["item1"],
      onItemToggle: () => {},
      collapsible: false,
      orientation: "vertical",
      dir: "ltr",
      disabled: false,
      baseId: "acc-1",
    };
    const { result } = renderHook(() => useAccordionInternalContext(), {
      wrapper: ({ children }) =>
        createElement(AccordionInternalContext.Provider, { value }, children),
    });
    expect(result.current.type).toBe("single");
    expect(result.current.baseId).toBe("acc-1");
  });
});

// ─── ID helpers ─────────────────────────────────────────────────────

describe("Accordion architecture: ID generation", () => {
  it("getAccordionTriggerId", () => {
    expect(getAccordionTriggerId("acc-1", "item-a")).toBe("acc-1-trigger-item-a");
  });

  it("getAccordionContentId", () => {
    expect(getAccordionContentId("acc-1", "item-a")).toBe("acc-1-content-item-a");
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Accordion architecture: type contracts", () => {
  it("AccordionRootProps is discriminated union", () => {
    expectTypeOf<AccordionRootProps>().toHaveProperty("type");
  });

  it("AccordionItemRootProps requires value", () => {
    expectTypeOf<AccordionItemRootProps>().toHaveProperty("value");
    expectTypeOf<AccordionItemRootProps>().toHaveProperty("disabled");
  });

  it("AccordionHeaderProps supports heading level", () => {
    expectTypeOf<AccordionHeaderProps>().toHaveProperty("level");
  });

  it("AccordionContentRootProps supports forceMount", () => {
    expectTypeOf<AccordionContentRootProps>().toHaveProperty("forceMount");
  });

  it("AccordionInternalContextValue has baseId + type + collapsible", () => {
    expectTypeOf<AccordionInternalContextValue>().toHaveProperty("baseId");
    expectTypeOf<AccordionInternalContextValue>().toHaveProperty("type");
    expectTypeOf<AccordionInternalContextValue>().toHaveProperty("collapsible");
    expectTypeOf<AccordionInternalContextValue>().toHaveProperty("orientation");
  });

  it("AccordionItemInternalContextValue has open + triggerId + contentId", () => {
    expectTypeOf<AccordionItemInternalContextValue>().toHaveProperty("open");
    expectTypeOf<AccordionItemInternalContextValue>().toHaveProperty("triggerId");
    expectTypeOf<AccordionItemInternalContextValue>().toHaveProperty("contentId");
  });
});
