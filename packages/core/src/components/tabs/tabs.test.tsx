import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

afterEach(cleanup);

function BasicTabs(props: {
  defaultValue?: string;
  orientation?: "horizontal" | "vertical";
  activationMode?: "automatic" | "manual";
  dir?: "ltr" | "rtl";
}) {
  return createElement(
    Tabs,
    {
      defaultValue: props.defaultValue ?? "tab1",
      orientation: props.orientation,
      activationMode: props.activationMode,
      dir: props.dir,
    },
    createElement(
      TabsList,
      { "data-testid": "list" } as never,
      createElement(TabsTrigger, { value: "tab1", "data-testid": "t1" } as never, "Tab 1"),
      createElement(TabsTrigger, { value: "tab2", "data-testid": "t2" } as never, "Tab 2"),
      createElement(
        TabsTrigger,
        { value: "tab3", "data-testid": "t3", disabled: true } as never,
        "Tab 3",
      ),
    ),
    createElement(TabsContent, { value: "tab1", "data-testid": "p1" } as never, "Panel 1"),
    createElement(TabsContent, { value: "tab2", "data-testid": "p2" } as never, "Panel 2"),
    createElement(TabsContent, { value: "tab3", "data-testid": "p3" } as never, "Panel 3"),
  );
}
BasicTabs.displayName = "BasicTabs";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Tabs: rendering", () => {
  it("renders with correct roles", () => {
    render(createElement(BasicTabs));
    expect(screen.getByTestId("list").getAttribute("role")).toBe("tablist");
    expect(screen.getByTestId("t1").getAttribute("role")).toBe("tab");
    expect(screen.getByTestId("p1").getAttribute("role")).toBe("tabpanel");
  });

  it("active tab has aria-selected=true", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1" }));
    expect(screen.getByTestId("t1").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("t2").getAttribute("aria-selected")).toBe("false");
  });

  it("trigger has aria-controls pointing to panel", () => {
    render(createElement(BasicTabs));
    const trigger = screen.getByTestId("t1");
    const panel = screen.getByTestId("p1");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
  });

  it("panel has aria-labelledby pointing to trigger", () => {
    render(createElement(BasicTabs));
    const trigger = screen.getByTestId("t1");
    const panel = screen.getByTestId("p1");
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
  });

  it("inactive panel has hidden attribute", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1" }));
    expect(screen.getByTestId("p2").hidden).toBe(true);
  });

  it("active panel does not have hidden", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1" }));
    expect(screen.getByTestId("p1").hidden).toBe(false);
  });
});

// ─── Activation ─────────────────────────────────────────────────────

describe("Tabs: activation", () => {
  it("clicking trigger activates tab", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1" }));
    fireEvent.click(screen.getByTestId("t2"));
    expect(screen.getByTestId("t2").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("p2").hidden).toBe(false);
    expect(screen.getByTestId("p1").hidden).toBe(true);
  });

  it("disabled trigger cannot be activated", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1" }));
    fireEvent.click(screen.getByTestId("t3"));
    expect(screen.getByTestId("t1").getAttribute("aria-selected")).toBe("true");
  });
});

// ─── Keyboard: automatic mode ───────────────────────────────────────

describe("Tabs: keyboard (automatic)", () => {
  it("ArrowRight moves focus and activates next tab", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1" }));
    screen.getByTestId("t1").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("t2"));
    expect(screen.getByTestId("t2").getAttribute("aria-selected")).toBe("true");
  });

  it("ArrowLeft moves focus and activates previous tab", () => {
    render(createElement(BasicTabs, { defaultValue: "tab2" }));
    screen.getByTestId("t2").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByTestId("t1"));
    expect(screen.getByTestId("t1").getAttribute("aria-selected")).toBe("true");
  });

  it("skips disabled tabs (wraps to first when loop=true)", () => {
    render(createElement(BasicTabs, { defaultValue: "tab2" }));
    screen.getByTestId("t2").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "ArrowRight" });
    // tab3 is disabled, loops back to tab1 (loop defaults to true)
    expect(document.activeElement).toBe(screen.getByTestId("t1"));
  });

  it("Home moves to first tab", () => {
    render(createElement(BasicTabs, { defaultValue: "tab2" }));
    screen.getByTestId("t2").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "Home" });
    expect(document.activeElement).toBe(screen.getByTestId("t1"));
  });

  it("End moves to last enabled tab", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1" }));
    screen.getByTestId("t1").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "End" });
    expect(document.activeElement).toBe(screen.getByTestId("t2"));
  });
});

// ─── Keyboard: manual mode ──────────────────────────────────────────

describe("Tabs: keyboard (manual)", () => {
  it("ArrowRight moves focus but does NOT activate", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1", activationMode: "manual" }));
    screen.getByTestId("t1").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("t2"));
    expect(screen.getByTestId("t1").getAttribute("aria-selected")).toBe("true");
  });

  it("Enter activates focused tab in manual mode", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1", activationMode: "manual" }));
    screen.getByTestId("t1").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByTestId("t2"), { key: "Enter" });
    expect(screen.getByTestId("t2").getAttribute("aria-selected")).toBe("true");
  });

  it("Space activates focused tab in manual mode", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1", activationMode: "manual" }));
    screen.getByTestId("t1").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByTestId("t2"), { key: " " });
    expect(screen.getByTestId("t2").getAttribute("aria-selected")).toBe("true");
  });
});

// ─── Vertical orientation ───────────────────────────────────────────

describe("Tabs: vertical", () => {
  it("ArrowDown moves focus in vertical", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1", orientation: "vertical" }));
    screen.getByTestId("t1").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("t2"));
  });

  it("tablist has aria-orientation=vertical", () => {
    render(createElement(BasicTabs, { orientation: "vertical" }));
    expect(screen.getByTestId("list").getAttribute("aria-orientation")).toBe("vertical");
  });
});

// ─── RTL ────────────────────────────────────────────────────────────

describe("Tabs: RTL", () => {
  it("ArrowLeft moves forward in RTL", () => {
    render(createElement(BasicTabs, { defaultValue: "tab1", dir: "rtl" }));
    screen.getByTestId("t1").focus();
    fireEvent.keyDown(screen.getByTestId("list"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByTestId("t2"));
  });
});

// ─── Lazy mounting ──────────────────────────────────────────────────

describe("Tabs: lazy mounting", () => {
  it("lazy panel not mounted when inactive", () => {
    render(
      createElement(
        Tabs,
        { defaultValue: "a" },
        createElement(
          TabsList,
          null,
          createElement(TabsTrigger, { value: "a" }, "A"),
          createElement(TabsTrigger, { value: "b" }, "B"),
        ),
        createElement(TabsContent, { value: "a" }, "Active"),
        createElement(
          TabsContent,
          { value: "b", lazy: true, "data-testid": "lazy-panel" } as never,
          "Lazy",
        ),
      ),
    );
    expect(screen.queryByTestId("lazy-panel")).toBeNull();
  });

  it("lazy panel mounts when activated", () => {
    render(
      createElement(
        Tabs,
        { defaultValue: "a" },
        createElement(
          TabsList,
          null,
          createElement(TabsTrigger, { value: "a", "data-testid": "ta" } as never, "A"),
          createElement(TabsTrigger, { value: "b", "data-testid": "tb" } as never, "B"),
        ),
        createElement(TabsContent, { value: "a" }, "Active"),
        createElement(
          TabsContent,
          { value: "b", lazy: true, "data-testid": "lazy-panel" } as never,
          "Lazy",
        ),
      ),
    );
    fireEvent.click(screen.getByTestId("tb"));
    expect(screen.getByTestId("lazy-panel")).not.toBeNull();
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Tabs: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(BasicTabs));
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain("Panel 1");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Tabs: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(BasicTabs)));
    expect(screen.getByTestId("t1").getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByTestId("t2"));
    expect(screen.getByTestId("t2").getAttribute("aria-selected")).toBe("true");
  });
});

// ─── data-kui-component markers ─────────────────────────────────────

describe("Tabs: component markers", () => {
  it("all parts have data-kui-component", () => {
    render(createElement(BasicTabs));
    expect(document.querySelector("[data-kui-component='Tabs']")).not.toBeNull();
    expect(screen.getByTestId("list").getAttribute("data-kui-component")).toBe("TabsList");
    expect(screen.getByTestId("t1").getAttribute("data-kui-component")).toBe("TabsTrigger");
    expect(screen.getByTestId("p1").getAttribute("data-kui-component")).toBe("TabsContent");
  });
});
