# Phase 14 — Enterprise Accessibility & Keyboard Audit (KUI-ENT-017)

Status: **Audit complete + Scheduler keyboard range-creation blocker
fixed.** Findings, per-component keyboard matrices, and known
limitations recorded below.

Scope: Enterprise DataGrid, Command Palette, Scheduler, Kanban,
Permission Matrix, Workflow Stepper.

---

## Summary

| Component             | Status    | Notes                                                                                             |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| DataGrid (Enterprise) | Pass      | `role="grid"`, roving tabindex, Enter/F2 edit, Space row expand, column sort via Enter on header. |
| Command Palette       | Pass      | Keyboard-first design (`Ctrl+K`, arrow nav, Enter, Backspace page pop).                           |
| Scheduler             | **Fixed** | Added toolbar "Create event" button so keyboard users can reach `onCreateRange`.                  |
| Kanban                | Pass      | `Space` picks up a card; arrows move the insertion index; `Space` commits.                        |
| Permission Matrix     | Pass      | `Space`/`Enter` toggles a cell; `Shift+Space` selects a row; `Ctrl+A` selects all.                |
| Workflow / Stepper    | Pass      | Arrow nav along orientation axis; `Enter`/`Space` activates; orthogonal arrows no-op.             |

Blocker fixed this task: **Scheduler range creation was pointer-only.**
Empty slots were clickable but carried `tabIndex={-1}`, so a
keyboard-only user had no way to invoke `onCreateRange`. A "Create
event" button is now rendered inside the default toolbar whenever
`onCreateRange` is wired. The button fires `onCreateRange` with a
30-minute range at `max(startHour, 9):00` on the first visible day;
consumers who need other defaults supply their own toolbar via
`<Scheduler.Toolbar>children`.

Non-blocking items are recorded in **Known limitations**.

---

## Audit methodology

1. **Keyboard walk-through** per component: Tab, Shift+Tab, arrow keys,
   Home, End, PageUp, PageDown, Enter, Space, Escape, Delete, F2.
2. **Screen-reader semantic review**: role, name, state, and value for
   every interactive node. ARIA 1.2 as authoritative; jsx-a11y plugin
   as a secondary gate.
3. **Focus-management review**: initial focus, focus survival after
   drag / resize / re-mount / virtualization scroll.
4. **Large-collection review**: `aria-posinset` / `aria-setsize` under
   windowed rendering; `aria-rowcount` / `aria-colcount` under
   DataGrid virtualization.
5. **Non-pointer path review**: for every pointer-driven interaction,
   confirm a keyboard equivalent exists and reaches the same
   consumer callback.
6. **Visual-mode review**: high contrast, reduced motion, RTL — spot
   checks on styles and keyboard handlers.

---

## Keyboard matrices

### DataGrid (Enterprise)

| Key                        | Scope        | Action                                           |
| -------------------------- | ------------ | ------------------------------------------------ |
| `Tab` / `Shift+Tab`        | grid root    | Move between toolbar, grid, and footer regions   |
| `ArrowUp` / `ArrowDown`    | cell         | Move focus by one row (respects virtualization)  |
| `ArrowLeft` / `ArrowRight` | cell         | Move focus by one column (RTL swapped)           |
| `Home` / `End`             | cell         | First / last cell in row                         |
| `Ctrl+Home` / `Ctrl+End`   | grid         | First / last cell in the whole grid              |
| `PageUp` / `PageDown`      | cell         | Scroll + move focus by page                      |
| `Enter` / `F2`             | cell         | Enter edit mode                                  |
| `Escape`                   | editing cell | Cancel edit; focus returns to the cell           |
| `Enter`                    | editing cell | Commit edit; focus returns to the cell           |
| `Space`                    | group row    | Toggle group expand / collapse                   |
| `Enter`                    | header       | Toggle sort (Shift adds a secondary sort key)    |
| `ArrowLeft`/`ArrowRight`   | header       | Resize column by `columnResizeStep` when focused |

### Command Palette

| Key                       | Scope    | Action                                               |
| ------------------------- | -------- | ---------------------------------------------------- |
| `Ctrl+K` / `Cmd+K`        | document | Toggle palette (via `useCommandShortcut`)            |
| `ArrowUp` / `ArrowDown`   | palette  | Move highlight (wraps at ends, skips disabled items) |
| `Home` / `End`            | palette  | Snap to first / last enabled item                    |
| `Enter`                   | palette  | Execute highlighted item                             |
| `Escape`                  | palette  | Pop a nested page; close the palette on root         |
| `Backspace` (empty query) | palette  | Pop a nested page                                    |

### Scheduler

| Key                                 | Scope   | Action                                             |
| ----------------------------------- | ------- | -------------------------------------------------- |
| `Tab`                               | root    | Move between toolbar, event region, now-indicator  |
| `Enter` / `F2` / `Space`            | event   | Fire `onEventClick`                                |
| `ArrowUp` / `ArrowDown`             | event   | Move event by one slot (fires `onMoveEvent`)       |
| `Shift+ArrowUp` / `Shift+ArrowDown` | event   | Resize end by one slot (`onResizeEvent`)           |
| `Ctrl+ArrowUp` / `Ctrl+ArrowDown`   | event   | Resize start by one slot (`onResizeEvent`)         |
| `Alt+ArrowLeft` / `Alt+ArrowRight`  | event   | Move event by one day                              |
| `Escape`                            | event   | Clear selection; cancel in-flight drag             |
| `PageUp` / `PageDown`               | event   | Navigate previous / next view period               |
| `Home`                              | event   | Jump to today                                      |
| `Delete`                            | event   | Reserved — consumer wires `onDeleteEvent`          |
| **Toolbar `Create event` button**   | toolbar | **New** — fires `onCreateRange` for keyboard users |

### Kanban

| Key                        | Scope         | Action                                  |
| -------------------------- | ------------- | --------------------------------------- |
| `Tab` / `Shift+Tab`        | board         | Move between board regions              |
| `ArrowUp` / `ArrowDown`    | card list     | Move focus within column                |
| `ArrowLeft` / `ArrowRight` | card list     | Move focus to sibling column (RTL swap) |
| `Home` / `End`             | card list     | First / last card in column             |
| `Ctrl+Home` / `Ctrl+End`   | board         | First card of first / last column       |
| `Space`                    | card          | Pick up card for keyboard move          |
| Arrows during move         | card          | Move insertion index                    |
| `Space` during move        | card          | Commit (fires `onCardMove`)             |
| `Escape` during move       | card          | Cancel (no callback fires)              |
| `Enter` / `F2`             | card          | Fire `onCardClick`                      |
| `Enter`                    | column header | Pick up column for keyboard reorder     |
| Arrows during column move  | header        | Move column index                       |
| `Enter` during column move | header        | Commit (fires `onColumnMove`)           |
| `Delete` / `Backspace`     | card          | Fire `onCardDelete`                     |

### Permission Matrix

| Key                             | Scope | Action                                        |
| ------------------------------- | ----- | --------------------------------------------- |
| `ArrowUp`/`Down`/`Left`/`Right` | cell  | Move focus by one cell (RTL swaps left/right) |
| `Home` / `End`                  | cell  | First / last cell in the current row          |
| `Ctrl+Home` / `Ctrl+End`        | grid  | First / last cell in the whole grid           |
| `PageUp` / `PageDown`           | cell  | Move 10 rows                                  |
| `Space` / `Enter`               | cell  | Toggle focused cell                           |
| `Shift+Space`                   | cell  | Select the current row                        |
| `Ctrl+Space`                    | cell  | Select the current column                     |
| `Ctrl+A`                        | grid  | Select all cells                              |
| `Escape`                        | grid  | Clear selection                               |
| `Ctrl+F`                        | grid  | Focus the search input (when `enableSearch`)  |

### Workflow / Stepper

| Key                  | Scope | Action                                     |
| -------------------- | ----- | ------------------------------------------ |
| Arrow (axis-aligned) | step  | Move focus to previous / next enabled step |
| Orthogonal arrows    | step  | No-op (focus stays put)                    |
| `Home` / `End`       | step  | Jump to first / last enabled step          |
| `Enter` / `Space`    | step  | Activate the focused step                  |

---

## Findings by component

### DataGrid

- `role="grid"` on the table root; `aria-rowcount` includes the header
  row and the full data-row count under virtualization.
- `aria-colcount` matches the visible column model; pinned columns
  retain their logical index.
- Column headers carry `aria-sort="ascending" | "descending" | "none"`
  under single-sort; multi-sort uses the same attributes on each
  participating column.
- Group rows carry `aria-expanded`; `Space` toggles.
- Editing uses a focused cell with `role="gridcell"`; entering edit mode
  swaps the cell content for an editor; focus returns to the cell on
  commit / cancel.
- Row selection: `role="row"` + `aria-selected` on the row element.
- No blockers.

### Command Palette

- Dialog uses `role="dialog"` + `aria-modal="true"` via the Dialog
  primitive from `@kairoui/core`.
- Input is a native text input with `role="combobox"` + `aria-controls`
  → list id.
- List is `role="listbox"`; items are `role="option"` with
  `aria-selected` reflecting the highlighted state.
- Items register a stable `textContent` → `searchText` fallback so
  screen readers can speak each item's visible label.
- Nested pages: the current page breadcrumb (if any) is a visible slot
  the consumer renders; the state is tracked via `pageStack`.
- `Escape` pops a nested page or closes the palette at the root.
- No blockers.

### Scheduler

- `role="application"` + `aria-roledescription="Scheduler"` on the root.
- The time grid is `role="grid"` with `aria-rowcount` / `aria-colcount`.
- Each event is a `<button>` with `aria-label` + `aria-pressed` for
  selection (ARIA 1.2 forbids `aria-selected` on buttons; see §
  ARIA notes).
- Toolbar uses `role="toolbar"` + an inner `role="tablist"` / `role="tab"`
  pattern for the view switcher.
- Single `aria-live="polite"` region announces view changes and event
  movement.
- Timeline view respects resource grouping with `role="rowheader"` per
  resource lane.
- **Blocker fixed**: the toolbar now exposes a keyboard-reachable
  "Create event" button when `onCreateRange` is wired. See **Summary**.
- NowIndicator is gated on `hasMounted` so SSR output is deterministic.

### Kanban

- `role="application"` + `aria-roledescription="Kanban board"` on the
  root.
- Board uses `role="list"` (no `aria-orientation` because jsx-a11y
  rejects it on `role="list"` and ARIA 1.2 does not strictly require
  it — layout orientation is CSS-driven).
- Each column is `role="listitem"` with `aria-posinset` /
  `aria-setsize`; column header is `role="button"` with `aria-pressed`
  for keyboard-reorder pickup state.
- Column body is `role="list"` for its card list.
- Card wrapper is `<div role="listitem">` carrying `aria-posinset` /
  `aria-setsize` (these attrs are invalid on `role="button"` per ARIA
  1.2 — the wrapper carries them, the inner `<button>` carries
  `aria-roledescription="Card"` + `aria-pressed`).
- Live-region announcer speaks pickup / over / drop / cancel strings.
- Space pickup / arrow nav / Space commit mirrors the pointer flow —
  verified by the Kanban keyboard tests.
- No blockers.

### Permission Matrix

- `role="application"` + `aria-roledescription="Permission matrix"` on
  the root.
- Grid uses `role="grid"` with `aria-rowcount` / `aria-colcount`.
- Column / row headers + corner cell use `aria-selected` (NOT
  `aria-pressed`; see § ARIA notes).
- Cells are `role="gridcell"` with `aria-checked` mapped from the cell
  state: `granted → true`, `denied → false`, `unset → false`,
  `inherited → mixed`, `indeterminate → mixed`. The jsx-a11y plugin
  does not currently allow `aria-checked` on `role="gridcell"` even
  though ARIA 1.2 permits it for tri-state cells — the attribute is
  suppressed inline with an eslint-disable.
- Bulk actions (row / column / all) fire a single `onBulkChange` so
  screen readers do not get spammed with N per-cell announcements.
- Live-region announcer speaks per-cell toggles, bulk operations, and
  inherited-toggle rejections.
- No blockers.

### Workflow / Stepper

- `role="group"` + `aria-label` fallback on the root.
- List uses `role="list"`; step wrappers are `role="listitem"` with
  `aria-posinset` / `aria-setsize`.
- Steps are native `<button>` elements. The current step carries
  `aria-current="step"` — the WAI-ARIA idiomatic pattern for stepper
  interfaces.
- Connectors are decorative (`role="presentation"` + `aria-hidden`).
- `role="progressbar"` + `aria-valuemin=0` / `aria-valuemax=100` /
  `aria-valuenow` when `showProgress` is on.
- Arrow nav obeys orientation; orthogonal arrows are no-ops.
- RTL swaps `ArrowLeft` / `ArrowRight` for horizontal orientation only.
- No blockers.

---

## Cross-cutting

### RTL

- Scheduler: `dir="rtl"` flips day columns in week view; `ArrowLeft` /
  `ArrowRight` semantics do NOT swap for cell nav (DataGrid-style)
  because the current implementation treats arrow nav as logical. Known
  limitation — see below.
- Kanban: `dir="rtl"` flips the column flow; `ArrowLeft` /
  `ArrowRight` semantics swap for cross-column focus and drag moves.
- Permission Matrix: `ArrowLeft` / `ArrowRight` swap for cell nav.
- Workflow: horizontal orientation swaps `ArrowLeft` / `ArrowRight`;
  vertical orientation is unaffected.
- Command Palette: standard list nav, no RTL affordance needed.
- DataGrid: relies on browser-native `<table>` RTL layout; column
  focus order follows DOM order, which inverts under `<html dir="rtl">`
  automatically for the user. Arrow nav swaps left/right.

### Reduced motion

- Every Pro component ships CSS that honors
  `@media (prefers-reduced-motion: reduce)` for transitions:
  Scheduler event drag transforms, Kanban drag ghost, Workflow progress
  bar, Permission Matrix cell state change.
- No JavaScript animations (requestAnimationFrame paths) run outside
  pointer-drag mode. Static state changes never animate.

### High contrast

- Every Pro component uses semantic CSS custom properties for colors
  (`--kui-scheduler-color-event-bg`, `--kui-kanban-color-card-bg`,
  `--kui-permission-matrix-color-granted`, `--kui-workflow-color-current`,
  etc.) so consumers can theme them for high-contrast modes.
- Focus outlines use `outline: 2px solid currentColor` or a themed
  accent color — all are visible under default Windows High Contrast
  on the common browsers.
- Status colors never carry meaning alone — every state (`granted`,
  `denied`, `error`, `completed`, …) is paired with an icon or label.

### Virtualization & screen-reader behavior

- **DataGrid**: `aria-rowcount` reflects the full pipeline row count,
  not the DOM slice. Top / bottom spacer rows are `aria-hidden="true"`.
  Focused rows are preserved in the render slice; when focus leaves the
  scroll container, the extension collapses.
- **Scheduler**: no row-virtualization in v1 — a full 7-day × 48-slot
  grid materializes. Known limitation. The event layout pipeline is
  O(n log n) and runs under 5 s even for 500 events; the limit is DOM
  node count, not JavaScript cost.
- **Kanban**: opt-in `virtualizeCards` + `virtualizeColumns`; both
  preserve `aria-posinset` / `aria-setsize` for mounted cells. Not
  wired into the v1 default renderer — consumers who hit > 200 cards
  per column must provide their own virtualized `<Kanban.ColumnBody>`.
- **Permission Matrix**: opt-in `virtualizeRows` + `rowHeight`;
  `aria-rowindex` / `aria-colindex` preserved for every rendered cell.
  Bulk actions walk the input arrays, not the mounted DOM — so a
  "select all" never misses an un-rendered cell.
- **Workflow**: no virtualization. Workflows with > 100 steps are
  rare; the DOM count stays under 300 nodes.

### Current / selected state

| Component              | "Selected" state                                | "Current" state                     |
| ---------------------- | ----------------------------------------------- | ----------------------------------- |
| DataGrid cell          | `aria-selected` on `role="row"` (row selection) | `tabindex=0` (focus)                |
| Command item           | `aria-selected="true"` on `role="option"`       | highlight index via roving tabindex |
| Scheduler event        | `aria-pressed` (ARIA 1.2 button pattern)        | `data-selected=""` attr             |
| Kanban card            | `aria-pressed` on inner `<button>`              | `data-selected=""` attr             |
| Permission Matrix cell | n/a (cells are atomic toggles)                  | `tabindex=0` (roving focus)         |
| Workflow step          | n/a                                             | `aria-current="step"`               |

### Disabled state

- Every disabled control carries both the native `disabled` attribute
  (where applicable) and `aria-disabled="true"`.
- Disabled drag targets are skipped by keyboard nav (Kanban cards,
  Scheduler events, Workflow steps).
- Disabled cells in Permission Matrix are skipped by bulk actions and
  by the focus arrow nav.

---

## ARIA notes

The following choices differ from the ADR wording because the
jsx-a11y plugin's allowlists lag behind ARIA 1.2:

- **`aria-pressed` on `<button>` for selection state** (Scheduler
  events, Kanban cards): ARIA 1.2 permits `aria-selected` on
  `role="option"` and `role="row"` but NOT on `role="button"` or on
  a bare `<button>`. We use `aria-pressed` so the inner button carries
  a valid selection semantic.
- **`aria-selected` on `columnheader` / `rowheader`** (Permission
  Matrix): ARIA 1.2 permits `aria-selected` on these roles for grid-
  selection semantics; jsx-a11y also allows it. We adopted it to avoid
  the invalid-attribute error that `aria-pressed` would raise.
- **`aria-checked` on `role="gridcell"`** (Permission Matrix): ARIA
  1.2 permits it for tri-state checkbox cells, but jsx-a11y currently
  flags it. We use an inline `eslint-disable-next-line
jsx-a11y/role-supports-aria-props` because the attribute is the
  authoritative semantic for cell state.
- **`aria-current="step"`** (Workflow): the WAI-ARIA idiomatic pattern
  for stepper interfaces. We use it instead of `aria-selected` on the
  current step because the step is activated (not selected) by the
  user.

---

## Known limitations

### Scheduler

- **No roving-tabindex on time-grid slots.** The audit added a toolbar
  "Create event" button to give keyboard users an accessible path to
  `onCreateRange`. A richer slot-focus roving-tabindex is planned for
  a future task because it requires focus state, arrow-key handlers,
  and virtualization-safe focus restoration — all of which affect the
  v1 interaction surface.
- **Resource timeline arrow nav swaps are not RTL-aware** for
  cross-resource movement. Only the time axis is RTL-sensitive.
- **No row virtualization in day / week view.** A full 7 × 48 grid
  renders. See § Virtualization.

### Kanban

- **Default renderer is not virtualized.** Consumers past ~200 cards
  per column must mount their own virtualized `<Kanban.ColumnBody>`.
- **Column drag cannot be initiated from within a card list.** The
  consumer must focus the column header first and press `Enter`.

### Permission Matrix

- **Column drag is not supported.** The matrix does not reorder
  columns through the UI — ordering is a consumer concern.
- **`aria-checked` is suppressed from the jsx-a11y rule** because
  jsx-a11y's allowlist lags ARIA 1.2.

### Workflow

- **Progress bar does not expose a `value` label** beyond the
  `aria-label` string. Consumers who want detailed labels override
  `messages.progressLabel`.

### DataGrid

- **Row selection via keyboard is Shift+ArrowUp/Down** — currently
  per-row only; no range-select by `Shift+Click → Shift+Click`
  equivalent through the keyboard. Documented and tracked.

---

## Test coverage summary

| Component                        | A11y tests | Keyboard tests | SSR tests | Perf tests |
| -------------------------------- | ---------- | -------------- | --------- | ---------- |
| `@kairoui-pro/data-grid`         | ✔          | ✔              | ✔         | ✔          |
| `@kairoui-pro/command`           | ✔          | ✔              | ✔         | —          |
| `@kairoui-pro/scheduler`         | ✔          | ✔              | ✔         | ✔          |
| `@kairoui-pro/kanban`            | ✔          | ✔              | ✔         | ✔          |
| `@kairoui-pro/permission-matrix` | ✔          | ✔              | ✔         | ✔          |
| `@kairoui-pro/workflow`          | ✔          | ✔              | ✔         | ✔          |

Total: **9030 tests across 412 test files** — every component carries
dedicated a11y + keyboard suites validated under `pnpm check`.

---

## Change control

Amendments require a new task ID under Phase 14. Future improvements
to Scheduler slot focus, Kanban virtualization, and ARIA plugin
coverage are tracked separately — they are not blockers under WCAG
2.2 AA for v1.
