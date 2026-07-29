# Documentation

KairoUI's documentation site is built with [Docusaurus](https://docusaurus.io/) and lives in `apps/docs/`.

## Running the Docs Site

```bash
# Start dev server (port 3000)
pnpm docs:dev

# Build for production
pnpm docs:build
```

## Where to Write Documentation

| Location             | Content                                                      |
| -------------------- | ------------------------------------------------------------ |
| `apps/docs/docs/`    | Published user-facing documentation (guides, API references) |
| `docs/architecture/` | Internal architecture decision documents                     |
| `docs/contributing/` | Contributor guides (this directory)                          |
| Package `README.md`  | Package-specific overview and responsibility                 |
| Root `README.md`     | Project overview and quick start                             |

**Source of truth rule:** Each topic should have one authoritative location. Link to it from other places rather than duplicating content.

## Writing Documentation

### Markdown conventions

- Use ATX-style headings (`#`, `##`, `###`).
- Use fenced code blocks with language identifiers.
- Use relative links between docs.
- Keep lines under 100 characters where practical (Prettier's `proseWrap: preserve` allows natural line breaks in Markdown).

### Adding a new docs page

1. Create a `.md` or `.mdx` file in `apps/docs/docs/`.
2. Add it to the sidebar configuration in `apps/docs/sidebars.ts`.
3. Preview with `pnpm docs:dev`.

## Architecture Decision Documents

Architecture decisions are documented in `docs/architecture/` and describe the "why" behind infrastructure choices. When proposing changes to tooling, configuration, or package boundaries, check existing ADRs first.
