import { useEffect } from "react";
import { useId } from "@kairoui/hooks";
import { useCollectionContext } from "./use-collection";
import type { RegisteredItem } from "./use-collection";

export interface UseCollectionItemOptions {
  /** Unique value identifying this item. */
  value: string;
  /** Human-readable label for typeahead. */
  label: string;
  /** Whether this item is disabled. */
  disabled?: boolean;
  /** Consumer-provided ID override. */
  id?: string;
}

/**
 * Registers an item with the nearest collection context on mount,
 * unregisters on unmount. Returns the resolved element ID.
 *
 * Must be called within a CollectionContext.Provider.
 */
export function useCollectionItem(options: UseCollectionItemOptions): string {
  const { value, label, disabled = false, id: providedId } = options;
  const collection = useCollectionContext();
  const generatedId = useId(providedId, { prefix: "kui-item" });

  useEffect(() => {
    if (!collection) return;

    const item: RegisteredItem = {
      value,
      label,
      disabled,
      id: generatedId,
    };

    return collection.register(item);
  }, [collection, value, label, disabled, generatedId]);

  return generatedId;
}
