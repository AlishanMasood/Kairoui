import type { ComponentType, ElementType, ForwardRefExoticComponent } from "react";
import { warning } from "@kairoui/utils";
import type { SlotDefinition, SlotDefinitionMap } from "./slot-definitions";

/**
 * A valid slot replacement target: native HTML/SVG element string, React component,
 * or ForwardRef component.
 */
export type SlotReplacement = ElementType;

/**
 * Consumer-provided map of slot replacements.
 * Only public slots can be replaced.
 */
export type SlotReplacementMap<Names extends string> = Partial<Record<Names, SlotReplacement>>;

/** Result of validating a single slot replacement. */
export interface SlotReplacementDiagnostic {
  readonly slotName: string;
  readonly replacement: unknown;
  readonly reason: string;
  readonly severity: "error" | "warning";
}

/** Result of validating all slot replacements. */
export interface SlotReplacementValidation {
  readonly valid: boolean;
  readonly diagnostics: readonly SlotReplacementDiagnostic[];
  /** Sanitized replacements with invalid entries removed. */
  readonly replacements: Record<string, ElementType>;
}

/** Checks if a value is a valid React component (class or function). */
function isComponent(value: unknown): value is ComponentType<unknown> {
  if (typeof value === "function") return true;
  // ForwardRef/memo components are objects with $$typeof
  if (typeof value === "object" && value !== null && "$$typeof" in value) return true;
  return false;
}

/** Checks if a value is a valid intrinsic element name. */
function isIntrinsicElement(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0) return false;
  // Intrinsic elements start with lowercase
  return value.charCodeAt(0) >= 97 && value.charCodeAt(0) <= 122;
}

/** Checks if a value is a valid slot replacement. */
function isValidReplacement(value: unknown): value is ElementType {
  return isIntrinsicElement(value) || isComponent(value);
}

/**
 * Validates a single slot replacement against its definition.
 * Emits developer diagnostics for invalid replacements.
 */
export function validateSlotReplacement(
  slotName: string,
  replacement: unknown,
  definition: SlotDefinition,
): SlotReplacementDiagnostic | null {
  // Internal slots cannot be replaced
  if (!definition.public) {
    return {
      slotName,
      replacement,
      reason: `Slot "${slotName}" is internal and cannot be replaced by consumers.`,
      severity: "error",
    };
  }

  if (!isValidReplacement(replacement)) {
    return {
      slotName,
      replacement,
      reason: `Invalid replacement for slot "${slotName}": expected a valid element type (string tag, component, or forwardRef), received ${typeof replacement}.`,
      severity: "error",
    };
  }

  return null;
}

/**
 * Validates a full replacement map against slot definitions.
 * Returns validation result with diagnostics and sanitized replacements.
 *
 * - Rejects replacements for internal (non-public) slots
 * - Rejects replacements for undefined slot names
 * - Rejects invalid element types (null, undefined, numbers, etc.)
 * - Emits dev-mode warnings for all issues
 */
export function validateSlotReplacements<Names extends string>(
  replacements: Partial<Record<string, unknown>>,
  definitions: SlotDefinitionMap<Names>,
  componentName: string,
): SlotReplacementValidation {
  const diagnostics: SlotReplacementDiagnostic[] = [];
  const valid: Record<string, ElementType> = {};
  const definitionKeys = new Set(Object.keys(definitions));

  for (const [name, replacement] of Object.entries(replacements)) {
    if (replacement === undefined) continue;

    // Unknown slot name
    if (!definitionKeys.has(name)) {
      const diag: SlotReplacementDiagnostic = {
        slotName: name,
        replacement,
        reason: `${componentName}: Unknown slot "${name}". Available slots: ${[...definitionKeys].join(", ")}.`,
        severity: "error",
      };
      diagnostics.push(diag);
      warning(false, diag.reason);
      continue;
    }

    const definition = definitions[name as Names];
    const diag = validateSlotReplacement(name, replacement, definition);

    if (diag !== null) {
      diagnostics.push(diag);
      warning(false, `${componentName}: ${diag.reason}`);
      continue;
    }

    valid[name] = replacement as ElementType;
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics,
    replacements: valid,
  };
}

/**
 * Resolves the element type for a slot, applying a validated replacement if provided.
 * Falls back to the slot's default element when no replacement is given.
 */
export function resolveSlotElement(
  definition: SlotDefinition,
  replacement: ElementType | undefined,
): ElementType {
  return replacement ?? definition.defaultElement;
}

/**
 * Resolves element types for all slots, applying validated replacements.
 * Returns a map of slot name → resolved element type.
 */
export function resolveSlotElements<Names extends string>(
  definitions: SlotDefinitionMap<Names>,
  replacements: SlotReplacementMap<Names> | undefined,
): Record<Names, ElementType> {
  const result = {} as Record<Names, ElementType>;

  for (const name of Object.keys(definitions) as Names[]) {
    result[name] = resolveSlotElement(definitions[name], replacements?.[name]);
  }

  return result;
}

/**
 * Creates a type-safe slot replacement configuration from consumer input.
 * Validates all replacements and returns only valid ones, emitting diagnostics
 * for any invalid entries.
 *
 * This is the primary API for component authors to accept consumer slot replacements.
 */
export function createSlotReplacements<Names extends string>(
  definitions: SlotDefinitionMap<Names>,
  consumerSlots: Partial<Record<string, unknown>> | undefined,
  componentName: string,
): SlotReplacementMap<Names> {
  if (!consumerSlots) return {} as SlotReplacementMap<Names>;

  const validation = validateSlotReplacements(consumerSlots, definitions, componentName);
  return validation.replacements as SlotReplacementMap<Names>;
}

/**
 * Type helper: extracts the public slot names that are replaceable.
 * Consumers can only replace public slots.
 */
export type ReplaceableSlotNames<T extends SlotDefinitionMap> = {
  [K in keyof T & string]: T[K]["public"] extends true ? K : never;
}[keyof T & string];

/**
 * Consumer-facing type for the `slots` prop on a component.
 * Only includes public (replaceable) slots.
 */
export type SlotReplacementProp<T extends SlotDefinitionMap> = Partial<
  Record<ReplaceableSlotNames<T>, ElementType>
>;

/**
 * Type guard: checks if an element type is a ForwardRef component.
 * Useful for determining whether ref forwarding will work.
 */
export function isForwardRefComponent(
  element: ElementType,
): element is ForwardRefExoticComponent<Record<string, unknown>> {
  return (
    typeof element === "object" &&
    "$$typeof" in element &&
    String((element as Record<string, unknown>)["$$typeof"]) === "Symbol(react.forward_ref)"
  );
}

/**
 * Checks if a slot replacement supports ref forwarding.
 * Emits a dev warning if refs might be lost.
 */
export function checkRefSupport(
  slotName: string,
  replacement: ElementType,
  componentName: string,
): boolean {
  // Intrinsic elements always support refs
  if (typeof replacement === "string") return true;

  // ForwardRef components support refs
  if (isForwardRefComponent(replacement)) return true;

  // Class components support refs
  if (
    typeof replacement === "function" &&
    replacement.prototype &&
    typeof (replacement.prototype as Record<string, unknown>)["render"] === "function"
  ) {
    return true;
  }

  // Function components do not support refs by default
  warning(
    false,
    `${componentName}: Slot "${slotName}" replacement does not appear to support ref forwarding. ` +
      `Use React.forwardRef() to wrap your component if ref access is needed.`,
  );
  return false;
}
