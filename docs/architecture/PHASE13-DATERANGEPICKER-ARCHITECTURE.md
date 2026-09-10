# DateRangePicker Architecture (Phase 13, KUI-ADV-007)

Status: **Architecture defined**. Implementation follows in KUI-ADV-008.

DateRangePicker is a compound built on the same primitives as `DatePicker`
(`DateInput` × 2, `Popover`, `Calendar`) plus a small **range model** that
coordinates two endpoints and their selection order.

The architecture keeps the range logic in one place (the root) and reuses every
other primitive verbatim. The picker is not a booking widget — it does not
model availability, resource constraints, or business calendars.

---

## Value Shape

Reuses `DateRange<Date>` from `@kairoui/utils/date` (introduced in KUI-ADV-002):

```ts
interface DateRange<T = Date> {
  readonly start: T | null;
  readonly end: T | null;
}
```

- **Empty range**: `{ start: null, end: null }`.
- **Partial range**: `{ start: Date, end: null }` — allowed during interactive
  selection **and** as a settled value. Consumers can require completion via
  `requireComplete`.
- **Complete range**: `{ start: Date, end: Date }`.
- **Never**: `{ start: null, end: Date }`. The root normalizes: if only one
  endpoint is set, it lives in `start`.
- **Invariant**: `start <= end` when both are set. See [Range ordering](#range-ordering).

Timezone: same policy as `DatePicker` — browser-local calendar dates, no UTC
shift. Values at the API boundary are `Date` objects at midnight local time.

---

## Anatomy

```tsx
<DateRangePicker value={range} onValueChange={setRange} locale="en-US">
  <DateRangePickerStartInput placeholder="Start" />
  <DateRangePickerEndInput placeholder="End" />
  <DateRangePickerClear /> {/* optional */}
  <DateRangePickerTrigger aria-label="Open calendar" />
  <DateRangePickerContent>
    <DateRangePickerCalendars months={2} />
  </DateRangePickerContent>
</DateRangePicker>
```

| Part                        | Role                                                                      | Backing primitive                |
| --------------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| `DateRangePicker`           | Root — owns range state, active-endpoint focus, open state, hover preview | `Popover`                        |
| `DateRangePickerStartInput` | Typed entry for the start endpoint; anchors the popover                   | `DateInput`                      |
| `DateRangePickerEndInput`   | Typed entry for the end endpoint                                          | `DateInput`                      |
| `DateRangePickerClear`      | Resets both endpoints to `null`                                           | own `<button type="button">`     |
| `DateRangePickerTrigger`    | Icon button that opens the popover                                        | own `<button type="button">`     |
| `DateRangePickerContent`    | Portalled surface                                                         | `PopoverPortal + PopoverContent` |
| `DateRangePickerCalendars`  | Two-calendar grid (or one) with range highlighting and hover preview      | `Calendar` × N                   |

All coordination flows through `DateRangePickerContext`. Nothing here uses
`DatePickerContext` — the two are independent even if their DOM patterns look
similar. A single component can choose one or the other; composing both in the
same subtree is not a supported use case.

---

## State Model

The root owns four pieces of state.

### 1. Range value (`value: DateRange`)

- Controlled / uncontrolled via `value`, `defaultValue`, `onValueChange`. Backed
  by `useControllableState`.
- Emitted only after both endpoints commit (either endpoint typed and blurred,
  or a full range picked in the calendar). Partial ranges also emit — see
  [Emission policy](#emission-policy).

### 2. Open state (`open: boolean`)

- Same shape as `DatePicker` — `open`, `defaultOpen`, `onOpenChange`.

### 3. Active endpoint (`activeEndpoint: "start" | "end"`)

- Which endpoint the calendar is currently editing.
- Tracked to route calendar clicks and hover preview correctly.
- Transitions:
  - Opening from `StartInput` → `activeEndpoint = "start"`.
  - Opening from `EndInput` → `activeEndpoint = "end"`.
  - Opening from `Trigger` when both `null` → `activeEndpoint = "start"`.
  - Opening from `Trigger` with a partial range → `activeEndpoint = "end"`.
  - After picking `start` → `activeEndpoint = "end"` (stays open).
  - After picking `end` (or overwriting `start`) → picker closes and focus
    returns to whichever input opened it.
- Not part of the public prop surface. Not exposed for direct control.

### 4. Hover preview (`previewEnd: Date | null`)

- Internal only. Populated on `pointermove` over a calendar cell while
  `activeEndpoint === "end"` and `start` is set. Cleared on `pointerleave` and
  on any keyboard interaction.
- Consumers with pointer-heavy hover latency issues (e.g. iOS Safari) can
  disable it via `hoverPreview={false}` on the root.

---

## Emission policy

`onValueChange` fires when either endpoint changes. Partial ranges emit as
`{ start: Date, end: null }`. Consumers who want completion enforcement pass
`requireComplete: true`; the root then buffers a partial range internally and
only emits when both endpoints commit. If `requireComplete` is true and the
user commits `start` then reopens the input and clears it, `onValueChange`
fires with `{ start: null, end: null }`.

Rationale: partial ranges are a real UX state (users tab away mid-selection).
Consumers who don't want to see them can flip the flag.

---

## Range Ordering

On every commit, the root normalizes `[start, end]` such that `start <= end`:

- Typing `start = 2026-06-10, end = 2026-06-05` → swaps → `start = 2026-06-05, end = 2026-06-10`.
- Typing `start = 2026-06-05, end = 2026-06-05` → allowed (single-day range).
- Calendar first-click sets `start`; second-click:
  - If click date **>=** `start` → sets `end`.
  - If click date **<** `start` → sets `end = start`, `start = clickedDate`.
  - This means the calendar cannot produce an inverted range by pointer.

The swap emits `onValueChange` once with the normalized range. `onEndpointCommit`
(fired per-endpoint, see [Callbacks](#callbacks)) reports the raw commits
before swap, so consumers can distinguish user intent.

---

## Props (root only)

```ts
export interface DateRangePickerOwnProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
  onEndpointCommit?: (endpoint: "start" | "end", value: Date | null) => void;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  min?: Date;
  max?: Date;
  disabledDate?: (date: Date) => boolean;

  /** Enforce a minimum span in days (inclusive). */
  minLength?: number;
  /** Enforce a maximum span in days (inclusive). */
  maxLength?: number;

  /** Emit only complete ranges. Partial ranges are buffered internally. */
  requireComplete?: boolean;

  /** Enable pointer-hover preview of the pending end date. Defaults to true. */
  hoverPreview?: boolean;

  locale?: string;
  dir?: "ltr" | "rtl";
  weekStartsOn?: WeekStart;
  placement?: PopoverPlacement;

  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;

  /**
   * Form submission name. When set, two hidden inputs are emitted:
   * `${name}.start` and `${name}.end`. See [Form serialization](#form-serialization).
   */
  name?: string;
  form?: string;

  parse?: (input: string, locale: string) => ParseResult<DateOnly>;
  format?: (value: DateOnly, locale: string) => string;

  children: React.ReactNode;
  id?: string;
  className?: string;
}
```

Child parts take minimal props — DOM attributes plus a couple of narrow overrides
(e.g. `placeholder` on the inputs, `aria-label` on the trigger, `months?: 1 | 2`
on the calendars container).

Explicitly **not exposed** in v1:

- No `presets` prop for "Last 7 days" / "This month" / etc. Consumers can render
  their own preset panel inside `DateRangePickerContent` next to the calendars.
- No **timezone** prop — see policy above.
- No **maxSelections** or booking-style constraints.
- No **`onHoverChange`** for consumers to observe the hover preview.

---

## Two-calendar Presentation

`DateRangePickerCalendars` accepts `months: 1 | 2` (default `2`). Layout:

- `months={2}` — side-by-side. Left calendar shows the month of `start`, right
  shows the next month. Navigating months moves both calendars in sync.
- `months={1}` — single calendar sized to fit the popover width. Same range
  highlighting and hover preview.

Both variants pass identical props to each `Calendar` primitive; only the
outer layout differs. No new Calendar features — range highlighting is applied
via `data-in-range`, `data-range-start`, `data-range-end`, `data-preview-in-range`
data attributes that the tokens layer can style.

The `months` prop is a component prop, not a viewport switch. If a consumer
wants to render a single month on narrow viewports, they detect the viewport
themselves (or via a media-query CSS class) and choose the `months` value.

---

## Keyboard Selection

Behavior is layered — the picker adds coordination on top of what each part
already provides.

| Key                           | Location          | Behavior                                                                               |
| ----------------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| `ArrowDown` / `Alt+ArrowDown` | Start / End input | Opens the popover; focuses today or `start`/`end`; sets `activeEndpoint`               |
| `Alt+ArrowUp`                 | Start / End input | Closes popover                                                                         |
| `Escape`                      | Any part          | Closes popover; buffered partial range is discarded (reverts to prior committed range) |
| `Tab`                         | Start input       | Moves to end input (does not close popover)                                            |
| `Tab`                         | End input         | Moves out of picker; commits end; closes popover                                       |
| `Enter` / `Space`             | Calendar cell     | Selects; advances `activeEndpoint` from `"start"` to `"end"`; closes on `end`          |
| Calendar arrow navigation     | Calendar cell     | Delegated to existing `Calendar` behavior                                              |

Hover preview is pointer-only and never activates from keyboard focus — matches
the guidance in APG for date-picker patterns to avoid confusing keyboard-only
users.

---

## Hover Preview Policy

When `hoverPreview` is enabled (default) and:

- `activeEndpoint === "end"`, and
- `start` is set, and
- The user is using a pointer (detected via `pointermove` events, not focus),

the calendar highlights the pending range from `start` to the hovered cell via
`data-preview-in-range`. The value **is not committed** — hover is decorative
only. On `pointerleave` of the grid, the preview clears.

The preview is not exposed through props or context. Consumers who want a
committed-on-hover experience implement it themselves via `onValueChange` and
their own pointer tracking (not recommended).

---

## Min / Max / Disabled Dates

- `min` / `max` clamp the entire range: both endpoints must land in `[min, max]`.
  Values outside this window (typed or clicked) are rejected with `aria-invalid`
  on the corresponding input.
- `disabledDate` is passed to `Calendar`. Disabled days cannot be clicked as
  either endpoint. A range that **spans** disabled days is still valid — the
  picker does not enforce contiguity. Booking apps that need contiguity must
  layer their own validation.

---

## Minimum / Maximum Range Length

- `minLength` / `maxLength` in **days**, inclusive of endpoints.
- Enforced at commit time. If the calendar user picks an `end` that violates:
  - `minLength` — the calendar treats every day within `start + minLength - 1`
    as if `data-disabled` (visually), and clicks in that window snap `end` to
    `start + minLength - 1`.
  - `maxLength` — days after `start + maxLength - 1` are dimmed with
    `data-out-of-range`; clicks are rejected with a focus flash.
- If typed input violates the constraint, both inputs mark `aria-invalid` and
  the value is not emitted (matches DateInput's existing invalid intermediate
  behavior).
- Length rules are inclusive: `minLength: 1` allows a single-day range;
  `maxLength: 7` allows exactly 7 days including endpoints.
- These are **hard constraints**, not soft advisories. There is no
  `onLengthViolation` callback — consumers who want telemetry read
  `aria-invalid` and their form state.

---

## Form Serialization

When `name` is set, DateRangePicker emits **two** hidden inputs:

- `${name}.start` — ISO `YYYY-MM-DD` or empty string
- `${name}.end` — ISO `YYYY-MM-DD` or empty string

Rationale: matches the existing hidden-input pattern in `DateInput`,
composes with `FormData` in a predictable way, and avoids the ambiguity of
comma-separated values. Backend deserialization is a single-line change from
a typical `dob` field to `dob.start` / `dob.end`.

Alternative single-name serialization (e.g. `2026-06-05..2026-06-10`) is
explicitly out of scope; consumers who need it write their own hidden input.

`form` on the root propagates to both hidden inputs so the picker can live
outside the target `<form>` element.

---

## Field Integration

- Root reads `useFieldContext` once; threads `disabled`, `readOnly`, `required`,
  `invalid` into `DateRangePickerContext`.
- **Two inputs, one Field**: `DateRangePickerStartInput` and
  `DateRangePickerEndInput` share the Field's `aria-labelledby`. Only the
  **start** input registers as the "primary control" for `aria-errormessage` —
  the end input carries `aria-describedby` pointing to `FieldDescription` but
  not `FieldError`. Rationale: a screen reader announcing the same error twice
  is worse than announcing it once.
- Required propagates to both inputs. Both must have a value for the field to
  be considered complete (native `required` attribute on both).

---

## Accessible Range Announcement

A visually-hidden live region inside `DateRangePickerContent` announces range
progress:

| Event             | Announcement                                                        |
| ----------------- | ------------------------------------------------------------------- |
| Popover opens     | `"Select start date"` (or `"Select end date"` if start already set) |
| Start committed   | `"Start date: March 5, 2026. Now select end date."`                 |
| End committed     | `"End date: March 10, 2026. Range: 6 days."`                        |
| Range cleared     | `"Range cleared."`                                                  |
| Endpoints swapped | `"Range swapped. Start: March 5, 2026. End: March 10, 2026."`       |

The live region uses `aria-live="polite"` and `aria-atomic="true"`. Localized
strings come from a small `messages` prop on the root:

```ts
interface DateRangePickerMessages {
  selectStart: string;
  selectEnd: string;
  startCommitted: (date: Date) => string;
  endCommitted: (range: DateRange, days: number) => string;
  cleared: string;
  swapped: (range: DateRange) => string;
}
```

Default `messages` are English. Consumers pass their own for other locales.
The `locale` prop drives numeric parsing but does not translate these
messages — this is a deliberate scope boundary matching how the rest of
Phase 8+ components handle localization strings.

---

## Callbacks

| Callback           | When it fires                                                         |
| ------------------ | --------------------------------------------------------------------- |
| `onValueChange`    | Range mutated (either endpoint changed). Emits normalized range.      |
| `onEndpointCommit` | Per-endpoint commit (before ordering). Consumers can log user intent. |
| `onOpenChange`     | Popover opens/closes.                                                 |

No `onHoverChange` for the preview — hover is decorative.
No `onFocusChange` for `activeEndpoint` — it's internal.

---

## SSR / Hydration

- Popover is closed on first render. The two inputs render on the server with
  the same rules as `DateInput` (no locale-specific formatting during initial
  render). Calendars are not rendered on the server (behind the closed popover).
- Fixtures cover:
  - Empty range, closed
  - Partial range (`{ start: Date, end: null }`), closed
  - Complete range, closed
  - `defaultOpen={true}` with a partial range (calendar renders SSR)
  - Inside `<Field disabled required>`

Match the same `crypto.randomUUID` / `useStableId` rules as `DatePicker`.

---

## Non-goals (v1)

- **Time selection** — DateRangePicker is date-only. Use `DateTimeRangePicker`
  (unplanned; would be a separate task if requested).
- **Availability queries / async loading** — the calendar renders synchronously.
  Consumers who need to disable dates based on server data pass a memoized
  `disabledDate` predicate.
- **Booking-specific constraints** — no `minAdvanceBooking`, no
  `blockedRangesFromServer`, no cross-endpoint constraints beyond
  `minLength` / `maxLength`.
- **Timezone controls** beyond browser-local.
- **Presets panel**, **relative ranges** (e.g. "Last 30 days"), or **rolling
  date pickers**.
- **Range comparison mode** (two ranges side-by-side for A/B date comparison —
  common in analytics dashboards; deferred).

---

## Task sequence

- `KUI-ADV-008` — implement DateRangePicker
- `KUI-ADV-009` — docs migration for date pages (already covers DatePicker,
  will be extended)

Bundle budget target: **≤ +10 KB raw** on `@kairoui/core/dist/components/index.js`
(root + parts, excluding already-shipped `DateInput`, `Calendar`, `Popover`,
`DatePicker`).
