import type { ComponentMeta, PackageDocMeta, GeneratorOutput } from "./schema";

/**
 * Normalizes extracted component metadata into the output schema.
 * Stub — full implementation in KUI-DOCGEN-006.
 */
export function normalizeComponents(
  components: readonly ComponentMeta[],
  packageName: string,
  entryPoint: string,
): PackageDocMeta {
  return {
    packageName,
    entryPoint,
    components,
  };
}

/**
 * Creates the full generator output wrapper.
 */
export function createGeneratorOutput(packages: readonly PackageDocMeta[]): GeneratorOutput {
  return {
    generatedAt: new Date().toISOString(),
    generatorVersion: "0.1.0",
    packages,
  };
}
