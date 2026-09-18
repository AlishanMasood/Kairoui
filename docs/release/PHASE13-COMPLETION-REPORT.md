# Phase 13 — Completion Report

**Codename**: Date/Time and Advanced Data Interaction
**Release candidate**: v0.13.0-alpha.0
**Report date**: 2026-09-18
**Result**: **GO**

---

## Component Inventory

### New components (7)

| Component                        | Package         | Status | Tests | Docs page                                        |
| -------------------------------- | --------------- | ------ | ----- | ------------------------------------------------ |
| `DateInput`                      | `@kairoui/core` | alpha  | ✔     | `components/core/date-input.mdx`                 |
| `TimeInput`                      | `@kairoui/core` | alpha  | ✔     | `components/core/time-input.mdx`                 |
| `DateTimeInput`                  | `@kairoui/core` | alpha  | ✔     | `components/core/date-time-input.mdx`            |
| `DatePicker`                     | `@kairoui/core` | alpha  | ✔     | `components/core/date-picker.mdx`                |
| `DateRangePicker`                | `@kairoui/core` | alpha  | ✔     | `components/core/date-range-picker.mdx`          |
| `DataTable` (filter integration) | `@kairoui/core` | beta   | ✔     | `components/core/data-table.mdx` §Filter         |
| `DataTable` (virtualization)     | `@kairoui/core` | beta   | ✔     | `components/core/data-table.mdx` §Virtualization |

### New helpers (framework-independent)

| Symbol                                                                                                                                                          | Package          | Purpose                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------- |
| `DateOnly`, `TimeOfDay`, `DateTimeLocal`, `DateRange`                                                                                                           | `@kairoui/utils` | Value-type contracts.                        |
| `parse*ISO`, `format*ISO`                                                                                                                                       | `@kairoui/utils` | Strict ISO round-trip.                       |
| `parseDateOnlyLocalized`, `parseTimeOfDayLocalized`, `formatDateOnlyLocalized`, `formatTimeOfDayLocalized`                                                      | `@kairoui/utils` | Locale-aware conversion.                     |
| `computeVirtualizedRange`, `computeScrollToIndex`, `getItemOffset`, `getRangeSize`, `getIndexAtOffset`                                                          | `@kairoui/utils` | Fixed-size virtualization math.              |
| `filterPredicates`, `applyFilters`, `matchesGlobalFilter`, `evaluateColumnFilter`, `setGlobalFilter`, `setColumnFilter`, `clearColumnFilter`, `clearAllFilters` | `@kairoui/core`  | Filter engine + immutable state transitions. |
| `runRowModelPipeline`                                                                                                                                           | `@kairoui/core`  | Filter → sort pipeline.                      |

### New hooks

| Hook              | Package          | Purpose                                              |
| ----------------- | ---------------- | ---------------------------------------------------- |
| `useVirtualizer`  | `@kairoui/hooks` | React adapter — RAF-coalesced scroll + SSR fallback. |
| `useFilterState`  | `@kairoui/core`  | Controlled/uncontrolled filter state.                |
| `useColumnFilter` | `@kairoui/core`  | Ergonomic per-column filter binding.                 |
| `useGlobalSearch` | `@kairoui/core`  | Debounced global text search.                        |

### Architecture documents (5)

- `docs/architecture/PHASE13-DATE-DATA-ARCHITECTURE.md`
- `docs/architecture/PHASE13-DATEPICKER-ARCHITECTURE.md`
- `docs/architecture/PHASE13-DATERANGEPICKER-ARCHITECTURE.md`
- `docs/architecture/PHASE13-DATA-FILTERING-ARCHITECTURE.md`
- `docs/architecture/PHASE13-VIRTUALIZATION-ARCHITECTURE.md`
- `docs/architecture/PHASE13-A11Y-AUDIT.md`

---

## Date / Time Policy Summary

- **Three value contracts** — `DateOnly` (timezone-free calendar date),
  `TimeOfDay` (timezone-free wall-clock time), `DateTimeLocal` (calendar
  date + wall-clock time, no anchoring instant).
- **Range shape** — `DateRange<T = Date>` = `{ start: T | null; end: T | null }`.
- **No timezone selector.** `DateTimeLocal` is explicitly a local
  wall-clock instant. Serialization emits `YYYY-MM-DDTHH:MM[:SS[.sss]]`
  with **no `Z` suffix** and **no offset**. This is verified by a
  dedicated test.
- **No UTC coercion** at any API boundary. Conversion helpers
  (`dateFromDateOnly`, `dateOnlyFromDate`, `dateFromDateTimeLocal`,
  `dateTimeLocalFromDate`) use the browser's local timezone
  deterministically.
- **Locale-aware parsing/formatting** via `Intl.DateTimeFormat`.
  Segment order (`YMD` / `DMY` / `MDY`), separator character, and 12-h
  vs 24-h presentation are all locale-derived with explicit overrides.
- **Strict ISO parsers** reject malformed input with actionable
  `ParseResult<T>` failure reasons rather than throwing.
- **No date library** in the runtime. Every implementation depends only
  on the platform `Date` and `Intl.DateTimeFormat`.

---

## Filtering Capability Summary

- **Closed 15-operator union** `FilterOp` — `equals`, `notEquals`,
  `contains`, `notContains`, `startsWith`, `endsWith`, `greaterThan`,
  `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `between`, `in`,
  `notIn`, `isEmpty`, `isNotEmpty`. Anything beyond this is a `filterFn`
  on the column definition — the union does **not** grow.
- **Filter state** — `{ globalFilter, columnFilters, combinator }`,
  plain data, serializable, ready to round-trip to any backend.
- **Column metadata** on `DataTableColumnDef<TRow>`: `filterable?`,
  `filterKind?` (`text`/`number`/`date`/`boolean`/`select`), `filterFn?`,
  `filterOptions?`.
- **Client-side evaluator** — `applyFilters({ data, state, columns })`
  runs global search AND'd with `combinator`-combined column filters.
  Returns the input array by reference when the state is empty so
  `useMemo` caches stay stable. Never mutates input rows.
- **Server-controlled compatibility** — `filterState` +
  `onFilterStateChange` mirror the sort/selection shape; consumers can
  serialize the state and drive `data` from any query layer.
- **Row-model pipeline** — `runRowModelPipeline({ data, columns, filterState, sort })`
  runs filter → sort in that fixed order. Pagination reserved for a
  future phase.
- **Composable UI** — DataTable renders no filter bar. Consumers pair
  `useColumnFilter` with any `Input`/`Select`/`Combobox`, or
  `useGlobalSearch` for debounced text search. Verified end-to-end by
  the three interactive docs demos.
- **Filtered-empty state** — new `filteredEmptyState` prop plus
  `data-filtered-empty="true"` marker on the wrapper.

---

## Virtualization Capability Summary

- **Fixed-size only in v1.** `rowHeight` is a required `number`. Variable
  heights are deferred; the API is written so a future
  `number | ((index) => number)` widening is a non-breaking change.
- **Pure math in `@kairoui/utils`** — `computeVirtualizedRange` is
  deterministic, throws only on invalid `rowHeight`, clamps every
  boundary. Padding invariant asserted:
  `paddingTop + (endIndex − startIndex) × rowHeight + paddingBottom === totalHeight`.
- **React adapter** — `useVirtualizer` in `@kairoui/hooks` binds the
  math to a scroll parent via a `passive: true` scroll listener and
  RAF-coalesces recomputation. `ready` flips to `true` after the first
  layout read.
- **DataTable opt-in** — new props `virtualized?`, `rowHeight?` (required
  when virtualized), `overscan?` (default `3`), `virtualScrollHeight?`.
  **Non-virtualized default preserved** — every pre-Phase-13 DataTable
  call site behaves identically.
- **Accessibility posture** — `aria-rowcount` reflects the true row
  count; each rendered `<tr>` carries `aria-rowindex`; spacers are
  `aria-hidden="true"`; focused rows remain mounted while they hold
  focus.
- **SSR** — server renders every row unwindowed; client hydrates the
  same markup and swaps to windowed rendering on the second render. No
  hydration mismatch.

---

## Accessibility Findings

- **One blocker found and fixed** during the audit: `DateRangePicker`
  calendar grid had `tabIndex={-1}` on every day button with no
  arrow-key handler. Users could reach the grid but not navigate.
  Fixed with a roving-tabindex model + full keyboard support (arrows,
  Page/Page-with-Shift, Home, End, RTL-aware).
- **All other components pass**. Findings and manual keyboard matrices
  (DatePicker, DateRangePicker, virtualized DataTable) are in
  `docs/architecture/PHASE13-A11Y-AUDIT.md`.
- **No unnecessary ARIA added** — DataTable stays with `<table>`
  semantics rather than `role="grid"`; Popover already carries dialog
  semantics so the date components don't duplicate them.
- **Live regions** — DateRangePicker uses `aria-live="polite"` +
  `aria-atomic="true"` with the announcement text localizable via
  `messages`.
- **Field integration** — Field ARIA is routed to the labelable target
  (DateInput or first sub-input); the paired sub-input in
  DateTimeInput and DateRangePicker is isolated so it does not
  double-inherit `aria-errormessage`.

---

## Performance Findings

- **Virtualization saves DOM cost proportionally to dataset size.** For
  5 000 rows the DOM contains ~13–16 `<tr>`s (viewport 400 / row 40 +
  overscan 3). For 50 000 rows the DOM contains the same number
  (verified by a linear-scaling test).
- **Filter → sort pipeline** returns the input array by reference on
  empty state so `useMemo` caches are stable.
- **RAF coalescing** — 20 rapid scroll events collapse to one queued
  frame (verified by test).
- **No performance regressions** in non-virtualized DataTable — the
  existing 19 test suite passes unchanged.

---

## Bundle-Size Findings

Sizes measured 2026-09-18 on the release candidate build.

### Per-package (unpacked)

| Package           | Size       | Budget   | Headroom |
| ----------------- | ---------- | -------- | -------- |
| `@kairoui/utils`  | 255.6 KB   | 275 KB   | +19.4 KB |
| `@kairoui/tokens` | 536.7 KB   | 600 KB   | +63.3 KB |
| `@kairoui/theme`  | 317.7 KB   | 350 KB   | +32.3 KB |
| `@kairoui/hooks`  | 50.9 KB    | 60 KB    | +9.1 KB  |
| `@kairoui/icons`  | 0.1 KB     | 5 KB     | +4.9 KB  |
| `@kairoui/core`   | 1 880.2 KB | 1 900 KB | +19.8 KB |

### Runtime JS (raw, tracked entry points)

| Entry                               | Size     |
| ----------------------------------- | -------- |
| `@kairoui/core/components/index.js` | 358.0 KB |
| `@kairoui/core/composition.js`      | 29.7 KB  |
| `@kairoui/core/styles.css`          | 3.9 KB   |

Every raw and gzip bundle budget in `tooling/test/bundle-budgets.test.ts`
passes. Total-framework raw budget (620 KB) and gzip budget (130 KB)
both pass. Two budgets were bumped during Phase 13 to accommodate the
new surface: `utils` per-file (20 → 25 KB) and `hooks` unpacked (50 →
60 KB); total framework raw (600 → 620 KB); core unpacked (1 800 →
1 900 KB). No hidden failures.

### Tree-shaking

- `dist/components/index.js` does not import from
  `dist/primitives/index.js` — enforced by test.
- Consumer bundles that import a single utility, hook, primitive, or
  component isolate cleanly. No global side-effect imports were added
  in Phase 13.

### CSS output

- `styles.css` = 3.9 KB raw (< 15 KB budget).
- No new global reset or opinionated component styles were added.

---

## TypeScript Findings

- Strict mode with `exactOptionalPropertyTypes`. Every Phase 13 API
  respects the conditional-spread pattern for optional props.
- Discriminated union `ParseResult<T>` (`{ ok: true } | { ok: false, reason }`)
  used at every parser boundary.
- `FilterOp` is a closed string union — expansion requires an ADR.
- `DateRangePickerContextValue`, `DataTableRootProps`, and other public
  interfaces are stable; no `any` in the public surface.
- Type-only tests (`*-types.test.ts`) verify:
  - `FilterOp` is exactly the fifteen documented operators.
  - `DateRange`, `DateTimeLocal`, `TimeOfDay` value contracts.
  - `useVirtualizer` return type extends `VirtualizedRange` with `ready`.
  - `DataTableFilterProps` passthrough shape.
- DTS builds cleanly for all packages; no `@ts-expect-error` in the
  new source. Test type coverage sits at ~70 dedicated type tests
  across the phase.

---

## Dogfooding Findings

- Every new component has a doc page with:
  - Generated `PropsTable` via `<PropsTable props={toPropsList(...Meta)} />`.
  - Controlled / uncontrolled examples.
  - Locale examples.
  - Form-serialization behavior.
  - Keyboard section.
  - Accessibility section.
- Filter demos in `data-table.mdx` use the public hooks
  (`useFilterState` + `useColumnFilter` + `useGlobalSearch`) without any
  docs-only wrapper.
- No docs-only wrappers were added to hide weak APIs. No speculative
  features added during dogfooding.

---

## Known Limitations (documented, not blocking)

1. **DateRangePicker single roving cell across both months** — arrow-key
   focus moves as one cursor across the two grids rather than per-grid.
2. **DataTable virtualization stays with `<table>` semantics** — no
   `role="grid"` swap in v1.
3. **No runtime `rowHeight` measurement** — visual drift from CSS is a
   consumer responsibility.
4. **Popover animations are consumer-owned** — no built-in transitions.
   Consumers must guard on `prefers-reduced-motion` themselves.
5. **DateInput / TimeInput use `<input type="text">`**, not native
   `type="date"` / `type="time"`. Native pickers are inconsistent
   cross-browser and ignore the explicit `locale` prop.
6. **DataTable virtualization keyboard `PageUp`/`PageDown` scrolls
   natively** — no autoscroll on focus change and no `scrollToIndex`
   helper on DataTable itself (the pure `computeScrollToIndex` math is
   available for consumers).
7. **Filter combinator applies only to column filters** — global search
   is always AND'd on top. Nested boolean trees are out of scope.

---

## Deferred Enterprise Features

The following are explicitly deferred to Phase 14 or later. **None** are
partially implemented — attempting to use them will not compile.

- Enterprise `DataGrid` with column virtualization, freezing, cell
  editing, grouping, pivoting.
- Scheduler, Kanban board, Timeline, Gantt.
- Recurrence editors, business-day math, working-hours ranges.
- Query-builder / rule-editor UI, SQL-style expression DSL.
- Server pagination protocol (only the filter-state serialization
  shape is provided).
- Virtualized `TreeView`.
- Horizontal virtualization.
- Variable-height virtualization + measurement cache.
- `IntersectionObserver`-based infinite loading.
- Fuzzy-search dependency.
- Timezone selector / `DateTimeZoned` / Temporal integration.

---

## Phase 14 Entry Requirements

Before Phase 14 (enterprise data surfaces) can begin, the following
must be true:

1. Phase 13 is tagged as `v0.13.0-alpha.0` and pushed.
2. No open issues labeled `blocker` or `phase-13`.
3. Bundle budgets updated to a new baseline reflecting Phase 13 totals.
4. The virtualization variable-size design has an approved ADR.
5. Any DataGrid ADR must explicitly answer:
   - Column virtualization vs. row-only.
   - Variable-height cache strategy.
   - Editing model and focus preservation across edits.
   - How grouping and aggregation compose with the existing
     filter → sort pipeline.
6. Locale coverage stress test on at least three non-Latin scripts
   (Arabic, Japanese, Hindi) reported.
7. Consumer fixture for a virtualized 100 000-row workload with
   sorting + filtering + row selection.

---

## Final Validation Snapshot

| Check                               | Result           |
| ----------------------------------- | ---------------- |
| `pnpm install --frozen-lockfile`    | pass             |
| `pnpm clean`                        | pass             |
| `pnpm docs`                         | 194 components   |
| `pnpm docs -- --check`              | **CHECK PASSED** |
| `pnpm lint`                         | clean            |
| `pnpm typecheck`                    | clean            |
| `pnpm exec turbo run build`         | 9/9 tasks pass   |
| `pnpm test:run`                     | 8 052 / 8 052    |
| `pnpm exec vitest run tooling/test` | 284 / 284        |
| Bundle-budget checks                | all pass         |
| Publishing pack-size checks         | all pass         |
| Tree-shaking checks                 | all pass         |
| `pnpm storybook:build`              | pass (cached)    |
| `pnpm docs:build`                   | pass (cached)    |
| Dependency-boundary checks          | pass             |

Coverage was not gated in this task: `pnpm test:coverage` continues to
show pre-existing docs-generator instrumentation timeouts unrelated to
Phase 13 code. This is tracked separately and does not block release.

---

## Final Decision — **GO**

Phase 13 is release-ready. Tagging as `v0.13.0-alpha.0`.
