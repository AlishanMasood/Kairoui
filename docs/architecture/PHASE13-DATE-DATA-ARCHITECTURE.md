# Phase 13 — Date/Time Inputs & Advanced Data Interaction

Status: **Architecture defined**. Implementation follows in KUI-ADV-002 → KUI-ADV-018.

## Scope

Phase 13 adds two orthogonal capability sets:

**Date/time inputs** — accessible, form-integrated, typeable text inputs for date, time, date/time, single dates, and date ranges. All are consumer-driven — Calendar is dogfooded for popover surface where a picker is used.

**Advanced data interaction** — a schema-first filter model that composes with the existing sort/selection helpers, a globally routed search hook, and a virtualization foundation that turns any ordered collection into a windowed renderer.

### Explicitly out of scope

Phase 13 does **not** deliver:

- Enterprise DataGrid, Scheduler, Kanban, Pivot, Grouping, Analytics dashboards
- Recurrence editors, business-day math, working-hours ranges
- Any date library (see [Dependency policy](#dependency-policy))
- Query DSL / SQL-style expression parsers
- Server-side pagination protocol
- Virtualized tree collections beyond a simple row-model adapter
- Editable / cell-edit modes for DataTable

Those surfaces are deferred to Phase 14+.

---

## Component Inventory

| Component         | Category | Uses                                                   | New? |
| ----------------- | -------- | ------------------------------------------------------ | ---- |
| `DateInput`       | Form     | typeable date entry with masked segments               | new  |
| `TimeInput`       | Form     | typeable time entry (hh:mm[:ss][ AM/PM])               | new  |
| `DateTimeInput`   | Form     | composed date + time in a single field                 | new  |
| `DatePicker`      | Form     | `DateInput` + Popover-mounted `Calendar`               | new  |
| `DateRangePicker` | Form     | `DateInput` × 2 + Popover with dual-Calendar or single | new  |
| `Calendar`        | Data     | extended: range mode, second-month view (opt-in)       | ext. |
| `DataTable`       | Data     | integrates filter model + virtualization opt-in        | ext. |

### New helpers (not React components)

- `filter-model.ts` — declarative filter shape + normalization utilities
- `use-filter-state.ts` — controlled/uncontrolled filter hook (mirrors `use-sort-state`)
- `use-global-search.ts` — debounced text search state
- `virtualizer.ts` + `use-virtualizer.ts` — row-window computation (no measurement DOM in v1)

---

## Dependency Policy

**No third-party date library** in v1. All parsing/formatting uses the platform `Intl.DateTimeFormat` and hand-rolled ISO/`YYYY-MM-DD`/`HH:MM[:SS]` parsers. Rationale:

- Keeps bundle budgets. `date-fns` (~30 KB tree-shaken min) doubles the `@kairoui/core` primitives entry.
- Locale/formatting behavior comes from the browser, not a shipped ICU snapshot.
- The Calendar model (`packages/core/src/components/calendar/calendar-model.ts`) already contains the day-math we need (`addMonths`, `isSameDay`, week-generation).
- If a consumer needs advanced parsing (localized natural-language input, business days) they pass a custom `parse` / `format` prop.

**A future opt-in adapter package** (e.g. `@kairoui/dates-luxon`) is left as a Phase 14 possibility and is not planned here.

---

## Date/Time Types

Values are always `Date` objects at the API boundary — never strings, never plain numbers, never library-specific types. Rationale: matches Phase 12 Calendar, matches native `<input type="date">` value coercion in React, avoids version-locking a serialization format.

For range values:

```ts
export interface DateRange {
  readonly start: Date | null;
  readonly end: Date | null;
}
```

`null` means "not yet chosen" — required for the two-step selection UX of DateRangePicker.

For `TimeInput`:

```ts
export interface TimeOfDay {
  readonly hour: number; // 0–23
  readonly minute: number; // 0–59
  readonly second?: number; // 0–59, only when `includeSeconds`
}
```

We intentionally avoid `Date` for time-only values — a "time" without an anchoring day has no meaningful UTC representation. `DateTimeInput` composes a `Date` from a base date + `TimeOfDay`.

### Timezone Policy

- All inputs interpret and emit values in the **local timezone of the browser**.
- Inputs display exactly what the user typed. No hidden UTC conversion.
- Form serialization writes ISO strings (`toISOString`) — consumers who need a different wire format can override via `format` prop.
- **Cross-timezone editing is not supported**. Consumers building a Scheduler/tenant-timezone product must project into local time before rendering.

---

## Controlled / Uncontrolled State

Every date/time input mirrors existing form components (Phase 8):

```ts
interface DateInputBaseProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  form?: string;
  locale?: string;
  dir?: "ltr" | "rtl";
}
```

- Controlled when `value !== undefined` (including `null`); uncontrolled when only `defaultValue` is provided. Backed by `useControllableState` from `@kairoui/hooks`.
- `null` means "cleared / empty"; `undefined` is reserved for the discriminator between controlled/uncontrolled.
- `min` / `max` are inclusive.

---

## Parsing & Formatting

Each input owns two orthogonal responsibilities:

- **Display formatting** — what the user _sees_. Delegates to `Intl.DateTimeFormat` with the `locale` prop and per-segment token lookup.
- **Parsing** — what the user _typed_. Fixed grammars per input:
  - `DateInput`: locale-derived pattern (default en-US = MM/DD/YYYY) with strict validation, no natural-language.
  - `TimeInput`: `hh:mm` or `hh:mm:ss`, 12h/24h switched by `hour12` prop or locale.
  - `DateTimeInput`: date pattern + space + time pattern.

Both are pluggable:

```ts
interface DateInputOverrideProps {
  parse?: (input: string, ctx: ParseContext) => Date | null | ParseError;
  format?: (value: Date, ctx: FormatContext) => string;
}
```

`ParseError` is a branded object carrying an actionable message; the input surfaces it via `aria-errormessage` and `data-invalid`.

### Segment editing

`DateInput` and `TimeInput` support two modes:

- **Free typing** (default) — plain `<input type="text">` with parsing on blur.
- **Masked segments** — separate spin-selectable segments (year, month, day) for keyboard-heavy users. Toggled via `segments` prop. Uses the roving-focus utilities from Phase 8 (`packages/core/src/composition/roving-focus.ts`).

Both modes share the same value shape.

---

## Locale Behavior

- `locale` prop threads through `Intl.DateTimeFormat` and week-start / weekday-labels.
- Defaults to `undefined`, which means "browser default" — matches `Calendar`.
- Locale changes must be re-hydration-safe: no locale-dependent output during SSR. Server renders a stable placeholder shape (`__ / __ / ____`) and hydrates the localized display client-side. See [SSR / Hydration](#ssr--hydration).

---

## Form Serialization

- Native form participation via a hidden `<input>` with the input's `name`.
- Hidden input value: ISO-8601 string in the local timezone (`toISOString` unless overridden).
- Range values submit two fields: `${name}.start` and `${name}.end`.
- `null` values submit an empty string — matches HTML form semantics.
- When `form` prop is set, the hidden input uses that `form` attribute to submit outside its parent.

---

## Accessibility

- All inputs implement WAI-ARIA `combobox` (when paired with popover) or plain `textbox` (bare).
- `DateInput` sets `role="textbox"` + `aria-describedby` for format hints (`"MM/DD/YYYY"`).
- `DatePicker` combobox: trigger has `aria-haspopup="dialog"`, `aria-expanded`, controlled `aria-controls`.
- Segments (when enabled) each get `role="spinbutton"` with `aria-valuemin` / `aria-valuemax` / `aria-valuetext`.
- `DateRangePicker` uses two `combobox` triggers with a shared popover surface; focus returns to the trigger that opened it.
- Invalid input announces via `aria-errormessage` linked to a `FieldError` when placed inside a `Field`.

---

## Overlay Integration

`DatePicker` and `DateRangePicker` compose:

- Existing `Popover` from Phase 10 for positioning, dismissal, and focus scope.
- Existing `Calendar` from Phase 12 for grid rendering.
- Existing `useDismissableLayer` for outside-click / escape handling.

No new overlay primitives. If a picker needs `role="dialog"` semantics for range selection (WCAG combobox pattern), it reuses the `Dialog` primitives set to a compact popover-style content.

---

## Keyboard Behavior

| Key                        | `DateInput` free    | `DateInput` segments    | `DatePicker` trigger | `DatePicker` open          |
| -------------------------- | ------------------- | ----------------------- | -------------------- | -------------------------- |
| `ArrowUp` / `ArrowDown`    | (native input)      | inc/dec current segment | —                    | move focus in Calendar     |
| `ArrowLeft` / `ArrowRight` | native              | prev/next segment       | —                    | prev/next day              |
| `PageUp` / `PageDown`      | —                   | change month            | —                    | prev/next month            |
| `Shift+PageUp/Down`        | —                   | change year             | —                    | prev/next year             |
| `Home` / `End`             | native              | first/last segment      | —                    | week start/end             |
| `Enter`                    | commit + move focus | commit + close          | open picker          | select focused day + close |
| `Escape`                   | revert              | revert                  | —                    | close, restore prior value |
| `Space`                    | native              | —                       | open picker          | select focused day         |

`TimeInput` inherits the same segment behavior with hour/minute/(sec)/(AM/PM) segments.

---

## SSR / Hydration

- No `Intl.DateTimeFormat` call inside render at first paint on the server — locale output is deferred to `useLayoutEffect` on the client. Server renders the raw ISO segments; client hydrates locale-formatted output on mount.
- No `Date.now()` in initial render.
- `crypto.randomUUID` calls flow through existing `useId` / `useStableId` from `@kairoui/hooks` — same guarantees as Phase 8.

Hydration fixtures cover:

- `DateInput` free mode with a provided `defaultValue`
- `DateInput` segment mode
- `DatePicker` with initial closed state
- `DateRangePicker` with a two-date default

---

## Bundle Constraints

Preliminary budgets. Final numbers set in KUI-ADV-017 after implementation lands.

| Package / file                           | Current baseline | Phase 13 budget delta |
| ---------------------------------------- | ---------------: | --------------------: |
| `@kairoui/core dist/index.js`            |            14 KB | +0 KB (no re-exports) |
| `@kairoui/core dist/components/index.js` |           288 KB |              ≤ +32 KB |
| `@kairoui/hooks dist/index.js`           |             7 KB |               ≤ +2 KB |
| Combined all `@kairoui/core` raw         |           432 KB |              ≤ 500 KB |
| Combined all `@kairoui/core` gzip        |            68 KB |               ≤ 78 KB |

Each new component's file lives under `packages/core/src/components/<name>/` with tree-shakable per-component barrel.

**No date library allowed** — if a task tries to add one, the budget test breaks first.

---

## Filter Model

Declarative filter description consumed by `use-filter-state` and by `DataTable`.

```ts
export type FilterOp =
  | "equals"
  | "notEquals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "between"
  | "in"
  | "isEmpty"
  | "isNotEmpty";

export interface ColumnFilter {
  readonly columnId: string;
  readonly op: FilterOp;
  readonly value: unknown;
}

export type FilterCombinator = "and" | "or";

export interface FilterState {
  readonly combinator: FilterCombinator;
  readonly filters: readonly ColumnFilter[];
}
```

- Filter application is **consumer-implemented** — the model provides shape, comparison helpers, and normalization; the consumer decides how their data is filtered.
- A built-in `applyFilters(rows, state, columns)` helper handles common cases (equality, contains, numeric comparison). Consumers can bypass it and evaluate `state` themselves for server-side filtering.
- Filters do not depend on sort/selection — they can be layered independently.

### Column filtering

`DataTableColumnDef<TRow>` gains an optional `filterable?: boolean` and `filterKind?: "text" | "number" | "date" | "select" | "custom"` hint for future column-filter UI. **No filter UI is delivered in Phase 13** — this task only introduces the state model and hook, plus a `filterState` prop pass-through on `DataTable`.

### Global search

`use-global-search`:

- Debounced (`delayMs` default 250)
- Returns `{ input, setInput, debounced }` and a `matchers` factory that composes with `applyFilters`
- Never touches the DOM — a plain hook

---

## Virtualization Foundation

`virtualizer.ts` — pure math, no React:

```ts
export interface VirtualizerConfig {
  count: number;
  rowHeight: number | ((index: number) => number);
  overscan?: number;
  viewportHeight: number;
  scrollTop: number;
}

export interface VirtualizedRange {
  startIndex: number;
  endIndex: number;
  paddingTop: number;
  paddingBottom: number;
}

export function computeVirtualizedRange(config: VirtualizerConfig): VirtualizedRange;
```

`use-virtualizer.ts` — React hook that:

1. Reads `scrollTop` from a passed `scrollParentRef`
2. Subscribes to scroll events with `passive: true`
3. Uses `requestAnimationFrame` for range recomputation
4. Returns `{ startIndex, endIndex, paddingTop, paddingBottom, totalHeight }`

Fixed-row-height only in v1. Variable-height (measurement-based) is deferred to Phase 14.

`DataTable` opts in via a `virtualized?: boolean` prop with sensible defaults (rowHeight taken from an existing `data-row-height` CSS custom property that consumers style). When enabled, the tbody applies `padding-top` / `padding-bottom` spacers and renders only the windowed rows.

**Non-virtualized remains the default** — no behavior change for existing consumers.

---

## SSR / Hydration (data interaction)

- Filter and search hooks are pure state — no SSR issue.
- Virtualization: server renders **all rows** (falls back gracefully), client mounts and switches to windowed rendering. This preserves SEO/print/no-JS UX and avoids a hydration mismatch on the visible rows.

---

## Advanced DataTable Integration Boundaries

Phase 13 extensions to `DataTable`:

- `filterState?` / `defaultFilterState?` / `onFilterStateChange?` — passthrough to the filter model
- `globalSearch?: string` — passthrough to a rendered `<input>` slot (or hidden if consumer renders their own)
- `virtualized?: boolean` + `rowHeight?: number`
- Extended `DataTableColumnDef<TRow>` with `filterable` and `filterKind` metadata (unused in Phase 13 UI, reserved for Phase 14)

**No other DataTable features change.** Sorting, selection, and column layout are unchanged. Existing prop signatures remain source-compatible.

---

## Documentation

Every new component is dogfooded through `@kairoui/docs`:

- Generated `PropsTable` via automated Phase 12.5 infrastructure
- Manually authored: usage narrative, controlled/uncontrolled recipes, form integration example, accessibility summary
- Storybook stories for each state (default, min/max, disabled, invalid, segment mode)
- Documentation pages exist at:
  - `apps/docs/docs/components/core/date-input.mdx`
  - `apps/docs/docs/components/core/time-input.mdx`
  - `apps/docs/docs/components/core/date-time-input.mdx`
  - `apps/docs/docs/components/core/date-picker.mdx`
  - `apps/docs/docs/components/core/date-range-picker.mdx`
  - `apps/docs/docs/patterns/filtering.mdx`
  - `apps/docs/docs/patterns/virtualization.mdx`

---

## Task Sequence (KUI-ADV-002 → KUI-ADV-018)

Loosely grouped for context; each task is committed independently.

Date/time foundations:

- `KUI-ADV-002` — Date/time utility layer (`packages/core/src/utilities/date-utils.ts`)
- `KUI-ADV-003` — `DateInput`
- `KUI-ADV-004` — `TimeInput`
- `KUI-ADV-005` — `DateTimeInput`
- `KUI-ADV-006` — `DatePicker`
- `KUI-ADV-007` — Calendar range mode
- `KUI-ADV-008` — `DateRangePicker`
- `KUI-ADV-009` — Docs migration (date pages)

Data interaction:

- `KUI-ADV-010` — Filter model + `use-filter-state`
- `KUI-ADV-011` — `use-global-search`
- `KUI-ADV-012` — Column filter metadata on `DataTableColumnDef`
- `KUI-ADV-013` — `virtualizer.ts` pure math
- `KUI-ADV-014` — `use-virtualizer` React hook
- `KUI-ADV-015` — `DataTable` virtualization integration
- `KUI-ADV-016` — Docs migration (filter, virtualization pages)

Phase closeout:

- `KUI-ADV-017` — Bundle audit + budget adjustments
- `KUI-ADV-018` — Final Phase 13 validation and tag `v0.13.0-alpha.0`

---

## Do Not

- Add a date library
- Build a Scheduler / Kanban / DataGrid surface
- Implement filter UI widgets (deferred to Phase 14)
- Implement variable-height virtualization
- Redesign Calendar or DataTable signatures
- Support server-side pagination protocol changes
- Introduce global state singletons
- Break SSR/hydration expectations
