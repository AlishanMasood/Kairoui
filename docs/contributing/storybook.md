# Storybook

KairoUI uses [Storybook](https://storybook.js.org/) for interactive component development and visual documentation.

## Running Storybook

```bash
# Start the dev server (port 6006)
pnpm storybook

# Build a static Storybook site
pnpm storybook:build
```

## Writing Stories

Stories live in `apps/storybook/stories/` and follow the [Component Story Format (CSF)](https://storybook.js.org/docs/api/csf).

### File naming

```
apps/storybook/stories/
└── core/
    └── Button.stories.tsx
```

Organize stories by the package they document.

### Basic story

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@kairoui/core";

const meta = {
  title: "Core/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Click me",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Click me",
    variant: "secondary",
  },
};
```

## Conventions

- **One story file per component** — Maps to one page in the Storybook sidebar.
- **Use `satisfies Meta`** — Provides type safety for args and argTypes.
- **Add `tags: ["autodocs"]`** — Generates automatic documentation from props.
- **Export `default`** for meta — Required by CSF format (ESLint allows default exports in `*.stories.*` files).
- **Name stories by variant** — `Primary`, `Secondary`, `Disabled`, `WithIcon`, etc.
- **Test edge cases** — Add stories for loading states, error states, long text, RTL, etc.

## Building Storybook

`pnpm storybook:build` produces a static site in `apps/storybook/storybook-static/`. CI builds Storybook on every pull request to verify stories compile.
