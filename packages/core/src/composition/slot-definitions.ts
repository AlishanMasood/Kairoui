import type { ElementType } from "react";

/**
 * Defines a single slot within a component's anatomy.
 */
export interface SlotDefinition {
  /** Default HTML element or component for this slot. */
  readonly defaultElement: ElementType;
  /** Whether this slot must always render. */
  readonly required: boolean;
  /** Whether this slot is exposed publicly (covered by semver). */
  readonly public: boolean;
  /** Optional ARIA role for this slot. */
  readonly role?: string | undefined;
  /** Metadata component name for data-kui-slot attribute. */
  readonly slotName: string;
}

/**
 * A map of slot names to their definitions.
 */
export type SlotDefinitionMap<Names extends string = string> = Readonly<
  Record<Names, SlotDefinition>
>;

/**
 * Options for defining a single slot.
 */
export interface DefineSlotOptions {
  /** Default element. Defaults to "div". */
  defaultElement?: ElementType;
  /** Whether this slot is required. Defaults to false. */
  required?: boolean;
  /** Whether this slot is public. Defaults to true. */
  public?: boolean;
  /** ARIA role for this slot. */
  role?: string;
}

/**
 * Creates a slot definition with defaults applied.
 */
export function defineSlot(name: string, options: DefineSlotOptions = {}): SlotDefinition {
  return {
    defaultElement: options.defaultElement ?? "div",
    required: options.required ?? false,
    public: options.public ?? true,
    role: options.role,
    slotName: name,
  };
}

/**
 * Creates a complete slot definition map for a component.
 * Provides type-safe slot names.
 */
export function defineSlots<Names extends string>(
  definitions: Record<Names, DefineSlotOptions>,
): SlotDefinitionMap<Names> {
  const result = {} as Record<Names, SlotDefinition>;

  for (const name of Object.keys(definitions) as Names[]) {
    result[name] = defineSlot(name, definitions[name]);
  }

  return result;
}

/**
 * Extracts slot names from a slot definition map as a union type.
 */
export type SlotNames<T extends SlotDefinitionMap> = keyof T & string;

/**
 * Extracts only the public slot names from a definition map.
 */
export type PublicSlotNames<T extends SlotDefinitionMap> = {
  [K in keyof T & string]: T[K]["public"] extends true ? K : never;
}[keyof T & string];

/**
 * Extracts only the required slot names from a definition map.
 */
export type RequiredSlotNames<T extends SlotDefinitionMap> = {
  [K in keyof T & string]: T[K]["required"] extends true ? K : never;
}[keyof T & string];
