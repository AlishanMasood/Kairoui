import type { CommandFilter, CommandItem } from "./command-types";

// ─── Default filter ─────────────────────────────────────────────────

/** Normalize a query string into lower-cased whitespace tokens. */
export function tokenizeQuery(query: string): readonly string[] {
  if (query.length === 0) return [];
  return query.toLowerCase().trim().split(/\s+/u).filter(Boolean);
}

/** Case-insensitive substring test. */
function includesInsensitive(haystack: string, needle: string): boolean {
  if (needle === "") return true;
  return haystack.toLowerCase().includes(needle);
}

/**
 * Default word-boundary filter. Every whitespace-separated token of the
 * query must appear inside either the item's `searchText` or one of
 * its `keywords`. Case-insensitive. `query === ""` matches every item.
 *
 * No fuzzy matching. Fuzzy search is an opt-in consumer responsibility
 * (KUI-ENT-001 explicitly excludes fuzzy dependencies).
 */
export const defaultFilter: CommandFilter = (item, query) => {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return true;
  for (const token of tokens) {
    if (includesInsensitive(item.searchText, token)) continue;
    const matched = item.keywords.some((kw) => includesInsensitive(kw, token));
    if (!matched) return false;
  }
  return true;
};

// ─── Filter application ────────────────────────────────────────────

/**
 * Apply a filter to an item set, preserving input order. Returns the
 * subset that matches the query. Disabled items pass through the filter
 * — the visual layer decides how to render them.
 */
export function applyFilter(
  items: readonly CommandItem[],
  query: string,
  filter: CommandFilter = defaultFilter,
): readonly CommandItem[] {
  if (query === "") return items;
  const out: CommandItem[] = [];
  for (const item of items) {
    if (filter(item, query)) out.push(item);
  }
  return out;
}

/**
 * Restrict a filtered set to items on a specific page (or the root when
 * `pageId === null`). Used to gate rendering when nested pages are active.
 */
export function filterByPage(
  items: readonly CommandItem[],
  pageId: string | null,
): readonly CommandItem[] {
  const out: CommandItem[] = [];
  for (const item of items) {
    if (item.pageId === pageId) out.push(item);
  }
  return out;
}
