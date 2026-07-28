# Package Export Strategy

> Architecture decision document for KairoUI public API contracts.

## Overview

All `@kairoui/*` packages follow a consistent export strategy designed for:

- ESM-only consumption
- Full TypeScript type safety
- Optimal tree shaking
- Encapsulated internal modules
- Future CSS side-effect support

## Root Export Pattern

Every package exposes a single root entry point:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

Consumers import exclusively from the package root:

```ts
import { Button } from "@kairoui/core";
import { usePress } from "@kairoui/hooks";
import { tokens } from "@kairoui/tokens";
```

**Never** from internal paths:

```ts
// ❌ FORBIDDEN — not a public contract
import { Button } from "@kairoui/core/src/components/button";
import { something } from "@kairoui/core/dist/internal/util";
```

## Subpath Export Criteria

Subpath exports (e.g. `@kairoui/tokens/css`) are allowed only when:

1. The export serves a **distinct consumption mode** (e.g. CSS vs JS tokens)
2. The subpath is **documented** in the package README
3. The subpath was **approved** through an architecture review
4. The export has a **stable** API surface — once published, it is a contract

Current approved subpath exports:

| Package | Subpath | Purpose |
| ------- | ------- | ------- |
| `@kairoui/core` | `./styles.css` | Component base styles |
| `@kairoui/tokens` | `./css` | CSS custom property definitions |
| `@kairoui/theme` | `./styles.css` | Theme runtime styles |

All packages also export `./package.json` for tooling introspection.

## Internal Module Protection

- The `exports` field acts as the **sole** public API boundary.
- Paths not listed in `exports` are unreachable by consumers (Node.js 16+ and modern bundlers enforce this).
- The `files` field restricts published content to `dist/` only — source code is never distributed.
- Internal modules must **not** be referenced in documentation or examples.

## Side Effects and CSS

Packages that ship CSS declare side effects explicitly:

```json
{
  "sideEffects": ["**/*.css"]
}
```

Pure-logic packages (hooks, utils, icons) declare:

```json
{
  "sideEffects": false
}
```

This allows bundlers to safely tree-shake unused exports from side-effect-free packages.

### CSS Import Pattern

When a package provides styles, consumers import them explicitly:

```ts
import "@kairoui/core/styles.css";
import "@kairoui/tokens/css";
```

CSS is **never** imported as a side effect of importing JS. This keeps the boundary clear and avoids unintended style injection.

## Tree-Shaking Expectations

- All packages use ESM (`"type": "module"`).
- The `module` field points to the ESM bundle for legacy bundler compatibility.
- Named exports allow bundlers to eliminate unused code.
- Barrel files (`index.ts`) re-export only the public API — no deep internal re-exports.
- Packages with `"sideEffects": false` are fully tree-shakeable.

## Backward Compatibility

- Once a package is published (no longer `private`), its root export is a **stable contract**.
- Removing or renaming an export requires a **major version bump**.
- Adding new named exports to an existing entry point is non-breaking.
- Adding new subpath exports is non-breaking.
- Internal restructuring that preserves the `exports` map is non-breaking.

## Field Reference

| Field | Purpose |
| ----- | ------- |
| `exports` | Definitive public API map (takes precedence over `main`/`types`) |
| `main` | Fallback entry for tools that don't support `exports` |
| `module` | ESM entry hint for legacy bundlers (Webpack 4, etc.) |
| `types` | TypeScript entry for tools that don't read `exports.types` |
| `sideEffects` | Tree-shaking hint — `false` or array of side-effect patterns |
| `files` | Whitelist of published content (only `dist/`) |

## Development vs Production

During development (packages are `private`), workspace consumers resolve directly through pnpm workspace protocol. The `exports` map targets `dist/` which will be populated once the build pipeline is configured. For local development with unbundled source, TypeScript path aliases or workspace `tsconfig` references will be used.
