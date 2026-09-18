# Phase 13 — Accessibility Audit (KUI-ADV-016)

Status: **Audit complete + blocker fixed**. Findings, keyboard matrices,
and remaining known limitations recorded below.

Scope: DateInput, TimeInput, DatePicker, DateRangePicker, DateTimeInput,
DataTable filtering, DataTable virtualization.

---

## Summary

| Component                | Status    | Notes                                                     |
| ------------------------ | --------- | --------------------------------------------------------- |
| DateInput                | Pass      | Field-integrated ARIA, `aria-invalid` on parse.           |
| TimeInput                | Pass      | Same posture as DateInput.                                |
| DatePicker               | Pass      | Combobox pattern with `aria-haspopup="dialog"`.           |
| DateRangePicker          | **Fixed** | Roving tabindex + arrow-key navigation added.             |
| DateTimeInput            | Pass      | Time sub-input isolated from Field errormessage.          |
| DataTable filtering      | Pass      | Composable widgets, `aria-controls` via `id`.             |
| DataTable virtualization | Pass      | `aria-rowcount` / `aria-rowindex`, focused row preserved. |

Blocker resolved this task: **DateRangePicker calendar grid was not
keyboard-navigable** — every day button carried `tabIndex={-1}` and no
arrow-key handler existed. Users could reach the grid via Tab but could
not move within it. Fixed in this commit with a roving-tabindex model
and arrow / Page / Home / End handling.

Non-blocking items are recorded in **Known limitations**.

---

## Findings by component

### DateInput

- `aria-invalid` set to `"true"` when the parsed value is invalid or a
  consumer passes `invalid={true}`.
- `aria-label`, `aria-labelledby`, `aria-describedby`, and
  `aria-errormessage` all supported. Field context propagates through
  `resolveFieldControlProps` and takes precedence unless the consumer
  overrides via explicit props.
- Placeholder is derived from the locale's numeric date order
  (`YYYY/MM/DD`, `DD/MM/YYYY`, `MM/DD/YYYY`).
- `inputMode="numeric"` is set.
- Clear button carries `aria-label="Clear date"`.
- No blockers.

### TimeInput

- Same field-ARIA plumbing as DateInput.
- `aria-invalid` set on parse failure.
- `inputMode` is `"numeric"` for 24-hour presentation and `"text"` for
  12-hour (AM/PM requires letter entry).
- 12-hour vs 24-hour presentation is locale-derived unless the consumer
  passes `hour12` explicitly.
- Clear button carries `aria-label="Clear time"`.
- No blockers.

### DatePicker

- Input carries `aria-haspopup="dialog"`, `aria-expanded`, and
  `aria-controls` (only when open).
- Trigger has the same combobox attributes plus an
  `aria-label="Open calendar"` default.
- Popover content is announced by the Popover component; DatePickerContent
  adds `aria-label="Choose date"`.
- The nested Calendar owns keyboard navigation for its own grid — arrow
  keys, Enter/Space to select, Home/End to jump, PageUp/Down to change
  month, Alt+ArrowUp to close.
- No blockers.

### DateRangePicker

- Start input carries `aria-haspopup="dialog"`, `aria-expanded`,
  `aria-controls` (when open), and `aria-errormessage` from Field context.
- End input carries `aria-haspopup="dialog"`, `aria-expanded`,
  `aria-controls`. It does **not** carry `aria-errormessage` (only the
  start input does) — verified by test.
- Trigger has `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`,
  and an `aria-label="Open calendar"` default.
- Live region (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`)
  announces per-endpoint commits, swaps, and clears. Message text is
  localizable via the `messages` prop.
- Calendar grid uses `role="grid"`, weekday cells use
  `role="columnheader"`, week rows use `role="row"`, day buttons use
  `role="gridcell"` on `<button type="button">`.

**Blocker fixed this task**:

- **Before**: every day button had `tabIndex={-1}` and there was no
  arrow-key handler — the grid was reachable but not navigable.
- **After**: a single roving cell carries `tabIndex={0}` (initial: today
  or the first day of the anchor month). Arrow keys move focus by day
  (LTR / RTL aware), `PageUp` / `PageDown` by month (shifted by year with
  Shift), `Home` / `End` snap to the first / last day of the current
  week. The visible view advances when focus crosses a month boundary.
  Focus is imperatively moved via a ref-map on each keyboard update.
- Enter and Space still commit the focused cell (native button behavior).

### DateTimeInput

- Date sub-input receives Field ARIA (label, description, errormessage);
  time sub-input is wrapped in a `FieldContext.Provider value={null}` so
  it does not double-inherit those attributes.
- Time sub-input has an `aria-label` (default `"Time"`) so screen readers
  can distinguish the two controls.
- `data-invalid` on the wrapper reflects out-of-range composite values.
- Hidden form input carries the ISO `YYYY-MM-DDTHH:MM[:SS[.sss]]` string,
  never with a `Z` suffix.
- No blockers.

### DataTable filtering

- `id` on `DataTableRootProps` propagates to the `<table>` so external
  filter widgets can wire `aria-controls={id}` and `aria-label`.
- `filteredEmptyState` renders in place of the table body when active
  filters remove every row; wrapper emits `data-filtered-empty="true"`.
- The DataTable itself never renders a filter bar or menu — consumers
  compose Input, Select, Combobox, etc. and drive them through
  `useColumnFilter` / `useGlobalSearch`. This composability is verified
  in the DataTable MDX docs and integration tests.
- No blockers.

### DataTable virtualization

- `aria-rowcount` on `<table>` equals `pipelineRows.length + 1` — the
  true count, not the DOM slice.
- Header row carries `aria-rowindex={1}`; every rendered data row carries
  `aria-rowindex={dataIndex + 2}`.
- Top / bottom spacer `<tr aria-hidden="true">` elements preserve virtual
  scroll size without adding announced rows.
- Focused row preservation: when a `<td>` inside a `data-row-id="..."`
  row holds document focus, the render slice is extended to include that
  row even if it scrolls out of the strict viewport. When focus leaves
  the scroll container, the extension collapses.
- Non-virtualized default emits none of these attributes — behavior
  unchanged for existing consumers.
- No blockers.

---

## Cross-cutting

### RTL

- All calendar day navigation flips `ArrowLeft` and `ArrowRight` in RTL
  contexts. DatePicker's Calendar and DateRangePicker's grid honor the
  `dir` prop / context.
- Text inputs (Date, Time, DateTime) rely on browser-native RTL text
  direction. No explicit RTL logic is required because their content is
  numeric.
- DataTable does not rewrite column order for RTL — the browser flips
  `<table>` layout when `<html dir="rtl">` is set. This matches all
  other table implementations.

### Locale

- All Phase 13 components accept an explicit `locale` prop (BCP-47).
  Default is `"en-US"` where not overridden.
- Date / time parsing tolerates the locale's separators (`/`, `-`, `.`,
  `:`) and 12-hour AM/PM variants.
- Weekday labels and month headings come from
  `Intl.DateTimeFormat(locale, ...)`.
- No hard-coded English strings inside the DOM output apart from the
  clear-button `aria-label`s, which consumers can override via
  `aria-label` props. The DateRangePicker announcement text is fully
  localizable via `messages`.

### Reduced motion

- No CSS animations are enabled by KairoUI on any Phase 13 component.
  Popover open / close is instantaneous by default. Consumers who add
  their own transitions must wrap them in
  `@media (prefers-reduced-motion: reduce)` — this is a consumer
  responsibility documented in the Popover pattern.

### High contrast

- Every Phase 13 component uses semantic CSS custom properties
  (`--kui-color-*`) that already resolve to sufficient contrast in the
  built-in light / dark tokens.
- Calendar day cells expose `data-selected`, `data-in-range`,
  `data-range-start`, `data-range-end`, `data-preview-in-range`,
  `data-today`, `data-disabled`, and `data-outside-month`. Consumers
  targeting high-contrast platforms (Windows High Contrast, forced-colors
  media query) can layer additional styles keyed to these attributes.

### Screen-reader implications

- The DateRangePicker live region uses `aria-live="polite"` — JAWS, NVDA,
  and VoiceOver read the announcement after the current utterance
  finishes. `aria-atomic="true"` guarantees each announcement is read
  from scratch rather than diffed.
- The DataTable virtualization spacers are `aria-hidden="true"` so
  screen readers announce only the rendered rows within the correct
  `aria-rowindex` positions.
- The time sub-input of DateTimeInput has its own `aria-label` so screen
  readers announce "Time" instead of re-using the enclosing Field label
  twice.

---

## Keyboard matrices

### DatePicker

| Context                         | Key               | Behavior                                          |
| ------------------------------- | ----------------- | ------------------------------------------------- |
| Input                           | `ArrowDown`       | Open the popover.                                 |
| Input                           | `Alt` + `ArrowUp` | Close the popover.                                |
| Popover open, focus in Calendar | `ArrowLeft`       | Focus previous day (LTR) / next day (RTL).        |
| Popover open, focus in Calendar | `ArrowRight`      | Focus next day (LTR) / previous day (RTL).        |
| Popover open, focus in Calendar | `ArrowUp`         | Focus one week back.                              |
| Popover open, focus in Calendar | `ArrowDown`       | Focus one week forward.                           |
| Popover open, focus in Calendar | `Home`            | Focus first day of current week.                  |
| Popover open, focus in Calendar | `End`             | Focus last day of current week.                   |
| Popover open, focus in Calendar | `PageUp`          | Focus one month back.                             |
| Popover open, focus in Calendar | `PageDown`        | Focus one month forward.                          |
| Popover open, focus in Calendar | `Enter` / `Space` | Commit focused day, close popover, refocus input. |
| Popover open                    | `Escape`          | Close popover, keep current value.                |
| Trigger button                  | `Enter` / `Space` | Toggle popover.                                   |
| Clear button                    | `Enter` / `Space` | Clear the value.                                  |

### DateRangePicker

| Context                         | Key               | Behavior                                    |
| ------------------------------- | ----------------- | ------------------------------------------- |
| Start input                     | `ArrowDown`       | Open the popover, activate `start`.         |
| End input                       | `ArrowDown`       | Open the popover, activate `end`.           |
| Any input                       | `Alt` + `ArrowUp` | Close the popover.                          |
| Popover open, focus in grid     | `ArrowLeft`       | Focus previous day (LTR) / next day (RTL).  |
| Popover open, focus in grid     | `ArrowRight`      | Focus next day (LTR) / previous day (RTL).  |
| Popover open, focus in grid     | `ArrowUp`         | Focus one week back.                        |
| Popover open, focus in grid     | `ArrowDown`       | Focus one week forward.                     |
| Popover open, focus in grid     | `Home`            | Focus first day of current week.            |
| Popover open, focus in grid     | `End`             | Focus last day of current week.             |
| Popover open, focus in grid     | `PageUp`          | Focus 30 days back (365 with `Shift`).      |
| Popover open, focus in grid     | `PageDown`        | Focus 30 days forward (365 with `Shift`).   |
| Popover open, focus on day cell | `Enter` / `Space` | Commit start (or end if start already set). |
| Popover open                    | `Escape`          | Close popover, keep current value.          |
| Trigger button                  | `Enter` / `Space` | Toggle popover.                             |
| Clear button                    | `Enter` / `Space` | Clear both endpoints.                       |
| Prev-month button               | `Enter` / `Space` | Shift visible range back one month.         |
| Next-month button               | `Enter` / `Space` | Shift visible range forward one month.      |

### Virtualized DataTable

| Context                         | Key                | Behavior                                                         |
| ------------------------------- | ------------------ | ---------------------------------------------------------------- |
| Scroll container                | `ArrowUp` / `Down` | Browser-native — scrolls the container.                          |
| Scroll container                | `PageUp` / `Down`  | Browser-native — scrolls one viewport height.                    |
| Scroll container                | `Home` / `End`     | Browser-native — scrolls to top / bottom.                        |
| Any focusable row cell          | `Tab`              | Advances focus to the next focusable within the same row / body. |
| Focused row about to scroll out | —                  | Row remains mounted while it holds focus.                        |
| Focused row loses focus         | —                  | Render slice recomputes on next scroll.                          |
| Sortable header                 | `Enter` / `Space`  | Toggle sort direction.                                           |
| Selection cell                  | `Enter` / `Space`  | Toggle row selection.                                            |
| Select-all header               | `Enter` / `Space`  | Toggle all visible-pipeline rows.                                |

Explicit non-goals for the virtualized DataTable keyboard model:

- No autoscroll on focus change — consumers who need "scroll to selected"
  compute `index × rowHeight` themselves and set `scrollTop`.
- No focus-trap inside the scroll container — Tab leaves the table
  normally.
- No `role="grid"` mode — Phase 13 keeps the plain `<table>` semantics.

---

## Known limitations (documented, not blocking)

1. **DateRangePicker grid double-month focus**: the roving cell is a
   single index across both grids. On month boundaries, the "next"
   grid's month becomes the anchor and the focused date is rendered
   there. This is intentional but users who prefer per-grid roving
   should file an ADR.
2. **DataTable virtualization uses `<table>` semantics**: it does not
   switch to `role="grid"`. Users who expect grid-mode keyboard
   navigation (arrow keys moving between cells) should compose their
   own grid.
3. **DataTable virtualized rows are not measured**: consumers whose CSS
   drifts from the passed `rowHeight` will see visual overlap or gaps.
   No runtime warning; the pixel math trusts the input.
4. **Popover animations are consumer-owned**: KairoUI Popover ships with
   no CSS transitions. If a consumer adds them, they must guard on
   `prefers-reduced-motion: reduce`.
5. **DateInput / TimeInput do not use `<input type="date">` /
   `type="time"`**: this is a documented design choice. Native pickers
   vary by browser, cannot honor an explicit `locale`, and often clash
   with popover-mounted calendars. The type-`"text"` input with locale
   parsing gives predictable cross-browser behavior at the cost of the
   native calendar affordance on mobile.

---

## Test coverage added this task

- `packages/core/src/components/date-range-picker/date-range-picker-a11y.test.tsx`
  — 12 tests covering roving tabindex, arrow / PageUp / PageDown / Home /
  End behavior, view advancement, RTL arrow-key flipping, and
  outside-month cells never becoming roving targets.
- Existing 41 DateRangePicker tests unchanged and still passing.
- DataTable virtualization tests (KUI-ADV-015) already cover
  `aria-rowcount`, `aria-rowindex`, spacer hiding, and focused-row
  survival.
