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

### @kairoui/utils

| Pattern           | Example                                                          |
| ----------------- | ---------------------------------------------------------------- |
| Pure functions    | `camelCase` verb or noun: `clamp()`, `identity()`, `isElement()` |
| Type utilities    | `PascalCase`: `Prettify<T>`, `RequiredKeys<T>`                   |
| Constants         | `UPPER_SNAKE_CASE`: `EMPTY_OBJECT`                               |
| Factory functions | `create` prefix: `createIdGenerator()`                           |

### @kairoui/hooks

| Pattern       | Example                                                  |
| ------------- | -------------------------------------------------------- |
| Hooks         | `use` prefix: `useControllableState()`, `useMergedRef()` |
| Return types  | `Use[Name]Result`: `UseControllableStateResult<T>`       |
| Options types | `Use[Name]Options`: `UseControllableStateOptions<T>`     |

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
