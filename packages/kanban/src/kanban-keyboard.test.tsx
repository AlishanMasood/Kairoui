import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Kanban } from "./kanban";
import type { KanbanCard, KanbanColumn } from "./kanban-types";

const COLUMNS: readonly KanbanColumn[] = [
  { id: "todo", title: "Todo" },
  { id: "doing", title: "Doing" },
];

function twoColumnBoard(): readonly KanbanCard[] {
  return [
    { id: "a", columnId: "todo", title: "A" },
    { id: "b", columnId: "todo", title: "B" },
    { id: "c", columnId: "doing", title: "C" },
  ];
}

describe("Kanban keyboard interactions", () => {
  it("Enter on a card fires onCardClick", () => {
    const onCardClick = vi.fn();
    const { container } = render(
      <Kanban columns={COLUMNS} cards={twoColumnBoard()} onCardClick={onCardClick} />,
    );
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    card.focus();
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onCardClick).toHaveBeenCalledOnce();
  });

  it("Escape clears the selection", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={twoColumnBoard()} />);
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    fireEvent.click(card);
    expect(card.getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(card, { key: "Escape" });
    expect(card.getAttribute("aria-pressed")).toBe("false");
  });

  it("Delete fires onCardDelete when the consumer wires it", () => {
    const onCardDelete = vi.fn();
    const { container } = render(
      <Kanban columns={COLUMNS} cards={twoColumnBoard()} onCardDelete={onCardDelete} />,
    );
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    fireEvent.keyDown(card, { key: "Delete" });
    expect(onCardDelete).toHaveBeenCalledOnce();
    const arg = onCardDelete.mock.calls[0]?.[0] as { id: string };
    expect(arg.id).toBe("a");
  });

  it("Space picks up a card and enters keyboard-move mode", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={twoColumnBoard()} />);
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    fireEvent.keyDown(card, { key: " " });
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("data-kanban-drag")).toBe("card");
  });

  it("Space during keyboard move commits and fires onCardMove", () => {
    const onCardMove = vi.fn();
    const { container } = render(
      <Kanban columns={COLUMNS} cards={twoColumnBoard()} onCardMove={onCardMove} />,
    );
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    fireEvent.keyDown(card, { key: " " });
    // Move down within the same column.
    fireEvent.keyDown(card, { key: "ArrowDown" });
    fireEvent.keyDown(card, { key: " " });
    expect(onCardMove).toHaveBeenCalled();
    const payload = onCardMove.mock.calls[0]?.[0] as {
      readonly toColumnId: string;
      readonly toIndex: number;
    };
    expect(payload.toColumnId).toBe("todo");
    expect(payload.toIndex).toBeGreaterThanOrEqual(1);
  });

  it("Escape during keyboard move cancels without firing onCardMove", () => {
    const onCardMove = vi.fn();
    const { container } = render(
      <Kanban columns={COLUMNS} cards={twoColumnBoard()} onCardMove={onCardMove} />,
    );
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    fireEvent.keyDown(card, { key: " " });
    fireEvent.keyDown(card, { key: "ArrowDown" });
    fireEvent.keyDown(card, { key: "Escape" });
    expect(onCardMove).not.toHaveBeenCalled();
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("data-kanban-drag")).toBe("idle");
  });

  it("ArrowRight during keyboard move moves to the next column", () => {
    const onCardMove = vi.fn();
    const { container } = render(
      <Kanban columns={COLUMNS} cards={twoColumnBoard()} onCardMove={onCardMove} />,
    );
    const card = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    fireEvent.keyDown(card, { key: " " });
    fireEvent.keyDown(card, { key: "ArrowRight" });
    fireEvent.keyDown(card, { key: " " });
    expect(onCardMove).toHaveBeenCalledOnce();
    const payload = onCardMove.mock.calls[0]?.[0] as { readonly toColumnId: string };
    expect(payload.toColumnId).toBe("doing");
  });

  it("ArrowDown outside drag mode moves focus to the next card in the column", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={twoColumnBoard()} />);
    const cardA = container.querySelector<HTMLButtonElement>("[data-kanban-card=a]")!;
    const cardB = container.querySelector<HTMLButtonElement>("[data-kanban-card=b]")!;
    cardA.focus();
    fireEvent.keyDown(cardA, { key: "ArrowDown" });
    expect(document.activeElement).toBe(cardB);
  });

  it("Column header Enter picks up the column; ArrowRight moves it", () => {
    const onColumnMove = vi.fn();
    const { container } = render(
      <Kanban columns={COLUMNS} cards={twoColumnBoard()} onColumnMove={onColumnMove} />,
    );
    const header = container.querySelector<HTMLElement>("[data-kanban-column-header=todo]")!;
    header.focus();
    fireEvent.keyDown(header, { key: "Enter" });
    fireEvent.keyDown(header, { key: "ArrowRight" });
    fireEvent.keyDown(header, { key: "Enter" });
    expect(onColumnMove).toHaveBeenCalled();
    const payload = onColumnMove.mock.calls[0]?.[0] as { toIndex: number };
    expect(payload.toIndex).toBe(1);
  });
});
