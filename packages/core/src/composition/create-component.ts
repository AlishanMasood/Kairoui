import { createElement, forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import { mergeProps } from "./merge-props";
import { renderAsChild } from "./as-child";
import type { PolymorphicComponent } from "./polymorphic-types";
import type {
  CreateComponentOptions,
  ComponentContext,
  ComponentRenderResult,
  ComponentState,
} from "./component-factory-contract";

/** Generates data-* attributes from component state. */
function stateToDataAttrs(state: ComponentState | undefined): Record<string, unknown> {
  if (!state) return {};
  const attrs: Record<string, unknown> = {};
  if (state.dataState !== undefined) attrs["data-state"] = state.dataState;
  if (state.disabled) attrs["data-disabled"] = "";
  if (state.loading) attrs["data-loading"] = "";
  return attrs;
}

/**
 * Creates a KairoUI component with standardized composition behavior.
 * Internal only — not exported from the package's public API.
 */
export function createComponent<
  OwnProps extends object,
  DefaultElement extends ElementType,
  Slots extends string = never,
>(
  options: CreateComponentOptions<OwnProps, DefaultElement, Slots>,
): PolymorphicComponent<OwnProps, DefaultElement> {
  const { displayName, defaultElement, useComponent } = options;

  type RenderProps = OwnProps & { as?: ElementType; asChild?: boolean } & Record<string, unknown>;

  const Component = forwardRef<unknown, RenderProps>(function FactoryComponent(props, ref) {
    const elementProp = (props as { as?: ElementType }).as;
    const asChild = (props as { asChild?: boolean }).asChild === true;
    const Element: ElementType = elementProp ?? defaultElement;

    const ctx: ComponentContext<OwnProps, DefaultElement, Slots> = {
      props: props as OwnProps & { as?: ElementType; asChild?: boolean } & Record<string, unknown>,
      ref,
      element: Element,
      displayName,
      defaultElement,
    };

    const result: ComponentRenderResult<Slots> = useComponent(ctx);

    // Build internal props: rootProps + metadata + state attrs + accessibility
    const internalProps: Record<string, unknown> = {
      "data-kui-component": displayName,
      ...result.rootProps,
      ...stateToDataAttrs(result.state),
      ...(result.accessibilityProps ?? {}),
    };

    // Extract own/known keys from props to get consumer rest props
    const { as: _as, asChild: _ac, children: _ch, ...consumerProps } = props;
    let restProps = consumerProps as Record<string, unknown>;

    // Remove consumed own props so they don't leak to the DOM
    if (result.consumedProps && result.consumedProps.length > 0) {
      const filtered: Record<string, unknown> = {};
      const consumed = new Set(result.consumedProps);
      for (const key of Object.keys(restProps)) {
        if (!consumed.has(key)) filtered[key] = restProps[key];
      }
      restProps = filtered;
    }

    const resolvedChildren: ReactNode =
      result.children ?? (props as { children?: ReactNode }).children;

    if (asChild) {
      return renderAsChild({
        asChild: true,
        defaultElement,
        internalProps,
        consumerProps: restProps,
        children: resolvedChildren,
        componentName: displayName,
        ...(ref ? { internalRef: ref } : {}),
        ...(elementProp ? { as: elementProp } : {}),
      });
    }

    // Standard rendering: merge internal + consumer, render element
    const merged = mergeProps(internalProps, restProps);
    merged["ref"] = ref;

    return createElement(Element, merged, resolvedChildren);
  });

  Component.displayName = displayName;

  return Component as unknown as PolymorphicComponent<OwnProps, DefaultElement>;
}
