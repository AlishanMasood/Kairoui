/**
 * Metadata schema for automated API documentation.
 *
 * Flow: TypeScript source → tooling/docs-generator → metadata JSON
 *       → @kairoui/docs (PropsTable, ApiReference) → apps/docs (Docusaurus MDX)
 *
 * This schema is the contract between the generator and the renderer.
 * It is framework-agnostic — no React, no Docusaurus coupling.
 *
 * Schema version: 1
 */

export const SCHEMA_VERSION = 1;

// ─── Prop Metadata ──────────────────────────────────────────────────

export interface PropMeta {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly defaultValue: string | undefined;
  readonly description: string | undefined;
  readonly deprecated: boolean;
  readonly deprecationMessage: string | undefined;
  readonly since: string | undefined;
}

// ─── Import Metadata ────────────────────────────────────────────────

export interface ImportMeta {
  readonly packagePath: string;
  readonly namedExports: readonly string[];
}

// ─── Source Metadata ────────────────────────────────────────────────

export interface SourceMeta {
  readonly filePath: string | undefined;
  readonly propsInterface: string;
}

// ─── Component Metadata ─────────────────────────────────────────────

export interface ComponentMeta {
  readonly name: string;
  readonly packagePath: string;
  readonly propsInterface: string;
  readonly props: readonly PropMeta[];
  readonly description: string | undefined;
  readonly sourceFile: string | undefined;
  readonly since: string | undefined;
  readonly import: ImportMeta;
  readonly source: SourceMeta;
}

// ─── Compound Component Group ───────────────────────────────────────

export interface CompoundComponentMeta {
  readonly name: string;
  readonly packagePath: string;
  readonly parts: readonly ComponentMeta[];
}

// ─── Package Documentation ──────────────────────────────────────────

export interface PackageDocMeta {
  readonly packageName: string;
  readonly entryPoint: string;
  readonly components: readonly ComponentMeta[];
}

// ─── Generation Output ──────────────────────────────────────────────

export interface GeneratorOutput {
  readonly schemaVersion: number;
  readonly generatedAt: string;
  readonly generatorVersion: string;
  readonly packages: readonly PackageDocMeta[];
}

// ─── Schema Validation ──────────────────────────────────────────────

export function validatePropMeta(prop: unknown): prop is PropMeta {
  if (typeof prop !== "object" || prop === null) return false;
  const p = prop as Record<string, unknown>;
  return (
    typeof p["name"] === "string" &&
    typeof p["type"] === "string" &&
    typeof p["required"] === "boolean" &&
    typeof p["deprecated"] === "boolean"
  );
}

export function validateComponentMeta(comp: unknown): comp is ComponentMeta {
  if (typeof comp !== "object" || comp === null) return false;
  const c = comp as Record<string, unknown>;
  return (
    typeof c["name"] === "string" &&
    typeof c["packagePath"] === "string" &&
    typeof c["propsInterface"] === "string" &&
    Array.isArray(c["props"]) &&
    (c["props"] as unknown[]).every(validatePropMeta) &&
    typeof c["import"] === "object" &&
    typeof c["source"] === "object"
  );
}

export function validateGeneratorOutput(output: unknown): output is GeneratorOutput {
  if (typeof output !== "object" || output === null) return false;
  const o = output as Record<string, unknown>;
  return (
    typeof o["schemaVersion"] === "number" &&
    typeof o["generatedAt"] === "string" &&
    typeof o["generatorVersion"] === "string" &&
    Array.isArray(o["packages"])
  );
}
