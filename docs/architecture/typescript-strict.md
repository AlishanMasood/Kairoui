# Strict TypeScript Standards

> Architecture decision document for KairoUI TypeScript strictness policy.

## Enabled Options

All options are set in `tooling/tsconfig/base.json` and inherited by every package.

### Core Strict Mode (`strict: true`)

Enables the full `strict` family:

- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `useUnknownInCatchVariables`
- `noImplicitThis`
- `alwaysStrict`

### Additional Strict Options

| Option                               | Rationale                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `noUncheckedIndexedAccess`           | Forces `T                                                                                       | undefined` on index signatures — prevents silent null errors on dynamic access |
| `exactOptionalPropertyTypes`         | Distinguishes `{ x?: T }` from `{ x: T                                                          | undefined }`— prevents accidental`undefined` assignment to optional props      |
| `noImplicitOverride`                 | Requires explicit `override` keyword — catches accidental method overrides in class hierarchies |
| `noFallthroughCasesInSwitch`         | Prevents unintentional switch fallthrough — requires explicit `break` or `return`               |
| `noImplicitReturns`                  | All code paths in a function must return a value — catches silent `undefined` returns           |
| `noPropertyAccessFromIndexSignature` | Forces bracket notation for index signature access — makes dynamic property access explicit     |
| `useUnknownInCatchVariables`         | Catch variables are `unknown` not `any` — forces safe error handling                            |
| `noUnusedLocals`                     | Errors on unused variables — keeps code clean                                                   |
| `noUnusedParameters`                 | Errors on unused function parameters — prefix with `_` if intentionally unused                  |
| `forceConsistentCasingInFileNames`   | Prevents case-sensitivity bugs across OS platforms                                              |

## Intentionally Not Enabled

| Option                          | Reason                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `noUncheckedSideEffectImports`  | Not yet available in all TS versions we support; CSS imports would require declarations |
| `noImplicitAny` (standalone)    | Already included via `strict: true`                                                     |
| `strictNullChecks` (standalone) | Already included via `strict: true`                                                     |

## TypeScript Suppression Policy

### Rules

1. **Never use `any`** as a type annotation. Use `unknown` and narrow.
2. **Never use `@ts-ignore`**. Use `@ts-expect-error` with a mandatory explanation comment.
3. **`@ts-expect-error` requires justification**: the comment must explain _why_ it's necessary and link to a tracking issue if applicable.
4. **Blanket type casts (`as any`, `as unknown as T`)** are prohibited unless:
   - Interfacing with an untyped third-party API where proper types cannot be declared
   - The cast is documented and isolated in a single utility function
5. **Unused parameters** must be prefixed with `_` (e.g. `_event`).

### Acceptable Suppression Example

```ts
// @ts-expect-error — third-party lib types are incorrect for overloaded signature
// Tracked: https://github.com/example/lib/issues/123
const result = thirdPartyFn(arg);
```

### Unacceptable Patterns

```ts
// ❌ No justification
// @ts-expect-error
const x = something();

// ❌ Using @ts-ignore
// @ts-ignore
const y = something();

// ❌ Blanket cast to bypass type safety
const z = value as any as DesiredType;
```

## Public API Guidance

- Keep exported types simple and understandable.
- Prefer explicit interfaces over complex conditional/mapped types in public APIs.
- Internal utility types may use advanced generics, but public-facing types should be readable by consumers without deep TypeScript expertise.
- Document any generic type parameter with JSDoc `@template` tags.
