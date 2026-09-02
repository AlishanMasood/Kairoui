import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentMeta, GeneratorOutput, PackageDocMeta, PropMeta } from "./schema";
import { SCHEMA_VERSION } from "./schema";

export type DiagnosticSeverity = "error" | "warning";

export interface ValidationDiagnostic {
  readonly severity: DiagnosticSeverity;
  readonly code: string;
  readonly message: string;
  readonly location: string;
  readonly hint?: string;
}

export interface ValidationResult {
  readonly diagnostics: readonly ValidationDiagnostic[];
  readonly errorCount: number;
  readonly warningCount: number;
  readonly ok: boolean;
}

export interface ValidationOptions {
  readonly monorepoRoot?: string;
  readonly discoveredComponents?: readonly string[];
  readonly requireSourceFiles?: boolean;
}

// ─── Diagnostic codes ───────────────────────────────────────────────

export const DIAG_CODES = {
  SCHEMA_VERSION_MISMATCH: "DOC001",
  MISSING_METADATA: "DOC002",
  INVALID_PACKAGE_PATH: "DOC003",
  UNRESOLVED_TYPE: "DOC004",
  DEFAULT_TYPE_MISMATCH: "DOC005",
  DEPRECATED_INCONSISTENT: "DOC006",
  COMPOUND_ORPHAN_PART: "DOC007",
  SLOT_INVALID: "DOC008",
  SOURCE_LINK_BROKEN: "DOC009",
  STALE_METADATA: "DOC010",
  DUPLICATE_COMPONENT: "DOC011",
  EMPTY_PROPS_INTERFACE: "DOC012",
  MISSING_DESCRIPTION: "DOC013",
} as const;

// ─── Formatting ─────────────────────────────────────────────────────

export function formatDiagnostic(d: ValidationDiagnostic): string {
  const prefix = d.severity === "error" ? "ERROR" : "WARN ";
  const parts = [`[${prefix}] ${d.code} ${d.location}: ${d.message}`];
  if (d.hint) parts.push(`  hint: ${d.hint}`);
  return parts.join("\n");
}

export function formatReport(result: ValidationResult): string {
  if (result.diagnostics.length === 0) {
    return "[docs-generator] Validation passed: no diagnostics.";
  }
  const lines = result.diagnostics.map(formatDiagnostic);
  lines.push(
    `\n[docs-generator] ${String(result.errorCount)} error(s), ${String(result.warningCount)} warning(s).`,
  );
  return lines.join("\n");
}

// ─── Individual validators ──────────────────────────────────────────

const KNOWN_PACKAGE_PREFIX = "@kairoui/";

function validateSchemaVersion(output: GeneratorOutput, diags: ValidationDiagnostic[]): void {
  if (output.schemaVersion !== SCHEMA_VERSION) {
    diags.push({
      severity: "error",
      code: DIAG_CODES.SCHEMA_VERSION_MISMATCH,
      message: `Schema version ${String(output.schemaVersion)} does not match expected ${String(SCHEMA_VERSION)}.`,
      location: "output",
      hint: "Re-run pnpm generate:docs to regenerate metadata with the current schema.",
    });
  }
}

function validatePackagePath(
  comp: ComponentMeta,
  pkg: PackageDocMeta,
  diags: ValidationDiagnostic[],
): void {
  if (!comp.packagePath.startsWith(KNOWN_PACKAGE_PREFIX)) {
    diags.push({
      severity: "error",
      code: DIAG_CODES.INVALID_PACKAGE_PATH,
      message: `Component "${comp.name}" has invalid packagePath "${comp.packagePath}".`,
      location: `${pkg.packageName}/${comp.name}`,
      hint: `Expected a path starting with "${KNOWN_PACKAGE_PREFIX}".`,
    });
  }
  if (!comp.packagePath.startsWith(pkg.packageName)) {
    diags.push({
      severity: "error",
      code: DIAG_CODES.INVALID_PACKAGE_PATH,
      message: `Component "${comp.name}" packagePath "${comp.packagePath}" does not match its package "${pkg.packageName}".`,
      location: `${pkg.packageName}/${comp.name}`,
    });
  }
  if (comp.import.packagePath !== comp.packagePath) {
    diags.push({
      severity: "error",
      code: DIAG_CODES.INVALID_PACKAGE_PATH,
      message: `Component "${comp.name}" import.packagePath "${comp.import.packagePath}" differs from component packagePath "${comp.packagePath}".`,
      location: `${pkg.packageName}/${comp.name}`,
    });
  }
  if (comp.import.namedExports.length === 0 || !comp.import.namedExports.includes(comp.name)) {
    diags.push({
      severity: "error",
      code: DIAG_CODES.INVALID_PACKAGE_PATH,
      message: `Component "${comp.name}" is missing itself from import.namedExports.`,
      location: `${pkg.packageName}/${comp.name}`,
    });
  }
}

const UNRESOLVED_TYPE_PATTERNS: readonly RegExp[] = [
  // Match `any` or `never` or `unknown` as standalone types, not inside
  // generic type arguments (e.g., `JSXElementConstructor<any>` is allowed).
  /(^|[|&\s(])any([|&\s)]|$)/,
  /(^|[|&\s(])never([|&\s)]|$)/,
  /(^|[|&\s(])unknown([|&\s)]|$)/,
];

function validatePropTypes(
  comp: ComponentMeta,
  pkgName: string,
  diags: ValidationDiagnostic[],
): void {
  for (const prop of comp.props) {
    if (prop.type.trim() === "") {
      diags.push({
        severity: "error",
        code: DIAG_CODES.UNRESOLVED_TYPE,
        message: `Prop "${prop.name}" has an empty type string.`,
        location: `${pkgName}/${comp.name}.${prop.name}`,
        hint: "The TypeScript checker failed to resolve this type. Ensure the props interface is exported.",
      });
      continue;
    }
    for (const pattern of UNRESOLVED_TYPE_PATTERNS) {
      if (pattern.test(prop.type)) {
        diags.push({
          severity: "warning",
          code: DIAG_CODES.UNRESOLVED_TYPE,
          message: `Prop "${prop.name}" resolved to a permissive type: ${prop.type}`,
          location: `${pkgName}/${comp.name}.${prop.name}`,
          hint: "Consider narrowing the prop type in the source interface.",
        });
        break;
      }
    }
  }
}

function isValidLiteralDefault(defaultValue: string, type: string): boolean {
  const trimmed = defaultValue.trim();
  const stripped = type.replace(/^undefined \|\s*/, "");
  if (/^(true|false)$/.test(trimmed) && /\b(boolean|true|false)\b/.test(stripped)) {
    return true;
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed) && /\bnumber\b/.test(stripped)) {
    return true;
  }
  if (/^".*"$/.test(trimmed) || /^'.*'$/.test(trimmed)) {
    return /\bstring\b/.test(stripped) || stripped.includes(trimmed);
  }
  return true;
}

function validatePropDefaults(
  comp: ComponentMeta,
  pkgName: string,
  diags: ValidationDiagnostic[],
): void {
  for (const prop of comp.props) {
    if (prop.defaultValue === undefined) continue;
    if (prop.required) {
      diags.push({
        severity: "warning",
        code: DIAG_CODES.DEFAULT_TYPE_MISMATCH,
        message: `Prop "${prop.name}" is required but has a default value (${prop.defaultValue}).`,
        location: `${pkgName}/${comp.name}.${prop.name}`,
        hint: "Required props should not declare defaults; make the prop optional or drop the default.",
      });
    }
    if (!isValidLiteralDefault(prop.defaultValue, prop.type)) {
      diags.push({
        severity: "warning",
        code: DIAG_CODES.DEFAULT_TYPE_MISMATCH,
        message: `Prop "${prop.name}" default (${prop.defaultValue}) may not match its declared type (${prop.type}).`,
        location: `${pkgName}/${comp.name}.${prop.name}`,
      });
    }
  }
}

function validateDeprecatedProps(
  comp: ComponentMeta,
  pkgName: string,
  diags: ValidationDiagnostic[],
): void {
  for (const prop of comp.props) {
    if (prop.deprecationMessage && !prop.deprecated) {
      diags.push({
        severity: "error",
        code: DIAG_CODES.DEPRECATED_INCONSISTENT,
        message: `Prop "${prop.name}" has deprecationMessage but deprecated=false.`,
        location: `${pkgName}/${comp.name}.${prop.name}`,
        hint: "A @deprecated JSDoc tag should set deprecated=true.",
      });
    }
    if (prop.deprecated && prop.required) {
      diags.push({
        severity: "warning",
        code: DIAG_CODES.DEPRECATED_INCONSISTENT,
        message: `Prop "${prop.name}" is required but marked deprecated.`,
        location: `${pkgName}/${comp.name}.${prop.name}`,
        hint: "Deprecated props should typically be optional so consumers can drop them.",
      });
    }
  }
}

const COMPOUND_PART_SUFFIXES = [
  "Root",
  "Trigger",
  "Content",
  "Item",
  "List",
  "Group",
  "Label",
  "Separator",
  "Portal",
  "Backdrop",
  "Close",
  "Title",
  "Description",
  "Header",
  "Footer",
  "Action",
  "Cancel",
  "Anchor",
  "Arrow",
  "Icon",
  "Indicator",
  "Track",
  "Thumb",
  "Range",
  "Menu",
  "Link",
  "Viewport",
  "Body",
  "Cell",
  "Row",
  "Caption",
  "Provider",
  "Ellipsis",
  "Next",
  "Previous",
  "Details",
  "Term",
  "Time",
  "Connector",
  "Actions",
  "Sidebar",
  "Aside",
  "Main",
  "ItemContent",
  "ItemTrigger",
];

function inferCompoundRoot(name: string): string | undefined {
  const sorted = [...COMPOUND_PART_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sorted) {
    if (name.length > suffix.length && name.endsWith(suffix)) {
      return name.slice(0, name.length - suffix.length);
    }
  }
  return undefined;
}

function validateCompoundParts(output: GeneratorOutput, diags: ValidationDiagnostic[]): void {
  const allNames = new Set<string>();
  for (const pkg of output.packages) {
    for (const comp of pkg.components) allNames.add(comp.name);
  }
  for (const pkg of output.packages) {
    for (const comp of pkg.components) {
      const root = inferCompoundRoot(comp.name);
      if (root && !allNames.has(root)) {
        diags.push({
          severity: "warning",
          code: DIAG_CODES.COMPOUND_ORPHAN_PART,
          message: `Compound part "${comp.name}" references non-exported root "${root}".`,
          location: `${pkg.packageName}/${comp.name}`,
          hint: "Either export the root component or rename this part.",
        });
      }
    }
  }
}

function validateSourceLinks(
  output: GeneratorOutput,
  monorepoRoot: string,
  diags: ValidationDiagnostic[],
): void {
  for (const pkg of output.packages) {
    for (const comp of pkg.components) {
      if (!comp.sourceFile) continue;
      const abs = resolve(monorepoRoot, comp.sourceFile);
      if (!existsSync(abs)) {
        diags.push({
          severity: "error",
          code: DIAG_CODES.SOURCE_LINK_BROKEN,
          message: `Component "${comp.name}" sourceFile "${comp.sourceFile}" does not exist.`,
          location: `${pkg.packageName}/${comp.name}`,
        });
      }
    }
  }
}

function validateComponentIdentity(output: GeneratorOutput, diags: ValidationDiagnostic[]): void {
  const seen = new Map<string, string>();
  for (const pkg of output.packages) {
    for (const comp of pkg.components) {
      const key = `${comp.packagePath}::${comp.name}`;
      const previous = seen.get(key);
      if (previous) {
        diags.push({
          severity: "error",
          code: DIAG_CODES.DUPLICATE_COMPONENT,
          message: `Component "${comp.name}" appears more than once under ${comp.packagePath}.`,
          location: `${pkg.packageName}/${comp.name}`,
        });
      } else {
        seen.set(key, pkg.packageName);
      }
      if (!comp.propsInterface || comp.propsInterface.trim() === "") {
        diags.push({
          severity: "error",
          code: DIAG_CODES.EMPTY_PROPS_INTERFACE,
          message: `Component "${comp.name}" has an empty propsInterface.`,
          location: `${pkg.packageName}/${comp.name}`,
        });
      }
    }
  }
}

function validateDiscoveredCoverage(
  output: GeneratorOutput,
  discovered: readonly string[],
  diags: ValidationDiagnostic[],
): void {
  const documented = new Set<string>();
  for (const pkg of output.packages) {
    for (const comp of pkg.components) documented.add(comp.name);
  }
  const missing = discovered.filter((name) => !documented.has(name));
  for (const name of missing) {
    diags.push({
      severity: "warning",
      code: DIAG_CODES.MISSING_METADATA,
      message: `Exported component "${name}" has no generated metadata.`,
      location: name,
      hint: "Ensure the component has a props interface named <Component>OwnProps, <Component>RootProps, or <Component>Props.",
    });
  }
}

function validateNoDescription(
  comp: ComponentMeta,
  pkg: PackageDocMeta,
  diags: ValidationDiagnostic[],
): void {
  // Compound parts typically share JSDoc context with their root — don't warn.
  if (inferCompoundRoot(comp.name)) return;

  const hasComponentDoc = comp.description && comp.description.trim().length > 0;
  const propsWithDocs = comp.props.filter(
    (p: PropMeta) => p.description && p.description.trim().length > 0,
  ).length;
  if (!hasComponentDoc && comp.props.length > 0 && propsWithDocs === 0) {
    diags.push({
      severity: "warning",
      code: DIAG_CODES.MISSING_DESCRIPTION,
      message: `Component "${comp.name}" has no JSDoc description and none of its ${String(comp.props.length)} props are documented.`,
      location: `${pkg.packageName}/${comp.name}`,
      hint: "Add a JSDoc block to the component or its props for better documentation.",
    });
  }
}

// ─── Staleness check ────────────────────────────────────────────────

export function isStaleAgainst(current: GeneratorOutput, regenerated: GeneratorOutput): boolean {
  const stripTimestamps = (o: GeneratorOutput): unknown => {
    const clone = JSON.parse(JSON.stringify(o)) as Record<string, unknown>;
    delete clone["generatedAt"];
    return clone;
  };
  return JSON.stringify(stripTimestamps(current)) !== JSON.stringify(stripTimestamps(regenerated));
}

// ─── Public API ─────────────────────────────────────────────────────

export function validateMetadata(
  output: GeneratorOutput,
  options: ValidationOptions = {},
): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];

  validateSchemaVersion(output, diagnostics);
  validateComponentIdentity(output, diagnostics);

  for (const pkg of output.packages) {
    for (const comp of pkg.components) {
      validatePackagePath(comp, pkg, diagnostics);
      validatePropTypes(comp, pkg.packageName, diagnostics);
      validatePropDefaults(comp, pkg.packageName, diagnostics);
      validateDeprecatedProps(comp, pkg.packageName, diagnostics);
      validateNoDescription(comp, pkg, diagnostics);
    }
  }

  validateCompoundParts(output, diagnostics);

  if (options.requireSourceFiles && options.monorepoRoot) {
    validateSourceLinks(output, options.monorepoRoot, diagnostics);
  }

  if (options.discoveredComponents) {
    validateDiscoveredCoverage(output, options.discoveredComponents, diagnostics);
  }

  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warningCount = diagnostics.filter((d) => d.severity === "warning").length;

  return {
    diagnostics,
    errorCount,
    warningCount,
    ok: errorCount === 0,
  };
}

export function validateMetadataFile(
  filePath: string,
  options: ValidationOptions = {},
): ValidationResult {
  const content = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(content) as GeneratorOutput;
  return validateMetadata(parsed, options);
}
