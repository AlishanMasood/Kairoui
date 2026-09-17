# Phase 13 — Virtualization Architecture (KUI-ADV-013)

Status: **Architecture defined**. Implementation follows in KUI-ADV-014
(hook) and KUI-ADV-015 (DataTable integration).

---

## Purpose

Provide a **minimal, dependency-free, accessibility-preserving** virtualization
foundation that lets any ordered collection render only the rows currently in
view. The scope is deliberately small:

- Pure math for viewport → visible-range computation.
- A React hook that binds it to a scroll parent.
- A DataTable opt-in prop that swaps the row list for a windowed slice.

Everything else — variable heights, tree windowing, horizontal virtualization,
grid layouts, `IntersectionObserver` sentinels, dynamic measurement — is
out of scope for Phase 13.

---

## Scope

### In scope for the KUI-ADV-013/014/015 arc

- `virtualizer.ts` — pure `computeVirtualizedRange` math.
- `use-virtualizer.ts` — React hook wrapping the math with a scroll listener.
- `DataTable` opt-in `virtualized?: boolean` + `rowHeight?: number` +
  `overscan?: number`.
- SSR fallback (render all rows on server, switch on client).
- Accessibility posture: correct semantics preserved via top/bottom spacers
  and per-row `aria-rowindex` when applicable.

### Explicitly out of scope

- Variable-height virtualization (deferred to Phase 14).
- Third-party virtualization libraries (`react-virtuoso`, `react-window`,
  `@tanstack/react-virtual`, etc.). Adding one requires an ADR.
- Virtualized TreeView. TreeView renders declarative `<li>` children; row
  windowing does not map cleanly to that model. Deferred.
- Horizontal virtualization / windowed columns.
- Grid / masonry / staggered layouts.
- `IntersectionObserver` sentinels for infinite loading. Infinite loading is
  a data-fetching concern; virtualization is a rendering concern.
- `ResizeObserver`-based dynamic measurement.
- Editable cell mode with focused row preservation across windowing (deferred
  to a future editing task).

---

## Data Model

### Virtual viewport

The **virtual viewport** is the portion of a **scroll parent** currently
displaying items. Two lengths define it:

- `viewportHeight` — the scroll parent's inner height in CSS pixels.
- `scrollTop` — how many CSS pixels have scrolled past the top edge.

A viewport is not a DOM node. It is a pair of numbers observed on every
scroll event.

### Visible range

Given a viewport plus a total item count and a per-item height, the
**visible range** is the contiguous `[startIndex, endIndex)` half-open
interval of items whose bounding boxes intersect the viewport.

```ts
export interface VirtualizerConfig {
  /** Total number of items in the underlying collection. */
  readonly count: number;
  /** Fixed row height in CSS pixels. v1 is fixed-size only. */
  readonly rowHeight: number;
  /** Extra rows to render above and below the viewport. Default 3. */
  readonly overscan?: number;
  /** Current scroll parent inner height. */
  readonly viewportHeight: number;
  /** Current scroll offset. */
  readonly scrollTop: number;
}

export interface VirtualizedRange {
  readonly startIndex: number;
  /** Half-open: renders `items.slice(startIndex, endIndex)`. */
  readonly endIndex: number;
  /** CSS pixels of empty space above the rendered slice. */
  readonly paddingTop: number;
  /** CSS pixels of empty space below the rendered slice. */
  readonly paddingBottom: number;
  /** Total virtual scroll height (`count * rowHeight`). Useful for scrollbar sizing. */
  readonly totalHeight: number;
}

export function computeVirtualizedRange(cfg: VirtualizerConfig): VirtualizedRange;
```

### Overscan

**Overscan** is the number of extra rows rendered above and below the strict
visible range. It has three purposes:

1. Smooths fast scrolling by hiding the pop-in at the leading edge.
2. Preserves in-DOM keyboard focus during small scroll jitter.
3. Lets `Tab` reach a not-quite-visible row without needing scrollIntoView.

Default `overscan = 3`. Consumers can raise it for very fast scrolling or
lower it to `0` to minimize DOM cost.

### Fixed-size items

v1 assumes **every row has the same height**. This is the constraint that
lets `computeVirtualizedRange` be pure math (`floor` and `ceil` over
`scrollTop / rowHeight`) with no measurement, no `ResizeObserver`, no cache
invalidation.

For DataTable, this matches how consumers already style rows via
`data-row-height` / CSS variables.

### Variable-size future compatibility

Variable heights are a **v2 concern**. The v1 API leaves room for it:

- `rowHeight` is `number` in v1. A future version can widen to
  `number | (index: number) => number` without breaking existing callers.
- `VirtualizedRange` already returns `paddingTop` / `paddingBottom` rather
  than deriving them from a constant, so a measurement-cache implementation
  can populate the same shape.
- A future `useMeasuredVirtualizer` hook can layer measurement on top of the
  pure math without changing v1's contract.

Any deeper contract change (measured cache API, off-screen probe rows,
sub-pixel accumulators) is postponed and will get its own ADR.

### Scroll offset

Scroll offset is read from the scroll parent — either the element passed to
`use-virtualizer`, or `window` when the scroll parent is the page itself.
`scrollTop` is coerced through `Math.max(0, offset)` inside the pure math so
elastic overscroll on iOS never produces negative indices.

Bounds:

- `startIndex >= 0`
- `endIndex <= count`
- `paddingTop + (endIndex - startIndex) * rowHeight + paddingBottom === totalHeight`

The invariant above is asserted in tests.

### Measurement

v1 measures **nothing** at runtime. `rowHeight` is a consumer input. The
consumer is responsible for ensuring their CSS matches the value they pass —
if it drifts, rows will visually overlap or leave gaps but nothing crashes.

Consumers who need dynamic heights should not enable virtualization in v1.

### Item identity

DataTable already has `getRowId(row): RowId`. Virtualization does **not**
change the identity model — it slices the pre-sorted / pre-filtered array
by index and preserves `key={getRowId(row)}` on every rendered row.

For non-DataTable consumers, item identity remains a per-callsite decision.
The math itself never touches row data.

---

## React Hook

```ts
export interface UseVirtualizerOptions {
  readonly count: number;
  readonly rowHeight: number;
  readonly overscan?: number;
  /** Ref to the scroll parent. Defaults to `window` when null. */
  readonly scrollParentRef: React.RefObject<HTMLElement | null>;
  /** Optional initial viewport height override for SSR. */
  readonly initialViewportHeight?: number;
}

export interface UseVirtualizerReturn extends VirtualizedRange {
  /** True once the client has mounted and observed a real viewport. */
  readonly ready: boolean;
}

export function useVirtualizer(options: UseVirtualizerOptions): UseVirtualizerReturn;
```

Behavior:

1. Reads `scrollTop` and viewport height from the ref on mount via
   `useIsomorphicLayoutEffect`.
2. Subscribes a `passive: true` `scroll` handler to the scroll parent.
3. Coalesces recomputation with `requestAnimationFrame` — one recompute
   per animation frame regardless of scroll event storm.
4. Cleans up all subscriptions on unmount.
5. On SSR, returns a pre-computed range that either uses
   `initialViewportHeight` or covers `count` items entirely (see SSR
   fallback below).
6. Emits `ready: false` for one render on the server + first client render,
   then `ready: true` after the first `useIsomorphicLayoutEffect` fires.
   Consumers use this to gate any UI that would flash during hydration.

No `ResizeObserver` is subscribed in v1. If the scroll parent changes size,
consumers can force a re-render by any means (state update, key bump); the
hook re-reads dimensions on every render.

---

## SSR Fallback and Hydration

Virtualization requires knowing the viewport height, which requires the DOM,
which is unavailable during SSR. The policy is:

**Server renders every row** (no windowing). Client hydrates the same
markup, then switches to windowed rendering on the **second** render after
mount.

Concrete rules:

1. On the server, `computeVirtualizedRange` still runs, but with the SSR
   defaults documented below. It always returns
   `{ startIndex: 0, endIndex: count, paddingTop: 0, paddingBottom: 0 }`
   when the effective viewport height is `>= totalHeight`.
2. If the consumer supplies `initialViewportHeight`, the server uses it and
   ships a partial slice. Consumers should only opt into this when they
   know the SEO / print / no-JS UX can accept the truncation.
3. On the client, the first render must **match the server output byte for
   byte**. The hook returns the SSR range on render 0, then the real range
   on render 1 (after `useIsomorphicLayoutEffect` reads dimensions and
   requests a re-render).
4. `ready` starts `false` and flips to `true` on the second render. UI that
   depends on real dimensions (skeleton fades, focus scroll jumps) waits
   for `ready`.

Rationale: matching the server output means the standard React 19 hydration
model works with no `suppressHydrationWarning` escape hatches. The
one-render delay is invisible in practice and eliminates a whole class of
hydration crashes.

---

## Accessibility

Virtualization must not degrade accessibility. Concrete requirements:

- **Row landmarks stay authoritative.** DataTable emits
  `aria-rowcount={count}` on `<table>` and `aria-rowindex` on each rendered
  `<tr>` so screen readers announce the true position even when only a
  slice is in the DOM.
- **Screen reader inspection order matches visual order.** The spacer
  elements are `aria-hidden="true"` `<tr>`s with `padding` / `height`
  driving layout, not focus.
- **Keyboard focus survives windowing.** If the focused row scrolls out of
  the visible range, DataTable does **not** remove it from the DOM.
  Implementations must keep any element that owns document focus mounted
  until focus moves elsewhere. The pure math never enforces this; the
  DataTable integration adds a "keep-focused" exception when computing the
  render slice.
- **`tab` never skips rows.** Between the top spacer and the first
  rendered row there is no focusable element; between the last rendered
  row and the bottom spacer there is likewise none. Tab order continues
  from the last rendered row to the next focusable element **below the
  scroll parent**. Consumers who want tab-to-scroll behavior can implement
  it in a separate keyboard layer.
- **Live regions stay quiet.** Windowing must not fire `aria-live`
  announcements for rows entering / leaving the viewport.
- **Print and no-JS render everything.** SSR fallback naturally handles
  this because virtualization is a client-only enhancement.
- **Sticky headers remain announced.** DataTable's `<thead>` is outside the
  scroll parent and never virtualized; nothing changes for the header.

Non-goals for accessibility:

- No focus trap. Users navigate with browser-standard keys and Tab
  continues out of the table normally.
- No autoscroll for keyboard navigation. That is a scroll-management
  concern, addressed independently if needed.

---

## Keyboard and Focus Interaction

- `PageUp` / `PageDown` remain browser-native. They scroll the scroll
  parent; the virtualizer recomputes and re-renders.
- `Home` / `End` on the DataTable body scroll to top / bottom by adjusting
  the scroll parent's `scrollTop`. The virtualizer recomputes. **No
  scrollIntoView on individual rows** because the row is not yet mounted.
- If a consumer needs to programmatically scroll to a specific row (e.g.
  "scroll to selected"), they compute the target `scrollTop` themselves as
  `index * rowHeight` and set `scrollParent.scrollTop = target`. A helper
  `scrollToIndex(scrollParent, index, rowHeight)` may ship in a future
  task; not in v1.
- Focus preservation: DataTable's `useRowSelection` already keys focus by
  row ID. When the focused row scrolls out of the render slice, DataTable
  keeps it mounted (see accessibility). When focus moves elsewhere, the
  virtualizer's next render releases the row.

---

## Integration Boundaries

### DataTable

Opt-in via a single prop:

```ts
interface DataTableRootProps<TRow> {
  // ... existing props
  readonly virtualized?: boolean;
  readonly rowHeight?: number; // required when virtualized === true
  readonly overscan?: number; // default 3
}
```

Behavior when `virtualized === true`:

- `rowHeight` **must** be provided; a runtime warning in dev if omitted.
- The scroll parent is the DataTable's own overflow container (a wrapping
  `<div>` around the `<table>`). Consumers can also nest the DataTable in
  their own scroll parent; the virtualizer walks up to the nearest
  overflow ancestor.
- `<tbody>` renders top and bottom spacer `<tr>`s with `padding-top` /
  `padding-bottom` (Firefox tables ignore `height` on `<tr>` — padding is
  the portable choice).
- Only rows in the visible range are rendered; the rest are absent from
  the DOM.
- Sort / filter / selection continue to operate on the underlying `data`
  array. Selection state does not change when rows are windowed out — a
  selected row that scrolls out of view remains selected.
- `getRowId(row)` is still used as `key` on every rendered row so React
  reconciliation is stable across scroll events.
- Server always renders all rows; client swaps to windowed rendering on
  the second render (see SSR).
- If `data.length` shrinks below the count consumed by the current visible
  range, the hook clamps `endIndex` to `count` on the next render — no
  runtime crash.

### TreeView

TreeView is **not** virtualized in v1. Justification:

- TreeView items are declarative `<TreeViewItem>` children, not indexed
  rows. Windowing them would require the consumer to opt into a
  data-driven model — that is a whole new component surface.
- Expanded / collapsed state changes the effective visible count per node,
  which invalidates fixed-height assumptions.
- TreeView instances are typically small (navigation menus, file trees
  with expand-on-demand). Virtualization overhead is rarely worth it.

TreeView **may** grow a virtualized variant in a later phase. When it
does, it will use the same `virtualizer.ts` math over a flattened
row-model derived from the tree, exposed as a separate compound API to
avoid breaking the declarative one.

### Other collections

`List`, `DescriptionList`, `Menu`, `NavigationMenu`, `Sidebar`,
`Breadcrumbs`, `Pagination`, and every other non-tabular collection is
**not** virtualized. These components render short, semantic markup and
never receive thousands of items in practice.

The general policy: **not everything is virtualized**. Virtualization
carries an accessibility cost (see above), a code-size cost, and a UX cost
(scroll bar oddness, focus jumps). It ships only where measured wins
justify it.

---

## Dependency Policy

- Zero runtime dependencies for the virtualizer. It is pure math + a
  `passive: true` scroll listener + `requestAnimationFrame`.
- No third-party virtualization library (`react-virtuoso`, `react-window`,
  `@tanstack/react-virtual`, `react-tiny-virtual-list`, `react-list`,
  etc.). Adding one requires an ADR that answers: (a) why the built-in
  math cannot cover the case, (b) bundle-size impact, (c) accessibility
  audit result for the imported library, (d) SSR compatibility.

---

## Testing Surface

- Pure math (`virtualizer.test.ts`):
  - Empty collection (`count === 0`) returns `startIndex = endIndex = 0`
    with zero padding.
  - `scrollTop === 0` returns `startIndex = 0`.
  - `scrollTop >= totalHeight` clamps `endIndex` to `count`.
  - Negative `scrollTop` is clamped to 0.
  - Overscan applies symmetrically at both edges (respecting bounds).
  - Padding invariant:
    `paddingTop + (endIndex - startIndex) * rowHeight + paddingBottom
=== totalHeight`.
  - Determinism: same inputs always produce the same output.

- Hook (`use-virtualizer.test.ts`):
  - SSR / first render returns a stable range that matches server output.
  - `ready` starts `false`, flips to `true` after mount.
  - Scroll events trigger recomputation.
  - Fast scroll storms coalesce to one recompute per frame.
  - Cleanup removes scroll listeners.

- DataTable integration (`data-table-virtualization.test.tsx`,
  future task):
  - `aria-rowcount` reflects the total, not the rendered slice.
  - `aria-rowindex` on each row matches its data index.
  - Focused row survives windowing.
  - Selection persists across scroll.
  - `virtualized={false}` (default) renders every row unchanged.

---

## Non-Goals (Enforcement)

- No implementation of any of the above in KUI-ADV-013. Types and this
  document are the deliverable.
- No third-party virtualization dependency without ADR.
- No blanket "virtualize everything" flag.
- No accessibility regressions traded for perf.
- No behavior change for consumers who never opt in.
