import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../../../packages/core/src/components/button/index";

const meta = {
  title: "Components/Button",
  component: Button as React.ComponentType,
  parameters: {
    docs: {
      description: {
        component:
          "Primary action trigger. Supports polymorphic rendering, multiple appearances, sizes, icons, loading, and disabled states.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Button>Button</Button>,
};

export const Appearances: Story = {
  name: "Appearances",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button appearance="solid">Solid</Button>
      <Button appearance="outline">Outline</Button>
      <Button appearance="subtle">Subtle</Button>
      <Button appearance="ghost">Ghost</Button>
    </div>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithStartIcon: Story = {
  name: "With start icon",
  render: () => <Button startIcon={<span>★</span>}>Favorite</Button>,
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
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button disabled>Solid</Button>
      <Button disabled appearance="outline">
        Outline
      </Button>
      <Button disabled appearance="subtle">
        Subtle
      </Button>
      <Button disabled appearance="ghost">
        Ghost
      </Button>
    </div>
  ),
};

export const AsAnchor: Story = {
  name: "as='a'",
  render: () => (
    <Button as="a" href="https://example.com" target="_blank">
      Visit site
    </Button>
  ),
};

export const SubmitButton: Story = {
  name: "type='submit'",
  render: () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert("Submitted!");
      }}
    >
      <Button type="submit">Submit Form</Button>
    </form>
  ),
};

export const CombinedVariants: Story = {
  name: "Combined variants",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {(["solid", "outline", "subtle", "ghost"] as const).map((appearance) => (
        <div key={appearance} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <Button key={size} appearance={appearance} size={size}>
              {appearance} {size}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const WithCustomClassName: Story = {
  name: "Consumer className",
  render: () => (
    <>
      <style>{`.rounded-full { border-radius: 999px !important; }`}</style>
      <Button className="rounded-full">Pill Button</Button>
    </>
  ),
};

export const IconsWithSizes: Story = {
  name: "Icons + sizes",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button startIcon={<span>★</span>} size="sm">
        Small
      </Button>
      <Button startIcon={<span>★</span>} size="md">
        Medium
      </Button>
      <Button startIcon={<span>★</span>} size="lg">
        Large
      </Button>
    </div>
  ),
};
