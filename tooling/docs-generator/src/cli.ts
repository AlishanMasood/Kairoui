import { resolve } from "node:path";
import { createGeneratorOutput } from "./normalization";
import { writeMetadata } from "./serialization";

const args = process.argv.slice(2);
const outputIdx = args.indexOf("--output");
const outputDir =
  outputIdx >= 0 && args[outputIdx + 1]
    ? args[outputIdx + 1]
    : resolve(import.meta.dirname, "../generated");

console.log("[docs-generator] Starting metadata generation...");
console.log(`[docs-generator] Output: ${outputDir}`);

// Placeholder — full pipeline assembled in KUI-DOCGEN-007
const output = createGeneratorOutput([]);
writeMetadata(output, resolve(outputDir, "api-metadata.json"));

console.log("[docs-generator] Done. Generated api-metadata.json");
