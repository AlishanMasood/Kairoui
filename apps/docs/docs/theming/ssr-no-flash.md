---
sidebar_position: 3
title: SSR & No-Flash
---

# SSR and No-Flash Integration

This guide covers server-side rendering, hydration, and preventing theme flash across all frameworks.

## Framework-Neutral SSR

The `@kairoui/theme/server` entry point provides framework-independent utilities. No React, Next.js, or other framework is required:

```typescript
import {
  getNoFlashScript,
  serializeServerState,
  getServerHtmlAttributes,
} from "@kairoui/theme/server";
```

These functions run in Node.js without browser globals.

## Initial HTML Attributes

Set theme attributes on the `<html>` element during server render to match the no-flash script's output:

```typescript
import { getServerHtmlAttributes } from "@kairoui/theme/server";

const attrs = getServerHtmlAttributes({
  resolvedMode: "light",
  density: "comfortable",
});
// { "data-kui-theme": "light", "data-kui-density": "comfortable" }
```

In your HTML template:

```html
<html data-kui-theme="light" data-kui-density="comfortable"></html>
```

This ensures the initial render matches what the no-flash script will set, preventing hydration mismatches.

## Server Theme State

Serialize the server's theme decision for the client to consume during hydration:

```typescript
import { serializeServerState } from "@kairoui/theme/server";

const stateJson = serializeServerState({
  mode: "system",
  resolvedMode: "light",
  density: "comfortable",
  themeName: "default",
});
```

All options are optional — they default to `mode: "system"`, `resolvedMode: "light"`, `density: "comfortable"`, `themeName: ""`.

## Serialization

The serialized state is HTML-safe JSON. Characters `<`, `>`, `&`, and line separators are escaped as `\uXXXX` to prevent XSS when embedded in a `<script>` tag:

```html
<script>
  window.__KAIRO_STATE__ =
    '{"v":1,"mode":"system","resolvedMode":"light","density":"comfortable","themeName":"default"}';
</script>
```

Parse it on the client:

```typescript
import { parseServerState } from "@kairoui/theme/server";

const serverState = parseServerState(window.__KAIRO_STATE__);
// Returns validated ServerThemeState or null if invalid
```

`parseServerState` validates the version, mode, density, and theme name. It rejects objects with prototype pollution keys (`__proto__`, `constructor`, `prototype`).

## No-Flash Script

The no-flash script is a small inline IIFE that runs synchronously before the first paint:

```typescript
import { getNoFlashScript } from "@kairoui/theme/server";

const script = getNoFlashScript({
  storageKey: "kui-theme-preference",
  defaultMode: "light",
  defaultDensity: "comfortable",
});
```

What it does (in order):

1. Reads the persisted preference from `localStorage` using the configured key.
2. Validates the stored format (requires `version: 1`).
3. If mode is `"system"`, resolves via `matchMedia("(prefers-color-scheme: dark)")`.
4. Falls back to `defaultMode`/`defaultDensity` if storage is unavailable or invalid.
5. Sets `data-kui-theme` and `data-kui-density` on `document.documentElement`.
6. Silently handles all errors — never throws or logs.

### Options

| Option             | Default                  | Description                   |
| ------------------ | ------------------------ | ----------------------------- |
| `storageKey`       | `"kui-theme-preference"` | localStorage key              |
| `defaultMode`      | `"light"`                | Fallback if no stored value   |
| `defaultDensity`   | `"comfortable"`          | Fallback if no stored density |
| `themeAttribute`   | `"data-kui-theme"`       | Attribute name for theme      |
| `densityAttribute` | `"data-kui-density"`     | Attribute name for density    |

### Readable Version

For debugging, use the formatted version:

```typescript
import { getNoFlashScriptReadable } from "@kairoui/theme/server";

const readable = getNoFlashScriptReadable({ defaultMode: "light" });
// Same logic but with indentation and comments
```

## Script Placement

Place the no-flash script in `<head>` before any stylesheets or the main bundle:

```html
<html data-kui-theme="light" data-kui-density="comfortable">
  <head>
    <script>
      /* no-flash script goes here */
    </script>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

This ensures the correct attributes are set before the browser applies CSS, eliminating any flash.

## CSP Nonce

If your Content Security Policy requires a nonce for inline scripts, add it to the `<script>` tag:

```html
<script nonce="SERVER_GENERATED_NONCE">
  /* no-flash script content */
</script>
```

The no-flash script does not use `eval`, `Function()`, or `innerHTML`. It only reads `localStorage`, checks `matchMedia`, and sets attributes via `document.documentElement.setAttribute`. This is compatible with strict CSP policies that allow `script-src 'nonce-...'`.

## localStorage Preference

The no-flash script reads from `localStorage` by default. The stored format is:

```json
{ "version": 1, "mode": "dark", "density": "compact" }
```

This is the same format that `KairoProvider` writes in uncontrolled mode. No additional setup is needed — the no-flash script and the provider share the same key and format.

## Cookies

If you need server-side preference detection (to avoid even the brief flash before the no-flash script runs), read the preference from a cookie on the server:

```typescript
import { getServerHtmlAttributes } from "@kairoui/theme/server";

function getThemeFromCookie(cookieHeader: string): "light" | "dark" {
  const match = cookieHeader.match(/kui-theme=(\w+)/);
  if (match && (match[1] === "light" || match[1] === "dark")) {
    return match[1];
  }
  return "light";
}

// In your request handler:
const mode = getThemeFromCookie(request.headers.cookie ?? "");
const attrs = getServerHtmlAttributes({ resolvedMode: mode });
```

Cookie-based persistence is your responsibility — KairoUI does not set cookies. Combine with the no-flash script for full coverage (the script handles the case where the cookie is missing or stale).

## System Preference

When mode is `"system"`, the no-flash script resolves the effective theme via `matchMedia`:

```javascript
// Inside the no-flash script (simplified):
if (mode === "system") {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  resolvedMode = isDark ? "dark" : "light";
}
```

On the server, you cannot detect system preference. Set `resolvedMode` to your server default (typically `"light"`). The no-flash script will correct it on the client before the first paint.

## Hydration

Pass `serverState` to `KairoProvider` to ensure React's initial render matches the DOM:

```tsx
import { KairoProvider } from "@kairoui/core";
import { parseServerState } from "@kairoui/theme/server";

function ClientApp() {
  const serverState = parseServerState(window.__KAIRO_STATE__);

  return (
    <KairoProvider serverState={serverState ?? undefined}>
      <App />
    </KairoProvider>
  );
}
```

The provider's initialization priority:

1. Controlled props (`mode`/`density`) — highest
2. DOM attributes (set by no-flash script)
3. `serverState` prop
4. `defaultMode`/`defaultDensity` props
5. Persisted preference (`localStorage`)
6. KairoUI defaults (`"system"` mode, `"comfortable"` density)

Because the no-flash script already patched the DOM, and the provider reads those DOM attributes, the React render will match the visible state.

## Controlled Provider with SSR

For controlled mode in SSR, pass the resolved state from the server:

```tsx
import { useState } from "react";
import { KairoProvider } from "@kairoui/core";
import type { ThemeMode } from "@kairoui/theme";

function App({ initialMode }: { initialMode: ThemeMode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  return (
    <KairoProvider mode={mode} onModeChange={setMode}>
      <Main />
    </KairoProvider>
  );
}
```

In controlled mode, the provider uses the `mode` prop directly and does not read from localStorage or DOM attributes.

## Invalid State Recovery

If the no-flash script encounters invalid data (corrupted localStorage, wrong version, unexpected values), it:

1. Falls back to `defaultMode` and `defaultDensity`.
2. Does not throw or log errors.
3. Does not clear the corrupted storage (avoids data loss from other tabs).

Similarly, `parseServerState` returns `null` for invalid input rather than throwing. Always handle the `null` case:

```typescript
const state = parseServerState(maybeCorrupt);
// state is ServerThemeState | null
```

## Next.js App Router

A complete integration with Next.js App Router:

```tsx
// app/layout.tsx
import {
  getNoFlashScript,
  getServerHtmlAttributes,
  serializeServerState,
} from "@kairoui/theme/server";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const attrs = getServerHtmlAttributes({ resolvedMode: "light", density: "comfortable" });
  const noFlash = getNoFlashScript({ defaultMode: "light" });
  const stateJson = serializeServerState({
    mode: "system",
    resolvedMode: "light",
    density: "comfortable",
  });

  return (
    <html lang="en" {...attrs}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `window.__KAIRO_STATE__='${stateJson}'` }} />
        {children}
      </body>
    </html>
  );
}
```

```tsx
// app/providers.tsx
"use client";

import { KairoProvider } from "@kairoui/core";
import { parseServerState } from "@kairoui/theme/server";

export function Providers({ children }: { children: React.ReactNode }) {
  const serverState =
    typeof window !== "undefined"
      ? (parseServerState((window as Record<string, unknown>).__KAIRO_STATE__ as string) ??
        undefined)
      : undefined;

  return <KairoProvider serverState={serverState}>{children}</KairoProvider>;
}
```

```tsx
// app/layout.tsx (body section)
import { Providers } from "./providers";

// Inside the <body>:
<Providers>{children}</Providers>;
```

## Common Mismatch Causes

| Cause                                                | Fix                                                   |
| ---------------------------------------------------- | ----------------------------------------------------- |
| Missing `data-kui-theme` on server `<html>`          | Use `getServerHtmlAttributes()`                       |
| No-flash script placed after stylesheets             | Move `<script>` before `<link>` in `<head>`           |
| Different `storageKey` between no-flash and provider | Use the same key (default: `"kui-theme-preference"`)  |
| Server defaults don't match no-flash defaults        | Pass identical `defaultMode`/`defaultDensity` to both |
| `serverState` not passed to provider                 | Provider falls back to defaults, may differ from DOM  |
| Controlled mode with wrong initial value             | Initialize state from `serverState` or DOM attributes |

## Security Considerations

**No-flash script:**

- Does not use `eval`, `new Function`, or `innerHTML`.
- Only calls `localStorage.getItem`, `matchMedia`, and `setAttribute`.
- Compatible with CSP `script-src 'nonce-...'` policies.
- Silently catches all exceptions — does not expose error details.

**Server state serialization:**

- All `<`, `>`, `&` characters are escaped to prevent script injection.
- `parseServerState` rejects objects with `__proto__`, `constructor`, or `prototype` keys.
- Validates all fields against allowed enum values before returning.

**localStorage:**

- The preference key contains only mode and density — no sensitive data.
- Storage reads are wrapped in try/catch for environments where localStorage is blocked (private browsing, iframe sandboxing).

**General:**

- Never embed user-controlled data in the no-flash script template.
- Use a nonce or hash for CSP rather than `'unsafe-inline'`.
- The serialized state format is versioned — future versions will not break existing clients.
