---
sidebar_position: 2
title: Quick Start
---

# Quick Start

This guide covers basic React usage of the KairoUI theme system.

## Installation

```bash
pnpm add @kairoui/core @kairoui/theme @kairoui/tokens
```

Peer dependencies:

```bash
pnpm add react react-dom
```

## Required CSS Imports

Import the token CSS **once** at your application root. This provides all theme and density variables:

```tsx
import "@kairoui/tokens/css";
```

Without this import, CSS custom properties will be undefined and components will have no styles.

## Default Theme

The simplest setup uses defaults: `system` mode and `comfortable` density.

```tsx
import "@kairoui/tokens/css";
import { KairoProvider } from "@kairoui/core";

function App() {
  return (
    <KairoProvider>
      <main>Your application</main>
    </KairoProvider>
  );
}
```

The provider applies `data-kui-theme` and `data-kui-density` attributes to `document.documentElement` by default.

## Light Mode

Force light theme regardless of system preference:

```tsx
<KairoProvider defaultMode="light">
  <App />
</KairoProvider>
```

## Dark Mode

Force dark theme:

```tsx
<KairoProvider defaultMode="dark">
  <App />
</KairoProvider>
```

## System Mode

Follow the operating system's `prefers-color-scheme` setting (this is the default):

```tsx
<KairoProvider defaultMode="system">
  <App />
</KairoProvider>
```

When the OS preference changes, the theme updates automatically.

## Density

Set spatial density independently of color mode:

```tsx
<KairoProvider defaultDensity="compact">
  <App />
</KairoProvider>
```

Available values: `"comfortable"` (default), `"standard"`, `"compact"`.

## Uncontrolled Mode

With `defaultMode` and `defaultDensity`, the provider manages state internally and persists preferences to `localStorage`:

```tsx
<KairoProvider defaultMode="dark" defaultDensity="standard">
  <App />
</KairoProvider>
```

Calling `setMode` or `setDensity` from hooks updates the internal state and persists the preference.

## Controlled Mode

For external state management, pass `mode`/`density` with change handlers:

```tsx
import { useState } from "react";
import { KairoProvider } from "@kairoui/core";
import type { ThemeMode, DensityMode } from "@kairoui/theme";

function App() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [density, setDensity] = useState<DensityMode>("comfortable");

  return (
    <KairoProvider
      mode={mode}
      onModeChange={setMode}
      density={density}
      onDensityChange={setDensity}
    >
      <main>Your application</main>
    </KairoProvider>
  );
}
```

In controlled mode, the provider does not persist preferences — your application owns that responsibility.

## Controlled Density

You can control density independently while leaving mode uncontrolled:

```tsx
import { useState } from "react";
import { KairoProvider } from "@kairoui/core";
import type { DensityMode } from "@kairoui/theme";

function App() {
  const [density, setDensity] = useState<DensityMode>("comfortable");

  return (
    <KairoProvider defaultMode="system" density={density} onDensityChange={setDensity}>
      <main>Your application</main>
    </KairoProvider>
  );
}
```

## Theme Hooks

### useTheme

Full access to theme state and controls:

```tsx
import { useTheme } from "@kairoui/core";

function ThemeStatus() {
  const { mode, resolvedMode, density, setMode, setDensity } = useTheme();

  return (
    <div>
      <p>
        Mode: {mode} (resolved: {resolvedMode})
      </p>
      <p>Density: {density}</p>
      <button onClick={() => setMode("dark")}>Dark</button>
      <button onClick={() => setDensity("compact")}>Compact</button>
    </div>
  );
}
```

### useThemeMode

Focused mode control with toggle support:

```tsx
import { useThemeMode } from "@kairoui/core";

function ModeToggle() {
  const { mode, resolvedMode, toggleMode } = useThemeMode();

  return <button onClick={toggleMode}>Current: {resolvedMode}</button>;
}
```

Toggle behavior: `light` → `dark`, `dark` → `light`, `system` → opposite of resolved.

### useDensity

Focused density control:

```tsx
import { useDensity } from "@kairoui/core";

function DensityPicker() {
  const { density, setDensity } = useDensity();

  return (
    <select
      value={density}
      onChange={(e) => setDensity(e.target.value as "comfortable" | "standard" | "compact")}
    >
      <option value="comfortable">Comfortable</option>
      <option value="standard">Standard</option>
      <option value="compact">Compact</option>
    </select>
  );
}
```

### Selector Hooks

Lightweight hooks that return a single value:

```tsx
import {
  useThemeName,
  useRequestedMode,
  useResolvedMode,
  useCurrentDensity,
  useIsNested,
  useIsSystemMode,
} from "@kairoui/core";

function DebugInfo() {
  const name = useThemeName();
  const requested = useRequestedMode();
  const resolved = useResolvedMode();
  const density = useCurrentDensity();
  const nested = useIsNested();
  const isSystem = useIsSystemMode();

  return (
    <pre>{JSON.stringify({ name, requested, resolved, density, nested, isSystem }, null, 2)}</pre>
  );
}
```

## Custom Target

By default, attributes are applied to `document.documentElement`. To apply to a different element:

```tsx
import { useRef } from "react";
import { KairoProvider } from "@kairoui/core";

function Panel() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref}>
      <KairoProvider target={ref} defaultMode="dark">
        <p>This panel has its own theme scope.</p>
      </KairoProvider>
    </div>
  );
}
```

## Basic Persistence

In uncontrolled mode, the provider automatically persists preferences to `localStorage` under the key `kui-theme-preference`. On subsequent visits, the stored preference is restored.

The no-flash script (for SSR) reads this same key before React hydrates to prevent a flash of the wrong theme. See the [architecture docs](/architecture/theme-engine#no-flash-lifecycle) for details.

## Outside-Provider Errors

All theme hooks throw if used outside a `KairoProvider`:

```tsx
import { useTheme } from "@kairoui/core";

// This will throw:
// "KairoUI: useTheme() must be used within a <KairoProvider>."
function Broken() {
  const { mode } = useTheme(); // ❌ throws
  return <p>{mode}</p>;
}
```

Wrap your component tree in `<KairoProvider>` before using any theme hook.
