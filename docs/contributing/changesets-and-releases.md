# Changesets and Releases

KairoUI uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

## Overview

Changesets decouple "describing a change" from "releasing a version." When you make a change to a publishable package, you create a changeset file that describes what changed and at what semver level. At release time, changesets are consumed to bump versions and generate changelogs.

## Creating a Changeset

After making changes to any `packages/*` package:

```bash
pnpm changeset
```

This interactive prompt asks:

1. **Which packages changed?** — Select the affected `@kairoui/*` packages.
2. **Semver bump type** — `patch`, `minor`, or `major`.
3. **Summary** — A short description for the changelog.

The command creates a markdown file in `.changeset/` describing the change. **Commit this file** with your code changes.

### When to create a changeset

- Any change to a package's public API or behavior.
- Bug fixes to existing functionality.
- New exports or features.

### When NOT to create a changeset

- Changes to `apps/*` (docs, storybook) — these are not published.
- Changes to `tooling/*` — these are not published.
- Internal refactors with no public API change.
- Changes to CI, documentation, or infrastructure.

## Version Strategy

All publishable packages use a **fixed versioning** strategy — they are released together at the same version. This is configured in `.changeset/config.json`:

```json
{
  "fixed": [
    [
      "@kairoui/core",
      "@kairoui/tokens",
      "@kairoui/theme",
      "@kairoui/hooks",
      "@kairoui/icons",
      "@kairoui/utils"
    ]
  ]
}
```

## Checking Changeset Status

```bash
pnpm changeset:status
```

This shows which packages have pending changesets and what versions they would bump to.

## Release Process

Releases are handled by the CI release workflow:

1. Changesets accumulate on `main` via merged PRs.
2. The release workflow creates a "Version Packages" PR that bumps versions and generates changelogs.
3. When the version PR is merged, the release workflow publishes to npm.

**All packages are currently `private`.** No packages are published until the `private` field is removed and publication is deliberately configured.

## Dry Run

The release workflow supports a manual dry run:

1. Go to Actions → Release → Run workflow.
2. Check "Dry run" — validates without publishing.
