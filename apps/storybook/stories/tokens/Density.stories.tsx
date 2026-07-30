import type { Meta, StoryObj } from "@storybook/react";
import { comfortable, standard, compact } from "@kairoui/tokens";
import type { DensityTokens } from "@kairoui/tokens";

function DensityRow({ label, density }: { label: string; density: DensityTokens }) {
  return (
    <div style={{ flex: 1, border: "1px solid #e4e7ec", borderRadius: 8, padding: "1rem" }}>
      <h4 style={{ margin: "0 0 0.75rem", fontFamily: "system-ui", fontSize: 14 }}>{label}</h4>
      <table
        style={{ fontSize: 12, fontFamily: "monospace", borderCollapse: "collapse", width: "100%" }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "2px 6px", color: "#6b7588" }}>control.height.md</td>
            <td>{density.control.height.md}</td>
          </tr>
          <tr>
            <td style={{ padding: "2px 6px", color: "#6b7588" }}>inline.sm</td>
            <td>{density.spacing.inline.sm}</td>
          </tr>
          <tr>
            <td style={{ padding: "2px 6px", color: "#6b7588" }}>form.fieldGap</td>
            <td>{density.spacing.form.fieldGap}</td>
          </tr>
          <tr>
            <td style={{ padding: "2px 6px", color: "#6b7588" }}>content.cardPadding</td>
            <td>{density.spacing.content.cardPadding}</td>
          </tr>
          <tr>
            <td style={{ padding: "2px 6px", color: "#6b7588" }}>content.tableCell</td>
            <td>{density.spacing.content.tableCell}</td>
          </tr>
        </tbody>
      </table>
      <div
        style={{
          marginTop: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: density.spacing.form.fieldGap,
        }}
      >
        <div
          style={{
            height: density.control.height.md,
            background: "#eef2ff",
            borderRadius: 6,
            border: "1px solid #c7d2fe",
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
            fontSize: 12,
            fontFamily: "system-ui",
          }}
        >
          Input ({density.control.height.md})
        </div>
        <div
          style={{
            height: density.control.height.md,
            background: "#4f46e5",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontFamily: "system-ui",
          }}
        >
          Button ({density.control.height.md})
        </div>
      </div>
    </div>
  );
}

function DensityComparison() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Density Comparison</h2>
      <p style={{ fontSize: 13, color: "#6b7588", marginBottom: "1rem" }}>
        Same controls at different density settings. Density changes spacing and sizing, never
        colors or typography.
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <DensityRow label="Comfortable (default)" density={comfortable} />
        <DensityRow label="Standard" density={standard} />
        <DensityRow label="Compact" density={compact} />
      </div>
    </div>
  );
}

const meta = {
  title: "Tokens/Density",
  component: DensityComparison,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DensityComparison>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {};
