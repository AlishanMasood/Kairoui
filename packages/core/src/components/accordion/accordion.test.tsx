import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";

afterEach(cleanup);

function BasicAccordion(props: {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  collapsible?: boolean;
}) {
  const { type = "single", defaultValue, collapsible } = props;
  const rootProps =
    type === "single"
      ? { type: "single" as const, defaultValue: defaultValue as string | undefined, collapsible }
      : { type: "multiple" as const, defaultValue: defaultValue as string[] | undefined };

  return createElement(
    Accordion,
    rootProps,
    createElement(
      AccordionItem,
      { value: "a" },
      createElement(
        AccordionHeader,
        null,
        createElement(AccordionTrigger, { "data-testid": "t-a" } as never, "Item A"),
      ),
      createElement(AccordionContent, { "data-testid": "c-a" } as never, "Content A"),
    ),
    createElement(
      AccordionItem,
      { value: "b" },
      createElement(
        AccordionHeader,
        null,
        createElement(AccordionTrigger, { "data-testid": "t-b" } as never, "Item B"),
      ),
      createElement(AccordionContent, { "data-testid": "c-b" } as never, "Content B"),
    ),
    createElement(
      AccordionItem,
      { value: "c", disabled: true },
      createElement(
        AccordionHeader,
        null,
        createElement(AccordionTrigger, { "data-testid": "t-c" } as never, "Item C"),
      ),
      createElement(AccordionContent, { "data-testid": "c-c" } as never, "Content C"),
    ),
  );
}
BasicAccordion.displayName = "BasicAccordion";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Accordion: rendering", () => {
  it("renders with correct structure", () => {
    render(createElement(BasicAccordion, { defaultValue: "a" }));
    expect(screen.getByTestId("t-a").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("t-b").getAttribute("aria-expanded")).toBe("false");
  });

  it("trigger has aria-controls pointing to content", () => {
    render(createElement(BasicAccordion, { defaultValue: "a" }));
    expect(screen.getByTestId("t-a").getAttribute("aria-controls")).toBe(
      screen.getByTestId("c-a").id,
    );
  });

  it("content has aria-labelledby pointing to trigger", () => {
    render(createElement(BasicAccordion, { defaultValue: "a" }));
    expect(screen.getByTestId("c-a").getAttribute("aria-labelledby")).toBe(
      screen.getByTestId("t-a").id,
    );
  });

  it("content has role=region", () => {
    render(createElement(BasicAccordion, { defaultValue: "a" }));
    expect(screen.getByTestId("c-a").getAttribute("role")).toBe("region");
  });

  it("closed content is not rendered", () => {
    render(createElement(BasicAccordion, { defaultValue: "a" }));
    expect(screen.queryByTestId("c-b")).toBeNull();
  });
});

// ─── Single mode ────────────────────────────────────────────────────

describe("Accordion: single mode", () => {
  it("clicking trigger opens item", () => {
    render(createElement(BasicAccordion));
    fireEvent.click(screen.getByTestId("t-a"));
    expect(screen.getByTestId("t-a").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("c-a")).not.toBeNull();
  });

  it("clicking another trigger closes previous", () => {
    render(createElement(BasicAccordion, { defaultValue: "a" }));
    fireEvent.click(screen.getByTestId("t-b"));
    expect(screen.getByTestId("t-b").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("t-a").getAttribute("aria-expanded")).toBe("false");
  });

  it("cannot collapse when collapsible=false", () => {
    render(createElement(BasicAccordion, { defaultValue: "a" }));
    fireEvent.click(screen.getByTestId("t-a"));
    expect(screen.getByTestId("t-a").getAttribute("aria-expanded")).toBe("true");
  });

  it("can collapse when collapsible=true", () => {
    render(createElement(BasicAccordion, { defaultValue: "a", collapsible: true }));
    fireEvent.click(screen.getByTestId("t-a"));
    expect(screen.getByTestId("t-a").getAttribute("aria-expanded")).toBe("false");
  });
});

// ─── Multiple mode ──────────────────────────────────────────────────

describe("Accordion: multiple mode", () => {
  it("can open multiple items", () => {
    render(createElement(BasicAccordion, { type: "multiple" }));
    fireEvent.click(screen.getByTestId("t-a"));
    fireEvent.click(screen.getByTestId("t-b"));
    expect(screen.getByTestId("t-a").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("t-b").getAttribute("aria-expanded")).toBe("true");
  });

  it("can close individual items", () => {
    render(createElement(BasicAccordion, { type: "multiple", defaultValue: ["a", "b"] }));
    fireEvent.click(screen.getByTestId("t-a"));
    expect(screen.getByTestId("t-a").getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByTestId("t-b").getAttribute("aria-expanded")).toBe("true");
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("Accordion: disabled", () => {
  it("disabled item cannot be toggled", () => {
    render(createElement(BasicAccordion));
    fireEvent.click(screen.getByTestId("t-c"));
    expect(screen.getByTestId("t-c").getAttribute("aria-expanded")).toBe("false");
  });

  it("disabled item has aria-disabled", () => {
    render(createElement(BasicAccordion));
    expect(screen.getByTestId("t-c").getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("Accordion: keyboard", () => {
  it("ArrowDown moves focus to next trigger", () => {
    render(createElement(BasicAccordion));
    screen.getByTestId("t-a").focus();
    fireEvent.keyDown(screen.getByTestId("t-a"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("t-b"));
  });

  it("ArrowUp moves focus to previous trigger", () => {
    render(createElement(BasicAccordion));
    screen.getByTestId("t-b").focus();
    fireEvent.keyDown(screen.getByTestId("t-b"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(screen.getByTestId("t-a"));
  });

  it("Home moves focus to first trigger", () => {
    render(createElement(BasicAccordion));
    screen.getByTestId("t-b").focus();
    fireEvent.keyDown(screen.getByTestId("t-b"), { key: "Home" });
    expect(document.activeElement).toBe(screen.getByTestId("t-a"));
  });

  it("End moves focus to last enabled trigger", () => {
    render(createElement(BasicAccordion));
    screen.getByTestId("t-a").focus();
    fireEvent.keyDown(screen.getByTestId("t-a"), { key: "End" });
    // t-c is disabled, so End goes to t-b
    expect(document.activeElement).toBe(screen.getByTestId("t-b"));
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Accordion: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(BasicAccordion, { defaultValue: "a" }));
    expect(html).toContain("Item A");
    expect(html).toContain("Content A");
    expect(html).toContain("aria-expanded");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Accordion: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(BasicAccordion, { defaultValue: "a" })));
    expect(screen.getByTestId("t-a").getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByTestId("t-b"));
    expect(screen.getByTestId("t-b").getAttribute("aria-expanded")).toBe("true");
  });
});

// ─── data-kui-component ─────────────────────────────────────────────

describe("Accordion: markers", () => {
  it("all parts have data-kui-component", () => {
    render(createElement(BasicAccordion, { defaultValue: "a" }));
    expect(document.querySelector("[data-kui-component='Accordion']")).not.toBeNull();
    expect(document.querySelector("[data-kui-component='AccordionItem']")).not.toBeNull();
    expect(document.querySelector("[data-kui-component='AccordionHeader']")).not.toBeNull();
    expect(screen.getByTestId("t-a").getAttribute("data-kui-component")).toBe("AccordionTrigger");
    expect(screen.getByTestId("c-a").getAttribute("data-kui-component")).toBe("AccordionContent");
  });
});
