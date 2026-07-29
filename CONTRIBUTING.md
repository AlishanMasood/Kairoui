# Contributing to KairoUI

Thank you for your interest in contributing to KairoUI. This guide covers everything you need to get started.

KairoUI is an **enterprise React UI platform** — not a generic component collection. Contributions should align with the project's design system philosophy: consistency, accessibility, and scalable architecture.

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd kairoui

# 2. Install dependencies (requires Node.js >= 20 and pnpm 9.15.4)
pnpm install

# 3. Verify everything works
pnpm check
```

## Prerequisites

| Tool    | Version   | Notes                                              |
| ------- | --------- | -------------------------------------------------- |
| Node.js | >= 20.0.0 | LTS recommended. CI uses Node 22.                  |
| pnpm    | 9.15.4    | Exact version enforced via `packageManager` field. |

**Installing pnpm:**

```bash
# Via corepack (recommended — ships with Node.js)
corepack enable
corepack prepare pnpm@9.15.4 --activate

# Or via npm
npm install -g pnpm@9.15.4
```

> **Windows note:** If `corepack enable` fails with `EPERM`, run the terminal as Administrator or use the `npm install -g` method instead.

## Core Commands

| Command              | Description                                        | Mutates files?  |
| -------------------- | -------------------------------------------------- | --------------- |
| `pnpm check`         | Full validation: build, format, lint, types, tests | No              |
| `pnpm build`         | Build all packages (Turbo-cached)                  | Yes (dist/)     |
| `pnpm dev`           | Start all dev servers and watch modes              | No              |
| `pnpm lint`          | Run ESLint across the workspace                    | No              |
| `pnpm lint:fix`      | Run ESLint with auto-fix                           | Yes             |
| `pnpm format`        | Format all files with Prettier                     | Yes             |
| `pnpm format:check`  | Verify formatting without writing                  | No              |
| `pnpm typecheck`     | TypeScript type checking via project references    | No              |
| `pnpm test`          | Run tests in watch mode                            | No              |
| `pnpm test:run`      | Run tests once (CI mode)                           | No              |
| `pnpm test:coverage` | Run tests with coverage report                     | Yes (coverage/) |
| `pnpm storybook`     | Start Storybook dev server on port 6006            | No              |
| `pnpm docs:dev`      | Start documentation dev server on port 3000        | No              |
| `pnpm clean`         | Remove all build outputs                           | Yes (dist/)     |

## Repository Structure

```
kairoui/
├── packages/           Publishable @kairoui/* packages
│   ├── core/           Foundation primitives and base components
│   ├── tokens/         Design tokens (color, spacing, typography)
│   ├── theme/          Theme engine and runtime theming
│   ├── hooks/          Shared React hooks
│   ├── icons/          SVG icon system as React components
│   └── utils/          Shared utility functions and type helpers
├── apps/               Internal (non-publishable) applications
│   ├── docs/           Docusaurus documentation site
│   └── storybook/      Storybook component development environment
├── tooling/            Shared internal configurations
│   ├── tsconfig/       TypeScript configuration presets
│   ├── tsup/           Shared build configuration
│   └── test/           Shared test configuration and utilities
├── docs/               Long-form architecture and contributor docs
│   ├── architecture/   Architecture decision documents
│   └── contributing/   Detailed contributor guides
└── .github/            CI workflows and repository templates
```

Each directory under `packages/*`, `apps/*`, and `tooling/*` is a pnpm workspace member.

## Detailed Guides

| Guide                                                                   | Description                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Development Setup](docs/contributing/development-setup.md)             | Environment setup, IDE configuration, and troubleshooting  |
| [Repository Architecture](docs/contributing/architecture.md)            | Package boundaries, dependency rules, and design decisions |
| [Creating a Package](docs/contributing/creating-a-package.md)           | Step-by-step guide for adding a new workspace package      |
| [Testing](docs/contributing/testing.md)                                 | Writing and running tests with Vitest and Testing Library  |
| [Storybook](docs/contributing/storybook.md)                             | Writing component stories                                  |
| [Documentation](docs/contributing/documentation.md)                     | Contributing to the Docusaurus documentation site          |
| [Commit Messages](docs/contributing/commit-messages.md)                 | Required commit message format                             |
| [Changesets and Releases](docs/contributing/changesets-and-releases.md) | Versioning, changelogs, and the release process            |
| [Pull Requests](docs/contributing/pull-requests.md)                     | PR expectations, review process, and merge criteria        |
| [Code Review](docs/contributing/code-review.md)                         | Review standards and guidelines                            |

## Package Boundaries

Every `@kairoui/*` package has a clear responsibility. Do not:

- Import another package's internal files (e.g., `@kairoui/core/src/internals`). Only root exports are public.
- Create circular dependencies between packages.
- Add dependencies without justification.

ESLint enforces these boundaries. See [Package Export Strategy](docs/architecture/package-exports.md).

## What Phase 1 Intentionally Does Not Contain

KairoUI is being built incrementally. The current phase focuses on infrastructure. The following are **not yet implemented** and should not be contributed until their corresponding tasks are created:

- Production-ready components beyond initial primitives
- Server-side rendering configuration
- Internationalization (i18n) framework
- Animation system
- Form validation framework
- Data fetching patterns
- Production deployment pipeline
- Public npm publishing (all packages are currently `private`)

## Getting Help

- Open an issue for bugs or feature requests.
- Start a discussion for architectural questions.
- Check existing [architecture decisions](docs/architecture/) before proposing changes to infrastructure.

## Code of Conduct

This project follows a code of conduct. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

To report a security vulnerability, see [SECURITY.md](SECURITY.md). Do **not** open a public issue.
