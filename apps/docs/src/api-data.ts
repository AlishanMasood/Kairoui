import type { PropsTableProp } from "@kairoui/docs";

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

export interface RawComponent {
  name: string;
  props: RawProp[];
}

function prettifyType(type: string, required: boolean): string {
  let t = type;
  if (!required && t.startsWith("undefined | ")) {
    t = t.slice("undefined | ".length);
  }
  t = t.replace(/\bfalse \| true\b/g, "boolean");
  t = t.replace(/\btrue \| false\b/g, "boolean");
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

/**
 * Converts a per-component metadata JSON blob into props ready for PropsTable.
 * Import the JSON directly per page for code-splitting; avoid loading the aggregate.
 */
export function toPropsList(component: RawComponent): PropsTableProp[] {
  return component.props.map(toPropsTableProp);
}
