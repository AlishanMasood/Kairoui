import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useEffect, useState } from "react";

// Internal proof component — imported directly (not from public API)
// This validates the composition architecture end-to-end in Storybook
import { Box, boxStyleContract } from "../../../../packages/core/src/proof/box";
import { generateComponentCss } from "../../../../packages/core/src/composition/generate-css";

const meta = {
  title: "Proof/Box",
  component: Box as React.ComponentType,
  parameters: {
    docs: {
      description: {
        component:
          "Internal proof component validating the KairoUI composition architecture. NOT a production component.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Box style={{ padding: "16px", border: "1px solid #ccc" }}>Default Box (div)</Box>,
};

export const AsSection: Story = {
  name: "as='section'",
  render: () => (
    <Box as="section" style={{ padding: "16px", background: "#f5f5f5" }}>
      Rendered as &lt;section&gt;
    </Box>
  ),
};

export const AsAnchor: Story = {
  name: "as='a'",
  render: () => (
    <Box as="a" href="/reports" style={{ color: "blue", textDecoration: "underline" }}>
      Link to /reports
    </Box>
  ),
};

export const AsButton: Story = {
  name: "as='button'",
  render: () => (
    <Box
      as="button"
      type="button"
      onClick={() => {
        alert("Clicked!");
      }}
      style={{ padding: "8px 16px", cursor: "pointer" }}
    >
      Click me
    </Box>
  ),
};

export const WithAriaAttributes: Story = {
  name: "ARIA attributes",
  render: () => (
    <Box
      as="button"
      role="switch"
      aria-checked="false"
      aria-label="Toggle notifications"
      style={{ padding: "8px 16px" }}
    >
      Toggle
    </Box>
  ),
};

export const WithRef: Story = {
  name: "Ref forwarding",
  render: () => {
    const RefDemo = () => {
      const ref = useRef<HTMLDivElement>(null);
      const [info, setInfo] = useState("Measuring...");
      useEffect(() => {
        if (ref.current) {
          setInfo(
            `tagName: ${ref.current.tagName}, offsetWidth: ${String(ref.current.offsetWidth)}px`,
          );
        }
      }, []);
      return (
        <div>
          <Box ref={ref} style={{ padding: "16px", border: "1px solid #999" }}>
            Box with ref
          </Box>
          <p style={{ marginTop: "8px", fontSize: "14px" }}>{info}</p>
        </div>
      );
    };
    return <RefDemo />;
  },
};

export const Nested: Story = {
  name: "Nested Boxes",
  render: () => (
    <Box style={{ padding: "16px", border: "2px solid #333" }}>
      <Box as="header" style={{ marginBottom: "8px", fontWeight: "bold" }}>
        Header
      </Box>
      <Box as="main" style={{ padding: "8px", background: "#f9f9f9" }}>
        Content area
      </Box>
      <Box as="footer" style={{ marginTop: "8px", fontSize: "12px" }}>
        Footer
      </Box>
    </Box>
  ),
};

export const BaseClass: Story = {
  name: "Base class (kui-box)",
  render: () => (
    <div>
      <Box data-testid="styled">Box with base class</Box>
      <p style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
        Inspect element to see <code>.kui-box</code> class applied
      </p>
    </div>
  ),
};

export const ConsumerClassOverride: Story = {
  name: "Consumer className override",
  render: () => (
    <div>
      <style>{`.custom-highlight { border: 2px dashed orange; padding: 12px; }`}</style>
      <Box className="custom-highlight">Consumer className merged with kui-box</Box>
    </div>
  ),
};

export const GeneratedCss: Story = {
  name: "Generated CSS output",
  render: () => {
    const css = generateComponentCss({ contract: boxStyleContract });
    return (
      <div>
        <Box style={{ padding: "12px", marginBottom: "12px" }}>
          This Box&apos;s styles are defined by the contract below
        </Box>
        <pre
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: "16px",
            borderRadius: "4px",
            fontSize: "13px",
            overflow: "auto",
          }}
        >
          {css}
        </pre>
      </div>
    );
  },
};

export const TokenReference: Story = {
  name: "Token reference in CSS",
  render: () => (
    <div>
      <style>{`.kui-box { --kui-box-bg: #e0f2fe; }`}</style>
      <Box style={{ padding: "16px" }}>
        Background uses token: <code>color.surface.default</code> (overridden to light blue here)
      </Box>
    </div>
  ),
};
