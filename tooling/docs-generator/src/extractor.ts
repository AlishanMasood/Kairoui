import ts from "typescript";
import type { PropMeta, ComponentMeta } from "./schema";

// ─── Inherited HTML prop filtering ──────────────────────────────────

const HTML_ATTR_BASES = new Set([
  "HTMLAttributes",
  "ButtonHTMLAttributes",
  "InputHTMLAttributes",
  "TextareaHTMLAttributes",
  "AnchorHTMLAttributes",
  "FormHTMLAttributes",
  "SelectHTMLAttributes",
  "TableHTMLAttributes",
  "TdHTMLAttributes",
  "ThHTMLAttributes",
  "LabelHTMLAttributes",
  "OlHTMLAttributes",
  "TimeHTMLAttributes",
  "RefAttributes",
  "AriaAttributes",
  "DOMAttributes",
  "Attributes",
]);

function isInheritedHtmlProp(prop: ts.Symbol, _checker: ts.TypeChecker): boolean {
  const declarations = prop.getDeclarations();
  if (!declarations || declarations.length === 0) return false;

  for (const decl of declarations) {
    const sourceFile = decl.getSourceFile();
    const fileName = sourceFile.fileName;
    // Props from React type definitions or DOM types
    if (fileName.includes("node_modules")) return true;
    if (fileName.includes("@types/react")) return true;

    // Check parent interface name
    const parent = decl.parent;
    if (ts.isInterfaceDeclaration(parent)) {
      const parentName = parent.name.text;
      if (HTML_ATTR_BASES.has(parentName)) return true;
    }
  }
  return false;
}

// ─── Type stringification ───────────────────────────────────────────

export function stringifyType(checker: ts.TypeChecker, type: ts.Type): string {
  const raw = stringifyUnionExpanded(checker, type);
  return cleanTypeString(raw);
}

function expandTypeAlias(checker: ts.TypeChecker, type: ts.Type): ts.Type {
  // If it's a union type, try expanding each non-primitive member
  if (type.isUnion()) {
    return type;
  }
  // If the type has an alias symbol, get the actual type
  if (type.aliasSymbol) {
    const aliasDecl = type.aliasSymbol.getDeclarations();
    const firstDecl = aliasDecl?.[0];
    if (firstDecl && ts.isTypeAliasDeclaration(firstDecl)) {
      return checker.getTypeFromTypeNode(firstDecl.type);
    }
  }
  const symbol = type.getSymbol() ?? type.aliasSymbol;
  if (symbol) {
    const decls = symbol.getDeclarations();
    const firstDecl = decls?.[0];
    if (firstDecl && ts.isTypeAliasDeclaration(firstDecl)) {
      return checker.getTypeFromTypeNode(firstDecl.type);
    }
  }
  return type;
}

function stringifyUnionExpanded(checker: ts.TypeChecker, type: ts.Type): string {
  if (!type.isUnion()) {
    const expanded = expandTypeAlias(checker, type);
    if (expanded.isUnion()) {
      return expanded.types.map((t) => checker.typeToString(t)).join(" | ");
    }
    return checker.typeToString(
      expanded,
      undefined,
      ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.WriteArrowStyleSignature,
    );
  }

  // Expand each union member
  const parts: string[] = [];
  for (const member of type.types) {
    const expanded = expandTypeAlias(checker, member);
    if (expanded.isUnion()) {
      for (const sub of expanded.types) {
        parts.push(checker.typeToString(sub));
      }
    } else {
      parts.push(
        checker.typeToString(
          expanded,
          undefined,
          ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.WriteArrowStyleSignature,
        ),
      );
    }
  }
  return parts.join(" | ");
}

function cleanTypeString(raw: string): string {
  // Simplify common React types
  let cleaned = raw
    .replace(/React\.ReactNode/g, "ReactNode")
    .replace(/React\.ReactElement/g, "ReactElement")
    .replace(/React\.CSSProperties/g, "CSSProperties")
    .replace(/React\.Ref<([^>]+)>/g, "Ref<$1>")
    .replace(/React\.KeyboardEvent<[^>]*>/g, "KeyboardEvent")
    .replace(/React\.MouseEvent<[^>]*>/g, "MouseEvent")
    .replace(/React\.FocusEvent<[^>]*>/g, "FocusEvent")
    .replace(/React\.ChangeEvent<[^>]*>/g, "ChangeEvent");

  // Collapse "string | number | boolean" patterns that are too verbose
  if (cleaned.length > 120) {
    cleaned = cleaned.replace(
      /\(([^)]{80,})\)/g,
      (_, inner: string) => `(${inner.substring(0, 80)}…)`,
    );
  }

  return cleaned;
}

// ─── JSDoc extraction ───────────────────────────────────────────────

function getJsDocComment(symbol: ts.Symbol): string | undefined {
  const docs = symbol.getDocumentationComment(undefined);
  if (docs.length === 0) return undefined;
  const text = ts.displayPartsToString(docs).trim();
  return text || undefined;
}

function isDeprecated(symbol: ts.Symbol): boolean {
  const tags = symbol.getJsDocTags();
  return tags.some((tag) => tag.name === "deprecated");
}

// ─── Prop extraction ────────────────────────────────────────────────

export function extractPropsFromType(checker: ts.TypeChecker, type: ts.Type): PropMeta[] {
  const props: PropMeta[] = [];
  const properties = type.getProperties();

  for (const prop of properties) {
    // Skip inherited HTML/DOM props
    if (isInheritedHtmlProp(prop, checker)) continue;

    // Skip internal props (starting with _)
    const name = prop.getName();
    if (name.startsWith("_")) continue;

    const propType = checker.getTypeOfSymbol(prop);
    const isOptional = (prop.flags & ts.SymbolFlags.Optional) !== 0;

    // Detect if the property is optional via declaration
    const declarations = prop.getDeclarations();
    let optional = isOptional;
    if (declarations) {
      for (const decl of declarations) {
        if (ts.isPropertySignature(decl) && decl.questionToken) {
          optional = true;
        }
      }
    }

    props.push({
      name,
      type: stringifyType(checker, propType),
      required: !optional,
      defaultValue: undefined,
      description: getJsDocComment(prop),
      deprecated: isDeprecated(prop),
    });
  }

  return props.sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Interface/type finding ─────────────────────────────────────────

export function findPropsInterface(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  interfaceName: string,
): ts.Type | undefined {
  const symbol = checker.getSymbolAtLocation(sourceFile);
  if (!symbol) return undefined;

  const exports = checker.getExportsOfModule(symbol);
  const match = exports.find((s) => s.getName() === interfaceName);
  if (!match) return undefined;

  const aliased = match.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(match) : match;

  return checker.getDeclaredTypeOfSymbol(aliased);
}

// ─── Component metadata extraction ─────────────────────────────────

export function extractComponentMeta(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  componentName: string,
  propsInterfaceName: string,
  packagePath: string,
  sourceFilePath?: string,
): ComponentMeta | undefined {
  const type = findPropsInterface(checker, sourceFile, propsInterfaceName);
  if (!type) return undefined;

  const props = extractPropsFromType(checker, type);
  const symbol = checker.getSymbolAtLocation(sourceFile);
  const interfaceSymbol = symbol
    ? checker.getExportsOfModule(symbol).find((s) => s.getName() === propsInterfaceName)
    : undefined;

  return {
    name: componentName,
    packagePath,
    propsInterface: propsInterfaceName,
    props,
    description: interfaceSymbol ? getJsDocComment(interfaceSymbol) : undefined,
    sourceFile: sourceFilePath,
  };
}
