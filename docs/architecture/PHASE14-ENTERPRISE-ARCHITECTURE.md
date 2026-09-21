# Phase 14 — Enterprise & Differentiating Component Architecture (KUI-ENT-001)

Status: **Architecture defined**. Implementation begins in KUI-ENT-002 and
runs sequentially through KUI-ENT-020. No enterprise packages are created
in this task.

---

## Purpose

Phase 14 introduces the **differentiating, enterprise-grade component
surfaces** that will form the paid tier of KairoUI. These are built **on
top of** the foundations proven in Phases 7–13 — the composition engine,
style contract, collection/selection primitives, overlay infrastructure,
DataTable, virtualization math, filter engine — rather than as a parallel
architecture.

The goals of this document are:

1. Fix the product boundary between the free core and the paid (Pro)
   tier so future tasks are not tempted to move existing capability
   behind a paywall.
2. Fix the **package boundary** so bundlers, tests, and lint rules can
   mechanically enforce that free packages never depend on paid ones.
3. Fix the **dependency direction** so a consumer who never installs a
   Pro package pays zero bundle or runtime cost for its existence.
4. Fix the **licensing boundary shape** without implementing runtime
   enforcement yet — enforcement is a separate, approved task.
5. Fix the shared-infrastructure ownership rule so Pro packages do not
   fork core primitives.

Nothing here builds a component. Nothing here writes runtime code. This
task defines contracts only.

---

## Scope

### Phase 14 surfaces

Six differentiating surfaces enter Phase 14. Each is a **new product**
built on core; none replaces an existing free component.

| Surface           | Task arc                   | Distinguishing capability                                                                                   |
| ----------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| DataGrid          | KUI-ENT-002, 003, 004, 005 | Column virtualization, row/column freezing, cell editing, grouping/aggregation, tree data, master-detail    |
| Command Palette   | KUI-ENT-006, 007           | Global command surface, provider registry, keyboard-first navigation, per-scope commands, ranked search     |
| Scheduler         | KUI-ENT-008, 009, 010      | Resource-lane timeline, multi-day views, drag-to-reschedule, working-hours, recurrence                      |
| Kanban            | KUI-ENT-011, 012           | Column board, drag-and-drop between columns, WIP limits, swimlanes, virtualized columns                     |
| Permission Matrix | KUI-ENT-013, 014           | Role/permission grid, bulk toggles, inherited state, diff view                                              |
| Workflow / Steps  | KUI-ENT-015, 016           | Multi-step workflow shell, non-linear navigation, per-step validation, resumable state, wizard/stepper base |

The final task arc (KUI-ENT-017 through KUI-ENT-020) covers cross-cutting
concerns: shared enterprise validation, license contract skeleton,
Phase 14 bundle-budget baseline, and the Phase 14 completion audit.

### Explicitly out of scope for Phase 14

- Runtime license enforcement (key validation, watermarking, telemetry).
  Deferred to a separately approved task. Only the **contract shape**
  and packaging boundary are decided here.
- Server-side collaboration protocols (multiplayer cursors, OT/CRDT
  merge). If a Pro surface needs shared state, it defines a plain-data
  contract; transport is a consumer concern.
- Native mobile drag/touch parity beyond WCAG-required alternatives.
- Chart primitives, pivot tables outside the DataGrid grouping model.
- SQL-style query builder UI.
- Any change that moves an already-shipped free component behind the
  paywall. Existing capability stays free. The `DataTable` continues to
  ship in `@kairoui/core` and continues to receive maintenance.

---

## Product Boundary — Free vs Pro

The rule is **capability substitution, not capability withdrawal.** A
Pro surface exists because a free surface with a superset of features
would be architecturally different (dense keyboard model, virtualization
in two dimensions, editing focus preservation, etc.), not because we
have moved features from free to paid.

### What stays free (`@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`, `@kairoui/theme`, `@kairoui/tokens`, `@kairoui/icons`)

- Every Phase 7–13 component and hook, including:
  - `DataTable` — row selection, sort, filter, single-axis
    (row) virtualization, non-editable cells.
  - Date components — `DateInput`, `TimeInput`, `DateTimeInput`,
    `DatePicker`, `DateRangePicker`.
  - Overlays — `Popover`, `Dialog`, `Drawer`, `AlertDialog`,
    `Tooltip`, `ContextMenu`, `DropdownMenu`.
  - Collection + selection primitives — `useCollection`,
    `useSingleSelection`, `useMultiSelection`,
    `useCompositeNavigation`, `useTypeahead`.
  - Virtualization math — `computeVirtualizedRange`,
    `computeScrollToIndex`, `useVirtualizer`.
  - Filter engine — `applyFilters`, `runRowModelPipeline`,
    `useFilterState`, `useColumnFilter`, `useGlobalSearch`.
  - Navigation — `Menu`, `Menubar`, `NavigationMenu`, `Tabs`,
    `Breadcrumbs`, `Sidebar`, `AppShell`.
  - Timeline (presentational component with fixed axis).
- All primitives (`Box`, `Text`, `Flex`, `Stack`, etc.).
- All styling, tokens, theme engine.

None of these are ever moved to a Pro package. They are the **substrate**
Pro packages consume.

### What is new and enters Pro

- **DataGrid** — a distinct component from `DataTable`. Reuses
  `runRowModelPipeline`, `computeVirtualizedRange`, `useSelection`,
  and column-def shape, but adds:
  - Column-axis virtualization (`computeVirtualizedRange` reused per
    axis).
  - Row/column freezing (via CSS `position: sticky` compositions the
    free DataTable never introduced).
  - Cell-level focus model with in-place editing.
  - Grouping / aggregation composed on top of the existing pipeline
    (a new pipeline stage, added downstream of filter/sort).
  - Tree/hierarchical rows.
  - Master-detail rows.
- **Command Palette** — a new global surface. There is no free
  equivalent. It reuses `Combobox` collection semantics but adds a
  registry, scopes, and ranked ordering.
- **Scheduler** — new surface. `Timeline` exists as a free
  presentational component but does not carry resources, drag,
  reschedule, working-hours, or recurrence UI.
- **Kanban** — new surface. `List` exists but is not a board.
- **Permission Matrix** — new surface. `Table` exists but the matrix
  adds bulk edit, inheritance, diff, and role-scoped semantics.
- **Workflow / Stepper** — new orchestration surface. The free tier
  keeps `Tabs`, `Progress`, and layout primitives; the Pro workflow
  shell adds validation orchestration, non-linear routing, and
  resumable persistence contracts.

### Rule of thumb

If an existing free component can express the requirement by composing
its documented props with `@kairoui/*` primitives, the requirement is
**not** a Pro feature and does not move. If the requirement demands a
distinct interaction model (two-axis focus, drag orchestration across
multiple containers, cross-view mutation), it is a new product surface
and belongs in a Pro package.

---

## Package Boundaries

### Scope name

Pro packages live under a **distinct npm scope**: `@kairoui-pro`.

Rationale:

1. `import` statements make the licensing boundary visually obvious:
   `import { DataGrid } from "@kairoui-pro/data-grid"` cannot be
   confused with a free import.
2. Lint / ESLint import rules and `boundaries.test.ts` files can
   forbid any `@kairoui-pro/*` specifier from appearing in a
   `@kairoui/*` source tree with a single string match.
3. Publishing to a distinct scope allows an eventual private registry,
   token-gated npm access, or license-key delivery vehicle without
   restructuring imports.
4. Consumers who never install a Pro package pay zero bytes; the two
   scopes have no shared entry point.

### Package plan

Each Pro surface ships as its own package. No `@kairoui-pro/all` barrel
package exists — that would defeat tree-shaking across surfaces.

| Package                           | Scope | Depends on (peer or runtime)                                 | Provides                                                    |
| --------------------------------- | ----- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `@kairoui-pro/data-grid`          | Pro   | `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`, `react` | `DataGrid`, editing model, grouping pipeline stage          |
| `@kairoui-pro/command`            | Pro   | `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`, `react` | `CommandPalette`, `useCommandRegistry`, scopes              |
| `@kairoui-pro/scheduler`          | Pro   | `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`, `react` | `Scheduler`, resource lanes, working-hours model            |
| `@kairoui-pro/kanban`             | Pro   | `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`, `react` | `Kanban`, drag orchestration, WIP limits                    |
| `@kairoui-pro/permission-matrix`  | Pro   | `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`, `react` | `PermissionMatrix`, inheritance model, diff view            |
| `@kairoui-pro/workflow`           | Pro   | `@kairoui/core`, `@kairoui/hooks`, `@kairoui/utils`, `react` | `Workflow`, `Step`, validation orchestrator, resume adapter |
| `@kairoui-pro/license` _(future)_ | Pro   | none                                                         | License contract types + no-op runtime (enforcement TBD)    |

`@kairoui-pro/license` is listed for completeness. It is not created in
KUI-ENT-001 and will only be introduced if a separate task explicitly
approves runtime enforcement.

### No shared Pro barrel

A `@kairoui-pro/core` package would concentrate cross-surface utility
into a single hot import path and force every Pro package to depend on
it. That is deferred:

- If two Pro surfaces need the same helper, the helper is first
  duplicated. Duplication signals cost. Extraction into a shared Pro
  package requires an ADR that names the two consumers and the helper's
  stable public shape.
- Anything that turns out to be genuinely reusable across the free and
  Pro tiers moves **down** into `@kairoui/utils`, `@kairoui/hooks`, or
  `@kairoui/core` — never sideways into a new shared Pro package.

---

## Dependency Direction

The dependency graph is **strictly acyclic and one-directional**:

```text
consumer app
  ├── @kairoui-pro/data-grid  ─┐
  ├── @kairoui-pro/command    ─┤
  ├── @kairoui-pro/scheduler  ─┤   (any subset, tree-shaken)
  ├── @kairoui-pro/kanban     ─┤
  ├── @kairoui-pro/permission-matrix ─┤
  ├── @kairoui-pro/workflow   ─┘
  │
  └── @kairoui/core
        ├── @kairoui/hooks
        │     └── @kairoui/utils
        ├── @kairoui/theme
        │     └── @kairoui/tokens
        └── @kairoui/utils
```

Rules:

1. **`@kairoui-pro/*` MAY depend on `@kairoui/*`.** This is the only
   supported direction.
2. **`@kairoui/*` MUST NOT depend on `@kairoui-pro/*`** — not as a
   runtime dep, not as a peer dep, not as a dev dep, not as an import
   in tests, not as a JSDoc `@link`.
3. **A Pro package MAY depend on another Pro package** only when the
   depended package's public API is stable and the dependency is
   documented in this file. In Phase 14, no Pro package depends on
   another Pro package. Each surface is independently installable.
4. **`react` and `react-dom` are peer dependencies** in every Pro
   package. Never runtime deps.
5. **No transitive Pro exposure through core.** A free consumer who
   imports only `@kairoui/core` must never see a `@kairoui-pro/*`
   symbol via re-export, `declare module` augmentation, or JSDoc `@see`
   link.

### Mechanical enforcement

The following checks land as part of the later Phase 14 validation
tasks (KUI-ENT-018/019); they are not gated on KUI-ENT-001 completion:

- Each Pro package ships a `boundaries.test.ts` verifying:
  - `package.json` `name` starts with `@kairoui-pro/`.
  - `dependencies` and `peerDependencies` contain no
    `@kairoui-pro/*` entry except an explicitly documented one.
- Each free `@kairoui/*` package's `boundaries.test.ts` grows a
  new assertion:

  ```ts
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.peerDependencies ?? {}) };
  for (const dep of Object.keys(deps)) {
    expect(dep.startsWith("@kairoui-pro/")).toBe(false);
  }
  ```

- The docs-generator's `DEFAULT_PACKAGES` list (in
  `tooling/docs-generator/src/package-discovery.ts`) is **not**
  extended with Pro package names until the Pro docs pipeline is
  designed in KUI-ENT-017. Until then, Pro components document
  themselves out-of-band or via a separate discovery pass.

---

## Licensing Boundary — Contract Only, No Enforcement

Runtime enforcement is deferred. Phase 14 fixes **only** the contract
shape so future enforcement can land without breaking consumers.

### Contract shape

1. **Package identity as the boundary.** The `@kairoui-pro` scope is
   the license boundary. A consumer purchasing a Pro license
   purchases access to install packages under this scope.
2. **No runtime license checks in KUI-ENT-002 through KUI-ENT-016.**
   Pro components render without inspecting any global, environment
   variable, or license token during Phase 14 initial implementation.
3. **A reserved contract surface** — `LicenseKey`, `LicenseTier`,
   `verifyLicense` — will live in `@kairoui-pro/license` if and when
   introduced. It must be a **no-op by default** so that omitting the
   license package does not change rendering.
4. **No watermarking, no console warnings, no telemetry** are
   introduced in Phase 14. A future enforcement task must be
   approved separately, must document its opt-out story, and must
   respect existing accessibility and SSR guarantees.
5. **Server components pay zero.** Any future license runtime is a
   client-only concern. The Pro packages remain SSR-safe with no
   license inspection during server render.

### What licensing is _not_

- Not a lint rule that breaks a consumer's build.
- Not a peerDependency injection that would require a license package
  install to compile.
- Not a runtime dependency that ships with every Pro package.

---

## Shared Infrastructure Ownership

Every Pro surface reuses at least one piece of Phase 7–13
infrastructure. The ownership rule is: **infrastructure lives where it
was born.** If a Pro surface needs a capability that already exists in
core, it consumes it via the documented public API of the core package.
It does not fork, re-export, or shim the capability.

| Capability                                                                                             | Owner (unchanged)                               | Consumed by (Phase 14)                                                                |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| Composition engine, slots, `mergeProps`, `polymorphic`                                                 | `@kairoui/core/composition`                     | Every Pro package                                                                     |
| Collection + selection hooks                                                                           | `@kairoui/core/components` (collection subpath) | DataGrid, Command Palette, Kanban, Permission Matrix                                  |
| Overlay infrastructure (`Portal`, `FocusScope`, `DismissableLayer`, `Presence`, `useFloatingPosition`) | `@kairoui/core/components` (overlay subpath)    | Command Palette, DataGrid cell editor overlays, Scheduler tooltips, Kanban card menus |
| Row-model pipeline (`runRowModelPipeline`, filter engine, sort utils)                                  | `@kairoui/core/components/data-table`           | DataGrid (grouping is a new pipeline stage)                                           |
| Virtualization math + hook                                                                             | `@kairoui/utils`, `@kairoui/hooks`              | DataGrid (row + column axes), Kanban (columns/cards)                                  |
| Date value types + parsers                                                                             | `@kairoui/utils/date`                           | Scheduler                                                                             |
| Style contract + variant engine                                                                        | `@kairoui/core`                                 | Every Pro package                                                                     |
| Theme / density / SSR provider                                                                         | `@kairoui/core`, `@kairoui/theme`               | Every Pro package                                                                     |
| Tokens                                                                                                 | `@kairoui/tokens`                               | Every Pro package                                                                     |

### When core needs to grow

Some Pro surfaces will discover gaps in core. The rule:

1. If the gap is **generally useful** to any free consumer (a missing
   hook, a missing utility, a new column-def field), the fix lands in
   the appropriate free package first, ships in its own task under
   Phase 14's shared-infrastructure arc (KUI-ENT-017), and is then
   consumed by the Pro surface.
2. If the gap is **Pro-specific** (a grouping pipeline stage, a
   drag-across-columns orchestrator, a working-hours calendar), it
   lives in the Pro package that needs it.
3. Core is **not** widened to include Pro-only concepts to make Pro
   packages smaller. That would leak Pro semantics into free bundles
   and violate rule 5 of dependency direction.

---

## Public vs Internal APIs

Each Pro package follows the same export discipline as the free
packages (see `docs/architecture/package-exports.md`), with these
additions:

### Public API

- Only symbols exported from the package root are public.
- Public symbols carry stable names and, once the package leaves
  `alpha`, stable shapes. Breaking changes require a major version
  bump.
- Public API includes:
  - Every component and its `Props` interface.
  - Every hook and its options / return type interfaces.
  - Value contracts (e.g. `PermissionState`, `WorkflowStepId`).
  - Type-only utilities that consumers extend (column defs, cell
    definitions, command definitions).
- Public API **excludes** any function whose name starts with `_`,
  any type whose name starts with `Internal`, and any module inside
  an `internal/` subdirectory of the package's `src/`.

### Internal API

- Internal modules are not listed in `exports`. Node ≥ 16 and every
  supported bundler enforces this.
- Internal names are documented for cross-package awareness only,
  not for consumer use. They can change without a major bump.
- Test-only helpers live in `src/**/__tests__/` and are excluded
  from the tsup build via the same pattern the free packages use.

### Compound components

Pro compound components (e.g. `DataGrid.Column`, `DataGrid.Cell`,
`Command.Group`, `Command.Item`, `Scheduler.Resource`, `Kanban.Column`,
`Kanban.Card`) follow the Phase 7 slot / compound convention: they are
attached to the root component via `Object.assign`, discoverable by the
docs generator's compound-grouping pass, and each child is
independently exportable as a bare component for consumers who prefer
composition over dot syntax.

### Docs metadata surfacing

The Phase 14 shared task KUI-ENT-017 designs how Pro packages appear in
the docs pipeline. Until then, Pro packages **do not** appear in
`DEFAULT_PACKAGES` inside the docs generator. This keeps the free-tier
`pnpm docs -- --check` output deterministic across Phase 14
implementation tasks.

---

## SSR Requirements

Pro surfaces adopt the same SSR posture proven in Phase 13:

1. **First render is server-safe.** No component reaches into `window`,
   `document`, `localStorage`, `navigator`, or `matchMedia` at module
   load or during initial render. All DOM access is guarded by
   `useIsomorphicLayoutEffect`, `useSyncExternalStore`, or a client-only
   effect.
2. **No hydration mismatches.** Server and first client render produce
   byte-identical HTML for the same props. Virtualization degrades
   gracefully (server renders unwindowed; client swaps to windowed on
   the second render), the same pattern DataTable uses.
3. **No client-only globals in default exports.** If a Pro surface
   ships a client-only helper (drag adapters, keyboard listeners),
   the module is either:
   - guarded internally, or
   - split into a subpath export documented as client-only.
4. **The Command Palette registry** must be safe to instantiate at
   module scope (server included). Global keyboard bindings attach on
   `useEffect`, never on module init.
5. **No `use client` directives in source.** Directives, if needed,
   are the consumer app's concern. Pro packages remain framework-neutral
   ESM and let RSC compilers infer client boundaries from the exported
   symbols.

---

## Accessibility Requirements

All Pro surfaces meet at minimum:

1. **WCAG 2.2 Level AA** for perceivable, operable, understandable,
   and robust criteria.
2. **Full keyboard operability.** Every Pro surface exposes a complete
   keyboard model — no interaction is mouse-only. Drag interactions
   ship with a keyboard alternative (e.g., cut/paste semantics for
   Kanban card moves, arrow-key resize for Scheduler ranges).
3. **ARIA parity with the closest WAI-ARIA APG pattern.** DataGrid
   uses the `grid` pattern (a departure from DataTable's `table`),
   Command Palette uses `combobox` + `listbox`, Scheduler uses a
   documented custom pattern with sufficient ARIA labeling, Kanban
   composes `list` semantics with `aria-grabbed` fallbacks.
4. **Focus preservation across mutations.** Editing a DataGrid cell,
   dragging a Kanban card, and navigating between Workflow steps must
   preserve or explicitly re-target focus. No focus loss.
5. **`prefers-reduced-motion` respected.** Any transition — the
   Command Palette open animation, Scheduler smooth-scroll, Kanban
   drop reflow — is disabled or shortened when the user prefers
   reduced motion.
6. **Localizable strings.** Every human-visible string is provided
   via a `messages` prop with sensible English defaults, matching the
   DateRangePicker announcement pattern.
7. **Per-package a11y audit.** Each surface's completion task
   includes a dedicated accessibility audit modeled on
   `docs/architecture/PHASE13-A11Y-AUDIT.md`.

---

## Extensibility Expectations

Each Pro surface must be extensible via **composition**, not via
inheritance, monkey-patching, or `getInternalState` escape hatches.

1. **Column / cell / row definitions** — DataGrid columns accept the
   same `filterFn`, `sortFn`, custom `Cell` renderer contract that
   DataTable columns accept, extended with `editCell`, `groupFn`, and
   `aggregate`.
2. **Command sources** — Command Palette accepts `useCommandRegistry`
   for imperative registration and `<Command.Item>` for declarative
   registration. Ranking is a pluggable `rank(query, item)` function
   with a documented default.
3. **Scheduler resources and events** — data is passed in as plain
   arrays; consumers own persistence, fetch, and mutation.
4. **Kanban column/card renderers** — cards are consumer-provided
   render props; the board owns drag orchestration only.
5. **Permission matrix cell renderer** — cell states pluggable
   (`allowed`/`denied`/`inherited`/`indeterminate` plus a custom
   `stateRenderer`).
6. **Workflow step components** — steps are consumer-defined React
   components; the shell owns navigation, validation orchestration,
   and resume adapter contracts.
7. **No hidden context requirements.** Any React context a Pro surface
   uses internally is either provided by the surface itself or
   documented as required (`KairoProvider` is always required, mirroring
   the free tier).
8. **Public integration points are stable.** Once a surface leaves
   `alpha`, its integration types (`ColumnDef`, `CommandDefinition`,
   `SchedulerEvent`, `KanbanCard`, `PermissionCell`, `WorkflowStep`) do
   not receive breaking changes without a major bump.

---

## Bundle Isolation

1. **Zero shared runtime import between Pro packages.** Each Pro
   package is independently installable and does not import from any
   sibling Pro package. This is enforced by the boundary tests
   described above.
2. **Zero import cost when Pro is absent.** A consumer that installs
   only `@kairoui/core` never resolves a `@kairoui-pro/*` specifier at
   build time. Free-tier bundle budgets do not move because Phase 14
   exists.
3. **Per-Pro-package budgets.** KUI-ENT-018 seeds a bundle budget for
   each Pro package under `tooling/test/bundle-budgets.test.ts` (or a
   parallel `enterprise-bundle-budgets.test.ts` if the count grows).
   Every Pro package has an unpacked raw, gzipped, and CSS budget the
   same way `@kairoui/core` does.
4. **No dev-dependency leakage.** Test utilities (`tooling/test/*`)
   remain devDependencies and are not resolvable from Pro package
   outputs.
5. **CSS ownership.** Each Pro package that ships styles publishes a
   `./styles.css` subpath following the `@kairoui/core/styles.css`
   pattern. There is no combined "Pro styles" bundle.

---

## Tree-Shaking Expectations

1. **`sideEffects` accuracy.** Every Pro package declares
   `"sideEffects": ["**/*.css"]` if it ships CSS, otherwise
   `"sideEffects": false`.
2. **Named exports only.** No default exports in the public API. Every
   symbol is named so bundlers can drop unused ones.
3. **No barrel-of-barrels.** The root `index.ts` re-exports the
   package's public symbols directly, not another barrel that
   re-exports internal barrels. Deep chains defeat tree-shaking in
   some bundlers.
4. **Component / subcomponent split.** Where a compound component
   ships (e.g. `DataGrid` + `DataGrid.Column`), the underlying
   subcomponents are also named exports so consumers who never touch
   the compound form still tree-shake the compound helper.
5. **No import of Pro from `@kairoui/core`.** Enforced mechanically
   as described in "Dependency Direction."
6. **Tree-shaking regression check.** KUI-ENT-018 lands a
   `tooling/test/exports-treeshaking.test.ts` extension that verifies
   importing `{ DataGrid }` from `@kairoui-pro/data-grid` does not pull
   in `Scheduler`, `Kanban`, `CommandPalette`, `PermissionMatrix`, or
   `Workflow`, and vice versa.

---

## Documentation Ownership

`@kairoui/docs` remains the documentation component library.

- Pro components use the same `PropsTable`, `Demo`, `CodeBlock`,
  `ComponentHeader` primitives as free components.
- Pro doc pages live under `apps/docs/docs/components/pro/**` (a new
  sibling of `apps/docs/docs/components/core/`), added by KUI-ENT-017.
- The docs-site build gates on the same `pnpm docs -- --check`
  metadata pass; the check is extended to Pro packages in KUI-ENT-017
  once the Pro discovery pass is implemented. In KUI-ENT-001, the
  docs generator is unchanged.
- Every Pro doc page carries a **"License" section** disclosing that
  the component ships under the Pro tier. The tag is text-only —
  no runtime enforcement (see "Licensing Boundary").

---

## What KUI-ENT-001 Does Not Do

- Does **not** create any Pro package under `packages/` or elsewhere.
- Does **not** move any free component into a Pro package.
- Does **not** add `@kairoui-pro/*` to any `package.json`, lint rule,
  or docs-generator configuration.
- Does **not** implement license enforcement.
- Does **not** rebase existing free packages onto new abstractions.
- Does **not** change existing bundle budgets, boundary tests, or
  export maps.
- Does **not** introduce a second architecture. Every rule here is a
  refinement of the rules already documented for the free tier.

Later Phase 14 tasks may introduce Pro packages and their boundary
tests; each does so with its own review and its own bundle-budget
update, in line with the rules above.

---

## Change Control

This document defines the Phase 14 boundary. Amendments require an
explicit task ID under Phase 14 or a subsequent phase and must:

1. Preserve the dependency direction (`@kairoui-pro/*` → `@kairoui/*`,
   never the reverse).
2. Preserve the "no capability withdrawal" rule — a change that moves
   an already-shipped free component behind the paywall is out of
   scope for Phase 14 and requires a product-level decision recorded
   in a separate ADR.
3. Preserve the SSR, accessibility, extensibility, bundle-isolation,
   and tree-shaking rules stated above.

Anything else is a fair amendment. Cross-reference the amending task
ID in this file's change log when it happens.
