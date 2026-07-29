---
sidebar_position: 2
title: Quick Start
---

# Quick Start

:::note[Placeholder]
This guide will walk through creating a basic application with KairoUI once components are available.
:::

## Setup

```tsx
import { KairoProvider } from "@kairoui/core";
import { defaultTheme } from "@kairoui/theme";

function App() {
  return <KairoProvider theme={defaultTheme}>{/* Your application */}</KairoProvider>;
}
```

## Using components

```tsx
import { Button } from "@kairoui/core";

function MyPage() {
  return (
    <Button variant="primary" onClick={() => alert("Hello!")}>
      Get Started
    </Button>
  );
}
```

## What's next?

- Explore available components in the [Components](/components/overview) section
- Learn about theming in the Architecture section
- Try the [Storybook](http://localhost:6006) for interactive examples
