---
sidebar_position: 1
title: Architecture Overview
---

# Architecture Overview

:::note[Placeholder]
This section will expand as architectural decisions are finalized.
:::

## Monorepo Structure

KairoUI is organized as a pnpm workspace monorepo:

```
packages/       — publishable KairoUI packages
  core/         — foundation primitives and base components
  tokens/       — design tokens (colors, spacing, typography)
  theme/        — theming system and provider
  hooks/        — shared React hooks
  icons/        — icon components
  utils/        — utility functions and type helpers
apps/           — internal applications
  storybook/    — component development environment
  docs/         — product documentation (this site)
tooling/        — shared configurations
  tsconfig/     — TypeScript configurations
  test/         — shared testing utilities
```

## Design Principles

1. **Composition over configuration** — small, composable primitives
2. **Accessibility first** — WCAG 2.1 AA as a baseline, not an afterthought
3. **Type safety** — strict TypeScript with no `any` escape hatches
4. **Token-driven** — all visual properties derived from design tokens
5. **Tree-shakeable** — only ship what consumers use

## Technology Stack

| Concern         | Tool         |
| --------------- | ------------ |
| Language        | TypeScript 5 |
| Framework       | React 19     |
| Build           | Vite         |
| Testing         | Vitest + RTL |
| Component dev   | Storybook    |
| Documentation   | Docusaurus   |
| Package manager | pnpm         |
| Linting         | ESLint 9     |
| Formatting      | Prettier     |
| Git hooks       | Husky        |
