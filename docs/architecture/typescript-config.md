# TypeScript Configuration Hierarchy

> Architecture decision document for KairoUI TypeScript setup.

## Overview

KairoUI uses a layered TypeScript configuration managed through the `@kairoui/tsconfig` workspace package.

## Configuration Files

```
tooling/tsconfig/
├── base.json            — Shared foundation (all packages inherit from this)
├── react-library.json   — Extends base + DOM libs + JSX for React packages
└── node.json            — Extends base for Node.js tooling scripts
```

## Inheritance Hierarchy

```
base.json
├── react-library.json   → packages/core, theme, hooks, icons
├── node.json            → tooling scripts, build tools
└── (direct)             → packages/tokens, utils
```

## Key Design Decisions

### ESM-Only (`"module": "ESNext"`, `"moduleResolution": "bundler"`)

All packages target ESM. The `bundler` module resolution allows bare specifier imports without file extensions while remaining compatible with Vite, esbuild, and other modern bundlers.

### `verbatimModuleSyntax: true`

Enforces explicit `type` annotations on type-only imports/exports. This ensures the build output is predictable and prevents accidental runtime imports of type-only modules.

### `isolatedModules: true`

Required for compatibility with single-file transpilers (esbuild, SWC) used by Vite. Prevents constructs that require whole-program analysis.

### `composite: true` (package-level)

Enables TypeScript project references. The root `tsconfig.json` uses `references` to build all packages together while maintaining isolation.

### `noEmit: true` (base config)

The base config disables emit by default. TypeScript is used only for type checking — the actual build will be performed by Vite/esbuild. Package-level `outDir`/`rootDir` are set for when a build pipeline is configured.

### No Path Aliases

Path aliases (`paths`) are intentionally excluded. They create a discrepancy between editor resolution and runtime resolution in built packages. Cross-package imports use the workspace protocol (`workspace:*`) and package names.

## Usage

Each package `tsconfig.json` is minimal:

```json
{
  "extends": "@kairoui/tsconfig/react-library.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Root Typecheck

```bash
pnpm typecheck
```

Runs `tsc --build` from the root, which uses project references to type-check all packages in dependency order.

## Adding a New Package

1. Create a `tsconfig.json` that extends the appropriate preset.
2. Set `"composite": true`.
3. Add a `{ "path": "packages/<name>" }` entry to the root `tsconfig.json` references.
4. Run `pnpm typecheck` to verify.
