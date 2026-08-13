import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "../../../../packages/core/src/components/switch/index";
import { Field } from "../../../../packages/core/src/components/field/field";
import { Label } from "../../../../packages/core/src/components/field/label";
import { FieldDescription } from "../../../../packages/core/src/components/field/field-description";

const meta = {
  title: "Components/Switch",
  component: Switch as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Switch>Enable notifications</Switch>,
};

export const Checked: Story = {
  render: () => <Switch defaultChecked>Dark mode</Switch>,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Switch size="sm">Small</Switch>
      <Switch size="md">Medium</Switch>
      <Switch size="lg">Large</Switch>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Switch disabled>Disabled off</Switch>
      <Switch disabled defaultChecked>
        Disabled on
      </Switch>
    </div>
  ),
};

export const WithField: Story = {
  name: "With Field",
  render: () => (
    <Field id="auto-save">
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Label>Auto-save</Label>
        <Switch>Enable automatic saving</Switch>
        <FieldDescription style={{ fontSize: "0.85em", color: "#666" }}>
          Your work will be saved every 30 seconds
        </FieldDescription>
      </div>
    </Field>
  ),
};
