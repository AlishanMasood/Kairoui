# Phase 14 — Enterprise DataGrid Architecture (KUI-ENT-002)

Status: **Architecture defined**. Implementation follows in KUI-ENT-003
(state and column model), KUI-ENT-004 (interaction and editing), and
KUI-ENT-005 (DataGrid completion / audit).

Depends on: `docs/architecture/PHASE14-ENTERPRISE-ARCHITECTURE.md`
(KUI-ENT-001) — package boundary, dependency direction, licensing shape.

---

## Purpose

The Enterprise DataGrid is the first Pro surface. It is a distinct
component from `DataTable`, not a superset. It ships in
`@kairoui-pro/data-grid`, reuses every reusable piece of the DataTable
foundation, and adds the interaction model — two-axis virtualization,
freezing, cell-level focus, editing, grouping, tree rows, and
master-detail — that DataTable does not carry.

This document fixes the DataGrid's contracts before implementation
begins so KUI-ENT-003/004/005 have zero degrees of freedom on the shape
of the public API, on the state model, and on the boundary between
free and Pro capability.

Nothing here writes runtime code. This is a contract-only ADR.

---

## Scope

### In scope for KUI-ENT-002 through KUI-ENT-005

- Virtualized rows (reuses the free `computeVirtualizedRange` math).
- **Optional** virtualized columns (a new pipeline over the same math).
- Column resizing.
- Column reordering.
- Column pinning (left / right).
- Column visibility (hidden / shown).
- Multi-column sorting.
- Advanced filtering (reuses `FilterState`, adds row-level custom
  filter dispatch).
- Grouping (a new row-model pipeline stage inserted between filter and
  sort).
- Aggregation (per-column reducer that produces group summary rows).
- Expandable rows (tree data + master-detail detail rows).
- Row selection (reuses `useRowSelection`; extended to range and
  keyboard shift/ctrl semantics).
- Inline editing (cell edit, row edit, batch edit) with focus
  preservation.
- Keyboard navigation across the two-axis focus model.
- Cell focus contract (single focused cell, roving tabindex per row).
- Server-controlled modes (every stateful piece is controllable).
- Export hooks (data-only; no built-in file emitter).
- State persistence hooks (serializable snapshot + restore).

### Explicitly out of scope

- **Not** a `DataTable` replacement. `DataTable` continues to ship in
  `@kairoui/core`, continues to receive fixes, and is the correct
  choice for read-only tabular UIs.
- **Not** a clone of any commercial grid (ag-grid, MUI DataGridPremium,
  Kendo Grid, etc.). Feature naming, defaults, and shortcuts are our
  own, chosen to match the rest of KairoUI. Where an interaction is
  covered by WAI-ARIA APG's `grid` pattern, we follow that pattern.
- **No** data fetching, HTTP client, or query cache. State is
  server-controllable via callbacks; fetch is the consumer's concern.
- **No** built-in file emitter (CSV, XLSX). Export produces plain
  serializable data and calls a consumer-provided writer.
- **No** built-in undo/redo. Editing exposes a mutation stream; undo
  is a consumer concern layered on top.
- **No** formula engine, no cell references, no Excel-like
  interactions beyond the scope listed above (arrow-key navigation,
  Enter/Esc/Tab editing, range selection, clipboard copy/paste).
- **No** virtual scrolling grid layouts (masonry, staggered) — only
  fixed-height rows in v1, mirroring the DataTable v1 constraint.
- **No** collaboration protocol (multiplayer cursors, presence,
  operational transform).
- **No** pivot table. Grouping is one-dimensional (row-axis groups).
- **No** cross-tab syncing. State snapshots are per-instance.
- **No** binding to a specific backend schema. Column defs and state
  shapes remain generic over `TRow`.

### Deferred to a later Pro task (not KUI-ENT-002…005)

- Variable row height (v1 is fixed-size, same as DataTable's
  virtualization v1).
- `IntersectionObserver`-based infinite scroll. Server-controlled
  windowing is available immediately; infinite scroll is a Phase 15+
  decision.
- Column groups / header groups spanning multiple columns.
- Cell merging / spanning.
- Column autosize based on measured content.
- Right-to-left drag interactions beyond ARIA-compliant defaults
  (arrow keys, Home/End) — RTL layout is supported at v1.
- Print stylesheet.

---

## Positioning Relative to `DataTable`

The rule from KUI-ENT-001 stands: **no capability withdrawal**. DataTable
does not lose row virtualization, sorting, filtering, or selection when
DataGrid ships.

| Capability                            | `@kairoui/core` `DataTable` | `@kairoui-pro/data-grid` `DataGrid` |
| ------------------------------------- | --------------------------- | ----------------------------------- |
| Read-only tabular rendering           | ✔                           | ✔                                   |
| Row selection (single / multiple)     | ✔                           | ✔ + range + shift/ctrl              |
| Single-column sort                    | ✔                           | ✔                                   |
| Multi-column sort                     | —                           | ✔                                   |
| Column filters (built-in + custom fn) | ✔                           | ✔                                   |
| Row virtualization (fixed height)     | ✔                           | ✔                                   |
| Column virtualization                 | —                           | ✔ (opt-in)                          |
| Column resize / reorder / hide / pin  | —                           | ✔                                   |
| Grouping + aggregation                | —                           | ✔                                   |
| Tree rows / expandable rows           | —                           | ✔                                   |
| Master-detail rows                    | —                           | ✔                                   |
| Inline editing                        | —                           | ✔                                   |
| Two-axis keyboard focus               | —                           | ✔                                   |
| ARIA role                             | `table`                     | `grid`                              |
| Export snapshot hook                  | —                           | ✔                                   |
| Persistent state snapshot             | —                           | ✔                                   |

If a consumer needs any single row of the "✔" column that DataTable
does not carry, the answer is DataGrid — not a DataTable feature
request.

---

## Package Layout

Public exports live at the package root only, per the KairoUI export
policy. No internal deep paths are exported.

```
@kairoui-pro/data-grid/
  src/
    data-grid.tsx                 // <DataGrid> root
    data-grid-types.ts            // Public prop / state types
    data-grid-context.ts          // React context (public read hook)
    column-model.ts               // Column state reducer + selectors
    row-model.ts                  // Row state + pipeline (filter → group → sort → paginate)
    focus-model.ts                // Cell focus reducer + keymap
    editing-model.ts              // Edit session lifecycle
    aggregation.ts                // Reducer registry + defaults
    export.ts                     // Snapshot + column-projected iterator
    persistence.ts                // Serialize / deserialize snapshot
    use-data-grid.ts              // Composed hook (used internally)
    use-data-grid-column.ts       // Public column-level hook
    use-data-grid-row.ts          // Public row-level hook
    use-data-grid-cell.ts         // Public cell-level hook
    keymap.ts                     // Documented default key bindings
    styles.css                    // Component styles (only side-effect)
    index.ts                      // Public barrel
```

Package `sideEffects` = `["**/*.css"]`. Named exports only. No default
exports. The barrel re-exports the public API directly (no barrel of
barrels).

**Compound component surface**:

- `DataGrid` — root
- `DataGrid.Column`, `DataGrid.Cell`, `DataGrid.Row`, `DataGrid.HeaderRow`,
  `DataGrid.HeaderCell`, `DataGrid.Toolbar`, `DataGrid.Footer` — declarative
  slot children with the same compound-grouping shape as DataTable's
  free-tier compound siblings.

Each compound child is also exported as a bare named export
(`DataGridColumn`, `DataGridCell`, …) so consumers who prefer explicit
composition can tree-shake the compound helper away.

---

## Capability Boundaries and Extension Points

Every capability below has a documented public API, an internal
implementation home, and an extension point. **Consumers extend by
composition and configuration, never by internal state access.**

### 1. Virtualized rows

- Public: `rowHeight: number`, `overscan?: number` (default 3),
  `virtualScrollHeight?: number`. Same shape as DataTable's
  virtualization props (`DataTableVirtualizationProps`).
- Internal: `useVirtualizer` from `@kairoui/hooks`.
- Extension: consumers override render with `renderRow` for
  per-row skeletons or animations. Height stays fixed.
- **Row height is required.** DataGrid never guesses.

### 2. Optional virtualized columns

- Public: `columnVirtualization?: boolean` (default `false`),
  `defaultColumnWidth?: number`.
- Internal: `computeVirtualizedRange` reused per axis. When enabled,
  DataGrid computes visible column indices from horizontal scroll
  position and only mounts those columns' cells.
- Extension: `columnDef.width` per column can override the default.
  Frozen columns (`pinnedLeft` / `pinnedRight`) are always mounted,
  never virtualized away.
- Column virtualization is opt-in because it breaks native table
  auto-sizing and adds cost consumers do not pay unless they need it.

### 3. Column resizing

- Public: `resizable?: boolean` (column-level), `minWidth?`, `maxWidth?`,
  `defaultWidth?`; `onColumnSizingChange?(sizing)` at root.
- Internal: `column-model.ts` reducer transitions column sizing.
- Extension: consumers pass controlled `columnSizing?: ColumnSizing`
  for full external control.
- Sizing is per-column; there is no viewport-percent unit until a
  future ADR approves it. Widths are CSS pixels.

### 4. Column reordering

- Public: `reorderable?: boolean` (column-level); the root prop
  `columnOrder?: readonly string[]` / `defaultColumnOrder?` /
  `onColumnOrderChange?`.
- Internal: array of column IDs stored in `columnState.order`.
- Extension: drag handles are opt-in via `<DataGrid.HeaderCell>`
  gesture props. Programmatic reorder always available through the
  controlled prop.
- Frozen columns can be reordered inside their pin group but never
  across pin groups without an explicit unpin step.

### 5. Column pinning

- Public: `columnPinning?: ColumnPinning`,
  `defaultColumnPinning?`, `onColumnPinningChange?`, plus a per-column
  `pinnable?: boolean`.
- Internal: `ColumnPinning = { left: readonly string[]; right: readonly string[] }`.
- Extension: consumers may hide the built-in pin affordance and drive
  it from a menu, toolbar, etc. — the state is the extension point.
- Pinned columns get `position: sticky` + a `data-pinned` attribute.
  DataGrid does not introduce fixed-layout scroll containers just to
  achieve pinning.

### 6. Column visibility

- Public: `columnVisibility?: Readonly<Record<string, boolean>>`,
  `defaultColumnVisibility?`, `onColumnVisibilityChange?`. Per-column
  `hideable?: boolean` (default `true`).
- Internal: boolean map. Hidden columns are excluded from render
  entirely; their state (sort, filter) is preserved so re-showing
  restores it without loss.
- Extension: a `<DataGrid.ColumnVisibilityMenu>` is not shipped in
  KUI-ENT-005 initial; consumers use the controlled prop with any
  overlay of their choice.

### 7. Multi-column sorting

- Public: `sort?: readonly SortState[]` (**array**, not a single
  entry — this is the DataGrid extension), `defaultSort?`,
  `onSortChange?`; per-column `sortable?: boolean`, `sortFn?`.
- Internal: `column-model.ts` cycles sort states; `row-model.ts`
  applies a **stable, priority-ordered** multi-column sort. Priority
  is the array index.
- Extension: consumers cap active sort columns via a `maxSortColumns?`
  prop (default: unlimited).
- Backwards compatible with DataTable's `SortState`: DataGrid's array
  is `readonly SortState[]` where DataTable's prop is a single
  `SortState`. A migration helper is documented (`fromDataTableSort`,
  `toDataTableSort`) but not shipped as runtime code — the shapes are
  trivial.

### 8. Advanced filtering

- Public: same `FilterState` shape and `FilterOp` union from
  `@kairoui/core/components/data-table`. DataGrid does not fork the
  filter model.
- Extension: `filterFn` on the column def, `filterKind` UI hint,
  `filterOptions` for enumerations — all reused.
- Additions:
  - Per-column server hint (`filterMode?: "client" | "server"`) that
    tells the internal pipeline to skip evaluation and rely on the
    consumer's filtered `data`. Default `"client"`.
  - Cross-row `filterAllRows?: (rows, state) => rows` escape hatch
    for edge cases the operator set cannot express. Runs after
    per-row filtering; must be pure and never mutate.
- **The `FilterOp` union is not extended by DataGrid.** Anything
  outside the fifteen operators uses `filterFn`.

### 9. Grouping

- Public: `groupBy?: readonly string[]` (column IDs, in group depth
  order), `defaultGroupBy?`, `onGroupByChange?`. Per-column
  `groupable?: boolean`.
- Internal: `row-model.ts` adds a **grouping stage** to the row-model
  pipeline. The stage runs **between filter and sort**. This mirrors
  the free-tier pipeline order and preserves the "filter first" rule.
- Stage output: a flat array of `GridRowNode<TRow>` with `kind: "group"`
  or `kind: "leaf"`. Each group node carries its depth, key, count,
  and children iterator. Rendering is a flat vertical list; nesting
  is visual (indentation + expander), never a nested DOM `<tr>`.
- Extension: `groupFn?: (row) => string | number` on the column def
  for computed group keys. Default: cell value.
- Grouping composes with tree rows: if a column has `treeChildren`
  and grouping is active, tree children live inside their group's
  leaf list.
- **Grouping does not paginate**. Pagination applies after grouping,
  operates on flattened output.

### 10. Aggregation

- Public: `aggregate?: AggregationSpec` on the column def:

  ```ts
  export type AggregationReducer =
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "count"
    | "countUnique"
    | ((values: readonly unknown[], rows: readonly unknown[]) => unknown);

  export interface AggregationSpec {
    readonly reducer: AggregationReducer;
    readonly footer?: boolean; // aggregate a "grand total" footer row
    readonly formatter?: (value: unknown) => ReactNode;
  }
  ```

- Internal: `aggregation.ts` owns the built-in reducers. Custom
  reducers receive both raw cell values and full rows so consumers
  can aggregate over multiple fields.
- Extension: functions are the only extension point. There is no
  reducer registry. Registries introduce state and hurt tree-shaking.

### 11. Expandable rows (tree + master-detail)

- Public:
  - Tree: `treeChildren?: (row: TRow) => readonly TRow[]` on the root
    props. `getRowDepth?: (row) => number` optional convenience.
  - Master-detail: `renderRowDetail?: (row: TRow) => ReactNode` on the
    root props.
  - Both use the same expansion state: `expanded?: ExpansionState`
    (reuses `@kairoui/core/data`'s `ExpansionState`),
    `defaultExpanded?`, `onExpandChange?`.
- Internal: `row-model.ts` walks the tree lazily; detail rows are
  materialized as a `{ kind: "detail"; parentId }` node in the flat
  render list.
- Extension: `treeChildren` is a pure function; DataGrid does not
  fetch children. For async trees, consumers manage `data` and expose
  loading state via a custom cell renderer.
- **You cannot mix tree children and master-detail on the same
  parent row.** The row model rejects it at type level via
  discriminated union.

### 12. Row selection

- Public: same as DataTable —
  `selectionMode: "none" | "single" | "multiple"`,
  `selectedIds?`, `defaultSelectedIds?`, `onSelectionChange?`.
- Additions:
  - `"range"` mode with anchored shift/click and shift/arrow.
  - `rowIsSelectable?: (row) => boolean` predicate.
  - Selection state is scoped to leaf rows only. Selecting a group
    header selects its leaves; the selected set contains leaf IDs.
- Extension: `<DataGrid.RowSelectionCheckbox>` is the built-in
  affordance. Consumers can suppress it and drive selection from any
  gesture.

### 13. Inline editing

- Public props:

  ```ts
  readonly editMode?: "none" | "cell" | "row" | "batch";
  readonly onCellEdit?: (change: CellEditEvent) => void | Promise<void>;
  readonly onRowEdit?: (change: RowEditEvent) => void | Promise<void>;
  readonly onEditingChange?: (state: EditingState) => void;
  readonly editingState?: EditingState;              // controlled
  readonly defaultEditingState?: EditingState;       // uncontrolled
  ```

- Per column: `editable?: boolean`, `editCell?: EditCellRenderer<TRow>`,
  `parseEdit?: (input: unknown, row: TRow) => unknown`,
  `validateEdit?: (input: unknown, row: TRow) => ValidationResult`.
- `EditingState` is a single-cell / single-row cursor plus a pending
  buffer. Batch mode collects a Map of pending changes and exposes
  `commit()` / `discard()` via the public hook.
- Internal: `editing-model.ts` owns transitions
  (`beginEdit → change → validate → commit | cancel`). Focus policy:
  entering edit mode moves focus into the editor; exiting restores
  focus to the cell.
- Extension: `editCell` renderer returns a React element. Any input
  component works; DataGrid does not require `@kairoui/core` `Input`.
- **Optimistic vs pessimistic commit is a consumer decision.** The
  callback returns `void | Promise<void>`; DataGrid never persists.

### 14. Keyboard navigation

- Follows WAI-ARIA APG **grid** pattern.
- Default keymap (documented, not hidden — see `keymap.ts`):

  | Key                  | Action                                       |
  | -------------------- | -------------------------------------------- |
  | Arrow keys           | Move focus by one cell                       |
  | Home / End           | First / last cell in row                     |
  | Ctrl+Home / Ctrl+End | First / last cell in grid                    |
  | PageUp / PageDown    | Move focus by viewport rows                  |
  | Enter                | Begin edit / commit edit (in edit mode)      |
  | Escape               | Cancel edit                                  |
  | F2                   | Begin edit (Excel muscle memory)             |
  | Tab / Shift+Tab      | Next / previous editable cell (in edit mode) |
  | Space                | Toggle row selection (when row focused)      |
  | Shift+Space          | Select row                                   |
  | Ctrl+Space           | Select column (when column focused)          |
  | Shift+Click          | Range select                                 |
  | Ctrl+Click           | Toggle individual selection                  |
  | Alt+ArrowRight       | Expand row (tree / detail)                   |
  | Alt+ArrowLeft        | Collapse row                                 |

- Consumers can override any binding via `keymap?: Partial<KeyMap>`.
  Rebinding a key clears its default action; there is no fallback
  chain.

### 15. Cell focus

- **Exactly one focused cell** at a time. Focus lives in
  `focusState = { rowId: RowId; columnId: string }`.
- Tabbing into the grid enters at the last-focused cell or the first
  cell if none. Tabbing out treats the grid as a single stop
  (roving-tabindex pattern from `useCompositeNavigation`).
- Focus survives:
  - virtualization windowing (focused row is force-mounted, same
    policy as free-tier DataTable);
  - column virtualization (focused column is force-mounted);
  - row-model pipeline changes (if focused row is filtered out, focus
    moves to the nearest surviving row);
  - editing commits and cancels.
- Focus is announced via `aria-activedescendant` on the grid root or
  `tabindex=0` on the focused cell — implementation chooses the more
  reliable option per screen reader; policy is captured in
  KUI-ENT-005 a11y audit.

### 16. Server-controlled modes

Every stateful concern is controllable. Controlled and uncontrolled
follow the same shape used across KairoUI:
`state?` + `defaultState?` + `onStateChange?`.

| Concern            | Controlled prop    | Change callback            |
| ------------------ | ------------------ | -------------------------- |
| Row data           | `data`             | (consumer owns)            |
| Sort               | `sort`             | `onSortChange`             |
| Filters            | `filterState`      | `onFilterStateChange`      |
| Grouping           | `groupBy`          | `onGroupByChange`          |
| Expansion          | `expanded`         | `onExpandChange`           |
| Selection          | `selectedIds`      | `onSelectionChange`        |
| Column sizing      | `columnSizing`     | `onColumnSizingChange`     |
| Column order       | `columnOrder`      | `onColumnOrderChange`      |
| Column visibility  | `columnVisibility` | `onColumnVisibilityChange` |
| Column pinning     | `columnPinning`    | `onColumnPinningChange`    |
| Editing            | `editingState`     | `onEditingChange`          |
| Focus              | `focusState`       | `onFocusChange`            |
| Pagination         | `pagination`       | `onPaginationChange`       |
| Row count (server) | `rowCount`         | (informational only)       |

Server mode is toggled per-concern:

- Filters: `filterMode: "server"` on a column skips evaluation;
  DataGrid trusts `data` is already filtered.
- Sorting: `sortMode: "server"` (root prop) skips row-model sort.
- Grouping: `groupMode: "server"` requires server-computed group
  nodes. Consumer provides `serverGroupTree?: readonly GridRowNode[]`.
- Pagination: `paginationMode: "server"` requires `rowCount?: number`;
  DataGrid renders the returned page as-is.

DataGrid never fetches. `data` is always consumer-provided.

### 17. Export hooks

- Public: `useDataGridExport(): { snapshot; iterateRows; iterateColumns }`.
- `snapshot()` returns a `GridExportSnapshot` — a plain-data
  structure containing rows currently visible in render order,
  including group headers and computed aggregates, in flat form.
- `iterateRows(spec)` yields row records with cell values projected
  through the column's `accessorFn` and optional `exportValue?`
  override.
- **No file emitter.** CSV, XLSX, JSON conversion is a consumer
  concern. Providing an escape-safe row iterator is the enterprise
  contract; encoding to a bytestream is a bundler and format
  concern.
- Export always uses the **client-side** state — for server-paged
  data, the export covers the current page. A `serverExport?`
  callback is available for consumers to route through their
  backend.

### 18. State persistence hooks

- Public:
  ```ts
  export interface GridPersistedState {
    readonly version: 1;
    readonly sort?: readonly SortState[];
    readonly filterState?: FilterState;
    readonly groupBy?: readonly string[];
    readonly expanded?: ExpansionState;
    readonly selectedIds?: readonly RowId[];
    readonly columnSizing?: ColumnSizing;
    readonly columnOrder?: readonly string[];
    readonly columnVisibility?: Readonly<Record<string, boolean>>;
    readonly columnPinning?: ColumnPinning;
    readonly pagination?: PaginationState;
  }

  export function serializeGridState(state: GridSnapshot): GridPersistedState;
  export function deserializeGridState(persisted: GridPersistedState): GridSnapshot;
  ```
- `useDataGridPersistence({ storage, key })` binds the persisted
  state to a consumer-provided `Storage`-like interface
  (`{ getItem, setItem, removeItem }`). DataGrid does **not** touch
  `localStorage` directly.
- Version-tagged. Future changes bump `version` and ship a
  migration.
- Focus and editing states are **not** persisted — they are
  ephemeral to a session.

---

## Internal State Models

The DataGrid maintains six internal state slices. Each is
independently controllable, testable, and reducer-shaped.

### Grid state

The root aggregate. Every other slice is a projection or a derived
value from grid state plus row data.

```ts
export interface GridState {
  readonly rowCount: number; // client or server
  readonly page: PaginationState; // { pageIndex, pageSize }
  readonly loading: boolean;
  readonly error: unknown | null; // opaque; DataGrid only surfaces it
  readonly serverMode: {
    readonly sort: boolean;
    readonly filter: boolean;
    readonly grouping: boolean;
    readonly pagination: boolean;
  };
}
```

### Column state

Per-column runtime state that is not part of the column definition.

```ts
export interface ColumnRuntime {
  readonly id: string;
  readonly width: number; // px, resolved from defaultWidth/min/max
  readonly hidden: boolean;
  readonly pinned: "left" | "right" | null;
  readonly orderIndex: number; // position in visible order
  readonly sortIndex: number | null; // priority in multi-sort, null when inactive
  readonly sortDirection: SortDirection | null;
  readonly filter: ColumnFilter | null;
}

export interface ColumnState {
  readonly byId: Readonly<Record<string, ColumnRuntime>>;
  readonly order: readonly string[]; // canonical order (not visible order)
  readonly pinned: ColumnPinning;
  readonly sizing: ColumnSizing; // Readonly<Record<string, number>>
  readonly visibility: Readonly<Record<string, boolean>>;
}
```

Selectors project **visible left-to-right column IDs** and
**pinned-left / center / pinned-right groups** for the renderer.

### Row state

Per-row derived state produced by the row-model pipeline. Rows
themselves stay `TRow` — DataGrid never mutates consumer data.

```ts
export type GridRowNode<TRow> =
  | { readonly kind: "leaf"; readonly id: RowId; readonly row: TRow; readonly depth: number }
  | {
      readonly kind: "group";
      readonly id: string;
      readonly key: unknown;
      readonly depth: number;
      readonly count: number;
      readonly aggregates: Readonly<Record<string, unknown>>;
      readonly parentGroupId: string | null;
    }
  | { readonly kind: "detail"; readonly id: string; readonly parentId: RowId }
  | {
      readonly kind: "footer";
      readonly id: "__footer__";
      readonly aggregates: Readonly<Record<string, unknown>>;
    };

export interface RowState<TRow> {
  readonly nodes: readonly GridRowNode<TRow>[];
  readonly totalLeafCount: number;
  readonly filteredLeafCount: number;
  readonly indexById: ReadonlyMap<string, number>; // node id → index in nodes
}
```

Pipeline (fixed order, mirrors and extends the free-tier pipeline):

```
data
  → filter    (client) / passthrough (server)
  → group     (produces group + leaf nodes; passthrough when groupBy empty)
  → sort      (multi-column, stable, priority-ordered)
  → aggregate (computes per-group and per-footer aggregates)
  → paginate  (client) / passthrough (server)
```

### Cell state

Cells are **not** individually stored. A cell is
`(rowNode, columnRuntime)` at render time. The only stored per-cell
concept is:

```ts
export interface EditingCell {
  readonly rowId: RowId;
  readonly columnId: string;
  readonly rawInput: unknown;
  readonly validation: ValidationResult;
}
```

This lives inside `EditingState`, not in `RowState` — cell edit is a
UI concern layered on top of the row model, never a mutation of the
row model itself.

### Focus state

```ts
export interface FocusState {
  readonly rowId: RowId | null;
  readonly columnId: string | null;
  readonly anchorRowId: RowId | null; // for range selection
  readonly anchorColumnId: string | null; // for range selection
}
```

Reducer transitions are pure functions of
`(focus, action, rowState, columnState)`. Actions are keyboard events
projected to a small action type:
`MoveTo`, `MoveBy`, `PageBy`, `ExtendTo`, `EnterEdit`, `ExitEdit`,
`ToggleSelect`, `SelectRange`.

Actions never dispatch DOM effects directly. The `<DataGrid>`
component observes focus state and calls `element.focus()` in a
layout effect — matching the pattern used by DateRangePicker.

### Editing state

```ts
export type EditingMode = "none" | "cell" | "row" | "batch";

export interface EditingState {
  readonly mode: EditingMode;
  readonly active: EditingCell | null;
  readonly pending: ReadonlyMap<RowId, ReadonlyMap<string, unknown>>; // batch only
  readonly errors: ReadonlyMap<RowId, ReadonlyMap<string, string>>; // per cell error
}
```

Lifecycle:

1. `beginEdit(rowId, columnId)` → `active` populated with initial
   `rawInput`.
2. `changeEdit(input)` → `active.rawInput` updated; `validateEdit`
   runs; `active.validation` reflects result.
3. `commitEdit()` → if valid, calls `onCellEdit` /
   `onRowEdit`; on success (or synchronously when no callback), state
   updates to reflect the committed value.
4. `cancelEdit()` → `active` cleared; focus restored to the cell.

In `"batch"` mode step 3 is replaced with a write to `pending`.
Consumers call `useDataGridEditing().commit()` / `.discard()` to
flush or drop the buffer. Batch commit calls `onRowEdit` for each
mutated row.

---

## Column Definition

DataGrid extends the DataTable column definition without breaking it.
A DataTable column def is a valid DataGrid column def; the reverse
requires stripping DataGrid-only fields.

```ts
export interface DataGridColumnDef<TRow> extends DataTableColumnDef<TRow> {
  // Sizing
  readonly width?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly defaultWidth?: number;
  readonly resizable?: boolean;

  // Reorder / pin / visibility
  readonly reorderable?: boolean;
  readonly pinnable?: boolean;
  readonly hideable?: boolean;

  // Multi-sort + custom compare
  readonly sortFn?: (a: TRow, b: TRow) => number;

  // Filter (server hint)
  readonly filterMode?: "client" | "server";

  // Grouping / aggregation
  readonly groupable?: boolean;
  readonly groupFn?: (row: TRow) => string | number;
  readonly aggregate?: AggregationSpec;

  // Editing
  readonly editable?: boolean;
  readonly editCell?: EditCellRenderer<TRow>;
  readonly parseEdit?: (input: unknown, row: TRow) => unknown;
  readonly validateEdit?: (input: unknown, row: TRow) => ValidationResult;

  // Export
  readonly exportValue?: (row: TRow) => unknown;
}
```

`DataGridColumnDef` is generic over `TRow`. **No type coercion, no
`unknown` in the public shape, no `any`.** Extends
`DataTableColumnDef<TRow>` so consumers migrating from DataTable can
widen without rewrites.

---

## TypeScript Performance Constraints

Column defs are the DataGrid's hot type. Every DataGrid instance
compiles a column array whose generic parameter is the row type.
Prior phases surfaced compiler-cost issues with deeply conditional
generic types over large tuples; DataGrid must not repeat them.

Rules — enforced by the KUI-ENT-005 type audit:

1. **`columns` is `readonly DataGridColumnDef<TRow>[]`, not a tuple
   type.** No `[C1, C2, C3]` inference; the array is homogenous over
   `TRow`.
2. **No conditional types on cell value inference.** DataGrid never
   tries to derive per-column `Value = TRow[keyof TRow]` from the
   accessor at type level. Cell values are `unknown` in the public
   contract, matching DataTable's shape.
3. **No mapped type over `columns` array** in any public prop shape.
4. **No recursive generic over row depth** for tree data. `depth: number`
   is the runtime signal; there is no `TRow<'depth', N>` type math.
5. **Discriminated unions carry the load.** `GridRowNode`,
   `ValidationResult`, `AggregationReducer`, and `GridPersistedState`
   are all discriminated so consumer narrowing costs O(1) at the type
   checker.
6. **Types are declared in `data-grid-types.ts`** and re-exported by
   `index.ts`. No public type is defined inside a `.tsx` file. This
   preserves DTS bundling behavior and avoids leaked internal types.

Same discipline the free packages already follow (see
`docs/architecture/typescript-strict.md`); DataGrid does not opt out.

---

## Accessibility Requirements

- **ARIA role**: the grid root uses `role="grid"`.
  Rows use `role="row"`. Column headers use `role="columnheader"`.
  Cells use `role="gridcell"`. Group header rows use
  `role="row"` + `aria-level`. This is a **departure from DataTable**
  (which stays `<table>` semantic).
- **`aria-rowcount` / `aria-rowindex`** reflect the true logical
  count including group headers and detail rows.
- **`aria-colcount` / `aria-colindex`** reflect the true column
  count including hidden columns' positions (or the visible count —
  the KUI-ENT-005 a11y audit fixes the exact policy against APG
  guidance; the recommendation here is to use the **visible** count so
  screen reader users hear a consistent grid).
- **Roving tabindex** on the currently focused cell, exactly one
  `tabindex="0"` at any time. All others `tabindex="-1"`.
- **Editing announcements** via `aria-live="polite"` region for
  validation errors and commit / cancel confirmations. Text is
  localizable via a `messages` prop (same pattern as DateRangePicker).
- **`aria-sort`** set on sorted column headers.
  `"ascending"` / `"descending"` / `"none"`.
- **`aria-expanded`** on tree parent and master-detail parent rows.
- **`prefers-reduced-motion`** respected — no auto-scroll animation
  on focus change; expansion transitions cut when the user prefers
  reduced motion.
- **Screen reader smoke test** on NVDA + JAWS + VoiceOver required
  before Phase 14 `beta`. Blockers found at that stage push a fix
  before the completion audit.

The DataGrid a11y audit lands as its own KUI-ENT-005 sub-task,
modeled on `PHASE13-A11Y-AUDIT.md`.

---

## SSR Requirements

- First render is server-safe. No `window` / `document` access at
  module load.
- Virtualization degrades: server renders the current page unwindowed
  (or empty when using server-mode pagination), client swaps to
  windowed on the second render. Byte-identical hydration.
- Column sizing that comes from measured content (auto-sized columns,
  deferred to a future task) is **out of scope** for Phase 14 — v1
  sizes are consumer-provided or from `defaultColumnWidth`.
- Focus reducer produces no side effects during render; focus DOM
  effects happen in `useIsomorphicLayoutEffect` only after mount.
- Editing state defaults to `mode: "none"` on the server; server
  render never opens an editor.
- Persistence hook reads from `Storage` on client only, in a
  `useEffect`. Never during render.

---

## Bundle Isolation and Tree-Shaking

- `@kairoui-pro/data-grid` declares only these runtime
  dependencies: `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`.
  `react` and `react-dom` are peer.
- No dependency on any other `@kairoui-pro/*` package.
- Named exports only; the root barrel re-exports symbols directly
  (no barrel of barrels).
- **Aggregation reducers are individually tree-shakeable.** Built-in
  reducers (`sum`, `avg`, `min`, `max`, `count`, `countUnique`) are
  separate module-scope constants; consumers who pass a function
  reducer only pay for their own function.
- **Editing is tree-shakeable.** `editing-model.ts` is only pulled in
  when a column carries `editable: true` at column-def time, verified
  by a bundle test that imports `DataGrid` without any editable
  columns.

Bundle budgets seed as part of KUI-ENT-018 (Pro bundle-budget
baseline). Initial targets (informational, not enforced by this task):

| Entry point                         | Raw budget target | Gzip budget target |
| ----------------------------------- | ----------------- | ------------------ |
| `@kairoui-pro/data-grid/index.js`   | 120 KB            | 32 KB              |
| `@kairoui-pro/data-grid/styles.css` | 12 KB             | 3 KB               |

These are provisional and reset against the first release-candidate
build in KUI-ENT-005.

---

## Public vs Internal API

Public (exported from `@kairoui-pro/data-grid`):

- Components: `DataGrid`, `DataGrid.Column`, `DataGrid.Cell`,
  `DataGrid.Row`, `DataGrid.HeaderRow`, `DataGrid.HeaderCell`,
  `DataGrid.Toolbar`, `DataGrid.Footer` (plus their bare-name
  siblings).
- Hooks: `useDataGrid`, `useDataGridColumn`, `useDataGridRow`,
  `useDataGridCell`, `useDataGridExport`, `useDataGridPersistence`,
  `useDataGridEditing`, `useDataGridSelection`.
- Types: `DataGridColumnDef`, `DataGridRootProps`,
  `DataGridContextValue`, all state types
  (`GridState`, `ColumnState`, `RowState<TRow>`, `FocusState`,
  `EditingState`), `GridRowNode`, `GridPersistedState`,
  `GridExportSnapshot`, `AggregationSpec`, `AggregationReducer`,
  `EditCellRenderer`, `ValidationResult`, `PaginationState`,
  `ColumnPinning`, `ColumnSizing`, `CellEditEvent`, `RowEditEvent`,
  `KeyMap`.
- Values: `defaultKeyMap`, `defaultAggregators`,
  `serializeGridState`, `deserializeGridState`, `dataGridStyleContract`.

Internal (not exported):

- Reducer implementations (`column-model.ts` internals,
  `row-model.ts` pipeline stages, `focus-model.ts` transitions).
- Prefixed helpers (`_computeRenderPlan`, `_projectVisibleColumns`).
- CSS-in-source constants.
- Test-only helpers under `src/**/__tests__/`.

The barrel never re-exports a symbol whose name starts with `_` or a
type whose name starts with `Internal`.

---

## Compatibility with the Free Tier

- **`RowId`, `SortState`, `SortDirection`, `SelectionMode`,
  `ExpansionState`, `ColumnAlign`, `FilterOp`, `FilterState`,
  `ColumnFilter`, `FilterKind`, `FilterFn`, `FilterOption`,
  `EMPTY_FILTER_STATE`, `runRowModelPipeline`,
  `applyFilters`, `sortRows`, `getSelectAllState`,
  `toggleRowSelection`, `toggleSelectAll`, `computeVirtualizedRange`,
  `useVirtualizer`, `useControllableState`** — all reused from
  `@kairoui/core` / `@kairoui/hooks` / `@kairoui/utils`. DataGrid does
  not shadow, re-implement, or shim any of these.
- **`DataTableColumnDef<TRow>`** is the base type extended by
  `DataGridColumnDef<TRow>`. Migration from DataTable is `import`
  swap + optional widening; no props are renamed.
- The DataGrid pipeline uses the same `runRowModelPipeline` for the
  filter → sort stages when grouping and aggregation are inactive;
  the grouping/aggregation extension is a **wrapper** around it, not
  a rewrite.
- Consumers running DataTable side-by-side with DataGrid pay the
  DataGrid cost only for the code path they install; no accidental
  duplication of the row-model pipeline.

---

## What KUI-ENT-002 Does Not Do

- Does **not** create the `@kairoui-pro/data-grid` package.
- Does **not** write any DataGrid source code.
- Does **not** modify DataTable, `column-utils.ts`, `filter-utils.ts`,
  `sort-utils.ts`, `row-model-pipeline.ts`, `use-row-selection.ts`,
  or any existing free-tier file.
- Does **not** change bundle budgets or the docs generator config.
- Does **not** add any `@kairoui-pro/*` import to a free package.
- Does **not** enforce a license check.
- Does **not** implement column resize gestures, drag-and-drop
  reorder, or editor components — those land in KUI-ENT-003 / 004.

Later tasks introduce the package, source, and tests.

---

## Change Control

Amendments require a new task ID under Phase 14 and must preserve:

1. The dependency direction (Pro → core, never reverse).
2. The pipeline order (filter → group → sort → aggregate → paginate).
3. The two-axis focus contract (exactly one focused cell).
4. The compatibility rule with DataTable
   (`DataGridColumnDef` extends `DataTableColumnDef`).
5. The "consumer-owned data" rule (DataGrid never fetches).
6. The "no built-in file emitter" rule for export.
7. The SSR / a11y guarantees stated above.

Anything else is fair game. Record the amending task ID here on
change.
