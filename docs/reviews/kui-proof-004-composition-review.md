# KUI-PROOF-004: Composition Architecture Review

**Date:** 2026-08-07
**Evidence:** Box (KUI-PROOF-001), Text (KUI-PROOF-002), Button (KUI-PROOF-003)
**Test suite:** 3394 tests, 154 files, 100% pass
**Bundle:** composition.js 16.55KB, composition.d.ts 30.44KB, index.js 14.09KB

---

## Recommendation

### **GO** — proceed to `asChild` integration and component factory

The composition architecture is sound. The slot system, prop merging, polymorphic types, and
ref composition all function correctly under runtime, SSR, and Strict Mode. The issues found
are ergonomic and type-safety improvements, none of which block the next phase.

---

## Findings

### Blocking

None.

### High Priority

#### H1 — `exactOptionalPropertyTypes` friction with `resolveAllSlotProps`

- **Evidence:** Button proof component (button.tsx) required 15 extra lines of workaround code to pass `overrides` without triggering TS2375/TS2379. Consumer code must conditionally construct the overrides object rather than passing `{ slots: undefined, slotProps: undefined }`.
- **Impact:** Every slotted component author pays this tax. Significant boilerplate.
- **Root cause:** `SlotOverrides<Names>` declares `slots?` and `slotProps?` as optional properties. With `exactOptionalPropertyTypes: true`, passing `undefined` for these is forbidden.
- **Resolution:** Add `| undefined` to both fields in `SlotOverrides`, or accept `undefined` in the `resolveAllSlotProps` parameter signature.
- **Affected:** `packages/core/src/composition/resolve-slot-props.ts`
- **Fix in:** KUI-PROOF-005

#### H2 — `forwardRef<unknown, PolymorphicProps<OwnProps, ElementType>>` resolves own props to `any`

- **Evidence:** Button proof required explicit parameter typing (`ButtonOwnProps & { as?: ElementType } & Record<string, unknown>`) and a named function (`function Button(...)`) to avoid `react/display-name` lint error. Box and Text used `createPolymorphicComponent` which hides this internally.
- **Impact:** Component authors who need slots or custom render logic cannot use the factory and must handle unsafe type inference manually.
- **Root cause:** `PolymorphicProps<OwnProps, ElementType>` collapses when `ElementType` is the full union — TypeScript can't distribute over it, so `Omit<PropsOf<ElementType>, ...>` becomes `any`.
- **Resolution:** The component factory should handle this internally. For manual `forwardRef`, provide a helper type `PolymorphicRenderProps<OwnProps>` that preserves own prop types without distributing over ElementType.
- **Affected:** `packages/core/src/composition/polymorphic-types.ts`, `polymorphic-render.ts`
- **Fix in:** Component factory phase

#### H3 — `createPolymorphicComponent` doesn't pass resolved element to `useProps`

- **Evidence:** Button needed conditional logic (`Element === "button" ? { type } : {}`) to apply different ARIA props per target element. The `useProps` callback receives `(props, ref)` but not the resolved element type.
- **Impact:** Every interactive component must independently check the element type to decide ARIA semantics (disabled vs aria-disabled, type attribute, keyboard behavior).
- **Root cause:** `CreatePolymorphicOptions.useProps` signature is `(props, ref) => Record<string, unknown>`. Element resolution happens after `useProps` returns.
- **Resolution:** Either pass the resolved element as a third argument to `useProps`, or restructure so `useProps` runs after element resolution.
- **Affected:** `packages/core/src/composition/polymorphic-render.ts`
- **Fix in:** Component factory phase

### Medium Priority

#### M1 — Button manually constructs root element instead of using resolved slot

- **Evidence:** `button.tsx` line 101: `(slotOverrides as Record<string, ElementType> | undefined)?.["root"] ?? Element`. This duplicates element resolution logic already in `resolveAllSlotProps`.
- **Impact:** Bypasses the validated element from slot resolution. If slot replacement validation is added later, this path wouldn't benefit.
- **Root cause:** The polymorphic `as` prop and slot replacement system don't share a resolution path. The `as` prop goes through the component directly while slot replacement goes through `resolveAllSlotProps`.
- **Resolution:** Unify the root slot element resolution. Pass `as` into the slot overrides for the root slot, so `resolved.root.element` always reflects both `as` and slot replacement.
- **Affected:** Component factory design
- **Fix in:** Component factory phase

#### M2 — `unsafe as unknown as` casts in composition layer

- **Evidence:** 4 instances across `polymorphic-render.ts` (line 34: `restProps as unknown as OwnProps`), `as-child.ts` (line 82: ref extraction via double cast), `slot-replacement.ts` (prototype access cast), `button.tsx` (slot override cast).
- **Impact:** Type safety is degraded at these boundaries. A wrong assumption could pass silently.
- **Root cause:** React's type system doesn't expose ref on ReactElement, forwardRef's generic constraints are too narrow, and Record indexing requires casts.
- **Resolution:** Replace with type guards where possible. For ref extraction from ReactElement, accept the cast but isolate it in a single utility function.
- **Affected:** Multiple composition modules
- **Fix in:** KUI-PROOF-005

#### M3 — No automatic disabled-interaction suppression for non-native elements

- **Evidence:** Button test "does not fire onClick when disabled" only passes because native `<button disabled>` suppresses events. For `<Button as="a" disabled>`, the test was not written — `aria-disabled` does NOT suppress click events on anchors.
- **Impact:** Custom element targets with `disabled` will still fire onClick handlers, creating an accessibility and behavior inconsistency.
- **Root cause:** The composition layer correctly sets `aria-disabled` but doesn't intercept event handlers to prevent execution.
- **Resolution:** Add event suppression when `isDisabled` is true — wrap consumer onClick to early-return when disabled. This belongs in the component factory or a `useDisabledInteraction` hook.
- **Affected:** Component factory, event composition
- **Fix in:** Component factory phase

#### M4 — Pre-existing typecheck errors in polymorphic test files (6 errors)

- **Evidence:** `polymorphic-render.test.tsx` (2 errors: OwnProps constraint, createElement overload), `polymorphic-validation.test.tsx` (4 errors: HTMLElement property access). These predate all proof tasks.
- **Impact:** `pnpm check` fails due to typecheck step. The tests pass at runtime via vitest (no typecheck).
- **Root cause:** Test files use `createElement(PolymorphicComponent, ...)` which can't infer generic parameters, and `screen.getByTestId()` returns `HTMLElement` not specific subtypes.
- **Resolution:** Convert to JSX (as done in proof tests) or use type assertions with `as HTMLButtonElement`.
- **Affected:** `packages/core/src/composition/polymorphic-render.test.tsx`, `polymorphic-validation.test.tsx`
- **Fix in:** KUI-PROOF-005

### Low Priority

#### L1 — `mergePropsAll()` allocates N-1 intermediate objects

- **Evidence:** Implementation iterates with `result = mergeProps(result, src)` in a loop.
- **Impact:** Negligible for typical usage (2-4 sources). Only relevant for extreme cases.
- **Root cause:** Functional composition pattern.
- **Resolution:** Accept for now. Optimize only if profiling shows it matters.
- **Affected:** `packages/core/src/composition/merge-props.ts`
- **Fix in:** Deferred

#### L2 — `renderSlot` spreads props when children are provided

- **Evidence:** `render-slot.ts` line 10: `{ ...resolved.props, children }` creates a new object.
- **Impact:** One extra object allocation per slot with children. Negligible.
- **Root cause:** `createElement` needs children as a prop or rest argument.
- **Resolution:** Accept. The allocation is trivial.
- **Affected:** `packages/core/src/composition/render-slot.ts`
- **Fix in:** Deferred

#### L3 — Slot definitions create two shapes for role field

- **Evidence:** `defineSlot` returns `{ ...def, role }` when role is provided, plain `def` otherwise. The `role` key is absent (not undefined) when not specified.
- **Impact:** V8 hidden class deoptimization (minor). Role presence must be checked with `"role" in slot` rather than `slot.role !== undefined`.
- **Root cause:** Conditional spread to avoid `role: undefined` in the object.
- **Resolution:** Always include `role: undefined` in the default. This is a one-line change.
- **Affected:** `packages/core/src/composition/slot-definitions.ts`
- **Fix in:** KUI-PROOF-005

#### L4 — `isForwardRefComponent` uses string comparison for Symbol

- **Evidence:** `slot-replacement.ts`: `String(element.$$typeof) === "Symbol(react.forward_ref)"`.
- **Impact:** Fragile if React internals change the symbol description.
- **Root cause:** No public API to check if a component is a forwardRef wrapper.
- **Resolution:** Compare against `Symbol.for("react.forward_ref")` directly, or accept the heuristic with a comment.
- **Affected:** `packages/core/src/composition/slot-replacement.ts`
- **Fix in:** KUI-PROOF-005

### Deferred to Later Phases

#### D1 — No required slot enforcement at render time

- **Evidence:** Button defines `content` as `required: true` but nothing validates it actually renders.
- **Resolution:** Add dev-mode warning in renderSlots when a required slot is null.
- **Fix in:** Component factory phase

#### D2 — No slot default children mechanism

- **Evidence:** Each component manually passes children to each slot via `renderSlot(resolved.content, children)`.
- **Resolution:** Consider `defaultChildren` in slot definitions or a render template API.
- **Fix in:** Component factory phase

#### D3 — Typography tokens hardcoded as CSS variable strings

- **Evidence:** Text component hardcodes `"var(--kui-typography-body-font-family, inherit)"`.
- **Resolution:** Token consumption should use a generated mapping from the token package. Not needed until the styling engine exists.
- **Fix in:** Styling engine phase

#### D4 — No responsive or variant-aware typography

- **Evidence:** Text uses a single fixed style object for all instances.
- **Resolution:** Requires the variant/styling engine which is intentionally not built yet.
- **Fix in:** Styling engine phase

---

## Validated Capabilities

| Capability                      | Box          | Text          | Button           | Verdict  |
| ------------------------------- | ------------ | ------------- | ---------------- | -------- |
| Default element rendering       | ✓ div        | ✓ span        | ✓ button         | **Pass** |
| Polymorphic `as` (native)       | ✓ 6 elements | ✓ 10 elements | ✓ anchor         | **Pass** |
| Polymorphic `as` (custom)       | ✓ forwardRef | ✓ forwardRef  | ✓ forwardRef     | **Pass** |
| Ref forwarding                  | ✓ 5 tests    | ✓ 6 tests     | ✓ 4 tests        | **Pass** |
| className merging               | ✓            | ✓             | ✓                | **Pass** |
| Style merging                   | ✓            | ✓ override    | ✓                | **Pass** |
| ARIA attributes                 | ✓ 5 tests    | ✓ 6 tests     | ✓ 4 tests        | **Pass** |
| Data attributes                 | ✓            | ✓             | ✓                | **Pass** |
| Event handlers                  | ✓ 4 tests    | ✓ 2 tests     | ✓ 4 tests        | **Pass** |
| Event cancellation              | —            | —             | ✓ preventDefault | **Pass** |
| Slot definitions                | —            | —             | ✓ 5 slots        | **Pass** |
| Slot rendering                  | —            | —             | ✓ conditional    | **Pass** |
| Consumer slotProps              | —            | —             | ✓ merged         | **Pass** |
| Disabled state                  | —            | —             | ✓ native + aria  | **Pass** |
| Loading state                   | —            | —             | ✓ aria-busy      | **Pass** |
| SSR (renderToString)            | ✓ 5 tests    | ✓ 7 tests     | ✓ 5 tests        | **Pass** |
| React Strict Mode               | ✓ 4 tests    | ✓ 4 tests     | ✓ 3 tests        | **Pass** |
| Type inference                  | ✓ 5 tests    | ✓ 6 tests     | ✓ 4 tests        | **Pass** |
| Tree shaking (two entry points) | ✓            | ✓             | ✓                | **Pass** |

---

## Bundle Analysis

| Entry          | JS       | DTS      | Source Map |
| -------------- | -------- | -------- | ---------- |
| composition.js | 16.55 KB | 30.44 KB | 66.56 KB   |
| index.js       | 14.09 KB | 7.09 KB  | 40.25 KB   |

- React is not bundled (peer dep) ✓
- ESM-only output ✓
- Source maps present ✓
- No CSS artifacts in composition bundle ✓

---

## Test Evidence Summary

- **Total tests:** 3394 across 154 files
- **Proof component tests:** 162 (Box 48, Text 57, Button 57)
- **Composition infrastructure tests:** ~500 (slot system, merge, polymorphic, ARIA, refs)
- **All passing:** ✓
- **Lint:** Clean (0 errors)
- **Typecheck errors:** 7 total (6 pre-existing in polymorphic test files, 1 fixed in this review)

---

## Next Steps

1. **KUI-PROOF-005:** Fix H1 (SlotOverrides undefined), M2 (unsafe casts), M4 (pre-existing type errors), L3 (slot role shape), L4 (forwardRef detection)
2. **Component factory:** Address H2 (PolymorphicProps any collapse), H3 (element in useProps), M1 (root element unification), M3 (disabled event suppression), D1 (required slot enforcement), D2 (slot default children)
3. **Styling engine phase:** Address D3 (token consumption), D4 (responsive typography)
