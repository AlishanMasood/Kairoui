import { describe, it, expect, afterEach } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { DescriptionList, DescriptionTerm, DescriptionDetails } from "./description-list";

afterEach(cleanup);

// ─── Semantic HTML ──────────────────────────────────────────────────

describe("DescriptionList: semantic HTML", () => {
  it("renders root as <dl>", () => {
    render(
      createElement(
        DescriptionList,
        { "data-testid": "dl" } as never,
        createElement(DescriptionTerm, null, "Term"),
        createElement(DescriptionDetails, null, "Details"),
      ),
    );
    expect(screen.getByTestId("dl").tagName).toBe("DL");
  });

  it("renders term as <dt>", () => {
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, { "data-testid": "dt" } as never, "Name"),
        createElement(DescriptionDetails, null, "Value"),
      ),
    );
    expect(screen.getByTestId("dt").tagName).toBe("DT");
  });

  it("renders details as <dd>", () => {
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "Name"),
        createElement(DescriptionDetails, { "data-testid": "dd" } as never, "Value"),
      ),
    );
    expect(screen.getByTestId("dd").tagName).toBe("DD");
  });

  it("renders term role for accessibility", () => {
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "Key"),
        createElement(DescriptionDetails, null, "Val"),
      ),
    );
    expect(screen.getByRole("term")).toBeInTheDocument();
  });

  it("renders definition role for accessibility", () => {
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "Key"),
        createElement(DescriptionDetails, null, "Val"),
      ),
    );
    expect(screen.getByRole("definition")).toBeInTheDocument();
  });
});

// ─── Layout ─────────────────────────────────────────────────────────

describe("DescriptionList: layout", () => {
  it("defaults to vertical layout", () => {
    render(
      createElement(
        DescriptionList,
        { "data-testid": "dl" } as never,
        createElement(DescriptionTerm, null, "T"),
        createElement(DescriptionDetails, null, "D"),
      ),
    );
    expect(screen.getByTestId("dl").getAttribute("data-layout")).toBe("vertical");
  });

  it("supports horizontal layout", () => {
    render(
      createElement(
        DescriptionList,
        { layout: "horizontal", "data-testid": "dl" } as never,
        createElement(DescriptionTerm, null, "T"),
        createElement(DescriptionDetails, null, "D"),
      ),
    );
    expect(screen.getByTestId("dl").getAttribute("data-layout")).toBe("horizontal");
  });
});

// ─── Props ──────────────────────────────────────────────────────────

describe("DescriptionList: props", () => {
  it("sets data-kui-component on all parts", () => {
    render(
      createElement(
        DescriptionList,
        { "data-testid": "dl" } as never,
        createElement(DescriptionTerm, { "data-testid": "dt" } as never, "T"),
        createElement(DescriptionDetails, { "data-testid": "dd" } as never, "D"),
      ),
    );
    expect(screen.getByTestId("dl").getAttribute("data-kui-component")).toBe("DescriptionList");
    expect(screen.getByTestId("dt").getAttribute("data-kui-component")).toBe("DescriptionTerm");
    expect(screen.getByTestId("dd").getAttribute("data-kui-component")).toBe("DescriptionDetails");
  });

  it("passes className", () => {
    render(
      createElement(
        DescriptionList,
        { className: "my-dl", "data-testid": "dl" } as never,
        createElement(DescriptionTerm, { className: "my-dt", "data-testid": "dt" } as never, "T"),
        createElement(
          DescriptionDetails,
          { className: "my-dd", "data-testid": "dd" } as never,
          "D",
        ),
      ),
    );
    expect(screen.getByTestId("dl").className).toBe("my-dl");
    expect(screen.getByTestId("dt").className).toBe("my-dt");
    expect(screen.getByTestId("dd").className).toBe("my-dd");
  });

  it("spreads native HTML attributes", () => {
    render(
      createElement(
        DescriptionList,
        { id: "dl-id", "data-testid": "dl" } as never,
        createElement(DescriptionTerm, null, "T"),
      ),
    );
    expect(screen.getByTestId("dl").id).toBe("dl-id");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("DescriptionList: ref forwarding", () => {
  it("forwards ref on DescriptionList", () => {
    const ref = createRef<HTMLDListElement>();
    render(
      createElement(
        DescriptionList,
        { ref },
        createElement(DescriptionTerm, null, "T"),
        createElement(DescriptionDetails, null, "D"),
      ),
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe("DL");
  });

  it("forwards ref on DescriptionTerm", () => {
    const ref = createRef<HTMLElement>();
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, { ref }, "T"),
        createElement(DescriptionDetails, null, "D"),
      ),
    );
    expect(ref.current?.tagName).toBe("DT");
  });

  it("forwards ref on DescriptionDetails", () => {
    const ref = createRef<HTMLElement>();
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "T"),
        createElement(DescriptionDetails, { ref }, "D"),
      ),
    );
    expect(ref.current?.tagName).toBe("DD");
  });
});

// ─── Multiple pairs ─────────────────────────────────────────────────

describe("DescriptionList: multiple pairs", () => {
  it("renders multiple term/details pairs", () => {
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "Name"),
        createElement(DescriptionDetails, null, "Alice"),
        createElement(DescriptionTerm, null, "Role"),
        createElement(DescriptionDetails, null, "Engineer"),
        createElement(DescriptionTerm, null, "Team"),
        createElement(DescriptionDetails, null, "Platform"),
      ),
    );
    expect(screen.getAllByRole("term")).toHaveLength(3);
    expect(screen.getAllByRole("definition")).toHaveLength(3);
  });

  it("supports multiple details per term", () => {
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "Languages"),
        createElement(DescriptionDetails, null, "TypeScript"),
        createElement(DescriptionDetails, null, "Rust"),
      ),
    );
    expect(screen.getAllByRole("definition")).toHaveLength(2);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("DescriptionList: SSR", () => {
  it("renders to string without errors", () => {
    const html = renderToString(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "Key"),
        createElement(DescriptionDetails, null, "Value"),
      ),
    );
    expect(html).toContain("<dl");
    expect(html).toContain("<dt");
    expect(html).toContain("<dd");
    expect(html).toContain("Key");
    expect(html).toContain("Value");
  });

  it("renders horizontal layout to string", () => {
    const html = renderToString(
      createElement(
        DescriptionList,
        { layout: "horizontal" },
        createElement(DescriptionTerm, null, "T"),
        createElement(DescriptionDetails, null, "D"),
      ),
    );
    expect(html).toContain('data-layout="horizontal"');
  });
});

// ─── StrictMode ─────────────────────────────────────────────────────

describe("DescriptionList: StrictMode", () => {
  it("works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          DescriptionList,
          null,
          createElement(DescriptionTerm, null, "Key"),
          createElement(DescriptionDetails, null, "Value"),
        ),
      ),
    );
    expect(screen.getByRole("term")).toBeInTheDocument();
    expect(screen.getByRole("definition")).toBeInTheDocument();
  });
});
