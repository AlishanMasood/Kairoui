import { describe, expect, it } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { Command } from "../../packages/command/src/command";
import { DataGrid } from "../../packages/data-grid/src/data-grid";
import type { DataGridColumnDef } from "../../packages/data-grid/src/column-types";
import { Kanban } from "../../packages/kanban/src/kanban";
import type { KanbanCard, KanbanColumn } from "../../packages/kanban/src/kanban-types";
import { PermissionMatrix } from "../../packages/permission-matrix/src/permission-matrix";
import type {
  PermissionAction,
  PermissionCell,
  PermissionSubject,
} from "../../packages/permission-matrix/src/permission-matrix-types";
import { Scheduler } from "../../packages/scheduler/src/scheduler";
import type { SchedulerEvent } from "../../packages/scheduler/src/scheduler-types";
import { Workflow } from "../../packages/workflow/src/workflow";
import type { WorkflowStep } from "../../packages/workflow/src/workflow-types";

interface GridRow {
  readonly id: string;
  readonly name: string;
  readonly group: string;
  readonly value: number;
}

const GRID_COLUMNS: readonly DataGridColumnDef<GridRow>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "group", header: "Group", accessorKey: "group" },
  { id: "value", header: "Value", accessorKey: "value" },
];

function makeGridRows(count: number): readonly GridRow[] {
  return Array.from({ length: count }, (_value, index) => ({
    id: String(index),
    name: `Row ${String(index)}`,
    group: `Group ${String(index % 20)}`,
    value: index,
  }));
}

function makeSchedulerEvents(count: number): readonly SchedulerEvent[] {
  const anchor = new Date(2026, 0, 5, 8, 0, 0, 0);
  return Array.from({ length: count }, (_value, index) => {
    const start = new Date(anchor);
    start.setDate(start.getDate() + Math.floor(index / 300));
    start.setMinutes(start.getMinutes() + (index % 300));
    const end = new Date(start.getTime() + 30 * 60_000);
    return {
      id: `event-${String(index)}`,
      title: `Event ${String(index)}`,
      start,
      end,
      allDay: false,
    };
  });
}

function report(name: string, measurements: Readonly<Record<string, number | string>>): void {
  const values = Object.entries(measurements)
    .map(([key, value]) => `${key}=${typeof value === "number" ? value.toFixed(2) : value}`)
    .join(" ");
  console.info(`[enterprise-perf] ${name} ${values}`);
}

describe("Phase 14 enterprise performance baselines", () => {
  it("DataGrid: renders 1k rows and virtualizes 10k rows with update and scroll measurements", async () => {
    const rows1k = makeGridRows(1_000);
    const initial1kStart = performance.now();
    const grid1k = render(
      <DataGrid data={rows1k} columns={GRID_COLUMNS} getRowId={(row) => row.id} />,
    );
    const initial1k = performance.now() - initial1kStart;
    expect(grid1k.container.querySelectorAll('[data-kui-row-kind="leaf"]')).toHaveLength(1_000);
    expect(initial1k).toBeLessThan(3_000);

    const updated1k = rows1k.map((row) =>
      row.id === "500" ? { ...row, name: "Updated row" } : row,
    );
    const update1kStart = performance.now();
    grid1k.rerender(
      <DataGrid data={updated1k} columns={GRID_COLUMNS} getRowId={(row) => row.id} />,
    );
    const update1k = performance.now() - update1kStart;
    expect(update1k).toBeLessThan(3_000);
    grid1k.unmount();

    const rows10k = makeGridRows(10_000);
    const initial10kStart = performance.now();
    const grid10k = render(
      <DataGrid
        data={rows10k}
        columns={GRID_COLUMNS}
        getRowId={(row) => row.id}
        virtualized
        rowHeight={32}
        virtualScrollHeight={320}
      />,
    );
    const initial10k = performance.now() - initial10kStart;
    const viewport = grid10k.container.querySelector<HTMLElement>('[role="grid"]');
    expect(viewport).not.toBeNull();
    expect(grid10k.container.querySelectorAll('[data-kui-row-kind="leaf"]').length).toBeLessThan(
      50,
    );
    expect(initial10k).toBeLessThan(1_500);

    const updated10k = rows10k.map((row) =>
      row.id === "5000" ? { ...row, name: "Updated virtual row" } : row,
    );
    const update10kStart = performance.now();
    grid10k.rerender(
      <DataGrid
        data={updated10k}
        columns={GRID_COLUMNS}
        getRowId={(row) => row.id}
        virtualized
        rowHeight={32}
        virtualScrollHeight={320}
      />,
    );
    const update10k = performance.now() - update10kStart;
    expect(update10k).toBeLessThan(1_500);

    if (!viewport) throw new Error("DataGrid viewport is missing");
    viewport.scrollTop = 100_000;
    const scrollStart = performance.now();
    await act(async () => {
      fireEvent.scroll(viewport);
      await new Promise<void>((resolveFrame) => {
        requestAnimationFrame(() => {
          resolveFrame();
        });
      });
    });
    const scroll10k = performance.now() - scrollStart;
    expect(scroll10k).toBeLessThan(1_500);
    expect(grid10k.container.querySelectorAll('[data-kui-row-kind="leaf"]').length).toBeLessThan(
      50,
    );
    report("DataGrid", { initial1k, update1k, initial10k, update10k, scroll10k });
    grid10k.unmount();
  });

  it("Command: filters a 500-item palette", () => {
    const items = Array.from({ length: 500 }, (_value, index) => (
      <Command.Item key={index} id={`command-${String(index)}`} onSelect={() => undefined}>
        Command {String(index).padStart(4, "0")}
      </Command.Item>
    ));
    const initialStart = performance.now();
    const palette = render(
      <Command.Root defaultOpen>
        <Command.Dialog container={null} aria-label="Benchmark commands">
          <Command.Input aria-label="Search commands" />
          <Command.List>
            <Command.Group id="all" heading="All commands">
              {items}
            </Command.Group>
            <Command.Empty>No matches</Command.Empty>
          </Command.List>
        </Command.Dialog>
      </Command.Root>,
    );
    const initial = performance.now() - initialStart;
    expect(palette.container.querySelectorAll('[role="option"]').length).toBe(500);
    expect(initial).toBeLessThan(3_000);
    const input = palette.container.querySelector<HTMLInputElement>('[role="combobox"]');
    expect(input).not.toBeNull();
    if (!input) throw new Error("Command search input is missing");
    const updateStart = performance.now();
    fireEvent.change(input, { target: { value: "command 0420" } });
    const update = performance.now() - updateStart;
    expect(update).toBeLessThan(3_000);
    expect(palette.container.querySelectorAll('[role="option"]:not([hidden])')).toHaveLength(1);
    report("Command", { itemCount: 500, initial, update });
  });

  it("Scheduler: lays out and updates 2k events", () => {
    const events = makeSchedulerEvents(2_000);
    const initialStart = performance.now();
    const scheduler = render(
      <Scheduler events={events} defaultDate={new Date(2026, 0, 5)} defaultView="week" />,
    );
    const initial = performance.now() - initialStart;
    expect(initial).toBeLessThan(5_000);
    expect(scheduler.container.querySelector('[data-scheduler-grid="vertical"]')).not.toBeNull();
    const updatedEvents = events.map((event) =>
      event.id === "event-500" ? { ...event, title: "Updated event" } : event,
    );
    const updateStart = performance.now();
    scheduler.rerender(
      <Scheduler events={updatedEvents} defaultDate={new Date(2026, 0, 5)} defaultView="week" />,
    );
    const update = performance.now() - updateStart;
    expect(update).toBeLessThan(5_000);
    report("Scheduler", {
      eventCount: 2_000,
      renderedEvents: scheduler.container.querySelectorAll("[data-scheduler-event]").length,
      initial,
      update,
      scroll: "not virtualized",
    });
  });

  it("Kanban: renders and updates 2k cards across 20 columns", () => {
    const columns: readonly KanbanColumn[] = Array.from({ length: 20 }, (_value, index) => ({
      id: `column-${String(index)}`,
      title: `Column ${String(index)}`,
    }));
    const cards: readonly KanbanCard[] = Array.from({ length: 2_000 }, (_value, index) => ({
      id: `card-${String(index)}`,
      columnId: `column-${String(index % 20)}`,
      title: `Card ${String(index)}`,
    }));
    const initialStart = performance.now();
    const board = render(
      <Kanban
        columns={columns}
        cards={cards}
        virtualizeCards
        cardHeight={48}
        virtualizeColumns
        columnWidth={240}
      />,
    );
    const initial = performance.now() - initialStart;
    expect(initial).toBeLessThan(5_000);
    expect(board.container.querySelectorAll("[data-kanban-card]")).toHaveLength(2_000);
    const updatedCards = cards.map((card) =>
      card.id === "card-1000" ? { ...card, title: "Updated card" } : card,
    );
    const updateStart = performance.now();
    board.rerender(
      <Kanban
        columns={columns}
        cards={updatedCards}
        virtualizeCards
        cardHeight={48}
        virtualizeColumns
        columnWidth={240}
      />,
    );
    const update = performance.now() - updateStart;
    expect(update).toBeLessThan(5_000);
    report("Kanban", {
      cards: cards.length,
      columns: columns.length,
      renderedCards: board.container.querySelectorAll("[data-kanban-card]").length,
      initial,
      update,
      scroll: "virtualization flags do not window DOM",
    });
  });

  it("Permission Matrix: renders and updates a 100 × 50 matrix", () => {
    const subjects: readonly PermissionSubject[] = Array.from({ length: 100 }, (_value, index) => ({
      id: `subject-${String(index)}`,
      label: `Subject ${String(index)}`,
    }));
    const actions: readonly PermissionAction[] = Array.from({ length: 50 }, (_value, index) => ({
      id: `action-${String(index)}`,
      label: `Action ${String(index)}`,
    }));
    const cells: readonly PermissionCell[] = subjects.flatMap((subject, rowIndex) =>
      actions.map((action, columnIndex) => ({
        subjectId: subject.id,
        actionId: action.id,
        state: (rowIndex + columnIndex) % 2 === 0 ? "granted" : "unset",
      })),
    );
    const props = {
      subjects,
      actions,
      cells,
      virtualizeRows: true,
      rowHeight: 32,
      viewportHeight: 400,
    } as const;
    const initialStart = performance.now();
    const matrix = render(<PermissionMatrix {...props} />);
    const initial = performance.now() - initialStart;
    expect(initial).toBeLessThan(5_000);
    expect(matrix.container.querySelectorAll("[data-permission-matrix-cell]")).toHaveLength(5_000);
    const updatedCells = cells.map((cell) =>
      cell.subjectId === "subject-50" && cell.actionId === "action-25"
        ? { ...cell, state: "denied" as const }
        : cell,
    );
    const updateStart = performance.now();
    matrix.rerender(<PermissionMatrix {...props} cells={updatedCells} />);
    const update = performance.now() - updateStart;
    expect(update).toBeLessThan(5_000);
    report("PermissionMatrix", {
      subjects: subjects.length,
      actions: actions.length,
      renderedCells: matrix.container.querySelectorAll("[data-permission-matrix-cell]").length,
      initial,
      update,
      scroll: "virtualizeRows does not window DOM",
    });
  });

  it("Workflow: renders and updates 500 steps", () => {
    const steps: readonly WorkflowStep[] = Array.from({ length: 500 }, (_value, index) => ({
      id: `step-${String(index)}`,
      label: `Step ${String(index)}`,
    }));
    const initialStart = performance.now();
    const workflow = render(<Workflow steps={steps} currentStepId="step-250" showProgress />);
    const initial = performance.now() - initialStart;
    expect(initial).toBeLessThan(3_000);
    expect(workflow.container.querySelectorAll("[data-workflow-step]")).toHaveLength(500);
    const updateStart = performance.now();
    workflow.rerender(<Workflow steps={steps} currentStepId="step-400" showProgress />);
    const update = performance.now() - updateStart;
    expect(update).toBeLessThan(3_000);
    report("Workflow", { steps: steps.length, initial, update, scroll: "not applicable" });
  });
});
