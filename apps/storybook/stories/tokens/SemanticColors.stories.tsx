import type { Meta, StoryObj } from "@storybook/react";
import { lightTheme, darkTheme } from "@kairoui/tokens";

function ColorRow({ name, value }: { name: string; value: string }) {
  return (
    <tr>
      <td style={{ fontFamily: "monospace", fontSize: 12, padding: "6px 12px" }}>{name}</td>
      <td style={{ padding: "6px 12px" }}>
        <div
          style={{
            width: 32,
            height: 20,
            background: value,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        />
      </td>
      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7588", padding: "6px 12px" }}>
        {value}
      </td>
    </tr>
  );
}

function flattenColors(
  obj: Record<string, unknown>,
  prefix = "",
): Array<{ name: string; value: string }> {
  const entries: Array<{ name: string; value: string }> = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "string") {
      entries.push({ name: path, value: val });
    } else if (typeof val === "object" && val !== null) {
      entries.push(...flattenColors(val as Record<string, unknown>, path));
    }
  }
  return entries;
}

function SemanticColors({ theme, label }: { theme: typeof lightTheme; label: string }) {
  const colors = flattenColors(theme.color);
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>{label} — Semantic Colors</h2>
      <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e4e7ec", textAlign: "left" }}>
            <th style={{ padding: "6px 12px" }}>Token</th>
            <th style={{ padding: "6px 12px" }}>Swatch</th>
            <th style={{ padding: "6px 12px" }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {colors.map((c) => (
            <ColorRow key={c.name} name={c.name} value={c.value} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: "Tokens/Semantic Colors",
  component: SemanticColors,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SemanticColors>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightTheme: Story = { args: { theme: lightTheme, label: "Light" } };
export const DarkTheme: Story = {
  args: { theme: darkTheme, label: "Dark" },
  decorators: [
    (Story) => (
      <div style={{ background: "#131822", padding: "1rem", borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { backgrounds: { default: "dark" } },
};
