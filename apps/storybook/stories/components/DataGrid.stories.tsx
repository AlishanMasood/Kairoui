import type { Meta, StoryObj } from "@storybook/react";
import { DataGrid } from "@kairoui-pro/data-grid";
import type { DataGridColumnDef } from "@kairoui-pro/data-grid";
import type { RowId } from "@kairoui/core";
import { useState } from "react";

interface Person {
  readonly id: string;
  readonly name: string;
  readonly team: string;
  readonly role: string;
  readonly age: number;
  readonly salary: number;
}

const people: Person[] = [
  { id: "1", name: "Alice", team: "Engineering", role: "Staff", age: 32, salary: 165000 },
  { id: "2", name: "Bob", team: "Engineering", role: "Senior", age: 28, salary: 140000 },
  { id: "3", name: "Carol", team: "Engineering", role: "Principal", age: 41, salary: 210000 },
  { id: "4", name: "Dave", team: "Design", role: "Senior", age: 35, salary: 135000 },
  { id: "5", name: "Eve", team: "Design", role: "Staff", age: 29, salary: 145000 },
  { id: "6", name: "Frank", team: "Sales", role: "Senior", age: 45, salary: 180000 },
  { id: "7", name: "Grace", team: "Sales", role: "Staff", age: 38, salary: 160000 },
  { id: "8", name: "Henry", team: "Sales", role: "Junior", age: 25, salary: 90000 },
];

const columns: readonly DataGridColumnDef<Person>[] = [
  { id: "name", header: "Name", accessorKey: "name", sortable: true },
  { id: "team", header: "Team", accessorKey: "team", sortable: true, groupable: true },
  { id: "role", header: "Role", accessorKey: "role", sortable: true },
  {
    id: "age",
    header: "Age",
    accessorKey: "age",
    sortable: true,
    aggregate: { reducer: "avg", formatter: (v) => (typeof v === "number" ? v.toFixed(1) : "—") },
  },
  {
    id: "salary",
    header: "Salary",
    accessorKey: "salary",
    sortable: true,
    aggregate: {
      reducer: "sum",
      footer: true,
      formatter: (v) => (typeof v === "number" ? `$${v.toLocaleString()}` : "—"),
    },
  },
];

const getRowId = (row: Person): RowId => row.id;

const meta: Meta<typeof DataGrid<Person>> = {
  title: "Enterprise/DataGrid",
  component: DataGrid<Person>,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DataGrid<Person>>;

export const Basic: Story = {
  args: {
    data: people,
    columns,
    getRowId,
  },
};

export const WithSelection: Story = {
  args: {
    data: people,
    columns,
    getRowId,
    selectionMode: "multiple",
  },
};

export const Sortable: Story = {
  args: {
    data: people,
    columns,
    getRowId,
    defaultSort: [{ columnId: "salary", direction: "descending" }],
    multiSort: true,
  },
};

export const Grouped: Story = {
  args: {
    data: people,
    columns,
    getRowId,
    defaultGroupBy: ["team"],
    defaultExpanded: {
      expandedIds: new Set(["__grp__team=Engineering", "__grp__team=Design", "__grp__team=Sales"]),
    },
  },
};

export const WithFooterTotal: Story = {
  args: {
    data: people,
    columns,
    getRowId,
    showAggregatedFooter: true,
  },
};

export const Virtualized: Story = {
  render: (args) => {
    const rows: Person[] = [];
    for (let i = 0; i < 5000; i++) {
      rows.push({
        id: String(i),
        name: `Person ${String(i)}`,
        team: ["Engineering", "Design", "Sales"][i % 3] ?? "Other",
        role: ["Junior", "Staff", "Senior"][i % 3] ?? "Other",
        age: 20 + (i % 40),
        salary: 80000 + (i % 200) * 500,
      });
    }
    return (
      <DataGrid<Person>
        {...args}
        data={rows}
        columns={columns}
        getRowId={getRowId}
        virtualized
        rowHeight={40}
        virtualScrollHeight={400}
      />
    );
  },
};

export const Editable: Story = {
  render: () => {
    const [data, setData] = useState(people);
    const editable: readonly DataGridColumnDef<Person>[] = columns.map((col) => {
      if (col.id === "salary") {
        return {
          ...col,
          editable: true,
          parseEdit: (v) => Number(v),
          validateEdit: (v) => {
            const n = Number(v);
            if (!Number.isFinite(n)) return { ok: false, message: "must be a number" };
            if (n < 0) return { ok: false, message: "must be non-negative" };
            return { ok: true };
          },
          editCell: (ctx) => (
            <input
              autoFocus
              defaultValue={typeof ctx.rawInput === "string" ? ctx.rawInput : ""}
              onChange={(e) => {
                ctx.setInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") ctx.commit();
                if (e.key === "Escape") ctx.cancel();
              }}
            />
          ),
        } satisfies DataGridColumnDef<Person>;
      }
      return col;
    });
    return (
      <DataGrid<Person>
        data={data}
        columns={editable}
        getRowId={getRowId}
        editMode="cell"
        onCellEdit={(event) => {
          setData((prev) =>
            prev.map((row) =>
              row.id === event.rowId ? { ...row, [event.columnId]: event.value as number } : row,
            ),
          );
        }}
      />
    );
  },
};
