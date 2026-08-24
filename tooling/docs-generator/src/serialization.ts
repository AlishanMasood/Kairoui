import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { GeneratorOutput } from "./schema";

/**
 * Writes generator output to a JSON file.
 */
export function writeMetadata(output: GeneratorOutput, filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(output, null, 2) + "\n", "utf-8");
}
