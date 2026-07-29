import { describe, it, expect, vi } from "vitest";
import { render, screen, createUser, createPortalContainer } from "./index";
import { assertHasFocus, assertFocusOrder, tabTo, pressKey } from "./keyboard";
import { axeCheck } from "./a11y";
import type { ReactNode } from "react";

function TestButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}>
      Test
    </button>
  );
}

function TestInput({ label }: { label: string }) {
  return (
    <label>
      {label}
      <input type="text" />
    </label>
  );
}

describe("render", () => {
  it("renders a component and returns RTL result", () => {
    const { getByRole } = render(<TestButton />);
    expect(getByRole("button")).toBeInTheDocument();
  });

  it("returns a pre-configured user-event instance", () => {
    const { user } = render(<TestButton />);
    expect(user).toBeDefined();
    expect(typeof user.click).toBe("function");
    expect(typeof user.keyboard).toBe("function");
  });

  it("user-event instance works for interactions", async () => {
    const onClick = vi.fn();
    const { user } = render(<TestButton onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("accepts a custom wrapper for providers", () => {
    function CustomProvider({ children }: { children: ReactNode }) {
      return <div data-testid="custom-provider">{children}</div>;
    }

    render(<TestButton />, { wrapper: CustomProvider });
    expect(screen.getByTestId("custom-provider")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("createUser", () => {
  it("creates a standalone user-event instance", () => {
    const user = createUser();
    expect(typeof user.click).toBe("function");
    expect(typeof user.tab).toBe("function");
    expect(typeof user.keyboard).toBe("function");
  });
});

describe("keyboard helpers", () => {
  it("assertHasFocus verifies element focus", () => {
    render(<TestInput label="Name" />);
    const input = screen.getByLabelText("Name");
    input.focus();
    assertHasFocus(input);
  });

  it("tabTo moves focus and returns active element", async () => {
    render(
      <div>
        <TestInput label="First" />
        <TestInput label="Second" />
      </div>,
    );

    const active = await tabTo({ times: 1 });
    expect(active).toBe(screen.getByLabelText("First"));
  });

  it("tabTo supports shift-tab for reverse navigation", async () => {
    render(
      <div>
        <TestInput label="First" />
        <TestInput label="Second" />
      </div>,
    );

    // Tab forward twice, then back once
    await tabTo({ times: 2 });
    const active = await tabTo({ times: 1, shift: true });
    expect(active).toBe(screen.getByLabelText("First"));
  });

  it("assertFocusOrder verifies sequential tab order", async () => {
    render(
      <div>
        <TestInput label="A" />
        <TestInput label="B" />
        <TestInput label="C" />
      </div>,
    );

    await assertFocusOrder([
      screen.getByLabelText("A"),
      screen.getByLabelText("B"),
      screen.getByLabelText("C"),
    ]);
  });

  it("pressKey simulates key presses", async () => {
    const onClick = vi.fn();
    render(<TestButton onClick={onClick} />);
    screen.getByRole("button").focus();
    await pressKey("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("portal helpers", () => {
  it("createPortalContainer creates a DOM element", () => {
    const container = createPortalContainer("my-portal");
    expect(container).toBeInstanceOf(HTMLElement);
    expect(container.id).toBe("my-portal");
    expect(document.body.contains(container)).toBe(true);
  });

  it("portal containers are cleaned up after each test", () => {
    // Container from previous test should no longer exist
    expect(document.getElementById("my-portal")).toBeNull();
  });

  it("createPortalContainer works without an id", () => {
    const container = createPortalContainer();
    expect(container.getAttribute("data-testid")).toBe("portal-container");
    expect(document.body.contains(container)).toBe(true);
  });
});

describe("axeCheck extension point", () => {
  it("returns no violations (placeholder)", async () => {
    render(<TestButton />);
    const result = await axeCheck(document.body);
    expect(result.violations).toHaveLength(0);
  });
});
