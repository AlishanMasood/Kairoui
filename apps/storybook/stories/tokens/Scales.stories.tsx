import type { Meta, StoryObj } from "@storybook/react";
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  spacing,
  controlHeight,
  iconSize,
  contentWidth,
  radius,
  borderWidth,
  shadow,
  duration,
  easing,
  opacity,
  zIndex,
  breakpoint,
} from "@kairoui/tokens";

function TokenTable({
  title,
  data,
}: {
  title: string;
  data: Array<{ name: string; value: string | number; cssVar?: string }>;
}) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ fontFamily: "system-ui", fontSize: 16, margin: "0 0 0.5rem" }}>{title}</h3>
      <table
        style={{
          borderCollapse: "collapse",
          fontSize: 13,
          fontFamily: "system-ui, sans-serif",
          width: "100%",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #e4e7ec", textAlign: "left" }}>
            <th style={{ padding: "4px 10px" }}>Token</th>
            <th style={{ padding: "4px 10px" }}>Value</th>
            {data[0]?.cssVar !== undefined && <th style={{ padding: "4px 10px" }}>CSS Variable</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.name} style={{ borderBottom: "1px solid #f1f3f6" }}>
              <td style={{ padding: "4px 10px", fontFamily: "monospace", fontSize: 12 }}>
                {d.name}
              </td>
              <td style={{ padding: "4px 10px", fontFamily: "monospace", fontSize: 12 }}>
                {String(d.value)}
              </td>
              {d.cssVar !== undefined && (
                <td
                  style={{
                    padding: "4px 10px",
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "#6b7588",
                  }}
                >
                  {d.cssVar}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function entries(
  obj: Record<string, string | number>,
): Array<{ name: string; value: string | number }> {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

function SpacingVisual() {
  const subset = ["0", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16"] as const;
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ fontFamily: "system-ui", fontSize: 16, margin: "0 0 0.5rem" }}>
        Spacing Scale (visual)
      </h3>
      {subset.map((key) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 30, fontFamily: "monospace", fontSize: 11, textAlign: "right" }}>
            {key}
          </div>
          <div
            style={{ height: 16, background: "#4f46e5", borderRadius: 2, width: spacing[key] }}
          />
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7588" }}>
            {spacing[key]}
          </div>
        </div>
      ))}
    </div>
  );
}

function RadiusVisual() {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ fontFamily: "system-ui", fontSize: 16, margin: "0 0 0.5rem" }}>Radius Scale</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {Object.entries(radius).map(([name, value]) => (
          <div key={name} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                border: "2px solid #4f46e5",
                borderRadius: value,
                background: "#eef2ff",
              }}
            />
            <div style={{ fontSize: 10, fontFamily: "monospace", marginTop: 4 }}>{name}</div>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#6b7588" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShadowVisual() {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ fontFamily: "system-ui", fontSize: 16, margin: "0 0 0.5rem" }}>Shadow Scale</h3>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {Object.entries(shadow).map(([name, value]) => (
          <div key={name} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 80,
                height: 56,
                background: "#fff",
                borderRadius: 8,
                boxShadow: value,
                border: value === "none" ? "1px solid #e4e7ec" : "none",
              }}
            />
            <div style={{ fontSize: 10, fontFamily: "monospace", marginTop: 8 }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographyVisual() {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ fontFamily: "system-ui", fontSize: 16, margin: "0 0 0.5rem" }}>Font Sizes</h3>
      {Object.entries(fontSize).map(([name, value]) => (
        <div
          key={name}
          style={{ marginBottom: 4, display: "flex", alignItems: "baseline", gap: 12 }}
        >
          <div
            style={{
              width: 30,
              fontFamily: "monospace",
              fontSize: 11,
              textAlign: "right",
              color: "#6b7588",
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: value, fontFamily: fontFamily.sans, lineHeight: 1.4 }}>
            The quick brown fox
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#9ba3b0" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function AllScales() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Token Scales</h2>
      <TypographyVisual />
      <SpacingVisual />
      <RadiusVisual />
      <ShadowVisual />
      <TokenTable title="Control Heights" data={entries(controlHeight)} />
      <TokenTable title="Icon Sizes" data={entries(iconSize)} />
      <TokenTable title="Content Widths" data={entries(contentWidth)} />
      <TokenTable title="Border Widths" data={entries(borderWidth)} />
      <TokenTable title="Font Weights" data={entries(fontWeight)} />
      <TokenTable title="Line Heights" data={entries(lineHeight)} />
      <TokenTable title="Letter Spacing" data={entries(letterSpacing)} />
      <TokenTable title="Durations" data={entries(duration)} />
      <TokenTable title="Easings" data={entries(easing)} />
      <TokenTable title="Opacity" data={entries(opacity)} />
      <TokenTable title="Z-Index" data={entries(zIndex)} />
      <TokenTable title="Breakpoints" data={entries(breakpoint)} />
    </div>
  );
}

const meta = {
  title: "Tokens/Scales",
  component: AllScales,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AllScales>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
