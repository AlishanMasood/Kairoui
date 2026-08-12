---
title: Documentation Package Architecture
sidebar_position: 25
---

# @kairoui/docs — Documentation Component Architecture

## Overview

`@kairoui/docs` is a reusable package of documentation-specific components built on KairoUI primitives. It provides the building blocks for component documentation, API references, and interactive examples.

## Package Structure

```
packages/docs/          → @kairoui/docs (reusable docs components)
apps/docs/              → @kairoui/docs-site (Docusaurus website)
tooling/docs-generator/ → TypeScript metadata extraction (Phase 12.5)
```

## Dependency Direction (enforced)

```
@kairoui/core
@kairoui/theme       →  @kairoui/docs  →  apps/docs (site)
@kairoui/tokens
@kairoui/hooks
```

### Allowed

- `@kairoui/docs` depends on `@kairoui/core`, `@kairoui/core/primitives`, `@kairoui/theme`, `@kairoui/tokens`
- `apps/docs` depends on `@kairoui/docs` and Docusaurus
- `@kairoui/docs` uses KairoUI primitives (Box, Stack, Text, Surface, etc.) internally

### Forbidden

- `@kairoui/core` must NEVER depend on `@kairoui/docs`
- `@kairoui/theme` must NEVER depend on `@kairoui/docs`
- `@kairoui/tokens` must NEVER depend on `@kairoui/docs`
- `@kairoui/hooks` must NEVER depend on `@kairoui/docs`
- `@kairoui/docs` must NEVER depend on Docusaurus

## Package Responsibilities

### `@kairoui/docs` (packages/docs)

Owns:

- Documentation-specific React components (Callout, CodeBlock, ComponentHeader, etc.)
- Documentation layout patterns (PropRow, ApiSection, etc.)
- Copy-code behavior
- Code syntax highlighting integration
- Demo rendering infrastructure
- Documentation-specific styling (scoped, does not leak into KairoUI)

Does NOT own:

- KairoUI primitive components (those live in @kairoui/core)
- TypeScript metadata extraction (that's tooling/docs-generator)
- Site routing, navigation, or CMS (that's the site app)
- Theme/token definitions (those live in @kairoui/tokens/@kairoui/theme)

### `apps/docs` (@kairoui/docs-site)

Owns:

- The documentation website application
- Docusaurus configuration and plugins
- Site-level routing and navigation
- Markdown/MDX content
- Deployment configuration
- Site-specific assets (favicons, images)

### `tooling/docs-generator` (Phase 12.5)

Will own:

- TypeScript AST parsing for prop/type extraction
- Metadata generation at build time
- JSON output consumed by @kairoui/docs PropsTable/ApiReference
- Source-link generation

## Component Rules

### Use KairoUI Primitives

Documentation components MUST use KairoUI primitives where a suitable primitive exists:

```tsx
// CORRECT: uses KairoUI Stack + Surface + Text
export function Callout({ children, type }) {
  return (
    <Surface elevation="sm" radius="md">
      <Stack gap={8}>
        <Text as="strong">{title}</Text>
        <Text>{children}</Text>
      </Stack>
    </Surface>
  );
}

// WRONG: duplicates Box/Stack/Surface behavior
export function Callout({ children }) {
  return (
    <div className="docs-callout" style={{ display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}
```

### No General-Purpose Wrappers

Do NOT create:

- `DocsBox`, `DocsStack`, `DocsText` — use KairoUI primitives directly
- `DocsButton`, `DocsLink` — these belong in KairoUI @kairoui/core (Phase 8)
- Generic layout components that duplicate what primitives provide

### Documentation-Specific Only

Only build components that serve documentation purposes:

- `ComponentHeader` — renders component name, description, import statement
- `Callout` — informational/warning/error callouts in docs
- `CodeBlock` — syntax-highlighted code with copy button
- `CodePreview` — live rendered example + source code
- `ImportStatement` — styled import example
- `PackageInstall` — npm/pnpm/yarn install commands
- `PropsTable` — component prop documentation table
- `Demo` — interactive component demonstration

## Docusaurus Integration Strategy

### Current (Phase 7.5–8)

- `apps/docs` remains a Docusaurus site
- `@kairoui/docs` components are used inside MDX via Docusaurus's MDX support
- No changes to Docusaurus core or routing
- Components render within Docusaurus's theme/layout

### Future (Phase 15)

- Replace Docusaurus with a KairoUI-controlled shell (Next.js or similar)
- `@kairoui/docs` components remain unchanged — they're framework-agnostic React
- Only the app shell changes; documentation content and components stay

## SSR Expectations

- All `@kairoui/docs` components MUST be SSR-safe
- Docusaurus uses SSG (static site generation) — components render at build time
- No browser-only code at module scope
- Code highlighting should work server-side

## Bundle & Publishing

- `@kairoui/docs` is `private: true` (not published to npm initially)
- ESM only, same build tooling as other packages (tsup)
- Tree-shakeable named exports
- `sideEffects: false` (or `["**/*.css"]` if CSS is generated)
- Keep documentation components lightweight — they shouldn't bloat the docs site

## Documentation-Specific Styling

- `@kairoui/docs` owns its own CSS for docs-specific visual treatment
- Uses KairoUI design tokens for colors, spacing, typography
- Does NOT create a separate design system
- Docs CSS is scoped (does not leak into component demos)
- Component demos render in an isolated context (no docs styles bleeding in)

## Initial Scope (Phase 7.5)

Priority components for the first implementation:

1. `ComponentHeader` — component name, description, import path
2. `Callout` — info/warning/error/tip callouts
3. `CodeBlock` — syntax-highlighted code with copy
4. `CodePreview` — rendered example + source
5. `ImportStatement` — styled import code
6. `PackageInstall` — install command variants
7. `Demo` — basic interactive component demo

## ADR: Why a Separate Package?

**Decision:** Documentation components live in `packages/docs`, not in `apps/docs/src/`.

**Rationale:**

1. **Reusability** — docs components can be used across multiple documentation surfaces (site, storybook, internal tools)
2. **Dogfooding** — forces real consumption of KairoUI primitives in a non-trivial context
3. **Testing** — docs components can have their own unit/integration tests
4. **Clean boundaries** — separates reusable UI from site-specific configuration
5. **Future migration** — when migrating from Docusaurus to Next.js, docs components don't need to change

**Trade-off:** Slightly more package infrastructure. Acceptable given the monorepo tooling already handles this.
