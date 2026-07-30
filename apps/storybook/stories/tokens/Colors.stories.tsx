import type { Meta, StoryObj } from "@storybook/react";
import { neutral, blue, green, red, orange, teal } from "@kairoui/tokens";

function ColorScale({ name, scale }: { name: string; scale: Record<string, string> }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ margin: "0 0 0.5rem", fontFamily: "system-ui", fontSize: 16 }}>{name}</h3>
      <div style={{ display: "flex", gap: 2 }}>
        {Object.entries(scale).map(([step, color]) => (
          <div key={step} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: color,
                borderRadius: 4,
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            />
            <div style={{ fontSize: 10, fontFamily: "monospace", marginTop: 4 }}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorScales() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Primitive Color Scales</h2>
      <ColorScale name="Neutral" scale={neutral} />
      <ColorScale name="Blue (Brand)" scale={blue} />
      <ColorScale name="Green (Success)" scale={green} />
      <ColorScale name="Red (Danger)" scale={red} />
      <ColorScale name="Orange (Warning)" scale={orange} />
      <ColorScale name="Teal (Info)" scale={teal} />
    </div>
  );
}

const meta = {
  title: "Tokens/Colors",
  component: ColorScales,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ColorScales>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllScales: Story = {};
