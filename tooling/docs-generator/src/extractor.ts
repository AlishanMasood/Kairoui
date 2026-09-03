import ts from "typescript";
import type { PropMeta, ComponentMeta } from "./schema";
import {
  getDescription,
  isDeprecated,
  getDeprecationMessage,
  getSinceTag,
  getDefaultTag,
} from "./jsdoc";

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

function isBuiltinLibDeclaration(decl: ts.Declaration): boolean {
  const fileName = decl.getSourceFile().fileName;
  return fileName.includes("node_modules/typescript/lib/");
}

function isGenericInstantiation(type: ts.Type): boolean {
  const typeRef = type as ts.TypeReference;
  if (typeRef.typeArguments && typeRef.typeArguments.length > 0) return true;
  const anyType = type as ts.Type & { aliasTypeArguments?: readonly ts.Type[] };
  if (anyType.aliasTypeArguments && anyType.aliasTypeArguments.length > 0) return true;
  return false;
}

function expandTypeAlias(checker: ts.TypeChecker, type: ts.Type): ts.Type {
  // Union types are expanded by the caller.
  if (type.isUnion()) return type;
  // Never expand generic instantiations (e.g., Partial<Foo>) — the alias body
  // references a type parameter that has no context here.
  if (isGenericInstantiation(type)) return type;

  if (type.aliasSymbol) {
    const aliasDecl = type.aliasSymbol.getDeclarations();
    const firstDecl = aliasDecl?.[0];
    if (firstDecl && !isBuiltinLibDeclaration(firstDecl) && ts.isTypeAliasDeclaration(firstDecl)) {
      return checker.getTypeFromTypeNode(firstDecl.type);
    }
  }
  const symbol = type.getSymbol() ?? type.aliasSymbol;
  if (symbol) {
    const decls = symbol.getDeclarations();
    const firstDecl = decls?.[0];
    if (firstDecl && !isBuiltinLibDeclaration(firstDecl) && ts.isTypeAliasDeclaration(firstDecl)) {
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

  // Collapse the verbose ReactNode expansion TypeScript emits.
  cleaned = collapseReactNodeExpansion(cleaned);

  // Normalize boolean unions.
  cleaned = cleaned.replace(/\bfalse \| true\b/g, "boolean");
  cleaned = cleaned.replace(/\btrue \| false\b/g, "boolean");

  // Collapse "string | number | boolean" patterns that are too verbose
  if (cleaned.length > 120) {
    cleaned = cleaned.replace(
      /\(([^)]{80,})\)/g,
      (_, inner: string) => `(${inner.substring(0, 80)}…)`,
    );
  }

  return cleaned;
}

const REACT_NODE_PREFIX = "null | string | number | bigint | boolean | ";
const REACT_NODE_ALT_PREFIX = "null | string | number | bigint | false | true | ";
const REACT_NODE_SUFFIX = " | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode>";

function collapseReactNodeExpansion(input: string): string {
  let result = input;
  let guard = 0;
  while (guard++ < 20) {
    const idx = result.indexOf("ReactElement<");
    if (idx < 0) break;

    const closingIdx = findMatchingAngleBracket(result, idx + "ReactElement".length);
    if (closingIdx < 0) break;

    const reactElementEnd = closingIdx + 1;
    const before = result.slice(0, idx);
    const after = result.slice(reactElementEnd);

    let prefixLen = 0;
    if (before.endsWith(REACT_NODE_PREFIX)) prefixLen = REACT_NODE_PREFIX.length;
    else if (before.endsWith(REACT_NODE_ALT_PREFIX)) prefixLen = REACT_NODE_ALT_PREFIX.length;

    const hasSuffix = after.startsWith(REACT_NODE_SUFFIX);
    if (prefixLen === 0 || !hasSuffix) {
      return result;
    }

    const collapsedBefore = before.slice(0, before.length - prefixLen);
    const collapsedAfter = after.slice(REACT_NODE_SUFFIX.length);
    result = collapsedBefore + "ReactNode" + collapsedAfter;
  }
  return result;
}

function findMatchingAngleBracket(s: string, openIdx: number): number {
  if (s[openIdx] !== "<") return -1;
  let depth = 0;
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === "<") depth += 1;
    else if (s[i] === ">") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
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
      defaultValue: getDefaultTag(prop),
      description: getDescription(prop),
      deprecated: isDeprecated(prop),
      deprecationMessage: getDeprecationMessage(prop),
      since: getSinceTag(prop),
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
    description: interfaceSymbol ? getDescription(interfaceSymbol) : undefined,
    sourceFile: sourceFilePath,
    since: interfaceSymbol ? getSinceTag(interfaceSymbol) : undefined,
    import: {
      packagePath,
      namedExports: [componentName],
    },
    source: {
      filePath: sourceFilePath,
      propsInterface: propsInterfaceName,
    },
  };
}
