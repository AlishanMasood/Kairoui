import type { ComponentMeta, CompoundComponentMeta } from "./schema";

// ─── Compound component detection ───────────────────────────────────

const PART_SUFFIXES = [
  "Item",
  "Trigger",
  "Content",
  "Header",
  "Body",
  "Footer",
  "List",
  "Close",
  "Portal",
  "Backdrop",
  "Title",
  "Description",
  "Icon",
  "Actions",
  "Indicator",
  "Connector",
  "Separator",
  "Current",
  "Link",
  "Caption",
  "Cell",
  "Head",
  "Row",
  "Previous",
  "Next",
  "Ellipsis",
  "Aside",
  "Main",
  "Label",
  "Details",
  "Term",
  "Time",
  "Viewport",
];

/**
 * Given a component name like "DialogTrigger", returns the root name "Dialog".
 * Returns undefined if the name doesn't match any known part suffix.
 */
export function getCompoundRoot(name: string): string | undefined {
  for (const suffix of PART_SUFFIXES) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      const root = name.slice(0, -suffix.length);
      if (root.length > 0 && /^[A-Z]/.test(root)) {
        return root;
      }
    }
  }
  return undefined;
}

/**
 * Groups component metadata into compound component groups.
 * A compound group requires at least the root + one part.
 */
export function groupCompoundComponents(
  components: readonly ComponentMeta[],
): readonly CompoundComponentMeta[] {
  const rootMap = new Map<string, ComponentMeta[]>();
  const standalone = new Set<string>();

  // First pass: identify potential roots and parts
  for (const comp of components) {
    const root = getCompoundRoot(comp.name);
    if (root) {
      const parts = rootMap.get(root) ?? [];
      parts.push(comp);
      rootMap.set(root, parts);
    } else {
      standalone.add(comp.name);
    }
  }

  // Second pass: build compound groups for roots that exist as components
  const groups: CompoundComponentMeta[] = [];
  for (const [rootName, parts] of rootMap) {
    // Only group if the root component itself exists
    const rootComp = components.find((c) => c.name === rootName);
    if (!rootComp) continue;
    if (parts.length === 0) continue;

    groups.push({
      name: rootName,
      packagePath: rootComp.packagePath,
      parts: [rootComp, ...parts.sort((a, b) => a.name.localeCompare(b.name))],
    });
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns all component names that belong to a compound group.
 */
export function getCompoundPartNames(group: CompoundComponentMeta): readonly string[] {
  return group.parts.map((p) => p.name);
}

/**
 * Checks if a component name is a part of any compound group.
 */
export function isCompoundPart(name: string, groups: readonly CompoundComponentMeta[]): boolean {
  return groups.some((g) => g.parts.some((p) => p.name === name && p.name !== g.name));
}
