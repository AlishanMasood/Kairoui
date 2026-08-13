import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../../../../packages/core/src/components/checkbox/index";
import { Field } from "../../../../packages/core/src/components/field/field";
import { FieldError } from "../../../../packages/core/src/components/field/field-error";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Checkbox>Accept terms and conditions</Checkbox>,
};

export const Checked: Story = {
  render: () => <Checkbox defaultChecked>Receive email notifications</Checkbox>,
};

export const Indeterminate: Story = {
  render: () => <Checkbox indeterminate>Select all</Checkbox>,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Checkbox size="sm">Small</Checkbox>
      <Checkbox size="md">Medium</Checkbox>
      <Checkbox size="lg">Large</Checkbox>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Checkbox disabled>Disabled unchecked</Checkbox>
      <Checkbox disabled defaultChecked>
        Disabled checked
      </Checkbox>
    </div>
  ),
};

export const WithField: Story = {
  name: "With Field (invalid)",
  render: () => (
    <Field id="terms" required validationState="invalid">
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Checkbox>I agree to the terms</Checkbox>
        <FieldError style={{ fontSize: "0.85em", color: "red" }}>
          You must accept the terms to continue
        </FieldError>
      </div>
    </Field>
  ),
};
