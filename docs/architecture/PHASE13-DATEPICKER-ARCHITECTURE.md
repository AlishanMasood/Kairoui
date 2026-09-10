# DatePicker Architecture (Phase 13, KUI-ADV-005)

Status: **Architecture defined**. Implementation follows in KUI-ADV-006.

DatePicker is the composite of `DateInput` (typed text entry) and `Calendar` (grid picker) mounted
inside a `Popover`. All three parts already exist as production primitives — DatePicker is a
narrow compound that binds them together, not a rewrite.

The architecture is intentionally minimal: DatePicker owns two state coordinations (selected date
and open state) and the input-to-calendar bidirectional sync. Everything else is delegated.

---

## Anatomy

DatePicker is a compound component with the following named parts:

```tsx
<DatePicker value={value} onValueChange={setValue} locale="en-US">
  <DatePickerInput placeholder="MM/DD/YYYY" />
  <DatePickerClear /> {/* optional */}
  <DatePickerTrigger aria-label="Open calendar" />
  <DatePickerContent>
    <DatePickerCalendar />
  </DatePickerContent>
</DatePicker>
```

| Part                 | Role                                                                                   | Backing primitive                          |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| `DatePicker`         | Root — owns state, provides context, wraps `Popover` root                              | `Popover`                                  |
| `DatePickerInput`    | Text input for typing a date; participates in native form                              | `DateInput`                                |
| `DatePickerClear`    | Optional clear button that resets selection to `null`                                  | own `<button type="button">`               |
| `DatePickerTrigger`  | Icon button that opens the calendar popover                                            | `PopoverTrigger` + `IconButton` internally |
| `DatePickerContent`  | Portalled floating surface hosting the calendar                                        | `PopoverPortal` + `PopoverContent`         |
| `DatePickerCalendar` | The `Calendar` grid, bound to the picker's `value`, `min`, `max`, `disabled` predicate | `Calendar`                                 |

### Composition rules

- `DatePicker` is the **only** context provider. All descendants read from `DatePickerContext`.
- No part reaches into another part's DOM. All coordination flows through context and refs
  the root manages.
- `DatePickerContent` transitively provides `PopoverContext` (already established by the root's
  internal `Popover`), so consumers can render any Popover-compatible child (e.g., a divider,
  action row) alongside `DatePickerCalendar` if they want more than the default layout.
- No slot API in v1. Consumers can replace individual parts only through re-composition (drop
  our part, render your own). This matches the composability of `Combobox`, `Select`, and
  `Dialog` in Phase 8-10.

### Anatomy diagram

```
DatePicker  ── owns value / open / input-text / anchorRef ──── PopoverContext (internal)
├── DatePickerInput      → renders DateInput; anchors the popover
├── DatePickerClear      → optional; only visible when value !== null
├── DatePickerTrigger    → renders PopoverTrigger wrapping IconButton
└── DatePickerContent    → renders PopoverPortal + PopoverContent
    └── DatePickerCalendar → renders Calendar bound to context
```

---

## State Model

DatePicker owns exactly two pieces of state and one shared input-text buffer.

### 1. Selected date (`value: Date | null`)

- Controlled / uncontrolled via `value` and `defaultValue`, `onValueChange`. Backed by
  `useControllableState`.
- Shape mirrors `DateInput`: `Date | null | undefined` (`null` = cleared; `undefined` = uncontrolled).
- Empty selection is `null`. Never `undefined`. Never `Invalid Date`.
- Timezone-free: values are browser-local calendar dates (matches Phase 13 timezone policy).

### 2. Open state (`open: boolean`)

- Controlled / uncontrolled via `open`, `defaultOpen`, `onOpenChange`. Backed by
  `useControllableState`.
- Same shape as `Popover` and `Dialog`.

### 3. Input-text buffer (internal)

- Not part of the public prop surface — an internal buffer shared between `DatePickerInput`
  and calendar-driven updates.
- When the user selects a day in the calendar, `DatePicker` (a) sets `value`, (b) writes the
  formatted date into the input buffer, and (c) closes the popover.
- When the user types and commits a valid date in the input, `DatePicker` (a) sets `value` and
  (b) does NOT open the popover (typed commit shouldn't stealth-open a picker).
- When `value` changes externally, the buffer is refreshed on the next render if the input is
  not focused (matches `DateInput`'s existing `pendingInput` logic — DatePicker just threads a
  parent `value` change into `DateInput`).

---

## Props (root only)

```ts
export interface DatePickerOwnProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  min?: Date;
  max?: Date;
  /** Predicate called for each candidate day; `true` disables the day. */
  disabledDate?: (date: Date) => boolean;

  locale?: string;
  dir?: "ltr" | "rtl";
  /** Where the popover attaches to the input anchor. Passthrough to Popover. */
  placement?: PopoverPlacement;

  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;

  /** Form name — proxies to hidden input in `DatePickerInput`. */
  name?: string;
  form?: string;

  /** Custom parser / formatter used by DatePickerInput. */
  parse?: (input: string, locale: string) => ParseResult<DateOnly>;
  format?: (value: DateOnly, locale: string) => string;

  children: React.ReactNode;
  id?: string;
  className?: string;
}
```

Child parts (`DatePickerInput`, `DatePickerTrigger`, etc.) take minimal props — just their own
DOM attributes and a couple of narrow overrides (e.g. `placeholder` on the input, `aria-label`
on the trigger). No duplication of the root's semantic surface.

Explicitly **not exposed** in v1:

- No `renderCalendar` render prop — consumers who need a different calendar can drop
  `DatePickerCalendar` and render their own `Calendar` inside `DatePickerContent`.
- No `hourEnabled` / time selection — see [Non-goals](#non-goals).
- No `weekStartsOn` on the root — inherited by `DatePickerCalendar` from `locale` (matches
  `Calendar` today) or overridden on the calendar part directly.

---

## Parsing & Formatting

Delegated to `DateInput`:

- Default parser: `parseDateOnlyLocalized(input, locale)` from `@kairoui/utils/date`
- Default formatter: `formatDateOnlyLocalized(value, locale, { year, month: "2-digit", day: "2-digit" })`
- Consumers can override both via the root's `parse` / `format` props, which DatePicker
  passes through to the input.

Parsing rejects natural language (per Phase 13 architecture). If a user types "next Friday",
the input marks `aria-invalid="true"` and the popover doesn't open.

---

## Calendar Selection Flow

1. User opens the popover (Trigger click, ArrowDown on input, or `open` set programmatically).
2. `DatePickerCalendar` receives `value` (or `min` when null) and focuses that day.
3. User navigates via keyboard (delegated to `Calendar`'s existing arrow-key handling) or
   pointer (click).
4. User activates a day (`Enter`/`Space`/click).
5. DatePicker: `setValue(selectedDate)`, refresh input buffer, `setOpen(false)`, return focus
   to the input via a queued `focus()` after the popover's exit animation resolves.

**Invariants**:

- Selecting a day never triggers `onOpenChange(true)`.
- Selecting the same day as the current value still fires `onValueChange` (matches native
  `<input type="date">` — consumers can debounce if they don't want it).
- Selecting a `disabledDate` is impossible: `Calendar` refuses focus and pointer input on
  disabled days.

---

## Min / Max / Disabled Dates

- `min` and `max` clamp the `Calendar` grid and the `DateInput` parse validation.
- Values outside `[min, max]` typed into the input are rejected with `aria-invalid="true"` on
  the input — the popover stays available for the user to pick a valid date.
- `disabledDate` is a pure predicate `(date: Date) => boolean` — passed to `Calendar`. Not
  consulted during typing, because arbitrary predicates cannot be pattern-matched against
  free-form text without hoisting the predicate into the input. If a user types a date that
  the calendar considers disabled, the input accepts the parse but DatePicker refuses to
  commit and marks `aria-invalid="true"`.

The disabled predicate must be **pure and referentially stable** (memoized by consumer) — it's
called during each calendar render.

---

## Focus Transfer

- **Trigger click → open**: focus moves to the currently-selected day in the calendar (fallback
  = today if today is in range, else the first non-disabled day of the current view month).
- **Popover close via day selection**: focus returns to the input (not the trigger). Rationale:
  the input owns the committed value; users usually type another field next.
- **Popover close via Escape**: focus returns to whichever element opened it (trigger if
  trigger-opened, input if input-opened via ArrowDown).
- **Popover close via outside click**: focus stays where the user clicked. Popover already
  implements this pattern.

Focus transfer uses the existing focus-scope utilities in `@kairoui/core/composition`. No new
focus primitive.

---

## Keyboard

Behavior is layered — DatePicker adds a small set of coordinating shortcuts on top of what
`DateInput`, `Calendar`, and `Popover` already provide.

| Key                       | On `DatePickerInput`                                                                | On `DatePickerContent`            |
| ------------------------- | ----------------------------------------------------------------------------------- | --------------------------------- |
| `ArrowDown`               | Open popover; focus selected/first-focusable day                                    | `Calendar` handles day navigation |
| `Alt+ArrowDown`           | Same as `ArrowDown` (matches native `<input type="date">` on Chrome)                | —                                 |
| `ArrowUp` / `Alt+ArrowUp` | Close popover if open; otherwise no-op                                              | —                                 |
| `Enter`                   | Commit typed value; open popover on invalid (opt-in via `openOnInvalid` — deferred) | Select focused day; close popover |
| `Escape`                  | Revert typed input (existing DateInput behavior)                                    | Close popover; restore focus      |
| `Tab` / `Shift+Tab`       | Move to next/previous field                                                         | Popover intercepts and closes     |
| Any typing                | Types into input; popover stays closed                                              | —                                 |

No new global keys. Users of screen readers still get the full ARIA combobox pattern (see below).

---

## Escape / Outside Dismissal

Popover's existing dismissal semantics apply verbatim. DatePicker configures:

- `dismissOnEscape: true`
- `dismissOnOutsidePointerDown: true`
- Outside-pointer detection excludes both the input and the trigger (both are considered "part
  of" the picker for dismissal purposes).

No custom `useDismissableLayer` — DatePicker reuses `Popover`'s.

---

## Form Participation

DatePicker delegates form participation to `DateInput`, which already emits a hidden `<input>`
with an ISO `YYYY-MM-DD` value when `name` is set. DatePicker forwards `name` and `form` props
onto the input and does not emit its own hidden input.

- Empty selection submits `""` (matches DateInput).
- No UTC conversion — the emitted value is exactly the browser-local calendar date.
- `required` triggers native HTML5 validation on the text input.

---

## Field Integration

DatePicker is Field-context aware. When wrapped in `<Field>`:

- `disabled`, `readOnly`, `required`, and `invalid` propagate from `FieldContextValue`.
- `DatePickerInput` receives `aria-labelledby`, `aria-describedby`, `aria-errormessage` via
  `resolveFieldControlProps` (identical to standalone `DateInput`).
- The trigger inherits `disabled` from Field context and skips render of its focus ring when
  the field is disabled.

No new hooks — `DatePicker` re-uses `useFieldContext` at the root and threads the context
value down through `DatePickerContext` so child parts don't call `useFieldContext` themselves.

---

## Accessibility

DatePicker implements the WAI-ARIA **date-picker combobox pattern** (input + popup grid):

| Element              | ARIA                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `DatePickerInput`    | `role="combobox"`, `aria-haspopup="dialog"`, `aria-expanded={open}`, `aria-controls={contentId}`                    |
| `DatePickerTrigger`  | `aria-label="Choose date"` (default), `aria-haspopup="dialog"`, `aria-expanded={open}`, `aria-controls={contentId}` |
| `DatePickerContent`  | `role="dialog"`, `aria-modal="false"`, `aria-labelledby={inputLabelId}` (falls back to `aria-label="Choose date"`)  |
| `DatePickerCalendar` | `role="grid"` — inherited from `Calendar`                                                                           |
| Selected day         | `aria-selected="true"` — inherited                                                                                  |
| Disabled day         | `aria-disabled="true"` — inherited                                                                                  |

Notes:

- **`aria-modal="false"`** because the calendar overlay isn't modal — screen readers can still
  navigate the input while the popover is open. Matches the "combobox with popup" pattern in
  APG 1.2.
- **Trigger name**: consumers can override the default `aria-label` per-instance.
- **Live announcement**: when the calendar view changes months (e.g., ArrowLeft on the first
  day), Calendar's existing `aria-live="polite"` on the month heading announces the new month.

---

## Mobile Behavior Boundaries

DatePicker in v1 renders the **same UI on all viewports** — a Popover-anchored calendar. It
does **not** delegate to native `<input type="date">` on mobile. Rationale:

- Explicit locale control matters more than deferring to iOS/Android's OS-default
  behavior for enterprise apps.
- Users can pass `type="date"` themselves by dropping our input and rendering a raw HTML input
  bound to the same context — an escape hatch that requires no framework support.
- Bundle budget: no separate mobile code path, no user-agent sniffing, no viewport media
  queries in JS. All responsiveness is CSS-only inside `Calendar`.

**Explicitly deferred to Phase 14**: a mobile bottom-sheet variant of `DatePickerContent`. If
that surfaces in Phase 14, it will be an opt-in prop (e.g., `variant?: "popover" | "sheet"`),
not a viewport auto-switch.

---

## SSR / Hydration

- Root, Input, Trigger, and Content **all render on the server** with `open={defaultOpen ?? false}`.
- No `Intl.DateTimeFormat` call happens during the first render on the server for the input
  value: `DateInput` already defers locale-specific formatting to the client via its existing
  logic (matches Phase 13 SSR contract).
- Calendar's month grid is deterministic given `value`, `min`, `max`, and `locale` — safe to
  render on the server.
- No timers, no `Date.now()` in initial render. `today` (for "isToday" highlighting) is
  computed via `useEffect` on client mount.
- `crypto.randomUUID` for IDs is threaded through `useId` / `useStableId` from `@kairoui/hooks`.

Hydration fixtures cover:

- `<DatePicker />` uncontrolled, closed, no value
- `<DatePicker defaultValue={new Date(2026, 2, 5)} />` uncontrolled, closed, with value
- `<DatePicker defaultOpen />` uncontrolled, initially-open (calendar renders server-side)
- Inside `<Field disabled required />`

---

## Non-goals (v1)

- No **date range** selection — `DateRangePicker` is a separate component in Phase 13 (see
  KUI-ADV-008).
- No **time selection** — `TimeInput` and `DateTimeInput` are separate. DatePicker deals
  with calendar dates only.
- No **preset ranges panel** ("This week", "Last 7 days") — a common enterprise pattern, but
  it's a UX layer above DatePicker. Consumers can render it inside `DatePickerContent` alongside
  `DatePickerCalendar`.
- No **inline / always-open** variant — that's just rendering `<Calendar />` without the
  Popover wrapper. No DatePicker needed for that use case.
- No **`type="date"` fallback** on mobile.
- No **external date library dependency** (Luxon, date-fns, Moment) — all math continues to
  route through `@kairoui/utils/date`.

---

## Task sequence (implementation)

- `KUI-ADV-006` — implement `DatePicker` root + parts
- `KUI-ADV-009` — docs migration for the date pages (DateInput, TimeInput, DateTimeInput,
  DatePicker)

Bundle budget delta target: **≤ +7 KB raw** on `@kairoui/core/dist/components/index.js` (root +
parts, excluding the already-shipped `DateInput`, `Calendar`, `Popover`).
