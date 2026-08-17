import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import {
  Combobox,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxContent,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
} from "./combobox";
import { Field } from "../field/field";
import { Label } from "../field/label";

afterEach(cleanup);

const fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry"];

function BasicCombobox({
  onValueChange,
  disabled,
}: {
  onValueChange?: (v: string) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const filtered = fruits.filter((f) => f.toLowerCase().includes(input.toLowerCase()));
  return (
    <Combobox
      onValueChange={onValueChange}
      inputValue={input}
      onInputValueChange={setInput}
      disabled={disabled}
    >
      <ComboboxInput data-testid="input" placeholder="Search fruits…" />
      <ComboboxTrigger data-testid="trigger" />
      <ComboboxClear data-testid="clear" />
      <ComboboxContent data-testid="content">
        {filtered.length > 0 ? (
          filtered.map((f) => (
            <ComboboxItem key={f} value={f.toLowerCase()} data-testid={`item-${f.toLowerCase()}`}>
              {f}
            </ComboboxItem>
          ))
        ) : (
          <ComboboxEmpty data-testid="empty" />
        )}
      </ComboboxContent>
    </Combobox>
  );
}
BasicCombobox.displayName = "BasicCombobox";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Combobox: rendering", () => {
  it("renders input with role=combobox", () => {
    render(<BasicCombobox />);
    expect(screen.getByTestId("input").getAttribute("role")).toBe("combobox");
  });

  it("has data-kui-component", () => {
    const { container } = render(<BasicCombobox />);
    expect(container.querySelector("[data-kui-component='Combobox']")).not.toBeNull();
  });

  it("input has aria-haspopup via aria-controls", () => {
    render(<BasicCombobox />);
    expect(screen.getByTestId("input").getAttribute("aria-controls")).toBeTruthy();
  });

  it("content is hidden when closed (before interaction)", () => {
    render(<BasicCombobox />);
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("shows placeholder", () => {
    render(<BasicCombobox />);
    expect(screen.getByTestId("input").getAttribute("placeholder")).toBe("Search fruits…");
  });
});

// ─── Open/Close ─────────────────────────────────────────────────────

describe("Combobox: open state", () => {
  it("opens on input focus", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("trigger toggles", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("content")).not.toBeNull();
    await user.click(screen.getByTestId("trigger"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Filtering ──────────────────────────────────────────────────────

describe("Combobox: filtering", () => {
  it("filters items based on input", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    await user.type(screen.getByTestId("input"), "ban");
    expect(screen.getByTestId("item-banana")).not.toBeNull();
    expect(screen.queryByTestId("item-apple")).toBeNull();
  });

  it("shows empty state when no match", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    await user.type(screen.getByTestId("input"), "zzz");
    expect(screen.getByTestId("empty")).not.toBeNull();
  });
});

// ─── Selection ──────────────────────────────────────────────────────

describe("Combobox: selection", () => {
  it("selects item on click", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicCombobox onValueChange={handler} />);
    await user.click(screen.getByTestId("input"));
    await user.click(screen.getByTestId("item-apple"));
    expect(handler).toHaveBeenCalledWith("apple");
  });

  it("closes after selection", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    await user.click(screen.getByTestId("item-banana"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("updates input value to selected label", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    await user.click(screen.getByTestId("item-banana"));
    expect(screen.getByTestId("input")).toHaveValue("Banana");
  });

  it("marks selected item with aria-selected", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    await user.click(screen.getByTestId("item-apple"));
    // Reopen to check
    await user.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("item-apple").getAttribute("aria-selected")).toBe("true");
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("Combobox: keyboard", () => {
  it("ArrowDown opens and highlights first item", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    screen.getByTestId("input").focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("item-apple").hasAttribute("data-highlighted")).toBe(true);
  });

  it("Enter selects highlighted item", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicCombobox onValueChange={handler} />);
    screen.getByTestId("input").focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(handler).toHaveBeenCalledWith("apple");
  });
});

// ─── Clear ──────────────────────────────────────────────────────────

describe("Combobox: clear", () => {
  it("clear button is hidden when empty", () => {
    render(<BasicCombobox />);
    expect(screen.queryByTestId("clear")).toBeNull();
  });

  it("clear button shows after selection", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    await user.click(screen.getByTestId("item-apple"));
    expect(screen.getByTestId("clear")).not.toBeNull();
  });

  it("clicking clear resets value and input", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox />);
    await user.click(screen.getByTestId("input"));
    await user.click(screen.getByTestId("item-apple"));
    await user.click(screen.getByTestId("clear"));
    expect(screen.getByTestId("input")).toHaveValue("");
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("Combobox: disabled", () => {
  it("disables input", () => {
    render(<BasicCombobox disabled />);
    expect(screen.getByTestId("input")).toBeDisabled();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<BasicCombobox disabled />);
    await user.click(screen.getByTestId("trigger"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("Combobox: form", () => {
  it("submits selected value", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      const [_input, setInput] = useState("");
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("fruit") as string;
          }}
        >
          <Combobox name="fruit" defaultValue="banana" onInputValueChange={setInput}>
            <ComboboxInput placeholder="Pick" />
            <ComboboxContent>
              <ComboboxItem value="apple">Apple</ComboboxItem>
              <ComboboxItem value="banana">Banana</ComboboxItem>
            </ComboboxContent>
          </Combobox>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBe("banana");
  });
});

// ─── Groups ─────────────────────────────────────────────────────────

describe("Combobox: groups", () => {
  it("renders group with role=group", () => {
    render(
      <Combobox open>
        <ComboboxInput placeholder="Search" />
        <ComboboxContent>
          <ComboboxGroup data-testid="group">
            <ComboboxLabel>Fruits</ComboboxLabel>
            <ComboboxItem value="apple">Apple</ComboboxItem>
          </ComboboxGroup>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByTestId("group").getAttribute("role")).toBe("group");
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("Combobox: Field", () => {
  it("gets disabled from Field", () => {
    render(
      <Field disabled>
        <Combobox>
          <ComboboxInput data-testid="input" placeholder="Pick" />
          <ComboboxContent>
            <ComboboxItem value="a">A</ComboboxItem>
          </ComboboxContent>
        </Combobox>
      </Field>,
    );
    expect(screen.getByTestId("input")).toBeDisabled();
  });

  it("gets aria-labelledby from Label", () => {
    render(
      <Field id="fruit">
        <Label>Fruit</Label>
        <Combobox>
          <ComboboxInput data-testid="input" placeholder="Pick" />
          <ComboboxContent>
            <ComboboxItem value="a">A</ComboboxItem>
          </ComboboxContent>
        </Combobox>
      </Field>,
    );
    expect(screen.getByTestId("input").getAttribute("aria-labelledby")).toBe("fruit-label");
  });
});

// ─── Refs ───────────────────────────────────────────────────────────

describe("Combobox: refs", () => {
  it("forwards ref on input", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Combobox>
        <ComboboxInput ref={ref} placeholder="Pick" />
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Combobox: SSR", () => {
  it("renders to string (closed)", () => {
    const html = renderToString(
      <Combobox name="fruit">
        <ComboboxInput placeholder="Search" />
        <ComboboxContent>
          <ComboboxItem value="apple">Apple</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(html).toContain('data-kui-component="Combobox"');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('name="fruit"');
    expect(html).not.toContain('role="listbox"');
  });

  it("renders to string (open)", () => {
    const html = renderToString(
      <Combobox open>
        <ComboboxInput placeholder="Search" />
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(html).toContain('role="listbox"');
    expect(html).toContain('role="option"');
  });
});
