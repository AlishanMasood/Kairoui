import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../../../packages/core/src/proof/button";

const meta = {
  title: "Proof/Button",
  component: Button as React.ComponentType,
  parameters: {
    docs: {
      description: {
        component:
          "Internal proof component validating interactive composition, slots, accessibility, and event infrastructure. NOT a production component.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Button>Save</Button>,
};

export const WithStartIcon: Story = {
  name: "With start icon",
  render: () => <Button startIcon={<span>★</span>}>Save</Button>,
};

export const WithEndIcon: Story = {
  name: "With end icon",
  render: () => <Button endIcon={<span>→</span>}>Next</Button>,
};

export const WithBothIcons: Story = {
  name: "With both icons",
  render: () => (
    <Button startIcon={<span>📎</span>} endIcon={<span>↗</span>}>
      Attach
    </Button>
  ),
};

export const Loading: Story = {
  render: () => <Button loading>Saving…</Button>,
};

export const Disabled: Story = {
  render: () => <Button disabled>Disabled</Button>,
};

export const AsAnchor: Story = {
  name: "as='a'",
  render: () => (
    <Button as="a" href="/reports" style={{ textDecoration: "none" }}>
      Reports
    </Button>
  ),
};

export const SubmitButton: Story = {
  name: "type='submit'",
  render: () => <Button type="submit">Submit Form</Button>,
};

export const States: Story = {
  name: "All states",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
};

export const WithAriaExpanded: Story = {
  name: "ARIA expanded",
  render: () => (
    <Button aria-expanded="false" aria-controls="dropdown-menu">
      Menu ▾
    </Button>
  ),
};
