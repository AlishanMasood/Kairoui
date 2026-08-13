import type { Meta, StoryObj } from "@storybook/react";
import { createElement, useState } from "react";
import { Radio } from "../../../../packages/core/src/components/radio/index";
import { RadioGroupContext } from "../../../../packages/core/src/components/selection/selection-context";
import type { RadioGroupContextValue } from "../../../../packages/core/src/components/selection/selection-context";

const meta = {
  title: "Components/Radio",
  component: Radio as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Radio value="option">Option</Radio>,
};

export const Checked: Story = {
  render: () => (
    <Radio value="yes" defaultChecked>
      Selected option
    </Radio>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Radio value="sm" size="sm">
        Small
      </Radio>
      <Radio value="md" size="md">
        Medium
      </Radio>
      <Radio value="lg" size="lg">
        Large
      </Radio>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Radio value="a" disabled>
        Disabled unchecked
      </Radio>
      <Radio value="b" disabled defaultChecked>
        Disabled checked
      </Radio>
    </div>
  ),
};

function RadioGroupDemo() {
  const [value, setValue] = useState("b");
  const ctx: RadioGroupContextValue = {
    value,
    onValueChange: setValue,
    name: "color",
    disabled: false,
    required: false,
  };
  return createElement(
    RadioGroupContext.Provider,
    { value: ctx },
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "8px" } },
      createElement(Radio, { value: "a" }, "Red"),
      createElement(Radio, { value: "b" }, "Green"),
      createElement(Radio, { value: "c" }, "Blue"),
    ),
  );
}
RadioGroupDemo.displayName = "RadioGroupDemo";

export const WithGroup: Story = {
  name: "With RadioGroup context",
  render: () => <RadioGroupDemo />,
};
