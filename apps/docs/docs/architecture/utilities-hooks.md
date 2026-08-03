---
sidebar_position: 5
title: Utilities and Hooks Architecture
---

# Utilities and Hooks Architecture

This document defines the responsibilities, boundaries, and rules for `@kairoui/utils` and `@kairoui/hooks` — the shared infrastructure layer that all KairoUI components depend on.

## Dependency Direction

```
@kairoui/utils          (independent — zero runtime dependencies)
        ↓
@kairoui/tokens         (independent — may optionally use utils)
        ↓
@kairoui/theme          (depends on tokens)
        ↓
@kairoui/hooks          (depends on utils; peerDep: react)
        ↓
@kairoui/core           (depends on theme + hooks + utils; peerDep: react)
        ↓
future component packages
```

**Rules:**

- `@kairoui/utils` has **no** runtime dependencies. It must never import from tokens, theme, hooks, or core.
- `@kairoui/hooks` depends on `@kairoui/utils` and has `react` as a peer dependency.
- No circular dependencies are permitted at any level.
- Any package may depend on `@kairoui/utils`. Only React packages may depend on `@kairoui/hooks`.

---

## @kairoui/utils — Responsibilities

Framework-independent, pure TypeScript utilities shared across all KairoUI packages.

### Categories

| Category                  | Examples                                         | Environment                                          |
| ------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| **Type utilities**        | `Prettify<T>`, `RequiredKeys<T>`, `Merge<A,B>`   | Universal                                            |
| **Assertion utilities**   | `invariant()`, `warning()`, `assertNever()`      | Universal                                            |
| **Identity and noop**     | `noop()`, `identity()`                           | Universal                                            |
| **Object utilities**      | `pick()`, `omit()`, `shallowEqual()`             | Universal                                            |
| **String utilities**      | `camelToKebab()`, `kebabToCamel()`               | Universal                                            |
| **Array utilities**       | `toArray()`, `compact()`, `groupBy()`            | Universal                                            |
| **Number utilities**      | `clamp()`, `roundTo()`                           | Universal                                            |
| **ID generation**         | `generateId()`, `createIdGenerator()`            | Universal                                            |
| **Function utilities**    | `callAll()`, `composeEventHandlers()`            | Universal                                            |
| **DOM type guards**       | `isElement()`, `isHTMLElement()`, `isDocument()` | Universal (type-only; no DOM access at module level) |
| **Environment detection** | `canUseDOM()`, `isServer()`                      | Universal                                            |

### What @kairoui/utils must NOT contain

- React hooks or components
- Browser API calls at module init (no `document`, `window`, `localStorage` at top-level)
- Design token references
- Theme logic
- Styling utilities
- Anything that requires a runtime dependency

### Export Strategy

Single entry point: `@kairoui/utils`

All utilities are tree-shakeable via `sideEffects: false`. No sub-path exports unless a clear server/DOM split emerges (deferred).

---

## @kairoui/hooks — Responsibilities

React-specific hooks providing reusable interaction, state, and accessibility patterns for KairoUI components.

### Categories

| Category                | Examples                                                        | Environment     |
| ----------------------- | --------------------------------------------------------------- | --------------- |
| **ID hooks**            | `useId()`                                                       | Server + Client |
| **State hooks**         | `useControllableState()`, `useToggle()`                         | Client          |
| **Ref hooks**           | `useMergedRef()`, `useCallbackRef()`, `usePrevious()`           | Client          |
| **Event hooks**         | `useEventCallback()`, `useEventListener()`                      | Client          |
| **DOM hooks**           | `useFocusVisible()`, `useMediaQuery()`, `useIsomorphicEffect()` | Client          |
| **Accessibility hooks** | `useAnnounce()`, `useAriaDescribedBy()`                         | Client          |
| **Lifecycle hooks**     | `useMountEffect()`, `useUnmountEffect()`, `useUpdateEffect()`   | Client          |
| **Interaction hooks**   | `usePress()`, `useKeyboard()`, `useLongPress()`                 | Client          |

### What @kairoui/hooks must NOT contain

- Non-React utilities (those belong in `@kairoui/utils`)
- Visual components or JSX
- Theme-specific hooks (those stay in `@kairoui/core`)
- Design tokens
- Global side effects at module level

### Export Strategy

Single entry point: `@kairoui/hooks`

All hooks are tree-shakeable via `sideEffects: false`. React is a **peer dependency**, never bundled.

---

## Server Safety

### @kairoui/utils

All utilities are server-safe by default. No module-level browser globals.

DOM type guards (`isElement`, `isHTMLElement`) check types only — they do not access `document` or `window` at import time.

Environment detection (`canUseDOM`) returns a boolean without throwing on the server.

### @kairoui/hooks

Hooks that access browser APIs must be guarded:

- Use `useIsomorphicEffect` (useEffect on server, useLayoutEffect on client) for layout-sensitive hooks
- Use `canUseDOM()` from `@kairoui/utils` before accessing browser globals
- Never call `document`, `window`, or `navigator` during SSR render

---

## Internal vs Public Utilities

| Visibility   | Rule                                                                                    |
| ------------ | --------------------------------------------------------------------------------------- |
| **Public**   | Exported from the package entry point. Covered by semver. Documented.                   |
| **Internal** | Not exported from entry point. Used only within the package. May change without notice. |

Utilities start as **internal** and graduate to **public** only when:

1. Used by two or more packages, or
2. Explicitly needed by consumers (documented use case)

Internal utilities live in files not re-exported from `index.ts`. They are still tested.

---

## Testing Requirements

### @kairoui/utils

- Environment: **node** (no DOM environment needed)
- 100% test coverage target for public utilities
- Tests validate edge cases, type narrowing, and error paths
- No React dependencies in test files

### @kairoui/hooks

- Environment: **happy-dom** with React Testing Library
- Each hook has a dedicated test file
- Tests cover: initial state, state transitions, cleanup, SSR safety, ref stability
- Use `renderHook` from `@testing-library/react`
- Verify that hooks do not trigger unnecessary re-renders

---

## Naming Conventions

### Function Prefix Rules

| Prefix     | Meaning                                   | Returns                         | Example                                        |
| ---------- | ----------------------------------------- | ------------------------------- | ---------------------------------------------- |
| `is*`      | Boolean type guard or predicate           | `boolean` (with type narrowing) | `isElement()`, `isHTMLElement()`, `isString()` |
| `has*`     | Existence/presence check                  | `boolean`                       | `hasProperty()`, `hasOwn()`                    |
| `can*`     | Capability or feature check               | `boolean`                       | `canUseDOM()`, `canFocus()`                    |
| `get*`     | Read without mutation                     | The requested value             | `getOwnerDocument()`, `getActiveElement()`     |
| `set*`     | Explicit mutation of a value              | `void` or the new value         | `setAttribute()`                               |
| `create*`  | Factory — produces a new instance         | The created object/function     | `createIdGenerator()`, `createContext()`       |
| `resolve*` | Derives final value from inputs           | The resolved value              | `resolvePreference()`, `resolveRef()`          |
| `merge*`   | Combines two or more values of same shape | Merged value                    | `mergeRefs()`, `mergeProps()`                  |
| `compose*` | Combines behaviors or functions           | Combined function/handler       | `composeEventHandlers()`                       |
| `to*`      | Converts from one form to another         | Converted value                 | `toArray()`, `toString()`                      |
| `from*`    | Constructs from a specific source         | Constructed value               | `fromEntries()`                                |
| `use*`     | React hook (**only** for hooks)           | Hook result                     | `useControllableState()`                       |

**The `use*` prefix is reserved exclusively for React hooks.** Never name a plain function with `use*`.

### Utility Function Names — @kairoui/utils

| Category             | Pattern                             | Examples                                                             |
| -------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| Type guards          | `is` + PascalNoun                   | `isElement`, `isHTMLElement`, `isDocument`, `isString`, `isFunction` |
| Boolean predicates   | `is`/`has`/`can` + descriptive noun | `canUseDOM`, `hasProperty`, `isServer`                               |
| Object utilities     | verb + noun                         | `pick`, `omit`, `shallowEqual`                                       |
| Array utilities      | verb or `to` + noun                 | `toArray`, `compact`, `groupBy`                                      |
| Number utilities     | verb                                | `clamp`, `roundTo`                                                   |
| String utilities     | descriptive verb phrase             | `camelToKebab`, `kebabToCamel`                                       |
| Function composition | `compose` / `call` + noun           | `composeEventHandlers`, `callAll`                                    |
| ID generation        | `generate` / `create` + noun        | `generateId`, `createIdGenerator`                                    |
| Assertion            | verb                                | `invariant`, `warning`, `assertNever`                                |
| Environment          | `is`/`can` + noun                   | `canUseDOM`, `isServer`                                              |
| No-op/identity       | noun                                | `noop`, `identity`                                                   |

### React Hook Names — @kairoui/hooks

| Category            | Pattern                  | Examples                                        |
| ------------------- | ------------------------ | ----------------------------------------------- |
| State hooks         | `use` + noun/verb        | `useControllableState`, `useToggle`             |
| Ref hooks           | `use` + ref descriptor   | `useMergedRef`, `useCallbackRef`, `usePrevious` |
| Event hooks         | `use` + event noun       | `useEventCallback`, `useEventListener`          |
| DOM hooks           | `use` + DOM concept      | `useFocusVisible`, `useMediaQuery`              |
| Lifecycle hooks     | `use` + lifecycle phase  | `useMountEffect`, `useUpdateEffect`             |
| Interaction hooks   | `use` + interaction verb | `usePress`, `useKeyboard`, `useLongPress`       |
| Accessibility hooks | `use` + a11y concept     | `useAnnounce`, `useAriaDescribedBy`             |
| Layout hooks        | `use` + layout concept   | `useIsomorphicEffect`                           |
| ID hooks            | `use` + "Id"             | `useId`                                         |

### Type Names

| Kind                | Pattern                         | Examples                                        |
| ------------------- | ------------------------------- | ----------------------------------------------- |
| Type utilities      | `PascalCase` descriptive noun   | `Prettify<T>`, `RequiredKeys<T>`, `Merge<A, B>` |
| Hook options        | `Use[HookName]Options`          | `UseControllableStateOptions<T>`                |
| Hook return         | `Use[HookName]Result`           | `UseControllableStateResult<T>`                 |
| Function options    | `[FunctionName]Options`         | `CreateIdGeneratorOptions`                      |
| Event handler type  | `[Event]Handler`                | `PressHandler`, `KeyboardHandler`               |
| Generic constraints | Single uppercase or descriptive | `T`, `TValue`, `TElement extends HTMLElement`   |

### Constant Names

| Kind             | Pattern            | Examples                      |
| ---------------- | ------------------ | ----------------------------- |
| Immutable values | `UPPER_SNAKE_CASE` | `EMPTY_OBJECT`, `EMPTY_ARRAY` |
| Default options  | `DEFAULT_*`        | `DEFAULT_ID_PREFIX`           |

### Callback Prop Conventions

Event/change callback props follow this pattern:

```
on[Thing]Change    — value changed
on[Thing]          — event occurred (no "Change" when the prop IS the event)
```

| Pattern           | When to use            | Examples                                |
| ----------------- | ---------------------- | --------------------------------------- |
| `onChange`        | Primary value changed  | `onChange` on an input                  |
| `onOpenChange`    | Boolean state changed  | `onOpenChange(open: boolean)`           |
| `onValueChange`   | Explicit value changed | `onValueChange(value: T)`               |
| `onModeChange`    | Named enum changed     | `onModeChange(mode: ThemeMode)`         |
| `onDensityChange` | Named enum changed     | `onDensityChange(density: DensityMode)` |
| `onPress`         | Interaction event      | `onPress(event: PressEvent)`            |
| `onKeyDown`       | Native event forwarded | `onKeyDown(event: KeyboardEvent)`       |
| `onFocusChange`   | Focus state changed    | `onFocusChange(isFocused: boolean)`     |

**Rules:**

- Always use `on` prefix for callbacks passed as props.
- Use `Change` suffix when communicating a new value (not an event object).
- The callback argument should be the **new value**, not the event, unless forwarding a native event.
- Never use `handle*` in public APIs — that is for internal implementation only.

### File Naming

| Kind             | Pattern                                   | Examples                                         |
| ---------------- | ----------------------------------------- | ------------------------------------------------ |
| Utility module   | `kebab-case.ts`                           | `dom-guards.ts`, `shallow-equal.ts`              |
| Hook module      | `use-kebab-case.ts`                       | `use-controllable-state.ts`, `use-merged-ref.ts` |
| Test file        | `[module].test.ts` or `[module].test.tsx` | `dom-guards.test.ts`, `use-merged-ref.test.tsx`  |
| Type-only module | `types.ts`                                | `types.ts` (one per package)                     |
| Internal module  | no special prefix; just not in `index.ts` | `internal-helpers.ts`                            |
| Entry point      | `index.ts`                                | `index.ts`                                       |

### Test Naming

| Kind           | Pattern                                | Example                                 |
| -------------- | -------------------------------------- | --------------------------------------- |
| Test file      | Same name as source + `.test.ts(x)`    | `assertion.test.ts`                     |
| Describe block | Module or function name                | `describe("invariant", ...)`            |
| Test case      | Describes behavior, not implementation | `it("throws when condition is false")`  |
| Boundary test  | `boundaries.test.ts`                   | `packages/utils/src/boundaries.test.ts` |

### Internal Module Naming

Internal modules (not exported from `index.ts`):

- Use descriptive `kebab-case` file names — no `helper`, `common`, `misc`, `shared`, or `temp`.
- Unexported helpers within a file may use a `_` prefix: `function _normalizeInput(...)`.
- Never name a file `utils2.ts`, `helpers.ts`, `stuff.ts`, or similar vague names.

### Forbidden Names

These names are too vague and must never be used for files, exports, or functions:

```
helper / helpers
common
misc / miscellaneous
shared
doThing / handleData
utils2 / utils3
temp / tmp
stuff
data
manager (unless genuinely managing lifecycle)
service (unless genuinely a service boundary)
```

---

## Browser-Global Restrictions

| Package          | Module-level browser access | Runtime browser access                                 |
| ---------------- | --------------------------- | ------------------------------------------------------ |
| `@kairoui/utils` | **Forbidden**               | Allowed inside functions guarded by `canUseDOM()`      |
| `@kairoui/hooks` | **Forbidden**               | Allowed inside `useEffect`/`useLayoutEffect` callbacks |

Violations are caught by:

1. The `node` test environment for `@kairoui/utils` (import would throw)
2. SSR tests for `@kairoui/hooks` (render on server must not throw)

---

## Deprecation Rules

1. Mark deprecated exports with `@deprecated` JSDoc tag.
2. Emit a `warning()` call in development mode on first use.
3. Maintain deprecated exports for at least one minor version.
4. Remove in the next major version.
5. Document migration path in the deprecation notice.

---

## File Organization

### @kairoui/utils

```
src/
  index.ts              — public re-exports
  assertion.ts          — invariant, warning, assertNever
  environment.ts        — canUseDOM, isServer
  function.ts           — noop, identity, callAll, composeEventHandlers
  id.ts                 — generateId, createIdGenerator
  object.ts             — pick, omit, shallowEqual
  string.ts             — camelToKebab, kebabToCamel
  array.ts              — toArray, compact, groupBy
  number.ts             — clamp, roundTo
  dom-guards.ts         — isElement, isHTMLElement, isDocument
  types.ts              — Prettify, RequiredKeys, Merge, etc.
```

### @kairoui/hooks

```
src/
  index.ts                    — public re-exports
  use-controllable-state.ts   — controlled/uncontrolled state pattern
  use-merged-ref.ts           — merge multiple refs
  use-callback-ref.ts         — stable callback ref
  use-event-callback.ts       — stable event handler
  use-event-listener.ts       — declarative event listener
  use-id.ts                   — SSR-safe ID generation
  use-isomorphic-effect.ts    — useEffect/useLayoutEffect switch
  use-focus-visible.ts        — :focus-visible detection
  use-media-query.ts          — reactive media query
  use-previous.ts             — previous value tracking
  use-mount-effect.ts         — effect on mount only
  use-toggle.ts               — boolean toggle state
  use-press.ts                — pointer/keyboard press
  use-keyboard.ts             — keyboard event handling
  use-announce.ts             — ARIA live region announcements
```

---

## Relationship to Existing Packages

### @kairoui/theme

Theme already has internal utilities (e.g., `merge.ts`, `validate.ts`). These are **theme-specific** and remain in `@kairoui/theme`. If a theme utility proves generally useful, it may be extracted to `@kairoui/utils` in a future task.

### @kairoui/core

Core currently implements its own provider hooks. Theme-specific hooks (`useTheme`, `useThemeMode`, `useDensity`) remain in `@kairoui/core`. Generic hooks (`useControllableState`, `useMergedRef`) move to `@kairoui/hooks` so future component packages can use them without depending on `@kairoui/core`.

---

## Phase 4 Scope Boundaries

Phase 4 implements:

- Core TypeScript utilities in `@kairoui/utils`
- Foundational React hooks in `@kairoui/hooks`
- Tests for all of the above
- Architecture documentation (this document)

Phase 4 does **not** implement:

- Slot systems or polymorphic components
- Variant/styling engines
- Portal, layer, or focus-trap managers
- Scroll lock or presence animations
- Any visual components (Button, Input, etc.)

---

## Public and Internal API Boundaries

### API Visibility Categories

| Category                         | Package          | Visibility          | Consumer Access                   |
| -------------------------------- | ---------------- | ------------------- | --------------------------------- |
| Framework-independent utilities  | `@kairoui/utils` | **Public**          | Any package or consumer           |
| React hooks                      | `@kairoui/hooks` | **Public**          | React packages and consumers      |
| Component infrastructure helpers | `@kairoui/hooks` | **Internal**        | Only within `@kairoui/hooks`      |
| Testing helpers                  | `@kairoui/utils` | **Internal**        | Only within test files            |
| DOM-only utilities               | `@kairoui/utils` | **Public**          | Guarded by `canUseDOM()`          |
| Server-safe utilities            | `@kairoui/utils` | **Public**          | Universal                         |
| Deprecated APIs                  | Either           | **Public (frozen)** | Consumers, with migration warning |

### Criteria for Public Exposure

An API may be exported publicly only when **all** of these criteria are satisfied:

1. **Broad usefulness** — Used by two or more packages, or documented consumer demand.
2. **Stable behavior** — Contract is well-defined; edge cases are tested.
3. **Clear ownership** — One package owns the implementation. No shared mutable state.
4. **Long-term supportability** — Team is willing to maintain the API across major versions.
5. **No dependency on component internals** — Does not reach into another package's private state.
6. **No access to private runtime state** — Does not require undocumented context, refs, or closures.

If an API fails any criterion, it remains **internal** until the gap is resolved.

### Approved Import Paths

| Import                        | Status       | Notes                             |
| ----------------------------- | ------------ | --------------------------------- |
| `@kairoui/utils`              | **Approved** | Root entry — all public utilities |
| `@kairoui/hooks`              | **Approved** | Root entry — all public hooks     |
| `@kairoui/utils/package.json` | **Approved** | Package metadata access           |
| `@kairoui/hooks/package.json` | **Approved** | Package metadata access           |

### Forbidden Import Paths

| Import                          | Status        | Enforcement                    |
| ------------------------------- | ------------- | ------------------------------ |
| `@kairoui/utils/src/*`          | **Forbidden** | `import-x/no-internal-modules` |
| `@kairoui/hooks/src/*`          | **Forbidden** | `import-x/no-internal-modules` |
| `@kairoui/utils/dist/*`         | **Forbidden** | `import-x/no-internal-modules` |
| `@kairoui/hooks/dist/*`         | **Forbidden** | `import-x/no-internal-modules` |
| `@kairoui/utils/src/internal/*` | **Forbidden** | Not exported; lint rule backup |
| `@kairoui/hooks/src/internal/*` | **Forbidden** | Not exported; lint rule backup |

Deep imports into any `@kairoui/*` package are already blocked by the existing ESLint rule `import-x/no-internal-modules`. Only explicitly allowed sub-paths (declared in `package.json` `exports`) are accessible.

### Internal-Only API Rules

Internal utilities and hooks:

1. Live in files that are **not** re-exported from `index.ts`.
2. May use a `_` prefix convention for unexported helpers within a file (e.g., `_normalizeOptions`).
3. Are still tested — test files may import directly from the source file within the same package.
4. May be promoted to public via a future task (add to `index.ts`, document, test boundary).
5. Must never be imported cross-package. The lint rule enforces this.

### Package Boundary Test Plan

Each package must include a **boundary test file** that validates:

#### `@kairoui/utils` — `src/boundaries.test.ts`

```
- All public exports are importable from the package entry point
- No module-level browser globals (import in node environment succeeds)
- No React dependency (no 'react' in dist output)
- No @kairoui/* dependencies (truly independent)
- sideEffects is false
- exports field matches dist files
- package.json files field is ["dist"]
```

#### `@kairoui/hooks` — `src/boundaries.test.ts`

```
- All public hooks are importable from the package entry point
- React is a peer dependency, not bundled
- @kairoui/utils is the only runtime dependency
- No module-level browser globals (SSR import succeeds)
- No theme or core dependency
- sideEffects is false
- exports field matches dist files
- package.json files field is ["dist"]
```

These tests are modeled on the existing `packages/theme/src/boundaries.test.ts` pattern.

### Export Graduation Process

```
Internal → Public:
1. Utility is used by ≥2 packages (or explicit consumer request)
2. Add to index.ts re-exports
3. Add JSDoc with @public tag
4. Add to boundary test assertions
5. Document in architecture reference
6. Commit with "promote [name] to public API" note
```

```
Public → Deprecated:
1. Add @deprecated JSDoc tag with migration path
2. Add runtime warning() on first call (dev mode only)
3. Remove from documentation "recommended" sections
4. Maintain for ≥1 minor version
5. Remove in next major version
```

### Summary of Enforcement Mechanisms

| Mechanism                       | What it enforces                                |
| ------------------------------- | ----------------------------------------------- |
| `import-x/no-internal-modules`  | No deep imports into `@kairoui/*` packages      |
| `package.json` `exports` field  | Only declared entry points are resolvable       |
| `sideEffects: false`            | Tree-shaking; unused internals are eliminated   |
| `files: ["dist"]`               | Only built output is published                  |
| Boundary tests                  | Public API completeness; no accidental breakage |
| `node` test environment (utils) | Catches module-level browser globals            |
| happy-dom SSR tests (hooks)     | Catches server-unsafe hook behavior             |
