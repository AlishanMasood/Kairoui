import type { ComponentMeta, PackageDocMeta, GeneratorOutput } from "./schema";
import { SCHEMA_VERSION } from "./schema";

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

export function createGeneratorOutput(packages: readonly PackageDocMeta[]): GeneratorOutput {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    generatorVersion: "0.1.0",
    packages,
  };
}
