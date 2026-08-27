import ts from "typescript";

// ─── Description extraction ─────────────────────────────────────────

export function getDescription(symbol: ts.Symbol): string | undefined {
  const docs = symbol.getDocumentationComment(undefined);
  if (docs.length === 0) return undefined;
  const raw = ts.displayPartsToString(docs);
  return normalizeDescription(raw);
}

// ─── Tag extraction ─────────────────────────────────────────────────

export function isDeprecated(symbol: ts.Symbol): boolean {
  return symbol.getJsDocTags().some((tag) => tag.name === "deprecated");
}

export function getDeprecationMessage(symbol: ts.Symbol): string | undefined {
  const tag = symbol.getJsDocTags().find((t) => t.name === "deprecated");
  if (!tag) return undefined;
  return normalizeTagText(tag);
}

export function getSinceTag(symbol: ts.Symbol): string | undefined {
  const tag = symbol.getJsDocTags().find((t) => t.name === "since");
  if (!tag) return undefined;
  return normalizeTagText(tag);
}

export function getDefaultTag(symbol: ts.Symbol): string | undefined {
  const tag = symbol.getJsDocTags().find((t) => t.name === "default" || t.name === "defaultValue");
  if (!tag) return undefined;
  return normalizeTagText(tag);
}

// ─── Normalization ──────────────────────────────────────────────────

export function normalizeDescription(raw: string): string | undefined {
  let text = raw.trim();
  // Collapse consecutive whitespace (but preserve single newlines for Markdown)
  text = text.replace(/[ \t]+/g, " ");
  // Normalize multiple blank lines into single blank line
  text = text.replace(/\n{3,}/g, "\n\n");
  // Trim leading/trailing whitespace per line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
  return text || undefined;
}

function normalizeTagText(tag: ts.JSDocTagInfo): string | undefined {
  const text = ts.displayPartsToString(tag.text).trim();
  return text || undefined;
}

// ─── Diagnostics ────────────────────────────────────────────────────

export interface JsDocDiagnostic {
  readonly symbolName: string;
  readonly kind: "missing-description" | "empty-deprecated" | "malformed-since";
  readonly message: string;
}

export function diagnoseSymbol(symbol: ts.Symbol): JsDocDiagnostic[] {
  const diagnostics: JsDocDiagnostic[] = [];
  const name = symbol.getName();

  if (isDeprecated(symbol) && !getDeprecationMessage(symbol)) {
    diagnostics.push({
      symbolName: name,
      kind: "empty-deprecated",
      message: `${name}: @deprecated tag has no message`,
    });
  }

  const since = getSinceTag(symbol);
  if (since && !/^v?\d+\.\d+/.test(since)) {
    diagnostics.push({
      symbolName: name,
      kind: "malformed-since",
      message: `${name}: @since "${since}" does not look like a version`,
    });
  }

  return diagnostics;
}
