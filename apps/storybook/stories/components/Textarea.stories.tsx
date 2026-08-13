import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "../../../../packages/core/src/components/textarea/index";
import { Field } from "../../../../packages/core/src/components/field/field";
import { Label } from "../../../../packages/core/src/components/field/label";
import { FieldDescription } from "../../../../packages/core/src/components/field/field-description";
import { FieldError } from "../../../../packages/core/src/components/field/field-error";

const meta = {
  title: "Components/Textarea",
  component: Textarea as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Textarea placeholder="Enter message…" />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
      <Textarea size="sm" placeholder="Small" />
      <Textarea size="md" placeholder="Medium" />
      <Textarea size="lg" placeholder="Large" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => <Textarea placeholder="Disabled" disabled />,
};

export const ReadOnly: Story = {
  render: () => <Textarea value="Cannot edit this content" readOnly />,
};

export const ResizeNone: Story = {
  name: "resize=none",
  render: () => <Textarea placeholder="Cannot resize" resize="none" />,
};

export const WithField: Story = {
  name: "With Field",
  render: () => (
    <Field id="bio" required>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "400px" }}>
        <Label>Bio</Label>
        <Textarea placeholder="Tell us about yourself" rows={4} />
        <FieldDescription style={{ fontSize: "0.85em", color: "#666" }}>
          Max 500 characters
        </FieldDescription>
      </div>
    </Field>
  ),
};

export const WithError: Story = {
  name: "With error",
  render: () => (
    <Field id="feedback" validationState="invalid">
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "400px" }}>
        <Label>Feedback</Label>
        <Textarea rows={3} />
        <FieldError style={{ fontSize: "0.85em", color: "red" }}>Feedback is required</FieldError>
      </div>
    </Field>
  ),
};
