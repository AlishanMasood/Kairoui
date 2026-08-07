import { Children, cloneElement, isValidElement, createElement } from "react";
import type { ReactNode, ReactElement, ElementType } from "react";
import { mergeProps } from "./merge-props";
import { composeRefs, warning } from "@kairoui/utils";
import type { AssignableRef } from "@kairoui/utils";

/**
 * Renders content with `asChild` support.
 *
 * When `asChild` is false (default): renders as `defaultElement` with merged props.
 * When `asChild` is true: merges internal props onto the single child element.
 *
 * Per KUI-COMP-017:
 * - asChild requires exactly one React element child.
 * - Props are merged via mergeProps (events composed, ARIA reconciled, etc.).
 * - Refs are composed (child ref + internal ref both receive the element).
 * - asChild takes precedence over `as` if both are specified.
 */
export function renderAsChild(options: {
  asChild: boolean;
  defaultElement: ElementType;
  internalProps: Record<string, unknown>;
  consumerProps: Record<string, unknown>;
  children: ReactNode;
  componentName: string;
  internalRef?: AssignableRef<unknown>;
}): ReactElement {
  const {
    asChild,
    defaultElement,
    internalProps,
    consumerProps,
    children,
    componentName,
    internalRef,
  } = options;

  if (!asChild) {
    const merged = mergeProps(internalProps, consumerProps);
    if (internalRef && merged["ref"]) {
      merged["ref"] = composeRefs(internalRef, merged["ref"] as AssignableRef<unknown>);
    } else if (internalRef) {
      merged["ref"] = internalRef;
    }
    merged["children"] = children;
    return createElement(defaultElement, merged);
  }

  // asChild mode: merge onto the single child
  const childArray = Children.toArray(children);

  warning(
    childArray.length === 1,
    `${componentName}: \`asChild\` requires exactly one React element child, but received ${String(childArray.length)} children.`,
  );

  const child = childArray[0];

  warning(
    isValidElement(child),
    `${componentName}: \`asChild\` requires a React element child, but received ${typeof child}.`,
  );

  if (!isValidElement(child)) {
    // Fallback: render without asChild
    const merged = mergeProps(internalProps, consumerProps);
    merged["children"] = children;
    return createElement(defaultElement, merged);
  }

  const childElement = child as ReactElement<Record<string, unknown>>;
  const childProps = childElement.props;

  // Merge internal props onto child props (child wins for scalars per KUI-COMP-017)
  const mergedProps = mergeProps(internalProps, childProps);

  // Consumer root props (non-asChild props like className from the wrapper) also merge
  const {
    children: _consumerChildren,
    asChild: _ac,
    ...restConsumer
  } = consumerProps as Record<string, unknown> & { children?: unknown; asChild?: unknown };
  const finalProps = mergeProps(mergedProps, restConsumer);

  // Compose refs: internal + child's ref + forwarded
  const childRef = (childElement as unknown as { ref?: AssignableRef<unknown> }).ref;
  if (internalRef || childRef) {
    finalProps["ref"] = composeRefs(
      ...[internalRef, childRef, finalProps["ref"] as AssignableRef<unknown> | undefined].filter(
        (r): r is AssignableRef<unknown> => r != null,
      ),
    );
  }

  return cloneElement(childElement, finalProps);
}
