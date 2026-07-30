import type { DensityMode, ResolvedThemeMode, ThemeDefinition, ThemeOverrides } from "./types";

/** A single layer in a theme composition chain. */
export interface CompositionLayer {
  readonly name: string;
  readonly base?: ResolvedThemeMode;
  readonly description?: string;
  readonly defaultDensity?: DensityMode;
  readonly overrides?: ThemeOverrides;
  readonly metadata?: Readonly<Record<string, string>>;
}

/** Metadata describing how a composed theme was assembled. */
export interface CompositionMetadata {
  readonly chain: readonly string[];
  readonly base: ResolvedThemeMode;
  readonly density: DensityMode;
  readonly layerCount: number;
}

/** Error from theme composition. */
export interface CompositionError {
  readonly path: string;
  readonly message: string;
}

/** Result of composing themes. */
export interface CompositionResult {
  readonly definition: ThemeDefinition;
  readonly metadata: CompositionMetadata;
  readonly errors: readonly CompositionError[];
}

function deepMergeOverrides(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (
      typeof sv === "object" &&
      sv !== null &&
      !Array.isArray(sv) &&
      typeof tv === "object" &&
      tv !== null &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMergeOverrides(
        tv as Record<string, unknown>,
        sv as Record<string, unknown>,
      );
    } else if (sv !== undefined) {
      result[key] = sv;
    }
  }
  return result;
}

function mergeOverrideGroups(base: ThemeOverrides, layer: ThemeOverrides): ThemeOverrides {
  const baseRec = base as unknown as Record<string, unknown>;
  const layerRec = layer as unknown as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...baseRec };
  for (const key of Object.keys(layerRec)) {
    const baseGroup = baseRec[key];
    const layerGroup = layerRec[key];
    if (
      typeof baseGroup === "object" &&
      baseGroup !== null &&
      typeof layerGroup === "object" &&
      layerGroup !== null
    ) {
      merged[key] = deepMergeOverrides(
        baseGroup as Record<string, unknown>,
        layerGroup as Record<string, unknown>,
      );
    } else if (layerGroup !== undefined) {
      merged[key] = layerGroup;
    }
  }
  return merged;
}

function deepFreeze<T extends object>(obj: T): Readonly<T> {
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  }
  return Object.freeze(obj);
}

/**
 * Compose multiple theme layers into a single ThemeDefinition.
 *
 * Layers are applied in order — later layers override earlier ones.
 * The final result uses the last layer's name and the resolved base/density
 * from the composition chain.
 *
 * @throws Error when layers array is empty.
 */
export function composeThemes(layers: readonly CompositionLayer[]): CompositionResult {
  if (layers.length === 0) {
    throw new Error("composeThemes requires at least one layer.");
  }

  const errors: CompositionError[] = [];
  const chain: string[] = [];

  let resolvedBase: ResolvedThemeMode | undefined;
  let resolvedDensity: DensityMode | undefined;
  let mergedOverrides: ThemeOverrides = {};
  let mergedMetadata: Record<string, string> = {};
  let finalName = "";
  let finalDescription = "";

  for (const layer of layers) {
    chain.push(layer.name);

    // Base resolution: first layer sets the base, subsequent layers must match or omit
    if (layer.base !== undefined) {
      if (resolvedBase !== undefined && layer.base !== resolvedBase) {
        errors.push({
          path: `layer(${layer.name}).base`,
          message: `Conflicting base "${layer.base}" — composition already uses "${resolvedBase}".`,
        });
      } else {
        resolvedBase = layer.base;
      }
    }

    // Density: later layers override
    if (layer.defaultDensity !== undefined) {
      resolvedDensity = layer.defaultDensity;
    }

    // Overrides: deep merge in order
    if (layer.overrides) {
      mergedOverrides = mergeOverrideGroups(mergedOverrides, layer.overrides);
    }

    // Metadata: later keys override earlier
    if (layer.metadata) {
      mergedMetadata = { ...mergedMetadata, ...layer.metadata };
    }

    // Name and description: last layer wins
    finalName = layer.name;
    if (layer.description !== undefined) {
      finalDescription = layer.description;
    }
  }

  // Default base if none provided
  if (resolvedBase === undefined) {
    errors.push({
      path: "base",
      message: 'No layer specified a base theme. Defaulting to "light".',
    });
    resolvedBase = "light";
  }

  const definition: ThemeDefinition = deepFreeze({
    name: finalName,
    base: resolvedBase,
    description: finalDescription,
    defaultDensity: resolvedDensity ?? "comfortable",
    overrides: mergedOverrides,
    metadata: mergedMetadata,
  });

  const metadata: CompositionMetadata = {
    chain,
    base: resolvedBase,
    density: definition.defaultDensity,
    layerCount: layers.length,
  };

  return { definition, metadata, errors };
}
