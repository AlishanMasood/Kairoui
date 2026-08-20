import type { RowId } from "./data-types";

// ─── Row Model ──────────────────────────────────────────────────────

/** Internal row representation wrapping consumer data with stable identity and metadata. */
export interface RowModel<TRow> {
    readonly id: RowId;
    readonly original: TRow;
    readonly index: number;
    readonly depth: number;
    readonly parentId: RowId | null;
    readonly isLeaf: boolean;
}

/** Options for creating a flat row model from consumer data. */
export interface CreateRowModelOptions<TRow> {
    readonly data: readonly TRow[];
    readonly getRowId: (row: TRow, index: number) => RowId;
}

/** Options for creating a hierarchical row model. */
export interface CreateTreeRowModelOptions<TRow> {
    readonly data: readonly TRow[];
    readonly getRowId: (row: TRow, index: number) => RowId;
    readonly getParentId: (row: TRow) => RowId | null;
    readonly getChildren?: (row: TRow) => readonly TRow[] | undefined;
}

// ─── Flat row model ─────────────────────────────────────────────────

/** Creates a flat (non-hierarchical) row model from consumer data. */
export function createRowModel<TRow>(
    options: CreateRowModelOptions<TRow>,
): readonly RowModel<TRow>[] {
    const { data, getRowId } = options;
    const rows: RowModel<TRow>[] = [];
    for (let i = 0; i < data.length; i++) {
        const item = data[i] as TRow;
        rows.push({
            id: getRowId(item, i),
            original: item,
            index: i,
            depth: 0,
            parentId: null,
            isLeaf: true,
        });
    }
    return rows;
}

// ─── Tree row model ─────────────────────────────────────────────────

/** Creates a hierarchical row model with depth and parent tracking. */
export function createTreeRowModel<TRow>(
    options: CreateTreeRowModelOptions<TRow>,
): readonly RowModel<TRow>[] {
    const { data, getRowId, getParentId, getChildren } = options;

    if (getChildren) {
        return buildFromChildren(data, getRowId, getChildren);
    }
    return buildFromParentIds(data, getRowId, getParentId);
}

function buildFromChildren<TRow>(
    roots: readonly TRow[],
    getRowId: (row: TRow, index: number) => RowId,
    getChildren: (row: TRow) => readonly TRow[] | undefined,
): RowModel<TRow>[] {
    const rows: RowModel<TRow>[] = [];
    let globalIndex = 0;

    function walk(items: readonly TRow[], depth: number, parentId: RowId | null): void {
        for (const item of items) {
            const id = getRowId(item, globalIndex);
            const children = getChildren(item);
            const hasChildren = children !== undefined && children.length > 0;
            rows.push({
                id,
                original: item,
                index: globalIndex,
                depth,
                parentId,
                isLeaf: !hasChildren,
            });
            globalIndex++;
            if (hasChildren) {
                walk(children, depth + 1, id);
            }
        }
    }

    walk(roots, 0, null);
    return rows;
}

function buildFromParentIds<TRow>(
    data: readonly TRow[],
    getRowId: (row: TRow, index: number) => RowId,
    getParentId: (row: TRow) => RowId | null,
): RowModel<TRow>[] {
    // First pass: build id→item map and identify children
    const idToItem = new Map<RowId, { item: TRow; index: number }>();
    const childrenMap = new Map<RowId | null, RowId[]>();

    for (let i = 0; i < data.length; i++) {
        const item = data[i] as TRow;
        const id = getRowId(item, i);
        const parentId = getParentId(item);
        idToItem.set(id, { item, index: i });
        const siblings = childrenMap.get(parentId);
        if (siblings) {
            siblings.push(id);
        } else {
            childrenMap.set(parentId, [id]);
        }
    }

    // Second pass: depth-first traversal from roots
    const rows: RowModel<TRow>[] = [];
    let globalIndex = 0;

    function walk(nodeId: RowId, depth: number, parentId: RowId | null): void {
        const entry = idToItem.get(nodeId);
        if (!entry) return;
        const children = childrenMap.get(nodeId);
        const hasChildren = children !== undefined && children.length > 0;
        rows.push({
            id: nodeId,
            original: entry.item,
            index: globalIndex,
            depth,
            parentId,
            isLeaf: !hasChildren,
        });
        globalIndex++;
        if (hasChildren) {
            for (const childId of children) {
                walk(childId, depth + 1, nodeId);
            }
        }
    }

    const roots = childrenMap.get(null) ?? [];
    for (const rootId of roots) {
        walk(rootId, 0, null);
    }

    return rows;
}

// ─── Utilities ──────────────────────────────────────────────────────

/** Get visible rows after applying expansion state. */
export function getVisibleRows<TRow>(
    rows: readonly RowModel<TRow>[],
    expandedIds: ReadonlySet<RowId>,
): readonly RowModel<TRow>[] {
    const visible: RowModel<TRow>[] = [];
    const collapsedAncestors = new Set<RowId>();

    for (const row of rows) {
        // Skip if any ancestor is collapsed
        if (row.parentId !== null && collapsedAncestors.has(row.parentId)) {
            if (!row.isLeaf) collapsedAncestors.add(row.id);
            continue;
        }
        visible.push(row);
        // If this non-leaf is not expanded, mark it collapsed
        if (!row.isLeaf && !expandedIds.has(row.id)) {
            collapsedAncestors.add(row.id);
        }
    }
    return visible;
}

/** Find all ancestor IDs for a given row. */
export function getAncestorIds<TRow>(
    rows: readonly RowModel<TRow>[],
    rowId: RowId,
): readonly RowId[] {
    const idToRow = new Map<RowId, RowModel<TRow>>();
    for (const row of rows) {
        idToRow.set(row.id, row);
    }

    const ancestors: RowId[] = [];
    let current = idToRow.get(rowId);
    while (current?.parentId !== null && current?.parentId !== undefined) {
        ancestors.push(current.parentId);
        current = idToRow.get(current.parentId);
    }
    return ancestors;
}

/** Find all descendant IDs for a given row. */
export function getDescendantIds<TRow>(
    rows: readonly RowModel<TRow>[],
    rowId: RowId,
): readonly RowId[] {
    const descendants: RowId[] = [];
    const parentIds = new Set<RowId>([rowId]);

    for (const row of rows) {
        if (row.parentId !== null && parentIds.has(row.parentId)) {
            descendants.push(row.id);
            parentIds.add(row.id);
        }
    }
    return descendants;
}
