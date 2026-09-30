# Phase 14 — Permission Matrix Architecture (KUI-ENT-014)

Status: **Architecture defined**. Implementation follows in KUI-ENT-015
(matrix runtime + adapter contract) and KUI-ENT-016 (final Enterprise
DataGrid audit).

Depends on: `docs/architecture/PHASE14-ENTERPRISE-ARCHITECTURE.md`
(KUI-ENT-001) — package boundary, dependency direction, licensing
shape.

---

## Purpose

Permission Matrix is the fifth Pro surface. It renders **who can do
what** as a matrix of cells, with each cell driven by a value the
consumer supplies and mutated only through consumer callbacks. It
ships in `@kairoui-pro/permission-matrix`, reuses the KairoUI free
tier for grid, checkbox, and collection primitives, and adds the
matrix-specific layout + interaction model.

This document fixes the Permission Matrix's contracts before
implementation so KUI-ENT-015 and KUI-ENT-016 have zero degrees of
freedom on the public API, on the data model, on the cell state
machine, on presentation modes, and on the boundary between the
KairoUI UI layer and the consumer's backend.

**The Permission Matrix is a UI-only adapter.** It never defines a
backend permission model, never carries an opinion about roles or
resources, never persists values, and never performs authorization.

Nothing here writes runtime code. This is a contract-only ADR.

---

## Non-Negotiable Boundary: Backend Agnosticism

Before anything else, the following rules are **fixed by user
constraint** and cannot be relaxed by any downstream task:

1. **KairoUI does not dictate the shape of the consumer's permission
   store.** The `id`s of subjects, resources, and actions are opaque
   `string`s. The matrix stores no derivation of them, no synthesized
   identity, no assumed hierarchy.
2. **No RBAC / ABAC / policy DSL is embedded.** The matrix does not
   evaluate roles, groups, wildcards, denials, allow-lists, or any
   other policy semantics.
3. **No authorization.** The matrix never returns a "user has
   permission Y" answer. It only renders the value the consumer
   passes.
4. **No persistence.** Every mutation flows through a callback. The
   matrix stores nothing.
5. **No KairoUI-specific permission API.** Consumers do not need to
   restructure their backend to match a KairoUI shape. Adapters are
   the responsibility of the consumer; the matrix consumes plain
   `readonly` arrays.
6. **The matrix never emits network requests.** No fetch, no
   subscription, no push handshake.

If any of these rules would need to change in a follow-up task, that
task is out of scope for Phase 14 and requires a new ADR pre-approved
by the user.

---

## Scope

### In scope for KUI-ENT-014 through KUI-ENT-016

- Value contract: subject / resource / action / value tuples.
- Presentation modes: **Role × Permission** and **Resource × Action**.
- Cell state machine: `unset` / `granted` / `denied` / `inherited` /
  `indeterminate` / `disabled` / `read-only`.
- Row-group and column-group aggregation (visual only — no
  computation of policy).
- Keyboard-first navigation with roving tabindex.
- Direct-manipulation cell edits via checkbox / tri-state.
- Bulk actions: select-row / select-column / select-all with a
  single consumer callback per bulk change.
- Search / filter over subjects, resources, actions — using the
  Phase 13 filter model.
- Locale + RTL.
- Accessibility: WAI-ARIA grid pattern with column-header /
  row-header semantics and a live-region announcer.

### Explicitly out of scope for Phase 14

- **RBAC / ABAC schemas.** The matrix ships no `Role`, `Group`,
  `Policy`, or `Rule` types.
- **Persistence.** No storage adapter, no HTTP client, no offline
  queue.
- **Authorization checks.** The matrix does not answer "can user X
  do Y?" — it only renders values the consumer supplies.
- **Wildcards / inheritance evaluation.** The matrix accepts an
  `inherited` cell state from the consumer but never computes it.
- **Optimistic concurrency / conflict resolution.** Consumer
  concern.
- **Impact analysis / audit log.** Consumer concern.
- **Server-side filtering.** The Phase 13 filter model runs
  client-side by default; server-driven filtering is a follow-up.
- **Multi-tenant scoping.** The matrix knows nothing about tenants;
  the consumer scopes their input data.
- **Preview / diff UI.** The matrix reports the change through a
  callback; the consumer builds any diff surface.

### Deferred to a later Pro task (not KUI-ENT-014…016)

- Variable row heights for wrapped labels — v1 renders fixed-height
  rows (matches DataGrid v1).
- Column-axis virtualization for very-wide matrices (>500 columns).
- Consumer-supplied cell renderers beyond checkbox / tri-state.
- Bulk editing across arbitrary rectangular selections.

---

## Positioning Relative to Other Pro / Free Surfaces

Every Pro surface owns its shape; there is no overlap.

| Capability                                | `DataGrid` | `Scheduler`            | `Kanban`                      | `PermissionMatrix` |
| ----------------------------------------- | ---------- | ---------------------- | ----------------------------- | ------------------ |
| Tabular rows with typed columns           | ✔          | —                      | —                             | —                  |
| Events on a time axis                     | —          | ✔                      | —                             | —                  |
| Cards flowing across columns              | —          | —                      | ✔                             | —                  |
| Two-axis grid of on/off / tri-state cells | —          | —                      | —                             | ✔                  |
| Consumer-owned identity                   | ✔          | ✔                      | ✔                             | ✔                  |
| Keyboard-first navigation                 | ✔          | ✔                      | ✔                             | ✔                  |
| Virtualized rows                          | ✔          | day/week               | ✔                             | ✔                  |
| ARIA role                                 | `grid`     | `application` + `grid` | `application` + list-of-lists | `grid`             |

If a consumer needs cell-level "does role X have action Y on resource
Z?" boolean rendering, the answer is Permission Matrix — never
DataGrid or Scheduler.

The Permission Matrix **could be implemented on top of DataGrid** —
but a stricter API surface (two-axis inputs, tri-state cells) makes
it its own component so consumers do not have to configure column
model + row model + editing to solve a small, well-defined problem.

---

## Package Layout

Public exports live at the package root only, per the KairoUI export
policy. No internal deep paths are exported except `./styles.css`.

```
@kairoui-pro/permission-matrix/
  src/
    permission-matrix.tsx           // <PermissionMatrix> root + compound children
    permission-matrix-types.ts      // Public prop / event / state types
    permission-matrix-context.ts    // React context (public read hook)
    cell-state.ts                   // Pure state-machine helpers
    identity.ts                     // Id validation + duplicate checks
    layout.ts                       // Row / column dimension helpers
    keymap.ts                       // Documented default key bindings
    use-matrix-state.ts             // Composed hook used by the root
    use-cell-focus.ts               // Roving tabindex for cells
    permission-matrix-messages.ts   // Default announcer / label strings
    styles.css                      // Component styles (only side-effect)
    index.ts                        // Public barrel
```

Package `sideEffects = ["**/*.css"]`. Named exports only. No default
exports. The barrel re-exports symbols directly (no barrel of
barrels).

**Compound component surface**:

- `PermissionMatrix` — root
- `PermissionMatrix.Header` — top toolbar + search slot
- `PermissionMatrix.Table` — scroll container that hosts rows /
  columns
- `PermissionMatrix.ColumnHeader` — column header cell (action or
  permission)
- `PermissionMatrix.RowHeader` — row header cell (subject / role or
  resource)
- `PermissionMatrix.Cell` — one cell (tri-state checkbox with
  `unset` / `granted` / `denied` / `inherited` states)
- `PermissionMatrix.EmptyState` — placeholder for zero rows or zero
  columns
- `PermissionMatrix.LegendItem` — small legend row explaining each
  cell state (consumer decides icon set)

Each compound child is also exported as a bare named export
(`PermissionMatrixHeader`, `PermissionMatrixCell`, …).

---

## Data Model

### Presentation modes

Two supported modes fixed by the ADR. A future task may add more.

| Mode              | Row axis       | Column axis |
| ----------------- | -------------- | ----------- |
| `role-permission` | Role / subject | Permission  |
| `resource-action` | Resource       | Action      |

Both modes share the same underlying data shape. The `mode` prop only
controls default column/row labels and default announcer strings.

### Identity contracts

Every axis element carries a **stable, consumer-owned identity**.
Duplicate ids and unknown id references throw `RangeError` at the
pipeline boundary.

```ts
export type PermissionSubjectId = string;
export type PermissionActionId = string;

export interface PermissionSubject {
  readonly id: PermissionSubjectId;
  readonly label: string;
  /** Optional group id — cosmetic only. */
  readonly groupId?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface PermissionAction {
  readonly id: PermissionActionId;
  readonly label: string;
  /** Optional group id — cosmetic only. */
  readonly groupId?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}
```

- Subject / action ids are opaque `string`s. No wildcards, no
  hierarchy, no expressions. What the consumer passes is what the
  matrix uses.
- `groupId` is a **cosmetic** grouping key. The matrix may render
  visual separators; it does not compute anything from it.
- Group headers themselves are not first-class entities in v1 — the
  matrix groups by `groupId` in stable input order.

### Cell values

Cells are addressed by `{ subjectId, actionId }`. Values are
consumer-supplied; the matrix computes nothing.

```ts
export type PermissionCellState = "granted" | "denied" | "unset" | "inherited" | "indeterminate";

export interface PermissionCell {
  readonly subjectId: PermissionSubjectId;
  readonly actionId: PermissionActionId;
  readonly state: PermissionCellState;
  /** Cell-level disabled — consumer forbids editing this cell. */
  readonly disabled?: boolean;
  /** Cell-level read-only — consumer forbids editing but focus / hover work. */
  readonly readOnly?: boolean;
  /** Optional tooltip / helper text surfaced by the consumer's renderer. */
  readonly label?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}
```

**Value semantics — fixed by ADR**:

- `"granted"` — permission is on.
- `"denied"` — permission is explicitly off (distinct from `"unset"`
  because a consumer may need to model explicit denies).
- `"unset"` — permission is neither granted nor denied. Renders as
  an empty checkbox.
- `"inherited"` — the value is derived from a parent group / role /
  organizational hierarchy the **consumer** owns. The matrix
  displays the state hint but never computes inheritance itself.
- `"indeterminate"` — mixed value across a subgroup. Same rule —
  consumer supplies it; matrix renders it. Consumer typically emits
  this for aggregated rows / columns.

A missing cell in the `cells` array is treated as `"unset"`. The
matrix never inserts synthetic cells to fill gaps.

### Value stream

Consumers pass three read-only arrays: `subjects`, `actions`, and
`cells`. The matrix never mutates them; every mutation flows through
`onCellChange` / `onBulkChange` and the consumer applies it to their
own store. The new arrays flow back through props.

```ts
export interface PermissionMatrixRootProps {
  readonly mode?: "role-permission" | "resource-action";
  readonly subjects: readonly PermissionSubject[];
  readonly actions: readonly PermissionAction[];
  readonly cells: readonly PermissionCell[];
  // ...
}
```

---

## Cell State Machine

The state machine is **pure and framework-independent**. Consumers
who want to apply changes without mounting the matrix can import the
transition helpers directly.

### Toggle transitions

The default `toggleCell(state)` transition rules — configurable via
`toggleMode`:

| Mode                | Sequence                                       |
| ------------------- | ---------------------------------------------- |
| `"grant-only"`      | `unset` → `granted` → `unset`                  |
| `"grant-deny"`      | `unset` → `granted` → `denied` → `unset`       |
| `"grant-deny-only"` | `granted` → `denied` → `granted` (never unset) |

- Default is `"grant-only"`. Consumers with an explicit-deny model
  set `"grant-deny"` or `"grant-deny-only"`.
- `"inherited"` and `"indeterminate"` cells route back to `"unset"`
  on first toggle when the consumer opts in via
  `overrideOnInheritedToggle` (default `false` — toggling an
  inherited cell is a no-op that fires an announcement).

### Disabled / read-only interactions

- `disabled`: cell is not focusable, not interactive. It renders
  the visual state but does not participate in tabindex.
- `readOnly`: cell is focusable but keyboard toggle / click is a
  no-op. The cell participates in a bulk selection but the bulk
  callback is fired only for cells that are neither disabled nor
  read-only.

### Bulk actions

- **Select row** — toggle every editable cell in a subject row to a
  single target state.
- **Select column** — toggle every editable cell in an action column
  to a single target state.
- **Select all** — toggle every editable cell in the matrix.

Every bulk action fires a single `onBulkChange` callback with the
consumer receiving the full list of changed cells:

```ts
export interface PermissionMatrixBulkChangePayload {
  readonly changes: readonly PermissionCellChange[];
  readonly source:
    | { readonly kind: "row"; readonly subjectId: PermissionSubjectId }
    | { readonly kind: "column"; readonly actionId: PermissionActionId }
    | { readonly kind: "all" };
  readonly targetState: PermissionCellState;
}

export interface PermissionCellChange {
  readonly subjectId: PermissionSubjectId;
  readonly actionId: PermissionActionId;
  readonly fromState: PermissionCellState;
  readonly toState: PermissionCellState;
}
```

- **`onBulkChange`** is preferred over N `onCellChange` calls. The
  matrix never fires per-cell callbacks in a bulk operation.
- **`dropAcceptance` / gating** is a consumer concern. The consumer
  can refuse to apply a change by simply not updating the `cells`
  prop; the matrix does not enforce anything.

---

## Consumer Callbacks

Every callback fires **after** the interaction resolves, with
plain-data payloads.

```ts
export interface PermissionMatrixCellClickPayload {
  readonly subject: PermissionSubject;
  readonly action: PermissionAction;
  readonly cell: PermissionCell;
  readonly nativeEvent: MouseEvent | KeyboardEvent;
}

export interface PermissionMatrixCellChangePayload {
  readonly subject: PermissionSubject;
  readonly action: PermissionAction;
  readonly fromState: PermissionCellState;
  readonly toState: PermissionCellState;
}
```

Root callbacks:

- `onCellClick?: (payload: PermissionMatrixCellClickPayload) => void`
- `onCellChange?: (payload: PermissionMatrixCellChangePayload) => void | Promise<void>`
- `onBulkChange?: (payload: PermissionMatrixBulkChangePayload) => void | Promise<void>`
- `onSelectionChange?: (selection: PermissionMatrixSelection) => void`
- `onSearchChange?: (query: string) => void`
- `onError?: (error: unknown) => void` — optional. Called when the
  consumer's `onCellChange` promise rejects. The matrix reverts its
  visual optimistic state (if any) and speaks the reject
  announcement.

Callbacks that return `Promise<void>` are awaited only to preserve
error propagation. Optimistic rendering is a **consumer concern** —
the matrix waits for `cells` to update.

---

## Selection Model

The matrix owns a single **focus** state and an optional multi-cell
**selection** state for bulk highlighting. Neither participates in
persistence.

```ts
export type PermissionMatrixSelection =
  | { readonly kind: "none" }
  | {
      readonly kind: "cell";
      readonly subjectId: PermissionSubjectId;
      readonly actionId: PermissionActionId;
    }
  | { readonly kind: "row"; readonly subjectId: PermissionSubjectId }
  | { readonly kind: "column"; readonly actionId: PermissionActionId }
  | { readonly kind: "all" };
```

- `"row"` / `"column"` / `"all"` are set when the user clicks a
  header cell or the corner "select all" cell. They are used by
  bulk-action affordances (e.g. the header offers "grant / deny /
  clear" buttons when a row is selected).
- Multi-select of arbitrary rectangular ranges is **out of scope for
  v1** — bulk actions only support row / column / all.

---

## Keyboard Model

Keyboard is a first-class interaction path. Pointer + keyboard reach
functional parity.

| Key                                  | Action                                        |
| ------------------------------------ | --------------------------------------------- |
| `Tab` / `Shift+Tab`                  | Move between header / body / footer regions   |
| `ArrowUp/Down/Left/Right`            | Move focus by one cell (roving tabindex)      |
| `Home` / `End`                       | First / last cell in the current row          |
| `Ctrl+Home` / `Ctrl+End`             | First / last cell in the whole grid           |
| `PageUp` / `PageDown`                | Move by page height (respects virtualization) |
| `Space` / `Enter`                    | Toggle focused cell                           |
| `Shift+Space`                        | Select the current row                        |
| `Ctrl+Space`                         | Select the current column                     |
| `Ctrl+A`                             | Select all cells                              |
| `Escape`                             | Clear selection                               |
| `Ctrl+F` (opt-in via `enableSearch`) | Focus the search input                        |

`Space` is **not** dual-role like in Kanban — the matrix uses `Enter`
for activation of composite buttons in the header. In cells,
`Space` and `Enter` both toggle.

RTL swaps `ArrowLeft` / `ArrowRight` for cell navigation.

---

## Accessibility

- **Root** — `role="application"` +
  `aria-roledescription="Permission matrix"`.
- **Grid** — `role="grid"` with `aria-rowcount` / `aria-colcount`.
- **Column header** — `role="columnheader"` with the action label
  and, when the action has a group, an `aria-describedby` pointing
  at the group name.
- **Row header** — `role="rowheader"` with the subject label.
- **Cell** — `role="gridcell"` with `aria-labelledby` composed from
  the row header and column header. Cell state maps to
  `aria-checked`:

  | Cell state      | `aria-checked` value                      |
  | --------------- | ----------------------------------------- |
  | `granted`       | `"true"`                                  |
  | `denied`        | `"false"`                                 |
  | `unset`         | `"false"` (with `data-state="unset"`)     |
  | `inherited`     | `"mixed"` (with `data-state="inherited"`) |
  | `indeterminate` | `"mixed"`                                 |

  `aria-disabled="true"` when `disabled` is set; `aria-readonly="true"`
  when `readOnly` is set.

- **Corner cell (select-all)** — `role="columnheader"` +
  `aria-label="Select all cells"`. Toggling it fires an
  `onBulkChange` with `source.kind === "all"`.
- **Row / column headers behave as buttons** for row / column
  selection — `tabindex="-1"` (managed by roving tabindex) and
  `aria-pressed` when the row / column is selected. `role`
  remains `rowheader` / `columnheader` — `aria-pressed` on a
  header is permitted by ARIA 1.2.
- **Live region** — one `aria-live="polite"` region under the root
  announces cell toggles, bulk actions, rejections, and search
  changes.
- **Focus preservation** — cell toggle, bulk change, and search
  filter all preserve focus on the last-focused cell (or the
  nearest surviving cell after a filter narrows the visible set).
- **Reduced motion** — cell transition animation and scroll-into-view
  honor `prefers-reduced-motion`.

A dedicated a11y audit ships with KUI-ENT-016.

---

## Virtualization

Virtualization is **opt-in** per axis and reuses the free-tier
primitives.

- **`virtualizeRows?: boolean`** — default `false`. When `true`,
  `rowHeight` is required.
- **`virtualizeColumns?: boolean`** — default `false`. When `true`,
  `columnWidth` is required. Deferred to a follow-up if the row
  virtualization work is deep enough to warrant a split.
- Reuses `computeVirtualizedRange` from `@kairoui/utils` and
  `useVirtualizer` from `@kairoui/hooks`.

### Compatibility rules

1. `aria-rowindex` / `aria-colindex` are set for **every rendered
   cell** to preserve position under windowing.
2. Focus persists across virtualization scroll — the roving tabindex
   target is stored by `{ subjectId, actionId }` and re-applied when
   the cell re-mounts.
3. Bulk actions operate on **all** matching cells (including those
   not currently rendered). The reducer walks `cells` + `subjects` +
   `actions` — not the mounted DOM.

---

## Filtering + Search

Reuses the Phase 13 filter model. The matrix accepts:

- **`filter?: FilterExpression`** — declarative filter model. See
  `docs/architecture/PHASE13-DATA-FILTERING-ARCHITECTURE.md`.
- **`defaultFilter?: FilterExpression`** — uncontrolled default.
- **`onFilterChange?: (expr: FilterExpression) => void`**
- **`enableSearch?: boolean`** — renders a search input in the
  header that filters subjects + actions by a case-insensitive
  substring on `label` and `id`. Falls back to consumer-supplied
  `filter` prop when both are set.
- **`filterFn?: (context) => boolean`** — final override the
  consumer uses to implement backend-driven filtering. Runs after
  the declarative filter.

Filtering hides rows / columns but never mutates the underlying
`subjects` / `actions` / `cells` arrays.

---

## Locale + RTL

- **`locale?: string`** — BCP 47 tag consumed by any date / number
  formatting the consumer wires into their custom renderers. The
  matrix itself does not format numbers or dates internally.
- **`dir?: "ltr" | "rtl"`** — flips column layout for row-header /
  column-header positioning and swaps `ArrowLeft` / `ArrowRight`
  semantics for cell navigation.
- **`messages?: PermissionMatrixMessages`** — every announcer and
  visible label defaults to English and is overridable.

---

## Public vs Internal API

Public (exported from `@kairoui-pro/permission-matrix`):

- Components: `PermissionMatrix`, `PermissionMatrix.Header`,
  `PermissionMatrix.Table`, `PermissionMatrix.ColumnHeader`,
  `PermissionMatrix.RowHeader`, `PermissionMatrix.Cell`,
  `PermissionMatrix.EmptyState`, `PermissionMatrix.LegendItem` (plus
  bare siblings).
- Hooks: `usePermissionMatrix`, `usePermissionCell`,
  `usePermissionSelection`.
- Types: `PermissionMatrixRootProps`, `PermissionSubject`,
  `PermissionAction`, `PermissionCell`, `PermissionCellState`,
  `PermissionCellChange`, `PermissionMatrixSelection`,
  `PermissionMatrixCellClickPayload`,
  `PermissionMatrixCellChangePayload`,
  `PermissionMatrixBulkChangePayload`, `PermissionMatrixMessages`,
  `PermissionMatrixMode`, `PermissionMatrixToggleMode`.
- Values: `defaultPermissionMatrixKeymap`, `toggleCell`,
  `resolveCell`, `computeVisibleAxis`, `assertValidPermissionInput`,
  `permissionMatrixStyleContract`.

Internal (not exported):

- Reducer implementations (`use-matrix-state.ts` internals).
- Prefixed helpers (`_computeFocusPath`, `_clampAxis`).
- CSS-in-source constants.

The barrel never re-exports a symbol whose name starts with `_` or a
type whose name starts with `Internal`.

---

## SSR Requirements

Same posture as every other Phase 14 component:

1. **First render is server-safe.** No `window`, `document`,
   `localStorage`, `navigator`, `matchMedia`, or `requestAnimationFrame`
   at module load or during initial render.
2. **No hydration mismatches.** Server renders the same rows /
   columns / cells the first client render produces.
3. **Virtualization degrades on SSR.** Server renders all rows /
   columns unwindowed; client swaps to windowed rendering after the
   scroll container is measured.
4. **`use client` is not used** in source.

---

## Bundle Isolation and Tree-Shaking

- `@kairoui-pro/permission-matrix` declares only these runtime
  dependencies: `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`.
  `react` and `react-dom` are peer.
- No dependency on any other `@kairoui-pro/*` package.
- Named exports only.
- **State-machine helpers are separable.** `toggleCell`,
  `resolveCell`, and `assertValidPermissionInput` are pure and can
  be imported without mounting the matrix.

Provisional bundle budgets, reset against the first release-candidate
build in KUI-ENT-016:

| Entry point                                 | Raw target | Gzip target |
| ------------------------------------------- | ---------- | ----------- |
| `@kairoui-pro/permission-matrix/index.js`   | 45 KB      | 14 KB       |
| `@kairoui-pro/permission-matrix/styles.css` | 6 KB       | 2 KB        |

---

## Shared Infrastructure Ownership

Every reused capability lives in its current owner package.

| Capability                             | Owner                                 | Consumed by                |
| -------------------------------------- | ------------------------------------- | -------------------------- |
| Checkbox / tri-state checkbox          | `@kairoui/core/components/checkbox`   | every cell                 |
| Composition, slots, variants           | `@kairoui/core/composition`           | every component            |
| Overlay infra (`Portal`, `FocusScope`) | `@kairoui/core/components/overlay`    | search popovers            |
| Virtualization math + hook             | `@kairoui/utils`, `@kairoui/hooks`    | rows                       |
| Filter model                           | `@kairoui/core` (Phase 13)            | search + filter            |
| Roving-tabindex helpers                | `@kairoui/core/components/collection` | cell nav                   |
| Controllable-state pattern             | `@kairoui/hooks`                      | selection / focus / filter |

When Permission Matrix discovers a gap in a free package, the fix
lands **in the free package first** (per KUI-ENT-001) — never as a
Pro-only shim.

---

## Adapter Guidance for Consumers

The matrix is deliberately shape-lean. Adapters are the consumer's
responsibility. Typical adapter functions:

```ts
// Consumer-owned — not part of the matrix API.
function toMatrixInput(store: MyBackendStore): {
  subjects: readonly PermissionSubject[];
  actions: readonly PermissionAction[];
  cells: readonly PermissionCell[];
} {
  /* ... */
}

function fromCellChange(change: PermissionMatrixCellChangePayload): MyBackendChange {
  return {
    principalId: change.subject.id,
    permissionKey: change.action.id,
    grant: change.toState === "granted",
    revoke: change.toState === "denied",
    // ...
  };
}
```

The matrix ships **no** helper for either direction. Adapter code
lives entirely in the consumer's codebase; the ADR only clarifies
the contract the matrix produces (`payload`) and the contract it
consumes (`readonly` arrays).

---

## What KUI-ENT-014 Does Not Do

- Does **not** create the `@kairoui-pro/permission-matrix` package.
- Does **not** write any Permission Matrix source code.
- Does **not** define RBAC / ABAC / policy schemas or evaluators.
- Does **not** persist permissions or emit network requests.
- Does **not** modify `DataGrid`, `Scheduler`, `Kanban`, or any
  free-tier component.
- Does **not** add `@kairoui-pro/permission-matrix` to any
  `package.json`, lint rule, or docs-generator configuration.
- Does **not** change bundle budgets or the docs generator config.

Later tasks (KUI-ENT-015, KUI-ENT-016) introduce the package,
source, and tests; each does so with its own review and its own
bundle-budget update, in line with the rules above.

---

## Change Control

Amendments require a new task ID under Phase 14 and must preserve:

1. **The backend-agnosticism rule at the top of this document.**
   Any change that would embed a backend model, a policy DSL, an
   authorization primitive, or a persistence adapter is out of
   scope and requires a new pre-approved ADR.
2. The dependency direction (`@kairoui-pro/*` → `@kairoui/*`, never
   the reverse).
3. The **consumer-owned data flow** rule — every mutation flows
   through a callback; the matrix never writes to its input arrays.
4. The **no hard-coded roles / resources / actions** rule.
5. The SSR / a11y / bundle-isolation guarantees stated above.

Anything else is fair game. Record the amending task ID here on
change.
