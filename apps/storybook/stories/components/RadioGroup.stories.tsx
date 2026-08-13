import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RadioGroup } from "../../../../packages/core/src/components/radio-group/index";
import { Radio } from "../../../../packages/core/src/components/radio/index";
import { Field } from "../../../../packages/core/src/components/field/field";
import { Label } from "../../../../packages/core/src/components/field/label";
import { FieldDescription } from "../../../../packages/core/src/components/field/field-description";
import { FieldError } from "../../../../packages/core/src/components/field/field-error";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup name="fruit" defaultValue="apple">
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Radio value="apple">Apple</Radio>
        <Radio value="banana">Banana</Radio>
        <Radio value="cherry">Cherry</Radio>
      </div>
    </RadioGroup>
  ),
};

function ControlledDemo() {
  const [value, setValue] = useState("md");
  return (
    <div>
      <RadioGroup name="size" value={value} onValueChange={setValue}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Radio value="sm">Small</Radio>
          <Radio value="md">Medium</Radio>
          <Radio value="lg">Large</Radio>
        </div>
      </RadioGroup>
      <p style={{ marginTop: "12px", fontSize: "0.85em", color: "#666" }}>Selected: {value}</p>
    </div>
  );
}
ControlledDemo.displayName = "ControlledDemo";

export const Controlled: Story = {
  render: () => <ControlledDemo />,
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup name="align" defaultValue="center" orientation="horizontal">
      <div style={{ display: "flex", gap: "16px" }}>
        <Radio value="left">Left</Radio>
        <Radio value="center">Center</Radio>
        <Radio value="right">Right</Radio>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup name="plan" defaultValue="free" disabled>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
        <Radio value="enterprise">Enterprise</Radio>
      </div>
    </RadioGroup>
  ),
};

export const WithField: Story = {
  name: "With Field",
  render: () => (
    <Field id="plan" required validationState="invalid">
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Label>Choose a plan</Label>
        <RadioGroup>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Radio value="free">Free</Radio>
            <Radio value="pro">Pro</Radio>
          </div>
        </RadioGroup>
        <FieldDescription style={{ fontSize: "0.85em", color: "#666" }}>
          You can change your plan later
        </FieldDescription>
        <FieldError style={{ fontSize: "0.85em", color: "red" }}>Please select a plan</FieldError>
      </div>
    </Field>
  ),
};
