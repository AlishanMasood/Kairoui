import type { PropsTableProp } from "@kairoui/docs";
// eslint-disable-next-line import-x/no-internal-modules
import metadata from "../../../tooling/docs-generator/generated/api-metadata.json";

interface RawProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  deprecated: boolean;
  deprecationMessage?: string;
  since?: string;
}

interface RawComponent {
  name: string;
  props: RawProp[];
}

const componentIndex = new Map<string, RawComponent>();
for (const pkg of metadata.packages) {
  for (const comp of pkg.components) {
    componentIndex.set(comp.name, comp);
  }
}

function prettifyType(type: string, required: boolean): string {
  let t = type;
  if (!required && t.startsWith("undefined | ")) {
    t = t.slice("undefined | ".length);
  }
  t = t.replace(/\bfalse \| true\b/g, "boolean");
  t = t.replace(/\btrue \| false\b/g, "boolean");
  // Collapse verbose ReactNode expansion
  t = t.replace(
    /null \| string \| number \| bigint \| (?:false \| true|boolean) \| ReactElement<[^>]+> \| Iterable<ReactNode> \| ReactPortal \| Promise<AwaitedReactNode>/g,
    "ReactNode",
  );
  return t;
}

function toPropsTableProp(raw: RawProp): PropsTableProp {
  return {
    name: raw.name,
    type: prettifyType(raw.type, raw.required),
    required: raw.required,
    defaultValue: raw.defaultValue,
    description: raw.description,
    deprecated: raw.deprecated,
    ...(raw.deprecationMessage ? { deprecationMessage: raw.deprecationMessage } : undefined),
    ...(raw.since ? { since: raw.since } : undefined),
  };
}

export function getComponentProps(name: string): PropsTableProp[] {
  const comp = componentIndex.get(name);
  if (!comp) return [];
  return comp.props.map(toPropsTableProp);
}

export function hasComponentMeta(name: string): boolean {
  return componentIndex.has(name);
}
