# Creating a Package

This guide covers how to add a new workspace package to KairoUI.

## Steps

### 1. Create the directory structure

```
packages/<name>/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── src/
    └── index.ts
```

### 2. Create `package.json`

```json
{
  "name": "@kairoui/<name>",
  "version": "0.0.0",
  "private": true,
  "description": "<One-line description of the package's responsibility.>",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rimraf dist"
  },
  "license": "SEE LICENSE IN ../../LICENSE"
}
```

**Key decisions:**

- `private: true` — Keep private until publication is deliberately configured.
- `sideEffects: false` — Set to `["**/*.css"]` if the package ships CSS.
- `exports` — Only expose the root entry. See [Package Export Strategy](../architecture/package-exports.md).

### 3. Create `tsconfig.json`

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

Use `@kairoui/tsconfig/base.json` for packages that don't use React/DOM (e.g., pure utilities).

### 4. Create `tsup.config.ts`

Use the shared configuration from `tooling/tsup/`:

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
});
```

### 5. Create `src/index.ts`

Keep the entry point minimal:

```ts
// @kairoui/<name> — Entry point
export {};
```

Do not add placeholder APIs that might become accidental public contracts.

### 6. Register in root `tsconfig.json`

Add a reference to the root `tsconfig.json`:

```json
{
  "references": [{ "path": "packages/<name>" }]
}
```

### 7. Add to Vitest configuration

Add the package's test paths to the appropriate project in `vitest.config.mts`:

- React packages → `react` project (happy-dom environment)
- Non-DOM packages → `node` project

### 8. Install and validate

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
```

## Adding Dependencies

```bash
# Add a dependency to a specific package
pnpm add <dep> --filter @kairoui/<name>

# Add a workspace dependency
pnpm add @kairoui/utils --filter @kairoui/<name> --workspace
```

## Adding Subpath Exports

Subpath exports require architecture approval. See the criteria in [Package Export Strategy](../architecture/package-exports.md).
