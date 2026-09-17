# Phase 13 — Data Filtering Architecture (KUI-ADV-010)

Status: **Architecture defined + primitives shipped**. No UI integration in
this task; consumer applies filters and passes filtered rows to `DataTable`.

---

## Purpose

Provide a **declarative, framework-independent, stringly-typed filter model**
that:

1. Describes what a user wants to filter without prescribing how it evaluates.
2. Ships a **default client-side evaluator** for common data types.
3. Composes cleanly with server-side filtering by treating the filter state as
   plain data that can be serialized, sent to a backend, and used to resolve
   the `data` prop from outside the component.
4. Reuses the existing `useControllableState` pattern that powers sort and
   selection so consumers get identical controlled / uncontrolled semantics
   for free.

Nothing here fetches data. Nothing here mutates rows.

---

## Scope

### In scope for KUI-ADV-010

- Filter state shape (`FilterState`, `ColumnFilter`, `FilterOp`)
- Global filter (single free-text search)
- Column filters (per-column operator + value)
- Controlled / uncontrolled state hook (`useFilterState`)
- Global search hook with debounce (`useGlobalSearch`)
- Client-side evaluator (`applyFilters`, `matchesGlobalFilter`)
- Filter operator predicates (`filterPredicates`)
- Column filter metadata additions on `DataTableColumnDef`
- Custom filter functions per column (`filterFn`)
- Type-level contracts for server-controlled filtering compatibility

### Out of scope (deferred)

- Rendering filter UI widgets (menus, chips, toolbars)
- Wiring the filter model into `DataTable`'s render (consumer stays in
  control of `data`)
- SQL-like expression parsers, nested boolean trees deeper than
  combinator-of-column-filters
- Server fetch protocols, pagination cursors
- Query builders / drag-and-drop rule editors

---

## Data Model

### Operators

```ts
export type FilterOp =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "between"
  | "in"
  | "notIn"
  | "isEmpty"
  | "isNotEmpty";
```

Fifteen operators covering equality, string containment, numeric ordering,
range, set membership, and emptiness checks. Anything beyond this must be
expressed with a `filterFn` on the column definition — the model does **not**
grow.

### Column filter

```ts
export interface ColumnFilter {
  readonly columnId: string;
  readonly op: FilterOp;
  readonly value: unknown;
}
```

- `value` is deliberately `unknown` — different operators expect different
  shapes (a scalar, a `[min, max]` tuple, an array).
- Empty operators (`isEmpty`, `isNotEmpty`) ignore `value` entirely.

### Filter state

```ts
export type FilterCombinator = "and" | "or";

export interface FilterState {
  readonly globalFilter: string;
  readonly columnFilters: readonly ColumnFilter[];
  readonly combinator: FilterCombinator;
}
```

- `globalFilter` — free-text applied across every filterable column.
- `columnFilters` — targeted operator/value per column.
- `combinator` — how the column filters combine with each other (`and` by
  default). The global filter is always ANDed with the resulting column
  filter expression.

An empty state (`""` global + `[]` filters) matches every row.

### Column metadata

`DataTableColumnDef<TRow>` gains four optional fields:

```ts
readonly filterable?: boolean;
readonly filterKind?: FilterKind;
readonly filterFn?: FilterFn<TRow>;
readonly filterOptions?: readonly FilterOption[];
```

- `filterable` defaults to `true` when the column has an accessor and `false`
  otherwise. Actions columns are naturally excluded.
- `filterKind` (`"text" | "number" | "date" | "boolean" | "select"`) is a
  **hint** for future filter UI widgets and for the default operator
  selection. It does not change evaluation semantics.
- `filterFn` overrides operator dispatch entirely — receives the row and the
  active `ColumnFilter` and returns `true` to keep, `false` to drop.
- `filterOptions` supplies enumerable choices for `select` columns.

---

## Evaluator

`applyFilters<TRow>({ data, state, columns })` returns a **new**, never-mutated
array of the input row references filtered by the current state.

Semantics:

1. If `state.globalFilter` is non-empty, each row must match it via
   `matchesGlobalFilter` — case-insensitive substring across every filterable
   column's rendered string form.
2. For each `ColumnFilter`, `evaluateColumnFilter` produces a boolean.
3. Column results combine with `state.combinator` (`and` / `or`).
4. Both stages are ANDed together (global search ∧ column combinator result).
5. A column filter targeting a non-filterable, unknown, or missing column is
   silently skipped — never throws — so state stays valid across schema
   changes.

The predicate library is exposed as `filterPredicates` so consumers can call
individual operators directly. Each predicate is `(cellValue, filterValue) =>
boolean`. Null / undefined cell values are handled explicitly per operator.

### String coercion policy

- `contains`, `startsWith`, `endsWith`, `notContains` coerce both sides
  through `String(...)` and lowercase them.
- `equals` uses `Object.is` for primitives and structural equality is
  **not** attempted — pass a `filterFn` for object comparisons.
- Numeric operators return `false` when either side is `NaN` or not a
  number.
- Date operators compare via `.getTime()` and require both sides to be
  `Date` instances (or numeric timestamps).

### `between` operator

Expects `value: readonly [min, max]`. Inclusive on both ends. If `min > max`
the endpoints are swapped so the state stays forgiving.

### Empty / not-empty

- Empty means `null`, `undefined`, `""`, `[]`, or `NaN`.
- Not-empty is the negation.

---

## Hooks

### `useFilterState`

Mirrors `useSortState`:

```ts
useFilterState({
  filterState?: FilterState;                // controlled
  defaultFilterState?: FilterState;         // uncontrolled seed
  onFilterStateChange?: (next: FilterState) => void;
})
  => {
    filterState: FilterState;
    setFilterState: (next: FilterState) => void;
    setGlobalFilter: (input: string) => void;
    setColumnFilter: (columnId: string, filter: ColumnFilter | undefined) => void;
    clearColumnFilter: (columnId: string) => void;
    clearAll: () => void;
  }
```

- Backed by `useControllableState<FilterState>` so controlled and uncontrolled
  modes share the same code path.
- `setColumnFilter(id, undefined)` deletes that column's filter.
- Setters are stable across renders.

### `useGlobalSearch`

A thin, DOM-free debounced input hook:

```ts
useGlobalSearch({ delayMs?: number; initial?: string })
  => {
    input: string;
    debounced: string;
    setInput: (value: string) => void;
    clear: () => void;
  }
```

`debounced` trails `input` by `delayMs` (default 250 ms). Wire `debounced` to
`useFilterState().setGlobalFilter` when you want debounced global search.

---

## Server-Controlled Filtering

Because `FilterState` is plain data:

- Serialize with `JSON.stringify(filterState)` and send it to any backend.
- The DataTable never fetches, so a consumer whose data comes from a server
  simply resolves rows outside the component and passes them via `data`. The
  filter hook still runs — treating the state as authoritative — and the
  consumer echoes the current `FilterState` on the round-trip.
- `applyFilters` is a **client-side helper**, not a mandatory path. Passing a
  `FilterState` that a server has already respected and skipping
  `applyFilters` is fully supported.

Recommended shape for server integration:

```ts
const { filterState, setFilterState } = useFilterState({
  filterState,
  onFilterStateChange: (next) => {
    setFilterState(next);
    void fetchRows(next).then(setRows);
  },
});
```

---

## Testing surface

- Predicate matrix — every operator against `null`, `undefined`, empty
  string, matching value, non-matching value, and a boundary value.
- `applyFilters` — global-only, column-only, both, `and` vs `or` combinator,
  unknown column ID resilience, `filterFn` override precedence, empty state
  is a no-op.
- `useFilterState` — controlled and uncontrolled modes, partial setters,
  clearAll, referential stability of setters.
- `useGlobalSearch` — debounce timing, immediate `input` update, `clear`
  behavior.

---

## Do-nots (enforcement)

- No mutation of `data` — every helper returns a new array.
- No hidden UTC / locale coercion — consumers pass whatever cell value shape
  their accessors produce; predicates operate on that shape as documented.
- No implicit operator inference beyond `filterKind` default suggestions
  (which the model exposes but never applies for the consumer).
- No enterprise DSL — the operator set is closed at fifteen. Custom logic
  goes through `filterFn`.
