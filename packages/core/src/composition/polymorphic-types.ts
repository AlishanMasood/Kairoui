import type { ComponentPropsWithRef, ElementType, ReactElement, JSX } from "react";

/**
 * Polymorphic type system for KairoUI components.
 *
 * Enables components to render as different HTML elements or custom components
 * via the `as` prop, while preserving full type inference for props, refs, and events.
 */

// ─── Core Types ─────────────────────────────────────────────────────

/**
 * The `as` prop value — any valid React element type.
 * Defaults to a specific HTML element (e.g., "button", "div").
 */
export type AsElementType = ElementType;

/**
 * Extracts the props for a given element type, including ref.
 */
export type PropsOf<E extends ElementType> = ComponentPropsWithRef<E>;

/**
 * Own props of a polymorphic component — the component's custom props
 * plus the `as` prop.
 */
export type PolymorphicOwnProps<OwnProps, DefaultElement extends ElementType> = OwnProps & {
  /** Render as a different element or component. */
  as?: DefaultElement;
};

/**
 * Props that a polymorphic component accepts — combines own props with
 * the target element's native props, excluding conflicts.
 */
export type PolymorphicProps<OwnProps, E extends ElementType> = OwnProps & { as?: E } & Omit<
    PropsOf<E>,
    keyof OwnProps | "as"
  >;

/**
 * Ref type for a polymorphic component based on the target element.
 */
export type PolymorphicRef<E extends ElementType> = ComponentPropsWithRef<E>["ref"];

/**
 * A polymorphic component type that accepts an `as` prop.
 * This is the return type of a component factory that supports polymorphism.
 */
export interface PolymorphicComponent<OwnProps, DefaultElement extends ElementType> {
  <E extends ElementType = DefaultElement>(
    props: PolymorphicProps<OwnProps, E>,
  ): ReactElement | null;

  displayName?: string;
}

// ─── Utility Types ──────────────────────────────────────────────────

/**
 * Extracts the intrinsic element type string from JSX.IntrinsicElements.
 * Useful for constraining `as` to only HTML/SVG elements.
 */
export type IntrinsicElementType = keyof JSX.IntrinsicElements;

/**
 * Constrains `as` to only HTML elements (no custom components).
 */
export type HTMLElementType = keyof JSX.IntrinsicElements;

/**
 * Props for a component that ONLY supports native element polymorphism.
 */
export type NativePolymorphicProps<OwnProps, E extends IntrinsicElementType> = OwnProps & {
  as?: E;
} & Omit<JSX.IntrinsicElements[E], keyof OwnProps | "as">;
