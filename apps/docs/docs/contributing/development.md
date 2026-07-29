---
sidebar_position: 2
title: Development Setup
---

# Development Setup

:::note[Placeholder]
This page will be expanded with detailed development workflows.
:::

## Prerequisites

```bash
node --version  # >= 20.0.0
pnpm --version  # 9.15.4
```

## Clone and Install

```bash
git clone <repository-url>
cd kairoui
pnpm install
```

## Available Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `pnpm check`         | Run all quality checks             |
| `pnpm test`          | Run tests in watch mode            |
| `pnpm test:run`      | Run tests once (CI mode)           |
| `pnpm test:coverage` | Run tests with coverage report     |
| `pnpm lint`          | Lint all files                     |
| `pnpm typecheck`     | TypeScript type checking           |
| `pnpm storybook`     | Start Storybook dev server         |
| `pnpm docs:dev`      | Start documentation dev server     |
| `pnpm docs:build`    | Build documentation for production |

## Project Structure

```
packages/       — publishable packages (components, tokens, etc.)
apps/           — internal apps (storybook, docs)
tooling/        — shared configs (tsconfig, test utilities)
docs/           — architecture decision records
```

## Testing

Tests use Vitest with React Testing Library. Test files live alongside source:

```
packages/core/src/
  Button.tsx
  Button.test.tsx
```

Run tests:

```bash
pnpm test          # watch mode
pnpm test:run      # single run
pnpm test:coverage # with coverage
```

## Git Hooks

Pre-commit hooks (via Husky) run:

- **ESLint** with auto-fix on staged JS/TS files
- **Prettier** on staged files

Commit messages are validated against the project convention. Use `git commit --no-verify` to bypass hooks temporarily (CI remains authoritative).
