import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Progress, ProgressTrack, ProgressIndicator, Spinner } from "./progress";

afterEach(cleanup);

// ─── Progress: rendering ────────────────────────────────────────────

describe("Progress: rendering", () => {
  it("renders with progressbar role", () => {
    render(createElement(Progress, { "data-testid": "p", value: 50 } as never));
    const el = screen.getByTestId("p");
    expect(el.getAttribute("role")).toBe("progressbar");
    expect(el.getAttribute("data-kui-component")).toBe("Progress");
  });

  it("renders track and indicator", () => {
    render(
      createElement(
        Progress,
        { value: 75 },
        createElement(
          ProgressTrack,
          { "data-testid": "track" } as never,
          createElement(ProgressIndicator, { "data-testid": "indicator" } as never),
        ),
      ),
    );
    expect(screen.getByTestId("track").getAttribute("data-kui-component")).toBe("ProgressTrack");
    expect(screen.getByTestId("indicator").getAttribute("data-kui-component")).toBe(
      "ProgressIndicator",
    );
  });
});

// ─── Progress: determinate ──────────────────────────────────────────

describe("Progress: determinate", () => {
  it("sets aria-valuenow", () => {
    render(createElement(Progress, { "data-testid": "p", value: 40 } as never));
    expect(screen.getByTestId("p").getAttribute("aria-valuenow")).toBe("40");
  });

  it("sets aria-valuemin and aria-valuemax", () => {
    render(createElement(Progress, { "data-testid": "p", value: 5, min: 0, max: 10 } as never));
    const el = screen.getByTestId("p");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("10");
  });

  it("computes percent in data-value", () => {
    render(createElement(Progress, { "data-testid": "p", value: 25 } as never));
    expect(screen.getByTestId("p").getAttribute("data-value")).toBe("25");
  });

  it("computes percent with custom min/max", () => {
    render(createElement(Progress, { "data-testid": "p", value: 5, min: 0, max: 10 } as never));
    expect(screen.getByTestId("p").getAttribute("data-value")).toBe("50");
  });

  it("has data-state=determinate", () => {
    render(createElement(Progress, { "data-testid": "p", value: 60 } as never));
    expect(screen.getByTestId("p").getAttribute("data-state")).toBe("determinate");
  });

  it("sets aria-valuetext with percent", () => {
    render(createElement(Progress, { "data-testid": "p", value: 33 } as never));
    expect(screen.getByTestId("p").getAttribute("aria-valuetext")).toBe("33%");
  });

  it("supports custom valueText", () => {
    render(
      createElement(Progress, {
        "data-testid": "p",
        value: 3,
        max: 10,
        valueText: "3 of 10 steps",
      } as never),
    );
    expect(screen.getByTestId("p").getAttribute("aria-valuetext")).toBe("3 of 10 steps");
  });
});

// ─── Progress: indeterminate ────────────────────────────────────────

describe("Progress: indeterminate", () => {
  it("has data-state=indeterminate when no value", () => {
    render(createElement(Progress, { "data-testid": "p" } as never));
    expect(screen.getByTestId("p").getAttribute("data-state")).toBe("indeterminate");
  });

  it("has no aria-valuenow when indeterminate", () => {
    render(createElement(Progress, { "data-testid": "p" } as never));
    expect(screen.getByTestId("p").getAttribute("aria-valuenow")).toBeNull();
  });
});

// ─── Progress: accessibility ────────────────────────────────────────

describe("Progress: accessibility", () => {
  it("supports aria-label", () => {
    render(
      createElement(Progress, { "data-testid": "p", value: 50, label: "Upload progress" } as never),
    );
    expect(screen.getByTestId("p").getAttribute("aria-label")).toBe("Upload progress");
  });
});

// ─── Spinner: rendering ─────────────────────────────────────────────

describe("Spinner: rendering", () => {
  it("renders with role=status", () => {
    render(createElement(Spinner, { "data-testid": "s" } as never));
    const el = screen.getByTestId("s");
    expect(el.getAttribute("role")).toBe("status");
    expect(el.getAttribute("data-kui-component")).toBe("Spinner");
  });

  it("has default label 'Loading'", () => {
    render(createElement(Spinner, { "data-testid": "s" } as never));
    expect(screen.getByTestId("s").getAttribute("aria-label")).toBe("Loading");
  });

  it("supports custom label", () => {
    render(createElement(Spinner, { "data-testid": "s", label: "Saving" } as never));
    expect(screen.getByTestId("s").getAttribute("aria-label")).toBe("Saving");
  });
});

// ─── Spinner: size ──────────────────────────────────────────────────

describe("Spinner: size", () => {
  it("defaults to md", () => {
    render(createElement(Spinner, { "data-testid": "s" } as never));
    expect(screen.getByTestId("s").getAttribute("data-size")).toBe("md");
  });

  it.each(["sm", "md", "lg"] as const)("supports %s size", (size) => {
    render(createElement(Spinner, { size, "data-testid": "s" } as never));
    expect(screen.getByTestId("s").getAttribute("data-size")).toBe(size);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Progress/Spinner: SSR", () => {
  it("Progress renders on server", () => {
    const html = renderToString(createElement(Progress, { value: 50, label: "Upload" }));
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="50"');
  });

  it("Spinner renders on server", () => {
    const html = renderToString(createElement(Spinner, { label: "Loading" }));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Progress/Spinner: Strict Mode", () => {
  it("Progress works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(Progress, { "data-testid": "p", value: 80 } as never),
      ),
    );
    expect(screen.getByTestId("p").getAttribute("aria-valuenow")).toBe("80");
  });

  it("Spinner works in StrictMode", () => {
    render(
      createElement(StrictMode, null, createElement(Spinner, { "data-testid": "s" } as never)),
    );
    expect(screen.getByTestId("s").getAttribute("role")).toBe("status");
  });
});
