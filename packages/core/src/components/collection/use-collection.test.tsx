import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useCollection, CollectionContext, useCollectionContext } from "./use-collection";
import { useCollectionItem } from "./use-collection-item";
import { resolveNextItem } from "./collection-navigation";
import type { RegisteredItem } from "./use-collection";

afterEach(cleanup);

// ─── Test fixtures ──────────────────────────────────────────────────

function CollectionRoot({ children }: { children: React.ReactNode }) {
  const collection = useCollection();
  return createElement(
    CollectionContext.Provider,
    { value: collection },
    createElement("div", { "data-testid": "root", "data-count": collection.count }, children),
  );
}
CollectionRoot.displayName = "CollectionRoot";

function Item({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  const id = useCollectionItem({ value, label, disabled });
  return createElement("div", { "data-testid": `item-${value}`, "data-id": id }, label);
}
Item.displayName = "Item";

function CollectionConsumer({ testId = "consumer" }: { testId?: string }) {
  const ctx = useCollectionContext();
  return createElement(
    "div",
    { "data-testid": testId, "data-count": ctx?.count ?? 0 },
    JSON.stringify(ctx?.items.map((i) => i.value)),
  );
}
CollectionConsumer.displayName = "CollectionConsumer";

// ─── useCollection ──────────────────────────────────────────────────

describe("useCollection: basic", () => {
  it("starts with empty items", () => {
    const { getByTestId } = render(
      createElement(CollectionRoot, null, createElement(CollectionConsumer)),
    );
    expect(getByTestId("consumer").getAttribute("data-count")).toBe("0");
  });

  it("items register on mount", async () => {
    const { getByTestId } = render(
      createElement(
        CollectionRoot,
        null,
        createElement(Item, { value: "a", label: "A" }),
        createElement(Item, { value: "b", label: "B" }),
        createElement(CollectionConsumer),
      ),
    );
    await waitFor(() => {
      expect(getByTestId("consumer").getAttribute("data-count")).toBe("2");
    });
    expect(getByTestId("consumer").textContent).toContain('"a"');
    expect(getByTestId("consumer").textContent).toContain('"b"');
  });

  it("items unregister on unmount", async () => {
    const { getByTestId, rerender } = render(
      createElement(
        CollectionRoot,
        null,
        createElement(Item, { value: "a", label: "A" }),
        createElement(Item, { value: "b", label: "B" }),
        createElement(CollectionConsumer),
      ),
    );
    await waitFor(() => {
      expect(getByTestId("consumer").getAttribute("data-count")).toBe("2");
    });

    rerender(
      createElement(
        CollectionRoot,
        null,
        createElement(Item, { value: "a", label: "A" }),
        createElement(CollectionConsumer),
      ),
    );
    await waitFor(() => {
      expect(getByTestId("consumer").getAttribute("data-count")).toBe("1");
    });
    expect(getByTestId("consumer").textContent).not.toContain('"b"');
  });

  it("preserves registration order", async () => {
    const { getByTestId } = render(
      createElement(
        CollectionRoot,
        null,
        createElement(Item, { value: "c", label: "C" }),
        createElement(Item, { value: "a", label: "A" }),
        createElement(Item, { value: "b", label: "B" }),
        createElement(CollectionConsumer),
      ),
    );
    await waitFor(() => {
      expect(getByTestId("consumer").getAttribute("data-count")).toBe("3");
    });
    const text = getByTestId("consumer").textContent;
    const cIdx = text.indexOf('"c"');
    const aIdx = text.indexOf('"a"');
    const bIdx = text.indexOf('"b"');
    expect(cIdx).toBeLessThan(aIdx);
    expect(aIdx).toBeLessThan(bIdx);
  });
});

// ─── useCollection: lookup ──────────────────────────────────────────

describe("useCollection: lookup", () => {
  function LookupTest() {
    const collection = useCollection();
    return createElement(
      CollectionContext.Provider,
      { value: collection },
      createElement(Item, { value: "x", label: "X" }),
      createElement(Item, { value: "y", label: "Y", disabled: true }),
      createElement("div", {
        "data-testid": "lookup",
        "data-by-value": collection.getByValue("x")?.label ?? "none",
        "data-enabled-count": String(collection.getEnabledItems().length),
      }),
    );
  }
  LookupTest.displayName = "LookupTest";

  it("getByValue finds registered item", async () => {
    const { getByTestId } = render(createElement(LookupTest));
    await waitFor(() => {
      expect(getByTestId("lookup").getAttribute("data-by-value")).toBe("X");
    });
  });

  it("getEnabledItems excludes disabled", async () => {
    const { getByTestId } = render(createElement(LookupTest));
    await waitFor(() => {
      expect(getByTestId("lookup").getAttribute("data-enabled-count")).toBe("1");
    });
  });
});

// ─── useCollection: getById ─────────────────────────────────────────

describe("useCollection: getById", () => {
  function IdTest() {
    const collection = useCollection();
    const items = collection.items;
    const firstId = items[0]?.id;
    const found = firstId ? collection.getById(firstId) : undefined;
    return createElement(
      CollectionContext.Provider,
      { value: collection },
      createElement(Item, { value: "z", label: "Z" }),
      createElement("div", {
        "data-testid": "id-lookup",
        "data-found": found?.value ?? "none",
      }),
    );
  }
  IdTest.displayName = "IdTest";

  it("getById finds item by generated ID", async () => {
    const { getByTestId } = render(createElement(IdTest));
    await waitFor(() => {
      expect(getByTestId("id-lookup").getAttribute("data-found")).toBe("z");
    });
  });
});

// ─── useCollectionItem: ID generation ───────────────────────────────

describe("useCollectionItem: ID generation", () => {
  it("generates a unique ID per item", async () => {
    const { getByTestId } = render(
      createElement(
        CollectionRoot,
        null,
        createElement(Item, { value: "a", label: "A" }),
        createElement(Item, { value: "b", label: "B" }),
      ),
    );
    await waitFor(() => {
      const idA = getByTestId("item-a").getAttribute("data-id");
      const idB = getByTestId("item-b").getAttribute("data-id");
      expect(idA).toBeTruthy();
      expect(idB).toBeTruthy();
      expect(idA).not.toBe(idB);
    });
  });

  it("ID contains kui-item prefix", () => {
    const { getByTestId } = render(
      createElement(CollectionRoot, null, createElement(Item, { value: "x", label: "X" })),
    );
    const id = getByTestId("item-x").getAttribute("data-id")!;
    expect(id).toContain("kui-item");
  });
});

// ─── resolveNextItem ────────────────────────────────────────────────

describe("resolveNextItem", () => {
  const items: RegisteredItem[] = [
    { value: "a", label: "A", id: "id-a" },
    { value: "b", label: "B", id: "id-b", disabled: true },
    { value: "c", label: "C", id: "id-c" },
    { value: "d", label: "D", id: "id-d" },
  ];

  it("first returns first enabled item", () => {
    expect(resolveNextItem(items, undefined, "first")?.value).toBe("a");
  });

  it("last returns last enabled item", () => {
    expect(resolveNextItem(items, undefined, "last")?.value).toBe("d");
  });

  it("next from undefined returns first enabled", () => {
    expect(resolveNextItem(items, undefined, "next")?.value).toBe("a");
  });

  it("previous from undefined returns last enabled", () => {
    expect(resolveNextItem(items, undefined, "previous")?.value).toBe("d");
  });

  it("next skips disabled items", () => {
    expect(resolveNextItem(items, "a", "next")?.value).toBe("c");
  });

  it("previous skips disabled items", () => {
    expect(resolveNextItem(items, "c", "previous")?.value).toBe("a");
  });

  it("next wraps around at end", () => {
    expect(resolveNextItem(items, "d", "next")?.value).toBe("a");
  });

  it("previous wraps around at start", () => {
    expect(resolveNextItem(items, "a", "previous")?.value).toBe("d");
  });

  it("returns undefined for empty list", () => {
    expect(resolveNextItem([], "a", "next")).toBeUndefined();
  });

  it("returns undefined when all items disabled", () => {
    const allDisabled: RegisteredItem[] = [{ value: "x", label: "X", id: "x", disabled: true }];
    expect(resolveNextItem(allDisabled, undefined, "next")).toBeUndefined();
  });

  it("handles unknown current value gracefully", () => {
    expect(resolveNextItem(items, "unknown", "next")?.value).toBe("a");
  });
});

// ─── Multiple collections are isolated ──────────────────────────────

describe("Collection: isolation", () => {
  it("two collections have independent items", async () => {
    const { getByTestId } = render(
      createElement(
        "div",
        null,
        createElement(
          CollectionRoot,
          null,
          createElement(Item, { value: "a", label: "A" }),
          createElement(CollectionConsumer, { testId: "c1" }),
        ),
        createElement(
          CollectionRoot,
          null,
          createElement(Item, { value: "x", label: "X" }),
          createElement(Item, { value: "y", label: "Y" }),
          createElement(CollectionConsumer, { testId: "c2" }),
        ),
      ),
    );
    await waitFor(() => {
      expect(getByTestId("c1").getAttribute("data-count")).toBe("1");
    });
    await waitFor(() => {
      expect(getByTestId("c2").getAttribute("data-count")).toBe("2");
    });
  });
});

// ─── SSR safety ─────────────────────────────────────────────────────

describe("Collection: SSR", () => {
  it("renders without errors on server", () => {
    const html = renderToString(
      createElement(
        CollectionRoot,
        null,
        createElement(Item, { value: "a", label: "A" }),
        createElement(Item, { value: "b", label: "B" }),
      ),
    );
    expect(html).toContain("data-testid");
    expect(html).toContain("item-a");
    expect(html).toContain("item-b");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Collection: Strict Mode", () => {
  it("renders correctly in StrictMode", async () => {
    const { getByTestId } = render(
      createElement(
        StrictMode,
        null,
        createElement(
          CollectionRoot,
          null,
          createElement(Item, { value: "a", label: "A" }),
          createElement(Item, { value: "b", label: "B" }),
          createElement(CollectionConsumer),
        ),
      ),
    );
    await waitFor(() => {
      expect(getByTestId("consumer").getAttribute("data-count")).toBe("2");
    });
  });
});
