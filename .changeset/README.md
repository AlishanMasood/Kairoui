# Changesets

This directory is used by [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs for KairoUI packages.

## Versioning Strategy

**Fixed versioning** — all publishable `@kairoui/*` packages share the same version number. When any package in the group receives a changeset, all packages in the group are released together at the same version. This ensures consumers always have a compatible set.

## When to Add a Changeset

Add a changeset when your PR includes changes that affect consumers:

- New features, components, or hooks
- Bug fixes
- Breaking API changes
- Behavioral changes
- Dependency updates that affect the public API

**Do NOT add a changeset for:**

- Internal refactors with no public API change
- Documentation-only changes
- CI/tooling changes
- Test-only changes

## How to Add a Changeset

```bash
pnpm changeset
```

Follow the prompts to select affected packages and the semver bump type.

## Semver Bump Examples

### Patch (`0.0.x`)

- Bug fix in a component
- Fix incorrect TypeScript types
- Fix accessibility issue

### Minor (`0.x.0`)

- New component added
- New prop added to existing component
- New hook or utility exported

### Major (`x.0.0`)

- Removed component or export
- Renamed prop or changed its type
- Changed component behavior in a breaking way

## Pre-1.0 Breaking Changes

While packages are at `0.x.y`, breaking changes are communicated as **minor** bumps per semver convention. Once packages reach `1.0.0`, breaking changes require a **major** bump.

## Prerelease Channels

To enter prerelease mode (e.g., for alpha/beta releases):

```bash
pnpm changeset pre enter alpha   # or beta, rc
# ... make changes, add changesets ...
pnpm changeset version           # versions as 0.1.0-alpha.0, etc.
pnpm changeset pre exit          # return to normal mode
```

## CI Integration

The release workflow (`.github/workflows/release.yml`) uses `changesets/action` to:

1. Detect pending changesets on `main`
2. Open a "Version Packages" PR with bumped versions and changelogs
3. When that PR is merged, publish to npm with provenance
