import type { Meta, StoryObj } from "@storybook/react";
import { Kanban } from "@kairoui-pro/kanban";
import type { KanbanCard, KanbanColumn } from "@kairoui-pro/kanban";
import { useState } from "react";
// eslint-disable-next-line import-x/no-internal-modules
import "@kairoui-pro/kanban/styles.css";

const COLUMNS: readonly KanbanColumn[] = [
  { id: "todo", title: "Todo", order: 0 },
  { id: "doing", title: "Doing", order: 1 },
  { id: "done", title: "Done", order: 2 },
];

function makeCards(): readonly KanbanCard[] {
  return [
    { id: "1", columnId: "todo", title: "Ship KUI-ENT-013", order: 0 },
    { id: "2", columnId: "todo", title: "Write MDX docs", order: 1 },
    { id: "3", columnId: "todo", title: "Add Storybook stories", order: 2 },
    { id: "4", columnId: "doing", title: "Implement drag/drop", order: 0 },
    { id: "5", columnId: "doing", title: "Wire keyboard model", order: 1 },
    { id: "6", columnId: "done", title: "Define architecture", order: 0 },
  ];
}

function BasicBoard() {
  const [cards, setCards] = useState<readonly KanbanCard[]>(makeCards);
  const [columns, setColumns] = useState<readonly KanbanColumn[]>(COLUMNS);
  return (
    <div style={{ height: 520, width: 920 }}>
      <Kanban
        columns={columns}
        cards={cards}
        onCardMove={({ card, toColumnId, order }) => {
          setCards((prev) =>
            prev.map((c) => (c.id === card.id ? { ...c, columnId: toColumnId, order } : c)),
          );
        }}
        onColumnMove={({ column, order }) => {
          setColumns((prev) => prev.map((c) => (c.id === column.id ? { ...c, order } : c)));
        }}
      />
    </div>
  );
}

function CustomRenderer() {
  const [cards] = useState<readonly KanbanCard[]>(makeCards);
  return (
    <div style={{ height: 520, width: 920 }}>
      <Kanban
        columns={COLUMNS}
        cards={cards}
        renderCard={({ card, isSelected }) => (
          <div style={{ padding: 4 }}>
            <strong>{card.title}</strong>
            <br />
            <small style={{ opacity: 0.7 }}>#{card.id}</small>
            {isSelected ? " ★" : null}
          </div>
        )}
      />
    </div>
  );
}

function EmptyColumns() {
  return (
    <div style={{ height: 520, width: 920 }}>
      <Kanban
        columns={COLUMNS}
        cards={[]}
        renderEmptyState={({ column }) => (
          <span style={{ fontStyle: "italic" }}>Drop cards into {column.title}</span>
        )}
      />
    </div>
  );
}

function RTL() {
  return (
    <div style={{ height: 520, width: 920 }} dir="rtl">
      <Kanban columns={COLUMNS} cards={makeCards()} dir="rtl" />
    </div>
  );
}

const meta: Meta<typeof Kanban> = {
  title: "Pro / Kanban",
  component: Kanban,
  parameters: {
    docs: {
      description: {
        component:
          "Enterprise Kanban board with pointer + keyboard drag, custom card rendering, empty-column drop targets, and RTL. Ships in `@kairoui-pro/kanban`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Kanban>;

export const Default: Story = { render: () => <BasicBoard /> };
export const CustomCardRenderer: Story = { render: () => <CustomRenderer /> };
export const EmptyColumnsStory: Story = { render: () => <EmptyColumns /> };
export const RightToLeft: Story = { render: () => <RTL /> };
