# Phase 14 — Kanban Architecture (KUI-ENT-012)

Status: **Architecture defined**. Implementation follows in KUI-ENT-013
(board / column / card runtime) and KUI-ENT-014 (drag / drop /
keyboard move + completion audit).

Depends on: `docs/architecture/PHASE14-ENTERPRISE-ARCHITECTURE.md`
(KUI-ENT-001) — package boundary, dependency direction, licensing
shape.

---

## Purpose

The Kanban is the fourth Pro surface. It renders **cards flowing
across columns** with support for pointer drag/drop, keyboard move
operations, virtualized rows and columns, custom card rendering, and
a strict consumer-owned data model. It ships in
`@kairoui-pro/kanban`, reuses every reusable piece of `@kairoui/core`
and `@kairoui/hooks`, and adds the collection interaction model that
neither `DataGrid` nor `Scheduler` covers.

This document fixes the Kanban's contracts before implementation
begins so KUI-ENT-013 and KUI-ENT-014 have zero degrees of freedom on
the public API, on the data model, on drag/drop semantics, on the
keyboard model, and on the boundary between the free tier and the
Kanban.

Nothing here writes runtime code. This is a contract-only ADR.

---

## Scope

### In scope for KUI-ENT-012 through KUI-ENT-014

- Data model: boards, columns, cards, identities, ordering.
- Column movement policy: reorder, allow / block per axis.
- Card movement: intra-column reorder, inter-column move.
- Interaction: pointer drag/drop **and** first-class keyboard moves.
- Bounded interaction: per-column opt-outs, per-card opt-outs,
  `dropAcceptance` predicate.
- Virtualization: vertical (cards within a column) and horizontal
  (columns within a board), both opt-in.
- Empty column affordances: drop target + placeholder slot.
- Custom card rendering via render prop **and** compound
  `<Kanban.CardTemplate>`.
- Locale: BCP 47, `dir` (LTR/RTL).
- Keyboard model: arrow navigation, Enter/Space to pick up, arrows to
  move, Space to drop, Escape to cancel.
- Accessibility: WAI-ARIA application + reorderable list pattern with
  live-region announcements.
- Consumer callbacks: card click, card move, column move, drop.

### Explicitly out of scope for Phase 14

- **Project-management workflow.** No swim-lanes, no dependencies, no
  WIP limits enforcement, no assignee widgets, no task templates, no
  sprint / iteration model.
- **Persistence.** No storage adapter, no HTTP client, no offline
  queue. Every move flows through a consumer callback.
- **Hard-coded statuses.** Columns are consumer-defined; the Kanban
  ships no `"todo"` / `"doing"` / `"done"` presets.
- **Card content library.** No pre-baked card layouts (avatars, tags,
  due dates). Consumers render card content via `renderCard`.
- **Undo / redo.** Consumer concern.
- **Optimistic concurrency / conflict resolution.** Consumer concern.
- **Attachment / comment surfaces.** Out of scope for the primitive.
- **Multi-select move.** Single-card pickup only.
- **Cross-board drag.** A `<Kanban>` instance is a single board.

### Deferred to a later Pro task (not KUI-ENT-012…014)

- Variable card heights inside a virtualized column (fixed-height in
  v1; matches the DataGrid variable-height ADR requirement).
- Column groups / nested boards.
- Server-side windowed card streams.
- Drop preview inside collapsed / minimized columns.
- Card diffing beyond identity — the reducer only tracks `id`, not
  content hashes.

---

## Positioning Relative to Other Pro Surfaces

Every Pro surface owns its shape; there is no overlap.

| Capability                      | `DataGrid` | `Scheduler`            | `Kanban`                              |
| ------------------------------- | ---------- | ---------------------- | ------------------------------------- |
| Tabular rows with typed columns | ✔          | —                      | —                                     |
| Events on a time axis           | —          | ✔                      | —                                     |
| Cards flowing across columns    | —          | —                      | ✔                                     |
| Column reorder                  | ✔          | —                      | ✔                                     |
| Multi-column drag targets       | —          | —                      | ✔                                     |
| Keyboard reorder / move         | ✔          | ✔                      | ✔                                     |
| Overlay-only drag ghost         | —          | ✔                      | ✔                                     |
| Virtualized rows                | ✔          | day / week             | ✔ (vertical)                          |
| Virtualized columns             | ✔          | —                      | ✔ (horizontal)                        |
| ARIA role                       | `grid`     | `application` + `grid` | `application` + reorderable list pair |

If a consumer needs any single row of the Kanban column above, the
answer is Kanban — never a DataGrid or Scheduler feature request.

---

## Package Layout

Public exports live at the package root only, per the KairoUI export
policy. No internal deep paths are exported except `./styles.css`.

```
@kairoui-pro/kanban/
  src/
    kanban.tsx                  // <Kanban> root + compound children
    kanban-types.ts             // Public prop / event / state types
    kanban-context.ts           // React context (public read hook)
    kanban-state.ts             // Pure reducer helpers (immutable)
    identity.ts                 // Column + card id contract + helpers
    ordering.ts                 // Pure ordering / move algorithms
    keymap.ts                   // Documented default key bindings
    use-kanban-state.ts         // Composed hook used by the root
    use-drag-card.ts            // Pointer drag orchestration for cards
    use-drag-column.ts          // Pointer drag orchestration for columns
    use-virtualized-column.ts   // Card-list virtualization glue
    use-virtualized-board.ts    // Column-list virtualization glue
    kanban-messages.ts          // Default announcer / label strings
    styles.css                  // Component styles (only side-effect)
    index.ts                    // Public barrel
```

Package `sideEffects = ["**/*.css"]`. Named exports only. No default
exports. The barrel re-exports symbols directly (no barrel of
barrels).

**Compound component surface**:

- `Kanban` — root
- `Kanban.Board` — scroll container that hosts columns
- `Kanban.Column` — one column instance (title + card list + drop
  zone)
- `Kanban.ColumnHeader` — column title + count + toolbar slot
- `Kanban.ColumnBody` — the scrollable list of cards
- `Kanban.ColumnFooter` — optional footer slot (e.g. "New card")
- `Kanban.Card` — card wrapper responsible for drag / focus / a11y
- `Kanban.CardTemplate` — declarative renderer registration (mirrors
  `<Scheduler.EventTemplate>`)
- `Kanban.EmptyState` — placeholder rendered when a column has zero
  cards
- `Kanban.DragPreview` — optional custom ghost overlay

Each compound child is also exported as a bare named export
(`KanbanBoard`, `KanbanColumn`, …) for consumers who prefer explicit
composition. No compound child is required for the root to render —
the root renders a default board + column layout when no children
are provided and the `columns` / `cards` props supply the data.

---

## Data Model

### Identity

Every column and every card carries a **stable, consumer-owned
identity**. The Kanban never mints ids — a missing or duplicated id
is a thrown error at the pipeline boundary.

```ts
export type KanbanColumnId = string;
export type KanbanCardId = string;

export interface KanbanColumn {
  readonly id: KanbanColumnId;
  readonly title: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface KanbanCard {
  readonly id: KanbanCardId;
  readonly columnId: KanbanColumnId;
  readonly title: string;
  readonly description?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}
```

- **Column identity**: `KanbanColumnId` is opaque to the Kanban —
  it may be a UUID, a status slug, a database key, anything the
  consumer chooses. The Kanban stores it by reference only. There
  are no hard-coded status presets.
- **Card identity**: same rule as column identity. The reducer
  compares by `id === id`; content changes without id changes are
  treated as the "same" card in a new revision.
- **Duplicate ids** in either the `columns` or `cards` array throw a
  `RangeError` at ingest. The Kanban refuses to render an
  ambiguous board.
- **Unknown `columnId` on a card** is a thrown `RangeError` — cards
  MUST reference a column that appears in the `columns` list.

### Cards are consumer-supplied and consumer-persisted

The Kanban does **not** store cards or columns internally. Every
render pass reads the `cards` and `columns` props. Move interactions
fire a callback (`onCardMove`, `onColumnMove`); the consumer applies
the change to their own store and the new arrays flow back through
props. Nothing about persistence lives inside the Kanban.

### Ordering

The visible order of columns and cards is derived from the input
arrays, in order, with an optional explicit `order` field:

```ts
export interface KanbanCard {
  readonly id: KanbanCardId;
  readonly columnId: KanbanColumnId;
  readonly title: string;
  readonly order?: number;
  // …
}

export interface KanbanColumn {
  readonly id: KanbanColumnId;
  readonly title: string;
  readonly order?: number;
  // …
}
```

The ordering rule (fixed by the ADR — no ambiguity):

1. If **every** column has an `order`, columns are sorted ascending
   by `order`; ties broken by `id` ascending.
2. If **any** column is missing `order`, the visible order is the
   input `columns` array order — the consumer is authoritative.
3. Card ordering follows the same rule, scoped **per column**. The
   reducer never reorders cards across columns implicitly.
4. `order` is a real number, not an integer. Move operations
   compute the new `order` as the midpoint between two neighbors so
   consumers with a single monotonic key can persist without
   re-numbering. The reducer never mutates `order` on cards it does
   not touch.

`ordering.ts` exports pure helpers:

```ts
export function computeColumnOrder(cols: readonly KanbanColumn[]): readonly KanbanColumn[];
export function computeCardOrder(cards: readonly KanbanCard[]): readonly KanbanCard[];
export function nextOrderBetween(before: number | null, after: number | null): number;
```

`nextOrderBetween(null, null)` returns `0`. `nextOrderBetween(a, null)`
returns `a + 1`. `nextOrderBetween(null, b)` returns `b - 1`.
`nextOrderBetween(a, b)` returns `(a + b) / 2`. Every helper is pure,
tested, and framework-independent.

### Empty columns

An empty column is a first-class shape — Kanban must render it as a
drop target, expose the ARIA hooks a screen-reader user relies on
(`role="list"` with `aria-label`), and mount a
`<Kanban.EmptyState>` slot for the consumer's placeholder content.
The reducer never spawns a synthetic card to "fill" an empty column,
and the drag reducer never rejects an empty column as an invalid
drop target.

---

## State Model

The Kanban owns a small state slice covering **interaction state
only** — the data (`columns`, `cards`) flows through props.

```ts
export type KanbanSelection =
  | { readonly kind: "none" }
  | { readonly kind: "card"; readonly cardId: KanbanCardId }
  | { readonly kind: "column"; readonly columnId: KanbanColumnId };

export type KanbanDrag =
  | { readonly kind: "idle" }
  | {
      readonly kind: "card";
      readonly cardId: KanbanCardId;
      readonly fromColumnId: KanbanColumnId;
      readonly overColumnId: KanbanColumnId | null;
      readonly overIndex: number | null;
    }
  | {
      readonly kind: "column";
      readonly columnId: KanbanColumnId;
      readonly overIndex: number | null;
    };

export interface KanbanState {
  readonly selection: KanbanSelection;
  readonly drag: KanbanDrag;
  readonly focusedCardId: KanbanCardId | null;
  readonly focusedColumnId: KanbanColumnId | null;
}
```

- **`selection`** — single-select of one card OR one column. Set on
  pointer click, on keyboard focus commit, and via the controllable
  `selection` prop.
- **`drag`** — the in-flight interaction. `"idle"` when no drag is
  active; `"card"` during card drag; `"column"` during column drag.
  Pointer and keyboard produce identical drag state.
- **`focusedCardId` / `focusedColumnId`** — the roving tabindex
  target. Persisted across renders so keyboard flow survives
  re-render.

Every slice is controllable via a `value` / `defaultValue` /
`onXChange` triple. Every setter is a stable `useCallback` — no
prop-drilling of dispatch.

---

## Column Movement Policy

### Public props

- **`columnDraggable?: boolean`** — global default (`true`). Override
  per column via `column.meta?.draggable === false`.
- **`columnDropBoundary?: "board" | "none"`** — restricts where
  columns may move. Default `"board"`.

### Rules

1. Columns move only along the horizontal axis. Vertical drag of a
   column does not swap it with a card.
2. A column marked non-draggable via `meta.draggable === false`
   participates as a valid drop position but cannot be picked up.
3. `columnDropBoundary: "board"` clamps the drop position to the
   visible board — columns cannot be dropped "outside".
4. The reducer computes the new index using the pointer / keyboard
   cursor and fires `onColumnMove({ column, fromIndex, toIndex })`
   on release. The consumer applies the reorder and passes back
   the new `columns` array.

---

## Card Movement Policy

### Public props

- **`cardDraggable?: boolean`** — global default (`true`). Override
  per card via `card.meta?.draggable === false`.
- **`cardDropBoundary?: "board" | "column" | "none"`** — default
  `"board"`. `"column"` restricts a card to its current column
  (intra-column reorder only). `"none"` allows any position (rare;
  callback may reject).
- **`dropAcceptance?: (context) => boolean`** — consumer predicate
  invoked before every drop attempt. Return `false` to reject.

  ```ts
  export interface KanbanDropAcceptanceContext<TCard extends KanbanCard = KanbanCard> {
    readonly card: TCard;
    readonly fromColumnId: KanbanColumnId;
    readonly toColumnId: KanbanColumnId;
    readonly toIndex: number;
  }
  ```

### Rules

1. Cards move within a column (reorder) and across columns
   (transfer). Both fire the same `onCardMove` callback with the
   same payload shape (fromColumnId === toColumnId for reorders).
2. A card marked non-draggable does not accept a pointer down or a
   keyboard pickup. It still renders and remains focusable.
3. `dropAcceptance` runs **before** `onCardMove`. When it returns
   `false`, the ghost snaps back to the origin, no callback fires,
   the announcer speaks the rejection message.
4. Duration bounds and boundary clamping are consumer concerns —
   the Kanban never rejects a callback-returned range.

### `onCardMove` payload

```ts
export interface KanbanCardMovePayload<TCard extends KanbanCard = KanbanCard> {
  readonly card: TCard;
  readonly fromColumnId: KanbanColumnId;
  readonly fromIndex: number;
  readonly toColumnId: KanbanColumnId;
  readonly toIndex: number;
  readonly order: number;
}
```

`order` is the value returned by `nextOrderBetween` for the target
neighbors, so consumers with an `order`-column persistence layer can
write it directly.

---

## Drag / Drop Boundaries

- **`dragActivationDistance?: number`** — pixels the pointer must
  travel before a drag begins. Default `4` px. Below the threshold,
  the pointerdown is treated as a click.
- **`dragScrollEdgePx?: number`** — pixels from a viewport edge that
  trigger auto-scroll during drag. Default `48` px.
- **`dragScrollSpeedPxPerFrame?: number`** — auto-scroll velocity.
  Default `12` px per animation frame.
- **`cardDropBoundary` / `columnDropBoundary`** — as documented
  above.
- **`dragDisabled?: boolean`** — global kill switch. When `true`,
  pointer drag is disabled everywhere; keyboard move remains active
  so a11y is preserved.

### Ghost and drop indicator

- A single ghost element renders under `document.body` via `Portal`
  during drag. The ghost respects `renderCard` — it looks identical
  to the source card unless the consumer supplies
  `<Kanban.DragPreview>`.
- A drop indicator is a 2 px line rendered between the two neighbors
  the card would land between (or at the top / bottom of a column
  for the extreme positions).
- Pointer capture is set on the origin element for the duration of
  the drag; `pointercancel` and `Escape` revert without firing a
  callback.

---

## Keyboard Model

Drag/drop is **not** the only interaction method. Every drag gesture
has a fully-supported keyboard equivalent.

### Focus stops

Focus flows through three stops:

1. Board header (view-level toolbar slot, when provided).
2. Column header (roving over columns).
3. Card list (roving over cards within the focused column).

Within each list, the roving tabindex owns exactly one focus target.
Tab and Shift+Tab move between the three stops; arrow keys move
inside a stop.

### Bindings

| Key                            | Scope         | Action                                   |
| ------------------------------ | ------------- | ---------------------------------------- |
| `ArrowUp` / `ArrowDown`        | card list     | Move focus within column                 |
| `ArrowLeft` / `ArrowRight`     | card list     | Move focus to sibling column             |
| `Home` / `End`                 | card list     | First / last card in column              |
| `Ctrl+Home` / `Ctrl+End`       | board         | First / last card in first / last column |
| `ArrowLeft` / `ArrowRight`     | column header | Move focus between columns               |
| `Enter` / `F2` / `Space`       | card          | Fire `onCardClick`                       |
| `Space` (long press or double) | card          | Pick up card for keyboard move           |
| Arrows during keyboard move    | card          | Move insertion index                     |
| `Space` during keyboard move   | card          | Drop at current index (commit)           |
| `Escape` during keyboard move  | card          | Cancel (revert)                          |
| `Enter` on column header       | column        | Pick up column for keyboard move         |
| Arrows during column move      | column        | Move column index                        |
| `Space` during column move     | column        | Commit                                   |
| `Escape` during column move    | column        | Cancel                                   |
| `Delete` on selected card      | card          | Fire `onCardDelete` when consumer wires  |

The **pickup gesture on cards** is a modified `Space`:

- A single tap of `Space` fires `onCardClick` (activate).
- A **hold** of `Space` for `dragActivationHoldMs` (default `250`) or
  a **double-tap** enters keyboard-move mode.

This resolves the "Space is both activate and pickup" ambiguity. The
threshold is configurable via `dragActivationHoldMs`.

RTL swaps the semantic meaning of `ArrowLeft` / `ArrowRight` for
horizontal column navigation only. Column-header nav within a row of
columns follows the visual layout.

### Announcer

A single `aria-live="polite"` region announces every state change
that a screen-reader user needs to hear:

- Pickup: `"Card {title} picked up. Column {columnTitle}, position
{n} of {total}."`
- Over: `"Card {title} moved to position {n} of {total} in column
{columnTitle}."`
- Drop: `"Card {title} dropped in column {columnTitle} at position
{n}."`
- Cancel: `"Card {title} returned to column {columnTitle} at position
{origN}."`

Every message is localizable via the `messages` prop, mirroring the
Scheduler pattern.

---

## Virtualization

Virtualization is **opt-in** per axis and reuses existing
infrastructure.

### Vertical (cards inside a column)

- **`virtualizeCards?: boolean`** — default `false`.
- **`cardHeight?: number`** — required when
  `virtualizeCards === true`. Card heights are static (fixed-size v1
  — matches DataGrid).
- Reuses `computeVirtualizedRange` from `@kairoui/utils` and
  `useVirtualizer` from `@kairoui/hooks`.

### Horizontal (columns inside the board)

- **`virtualizeColumns?: boolean`** — default `false`.
- **`columnWidth?: number`** — required when
  `virtualizeColumns === true`.
- Same virtualization primitive, rotated to the horizontal axis.

### Compatibility rules

1. Virtualization does **not** change the ARIA structure. Rendered
   cards and columns still carry their real `aria-posinset` /
   `aria-setsize` so a screen reader hears the correct position out
   of the total, even when only a window is in the DOM.
2. Focus survives a virtualization scroll. If the focused card
   scrolls out of view, focus persists on the row that is still
   mounted at the boundary; the next arrow-key press scrolls the
   focused card back into view.
3. Drag ghost mounts through `Portal` under `document.body`. It is
   unaffected by virtualization; the source card slot is preserved
   for the duration of the drag.
4. **Nothing prevents combining** vertical + horizontal
   virtualization. Each is orthogonal.

Consumers who need windowing beyond fixed-size cards / columns
(variable heights, per-card measurement) wait for the
variable-height ADR that ships with the DataGrid follow-up.

---

## Custom Card Rendering

Two paths — both required to be present.

### `renderCard` prop

```ts
export type KanbanCardRenderer<TCard extends KanbanCard = KanbanCard> = (context: {
  readonly card: TCard;
  readonly column: KanbanColumn;
  readonly isSelected: boolean;
  readonly isDragging: boolean;
  readonly isKeyboardMoving: boolean;
}) => ReactNode;
```

Passed on the root: `renderCard?: KanbanCardRenderer<TCard>`.

### `<Kanban.CardTemplate>` declarative slot

Mirrors `<Scheduler.EventTemplate>`. Registers a renderer via
`useEffect`; last one wins. The `renderCard` prop wins when both are
present.

```tsx
<Kanban columns={cols} cards={cards}>
  <Kanban.Board>
    <Kanban.CardTemplate
      render={({ card, isSelected }) => <MyCard card={card} highlighted={isSelected} />}
    />
    {/* default column / card children */}
  </Kanban.Board>
</Kanban>
```

### Default renderer

When neither renderer is supplied, the Kanban renders a small
`title` / `description` card. It exists solely so consumers can
smoke-test the board with no wiring.

---

## Consumer Callbacks

Every callback is fired **after** the interaction resolves, with
plain-data payloads. The Kanban never persists changes — the consumer
applies each payload and the new `columns` / `cards` flow back
through the props.

```ts
export interface KanbanCardClickPayload<TCard extends KanbanCard = KanbanCard> {
  readonly card: TCard;
  readonly column: KanbanColumn;
  readonly nativeEvent: MouseEvent | KeyboardEvent;
}

export interface KanbanColumnMovePayload {
  readonly column: KanbanColumn;
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly order: number;
}

export interface KanbanDropPayload<TCard extends KanbanCard = KanbanCard> {
  readonly card: TCard;
  readonly fromColumnId: KanbanColumnId;
  readonly fromIndex: number;
  readonly toColumnId: KanbanColumnId;
  readonly toIndex: number;
}
```

Root props:

- `onCardClick?: (payload: KanbanCardClickPayload<TCard>) => void`
- `onCardMove?: (payload: KanbanCardMovePayload<TCard>) => void | Promise<void>`
- `onColumnMove?: (payload: KanbanColumnMovePayload) => void | Promise<void>`
- `onDrop?: (payload: KanbanDropPayload<TCard>) => void`
- `onSelectionChange?: (selection: KanbanSelection) => void`
- `onCardDelete?: (card: TCard) => void` — optional; wires the
  `Delete` key.

Callbacks that return `Promise<void>` are awaited only to preserve
error propagation. Optimistic rendering is a consumer concern — the
Kanban waits for `cards`/`columns` to update.

### Callback failure

Throwing / rejecting from `onCardMove` or `onColumnMove` reverts the
provisional ghost and leaves the board visually unchanged. No error
UI is rendered by the Kanban; the consumer surfaces the error via a
Toast.

---

## Controlled Data and State

Controllable slices (per KairoUI pattern):

- `columns` / (no `defaultColumns`; input is always required and
  authoritative).
- `cards` / (same rule).
- `selection?` / `defaultSelection?` / `onSelectionChange?`.
- `focusedCardId?` / `defaultFocusedCardId?` / `onFocusChange?`.
- `focusedColumnId?` / `defaultFocusedColumnId?` — mirror of
  above.

`columns` and `cards` are **input-controlled only** — they are the
authoritative source of truth. The Kanban treats them as immutable
snapshots and never writes back to them.

The reducer maintains transient state (drag, selection, focus) via
`useControllableState`. Every slice's onChange is deduplicated —
identical setState calls do not fire the callback twice.

---

## Locale and RTL

- **`locale?: string`** — BCP 47 tag passed to `Intl.DateTimeFormat`
  for any card metadata that renders dates (consumer controls this
  through `renderCard`). Defaults to `"en"`.
- **`dir?: "ltr" | "rtl"`** — visual flow. In RTL:
  - Columns lay out right-to-left in the board.
  - Card list still reads top-to-bottom.
  - Arrow key semantics for horizontal moves are **swapped** so
    `ArrowRight` moves to the visually-adjacent right neighbor (which
    is the logically-previous column in RTL).

The Kanban ships no built-in translations. Every user-facing string
comes from the `messages` prop, defaulting to English.

---

## Accessibility

- **Root** — `role="application"` +
  `aria-roledescription="Kanban board"`.
- **Board** — `role="list"` `aria-orientation="horizontal"`.
- **Column** — `role="listitem"` at the board level and
  `role="list"` `aria-orientation="vertical"` for its own card list.
  Each column exposes `aria-label` composed from its title.
- **Column header** — `role="button"` with `aria-grabbed` for
  keyboard-move state (deprecated `aria-grabbed` is used
  deliberately: it is the most widely supported hook screen-reader
  users still receive for the drag-in-progress state; supplemented
  by the live-region announcer). The reducer also exposes
  `data-kanban-grabbed=""` for CSS.
- **Card** — `<button>` (implicit role=button) with
  `aria-label`, `aria-roledescription="Card"`, `aria-pressed`
  (matches Scheduler event pattern — ARIA 1.2 forbids
  `aria-selected` on `role=button`), and `aria-posinset` /
  `aria-setsize` for reorderable list positioning.
- **Drop indicator** — decorative; `aria-hidden="true"`.
- **Empty column** — `<Kanban.EmptyState>` slot rendered inside the
  column body; the column body announces `"Column {title}, empty
drop target."` when a drag enters an empty column.
- **Live region** — one `aria-live="polite"` region owned by the
  root. Text is localizable via `messages`.
- **Focus preservation** — pickup, over, drop, cancel all preserve
  focus on the moved card (or on the origin position when
  cancelling).
- **Reduced motion** — drag ghost animation, drop-indicator
  animation, and virtualization scroll-into-view all honor
  `prefers-reduced-motion`.

A dedicated a11y audit ships with KUI-ENT-014.

---

## Public vs Internal API

Public (exported from `@kairoui-pro/kanban`):

- Components: `Kanban`, `Kanban.Board`, `Kanban.Column`,
  `Kanban.ColumnHeader`, `Kanban.ColumnBody`, `Kanban.ColumnFooter`,
  `Kanban.Card`, `Kanban.CardTemplate`, `Kanban.EmptyState`,
  `Kanban.DragPreview` (plus bare siblings).
- Hooks: `useKanban`, `useKanbanColumn`, `useKanbanCard`,
  `useKanbanSelection`, `useKanbanDrag`.
- Types: `KanbanRootProps<TCard>`, `KanbanColumn`, `KanbanCard`,
  `KanbanColumnId`, `KanbanCardId`, `KanbanSelection`, `KanbanDrag`,
  `KanbanState`, `KanbanCardMovePayload`, `KanbanColumnMovePayload`,
  `KanbanDropPayload`, `KanbanCardClickPayload`,
  `KanbanCardRenderer`, `KanbanDropAcceptanceContext`,
  `KanbanMessages`.
- Values: `defaultKanbanKeymap`, `computeColumnOrder`,
  `computeCardOrder`, `nextOrderBetween`, `assertValidKanbanColumn`,
  `assertValidKanbanCard`, `kanbanStyleContract`.

Internal (not exported):

- Reducer implementations (`use-kanban-state.ts` internals).
- Pointer / drag state machines.
- Prefixed helpers (`_clampToBoundary`, `_computeDropIndex`).
- CSS-in-source constants.

The barrel never re-exports a symbol whose name starts with `_` or a
type whose name starts with `Internal`.

---

## SSR Requirements

Kanban adopts the same SSR posture proven in Phases 13 / 14 so far:

1. **First render is server-safe.** No `window`, `document`,
   `localStorage`, `navigator`, `matchMedia`, or `requestAnimationFrame`
   at module load or during initial render.
2. **No hydration mismatches.** Server renders the same columns /
   cards the first client render produces. Drag ghost and
   drop-indicator are client-only (mounted after `hasMounted`).
3. **Virtualization degrades.** Server renders all cards / columns
   unwindowed. Client swaps to windowed rendering after the scroll
   container is measured.
4. **`use client` is not used** in source. Consumers in RSC pipelines
   mark the Kanban wrappers as client boundaries at their own level.

---

## Bundle Isolation and Tree-Shaking

- `@kairoui-pro/kanban` declares only these runtime dependencies:
  `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`. `react` and
  `react-dom` are peer.
- No dependency on any other `@kairoui-pro/*` package.
- Named exports only; the root barrel re-exports symbols directly.
- **Compound children are individually tree-shakeable.** A consumer
  importing only `Kanban.Column` should not pay for the drag-preview
  or virtualization helpers.
- **Order and identity helpers are separable.** `computeColumnOrder`,
  `computeCardOrder`, `nextOrderBetween`,
  `assertValidKanbanColumn`, `assertValidKanbanCard` are exported at
  the root so consumers building custom boards can reuse them
  without mounting `Kanban`.

Provisional bundle budgets, reset against the first release-candidate
build in KUI-ENT-014:

| Entry point                      | Raw target | Gzip target |
| -------------------------------- | ---------- | ----------- |
| `@kairoui-pro/kanban/index.js`   | 60 KB      | 18 KB       |
| `@kairoui-pro/kanban/styles.css` | 8 KB       | 2.5 KB      |

---

## Shared Infrastructure Ownership

Every reused capability lives in its current owner package. Kanban
consumes public APIs; it does not fork or shim them.

| Capability                             | Owner                                 | Consumed by               |
| -------------------------------------- | ------------------------------------- | ------------------------- |
| Composition, slots, variants           | `@kairoui/core/composition`           | every component           |
| Overlay infra (`Portal`, `FocusScope`) | `@kairoui/core/components/overlay`    | drag ghost + drop preview |
| Virtualization math + hook             | `@kairoui/utils`, `@kairoui/hooks`    | column body + board       |
| Style contract + variant engine        | `@kairoui/core`                       | every component           |
| Theme / density / SSR provider         | `@kairoui/core`, `@kairoui/theme`     | every component           |
| Tokens                                 | `@kairoui/tokens`                     | every component           |
| Roving-tabindex helpers                | `@kairoui/core/components/collection` | column list + card list   |
| Controllable-state pattern             | `@kairoui/hooks`                      | selection / focus         |

When Kanban discovers a gap in a free package, the fix lands **in the
free package first** (per KUI-ENT-001) — never as a Pro-only shim.

---

## What KUI-ENT-012 Does Not Do

- Does **not** create the `@kairoui-pro/kanban` package.
- Does **not** write any Kanban source code.
- Does **not** implement drag/drop, keyboard reorder, or
  virtualization.
- Does **not** modify `DataGrid`, `Scheduler`, or any free-tier
  component.
- Does **not** add `@kairoui-pro/kanban` to any `package.json`,
  lint rule, or docs-generator configuration.
- Does **not** change bundle budgets or the docs generator config.

Later tasks (KUI-ENT-013, KUI-ENT-014) introduce the package,
source, and tests; each does so with its own review and its own
bundle-budget update, in line with the rules above.

---

## Change Control

Amendments require a new task ID under Phase 14 and must preserve:

1. The dependency direction (`@kairoui-pro/*` → `@kairoui/*`, never
   the reverse).
2. The **consumer-owned persistence** rule. The Kanban MUST NOT
   introduce a storage adapter, HTTP client, or serialization
   contract of its own.
3. The **no hard-coded statuses** rule. The Kanban ships zero
   opinions about what a column means.
4. The **drag/drop is not the only input** rule. Keyboard move MUST
   remain a first-class equivalent for every drag gesture.
5. The SSR / a11y / bundle-isolation guarantees stated above.

Anything else is fair game. Record the amending task ID here on
change.
