import { useCallback } from "react";
import { useControllableState } from "@kairoui/hooks";
import type { RowId } from "../data/data-types";

export interface UseTreeExpansionOptions {
  readonly expandedIds?: ReadonlySet<RowId>;
  readonly defaultExpandedIds?: ReadonlySet<RowId>;
  readonly onExpandedChange?: (ids: ReadonlySet<RowId>) => void;
}

export interface UseTreeExpansionReturn {
  readonly expandedIds: ReadonlySet<RowId>;
  readonly onExpandedChange: (ids: ReadonlySet<RowId>) => void;
  readonly toggleExpanded: (id: RowId) => void;
  readonly expandAll: (ids: readonly RowId[]) => void;
  readonly collapseAll: () => void;
  readonly isExpanded: (id: RowId) => boolean;
}

const EMPTY_SET: ReadonlySet<RowId> = new Set<RowId>();

export function useTreeExpansion(options: UseTreeExpansionOptions = {}): UseTreeExpansionReturn {
  const {
    expandedIds: controlledIds,
    defaultExpandedIds,
    onExpandedChange: onChangeProp,
  } = options;

  const [expandedIds, setExpandedIds] = useControllableState<ReadonlySet<RowId>>({
    value: controlledIds,
    defaultValue: defaultExpandedIds ?? EMPTY_SET,
    ...(onChangeProp ? { onChange: onChangeProp } : undefined),
  });

  const onExpandedChange = useCallback(
    (ids: ReadonlySet<RowId>) => {
      setExpandedIds(ids);
    },
    [setExpandedIds],
  );

  const toggleExpanded = useCallback(
    (id: RowId) => {
      setExpandedIds((prev: ReadonlySet<RowId>) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [setExpandedIds],
  );

  const expandAll = useCallback(
    (ids: readonly RowId[]) => {
      setExpandedIds((prev: ReadonlySet<RowId>) => {
        const next = new Set(prev);
        for (const id of ids) next.add(id);
        return next;
      });
    },
    [setExpandedIds],
  );

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set<RowId>());
  }, [setExpandedIds]);

  const isExpanded = useCallback((id: RowId) => expandedIds.has(id), [expandedIds]);

  return { expandedIds, onExpandedChange, toggleExpanded, expandAll, collapseAll, isExpanded };
}
