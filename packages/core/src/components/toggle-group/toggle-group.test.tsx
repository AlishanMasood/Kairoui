import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import type { ToggleGroupType, ToggleGroupOrientation } from "./toggle-group";

afterEach(cleanup);

// ─── Rendering ──────────────────────────────────────────────────────

describe("ToggleGroup: rendering", () => {
  it("renders with role=group", () => {
    render(
      <ToggleGroup type="single" data-testid="group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("group").getAttribute("role")).toBe("group");
  });

  it("has data-kui-component", () => {
    render(
      <ToggleGroup type="single" data-testid="group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("group").getAttribute("data-kui-component")).toBe("ToggleGroup");
  });

  it("items have aria-pressed", () => {
    render(
      <ToggleGroup type="single" defaultValue="a">
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" data-testid="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("a").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("b").getAttribute("aria-pressed")).toBe("false");
  });

  it("has aria-orientation", () => {
    render(
      <ToggleGroup type="single" data-testid="group" orientation="vertical">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("group").getAttribute("aria-orientation")).toBe("vertical");
  });
});

// ─── Single selection ───────────────────────────────────────────────

describe("ToggleGroup: single", () => {
  it("selects item on click", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" onValueChange={handler}>
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" data-testid="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByTestId("b"));
    expect(handler).toHaveBeenCalledWith("b");
  });

  it("deselects on second click", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" defaultValue="a" onValueChange={handler}>
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByTestId("a"));
    expect(handler).toHaveBeenCalledWith("");
  });

  it("switches selection", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" defaultValue="a">
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" data-testid="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByTestId("b"));
    expect(screen.getByTestId("a").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByTestId("b").getAttribute("aria-pressed")).toBe("true");
  });

  it("controlled single", async () => {
    const handler = vi.fn();
    function Ctrl() {
      const [v, setV] = useState("a");
      return (
        <ToggleGroup
          type="single"
          value={v}
          onValueChange={(val) => {
            setV(val);
            handler(val);
          }}
        >
          <ToggleGroupItem value="a" data-testid="a">
            A
          </ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b">
            B
          </ToggleGroupItem>
        </ToggleGroup>
      );
    }
    Ctrl.displayName = "Ctrl";
    const user = userEvent.setup();
    render(<Ctrl />);
    await user.click(screen.getByTestId("b"));
    expect(handler).toHaveBeenCalledWith("b");
    expect(screen.getByTestId("b").getAttribute("aria-pressed")).toBe("true");
  });
});

// ─── Multiple selection ─────────────────────────────────────────────

describe("ToggleGroup: multiple", () => {
  it("toggles items independently", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="multiple" onValueChange={handler}>
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" data-testid="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByTestId("a"));
    expect(handler).toHaveBeenCalledWith(["a"]);
    await user.click(screen.getByTestId("b"));
    expect(handler).toHaveBeenCalledWith(["a", "b"]);
  });

  it("deselects on second click", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="multiple" defaultValue={["a", "b"]} onValueChange={handler}>
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" data-testid="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByTestId("a"));
    expect(handler).toHaveBeenCalledWith(["b"]);
  });

  it("controlled multiple", async () => {
    const handler = vi.fn();
    function Ctrl() {
      const [v, setV] = useState(["a"]);
      return (
        <ToggleGroup
          type="multiple"
          value={v}
          onValueChange={(val) => {
            setV(val);
            handler(val);
          }}
        >
          <ToggleGroupItem value="a" data-testid="a">
            A
          </ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b">
            B
          </ToggleGroupItem>
        </ToggleGroup>
      );
    }
    Ctrl.displayName = "Ctrl";
    const user = userEvent.setup();
    render(<Ctrl />);
    await user.click(screen.getByTestId("b"));
    expect(handler).toHaveBeenCalledWith(["a", "b"]);
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("ToggleGroup: disabled", () => {
  it("disables all items", () => {
    render(
      <ToggleGroup type="single" disabled>
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" data-testid="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("a")).toBeDisabled();
    expect(screen.getByTestId("b")).toBeDisabled();
  });

  it("sets data-disabled on group", () => {
    render(
      <ToggleGroup type="single" disabled data-testid="group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("group").hasAttribute("data-disabled")).toBe(true);
  });

  it("does not toggle when disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" disabled onValueChange={handler}>
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByTestId("a"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("individual item disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" onValueChange={handler}>
        <ToggleGroupItem value="a" data-testid="a" disabled>
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" data-testid="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByTestId("a"));
    expect(handler).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("b"));
    expect(handler).toHaveBeenCalledWith("b");
  });
});

// ─── Variants ───────────────────────────────────────────────────────

describe("ToggleGroup: variants", () => {
  it("propagates size to items", () => {
    render(
      <ToggleGroup type="single" size="sm">
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("a").className).toContain("kui-toggle--sm");
  });

  it("propagates appearance to items", () => {
    render(
      <ToggleGroup type="single" appearance="ghost">
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("a").className).toContain("kui-toggle--ghost");
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("ToggleGroup: keyboard", () => {
  it("Enter toggles item", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    screen.getByTestId("a").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("a").getAttribute("aria-pressed")).toBe("true");
  });

  it("Space toggles item", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" data-testid="a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    screen.getByTestId("a").focus();
    await user.keyboard(" ");
    expect(screen.getByTestId("a").getAttribute("aria-pressed")).toBe("true");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("ToggleGroup: refs", () => {
  it("forwards ref on group", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ToggleGroup type="single" ref={ref}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref on item", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" ref={ref}>
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("ToggleGroup: SSR", () => {
  it("renders single to string", () => {
    const html = renderToString(
      <ToggleGroup type="single" defaultValue="b">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(html).toContain('data-kui-component="ToggleGroup"');
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("renders multiple to string", () => {
    const html = renderToString(
      <ToggleGroup type="multiple" defaultValue={["a", "b"]}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    const count = (html.match(/aria-pressed="true"/g) ?? []).length;
    expect(count).toBe(2);
  });
});

// ─── Types ──────────────────────────────────────────────────────────

describe("ToggleGroup: types", () => {
  it("ToggleGroupType is correct union", () => {
    expectTypeOf<ToggleGroupType>().toEqualTypeOf<"single" | "multiple">();
  });

  it("ToggleGroupOrientation is correct union", () => {
    expectTypeOf<ToggleGroupOrientation>().toEqualTypeOf<"horizontal" | "vertical">();
  });
});
