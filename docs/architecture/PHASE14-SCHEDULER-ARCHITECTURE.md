# Phase 14 — Scheduler Architecture (KUI-ENT-009)

Status: **Architecture defined**. Implementation follows in KUI-ENT-010
(state and layout math) and KUI-ENT-011 (views and interaction /
completion audit).

Depends on: `docs/architecture/PHASE14-ENTERPRISE-ARCHITECTURE.md`
(KUI-ENT-001) — package boundary, dependency direction, licensing
shape.

---

## Purpose

The Scheduler is the third Pro surface. It renders **events over
time** across one or more resources with support for day, week, and
resource-timeline views, direct-manipulation drag and resize, and a
strict, locale-aware time model built on the Phase 13 date/time
foundation. It ships in `@kairoui-pro/scheduler`, reuses every
reusable piece of `@kairoui/core` and `@kairoui/utils/date`, and adds
the layout / interaction model that neither `Calendar` nor `Timeline`
provides.

This document fixes the Scheduler's contracts before implementation
begins so KUI-ENT-010 and KUI-ENT-011 have zero degrees of freedom on
the public API, on the time model, on drag/resize semantics, and on
the boundary between the free tier and the Scheduler.

Nothing here writes runtime code. This is a contract-only ADR.

---

## Scope

### In scope for KUI-ENT-009 through KUI-ENT-011

- Data model: resources, events, all-day flag, per-event metadata.
- Views: `day`, `week`, `timeline` (resource-lane variant).
- Event layout: overlap resolution via column packing.
- Selection: single event, drag-to-create range, keyboard focus on
  events and grid cells.
- Direct manipulation: drag-to-reschedule, edge-resize, snap grid.
- Bounded interaction: per-event opt-outs, per-view constraints,
  `dragBoundary`, `snapDuration`, `minDuration` / `maxDuration`.
- Locale: BCP 47 tag, `weekStartsOn`, `hour12`, `dir` (LTR/RTL).
- Timezone policy: local-wall-clock only, no silent conversion.
- Keyboard model: arrow navigation, Home/End, PageUp/PageDown,
  Enter/Space activation, Escape to cancel.
- Accessibility: WAI-ARIA application + grid pattern.
- Consumer callbacks: click, create-range, move, resize.

### Explicitly out of scope for Phase 14

- **Recurring-event engine.** No RRULE parser, no expansion, no series
  editing. Consumers pass individual occurrences.
- **Business availability rules.** No working-hours calendars,
  holidays, time-off, or blackout ranges.
- **Server fetch.** No HTTP client, no data cache, no offline queue.
- **Silent timezone conversion.** No IANA zone database, no automatic
  UTC coercion, no display-only zone offsetting.
- **Conflict / overlap prevention.** Overlaps are rendered; they are
  not blocked.
- **Gantt-style dependencies** between events.
- **Month view** and **agenda list view.** Deferred to a follow-up
  task.
- **Multi-select** of events. Single-select only.
- **Undo / redo.** Consumer concern.
- **Print stylesheet.** Consumer concern.
- **Right-to-left calendar week ordering.** Days flow visually
  right-to-left in RTL but the week model still starts at the
  consumer-configured day.

### Deferred to a later Pro task (not KUI-ENT-009…011)

- Variable resource-row heights.
- Cross-view drag (drag from day into week, etc.).
- Server-side event windowing.
- Column-axis virtualization for very-wide timelines.
- Print / export snapshot beyond the DataGrid-style row iterator.

---

## Positioning Relative to Free-Tier Components

The rule from KUI-ENT-001 stands: **no capability withdrawal**.
`Calendar`, `DatePicker`, `DateRangePicker`, and free-tier `Timeline`
do not lose functionality when Scheduler ships.

| Capability                    | Free tier         | `Scheduler`                  |
| ----------------------------- | ----------------- | ---------------------------- |
| Single-date choice            | `DatePicker`      | —                            |
| Date range choice             | `DateRangePicker` | —                            |
| Static timeline of events     | `Timeline`        | —                            |
| Time-of-day grid over one day | —                 | ✔ day view                   |
| Multi-day time grid           | —                 | ✔ week view                  |
| Resource-lane timeline        | —                 | ✔ timeline view              |
| Drag-to-create event          | —                 | ✔                            |
| Drag-to-reschedule            | —                 | ✔                            |
| Edge resize                   | —                 | ✔                            |
| Overlapping-event layout      | —                 | ✔                            |
| ARIA role                     | Various           | `application` + inner `grid` |

If a consumer needs any single row of the "✔" column above, the
answer is Scheduler — never a Calendar or Timeline feature request.

---

## Package Layout

Public exports live at the package root only, per the KairoUI export
policy. No internal deep paths are exported.

```
@kairoui-pro/scheduler/
  src/
    scheduler.tsx                // <Scheduler> root + compound children
    scheduler-types.ts           // Public prop / event / state types
    scheduler-context.ts         // React context (public read hook)
    time-utils.ts                // Wall-clock time math (no timezone conversion)
    layout.ts                    // Pure overlap-column packing algorithm
    views/
      day-view.tsx               // Time grid, single day, one column
      week-view.tsx              // Time grid, N days as columns
      timeline-view.tsx          // Horizontal time axis, resources as rows
    use-scheduler-state.ts       // Composed hook used by the root
    use-drag-schedule.ts         // Pointer drag orchestration
    use-resize-event.ts          // Edge-resize orchestration
    keymap.ts                    // Documented default key bindings
    styles.css                   // Component styles (only side-effect)
    index.ts                     // Public barrel
```

Package `sideEffects` = `["**/*.css"]`. Named exports only. No default
exports. The barrel re-exports symbols directly (no barrel of
barrels).

**Compound component surface**:

- `Scheduler` — root
- `Scheduler.Toolbar` — view switcher + navigation slot
- `Scheduler.Views` — view container (renders the active view)
- `Scheduler.DayView`, `Scheduler.WeekView`, `Scheduler.TimelineView` —
  explicit view components (composable independently of `Views`)
- `Scheduler.EventTemplate` — consumer-supplied event render prop
  wrapper
- `Scheduler.TimeAxis` — vertical hour labels (day / week) or
  horizontal (timeline)
- `Scheduler.ResourceHeader` — resource lane header (timeline view)
- `Scheduler.NowIndicator` — line at current wall-clock time

Each compound child is also exported as a bare named export
(`SchedulerToolbar`, `SchedulerDayView`, …) for consumers who prefer
explicit composition. No compound child is required for the root to
render — the root renders a default toolbar + view when no children
are provided.

---

## Time Model

### Value type

Every start / end time in a Scheduler event is a **`Date`** — the
same platform primitive Phase 13 uses at every date-input boundary.
No serialization format, no timezone-aware wrapper, no library value
type.

```ts
export interface SchedulerEvent {
  readonly id: string;
  readonly start: Date;
  readonly end: Date;
  readonly allDay: boolean;
  readonly resourceId?: string;
  readonly title: string;
  readonly description?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}
```

- **`start` and `end` are wall-clock `Date` objects** interpreted in
  the browser's local timezone.
- **`end` is exclusive.** A 09:00 → 10:00 event covers 09:00…10:00 −
  ε and does not overlap a 10:00 → 11:00 event.
- **`allDay: true` ignores the time-of-day component of `start` and
  `end`.** All-day events are laid out in a separate top strip above
  the time grid (day and week views) or as a strip above the resource
  lane (timeline view).
- **`resourceId` is optional.** When absent, the event lives in the
  "no resource" lane in `timeline` view and in the single column of
  `day` and `week` views.

### Timezone policy — **hard constraint**

The Scheduler **never silently transforms a timezone.** The rules are:

1. Every `Date` passed to Scheduler is interpreted in the browser's
   **local wall-clock time**, exactly matching Phase 13's
   `DateTimeLocal` policy. `Date.getHours()`, `Date.getMinutes()`,
   `Date.getDate()` are the only accessors used by the layout math.
2. **No IANA zone database is bundled.** No `zone` prop. No
   `sourceZone` / `displayZone` distinction.
3. When the consumer stores events in a specific zone (UTC, Europe/Paris,
   America/Los_Angeles), the consumer **converts to a local wall-clock
   `Date` before passing** to Scheduler and **converts back** in
   `onMoveEvent` / `onResizeEvent` / `onCreateRange`.
4. **`timezoneLabel?: string`** is a display-only prop rendered in the
   toolbar next to the date. It changes **no layout math**. Setting it
   to "UTC" while passing local-time events does not shift anything.
5. **DST transitions** manifest as visible 23-hour / 25-hour days in
   the time grid because the underlying `Date` arithmetic reflects
   them — the layout code trusts the platform and does not paper over
   the gap.
6. **All-day events span calendar days by `.getDate()` / `.getMonth()`
   / `.getFullYear()` comparison** — never by ms subtraction / 86_400_000,
   which would go wrong across a DST transition.
7. **`Date` values with `NaN.getTime()` are rejected** at the pipeline
   boundary. A consumer that hands Scheduler invalid dates gets a
   thrown error rather than a corrupted layout.

Consumers who want zone-aware persistence pair Scheduler with a helper
of their choice (`Intl.DateTimeFormat` with `timeZone` option, Luxon,
Temporal polyfill). The escape hatch is **explicit**, not automatic.

### Value range

- **Start ≤ End.** The reducer normalizes `start > end` to
  `[end, start]` during drag operations only. Consumers passing
  inverted ranges as data receive a thrown error.
- **Minimum duration** is `1 ms` for the type — the visual layout
  clamps to `minRenderedMinutes` (default `10`) so a 30-second event
  is still visible.
- **Maximum duration** is not enforced by Scheduler; the consumer
  gates via `maxDuration` on drag / resize callbacks.

### Locale + week model

- **`locale?: string`** — BCP 47 tag passed straight to
  `Intl.DateTimeFormat` for hour labels, day-of-week names, and
  short-date rendering.
- **`weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6`** — 0 = Sunday, 1 =
  Monday, …, 6 = Saturday. When omitted, derived from
  `Intl.Locale(locale).getWeekInfo?.().firstDay` when available;
  otherwise defaults to `1` (Monday, ISO 8601).
- **`hour12?: boolean`** — 12-hour vs 24-hour time labels. Derived
  from the locale when omitted.
- **`dir?: "ltr" | "rtl"`** — visual flow. In RTL:
  - Day columns lay out right-to-left (Monday on the right in `dir="rtl"`
    with `weekStartsOn=1`).
  - Time axis still runs top-to-bottom (24-hour axis is not visually
    mirrored).
  - Timeline view flows right-to-left along the time axis when the
    consumer explicitly opts in via `timelineDir="rtl"`. Default keeps
    time flowing left-to-right regardless of `dir` to match consumer
    expectations from every existing Gantt-style tool.

---

## View Model

### Views

Exactly three views ship in Phase 14. Additional views require an
ADR and their own KUI-ENT-* task.

| View       | Axis       | Columns / rows                          | Focus target                 |
| ---------- | ---------- | --------------------------------------- | ---------------------------- |
| `day`      | vertical   | single day, `slotMinutes` rows          | grid cells + events          |
| `week`     | vertical   | 7 days (or `daysInView` override), rows | grid cells + events          |
| `timeline` | horizontal | resources as rows, time as columns      | resource-time cells + events |

Every view carries the same **event data** and the same **layout
options**; only the geometry differs.

### `SchedulerView` type

```ts
export type SchedulerViewKind = "day" | "week" | "timeline";

export interface SchedulerViewProps {
  readonly kind: SchedulerViewKind;
  readonly date: Date; // anchor date for the view
  readonly daysInView?: number; // default 1 for day, 7 for week
  readonly slotMinutes?: number; // 15 / 30 / 60; default 30
  readonly startHour?: number; // 0…24; default 0
  readonly endHour?: number; // 0…24; default 24
  readonly showAllDayStrip?: boolean; // default true when any allDay event exists
}
```

The view accepts `date` as an anchor; the reducer computes the visible
range from `date`, `daysInView`, and `weekStartsOn`. Weeks are
canonical: the week containing `date` starts at `weekStartsOn` and
spans `daysInView` days.

### Time-grid geometry

The vertical (day / week) time grid is a `<div role="grid">` with:

- `startHour * slotMinutes` and `endHour * slotMinutes` bounding the
  visible band.
- Rows every `slotMinutes` minutes.
- Row height in CSS pixels is `slotMinutes * pxPerMinute` where
  `pxPerMinute` is a public prop with default `1.5`. Consumers who want
  denser or sparser grids override it. Row heights are static within
  a view instance.

The horizontal (timeline) time grid inverts this — one row per
resource, columns every `slotMinutes`. Column width in CSS pixels is
`slotMinutes * pxPerMinute` where `pxPerMinute` default is `2` for
timeline (wider to keep events legible).

**Row / column heights are static.** Variable heights and dynamic
measurement are deferred (a future ADR mirrors the DataGrid
variable-height ADR requirement).

### Now indicator

`<Scheduler.NowIndicator />` renders a 1-pixel horizontal or vertical
line at the current wall-clock time. Reads `Date.now()` on mount and
via a self-owned `setInterval(60_000)` that clears on unmount. No
prop-drilled tick; the indicator is always live.

### Virtualization

Day and week views virtualize the vertical axis when the total grid
height exceeds `virtualScrollHeight`. The math reuses
`computeVirtualizedRange` from `@kairoui/utils` and `useVirtualizer`
from `@kairoui/hooks` — no fork.

Timeline view virtualizes the vertical (resource) axis when the
resource count exceeds a heuristic `resourceVirtualizationThreshold`
(default `50`). Horizontal (time) virtualization is deferred — the
timeline width is capped at `slotMinutes * (endHour − startHour) *
pxPerMinute` per lane, well within a browser scroll region for a
single-day timeline.

---

## Event Layout

### Overlap resolution

Overlapping events are laid out with a **stable, deterministic column-
packing algorithm**:

1. Sort events by `start` ascending, ties broken by `end` descending
   (longer events first when starts collide).
2. Walk the sorted list. For each event, find the leftmost column
   whose last event ended at or before this event's `start`. Place
   the event in that column.
3. When no column is available, add a new one.
4. After the walk, group events into **clusters** — maximal sets of
   events whose columns are transitively overlapping. Assign the same
   `columnCount` to every event in a cluster so cluster width divides
   uniformly.

Each event's rendered geometry is derived from its cluster:

```ts
export interface LaidOutEvent<TEvent> {
  readonly event: TEvent;
  readonly column: number;
  readonly clusterColumns: number;
  readonly startMs: number; // ms from view start
  readonly endMs: number; // ms from view start
}
```

The renderer computes CSS `left`, `width`, `top`, `height` from these
fields plus `slotMinutes` / `pxPerMinute` / `dir`.

### All-day events

All-day events render in a horizontal strip above the time grid (day
/ week) or above the resource lane (timeline). The strip uses the
same column-packing algorithm but along the horizontal axis: two
all-day events on the same day are stacked vertically inside the
strip.

**Multi-day all-day events span the strip** across day columns. In
timeline view, they render as full-width bars.

### Overflow indicator

When a time-grid column contains more concurrent events than
`maxEventsPerSlot` (default `6`), the overflow is replaced with a
`+N` indicator. Clicking it fires `onOverflowClick(events)` — the
consumer decides what to render (a Popover with the list is the
canonical pattern).

---

## Selection

### Model

`SchedulerState.selection`:

```ts
export type SchedulerSelection =
  | { readonly kind: "none" }
  | { readonly kind: "event"; readonly eventId: string }
  | {
      readonly kind: "range";
      readonly start: Date;
      readonly end: Date;
      readonly resourceId?: string;
    };
```

- **`"event"`** — a single event is selected. `onSelectionChange`
  fires with the id.
- **`"range"`** — the user drag-created a range on empty grid. This is
  a **provisional selection** — it is not persisted as an event until
  the consumer's `onCreateRange` returns / resolves.
- **Only one selection kind is active at a time.** Multi-select is
  not shipped in Phase 14.

### Interactions that change the selection

- Click on an event: `kind: "event"`.
- Drag on empty grid: `kind: "range"` while the drag is active; on
  release, `onCreateRange` fires and Scheduler resets to `"none"` (or
  the range persists via a controlled prop).
- Click on empty grid: `kind: "none"`.
- Escape: `kind: "none"`.

### Controlled selection

`selection?: SchedulerSelection`, `defaultSelection?`,
`onSelectionChange?` follow the KairoUI controllable-state pattern.

---

## Drag / Reschedule Boundaries

### Public props

- **`draggable?: boolean`** — global default (`true`). Overridden
  per event via `event.meta?.draggable === false`.
- **`snapDuration?: number`** — minutes to snap to (default `15`).
  Snap is applied to both start and end of the moved event, preserving
  duration.
- **`dragBoundary?: DragBoundary`** — restricts where events may move:

  ```ts
  export type DragBoundary =
    | "view" // anywhere in the current view
    | "day" // must stay in the same calendar day
    | "resource" // must stay in the same resource lane (timeline only)
    | "none"; // no restriction (rare; deferred outputs may lose focus)
  ```

- **`minDuration?: number` / `maxDuration?: number`** — floors and
  ceilings applied by the reducer during drag; if the consumer's
  callback returns a wider range, Scheduler renders the callback's
  result unchanged.
- **`resizable?: boolean | "start" | "end" | "both"`** — global default
  (`"both"`). Per-event override via `event.meta?.resizable`.

### Drag lifecycle

1. `pointerdown` on an event body captures the pointer, seeds
   `dragState = { eventId, initialStart, initialEnd, cursorAnchor }`.
2. `pointermove` computes the pointer delta in minutes, snaps to the
   nearest `snapDuration`, clamps to the `dragBoundary`, and updates a
   **provisional** ghost element via CSS transforms. The underlying
   event data is **not mutated**.
3. `pointerup` fires `onMoveEvent({ event, start, end, resourceId })`
   with the snapped local-time values. The consumer applies the
   change; when the new event data flows back through props, the ghost
   is removed and the event renders at the new position.
4. `pointercancel` or `Escape` during a drag reverts the ghost and
   fires nothing.

### Resize lifecycle

Same shape as drag but only one edge moves. The reducer applies
`minDuration` / `maxDuration` before firing `onResizeEvent`.
`resizable: "start"` disables the end handle; `"end"` disables the
start; `"both"` shows both.

### Keyboard alternatives

Every drag / resize gesture has a keyboard equivalent driven by the
focused event:

| Key                                     | Action                            |
| --------------------------------------- | --------------------------------- |
| `ArrowUp` / `ArrowDown` (event focused) | Move event by one slot            |
| `Shift+ArrowUp` / `Shift+ArrowDown`     | Resize end by one slot            |
| `Ctrl+ArrowUp` / `Ctrl+ArrowDown`       | Resize start by one slot          |
| `Alt+ArrowLeft` / `Alt+ArrowRight`      | Move event to previous / next day |
| `Enter` / `F2` (event focused)          | Fire `onEventClick`               |
| `Escape`                                | Cancel any provisional drag       |

RTL swaps `ArrowLeft` / `ArrowRight` semantics for horizontal moves
in `timeline` view only.

---

## Consumer Callbacks

Every callback is fired **after** the interaction resolves, with
plain-data payloads. Scheduler never persists changes — the consumer
applies them to their own store and the new event data flows back
through the `events` prop.

```ts
export interface SchedulerEventClickPayload<TEvent extends SchedulerEvent> {
  readonly event: TEvent;
  readonly nativeEvent: MouseEvent | KeyboardEvent;
}

export interface SchedulerRangePayload {
  readonly start: Date;
  readonly end: Date;
  readonly resourceId?: string;
  readonly allDay: boolean;
}

export interface SchedulerMovePayload<TEvent extends SchedulerEvent> {
  readonly event: TEvent;
  readonly start: Date;
  readonly end: Date;
  readonly resourceId?: string;
}

export interface SchedulerResizePayload<TEvent extends SchedulerEvent> {
  readonly event: TEvent;
  readonly start: Date;
  readonly end: Date;
  readonly edge: "start" | "end";
}
```

Root props:

- `onEventClick?: (payload: SchedulerEventClickPayload<TEvent>) => void`
- `onCreateRange?: (payload: SchedulerRangePayload) => void`
- `onMoveEvent?: (payload: SchedulerMovePayload<TEvent>) => void | Promise<void>`
- `onResizeEvent?: (payload: SchedulerResizePayload<TEvent>) => void | Promise<void>`
- `onSelectionChange?: (selection: SchedulerSelection) => void`
- `onViewChange?: (view: SchedulerViewKind) => void`
- `onDateChange?: (date: Date) => void`
- `onOverflowClick?: (events: readonly TEvent[]) => void`

Callbacks that return `Promise<void>` are awaited by the reducer only
to preserve error propagation. Optimistic rendering is a **consumer
concern** — Scheduler waits for `events` to update; consumers
implementing optimistic UI pass the new event through the prop
immediately.

### Callback failure

Throwing / rejecting from `onMoveEvent` or `onResizeEvent` reverts the
provisional ghost and leaves the event visually unchanged. No error
UI is rendered by Scheduler; the consumer surfaces the error via a
Toast (or their own mechanism).

---

## Accessibility

- **Root** — `role="application"` on the scheduler container so
  screen readers do not linearize the grid. `aria-roledescription="Scheduler"`.
- **Grid** — inner `role="grid"` for the time grid. `role="row"` on
  rows, `role="gridcell"` on cells.
- **Events** — each event is a focusable element with
  `role="button"`, `aria-label="{title}, {startFormat} – {endFormat}"`,
  `aria-describedby` for optional description, and `aria-selected`
  reflecting the current `selection`.
- **Time axis labels** — `role="rowheader"` on each hour label with
  a full `Intl.DateTimeFormat` label (`"9:00 AM"`).
- **Resource headers** (timeline) — `role="rowheader"` with the
  resource label.
- **Toolbar** — `role="toolbar"` with `aria-label="Scheduler
controls"`. View switcher uses `role="tablist"` + `role="tab"` per
  the WAI-ARIA APG tabs pattern.
- **Live region** — one `aria-live="polite"` region announces:
  view changes (`"Week view, March 3 – March 9"`), event moves
  (`"Meeting moved to 10 AM"`), and drag cancellations. Text is
  localizable via a `messages` prop, matching the DateRangePicker
  pattern.
- **Focus preservation** — moving or resizing an event via keyboard
  keeps focus on the event; opening a popover via `onEventClick`
  restores focus to the trigger on close.
- **Reduced motion** — the drag ghost animation, view-transition
  animation, and now-indicator pulse all honor `prefers-reduced-motion`.

A dedicated a11y audit ships with KUI-ENT-011 following the
`docs/architecture/PHASE13-A11Y-AUDIT.md` template.

---

## Keyboard Navigation Model

Focus flows through **three focus stops**: toolbar → time-axis
starting cell → events grid. Within the events grid the roving
tabindex owns exactly one focus target at a time.

| Key                           | Action                                         |
| ----------------------------- | ---------------------------------------------- |
| `Tab` / `Shift+Tab`           | Move between grid, toolbar, and event region   |
| `ArrowLeft` / `ArrowRight`    | Move focus by one column (day/timeline)        |
| `ArrowUp` / `ArrowDown`       | Move focus by one row (slot / resource)        |
| `Home` / `End`                | First / last cell in the row                   |
| `Ctrl+Home` / `Ctrl+End`      | First / last cell in the grid                  |
| `PageUp` / `PageDown`         | Previous / next view page                      |
| `Alt+PageUp` / `Alt+PageDown` | Previous / next month (view-preserving)        |
| `Enter` / `F2` on empty cell  | Begin range selection at that cell             |
| `Enter` / `F2` on event       | Fire `onEventClick`                            |
| `Space` on event              | Toggle event selection                         |
| `Escape`                      | Cancel drag / resize / range creation          |
| `Delete` on selected event    | Fire `onDeleteEvent` when consumer supplies it |

Keyboard drag / resize modifiers are listed in the **Drag / resize**
section above. All bindings can be overridden via `keymap?: Partial<KeyMap>`
on the root, matching the DataGrid pattern.

---

## Public vs Internal API

Public (exported from `@kairoui-pro/scheduler`):

- Components: `Scheduler`, `Scheduler.Toolbar`, `Scheduler.Views`,
  `Scheduler.DayView`, `Scheduler.WeekView`, `Scheduler.TimelineView`,
  `Scheduler.EventTemplate`, `Scheduler.TimeAxis`,
  `Scheduler.ResourceHeader`, `Scheduler.NowIndicator` (plus bare
  siblings).
- Hooks: `useScheduler`, `useSchedulerView`, `useSchedulerEvent`,
  `useSchedulerLayout`, `useSchedulerSelection`.
- Types: `SchedulerRootProps<TEvent>`, `SchedulerEvent`,
  `SchedulerResource`, `SchedulerState`, `SchedulerSelection`,
  `SchedulerViewKind`, `SchedulerViewProps`, `LaidOutEvent`,
  `SchedulerEventClickPayload`, `SchedulerMovePayload`,
  `SchedulerResizePayload`, `SchedulerRangePayload`,
  `DragBoundary`, `KeyMap`.
- Values: `defaultKeyMap`, `defaultLayoutOptions`,
  `computeEventLayout`, `serializeSchedulerState`,
  `deserializeSchedulerState`, `schedulerStyleContract`.

Internal (not exported):

- Reducer implementations (`use-scheduler-state.ts` internals).
- Pointer / drag state machines.
- Prefixed helpers (`_snapToSlot`, `_clampToBoundary`).
- CSS-in-source constants.

The barrel never re-exports a symbol whose name starts with `_` or a
type whose name starts with `Internal`.

### Docs metadata

Per KUI-ENT-002, the docs generator's `DEFAULT_PACKAGES` is not
extended with Pro packages until KUI-ENT-017. The Scheduler ships a
minimal `apps/docs/docs/components/pro/scheduler.mdx` with hand-written
prose in KUI-ENT-011; the auto-generated Props table follows in
KUI-ENT-017.

---

## SSR Requirements

Scheduler adopts the same SSR posture proven in Phases 13 / 14 so
far:

1. **First render is server-safe.** No `window`, `document`,
   `localStorage`, `navigator`, `matchMedia`, or `requestAnimationFrame`
   at module load or during initial render. `Date.now()` calls happen
   only in effects.
2. **No hydration mismatches.** Server renders the same slot grid the
   first client render produces. The now-indicator is not rendered on
   the server (its position depends on `Date.now()` at mount) — it
   mounts on the second client render via a `hasMounted` flag.
3. **Virtualization degrades.** Server renders all slots unwindowed
   (matches DataGrid v1 pattern). Client swaps to windowed rendering
   after the scroll container is measured.
4. **`use client` is not used** in source. Consumers in RSC pipelines
   mark the palette / scheduler wrappers as client boundaries at
   their own level.

---

## Bundle Isolation and Tree-Shaking

- `@kairoui-pro/scheduler` declares only these runtime
  dependencies: `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`.
  `react` and `react-dom` are peer.
- No dependency on any other `@kairoui-pro/*` package.
- Named exports only; the root barrel re-exports symbols directly.
- **View components are individually tree-shakeable.** A consumer
  importing only `Scheduler.DayView` should not pay for the timeline
  layout math or the resource-header component. `use-scheduler-state.ts`
  centralizes state but each view's rendering logic imports its own
  layout helpers.
- **Layout math is separable.** `computeEventLayout` is a pure
  function exported at the root so consumers building custom views
  can reuse it without mounting `Scheduler`.
- **Now indicator is tree-shakeable.** Consumers who never use it never
  pay for the interval subscription.

Bundle budgets seed as part of KUI-ENT-018 (Pro bundle-budget
baseline). Initial provisional targets:

| Entry point                         | Raw target | Gzip target |
| ----------------------------------- | ---------- | ----------- |
| `@kairoui-pro/scheduler/index.js`   | 90 KB      | 26 KB       |
| `@kairoui-pro/scheduler/styles.css` | 10 KB      | 3 KB        |

Reset against the first release-candidate build in KUI-ENT-011.

---

## Shared Infrastructure Ownership

Following KUI-ENT-001's rule, every reused capability lives in its
current owner package. Scheduler consumes public APIs; it does not
fork or shim them.

| Capability                             | Owner                                   | Consumed by               |
| -------------------------------------- | --------------------------------------- | ------------------------- |
| `Date` primitive, wall-clock policy    | `@kairoui/utils/date` + Phase 13 policy | every view, drag reducer  |
| Composition, slots, variants           | `@kairoui/core/composition`             | every component           |
| Overlay infra (`Portal`, `FocusScope`) | `@kairoui/core/components/overlay`      | popovers on click / hover |
| Virtualization math + hook             | `@kairoui/utils`, `@kairoui/hooks`      | day, week, timeline views |
| Style contract + variant engine        | `@kairoui/core`                         | every component           |
| Theme / density / SSR provider         | `@kairoui/core`, `@kairoui/theme`       | every component           |
| Tokens                                 | `@kairoui/tokens`                       | every component           |
| Roving-tabindex helpers                | `@kairoui/core/components/collection`   | grid + event navigation   |

When Scheduler discovers a gap in a free package, the fix lands
**in the free package first** (per KUI-ENT-001) — never as a Pro-only
shim.

---

## What KUI-ENT-009 Does Not Do

- Does **not** create the `@kairoui-pro/scheduler` package.
- Does **not** write any Scheduler source code.
- Does **not** implement recurring events, business availability
  rules, or timezone-aware persistence.
- Does **not** modify `Calendar`, `Timeline`, `DateInput`,
  `DateRangePicker`, or any other free-tier component.
- Does **not** add `@kairoui-pro/scheduler` to any `package.json`,
  lint rule, or docs-generator configuration.
- Does **not** change bundle budgets or the docs generator config.

Later tasks (KUI-ENT-010, KUI-ENT-011) introduce the package, source,
and tests; each does so with its own review and its own bundle-budget
update, in line with the rules above.

---

## Change Control

Amendments require a new task ID under Phase 14 and must preserve:

1. The dependency direction (`@kairoui-pro/*` → `@kairoui/*`, never
   the reverse).
2. The **no silent timezone conversion** rule. Any new zone-aware
   capability MUST land as an explicit opt-in and MUST NOT modify
   the layout math.
3. The **no recurrence engine** and **no availability engine** rules
   for Phase 14.
4. The SSR / a11y / bundle-isolation guarantees stated above.
5. The compatibility rule with `@kairoui/utils/date` — Scheduler
   consumes the same `Date` primitive Phase 13 shipped.

Anything else is fair game. Record the amending task ID here on
change.
