# KairoUI

**Enterprise React UI Platform**

KairoUI is a production-grade, enterprise-focused React UI platform built as a TypeScript monorepo. It is designed to provide a cohesive, scalable design system and component architecture for large-scale applications — not a generic component collection.

## Vision

- Deliver a unified, accessible, and themeable UI platform for enterprise product teams.
- Enforce consistency through design tokens, composable primitives, and opinionated patterns.
- Prioritize developer experience, performance, and long-term maintainability.

## Technology

| Layer          | Choice           |
| -------------- | ---------------- |
| Language       | TypeScript       |
| Framework      | React            |
| Build          | Vite             |
| Testing        | Vitest           |
| Documentation  | Storybook        |
| Package Mgmt   | pnpm (monorepo)  |

## Repository Structure

```
packages/       — publishable packages (components, tokens, utilities)
apps/           — internal applications (docs site, playground, etc.)
tools/          — internal build and developer tooling
```

> Directories are created incrementally as tasks progress.

## Status

This repository is under active development. See individual task branches and the project board for progress.

## Prerequisites

| Tool   | Version       |
| ------ | ------------- |
| Node.js | >= 20.0.0    |
| pnpm    | 9.15.4       |

This project uses [pnpm workspaces](https://pnpm.io/workspaces). The `packageManager` field in `package.json` declares the exact pnpm version; [corepack](https://nodejs.org/api/corepack.html) or a global install can be used to activate it.

## Getting Started

```bash
pnpm install
```

## License

License selection is pending final approval. See [`LICENSE`](./LICENSE) for details.
