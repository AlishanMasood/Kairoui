import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Kanban } from "./kanban";
import type { KanbanCard, KanbanColumn } from "./kanban-types";

const COLUMNS: readonly KanbanColumn[] = [
  { id: "todo", title: "Todo" },
  { id: "doing", title: "Doing" },
];

const CARDS: readonly KanbanCard[] = [
  { id: "a", columnId: "todo", title: "A" },
  { id: "b", columnId: "todo", title: "B" },
];

describe("Kanban accessibility", () => {
  it("root uses role=application with aria-roledescription", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("aria-roledescription")).toBe("Kanban board");
    expect(root?.getAttribute("aria-label")).toBeTruthy();
  });

  it("board uses role=list", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const board = container.querySelector<HTMLElement>("[data-kanban-board]");
    expect(board?.getAttribute("role")).toBe("list");
  });

  it("columns use role=listitem and cards use role=listitem inside role=list bodies", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const cols = container.querySelectorAll("[data-kanban-column]");
    expect(cols.length).toBe(2);
    for (const col of Array.from(cols)) {
      expect(col.getAttribute("role")).toBe("listitem");
    }
    const bodies = container.querySelectorAll("[data-kanban-column-body]");
    for (const body of Array.from(bodies)) {
      expect(body.getAttribute("role")).toBe("list");
    }
  });

  it("cards render as buttons with aria-roledescription=Card + aria-pressed; wrapper carries posinset/setsize", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const card = container.querySelector<HTMLElement>("[data-kanban-card=a]")!;
    expect(card.tagName).toBe("BUTTON");
    expect(card.getAttribute("aria-roledescription")).toBe("Card");
    expect(card.getAttribute("aria-pressed")).toBe("false");
    expect(card.getAttribute("aria-label")).toContain("A");
    const slot = container.querySelector<HTMLElement>("[data-kanban-card-slot=a]")!;
    expect(slot.getAttribute("role")).toBe("listitem");
    expect(slot.getAttribute("aria-posinset")).toBe("1");
    expect(slot.getAttribute("aria-setsize")).toBe("2");
  });

  it("column header exposes role=button + aria-pressed", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const header = container.querySelector<HTMLElement>("[data-kanban-column-header=todo]")!;
    expect(header.getAttribute("role")).toBe("button");
    expect(header.getAttribute("aria-pressed")).toBe("false");
  });

  it("empty column body announces itself as empty", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={[]} />);
    const body = container.querySelector<HTMLElement>("[data-kanban-column-body=todo]");
    expect(body?.getAttribute("aria-label")).toContain("empty");
    expect(body?.getAttribute("data-kanban-empty")).toBe("");
  });

  it("announcer region has aria-live=polite + aria-atomic=true", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const announcer = container.querySelector("[data-kanban-announcer]");
    expect(announcer?.getAttribute("aria-live")).toBe("polite");
    expect(announcer?.getAttribute("aria-atomic")).toBe("true");
  });

  it("aria-labelledby is applied without a duplicate aria-label", () => {
    const { container } = render(
      <div>
        <h1 id="heading">Team board</h1>
        <Kanban columns={COLUMNS} cards={CARDS} aria-labelledby="heading" />
      </div>,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("aria-labelledby")).toBe("heading");
    expect(root?.getAttribute("aria-label")).toBeNull();
  });
});
