# SSR and Hydration Strategy

This document defines how KairoUI's theme engine operates across server-rendering frameworks, including hydration, no-flash initialization, and preference restoration.

## Supported Environments

| Framework                  | Mode             | Support Level                           |
| -------------------------- | ---------------- | --------------------------------------- |
| Next.js (App Router)       | Streaming SSR    | Full                                    |
| Next.js (Pages Router)     | SSR / SSG        | Full                                    |
| Remix                      | Streaming SSR    | Full                                    |
| React Router SSR           | Streaming SSR    | Full                                    |
| Vite SSR                   | Custom SSR       | Full                                    |
| Traditional SSR            | `renderToString` | Full                                    |
| Static HTML (pre-rendered) | Build-time       | Partial (no server-detected preference) |

## Lifecycle

```
1. Server renders HTML
   → Uses a server default mode (typically "light")
   → Sets data-kui-theme="light" on <html>
   → Injects no-flash inline script in <head>

2. Browser receives HTML
   → Browser paints with server default (briefly)
   → No-flash script executes synchronously
   → Reads localStorage preference
   → Checks prefers-color-scheme if mode is "system"
   → Patches data-kui-theme and data-kui-density on <html>
   → First paint shows correct theme (no flash)

3. React hydrates
   → KairoProvider mounts
   → Reads current data-kui-theme/data-kui-density from DOM
   → Initializes React state to match DOM values
   → No hydration mismatch (DOM already correct)

4. Provider takes ownership
   → Subscribes to system preference changes
   → Subscribes to cross-tab storage events
   → Manages subsequent theme/density changes
```

## Server Defaults

The server cannot access `localStorage` or `matchMedia`. It uses:

| Source            | Value                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Default           | `"light"` mode, `"comfortable"` density                             |
| Cookie (optional) | Server reads a theme preference cookie                              |
| Prop              | Consumer passes `defaultMode` / `defaultDensity` to `KairoProvider` |

### Cookie-Based Preference (Optional)

For eliminating flash entirely (even before the no-flash script), the server can read a theme preference cookie:

```
kui-theme-mode=dark; kui-theme-density=compact
```

This is optional — the no-flash script handles most cases. Cookies are only needed when:

- The page is server-rendered with dynamic content
- Even a single-frame flash is unacceptable
- The application can set a cookie on theme change

KairoUI does NOT set cookies automatically. Consumers implement cookie writing via `onModeChange`/`onDensityChange` callbacks.

## No-Flash Initialization Script

### Purpose

Runs synchronously before first paint to set the correct `data-kui-theme` and `data-kui-density` attributes, preventing a visible flash of the wrong theme.

### Placement

```html
<head>
  <!-- CSS must load first -->
  <link rel="stylesheet" href="tokens.css" />
  <!-- No-flash script immediately after -->
  <script>
    /* no-flash script */
  </script>
</head>
```

### Script Behavior

```javascript
(function () {
  try {
    var stored = localStorage.getItem("kui-theme-preference");
    var pref = stored ? JSON.parse(stored) : null;
    var mode = pref && pref.version === 1 ? pref.mode : null;
    var density = pref && pref.version === 1 ? pref.density : null;

    var resolved = mode;
    if (mode === "system" || !mode) {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    if (resolved === "dark" || resolved === "light") {
      document.documentElement.setAttribute("data-kui-theme", resolved);
    }
    if (density === "comfortable" || density === "standard" || density === "compact") {
      document.documentElement.setAttribute("data-kui-density", density);
    }
  } catch (e) {}
})();
```

### CSP and Nonce Support

The no-flash script is an inline script. For Content Security Policy compliance:

1. **Nonce-based CSP** (recommended): The script tag includes a `nonce` attribute matching the server's CSP header.

   ```html
   <script nonce="abc123">
     /* no-flash */
   </script>
   ```

2. **Hash-based CSP**: The CSP header includes the SHA-256 hash of the script content.

   ```
   Content-Security-Policy: script-src 'sha256-<hash>'
   ```

3. **unsafe-inline** (not recommended): Allows all inline scripts.

KairoUI provides a `getNoFlashScript()` function that returns the script content as a string. Frameworks inject it with their CSP mechanism:

```typescript
import { getNoFlashScript } from "@kairoui/theme/server";

// Next.js App Router
<script nonce={nonce} dangerouslySetInnerHTML={{ __html: getNoFlashScript() }} />
```

### Configuration

```typescript
getNoFlashScript({
  storageKey: "kui-theme-preference", // custom key
  defaultMode: "light", // fallback when no preference
  defaultDensity: "comfortable", // fallback density
  attribute: "data-kui-theme", // target attribute
  densityAttribute: "data-kui-density",
});
```

## Hydration Contract

### React State Initialization

When `KairoProvider` mounts during hydration:

1. It reads `document.documentElement.getAttribute("data-kui-theme")` to get the current resolved mode.
2. It reads `document.documentElement.getAttribute("data-kui-density")` to get the current density.
3. It reads `localStorage` to get the full preference (including whether mode is "system").
4. It initializes state to match the DOM — ensuring no hydration mismatch.

### Why No Mismatch Occurs

- Server renders with `data-kui-theme="light"` (default).
- No-flash script may change it to `"dark"` before React hydrates.
- React's hydration compares the rendered DOM (after script ran) with what the component produces.
- `KairoProvider` reads the current DOM value as its initial state → matches.

### Edge Case: JavaScript Disabled

If JavaScript is disabled:

- No-flash script doesn't run.
- React doesn't hydrate.
- The page stays with the server default (e.g., "light").
- CSS variables from `tokens.css` apply the light theme.
- This is acceptable progressive enhancement.

## Framework Integration Patterns

### Next.js App Router

```typescript
// app/layout.tsx
import { getNoFlashScript } from "@kairoui/theme/server";

export default function RootLayout({ children }) {
  return (
    <html data-kui-theme="light" data-kui-density="comfortable">
      <head>
        <script dangerouslySetInnerHTML={{ __html: getNoFlashScript() }} />
      </head>
      <body>
        <KairoProvider>{children}</KairoProvider>
      </body>
    </html>
  );
}
```

### Remix

```typescript
// root.tsx
import { getNoFlashScript } from "@kairoui/theme/server";

export default function App() {
  return (
    <html data-kui-theme="light" data-kui-density="comfortable">
      <head>
        <script dangerouslySetInnerHTML={{ __html: getNoFlashScript() }} />
      </head>
      <body>
        <KairoProvider>
          <Outlet />
        </KairoProvider>
      </body>
    </html>
  );
}
```

### Vite SSR

```typescript
// server.ts
import { getNoFlashScript } from "@kairoui/theme/server";

const html = renderToString(<App />);
const page = `
  <html data-kui-theme="light" data-kui-density="comfortable">
    <head>
      <script>${getNoFlashScript()}</script>
    </head>
    <body>${html}</body>
  </html>
`;
```

### Static HTML

```html
<html data-kui-theme="light" data-kui-density="comfortable">
  <head>
    <link rel="stylesheet" href="@kairoui/tokens/css" />
    <script>
      /* inline no-flash script content */
    </script>
  </head>
</html>
```

## Invalid Stored Values

The no-flash script validates stored values:

- Unknown modes are ignored (falls back to default).
- Invalid JSON is ignored.
- Wrong version is ignored.
- Missing `localStorage` (private browsing) is handled via try/catch.

After hydration, `KairoProvider` performs the same validation through the preference resolution system, potentially clearing invalid stored data.

## Server-Rendering Safety Rules

1. **No `window` access in module scope** — all browser APIs are guarded.
2. **No `document` access during `renderToString`** — provider detects SSR via `typeof document`.
3. **No `localStorage` on the server** — preference reading happens client-side only.
4. **No `matchMedia` on the server** — system preference detection is client-only.
5. **`KairoProvider` on the server** renders a context provider with default values but performs no DOM mutations.

## Requested vs Resolved Mode in SSR

| Context         | Requested Mode              | Resolved Mode               |
| --------------- | --------------------------- | --------------------------- |
| Server render   | `"system"` (default)        | `"light"` (fallback)        |
| After no-flash  | Preserved from localStorage | Computed from system/stored |
| After hydration | Full preference             | Full resolution             |

The server cannot resolve `"system"` to a concrete mode (no `matchMedia`). It uses the fallback. The no-flash script resolves it correctly before paint.

## Progressive Enhancement

| JavaScript State             | Behavior                                                      |
| ---------------------------- | ------------------------------------------------------------- |
| Fully loaded                 | Complete theming with preferences                             |
| Script loaded, React not yet | No-flash script applies correct theme                         |
| No JavaScript                | Server default theme (light), functional but not personalized |
| localStorage blocked         | System preference detection still works                       |
| matchMedia unavailable       | Falls back to light mode                                      |
