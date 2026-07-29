---
sidebar_position: 1
title: Contributing Guide
---

# Contributing to KairoUI

:::note[Placeholder]
This guide will be expanded with detailed contribution workflows.
:::

## Code of Conduct

All contributors are expected to uphold a respectful, inclusive environment.

## How to Contribute

1. **Check existing issues** — look for open issues or discussions before starting work
2. **Create a branch** — branch from `main` with a descriptive name
3. **Make changes** — follow the code style and conventions below
4. **Write tests** — add or update tests for your changes
5. **Submit a PR** — reference the related issue in your description

## Commit Convention

KairoUI uses a task-based commit format:

```
KairoUI - Task <ID>: <Description>
```

Examples:

```
KairoUI - Task KUI-COMP-001: Add Button component
KairoUI - Task KUI-INFRA-018: Create documentation application
```

Commit messages are validated by commitlint. Invalid messages will be rejected.

## Code Style

- **TypeScript** — strict mode, no `any`
- **ESLint** — enforced via pre-commit hooks
- **Prettier** — enforced via pre-commit hooks
- **Naming** — PascalCase for components/types, camelCase for functions/variables

## Pull Request Checklist

- [ ] Tests pass (`pnpm test:run`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Types check (`pnpm typecheck`)
- [ ] Formatting correct (`pnpm format:check`)
- [ ] Changeset added (if user-facing change)
