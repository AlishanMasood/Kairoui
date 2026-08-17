import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "./select";
import { Field } from "../field/field";
import { Label } from "../field/label";

afterEach(cleanup);

function BasicSelect({
  value,
  defaultValue,
  onValueChange,
  disabled,
  open,
  placeholder = "Pick one",
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  disabled?: boolean;
  open?: boolean;
  placeholder?: string;
}) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      open={open}
    >
      <SelectTrigger placeholder={placeholder} data-testid="trigger" />
      <SelectContent data-testid="content">
        <SelectItem value="apple" data-testid="item-apple">
          Apple
        </SelectItem>
        <SelectItem value="banana" data-testid="item-banana">
          Banana
        </SelectItem>
        <SelectItem value="cherry" disabled data-testid="item-cherry">
          Cherry
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
BasicSelect.displayName = "BasicSelect";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Select: rendering", () => {
  it("renders trigger button", () => {
    render(<BasicSelect />);
    expect(screen.getByTestId("trigger").tagName).toBe("BUTTON");
  });

  it("has data-kui-component on root", () => {
    const { container } = render(<BasicSelect />);
    expect(container.querySelector("[data-kui-component='Select']")).not.toBeNull();
  });

  it("trigger has role=combobox", () => {
    render(<BasicSelect />);
    expect(screen.getByTestId("trigger").getAttribute("role")).toBe("combobox");
  });

  it("trigger has aria-haspopup=listbox", () => {
    render(<BasicSelect />);
    expect(screen.getByTestId("trigger").getAttribute("aria-haspopup")).toBe("listbox");
  });

  it("shows placeholder when no value", () => {
    render(<BasicSelect placeholder="Choose…" />);
    expect(screen.getByTestId("trigger").textContent).toContain("Choose…");
  });

  it("content is hidden when closed", () => {
    render(<BasicSelect />);
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("content shows when open=true", () => {
    render(<BasicSelect open />);
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("content has role=listbox", () => {
    render(<BasicSelect open />);
    expect(screen.getByTestId("content").getAttribute("role")).toBe("listbox");
  });

  it("items have role=option", () => {
    render(<BasicSelect open />);
    expect(screen.getByTestId("item-apple").getAttribute("role")).toBe("option");
  });
});

// ─── Open/Close ─────────────────────────────────────────────────────

describe("Select: open state", () => {
  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    await user.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("closes on trigger click when open", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    await user.click(screen.getByTestId("trigger"));
    await user.click(screen.getByTestId("trigger"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("opens on ArrowDown", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    screen.getByTestId("trigger").focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("opens on Enter", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    screen.getByTestId("trigger").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("opens on Space", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    screen.getByTestId("trigger").focus();
    await user.keyboard(" ");
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    await user.click(screen.getByTestId("trigger"));
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Selection ──────────────────────────────────────────────────────

describe("Select: selection", () => {
  it("selects item on click", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSelect onValueChange={handler} />);
    await user.click(screen.getByTestId("trigger"));
    await user.click(screen.getByTestId("item-apple"));
    expect(handler).toHaveBeenCalledWith("apple");
  });

  it("closes after selection", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    await user.click(screen.getByTestId("trigger"));
    await user.click(screen.getByTestId("item-apple"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("does not select disabled items", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSelect onValueChange={handler} />);
    await user.click(screen.getByTestId("trigger"));
    await user.click(screen.getByTestId("item-cherry"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("marks selected item with aria-selected", () => {
    render(<BasicSelect defaultValue="banana" open />);
    expect(screen.getByTestId("item-banana").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("item-apple").getAttribute("aria-selected")).toBe("false");
  });
});

// ─── Controlled ─────────────────────────────────────────────────────

describe("Select: controlled", () => {
  it("reflects controlled value", () => {
    render(<BasicSelect value="banana" open />);
    expect(screen.getByTestId("item-banana").getAttribute("aria-selected")).toBe("true");
  });

  it("calls onValueChange", async () => {
    const handler = vi.fn();
    function Controlled() {
      const [v, setV] = useState("apple");
      return (
        <BasicSelect
          value={v}
          onValueChange={(val) => {
            setV(val);
            handler(val);
          }}
        />
      );
    }
    Controlled.displayName = "Controlled";
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByTestId("trigger"));
    await user.click(screen.getByTestId("item-banana"));
    expect(handler).toHaveBeenCalledWith("banana");
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("Select: disabled", () => {
  it("disables trigger", () => {
    render(<BasicSelect disabled />);
    expect(screen.getByTestId("trigger")).toBeDisabled();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<BasicSelect disabled />);
    await user.click(screen.getByTestId("trigger"));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("disabled items have aria-disabled", () => {
    render(<BasicSelect open />);
    expect(screen.getByTestId("item-cherry").getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("Select: form", () => {
  it("renders hidden input when name provided", () => {
    const { container } = render(
      <Select name="fruit" defaultValue="apple">
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden).not.toBeNull();
    expect(hidden.name).toBe("fruit");
    expect(hidden.value).toBe("apple");
  });

  it("submits value with form", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("fruit") as string;
          }}
        >
          <Select name="fruit" defaultValue="banana">
            <SelectTrigger placeholder="Pick" />
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectContent>
          </Select>
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

// ─── Groups and separators ──────────────────────────────────────────

describe("Select: groups", () => {
  it("renders group with role=group", () => {
    render(
      <Select open>
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectGroup data-testid="group">
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectGroup>
          <SelectSeparator data-testid="sep" />
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("group").getAttribute("role")).toBe("group");
  });

  it("renders separator with role=separator", () => {
    render(
      <Select open>
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectSeparator data-testid="sep" />
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId("sep").getAttribute("role")).toBe("separator");
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("Select: Field integration", () => {
  it("gets disabled from Field", () => {
    render(
      <Field disabled>
        <Select>
          <SelectTrigger data-testid="trigger" placeholder="Pick" />
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      </Field>,
    );
    expect(screen.getByTestId("trigger")).toBeDisabled();
  });

  it("gets aria-labelledby from Field + Label", () => {
    render(
      <Field id="fruit">
        <Label>Fruit</Label>
        <Select>
          <SelectTrigger data-testid="trigger" placeholder="Pick" />
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      </Field>,
    );
    expect(screen.getByTestId("trigger").getAttribute("aria-labelledby")).toBe("fruit-label");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Select: refs", () => {
  it("forwards ref on trigger", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Select>
        <SelectTrigger ref={ref} placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Select: SSR", () => {
  it("renders to string (closed)", () => {
    const html = renderToString(
      <Select name="fruit" defaultValue="apple">
        <SelectTrigger placeholder="Pick a fruit" />
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(html).toContain('data-kui-component="Select"');
    expect(html).toContain('data-kui-component="SelectTrigger"');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('name="fruit"');
    expect(html).toContain('value="apple"');
    // Content should not render when closed
    expect(html).not.toContain('role="listbox"');
  });

  it("renders to string (open)", () => {
    const html = renderToString(
      <Select open>
        <SelectTrigger placeholder="Pick" />
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(html).toContain('role="listbox"');
    expect(html).toContain('role="option"');
  });
});
