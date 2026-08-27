import ts from "typescript";
import { resolve } from "node:path";

/**
 * Creates a TypeScript Program from a tsconfig file.
 */
export function createProgramFromConfig(tsconfigPath: string): {
  program: ts.Program;
  checker: ts.TypeChecker;
} {
  const configFile = ts.readConfigFile(tsconfigPath, (path) => ts.sys.readFile(path));
  if (configFile.error) {
    throw new Error(
      `Failed to read tsconfig: ${ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n")}`,
    );
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config as Record<string, unknown>,
    ts.sys,
    resolve(tsconfigPath, ".."),
  );

  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();

  return { program, checker };
}

/**
 * Creates a TypeScript Program from specific .d.ts files.
 */
export function createProgramFromFiles(filePaths: string[]): {
  program: ts.Program;
  checker: ts.TypeChecker;
} {
  const program = ts.createProgram(filePaths, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    declaration: true,
    strict: true,
    skipLibCheck: true,
    jsx: ts.JsxEmit.ReactJSX,
  });
  const checker = program.getTypeChecker();
  return { program, checker };
}

/**
 * Finds all exported symbols from a source file that match a name pattern.
 */
export function findExportedSymbols(
  program: ts.Program,
  checker: ts.TypeChecker,
  sourceFilePath: string,
  namePattern?: RegExp,
): ts.Symbol[] {
  const sourceFile = program.getSourceFile(sourceFilePath);
  if (!sourceFile) return [];

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) return [];

  const exports = checker.getExportsOfModule(moduleSymbol);
  if (!namePattern) return exports;

  return exports.filter((sym) => namePattern.test(sym.getName()));
}
