import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Infrastructure validation test — verifies React Testing Library,
 * jsdom environment, jest-dom matchers, and user-event are working.
 *
 * This is NOT a permanent KairoUI component. Remove once real components exist.
 */
function TestButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}>
      Click me
    </button>
  );
}

describe("react testing library infrastructure", () => {
  it("renders a React component in jsdom", () => {
    render(<TestButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("supports jest-dom matchers", () => {
    render(<TestButton onClick={() => {}} />);
    const button = screen.getByRole("button");
    expect(button).toBeVisible();
    expect(button).toHaveTextContent("Click me");
    expect(button).not.toBeDisabled();
  });

  it("supports user-event for interaction testing", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <TestButton
        onClick={() => {
          clicked = true;
        }}
      />,
    );

    await user.click(screen.getByRole("button"));
    expect(clicked).toBe(true);
  });

  it("supports keyboard interaction testing", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <TestButton
        onClick={() => {
          clicked = true;
        }}
      />,
    );

    const button = screen.getByRole("button");
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(clicked).toBe(true);
  });
});
