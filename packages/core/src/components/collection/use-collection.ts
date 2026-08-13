import { createContext, useContext, useCallback, useRef, useMemo, useState } from "react";
import type { CollectionItem } from "./collection-types";

// ─── Registered Item (internal, includes ordering metadata) ─────────

export interface RegisteredItem extends CollectionItem {
  /** Unique element ID for aria-activedescendant. */
  id: string;
}

// ─── Collection State ───────────────────────────────────────────────

export interface CollectionState {
  /** Ordered list of registered items (snapshot from last render). */
  items: readonly RegisteredItem[];
  /** Register an item. Returns unregister function. */
  register: (item: RegisteredItem) => () => void;
  /** Get item by value (reads from live store, not snapshot). */
  getByValue: (value: string) => RegisteredItem | undefined;
  /** Get item by element ID (reads from live store). */
  getById: (id: string) => RegisteredItem | undefined;
  /** Get enabled (non-disabled) items in order (reads from live store). */
  getEnabledItems: () => readonly RegisteredItem[];
  /** Total count of registered items. */
  count: number;
}

// ─── Context ────────────────────────────────────────────────────────

export const CollectionContext = createContext<CollectionState | null>(null);
CollectionContext.displayName = "CollectionContext";

export function useCollectionContext(): CollectionState | null {
  return useContext(CollectionContext);
}

// ─── Hook: useCollection ────────────────────────────────────────────

/**
 * Creates a collection state manager. Use at the root of a collection component.
 *
 * Items register on mount via useEffect and unregister on unmount.
 * State updates are batched via microtask to avoid infinite rerender loops
 * when multiple items mount/unmount in the same commit.
 */
export function useCollection(): CollectionState {
  const storeRef = useRef<RegisteredItem[]>([]);
  const [snapshot, setSnapshot] = useState<readonly RegisteredItem[]>([]);
  const pendingFlushRef = useRef(false);

  const flush = useCallback(() => {
    if (pendingFlushRef.current) return;
    pendingFlushRef.current = true;
    // Batch via microtask to coalesce multiple register/unregister calls
    void Promise.resolve().then(() => {
      pendingFlushRef.current = false;
      setSnapshot([...storeRef.current]);
    });
  }, []);

  const register = useCallback(
    (item: RegisteredItem) => {
      storeRef.current = [...storeRef.current, item];
      flush();
      return () => {
        storeRef.current = storeRef.current.filter((i) => i.value !== item.value);
        flush();
      };
    },
    [flush],
  );

  const getByValue = useCallback(
    (value: string) => storeRef.current.find((i) => i.value === value),
    [],
  );

  const getById = useCallback((id: string) => storeRef.current.find((i) => i.id === id), []);

  const getEnabledItems = useCallback(() => storeRef.current.filter((i) => !i.disabled), []);

  return useMemo(
    () => ({
      items: snapshot,
      register,
      getByValue,
      getById,
      getEnabledItems,
      count: snapshot.length,
    }),
    [snapshot, register, getByValue, getById, getEnabledItems],
  );
}
