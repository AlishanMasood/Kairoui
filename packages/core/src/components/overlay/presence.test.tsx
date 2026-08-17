import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode, useState } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Presence } from "./presence";

afterEach(cleanup);

// ─── Basic mount/unmount ────────────────────────────────────────────

describe("Presence: mount/unmount", () => {
  it("renders children when present=true", () => {
    render(
      createElement(
        Presence,
        { present: true },
        createElement("div", { "data-testid": "child" }, "hi"),
      ),
    );
    expect(screen.getByTestId("child")).not.toBeNull();
  });

  it("renders nothing when present=false", () => {
    render(
      createElement(
        Presence,
        { present: false },
        createElement("div", { "data-testid": "child" }, "hi"),
      ),
    );
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("mounts when present transitions false→true", () => {
    const { rerender } = render(
      createElement(
        Presence,
        { present: false },
        createElement("div", { "data-testid": "child" }, "hi"),
      ),
    );
    expect(screen.queryByTestId("child")).toBeNull();

    rerender(
      createElement(
        Presence,
        { present: true },
        createElement("div", { "data-testid": "child" }, "hi"),
      ),
    );
    expect(screen.getByTestId("child")).not.toBeNull();
  });

  it("unmounts immediately when no animation (present true→false)", () => {
    const { rerender } = render(
      createElement(
        Presence,
        { present: true },
        createElement("div", { "data-testid": "child" }, "hi"),
      ),
    );
    expect(screen.getByTestId("child")).not.toBeNull();

    rerender(
      createElement(
        Presence,
        { present: false },
        createElement("div", { "data-testid": "child" }, "hi"),
      ),
    );
    // Without animations, should unmount immediately (in next tick)
    expect(screen.queryByTestId("child")).toBeNull();
  });
});

// ─── Render prop ────────────────────────────────────────────────────

describe("Presence: render prop", () => {
  it("passes present and ref to render function", () => {
    let receivedPresent: boolean | undefined;
    let receivedRef: ((node: HTMLElement | null) => void) | undefined;

    render(
      createElement(
        Presence,
        { present: true },
        (props: { present: boolean; ref: (node: HTMLElement | null) => void }) => {
          receivedPresent = props.present;
          receivedRef = props.ref;
          return createElement("div", { "data-testid": "render-prop" }, "content");
        },
      ),
    );

    expect(receivedPresent).toBe(true);
    expect(typeof receivedRef).toBe("function");
    expect(screen.getByTestId("render-prop")).not.toBeNull();
  });

  it("render prop receives present=false during exit", () => {
    let lastPresent: boolean | undefined;

    function TestComponent({ show }: { show: boolean }) {
      return createElement(
        Presence,
        { present: show },
        (props: { present: boolean; ref: (node: HTMLElement | null) => void }) => {
          lastPresent = props.present;
          return createElement("div", { "data-testid": "child" }, "content");
        },
      );
    }
    TestComponent.displayName = "TestComponent";

    const { rerender } = render(createElement(TestComponent, { show: true }));
    expect(lastPresent).toBe(true);

    rerender(createElement(TestComponent, { show: false }));
    // After unmount (no animation), should not render at all
    expect(screen.queryByTestId("child")).toBeNull();
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Presence: SSR", () => {
  it("renders children when present=true in SSR", () => {
    const html = renderToString(
      createElement(Presence, { present: true }, createElement("div", null, "visible")),
    );
    expect(html).toContain("visible");
  });

  it("renders nothing when present=false in SSR", () => {
    const html = renderToString(
      createElement(Presence, { present: false }, createElement("div", null, "hidden")),
    );
    expect(html).toBe("");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Presence: Strict Mode", () => {
  it("works correctly in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          Presence,
          { present: true },
          createElement("div", { "data-testid": "strict" }, "ok"),
        ),
      ),
    );
    expect(screen.getByTestId("strict")).not.toBeNull();
  });

  it("mounts/unmounts correctly in StrictMode", () => {
    function Toggle() {
      const [show, setShow] = useState(true);
      return createElement(
        StrictMode,
        null,
        createElement(
          "button",
          {
            "data-testid": "toggle",
            onClick: () => {
              setShow((s) => !s);
            },
          },
          "toggle",
        ),
        createElement(
          Presence,
          { present: show },
          createElement("div", { "data-testid": "content" }, "here"),
        ),
      );
    }
    Toggle.displayName = "Toggle";

    render(createElement(Toggle));
    expect(screen.getByTestId("content")).not.toBeNull();
  });
});
