import { describe, it, expectTypeOf } from "vitest";
import type {
  CommandFilter,
  CommandItem,
  CommandItemId,
  CommandPageId,
  CommandRootProps,
  CommandState,
} from "./command-types";

describe("CommandItem contract", () => {
  it("exposes id / groupId / pageId / searchText / keywords / disabled / onSelect", () => {
    expectTypeOf<CommandItem["id"]>().toEqualTypeOf<CommandItemId>();
    expectTypeOf<CommandItem["groupId"]>().toEqualTypeOf<string | null>();
    expectTypeOf<CommandItem["pageId"]>().toEqualTypeOf<CommandPageId | null>();
    expectTypeOf<CommandItem["searchText"]>().toEqualTypeOf<string>();
    expectTypeOf<CommandItem["keywords"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<CommandItem["disabled"]>().toEqualTypeOf<boolean>();
    expectTypeOf<CommandItem["onSelect"]>().toEqualTypeOf<() => void>();
  });
});

describe("CommandFilter contract", () => {
  it("takes (item, query) and returns boolean", () => {
    expectTypeOf<CommandFilter>().toEqualTypeOf<(item: CommandItem, query: string) => boolean>();
  });
});

describe("CommandState contract", () => {
  it("exposes open / query / highlightedId / pageStack", () => {
    expectTypeOf<CommandState["open"]>().toEqualTypeOf<boolean>();
    expectTypeOf<CommandState["query"]>().toEqualTypeOf<string>();
    expectTypeOf<CommandState["highlightedId"]>().toEqualTypeOf<CommandItemId | null>();
    expectTypeOf<CommandState["pageStack"]>().toEqualTypeOf<readonly CommandPageId[]>();
  });
});

describe("CommandRootProps contract", () => {
  it("carries controlled/uncontrolled pairs for every state slice", () => {
    expectTypeOf<CommandRootProps["open"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CommandRootProps["defaultOpen"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CommandRootProps["onOpenChange"]>().toEqualTypeOf<
      ((open: boolean) => void) | undefined
    >();

    expectTypeOf<CommandRootProps["query"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CommandRootProps["defaultQuery"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CommandRootProps["onQueryChange"]>().toEqualTypeOf<
      ((query: string) => void) | undefined
    >();

    expectTypeOf<CommandRootProps["pageStack"]>().toEqualTypeOf<
      readonly CommandPageId[] | undefined
    >();
    expectTypeOf<CommandRootProps["onPageStackChange"]>().toEqualTypeOf<
      ((pages: readonly CommandPageId[]) => void) | undefined
    >();
  });

  it("filter is a CommandFilter or undefined", () => {
    expectTypeOf<CommandRootProps["filter"]>().toEqualTypeOf<CommandFilter | undefined>();
  });
});
