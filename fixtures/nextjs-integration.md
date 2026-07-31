/**

- Next.js App Router Integration Example
-
- This fixture demonstrates the recommended integration pattern for
- KairoUI theming in a Next.js App Router application. These are
- reference files — not a runnable Next.js app.
-
- ## Required Files
-
- 1.  `layout.tsx` — Root layout (Server Component)
- - Sets initial HTML attributes: data-kui-theme, data-kui-density
- - Injects the no-flash script in <head>
- - Renders the client-side ThemeProvider wrapper
-
- 2.  `theme-provider.tsx` — Client Component wrapper
- - Marked with "use client" directive
- - Wraps children in <KairoProvider>
- - Passes serverState for hydration safety
-
- ## Server vs Client Boundaries
-
- - The root layout is a SERVER component. It cannot use hooks or state.
- It renders static HTML attributes and injects the no-flash script.
-
- - The ThemeProvider is a CLIENT component (marked "use client").
- It wraps the application in <KairoProvider> which manages runtime
- theme switching, persistence, and system preference detection.
-
- ## Why the Provider is a Client Component
-
- KairoProvider uses React hooks (useState, useEffect, useCallback) which
- only work in client components. The provider must be rendered by a
- client component wrapper, not directly in the server layout.
-
- ## No-Flash Initialization
-
- The no-flash script runs synchronously in <head> before React hydrates:
- 1.  Reads localStorage for persisted preference
- 2.  Checks prefers-color-scheme if mode is "system"
- 3.  Sets data-kui-theme and data-kui-density on <html>
- 4.  React hydration then reads these attributes → no mismatch
-
- ## Cookie Option
-
- For zero-flash (even before the no-flash script), the server can read
- a cookie to determine the initial theme:
-
- import { cookies } from "next/headers";
- const themeCookie = cookies().get("kui-theme-mode")?.value;
- const resolvedMode = themeCookie === "dark" ? "dark" : "light";
-
- Consumers set the cookie via onModeChange callback. KairoUI does NOT
- set cookies automatically.
-
- ## localStorage Option (Default)
-
- Without cookies, the server renders with the default theme (light).
- The no-flash script patches the DOM before first paint using localStorage.
- This produces at most one frame of incorrect theme on very first load
- (before any preference is persisted).
-
- ## CSP Guidance
-
- The no-flash script is inline. For CSP compliance:
-
- - Generate a nonce per request
- - Pass the nonce to both the <script> tag and the CSP header
- - Next.js App Router: use generateNonce() in middleware
-
- ## Common Mistakes
-
- 1.  Placing <KairoProvider> directly in layout.tsx without "use client"
- → Error: hooks cannot be used in Server Components
-
- 2.  Forgetting the no-flash script
- → Flash of light theme before client hydration for dark-mode users
-
- 3.  Using source imports instead of package exports
- → Breaks in production builds; always import from "@kairoui/core"
-
- 4.  Setting data-kui-theme in layout without the no-flash script
- → Works for SSR but flashes on client navigation if preference differs
-
- 5.  Not passing serverState to KairoProvider
- → Still works (provider reads DOM), but explicit state is more robust
  */

// ─── Example: app/layout.tsx (Server Component) ─────────────────────

export const EXAMPLE_LAYOUT = `
// app/layout.tsx
import { getNoFlashScript, getServerHtmlAttributes } from "@kairoui/theme/server";
import { ThemeProvider } from "./theme-provider";

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
// Server defaults — no browser APIs available here
const attrs = getServerHtmlAttributes({ resolvedMode: "light", density: "comfortable" });

return (
<html lang="en" {...attrs}>
<head>
{/* No-flash script: must be AFTER CSS, BEFORE main bundle */}
<script
dangerouslySetInnerHTML={{ __html: getNoFlashScript() }}
/>
</head>
<body>
<ThemeProvider
          serverResolvedMode="light"
          serverDensity="comfortable"
        >
{children}
</ThemeProvider>
</body>
</html>
);
}
`;

// ─── Example: app/theme-provider.tsx (Client Component) ──────────────

export const EXAMPLE_THEME_PROVIDER = `
// app/theme-provider.tsx
"use client";

import { KairoProvider } from "@kairoui/core";
import type { ReactNode } from "react";

export function ThemeProvider({
children,
serverResolvedMode,
serverDensity,
}: {
children: ReactNode;
serverResolvedMode?: "light" | "dark";
serverDensity?: "comfortable" | "standard" | "compact";
}) {
return (
<KairoProvider
serverState={{
        resolvedMode: serverResolvedMode,
        density: serverDensity,
      }} >
{children}
</KairoProvider>
);
}
`;

// ─── Example: CSP with Nonce ─────────────────────────────────────────

export const EXAMPLE_CSP_LAYOUT = `
// app/layout.tsx (with CSP nonce)
import { headers } from "next/headers";
import { getNoFlashScript, getServerHtmlAttributes } from "@kairoui/theme/server";
import { ThemeProvider } from "./theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
const nonce = headers().get("x-nonce") ?? "";
const attrs = getServerHtmlAttributes({ resolvedMode: "light" });

return (
<html lang="en" {...attrs}>
<head>
<script
nonce={nonce}
dangerouslySetInnerHTML={{ __html: getNoFlashScript() }}
/>
</head>
<body>
<ThemeProvider>{children}</ThemeProvider>
</body>
</html>
);
}
`;

// ─── Example: Theme Toggle Component ─────────────────────────────────

export const EXAMPLE_TOGGLE = `
// components/theme-toggle.tsx
"use client";

import { useThemeMode } from "@kairoui/core";

export function ThemeToggle() {
const { mode, resolvedMode, toggleMode, setMode } = useThemeMode();

return (
<div>
<p>Current: {resolvedMode} (requested: {mode})</p>
<button onClick={toggleMode}>Toggle</button>
<button onClick={() => setMode("system")}>Use System</button>
</div>
);
}
`;

// ─── Example: Density Selector ───────────────────────────────────────

export const EXAMPLE_DENSITY = `
// components/density-selector.tsx
"use client";

import { useDensity } from "@kairoui/core";

export function DensitySelector() {
const { density, setDensity } = useDensity();

return (
<select value={density} onChange={(e) => setDensity(e.target.value as any)}>
<option value="comfortable">Comfortable</option>
<option value="standard">Standard</option>
<option value="compact">Compact</option>
</select>
);
}
`;
