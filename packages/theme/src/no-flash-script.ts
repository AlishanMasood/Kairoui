// ─── Types ───────────────────────────────────────────────────────────

/** Options for generating the no-flash initialization script. */
export interface NoFlashScriptOptions {
  readonly storageKey?: string;
  readonly defaultMode?: "light" | "dark";
  readonly defaultDensity?: "comfortable" | "standard" | "compact";
  readonly themeAttribute?: string;
  readonly densityAttribute?: string;
}

// ─── Defaults ────────────────────────────────────────────────────────

const DEFAULT_STORAGE_KEY = "kui-theme-preference";
const DEFAULT_MODE = "light";
const DEFAULT_DENSITY = "comfortable";
const DEFAULT_THEME_ATTR = "data-kui-theme";
const DEFAULT_DENSITY_ATTR = "data-kui-density";

// ─── Script Generator ────────────────────────────────────────────────

/**
 * Generate the no-flash initialization script as a string.
 *
 * This script:
 * - Reads the persisted theme preference from localStorage
 * - Resolves "system" mode via matchMedia
 * - Sets data-kui-theme and data-kui-density on document.documentElement
 * - Handles all errors silently (storage exceptions, missing APIs)
 * - Is safe for inline injection in <head>
 *
 * The output is a self-executing function with no external dependencies.
 * It should be placed after CSS <link> tags but before the main bundle.
 */
export function getNoFlashScript(options: NoFlashScriptOptions = {}): string {
  const key = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const defaultMode = options.defaultMode ?? DEFAULT_MODE;
  const defaultDensity = options.defaultDensity ?? DEFAULT_DENSITY;
  const themeAttr = options.themeAttribute ?? DEFAULT_THEME_ATTR;
  const densityAttr = options.densityAttribute ?? DEFAULT_DENSITY_ATTR;

  // The script is a minified IIFE — no eval, no network, no framework deps
  return `(function(){try{var r=${JSON.stringify(defaultMode)};var de=${JSON.stringify(defaultDensity)};try{var s=localStorage.getItem(${JSON.stringify(key)});if(s){var p=JSON.parse(s);if(p&&p.version===1){var m=p.mode;var d=p.density;if(m==="light"||m==="dark"){r=m}else if(m==="system"){try{r=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){}}if(d==="comfortable"||d==="standard"||d==="compact"){de=d}}}}catch(e){try{r=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){}}document.documentElement.setAttribute(${JSON.stringify(themeAttr)},r);document.documentElement.setAttribute(${JSON.stringify(densityAttr)},de)}catch(e){}})()`;
}

/**
 * Generate a formatted (readable) version of the no-flash script.
 * Useful for debugging and documentation.
 */
export function getNoFlashScriptReadable(options: NoFlashScriptOptions = {}): string {
  const key = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const defaultMode = options.defaultMode ?? DEFAULT_MODE;
  const defaultDensity = options.defaultDensity ?? DEFAULT_DENSITY;
  const themeAttr = options.themeAttribute ?? DEFAULT_THEME_ATTR;
  const densityAttr = options.densityAttribute ?? DEFAULT_DENSITY_ATTR;

  return `(function() {
  try {
    var r = ${JSON.stringify(defaultMode)};
    var de = ${JSON.stringify(defaultDensity)};

    try {
      var s = localStorage.getItem(${JSON.stringify(key)});
      if (s) {
        var p = JSON.parse(s);
        if (p && p.version === 1) {
          var m = p.mode;
          var d = p.density;
          if (m === "light" || m === "dark") {
            r = m;
          } else if (m === "system") {
            try {
              r = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            } catch(e) {}
          }
          if (d === "comfortable" || d === "standard" || d === "compact") {
            de = d;
          }
        }
      }
    } catch(e) {
      try {
        r = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } catch(e) {}
    }

    document.documentElement.setAttribute(${JSON.stringify(themeAttr)}, r);
    document.documentElement.setAttribute(${JSON.stringify(densityAttr)}, de);
  } catch(e) {}
})();`;
}
