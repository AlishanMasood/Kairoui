import { createElement } from "react";
import type { ReactElement } from "react";
import { DescriptionList, DescriptionTerm, DescriptionDetails } from "@kairoui/core/components";

export interface ComponentMetaProps {
  items: readonly { term: string; details: string }[];
  layout?: "vertical" | "horizontal";
  className?: string;
}

/**
 * ComponentMeta — displays component metadata using the production DescriptionList.
 * Dogfoods @kairoui/core DescriptionList for real-world use in docs.
 */
export function ComponentMeta({
  items,
  layout = "horizontal",
  className,
}: ComponentMetaProps): ReactElement {
  return createElement(
    DescriptionList,
    { layout, className, "data-kui-docs": "component-meta" } as never,
    ...items.flatMap((item) => [
      createElement(DescriptionTerm, { key: `t-${item.term}` }, item.term),
      createElement(DescriptionDetails, { key: `d-${item.term}` }, item.details),
    ]),
  );
}
