import type { RowId } from "@kairoui/core/components";
import type { ValidationResult } from "./column-types";

// ─── Modes ─────────────────────────────────────────────────────────

/**
 * Editing scope:
 * - `"none"`: view mode — no cell can enter edit.
 * - `"cell"`: at most one cell is under edit at any time; commit fires
 *   `onCellEdit` immediately.
 * - `"row"`: cells stage into a per-row pending buffer; the whole row
 *   flushes via `commitRow(rowId)`.
 * - `"batch"`: cells stage into a per-row pending buffer that spans
 *   multiple rows; the buffer flushes via `commitAll()` or per-row.
 */
export type EditingMode = "none" | "cell" | "row" | "batch";

// ─── Active editor ────────────────────────────────────────────────

/**
 * The single cell that currently holds keyboard focus in the editor.
 * Never populated in view mode. Cleared on cancel and on successful
 * commit.
 */
export interface EditingCell {
  readonly rowId: RowId;
  readonly columnId: string;
  readonly rawInput: unknown;
  readonly validation: ValidationResult;
}

// ─── Aggregate state ──────────────────────────────────────────────

/**
 * Editing state slice. Same shape whether controlled or uncontrolled.
 *
 * `pending` and `errors` are keyed first by row ID, then by column ID.
 * They stay empty in `"cell"` mode because commit fires the persistence
 * callback directly; they collect changes in `"row"` and `"batch"` mode.
 */
export interface EditingState {
  readonly mode: EditingMode;
  readonly active: EditingCell | null;
  readonly pending: ReadonlyMap<RowId, ReadonlyMap<string, unknown>>;
  readonly errors: ReadonlyMap<RowId, ReadonlyMap<string, string>>;
}

// ─── Persistence events ───────────────────────────────────────────

/**
 * Payload fired to `onCellEdit` when a cell commits in `"cell"` mode.
 * The consumer is responsible for applying the change to their store;
 * DataGrid never persists on its own.
 */
export interface CellEditEvent<TRow = unknown> {
  readonly rowId: RowId;
  readonly columnId: string;
  readonly row: TRow;
  readonly rawInput: unknown;
  /** Result of `column.parseEdit` when defined, otherwise `rawInput`. */
  readonly value: unknown;
  readonly validation: ValidationResult;
}

/**
 * Payload fired to `onRowEdit` when a row flushes in `"row"` /
 * `"batch"` mode. `changes` carries the parsed values keyed by column
 * ID; `errors` holds per-column validation messages that survived the
 * flush (empty when all cells validated).
 */
export interface RowEditEvent<TRow = unknown> {
  readonly rowId: RowId;
  readonly row: TRow;
  readonly changes: ReadonlyMap<string, unknown>;
  readonly errors: ReadonlyMap<string, string>;
}
