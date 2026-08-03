---
sidebar_position: 2
title: Scoped & Nested Theming
---

# Scoped and Nested Theming

KairoUI supports applying different themes and densities to sub-trees of your application. Scoped themes work via CSS cascade — child elements inherit custom properties from the nearest scoped ancestor.

## Dark Sidebar Inside Light App

Use `KairoScopeProvider` to invert a sidebar while the rest of the page stays light:

```tsx
import { KairoProvider, KairoScopeProvider } from "@kairoui/core";

function App() {
  return (
    <KairoProvider defaultMode="light">
      <div style={{ display: "flex" }}>
        <KairoScopeProvider mode="dark">
          <nav>Dark sidebar content</nav>
        </KairoScopeProvider>
        <main>Light main content</main>
      </div>
    </KairoProvider>
  );
}
```

`KairoScopeProvider` renders a `<div style="display: contents">` wrapper with `data-kui-theme="dark"`, so CSS variables cascade without affecting layout.

## Compact Data Region

Apply compact density to a data-heavy section while the rest uses comfortable:

```tsx
import { KairoProvider, KairoScopeProvider } from "@kairoui/core";

function Dashboard() {
  return (
    <KairoProvider defaultMode="system" defaultDensity="comfortable">
      <header>Spacious header</header>
      <KairoScopeProvider density="compact">
        <table>{/* Dense data table */}</table>
      </KairoScopeProvider>
    </KairoProvider>
  );
}
```

## Embedded Widget

An embedded widget can have its own isolated theme scope:

```tsx
import { KairoProvider, KairoScopeProvider } from "@kairoui/core";

function EmbeddedWidget() {
  return (
    <KairoScopeProvider mode="light" density="standard">
      <div>
        <p>This widget always uses light theme at standard density,</p>
        <p>regardless of the host application's theme.</p>
      </div>
    </KairoScopeProvider>
  );
}

function HostApp() {
  return (
    <KairoProvider defaultMode="dark" defaultDensity="comfortable">
      <main>Dark host application</main>
      <EmbeddedWidget />
    </KairoProvider>
  );
}
```

## Theme Preview

Show users what a theme looks like without applying it globally:

```tsx
import { KairoScopeProvider, useThemeMode } from "@kairoui/core";
import type { ThemeMode } from "@kairoui/theme";

function ThemePreviewCard({ previewMode }: { previewMode: ThemeMode }) {
  return (
    <KairoScopeProvider mode={previewMode}>
      <div style={{ padding: "1rem", borderRadius: "8px" }}>
        <p>Preview: {previewMode}</p>
      </div>
    </KairoScopeProvider>
  );
}

function ThemePicker() {
  const { setMode } = useThemeMode();

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <div onClick={() => setMode("light")}>
        <ThemePreviewCard previewMode="light" />
      </div>
      <div onClick={() => setMode("dark")}>
        <ThemePreviewCard previewMode="dark" />
      </div>
    </div>
  );
}
```

## Multi-Brand Portal

Different sections of a portal can use different brand themes:

```tsx
import { createTheme } from "@kairoui/theme";
import { KairoProvider, KairoScopeProvider } from "@kairoui/core";

const brandA = createTheme({
  name: "brand-a",
  base: "light",
  overrides: { color: { interactive: { default: "#e63946" } } },
});

const brandB = createTheme({
  name: "brand-b",
  base: "light",
  overrides: { color: { interactive: { default: "#457b9d" } } },
});

function Portal() {
  return (
    <KairoProvider defaultMode="light">
      <KairoScopeProvider theme={brandA}>
        <section>Brand A section</section>
      </KairoScopeProvider>
      <KairoScopeProvider theme={brandB}>
        <section>Brand B section</section>
      </KairoScopeProvider>
    </KairoProvider>
  );
}
```

## Nested Inheritance

Nested scopes inherit from their parent scope, not the root:

```tsx
import { KairoProvider, KairoScopeProvider, useTheme } from "@kairoui/core";

function Info() {
  const { resolvedMode, density, isNested } = useTheme();
  return (
    <p>
      mode={resolvedMode}, density={density}, nested={String(isNested)}
    </p>
  );
}

function App() {
  return (
    <KairoProvider defaultMode="light" defaultDensity="comfortable">
      <Info />
      {/* mode=light, density=comfortable, nested=false */}

      <KairoScopeProvider mode="dark">
        <Info />
        {/* mode=dark, density=comfortable (inherited), nested=true */}

        <KairoScopeProvider density="compact">
          <Info />
          {/* mode=dark (inherited from parent scope), density=compact, nested=true */}
        </KairoScopeProvider>
      </KairoScopeProvider>
    </KairoProvider>
  );
}
```

Inheritance rules:

- A scope that sets only `mode` inherits density from its parent.
- A scope that sets only `density` inherits mode from its parent.
- `useIsNested()` returns `true` inside any `KairoScopeProvider`.

## Local Theme Override

Override the theme mode within a scope without affecting the rest of the tree:

```tsx
import { useState } from "react";
import { KairoScopeProvider, useThemeMode } from "@kairoui/core";
import type { ThemeMode } from "@kairoui/theme";

function LocalOverride({ children }: { children: React.ReactNode }) {
  const [localMode, setLocalMode] = useState<ThemeMode>("dark");

  return (
    <KairoScopeProvider mode={localMode} onModeChange={setLocalMode}>
      <button onClick={() => setLocalMode(localMode === "dark" ? "light" : "dark")}>
        Toggle local theme
      </button>
      {children}
    </KairoScopeProvider>
  );
}
```

## Local Density Override

Similarly for density:

```tsx
import { KairoScopeProvider } from "@kairoui/core";
import type { DensityMode } from "@kairoui/theme";

function CompactSection({ children }: { children: React.ReactNode }) {
  return <KairoScopeProvider defaultDensity="compact">{children}</KairoScopeProvider>;
}
```

## Custom Targets (Framework-Independent)

For non-React usage, apply scoped themes directly to DOM elements:

```typescript
import { applyScopedTheme, removeScopedTheme } from "@kairoui/theme/dom";

const sidebar = document.getElementById("sidebar")!;

// Apply dark theme to the sidebar element
const result = applyScopedTheme(sidebar, {
  mode: "dark",
  density: "compact",
});

// result.target — the element
// result.mode — "dark"
// result.density — "compact"
// result.variablesApplied — number of CSS variables set
// result.cleanup — function to remove the scope

// Later, remove the scoped theme:
result.cleanup();
// or equivalently:
removeScopedTheme(sidebar);
```

`applyScopedTheme` only sets the attributes you provide. Omitting `mode` or `density` leaves those inherited from the parent scope via CSS cascade.

### Partial Application

```typescript
import { applyScopedTheme } from "@kairoui/theme/dom";

const panel = document.getElementById("panel")!;

// Only override density — mode inherits from parent
applyScopedTheme(panel, { density: "compact" });

// Only override mode — density inherits from parent
applyScopedTheme(panel, { mode: "dark" });
```

### CSS Variables on Scoped Elements

```typescript
import { applyScopedTheme } from "@kairoui/theme/dom";

const widget = document.getElementById("widget")!;

applyScopedTheme(widget, {
  mode: "light",
  cssVariables: {
    "--kui-color-interactive-default": "#7c3aed",
    "--kui-color-interactive-hover": "#6d28d9",
  },
});
```

## Cleanup Behavior

When a scoped theme is removed, KairoUI restores the element to its original state:

```typescript
import { applyScopedTheme, removeScopedTheme } from "@kairoui/theme/dom";
import { cleanupTheme, hasThemeState } from "@kairoui/theme/dom";

const el = document.getElementById("target")!;

// Check if element has KairoUI-managed state
hasThemeState(el); // false

applyScopedTheme(el, { mode: "dark", density: "compact" });
hasThemeState(el); // true

// Full cleanup — restores original attribute values
const result = cleanupTheme(el);
// result.attributesRemoved — count of attributes handled
// result.propertiesRemoved — count of CSS properties handled
// result.valuesRestored — count of original values restored
// result.alreadyClean — true if no state was found

hasThemeState(el); // false
```

Cleanup behavior:

- **Attributes** that existed before KairoUI touched them are restored to their original values.
- **Attributes** that did not exist before are removed entirely.
- **CSS properties** that had a value before are restored; otherwise they are removed.
- **Calling cleanup twice** is safe — subsequent calls return `{ alreadyClean: true }`.
- **React:** `KairoScopeProvider` cleans up automatically on unmount.

## Persistence Behavior

Scoped providers do **not** persist preferences:

- `KairoProvider` (root) persists mode and density to `localStorage` in uncontrolled mode.
- `KairoScopeProvider` (nested) keeps state in memory only. Preferences are lost on unmount.
- This is intentional — scoped regions represent temporary UI states, not user preferences.

If you need a scoped region's state to persist, manage it yourself:

```tsx
import { useState, useEffect } from "react";
import { KairoScopeProvider } from "@kairoui/core";
import type { ThemeMode } from "@kairoui/theme";

function PersistentScope({
  storageKey,
  children,
}: {
  storageKey: string;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    localStorage.setItem(storageKey, mode);
  }, [storageKey, mode]);

  return (
    <KairoScopeProvider mode={mode} onModeChange={setMode}>
      {children}
    </KairoScopeProvider>
  );
}
```

## Restrictions and Performance

**Target ownership:** Each DOM element should be managed by at most one provider or `applyScopedTheme` call. Applying multiple scoped themes to the same element causes unpredictable attribute conflicts.

**Layout impact:** `KairoScopeProvider` renders `<div style="display: contents">` which does not introduce a layout box. In rare cases (flex/grid item counting, `nth-child` selectors), the extra element may matter.

**Nesting depth:** Each nested scope adds one wrapper element. Deeply nested scopes (5+) are valid but consider whether composition or a flat structure is clearer.

**Re-renders:** Mode/density changes in a scope re-render all children within that scope's context. Keep scope boundaries at natural layout boundaries to minimize re-render cost.

**Deduplication:** Both `applyScopedTheme` and `KairoScopeProvider` track previous values and skip redundant DOM writes when the mode/density hasn't actually changed.

**WeakMap cleanup:** DOM state tracking uses `WeakMap`, so garbage collection handles elements removed from the DOM without manual cleanup. However, calling `removeScopedTheme()` or `cleanupTheme()` is still recommended for elements that remain in the DOM but no longer need theming.
