import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Kanban } from "./kanban";
import type { KanbanCard, KanbanColumn } from "./kanban-types";

describe("Kanban performance", () => {
  it("renders 5 columns × 40 cards under a generous budget", () => {
    const columns: KanbanColumn[] = [];
    const cards: KanbanCard[] = [];
    for (let i = 0; i < 5; i++) {
      const id = `c${String(i)}`;
      columns.push({ id, title: `Column ${String(i)}` });
      for (let j = 0; j < 40; j++) {
        cards.push({ id: `${id}-${String(j)}`, columnId: id, title: String(j) });
      }
    }
    const t0 = performance.now();
    const { container } = render(<Kanban columns={columns} cards={cards} />);
    const t1 = performance.now();
    const rendered = container.querySelectorAll("[data-kanban-card]");
    expect(rendered.length).toBe(200);
    expect(t1 - t0).toBeLessThan(5000);
  });

  it("renders a board with 20 columns × 5 cards", () => {
    const columns: KanbanColumn[] = [];
    const cards: KanbanCard[] = [];
    for (let i = 0; i < 20; i++) {
      const id = `c${String(i)}`;
      columns.push({ id, title: `C${String(i)}` });
      for (let j = 0; j < 5; j++) {
        cards.push({ id: `${id}-${String(j)}`, columnId: id, title: String(j) });
      }
    }
    const { container } = render(<Kanban columns={columns} cards={cards} />);
    expect(container.querySelectorAll("[data-kanban-column]").length).toBe(20);
    expect(container.querySelectorAll("[data-kanban-card]").length).toBe(100);
  });

  it("renders an empty board with 30 empty columns without throwing", () => {
    const columns: KanbanColumn[] = [];
    for (let i = 0; i < 30; i++) {
      columns.push({ id: `c${String(i)}`, title: `C${String(i)}` });
    }
    const { container } = render(<Kanban columns={columns} cards={[]} />);
    const empties = container.querySelectorAll("[data-kanban-empty]");
    expect(empties.length).toBe(30);
  });
});
