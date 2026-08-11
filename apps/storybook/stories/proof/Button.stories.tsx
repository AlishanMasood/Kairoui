import type { Meta, StoryObj } from "@storybook/react";
import { Button, buttonStyleContract } from "../../../../packages/core/src/proof/button";
import { generateComponentCss } from "../../../../packages/core/src/composition/generate-css";

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

// ─── Styling Engine Stories ─────────────────────────────────────────

export const Appearances: Story = {
  name: "Variant: appearance",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button appearance="solid">Solid</Button>
      <Button appearance="outline">Outline</Button>
      <Button appearance="subtle">Subtle</Button>
    </div>
  ),
};

export const Sizes: Story = {
  name: "Variant: size",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const CombinedVariants: Story = {
  name: "Combined variants",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Button appearance="solid" size="sm">
          Solid SM
        </Button>
        <Button appearance="solid" size="md">
          Solid MD
        </Button>
        <Button appearance="solid" size="lg">
          Solid LG
        </Button>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Button appearance="outline" size="sm">
          Outline SM
        </Button>
        <Button appearance="outline" size="md">
          Outline MD
        </Button>
        <Button appearance="outline" size="lg">
          Outline LG
        </Button>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Button appearance="subtle" size="sm">
          Subtle SM
        </Button>
        <Button appearance="subtle" size="md">
          Subtle MD
        </Button>
        <Button appearance="subtle" size="lg">
          Subtle LG
        </Button>
      </div>
    </div>
  ),
};

export const DisabledStates: Story = {
  name: "Disabled with variants",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button disabled appearance="solid">
        Solid
      </Button>
      <Button disabled appearance="outline">
        Outline
      </Button>
      <Button disabled appearance="subtle">
        Subtle
      </Button>
    </div>
  ),
};

export const WithIconsAndVariants: Story = {
  name: "Icons + variants",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button startIcon={<span>★</span>} appearance="solid" size="sm">
        Star
      </Button>
      <Button endIcon={<span>→</span>} appearance="outline" size="md">
        Next
      </Button>
      <Button startIcon={<span>📎</span>} endIcon={<span>↗</span>} appearance="subtle" size="lg">
        Attach
      </Button>
    </div>
  ),
};

export const ConsumerOverride: Story = {
  name: "Consumer className + style",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <style>{`.custom-btn { box-shadow: 0 2px 4px rgba(0,0,0,0.2); }`}</style>
      <Button className="custom-btn">With shadow</Button>
      <Button style={{ borderRadius: "20px" }}>Pill shape</Button>
    </div>
  ),
};

export const GeneratedCss: Story = {
  name: "Generated CSS output",
  render: () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    return (
      <div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <Button appearance="solid">Solid</Button>
          <Button appearance="outline">Outline</Button>
          <Button appearance="subtle">Subtle</Button>
        </div>
        <pre
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: "16px",
            borderRadius: "4px",
            fontSize: "12px",
            overflow: "auto",
            maxHeight: "400px",
          }}
        >
          {css}
        </pre>
      </div>
    );
  },
};
