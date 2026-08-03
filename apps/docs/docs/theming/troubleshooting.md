---
sidebar_position: 4
title: Troubleshooting
---

# Theme Troubleshooting

## Theme Not Applying

**Symptom:** Components render without themed colors or spacing.

**Likely causes:**

- Missing CSS import from `@kairoui/tokens`.
- Provider not wrapping the component tree.
- Target element doesn't have the expected attributes.

**Diagnostic steps:**

1. Inspect `<html>` in DevTools — check for `data-kui-theme` and `data-kui-density` attributes.
2. Check the Elements panel for CSS custom properties (e.g., `--kui-color-interactive-default`).
3. Verify your entry file has `import "@kairoui/tokens/css"`.

**Resolution:** Add the CSS import and wrap your tree in `<KairoProvider>`.

**Related:** [Quick Start](/getting-started/quick-start#required-css-imports)

---

## CSS Variables Missing

**Symptom:** Inspecting an element shows `var(--kui-...)` values as unresolved (empty or `initial`).

**Likely causes:**

- `@kairoui/tokens/css` not imported.
- CSS file not included in the build output.
- Bundler tree-shaking removed the side-effect-only CSS import.

**Diagnostic steps:**

1. Search your built CSS for `--kui-color` — if absent, the import is missing.
2. Check bundler config: CSS imports from `@kairoui/tokens` have `"sideEffects": ["**/*.css"]` declared.

**Resolution:**

```tsx
// Add at your application entry point
import "@kairoui/tokens/css";
```

If using individual theme files:

```tsx
import "@kairoui/tokens/css/light";
import "@kairoui/tokens/css/dark";
import "@kairoui/tokens/css/density/comfortable";
```

**Related:** `@kairoui/tokens` package.json `sideEffects` field

---

## Wrong Import Path

**Symptom:** Build error: `Cannot find module '@kairoui/theme/react'` or similar.

**Likely causes:**

- Using a path that doesn't exist in the package exports.

**Diagnostic steps:**

Check the valid export paths:

- `@kairoui/theme` — core theme utilities
- `@kairoui/theme/dom` — browser DOM functions
- `@kairoui/theme/server` — SSR utilities
- `@kairoui/core` — React provider and hooks

**Resolution:** Use only the documented entry points. There is no `@kairoui/theme/react`, `@kairoui/theme/css`, or `@kairoui/core/hooks`.

**Related:** [Architecture — Package Responsibilities](/architecture/theme-engine#package-responsibilities)

---

## Missing CSS Import

**Symptom:** Theme attributes are correctly set on the DOM but no visual change occurs.

**Likely causes:**

- The attribute-selector CSS (`[data-kui-theme="dark"] { ... }`) is not loaded.

**Diagnostic steps:**

1. In DevTools, select `<html>` and check Styles panel for rules matching `[data-kui-theme]`.
2. If no rules appear, the token CSS is not loaded.

**Resolution:** Import `@kairoui/tokens/css` which includes both light and dark variable definitions.

---

## Wrong Target Element

**Symptom:** Theme works in some components but not others, or only works inside a specific container.

**Likely causes:**

- `KairoProvider` has a `target` prop pointing to a non-root element.
- CSS variables don't cascade outside the target's subtree.

**Diagnostic steps:**

1. Check which element has `data-kui-theme` in DevTools.
2. Verify your components are descendants of that element.

**Resolution:** Remove the `target` prop to use the default (`document.documentElement`), or ensure all themed components are within the target's DOM subtree.

**Related:** [Quick Start — Custom Target](/getting-started/quick-start#custom-target)

---

## Theme Flashes

**Symptom:** Brief flash of wrong theme on page load (light flashes before dark, or vice versa).

**Likely causes:**

- No-flash script missing or placed after stylesheets.
- Server HTML attributes don't match the user's stored preference.
- Script `defaultMode` doesn't match server render defaults.

**Diagnostic steps:**

1. View page source — confirm `<script>` with no-flash content is in `<head>` before any `<link>`.
2. Check `<html>` attributes in the raw HTML response.
3. Compare `defaultMode` in `getNoFlashScript()` with `getServerHtmlAttributes()`.

**Resolution:** Place the no-flash script first in `<head>` and use consistent defaults:

```typescript
const opts = { defaultMode: "light", defaultDensity: "comfortable" };
const script = getNoFlashScript(opts);
const attrs = getServerHtmlAttributes({
  resolvedMode: opts.defaultMode,
  density: opts.defaultDensity,
});
```

**Related:** [SSR & No-Flash — Script Placement](/theming/ssr-no-flash#script-placement)

---

## Hydration Mismatch

**Symptom:** React console warning about server/client content mismatch on `data-kui-theme` or `data-kui-density`.

**Likely causes:**

- Server renders `data-kui-theme="light"` but the no-flash script changes it to `"dark"` before hydration.
- `serverState` not passed to `KairoProvider`.

**Diagnostic steps:**

1. View source — check what the server sent for `data-kui-theme`.
2. Inspect the DOM at hydration time — check what the no-flash script set.
3. The mismatch occurs when these differ and the provider doesn't know.

**Resolution:** Pass `serverState` to the provider. The provider reads DOM attributes (set by the no-flash script) and uses them for initial state, preventing mismatches.

**Related:** [SSR & No-Flash — Hydration](/theming/ssr-no-flash#hydration)

---

## Stored Preference Ignored

**Symptom:** User's saved preference not restored on page reload.

**Likely causes:**

- Using controlled mode (`mode` prop) which bypasses localStorage.
- Different `storageKey` between no-flash script and provider.
- localStorage blocked (private browsing, iframe sandbox).

**Diagnostic steps:**

1. Check DevTools → Application → Local Storage for key `kui-theme-preference`.
2. Verify you're using uncontrolled mode (`defaultMode`, not `mode`).
3. Check if a custom `storageKey` was passed to `getNoFlashScript`.

**Resolution:** For automatic persistence, use `defaultMode` (uncontrolled). The provider reads and writes to `localStorage` with key `kui-theme-preference`.

---

## System Mode Not Updating

**Symptom:** Changing OS dark/light preference doesn't update the theme when mode is `"system"`.

**Likely causes:**

- Provider is using controlled mode with a fixed value.
- The `matchMedia` listener was not attached (SSR-only environment).

**Diagnostic steps:**

1. Confirm `mode` is `"system"` (check with `useTheme()` → `mode`).
2. In DevTools, run `window.matchMedia("(prefers-color-scheme: dark)").matches` to verify the query works.
3. Check if the provider is controlled — controlled providers don't auto-listen.

**Resolution:** Use uncontrolled mode with `defaultMode="system"`. The provider subscribes to `matchMedia` changes and updates automatically.

---

## Cross-Tab Synchronization Not Working

**Symptom:** Changing theme in one tab doesn't update other tabs.

**Likely causes:**

- Controlled providers don't listen for storage events.
- localStorage is not available (iframe, private browsing).
- Tabs are on different origins.

**Diagnostic steps:**

1. Open two tabs of the same origin.
2. Change theme in tab A and check if tab B's `localStorage` key updated (it should via the browser's storage event).
3. Check console for errors related to `addEventListener("storage", ...)`.

**Resolution:** Cross-tab sync works automatically in uncontrolled mode. For controlled providers, use `createCrossTabSync` from `@kairoui/theme/dom` to listen for changes manually.

**Related:** `createCrossTabSync` in `@kairoui/theme/dom`

---

## Nested Provider Unexpected Behavior

**Symptom:** Nested `KairoScopeProvider` doesn't inherit parent theme, or changes in child affect parent.

**Likely causes:**

- Using `KairoProvider` instead of `KairoScopeProvider` for nested scopes.
- Expecting persistence from a scoped provider (they don't persist).

**Diagnostic steps:**

1. Check which provider type is used — `KairoScopeProvider` for nested scopes.
2. Verify `useIsNested()` returns `true` inside the scope.
3. Check that only `mode` or `density` is set on the scope (unset values inherit).

**Resolution:** Use `KairoScopeProvider` for nested regions. It inherits unset values from the parent and does not modify `document.documentElement`.

**Related:** [Scoped Theming](/theming/scoped-theming#nested-inheritance)

---

## Density Not Updating

**Symptom:** Calling `setDensity` has no visible effect.

**Likely causes:**

- Density CSS not loaded (missing density-specific CSS import).
- Controlled density without `onDensityChange` handler.
- Component styles don't use density CSS variables.

**Diagnostic steps:**

1. Check `data-kui-density` attribute on the target element — does it change?
2. If it changes but styles don't, check for CSS rules matching `[data-kui-density="compact"]`.
3. If using controlled mode, verify `onDensityChange` updates the state.

**Resolution:** Ensure `@kairoui/tokens/css` is imported (it includes all density definitions). For controlled density, always implement `onDensityChange`.

---

## Invalid Overrides

**Symptom:** `createTheme` throws an error about unknown override groups.

**Likely causes:**

- Using an invalid top-level key in `overrides` (e.g., `overrides.colors` instead of `overrides.color`).

**Diagnostic steps:**

1. Read the error message — it lists valid groups.
2. Check your override object keys against: `color`, `typography`, `spacing`, `elevation`.

**Resolution:** Use only valid override group names:

```typescript
createTheme({
  name: "my-theme",
  base: "light",
  overrides: {
    color: {/* ... */}, // ✓
    typography: {/* ... */}, // ✓
    spacing: {/* ... */}, // ✓
    elevation: {/* ... */}, // ✓
    // colors: { ... },         // ✗ invalid — use "color"
  },
});
```

**Related:** [Custom Themes — Validation](/theming/custom-themes#validation)

---

## Duplicate Target Ownership

**Symptom:** Conflicting theme attribute changes, flickering, or unexpected mode on the same element.

**Likely causes:**

- Multiple `KairoProvider` instances targeting the same element.
- Both `KairoProvider` and `applyScopedTheme` managing the same DOM element.

**Diagnostic steps:**

1. Search for multiple `<KairoProvider>` without `target` props (they all default to `<html>`).
2. Check for `applyScopedTheme` calls on `document.documentElement`.

**Resolution:** Each DOM element should be managed by at most one provider or `applyScopedTheme` call. Use `target` to assign different elements, or restructure to a single root provider with `KairoScopeProvider` for regions.

---

## Storybook Theme Mismatch

**Symptom:** Components in Storybook don't pick up the theme or show wrong colors.

**Likely causes:**

- Storybook preview not importing `@kairoui/tokens/css`.
- Storybook decorator not wrapping stories in `KairoProvider`.

**Diagnostic steps:**

1. Check `.storybook/preview.ts` for CSS imports.
2. Check decorators for `KairoProvider` wrapper.

**Resolution:** Add to `.storybook/preview.ts`:

```typescript
import "@kairoui/tokens/css";
```

And ensure a decorator provides the theme context (see the project's `.storybook/with-kairo-theme.ts` for reference).

---

## SSR Browser-Global Errors

**Symptom:** `ReferenceError: window is not defined` or `document is not defined` during server render.

**Likely causes:**

- Importing `@kairoui/theme/dom` on the server (it's browser-only at call time, but safe to import).
- Calling DOM functions like `applyTheme` or `applyScopedTheme` during server render.

**Diagnostic steps:**

1. Check the stack trace — identify which function accesses `window`/`document`.
2. Verify server code only imports from `@kairoui/theme` or `@kairoui/theme/server`.

**Resolution:**

- On the server, use `@kairoui/theme/server` for SSR utilities.
- `@kairoui/theme` (root entry) is safe to import anywhere — no browser globals at module level.
- `@kairoui/theme/dom` functions must only be called in browser contexts (effects, event handlers, not during render).
- `KairoProvider` is SSR-safe — it checks `typeof document !== "undefined"` before accessing the DOM.

---

## CSP Script Blocking

**Symptom:** No-flash script doesn't execute; console shows CSP violation.

**Likely causes:**

- Inline `<script>` without a nonce or hash in `script-src` directive.

**Diagnostic steps:**

1. Check browser console for `Refused to execute inline script` errors.
2. Check your CSP header's `script-src` directive.

**Resolution:** Add a server-generated nonce to the script tag:

```html
<script nonce="your-server-nonce">
  /* no-flash script */
</script>
```

Do not use `'unsafe-inline'` — use nonce-based CSP instead.

**Related:** [SSR & No-Flash — CSP Nonce](/theming/ssr-no-flash#csp-nonce)

---

## Production Diagnostics Unavailable

**Symptom:** Development warnings (e.g., "must be used within KairoProvider") disappear in production.

**Likely causes:**

- This is intentional. All `devWarn` diagnostics are gated behind `process.env.NODE_ENV !== "production"` and are tree-shaken from production builds.

**Diagnostic steps:**

1. Reproduce the issue in development mode to see the warning.
2. Use `inspectTheme()` or `inspectResolvedTheme()` to debug theme state at runtime (these work in production).

**Resolution:** Debug in development. For production runtime introspection, use:

```typescript
import { inspectTheme } from "@kairoui/theme";

const report = inspectTheme(myThemeDefinition);
console.log(report.overrideGroups, report.overrideCount);
```

**Related:** [Custom Themes — Inspection](/theming/custom-themes#inspection)
