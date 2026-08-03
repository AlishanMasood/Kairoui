---
sidebar_position: 1
title: Custom Themes
---

# Custom Theme Creation

This guide covers creating, composing, validating, and inspecting custom themes using the `@kairoui/theme` package.

## Extending the Light Theme

Create a custom theme based on the built-in light theme with partial overrides:

```typescript
import { createTheme } from "@kairoui/theme";

const brandLight = createTheme({
  name: "brand-light",
  base: "light",
  description: "Brand light theme with custom interactive colors",
  overrides: {
    color: {
      interactive: {
        default: "#0066cc",
        hover: "#0052a3",
        active: "#003d7a",
      },
    },
  },
});
```

Only override what differs from the base. All unspecified tokens inherit from the built-in light theme.

## Extending the Dark Theme

```typescript
import { createTheme } from "@kairoui/theme";

const brandDark = createTheme({
  name: "brand-dark",
  base: "dark",
  description: "Brand dark theme with custom interactive colors",
  overrides: {
    color: {
      interactive: {
        default: "#66b3ff",
        hover: "#99ccff",
        active: "#3399ff",
      },
    },
  },
});
```

## Creating Organization Themes

Organization themes typically override brand colors and add metadata:

```typescript
import { createTheme } from "@kairoui/theme";

const acmeLight = createTheme({
  name: "acme-light",
  base: "light",
  description: "Acme Corp brand theme",
  metadata: {
    organization: "Acme Corp",
    version: "2.0.0",
  },
  overrides: {
    color: {
      interactive: {
        default: "#e63946",
        hover: "#c1121f",
        active: "#9b2226",
      },
      focus: {
        ring: "#e63946",
      },
    },
  },
});
```

## Creating Product Themes

Product themes layer on top of organization themes via composition:

```typescript
import { createTheme, composeThemes } from "@kairoui/theme";

const acmeBase = createTheme({
  name: "acme-base",
  base: "light",
  metadata: { organization: "Acme Corp" },
  overrides: {
    color: {
      interactive: { default: "#e63946" },
    },
  },
});

const dashboardTheme = composeThemes([
  acmeBase,
  {
    name: "acme-dashboard",
    description: "Acme dashboard product theme",
    defaultDensity: "standard",
    metadata: { product: "Dashboard" },
    overrides: {
      color: {
        background: { surface: "#fafbfc" },
      },
    },
  },
]);

// dashboardTheme.definition — merged ThemeDefinition
// dashboardTheme.metadata.chain — ["acme-base", "acme-dashboard"]
```

## Brand Overrides

Override interactive and focus tokens to match your brand:

```typescript
import { createTheme } from "@kairoui/theme";

const brandTheme = createTheme({
  name: "brand",
  base: "light",
  overrides: {
    color: {
      interactive: {
        default: "#7c3aed",
        hover: "#6d28d9",
        active: "#5b21b6",
      },
      focus: {
        ring: "#7c3aed",
      },
      destructive: {
        default: "#dc2626",
        hover: "#b91c1c",
      },
    },
  },
});
```

## Semantic Overrides

Override semantic background and text tokens:

```typescript
import { createTheme } from "@kairoui/theme";

const semanticTheme = createTheme({
  name: "high-contrast",
  base: "light",
  overrides: {
    color: {
      background: {
        default: "#ffffff",
        surface: "#f8f9fa",
        subtle: "#e9ecef",
      },
      text: {
        primary: "#000000",
        secondary: "#212529",
        disabled: "#6c757d",
      },
      border: {
        default: "#212529",
        subtle: "#495057",
      },
    },
  },
});
```

## Component-Token Overrides

Status tokens follow a nested structure:

```typescript
import { createTheme } from "@kairoui/theme";

const statusTheme = createTheme({
  name: "custom-status",
  base: "light",
  overrides: {
    color: {
      status: {
        success: { background: "#d4edda", text: "#155724" },
        warning: { background: "#fff3cd", text: "#856404" },
        error: { background: "#f8d7da", text: "#721c24" },
        info: { background: "#d1ecf1", text: "#0c5460" },
      },
    },
  },
});
```

## Typography Overrides

Override typography tokens to match your brand typeface:

```typescript
import { createTheme } from "@kairoui/theme";

const typographyTheme = createTheme({
  name: "brand-type",
  base: "light",
  overrides: {
    typography: {
      heading: {
        fontFamily: '"Inter", sans-serif',
      },
      body: {
        fontFamily: '"Source Sans Pro", sans-serif',
      },
    },
  },
});
```

## Density Defaults

Set a default density for your theme:

```typescript
import { createTheme } from "@kairoui/theme";

const compactTheme = createTheme({
  name: "data-dense",
  base: "light",
  defaultDensity: "compact",
  description: "Optimized for data-heavy interfaces",
  overrides: {
    color: {
      background: { surface: "#fafbfc" },
    },
  },
});
```

Available densities: `"comfortable"` (default), `"standard"`, `"compact"`.

## Composition

Compose multiple layers into a single theme. Later layers override earlier ones:

```typescript
import { createTheme, composeThemes } from "@kairoui/theme";

const orgLayer = createTheme({
  name: "org-base",
  base: "light",
  overrides: {
    color: {
      interactive: { default: "#0066cc" },
    },
  },
});

const productLayer = {
  name: "analytics",
  defaultDensity: "standard" as const,
  overrides: {
    color: {
      background: { surface: "#f0f4f8" },
    },
  },
};

const featureLayer = {
  name: "analytics-v2",
  description: "Analytics v2 with updated palette",
  overrides: {
    color: {
      interactive: { hover: "#004499" },
    },
  },
};

const result = composeThemes([orgLayer, productLayer, featureLayer]);

// result.definition.name === "analytics-v2" (last layer's name wins)
// result.metadata.chain === ["org-base", "analytics", "analytics-v2"]
// result.metadata.layerCount === 3
// result.errors — any non-fatal warnings (e.g., conflicting bases)
```

All layers must share the same `base` (or omit it to inherit from the first layer that sets one). Conflicting bases produce a composition error.

## Validation

Validate theme input before creating:

```typescript
import { validateTheme } from "@kairoui/theme";

const result = validateTheme({
  name: "",
  base: "light",
  overrides: {
    color: { interactive: { default: "#0066cc" } },
  },
});

if (!result.valid) {
  for (const error of result.errors) {
    console.error(`${error.path}: ${error.message}`);
    // "name: Theme name is required and must be a non-empty string."
  }
}
```

`validateTheme()` never throws — it returns `{ valid: boolean, errors: ThemeValidationError[] }`. Use it for user-facing validation before calling `createTheme()`.

For post-creation validation of definitions:

```typescript
import { createTheme, validateThemeDefinition } from "@kairoui/theme";

const definition = createTheme({ name: "test", base: "light" });

const report = validateThemeDefinition(definition);
// report.valid — boolean
// report.diagnostics — detailed validation messages
// report.errorCount / report.warningCount
```

## Inspection

Inspect themes for debugging without resolving them:

```typescript
import { createTheme, inspectTheme } from "@kairoui/theme";

const theme = createTheme({
  name: "brand",
  base: "light",
  metadata: { version: "1.0.0" },
  overrides: {
    color: {
      interactive: { default: "#0066cc", hover: "#0052a3" },
      focus: { ring: "#0066cc" },
    },
  },
});

const report = inspectTheme(theme);
// report.name === "brand"
// report.base === "light"
// report.defaultDensity === "comfortable"
// report.overrideGroups === ["color"]
// report.overrideCount === 3 (number of leaf values)
// report.metadataKeys === ["version"]
```

For resolved themes:

```typescript
import { createTheme, resolveTheme, inspectResolvedTheme } from "@kairoui/theme";

const theme = createTheme({ name: "brand", base: "light" });
const resolved = await resolveTheme({ definition: theme });

const report = inspectResolvedTheme(resolved);
// report.name === "brand"
// report.base === "light"
// report.density === "comfortable"
// report.tokenCount — total resolved token count
// report.tokenGroups — groups present in resolved tokens
```

## Accessibility Responsibilities

Theme overrides are **not** automatically checked for accessibility. When overriding color tokens:

- Ensure text/background combinations meet WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
- Ensure interactive states (hover, active, focus) remain distinguishable.
- Ensure focus ring colors have sufficient contrast against adjacent backgrounds.
- Test with actual users and assistive technologies.

The `@kairoui/tokens` package includes contrast validation utilities for automated checks during development, but these do not run automatically on custom themes.

## Upgrade Compatibility

When upgrading KairoUI:

- **Override paths are part of the public contract.** Documented override groups (`color`, `typography`, `spacing`, `elevation`) and their subgroups are stable.
- **New tokens may be added** in minor versions. These inherit from the base theme until you override them.
- **Removed tokens** will be listed in release notes. Overrides for removed paths are silently ignored (they don't cause errors).
- **Use `validateThemeDefinition()`** after upgrades to check for warnings about deprecated or unknown paths.

## Deprecation Handling

When tokens are deprecated:

```typescript
import { createTheme, validateThemeDefinition } from "@kairoui/theme";

const theme = createTheme({ name: "brand", base: "light", overrides: {/* ... */} });
const report = validateThemeDefinition(theme);

for (const diag of report.diagnostics) {
  if (diag.category === "deprecated") {
    console.warn(`${diag.path}: ${diag.message}`);
    if (diag.suggestion) {
      console.warn(`  → ${diag.suggestion}`);
    }
  }
}
```

## Stable Public Contracts

The following are stable across minor versions:

| Contract                    | Stability |
| --------------------------- | --------- |
| `createTheme()` signature   | Stable    |
| `composeThemes()` signature | Stable    |
| `validateTheme()` signature | Stable    |
| `inspectTheme()` signature  | Stable    |
| `ThemeDefinition` shape     | Stable    |
| `ThemeOverrides` groups     | Stable    |
| Override subgroup keys      | Stable    |
| `metadata` field            | Stable    |
| `CompositionResult` shape   | Stable    |

Override **values** (the actual CSS strings) are your responsibility — KairoUI does not validate color formats or typography values beyond type checking.
