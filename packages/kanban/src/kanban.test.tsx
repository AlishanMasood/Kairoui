import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Kanban } from "./kanban";
import type { KanbanCard, KanbanColumn } from "./kanban-types";

// ─── Fixtures ─────────────────────────────────────────────────────

const COLUMNS: readonly KanbanColumn[] = [
  { id: "todo", title: "Todo" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
];

function makeCards(): readonly KanbanCard[] {
  return [
    { id: "a", columnId: "todo", title: "A" },
    { id: "b", columnId: "todo", title: "B" },
    { id: "c", columnId: "doing", title: "C" },
  ];
}

// ─── Root smoke ───────────────────────────────────────────────────

describe("<Kanban> root", () => {
  it("renders a role=application root with data-kanban-drag=idle", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={makeCards()} />);
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("aria-roledescription")).toBe("Kanban board");
    expect(root?.getAttribute("data-kanban-drag")).toBe("idle");
  });

  it("renders the default board when no children are supplied", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={makeCards()} />);
    const board = container.querySelector("[data-kanban-board]");
    expect(board).not.toBeNull();
    const cols = container.querySelectorAll("[data-kanban-column]");
    expect(cols.length).toBe(3);
  });

  it("applies className / style / id / aria-label to the root", () => {
    const { container } = render(
      <Kanban
        columns={COLUMNS}
        cards={makeCards()}
        className="my-board"
        style={{ height: 400 }}
        id="board"
        aria-label="Team board"
      />,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("id")).toBe("board");
    expect(root?.getAttribute("aria-label")).toBe("Team board");
    expect(root?.className).toContain("my-board");
    expect(root?.style.height).toBe("400px");
  });

  it("renders a live-polite announcer", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={makeCards()} />);
    const announcer = container.querySelector("[data-kanban-announcer]");
    expect(announcer).not.toBeNull();
    expect(announcer?.getAttribute("aria-live")).toBe("polite");
  });
});

// ─── Data validation ──────────────────────────────────────────────

describe("Input validation", () => {
  it("throws on duplicate column ids", () => {
    // Suppress React error output for the expected throw.
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => {
      render(
        <Kanban
          columns={[
            { id: "c1", title: "A" },
            { id: "c1", title: "B" },
          ]}
          cards={[]}
        />,
      );
    }).toThrow(/duplicate column id/);
    spy.mockRestore();
  });

  it("throws on cards referencing unknown columns", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => {
      render(<Kanban columns={COLUMNS} cards={[{ id: "a", columnId: "ghost", title: "A" }]} />);
    }).toThrow(/unknown column/);
    spy.mockRestore();
  });
});

// ─── Card rendering ───────────────────────────────────────────────

describe("Card rendering", () => {
  it("renders one button per card in each column", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={makeCards()} />);
    const cards = container.querySelectorAll("[data-kanban-card]");
    expect(cards.length).toBe(3);
  });

  it("selects a card on click and applies aria-pressed", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={makeCards()} />);
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    fireEvent.click(card);
    expect(card.getAttribute("aria-pressed")).toBe("true");
  });

  it("fires onCardClick with the card + column", () => {
    const onCardClick = vi.fn();
    const { container } = render(
      <Kanban columns={COLUMNS} cards={makeCards()} onCardClick={onCardClick} />,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!);
    expect(onCardClick).toHaveBeenCalledOnce();
    const payload = onCardClick.mock.calls[0]?.[0] as {
      card: { id: string };
      column: { id: string };
    };
    expect(payload.card.id).toBe("a");
    expect(payload.column.id).toBe("todo");
  });

  it("uses renderCard prop to render custom card content", () => {
    const { container } = render(
      <Kanban
        columns={COLUMNS}
        cards={makeCards()}
        renderCard={({ card }) => <span data-testid="custom">{card.title}!</span>}
      />,
    );
    const custom = container.querySelector("[data-testid=custom]");
    expect(custom?.textContent).toBe("A!");
  });

  it("registers a renderer via <Kanban.CardTemplate>", () => {
    const { container } = render(
      <Kanban columns={COLUMNS} cards={makeCards()}>
        <Kanban.Board>
          {COLUMNS.map((c) => (
            <Kanban.Column key={c.id} columnId={c.id} />
          ))}
        </Kanban.Board>
        <Kanban.CardTemplate render={({ card }) => <mark>{card.title}</mark>} />
      </Kanban>,
    );
    expect(container.querySelector("mark")?.textContent).toBe("A");
  });

  it("marks non-draggable cards as aria-disabled", () => {
    const cards: readonly KanbanCard[] = [
      { id: "a", columnId: "todo", title: "A", meta: { draggable: false } },
    ];
    const { container } = render(<Kanban columns={COLUMNS} cards={cards} />);
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    expect(card.getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Column rendering ─────────────────────────────────────────────

describe("Column rendering", () => {
  it("carries aria-posinset + aria-setsize + aria-label on each column", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={makeCards()} />);
    const columns = container.querySelectorAll<HTMLElement>("[data-kanban-column]");
    expect(columns.length).toBe(3);
    expect(columns[0]?.getAttribute("aria-posinset")).toBe("1");
    expect(columns[0]?.getAttribute("aria-setsize")).toBe("3");
    expect(columns[0]?.getAttribute("aria-label")).toContain("Todo");
  });

  it("renders empty columns with a role=list drop target", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={makeCards()} />);
    const doneBody = container.querySelector<HTMLElement>("[data-kanban-column-body=done]");
    expect(doneBody).not.toBeNull();
    expect(doneBody?.getAttribute("data-kanban-empty")).toBe("");
    expect(doneBody?.getAttribute("aria-label")).toContain("empty");
  });

  it("renders custom empty state when renderEmptyState is provided", () => {
    const { container } = render(
      <Kanban
        columns={COLUMNS}
        cards={makeCards()}
        renderEmptyState={({ column }) => <span data-testid="empty">{column.title} is empty</span>}
      />,
    );
    const custom = container.querySelector("[data-testid=empty]");
    expect(custom?.textContent).toBe("Done is empty");
  });
});

// ─── Ordering ─────────────────────────────────────────────────────

describe("Ordering", () => {
  it("sorts columns by order ascending when every column has one", () => {
    const columns: readonly KanbanColumn[] = [
      { id: "c", title: "C", order: 3 },
      { id: "a", title: "A", order: 1 },
      { id: "b", title: "B", order: 2 },
    ];
    const { container } = render(<Kanban columns={columns} cards={[]} />);
    const ids = Array.from(container.querySelectorAll<HTMLElement>("[data-kanban-column]")).map(
      (el) => el.dataset["kanbanColumn"],
    );
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("sorts cards within a column by order when every card has one", () => {
    const cards: readonly KanbanCard[] = [
      { id: "z", columnId: "todo", title: "Z", order: 2 },
      { id: "y", columnId: "todo", title: "Y", order: 1 },
      { id: "x", columnId: "todo", title: "X", order: 0 },
    ];
    const { container } = render(<Kanban columns={[{ id: "todo", title: "T" }]} cards={cards} />);
    const ids = Array.from(container.querySelectorAll<HTMLElement>("[data-kanban-card]")).map(
      (el) => el.dataset["kanbanCard"],
    );
    expect(ids).toEqual(["x", "y", "z"]);
  });
});

// ─── RTL ─────────────────────────────────────────────────────────

describe("RTL", () => {
  it("applies dir=rtl on the root", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={[]} dir="rtl" />);
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("dir")).toBe("rtl");
  });
});

// ─── Selection ───────────────────────────────────────────────────

describe("Selection", () => {
  it("fires onSelectionChange when a card is clicked", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <Kanban columns={COLUMNS} cards={makeCards()} onSelectionChange={onSelectionChange} />,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!);
    expect(onSelectionChange).toHaveBeenCalled();
    const call = onSelectionChange.mock.calls[0]?.[0] as { kind: string; cardId?: string };
    expect(call.kind).toBe("card");
    expect(call.cardId).toBe("a");
  });
});
