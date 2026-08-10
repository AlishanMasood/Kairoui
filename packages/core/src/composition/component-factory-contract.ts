import type { ElementType, ReactNode, Ref } from "react";
import type { PolymorphicComponent } from "./polymorphic-types";
import type { SlotDefinitionMap } from "./slot-definitions";
import type { SlotOverrides } from "./resolve-slot-props";

/**
 * Component factory contract — defines how KairoUI components are created.
 *
 * This is the TYPE CONTRACT only. Runtime implementation is a separate task.
 * Based on evidence from Box (KUI-PROOF-001), Text (KUI-PROOF-002), Button (KUI-PROOF-003).
 *
 * The factory standardizes:
 * - Display names
 * - forwardRef wrapping
 * - Polymorphic `as` prop handling
 * - asChild delegation
 * - Slot resolution
 * - Root element determination (as → slot override → default)
 * - data-kui-component metadata
 * - Consumer prop merging
 *
 * The factory does NOT handle:
 * - Styling or variant resolution (future styling engine)
 * - State management (component responsibility)
 * - Application-specific behavior
 * - Event suppression for disabled states (component responsibility)
 * - Render logic beyond root element creation
 */

// ─── Factory Input ──────────────────────────────────────────────────

/** State computed by the component, informing prop layers. */
export interface ComponentState {
  /** Data-state attribute value (e.g., "default", "disabled", "loading"). */
  dataState?: string | undefined;
  /** Whether the component is functionally disabled. */
  disabled?: boolean | undefined;
  /** Whether the component is in a loading state. */
  loading?: boolean | undefined;
}

/** Options for creating a KairoUI component via the factory. */
export interface CreateComponentOptions<
  OwnProps extends object,
  DefaultElement extends ElementType,
  Slots extends string = never,
> {
  /** Display name for React DevTools. */
  displayName: string;

  /** Default HTML element when `as` is not specified. */
  defaultElement: DefaultElement;

  /** Slot definitions. Omit for simple (slot-less) components. */
  slots?: SlotDefinitionMap<Slots> | undefined;

  /**
   * Core render logic. Receives resolved context and returns what to render.
   *
   * For simple components: return internal props (factory handles rendering).
   * For complex components: return a full ReactElement (factory wraps with ref/metadata).
   */
  useComponent: (
    ctx: ComponentContext<OwnProps, DefaultElement, Slots>,
  ) => ComponentRenderResult<Slots>;
}

/** Context passed to useComponent — everything the component needs to render. */
export interface ComponentContext<
  OwnProps extends object,
  DefaultElement extends ElementType,
  _Slots extends string = never,
> {
  /** All props passed to the component (own + consumer native + as). */
  props: OwnProps & { as?: ElementType; asChild?: boolean } & Record<string, unknown>;
  /** Forwarded ref from parent. */
  ref: Ref<unknown>;
  /** The resolved root element type (considers `as` prop and slot override). */
  element: ElementType;
  /** Component name (for diagnostics). */
  displayName: string;
  /** Default element type. */
  defaultElement: DefaultElement;
}

/** What useComponent returns to the factory. */
export interface ComponentRenderResult<Slots extends string = never> {
  /** Internal props for the root element. Factory merges these with consumer props. */
  rootProps: Record<string, unknown>;

  /** Own prop keys consumed by the component (will not pass to the DOM). */
  consumedProps?: readonly string[] | undefined;

  /** Component state for data-attribute generation. */
  state?: ComponentState | undefined;

  /** Accessibility props for the root element. Merged between internal and state layers. */
  accessibilityProps?: Record<string, unknown> | undefined;

  /** Children to render inside the root element. */
  children?: ReactNode | undefined;

  /**
   * Slot overrides from consumer props (pass-through).
   * Factory uses these in resolveAllSlotProps.
   */
  slotOverrides?: SlotOverrides<Slots> | undefined;

  /**
   * Per-slot internal props. Factory resolves these via resolveAllSlotProps.
   * Only relevant for slotted components.
   */
  slotInternalProps?: Partial<Record<Slots, Record<string, unknown>>> | undefined;

  /** Per-slot accessibility props. */
  slotAccessibilityProps?: Partial<Record<Slots, Record<string, unknown>>> | undefined;

  /** Per-slot state-derived props. */
  slotStateProps?: Partial<Record<Slots, Record<string, unknown>>> | undefined;
}

// ─── Factory Output ─────────────────────────────────────────────────

/**
 * The factory output is a PolymorphicComponent with:
 * - forwardRef applied
 * - displayName set
 * - Correct generic type parameters for JSX type inference
 * - Support for `as` prop
 * - Support for `asChild` prop (when applicable)
 */
export type ComponentFactoryResult<
  OwnProps extends object,
  DefaultElement extends ElementType,
> = PolymorphicComponent<OwnProps, DefaultElement>;

// ─── Factory Signature ──────────────────────────────────────────────

/**
 * Creates a KairoUI component with standardized composition behavior.
 *
 * Runtime responsibilities (what the factory does):
 * 1. Wraps in forwardRef with proper generic types
 * 2. Sets displayName
 * 3. Resolves root element from: as prop → slot override → defaultElement
 * 4. Adds data-kui-component metadata
 * 5. Calls useComponent to get internal props/state/children
 * 6. Resolves slot props (if slots defined)
 * 7. Merges internal + accessibility + state + consumer props via mergeProps
 * 8. Handles asChild delegation (if asChild=true)
 * 9. Renders root element with merged props and children
 * 10. Generates data-state, data-disabled, data-loading from ComponentState
 *
 * What remains explicit in component code (NOT hidden by factory):
 * - Own prop types and destructuring
 * - State derivation logic (disabled, loading, expanded, etc.)
 * - Accessibility prop computation (component decides which ARIA to apply)
 * - Slot children composition (component decides what goes in each slot)
 * - Event handler logic (component decides behavior)
 * - Conditional rendering logic
 *
 * What the factory must never hide:
 * - React rendering model (createElement, hooks, effects)
 * - Component-specific behavior
 * - State management decisions
 * - Event handling logic
 * - Accessibility pattern implementation
 */
export type CreateComponent = <
  OwnProps extends object,
  DefaultElement extends ElementType,
  Slots extends string = never,
>(
  options: CreateComponentOptions<OwnProps, DefaultElement, Slots>,
) => ComponentFactoryResult<OwnProps, DefaultElement>;

// ─── Usage Examples (Type-Level Only) ───────────────────────────────

/**
 * Simple component (Box-like):
 *
 * ```ts
 * const Box = createComponent({
 *   displayName: "Box",
 *   defaultElement: "div",
 *   useComponent: ({ ref }) => ({
 *     rootProps: { ref },
 *   }),
 * });
 * ```
 *
 * Complex component (Button-like):
 *
 * ```ts
 * const Button = createComponent({
 *   displayName: "Button",
 *   defaultElement: "button",
 *   slots: buttonSlots,
 *   useComponent: ({ props, ref, element }) => {
 *     const { children, startIcon, endIcon, loading, disabled, type, ...rest } = props;
 *     const isDisabled = disabled || loading;
 *     return {
 *       rootProps: { ref },
 *       state: { disabled: isDisabled, loading, dataState: loading ? "loading" : "default" },
 *       accessibilityProps: { ...(element === "button" ? { type } : {}) },
 *       children: <>{startIcon}{children}{endIcon}</>,
 *       slotOverrides: { slots: props.slots, slotProps: props.slotProps },
 *     };
 *   },
 * });
 * ```
 */
export type _UsageExamples = never;
