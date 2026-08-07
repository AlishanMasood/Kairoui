import { createElement, forwardRef } from "react";
import type { ElementType, ReactElement, Ref } from "react";
import { mergeProps } from "./merge-props";
import type { PolymorphicComponent, PolymorphicProps } from "./polymorphic-types";

export interface CreatePolymorphicOptions<OwnProps, DefaultElement extends ElementType> {
  /** Display name for React DevTools. */
  displayName: string;
  /** Default HTML element when `as` is not specified. */
  defaultElement: DefaultElement;
  /**
   * Render function that receives resolved props and the element to render as.
   * Must return the props to pass to createElement (after internal logic).
   */
  useProps: (props: OwnProps & { as?: ElementType }, ref: Ref<unknown>) => Record<string, unknown>;
}

/**
 * Creates a polymorphic component that supports the `as` prop.
 *
 * - Renders as `defaultElement` unless `as` is provided.
 * - Merges internal props from `useProps` with consumer props via `mergeProps`.
 * - Forwards refs to the rendered element.
 * - Integrates with composition-layer merging (events, classNames, ARIA, refs).
 */
export function createPolymorphicComponent<
  OwnProps extends Record<string, unknown>,
  DefaultElement extends ElementType,
>(
  options: CreatePolymorphicOptions<OwnProps, DefaultElement>,
): PolymorphicComponent<OwnProps, DefaultElement> {
  const { displayName, defaultElement, useProps } = options;

  const Component = forwardRef<unknown, PolymorphicProps<OwnProps, ElementType>>((props, ref) => {
    const { as, ...restProps } = props;
    const Element = as ?? defaultElement;
    const ownProps = restProps as unknown as OwnProps & { as?: ElementType };
    const internalProps = useProps(ownProps, ref);
    const mergedProps = mergeProps(internalProps, restProps as Record<string, unknown>);

    return createElement(Element, mergedProps);
  });

  Component.displayName = displayName;

  return Component as unknown as PolymorphicComponent<OwnProps, DefaultElement>;
}

/**
 * Minimal polymorphic render helper for simple cases.
 * Renders an element with merged props without the full factory pattern.
 */
export function renderPolymorphic(
  element: ElementType,
  internalProps: Record<string, unknown>,
  consumerProps: Record<string, unknown>,
): ReactElement {
  const merged = mergeProps(internalProps, consumerProps);
  return createElement(element, merged);
}
