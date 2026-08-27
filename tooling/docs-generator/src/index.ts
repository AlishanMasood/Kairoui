export type {
  PropMeta,
  ImportMeta,
  SourceMeta,
  ComponentMeta,
  CompoundComponentMeta,
  PackageDocMeta,
  GeneratorOutput,
} from "./schema";
export {
  SCHEMA_VERSION,
  validatePropMeta,
  validateComponentMeta,
  validateGeneratorOutput,
} from "./schema";

export {
  getDescription,
  isDeprecated,
  getDeprecationMessage,
  getSinceTag,
  getDefaultTag,
  normalizeDescription,
  diagnoseSymbol,
} from "./jsdoc";
export type { JsDocDiagnostic } from "./jsdoc";

export {
  extractDefaultsFromSource,
  extractDefaultsFromComponentDir,
  mergeDefaultsIntoPropMeta,
} from "./defaults";
export type { DefaultValueResult } from "./defaults";

export {
  getCompoundRoot,
  groupCompoundComponents,
  getCompoundPartNames,
  isCompoundPart,
} from "./compound";

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
