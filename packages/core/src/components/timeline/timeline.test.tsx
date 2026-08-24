import { describe, it, expect, afterEach } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineConnector,
  TimelineContent,
  TimelineTitle,
  TimelineDescription,
  TimelineTime,
} from "./timeline";

afterEach(cleanup);

function SimpleTimeline() {
  return createElement(
    Timeline,
    null,
    createElement(
      TimelineItem,
      null,
      createElement(TimelineIndicator),
      createElement(TimelineConnector),
      createElement(
        TimelineContent,
        null,
        createElement(TimelineTitle, null, "Step 1"),
        createElement(TimelineDescription, null, "First step description"),
        createElement(TimelineTime, { dateTime: "2026-01-01" }, "Jan 1, 2026"),
      ),
    ),
    createElement(
      TimelineItem,
      null,
      createElement(TimelineIndicator),
      createElement(
        TimelineContent,
        null,
        createElement(TimelineTitle, null, "Step 2"),
        createElement(TimelineDescription, null, "Second step description"),
      ),
    ),
  );
}

// ─── Semantic HTML ──────────────────────────────────────────────────

describe("Timeline: semantic HTML", () => {
  it("renders root as <ol>", () => {
    render(createElement(Timeline, { "data-testid": "tl" } as never));
    expect(screen.getByTestId("tl").tagName).toBe("OL");
  });

  it("renders items as <li>", () => {
    render(SimpleTimeline());
    const items = document.querySelectorAll("[data-kui-component='TimelineItem']");
    expect(items).toHaveLength(2);
    expect(items[0]!.tagName).toBe("LI");
  });

  it("renders time as <time> with dateTime", () => {
    render(SimpleTimeline());
    const time = document.querySelector("time")!;
    expect(time.getAttribute("datetime")).toBe("2026-01-01");
    expect(time.textContent).toBe("Jan 1, 2026");
  });

  it("renders title and description as <p>", () => {
    render(SimpleTimeline());
    const title = document.querySelector("[data-kui-component='TimelineTitle']")!;
    const desc = document.querySelector("[data-kui-component='TimelineDescription']")!;
    expect(title.tagName).toBe("P");
    expect(desc.tagName).toBe("P");
  });

  it("has accessible list semantics", () => {
    render(SimpleTimeline());
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

// ─── Data attributes ────────────────────────────────────────────────

describe("Timeline: data attributes", () => {
  it("sets data-kui-component on all parts", () => {
    render(SimpleTimeline());
    expect(document.querySelector("[data-kui-component='Timeline']")).toBeInTheDocument();
    expect(document.querySelector("[data-kui-component='TimelineItem']")).toBeInTheDocument();
    expect(document.querySelector("[data-kui-component='TimelineIndicator']")).toBeInTheDocument();
    expect(document.querySelector("[data-kui-component='TimelineConnector']")).toBeInTheDocument();
    expect(document.querySelector("[data-kui-component='TimelineContent']")).toBeInTheDocument();
    expect(document.querySelector("[data-kui-component='TimelineTitle']")).toBeInTheDocument();
    expect(
      document.querySelector("[data-kui-component='TimelineDescription']"),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-kui-component='TimelineTime']")).toBeInTheDocument();
  });

  it("sets data-orientation on root", () => {
    render(createElement(Timeline, { "data-testid": "tl" } as never));
    expect(screen.getByTestId("tl").getAttribute("data-orientation")).toBe("vertical");
  });
});

// ─── Decorative elements ────────────────────────────────────────────

describe("Timeline: decorative elements", () => {
  it("indicator is aria-hidden", () => {
    render(SimpleTimeline());
    const indicator = document.querySelector("[data-kui-component='TimelineIndicator']")!;
    expect(indicator.getAttribute("aria-hidden")).toBe("true");
  });

  it("connector is aria-hidden", () => {
    render(SimpleTimeline());
    const connector = document.querySelector("[data-kui-component='TimelineConnector']")!;
    expect(connector.getAttribute("aria-hidden")).toBe("true");
  });

  it("indicator renders default dot when no children", () => {
    render(SimpleTimeline());
    const dot = document.querySelector("[data-kui-component='TimelineIndicatorDot']");
    expect(dot).toBeInTheDocument();
  });

  it("indicator renders custom content", () => {
    render(
      createElement(
        Timeline,
        null,
        createElement(
          TimelineItem,
          null,
          createElement(TimelineIndicator, null, "✓"),
          createElement(TimelineContent, null, createElement(TimelineTitle, null, "Done")),
        ),
      ),
    );
    expect(screen.getByText("✓")).toBeInTheDocument();
  });
});

// ─── Props ──────────────────────────────────────────────────────────

describe("Timeline: props", () => {
  it("passes className to all parts", () => {
    render(
      createElement(
        Timeline,
        { className: "tl", "data-testid": "root" } as never,
        createElement(
          TimelineItem,
          { className: "item", "data-testid": "item" } as never,
          createElement(
            TimelineContent,
            { className: "content", "data-testid": "content" } as never,
            createElement(TimelineTitle, null, "T"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("root").className).toBe("tl");
    expect(screen.getByTestId("item").className).toBe("item");
    expect(screen.getByTestId("content").className).toBe("content");
  });

  it("spreads native HTML attributes", () => {
    render(createElement(Timeline, { id: "my-tl", "data-testid": "root" } as never));
    expect(screen.getByTestId("root").id).toBe("my-tl");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Timeline: ref forwarding", () => {
  it("Timeline forwards ref to <ol>", () => {
    const ref = createRef<HTMLOListElement>();
    render(createElement(Timeline, { ref }));
    expect(ref.current?.tagName).toBe("OL");
  });

  it("TimelineItem forwards ref", () => {
    const ref = createRef<HTMLLIElement>();
    render(createElement(Timeline, null, createElement(TimelineItem, { ref })));
    expect(ref.current?.tagName).toBe("LI");
  });

  it("TimelineTime forwards ref", () => {
    const ref = createRef<HTMLTimeElement>();
    render(
      createElement(
        Timeline,
        null,
        createElement(
          TimelineItem,
          null,
          createElement(
            TimelineContent,
            null,
            createElement(TimelineTime, { ref, dateTime: "2026-01-01" }, "Jan"),
          ),
        ),
      ),
    );
    expect(ref.current?.tagName).toBe("TIME");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Timeline: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(SimpleTimeline());
    expect(html).toContain("<ol");
    expect(html).toContain("<li");
    expect(html).toContain("<time");
    expect(html).toContain("Step 1");
    expect(html).toContain("2026-01-01");
  });
});

// ─── StrictMode ─────────────────────────────────────────────────────

describe("Timeline: StrictMode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, SimpleTimeline()));
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
