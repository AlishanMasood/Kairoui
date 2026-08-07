import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "../../../../packages/core/src/proof/text";

const meta = {
  title: "Proof/Text",
  component: Text as React.ComponentType,
  parameters: {
    docs: {
      description: {
        component:
          "Internal proof component validating semantic polymorphism and typography-token consumption. NOT a production component.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Text>Default inline text (span)</Text>,
};

export const AsParagraph: Story = {
  name: "as='p'",
  render: () => (
    <Text as="p">
      This is paragraph text rendered as a semantic &lt;p&gt; element. It demonstrates that the Text
      component consumes typography tokens via CSS variables.
    </Text>
  ),
};

export const AsLabel: Story = {
  name: "as='label' with htmlFor",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <Text as="label" htmlFor="demo-input">
        Email address
      </Text>
      <input id="demo-input" type="email" placeholder="user@example.com" />
    </div>
  ),
};

export const AsStrong: Story = {
  name: "as='strong'",
  render: () => (
    <Text as="p">
      Regular text with <Text as="strong">strongly emphasized</Text> content inline.
    </Text>
  ),
};

export const AsHeadings: Story = {
  name: "Heading elements",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Text as="h1" style={{ fontSize: "2rem", fontWeight: 700 }}>
        Page Title (h1)
      </Text>
      <Text as="h2" style={{ fontSize: "1.5rem", fontWeight: 600 }}>
        Section Title (h2)
      </Text>
      <Text as="h3" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
        Subsection (h3)
      </Text>
    </div>
  ),
};

export const WithAriaLive: Story = {
  name: "Accessible announcements",
  render: () => (
    <Text as="p" role="status" aria-live="polite" aria-atomic="true">
      3 items updated
    </Text>
  ),
};

export const SemanticElements: Story = {
  name: "Various semantic targets",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Text as="p">Paragraph element</Text>
      <Text as="blockquote" style={{ borderLeft: "3px solid #ccc", paddingLeft: "12px" }}>
        Blockquote element
      </Text>
      <Text as="small">Small text element</Text>
      <Text as="em">Emphasized element</Text>
      <Text as="time" dateTime="2026-08-07">
        August 7, 2026
      </Text>
      <Text as="abbr" title="User Interface">
        UI
      </Text>
    </div>
  ),
};
