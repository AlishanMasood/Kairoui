import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Kanban } from "./kanban";
import type { KanbanCard, KanbanColumn } from "./kanban-types";

const COLUMNS: readonly KanbanColumn[] = [
  { id: "todo", title: "Todo" },
  { id: "doing", title: "Doing" },
];

const CARDS: readonly KanbanCard[] = [{ id: "a", columnId: "todo", title: "A" }];

describe("Kanban SSR", () => {
  it("renders to a static string without throwing", () => {
    const html = renderToString(<Kanban columns={COLUMNS} cards={CARDS} />);
    expect(html).toContain("kui-kanban");
    expect(html).toContain('role="application"');
    expect(html).toContain('data-kanban-drag="idle"');
  });

  it("renders cards during SSR", () => {
    const html = renderToString(<Kanban columns={COLUMNS} cards={CARDS} />);
    expect(html).toContain('data-kanban-card="a"');
  });

  it("renders empty columns as drop targets", () => {
    const html = renderToString(<Kanban columns={COLUMNS} cards={CARDS} />);
    expect(html).toContain('data-kanban-column-body="doing"');
    expect(html).toContain("data-kanban-empty");
  });

  it("renders the dir=rtl attribute during SSR", () => {
    const html = renderToString(<Kanban columns={COLUMNS} cards={CARDS} dir="rtl" />);
    expect(html).toContain('dir="rtl"');
  });
});
