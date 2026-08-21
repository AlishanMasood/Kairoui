import { describe, it, expect, afterEach } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Table,
  TableCaption,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "./table";

afterEach(cleanup);

function SimpleTable() {
  return createElement(
    Table,
    null,
    createElement(TableCaption, null, "Users"),
    createElement(
      TableHeader,
      null,
      createElement(
        TableRow,
        null,
        createElement(TableHead, null, "Name"),
        createElement(TableHead, null, "Role"),
      ),
    ),
    createElement(
      TableBody,
      null,
      createElement(
        TableRow,
        null,
        createElement(TableCell, null, "Alice"),
        createElement(TableCell, null, "Engineer"),
      ),
      createElement(
        TableRow,
        null,
        createElement(TableCell, null, "Bob"),
        createElement(TableCell, null, "Designer"),
      ),
    ),
  );
}

// ─── Semantic HTML ──────────────────────────────────────────────────

describe("Table: semantic HTML", () => {
  it("renders as <table>", () => {
    render(createElement(Table, { "data-testid": "t" } as never, createElement(TableBody, null)));
    expect(screen.getByTestId("t").tagName).toBe("TABLE");
  });

  it("renders caption as <caption>", () => {
    render(SimpleTable());
    expect(screen.getByText("Users").tagName).toBe("CAPTION");
  });

  it("renders thead, tbody sections", () => {
    const { container } = render(SimpleTable());
    expect(container.querySelector("thead")).toBeInTheDocument();
    expect(container.querySelector("tbody")).toBeInTheDocument();
  });

  it("renders tfoot when TableFooter used", () => {
    const { container } = render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(TableRow, null, createElement(TableCell, null, "A")),
        ),
        createElement(
          TableFooter,
          null,
          createElement(TableRow, null, createElement(TableCell, null, "Total")),
        ),
      ),
    );
    expect(container.querySelector("tfoot")).toBeInTheDocument();
  });

  it("renders th for header cells", () => {
    const { container } = render(SimpleTable());
    const ths = container.querySelectorAll("th");
    expect(ths).toHaveLength(2);
    expect(ths[0]!.textContent).toBe("Name");
  });

  it("renders td for data cells", () => {
    const { container } = render(SimpleTable());
    const tds = container.querySelectorAll("td");
    expect(tds).toHaveLength(4);
  });

  it("renders tr for rows", () => {
    const { container } = render(SimpleTable());
    const trs = container.querySelectorAll("tr");
    expect(trs).toHaveLength(3);
  });

  it("has accessible table role", () => {
    render(SimpleTable());
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("has accessible row roles", () => {
    render(SimpleTable());
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("has accessible columnheader roles", () => {
    render(SimpleTable());
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });

  it("has accessible cell roles", () => {
    render(SimpleTable());
    expect(screen.getAllByRole("cell")).toHaveLength(4);
  });
});

// ─── Data attributes ────────────────────────────────────────────────

describe("Table: data-kui-component", () => {
  it("sets data-kui-component on all parts", () => {
    const { container } = render(SimpleTable());
    expect(container.querySelector("[data-kui-component='Table']")).toBeInTheDocument();
    expect(container.querySelector("[data-kui-component='TableCaption']")).toBeInTheDocument();
    expect(container.querySelector("[data-kui-component='TableHeader']")).toBeInTheDocument();
    expect(container.querySelector("[data-kui-component='TableBody']")).toBeInTheDocument();
    expect(container.querySelector("[data-kui-component='TableRow']")).toBeInTheDocument();
    expect(container.querySelector("[data-kui-component='TableHead']")).toBeInTheDocument();
    expect(container.querySelector("[data-kui-component='TableCell']")).toBeInTheDocument();
  });
});

// ─── Row selected state ─────────────────────────────────────────────

describe("Table: row selection", () => {
  it("sets aria-selected on selected rows", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(
            TableRow,
            { selected: true, "data-testid": "row" } as never,
            createElement(TableCell, null, "A"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("row").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("row").getAttribute("data-selected")).toBe("true");
  });

  it("does not set aria-selected when not selected", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(
            TableRow,
            { "data-testid": "row" } as never,
            createElement(TableCell, null, "A"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("row").getAttribute("aria-selected")).toBeNull();
    expect(screen.getByTestId("row").getAttribute("data-selected")).toBeNull();
  });
});

// ─── Column alignment ───────────────────────────────────────────────

describe("Table: alignment", () => {
  it("sets data-align on header cells", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(TableHead, { align: "end", "data-testid": "th" } as never, "Amount"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("th").getAttribute("data-align")).toBe("end");
  });

  it("sets data-align on data cells", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(
            TableRow,
            null,
            createElement(TableCell, { align: "center", "data-testid": "td" } as never, "123"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("td").getAttribute("data-align")).toBe("center");
  });
});

// ─── Sort metadata ──────────────────────────────────────────────────

describe("Table: sort metadata", () => {
  it("sets aria-sort=ascending", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(
              TableHead,
              { sortDirection: "ascending", onSort: () => {}, "data-testid": "th" } as never,
              "Name",
            ),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("th").getAttribute("aria-sort")).toBe("ascending");
  });

  it("sets aria-sort=descending", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(
              TableHead,
              { sortDirection: "descending", onSort: () => {}, "data-testid": "th" } as never,
              "Name",
            ),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("th").getAttribute("aria-sort")).toBe("descending");
  });

  it("makes sortable headers interactive", () => {
    let sorted = false;
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(
              TableHead,
              {
                onSort: () => {
                  sorted = true;
                },
                "data-testid": "th",
              } as never,
              "Name",
            ),
          ),
        ),
      ),
    );
    const th = screen.getByTestId("th");
    expect(th.getAttribute("data-sortable")).toBe("true");
    expect(th.getAttribute("tabindex")).toBe("0");
    fireEvent.click(th);
    expect(sorted).toBe(true);
  });

  it("sortable headers respond to Enter key", () => {
    let sorted = false;
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(
              TableHead,
              {
                onSort: () => {
                  sorted = true;
                },
                "data-testid": "th",
              } as never,
              "Name",
            ),
          ),
        ),
      ),
    );
    fireEvent.keyDown(screen.getByTestId("th"), { key: "Enter" });
    expect(sorted).toBe(true);
  });

  it("non-sortable headers are not interactive", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(TableHead, { "data-testid": "th" } as never, "Name"),
          ),
        ),
      ),
    );
    const th = screen.getByTestId("th");
    expect(th.getAttribute("data-sortable")).toBeNull();
    expect(th.getAttribute("tabindex")).toBeNull();
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Table: ref forwarding", () => {
  it("Table forwards ref", () => {
    const ref = createRef<HTMLTableElement>();
    render(createElement(Table, { ref }, createElement(TableBody, null)));
    expect(ref.current?.tagName).toBe("TABLE");
  });

  it("TableCaption forwards ref", () => {
    const ref = createRef<HTMLTableCaptionElement>();
    render(createElement(Table, null, createElement(TableCaption, { ref }, "C")));
    expect(ref.current?.tagName).toBe("CAPTION");
  });

  it("TableRow forwards ref", () => {
    const ref = createRef<HTMLTableRowElement>();
    render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(TableRow, { ref }, createElement(TableCell, null, "X")),
        ),
      ),
    );
    expect(ref.current?.tagName).toBe("TR");
  });

  it("TableHead forwards ref", () => {
    const ref = createRef<HTMLTableCellElement>();
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(TableRow, null, createElement(TableHead, { ref }, "H")),
        ),
      ),
    );
    expect(ref.current?.tagName).toBe("TH");
  });

  it("TableCell forwards ref", () => {
    const ref = createRef<HTMLTableCellElement>();
    render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(TableRow, null, createElement(TableCell, { ref }, "D")),
        ),
      ),
    );
    expect(ref.current?.tagName).toBe("TD");
  });
});

// ─── Native HTML attributes ─────────────────────────────────────────

describe("Table: native attributes", () => {
  it("spreads className and id on Table", () => {
    render(
      createElement(
        Table,
        { id: "t1", className: "my-table", "data-testid": "t" } as never,
        createElement(TableBody, null),
      ),
    );
    const t = screen.getByTestId("t");
    expect(t.id).toBe("t1");
    expect(t.className).toBe("my-table");
  });

  it("spreads scope on TableHead", () => {
    const { container } = render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(TableRow, null, createElement(TableHead, { scope: "col" }, "H")),
        ),
      ),
    );
    expect(container.querySelector("th")!.getAttribute("scope")).toBe("col");
  });

  it("spreads colSpan on TableCell", () => {
    const { container } = render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(TableRow, null, createElement(TableCell, { colSpan: 3 }, "Wide")),
        ),
      ),
    );
    expect(container.querySelector("td")!.getAttribute("colspan")).toBe("3");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Table: SSR", () => {
  it("renders full table to string", () => {
    const html = renderToString(SimpleTable());
    expect(html).toContain("<table");
    expect(html).toContain("<caption");
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
    expect(html).toContain("Alice");
    expect(html).toContain("Users");
  });
});

// ─── StrictMode ─────────────────────────────────────────────────────

describe("Table: StrictMode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, SimpleTable()));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });
});
