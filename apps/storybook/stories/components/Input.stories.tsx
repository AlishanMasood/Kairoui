import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../../../../packages/core/src/components/input/index";
import { Field } from "../../../../packages/core/src/components/field/field";
import { Label } from "../../../../packages/core/src/components/field/label";
import { FieldDescription } from "../../../../packages/core/src/components/field/field-description";
import { FieldError } from "../../../../packages/core/src/components/field/field-error";

const meta = {
  title: "Components/Input",
  component: Input as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Input placeholder="Enter text…" />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "300px" }}>
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => <Input placeholder="Disabled" disabled />,
};

export const ReadOnly: Story = {
  render: () => <Input value="Cannot edit this" readOnly />,
};

export const WithField: Story = {
  name: "With Field",
  render: () => (
    <Field id="email" required>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "300px" }}>
        <Label>Email address</Label>
        <Input type="email" placeholder="you@example.com" />
        <FieldDescription style={{ fontSize: "0.85em", color: "#666" }}>
          We will never share your email.
        </FieldDescription>
      </div>
    </Field>
  ),
};

export const WithError: Story = {
  name: "With error",
  render: () => (
    <Field id="password" required validationState="invalid">
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "300px" }}>
        <Label>Password</Label>
        <Input type="password" />
        <FieldError style={{ fontSize: "0.85em", color: "red" }}>
          Password must be at least 8 characters
        </FieldError>
      </div>
    </Field>
  ),
};

export const Types: Story = {
  name: "Input types",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "300px" }}>
      <Input type="text" placeholder="Text" />
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Input type="url" placeholder="URL" />
      <Input type="tel" placeholder="Phone" />
      <Input type="number" placeholder="Number" />
    </div>
  ),
};
