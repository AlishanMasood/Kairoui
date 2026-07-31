---
sidebar_position: 4
title: SSR & Hydration
---

# SSR and Hydration Strategy

KairoUI supports server-side rendering across all major React SSR frameworks with no hydration mismatches and no visible theme flash.

## Lifecycle

```
Server default → Initial HTML → No-flash script → React hydration → Provider ownership
```

1. **Server renders** with a default theme (`data-kui-theme="light"`) and injects the no-flash script.
2. **No-flash script** runs synchronously before first paint, reads stored preference and system preference, patches the DOM attributes.
3. **React hydrates** — `KairoProvider` reads the current DOM attributes as its initial state, producing no mismatch.
4. **Provider takes ownership** — subscribes to system/storage changes, manages subsequent updates.

## No-Flash Script

A small inline script that prevents a visible flash of the wrong theme:

- Reads `localStorage` for persisted preference
- Checks `prefers-color-scheme` when mode is `"system"`
- Sets `data-kui-theme` and `data-kui-density` on `<html>`
- Runs before first paint
- Wrapped in try/catch for safety
- Supports CSP via nonce or hash

```tsx
import { getNoFlashScript } from "@kairoui/theme/server";

<script dangerouslySetInnerHTML={{ __html: getNoFlashScript() }} />;
```

## CSP Compliance

The inline script requires CSP approval:

| Method              | Implementation                              |
| ------------------- | ------------------------------------------- |
| Nonce (recommended) | `<script nonce={nonce}>` + CSP header       |
| Hash                | SHA-256 hash in CSP header                  |
| unsafe-inline       | Allows all inline scripts (not recommended) |

## Framework Support

| Framework            | Support                                 |
| -------------------- | --------------------------------------- |
| Next.js App Router   | Full                                    |
| Next.js Pages Router | Full                                    |
| Remix                | Full                                    |
| React Router SSR     | Full                                    |
| Vite SSR             | Full                                    |
| Static HTML          | Partial (no server-detected preference) |

## Server Safety

- No `window`, `document`, `localStorage`, or `matchMedia` access during server render
- `KairoProvider` renders safely on the server with default values
- No DOM mutations during `renderToString`

## Full Specification

See [`docs/architecture/ssr-strategy.md`](https://github.com/AliShanMasood/Kairoui/blob/main/docs/architecture/ssr-strategy.md) for the complete technical specification including cookie support, progressive enhancement, and framework integration patterns.
