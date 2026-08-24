/**
 * Metadata schema for automated API documentation.
 *
 * Flow: TypeScript source → tooling/docs-generator → metadata JSON
 *       → @kairoui/docs (PropsTable, ApiReference) → apps/docs (Docusaurus MDX)
 *
 * This schema is the contract between the generator and the renderer.
 * It is framework-agnostic — no React, no Docusaurus coupling.
 */

// ─── Prop Metadata ──────────────────────────────────────────────────

export interface PropMeta {
  /** Property name. */
  readonly name: string;
  /** Human-readable type string (e.g. "string", "'sm' | 'md' | 'lg'"). */
  readonly type: string;
  /** Whether the prop is required (non-optional). */
  readonly required: boolean;
  /** Default value as a string, if detected. */
  readonly defaultValue: string | undefined;
  /** JSDoc description, if present. */
  readonly description: string | undefined;
  /** Whether the prop is marked @deprecated. */
  readonly deprecated: boolean;
}

// ─── Component Metadata ─────────────────────────────────────────────

export interface ComponentMeta {
  /** Component display name (e.g. "Button", "TabsTrigger"). */
  readonly name: string;
  /** Package import path (e.g. "@kairoui/core/components"). */
  readonly packagePath: string;
  /** Props interface name (e.g. "ButtonOwnProps"). */
  readonly propsInterface: string;
  /** Extracted prop metadata. */
  readonly props: readonly PropMeta[];
  /** JSDoc description of the component or its props interface. */
  readonly description: string | undefined;
  /** Source file path relative to the package root. */
  readonly sourceFile: string | undefined;
}

// ─── Compound Component Group ───────────────────────────────────────

export interface CompoundComponentMeta {
  /** Root component name (e.g. "Tabs", "DataTable"). */
  readonly name: string;
  /** Package import path. */
  readonly packagePath: string;
  /** All parts of the compound component. */
  readonly parts: readonly ComponentMeta[];
}

// ─── Package Documentation ──────────────────────────────────────────

export interface PackageDocMeta {
  /** Package name (e.g. "@kairoui/core"). */
  readonly packageName: string;
  /** Entry point (e.g. "./components"). */
  readonly entryPoint: string;
  /** All documented components. */
  readonly components: readonly ComponentMeta[];
}

// ─── Generation Output ──────────────────────────────────────────────

export interface GeneratorOutput {
  /** ISO timestamp of generation. */
  readonly generatedAt: string;
  /** Generator version. */
  readonly generatorVersion: string;
  /** All package documentation. */
  readonly packages: readonly PackageDocMeta[];
}
