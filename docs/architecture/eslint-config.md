# ESLint Configuration

> Architecture decision document for KairoUI linting standards.

## Format

Uses ESLint 9 flat config (`eslint.config.mjs`). All configuration lives in one file at the repository root.

## Plugin Stack

| Plugin                      | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `@eslint/js`                | Core JavaScript rules                                 |
| `typescript-eslint`         | TypeScript type-aware linting (strict preset)         |
| `eslint-plugin-react`       | React-specific rules                                  |
| `eslint-plugin-react-hooks` | Hooks rules of hooks & exhaustive-deps                |
| `eslint-plugin-jsx-a11y`    | JSX accessibility (strict preset)                     |
| `eslint-plugin-import-x`    | Import ordering, cycles, boundary enforcement         |
| `eslint-config-prettier`    | Disables formatting rules that conflict with Prettier |

## Notable Decisions

### Type-Aware Linting

Type-aware rules (`strictTypeChecked`) are enabled globally via `projectService`. This provides the highest value for catching real bugs (unsafe `any` propagation, floating promises, etc.) at the cost of slightly slower lint runs.

### Package Boundary Enforcement

`import-x/no-internal-modules` prevents importing from another package's internal paths. Only root exports and `package.json` are allowed:

```ts
// ✅ Allowed
import { something } from "@kairoui/core";
import pkg from "@kairoui/core/package.json";

// ❌ Blocked
import { internal } from "@kairoui/core/src/internals";
```

### Circular Dependency Detection

`import-x/no-cycle` detects circular imports up to 3 levels deep. This catches most problematic cycles while keeping lint performance reasonable.

### Test File Relaxations

Test files (`*.test.ts`, `*.spec.ts`, `__tests__/`) relax certain type-safety rules where test ergonomics outweigh strictness:

- `no-non-null-assertion` — tests often assert known state
- `no-unsafe-assignment` / `no-unsafe-member-access` — mock objects

### Storybook Files

Story files allow default exports (required by Storybook's CSF format).

### Config / Script Files

Node-based config and script files (`*.config.*`, `tooling/`, `scripts/`) run in Node globals and relax unsafe-type rules since many tooling libraries lack proper typings.

### Prettier Integration

`eslint-config-prettier` is applied last to disable all formatting-related rules. ESLint handles correctness; Prettier handles formatting.

### React Version

Set to `"19"` explicitly rather than `"detect"` to avoid warnings before React is installed as a dependency.

## Ignored Paths

- `dist/` — build output
- `coverage/` — test coverage reports
- `node_modules/` — dependencies
- `*.d.ts` — generated declaration files
- `storybook-static/` — Storybook build
- `.turbo/`, `.vite/` — tool caches
