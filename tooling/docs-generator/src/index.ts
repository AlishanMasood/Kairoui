export type {
  PropMeta,
  ComponentMeta,
  CompoundComponentMeta,
  PackageDocMeta,
  GeneratorOutput,
} from "./schema";

export { createProgramFromConfig, createProgramFromFiles, findExportedSymbols } from "./discovery";
export { extractPropsFromSymbol } from "./extraction";
export { typeToString } from "./type-stringifier";
export {
  extractPropsFromType,
  extractComponentMeta,
  findPropsInterface,
  stringifyType,
} from "./extractor";
export { normalizeComponents, createGeneratorOutput } from "./normalization";
export { writeMetadata } from "./serialization";
export {
  discoverPackages,
  discoverExportsFromDts,
  classifyExport,
  runDiscovery,
} from "./package-discovery";
export type {
  PackageInfo,
  EntryPointInfo,
  DiscoveredExport,
  DiscoveryManifest,
  DiscoveryConfig,
} from "./package-discovery";
