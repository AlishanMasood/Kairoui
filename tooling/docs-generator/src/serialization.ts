import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ComponentMeta, GeneratorOutput } from "./schema";

/**
 * Writes generator output to a JSON file.
 */
export function writeMetadata(output: GeneratorOutput, filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(output, null, 2) + "\n", "utf-8");
}

/**
 * Writes one JSON file per component so downstream bundlers can code-split
 * documentation pages by component instead of shipping the aggregate.
 */
export function writePerComponentMetadata(
  output: GeneratorOutput,
  componentsDir: string,
): { count: number; totalBytes: number } {
  mkdirSync(componentsDir, { recursive: true });

  let count = 0;
  let totalBytes = 0;
  for (const pkg of output.packages) {
    for (const comp of pkg.components) {
      const json = componentToJson(comp);
      const filePath = resolve(componentsDir, `${comp.name}.json`);
      writeFileSync(filePath, json, "utf-8");
      count += 1;
      totalBytes += Buffer.byteLength(json, "utf-8");
    }
  }

  const manifest = {
    schemaVersion: output.schemaVersion,
    generatedAt: output.generatedAt,
    components: output.packages.flatMap((p) => p.components.map((c) => c.name)).sort(),
  };
  writeFileSync(
    resolve(componentsDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8",
  );

  return { count, totalBytes };
}

function componentToJson(comp: ComponentMeta): string {
  return JSON.stringify(comp) + "\n";
}
