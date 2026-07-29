# Repository Architecture

## Monorepo Structure

KairoUI is a pnpm workspace monorepo managed with [Turborepo](https://turbo.build/) for task orchestration. All workspace members live under three top-level directories:

| Directory    | Purpose                          | Published?       |
| ------------ | -------------------------------- | ---------------- |
| `packages/*` | Core library packages            | Yes (when ready) |
| `apps/*`     | Internal applications            | No               |
| `tooling/*`  | Shared configs and build scripts | No               |

## Package Responsibilities

| Package           | Scope                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| `@kairoui/core`   | Foundation primitives, base component architecture, polymorphic composition |
| `@kairoui/tokens` | Design tokens: color, spacing, typography, shadows, scales                  |
| `@kairoui/theme`  | Theme provider, runtime switching, token-to-CSS-variable resolution         |
| `@kairoui/hooks`  | Shared React hooks: accessibility, interaction, state management            |
| `@kairoui/icons`  | SVG icon components with consistent sizing, color, and ARIA attributes      |
| `@kairoui/utils`  | Type helpers, DOM utilities, class merging, platform detection              |

## Dependency Rules

1. **Packages may depend on other packages** via `workspace:*` protocol.
2. **Apps may depend on any package** — they are consumers, not libraries.
3. **Tooling packages are dev-only** — never a runtime dependency.
4. **No circular dependencies** between packages. ESLint enforces this (`import-x/no-cycle`).
5. **No internal imports** across package boundaries. Only the root `exports` entry is public.

## Public vs Internal API

The `exports` field in each `package.json` defines the **entire** public API surface. Anything not in `exports` is internal and must not be imported by consumers.

```ts
// ✅ Public — defined in exports
import { Button } from "@kairoui/core";

// ❌ Internal — blocked by ESLint and package.json exports
import { internalHelper } from "@kairoui/core/src/utils";
```

See [Package Export Strategy](../architecture/package-exports.md) for the full policy.

## Build Pipeline

- **tsup** — Bundles each package to ESM with TypeScript declarations.
- **Turborepo** — Orchestrates builds in dependency order with caching.
- **TypeScript** — Type checking only (`noEmit: true`). Does not produce output.

Build order is determined by `dependsOn: ["^build"]` in `turbo.json` — each package builds after its dependencies.

## Configuration Hierarchy

### TypeScript

Shared presets live in `tooling/tsconfig/`. Each package extends the appropriate preset:

```
tooling/tsconfig/base.json        → Foundation (all packages)
tooling/tsconfig/react-library.json → + DOM + JSX (React packages)
tooling/tsconfig/node.json         → Node.js tooling
```

See [TypeScript Configuration](../architecture/typescript-config.md).

### ESLint

A single flat config at the repository root (`eslint.config.mjs`). No per-package ESLint configs. See [ESLint Configuration](../architecture/eslint-config.md).

### Prettier

A single config at the root (`.prettierrc.json`). No per-package overrides.

## CI Pipeline

GitHub Actions runs on every push to `main` and every pull request:

1. Install dependencies (`--frozen-lockfile`)
2. Build all packages
3. Check formatting
4. Lint
5. Type check
6. Run tests
7. Build Storybook
8. Build documentation

The release workflow uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.
