# KairoUI

**Enterprise React UI Platform**

KairoUI is a production-grade, enterprise-focused React UI platform built as a TypeScript monorepo. It is designed to provide a cohesive, scalable design system and component architecture for large-scale applications — not a generic component collection.

## Vision

- Deliver a unified, accessible, and themeable UI platform for enterprise product teams.
- Enforce consistency through design tokens, composable primitives, and opinionated patterns.
- Prioritize developer experience, performance, and long-term maintainability.

## Technology

| Layer         | Choice          |
| ------------- | --------------- |
| Language      | TypeScript      |
| Framework     | React           |
| Build         | Vite            |
| Testing       | Vitest          |
| Documentation | Storybook       |
| Package Mgmt  | pnpm (monorepo) |

## Repository Structure

```
packages/       — publishable KairoUI packages (components, tokens, utilities)
apps/           — runnable internal applications (docs site, playground)
tooling/        — shared internal configurations and build scripts
docs/           — product, architecture, governance, and contributor documentation
.github/        — GitHub workflows and repository templates
```

Each `packages/*`, `apps/*`, and `tooling/*` directory is a pnpm workspace member. See the README inside each directory for details.

## Status

This repository is under active development. See individual task branches and the project board for progress.

## Prerequisites

| Tool    | Version   |
| ------- | --------- |
| Node.js | >= 20.0.0 |
| pnpm    | 9.15.4    |

This project uses [pnpm workspaces](https://pnpm.io/workspaces). The `packageManager` field in `package.json` declares the exact pnpm version; [corepack](https://nodejs.org/api/corepack.html) or a global install can be used to activate it.

## Getting Started

```bash
pnpm install
```

## Scripts

| Command             | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `pnpm check`        | Run all non-mutating quality checks (format, lint, types) |
| `pnpm lint`         | Run ESLint across the workspace                           |
| `pnpm lint:fix`     | Run ESLint with auto-fix                                  |
| `pnpm format`       | Format all files with Prettier                            |
| `pnpm format:check` | Verify formatting without writing changes                 |
| `pnpm typecheck`    | Run TypeScript type checking via project references       |

> `pnpm check` is the single command to verify the repository is in a valid state. It is non-mutating and returns a non-zero exit code on any failure.

## License

License selection is pending final approval. See [`LICENSE`](./LICENSE) for details.
