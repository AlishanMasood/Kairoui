import type { Meta, StoryObj } from "@storybook/react";
import {
  blue,
  neutral,
  focusRing,
  radius,
  shadow,
  lightTheme,
  darkTheme,
  activeRail,
} from "@kairoui/tokens";

function FocusFrameDemo() {
  const demos = [
    { label: "On white", bg: "#ffffff" },
    { label: "On gray", bg: neutral["100"] },
    { label: "On dark", bg: neutral["900"] },
  ];
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Kairo Focus Frame</h2>
      <p style={{ fontSize: 13, color: "#6b7588", maxWidth: 600 }}>
        Double-ring focus indicator: brand accent outer ring + contrasting inner gap. Visible on any
        surface.
      </p>
      <div style={{ display: "flex", gap: 24 }}>
        {demos.map((d) => {
          const isDark = d.bg === neutral["900"];
          const ringColor = isDark ? blue["400"] : blue["600"];
          const innerColor = isDark ? neutral["900"] : "#ffffff";
          return (
            <div
              key={d.label}
              style={{
                background: d.bg,
                padding: 32,
                borderRadius: radius.lg,
                border: `1px solid ${neutral["200"]}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: isDark ? neutral["300"] : neutral["600"],
                  marginBottom: 12,
                }}
              >
                {d.label}
              </div>
              <div
                style={{
                  width: 120,
                  height: 36,
                  borderRadius: radius.md,
                  background: isDark ? neutral["800"] : "#ffffff",
                  border: `1px solid ${isDark ? neutral["700"] : neutral["200"]}`,
                  outline: `${focusRing.width} solid ${ringColor}`,
                  outlineOffset: focusRing.offset,
                  boxShadow: `0 0 0 ${focusRing.offset} ${innerColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: isDark ? neutral["200"] : neutral["700"],
                }}
              >
                Button
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 24, fontSize: 12, fontFamily: "monospace", color: "#6b7588" }}>
        <div>outline: {focusRing.width} solid color.border.focus</div>
        <div>outline-offset: {focusRing.offset}</div>
        <div>box-shadow: 0 0 0 {focusRing.offset} focus.innerRingColor</div>
      </div>
    </div>
  );
}

function ActiveRailDemo() {
  const tabs = ["Dashboard", "Settings", "Profile"];
  const activeIdx = 0;
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Kairo Active Rail</h2>
      <p style={{ fontSize: 13, color: "#6b7588", maxWidth: 600 }}>
        A 2px accent bar marking the active item. Placed at bottom (horizontal) or leading edge
        (vertical).
      </p>
      <div style={{ display: "flex", gap: 48 }}>
        <div>
          <div style={{ fontSize: 11, color: neutral["600"], marginBottom: 8 }}>
            Horizontal (tabs)
          </div>
          <div style={{ display: "flex", borderBottom: `1px solid ${neutral["200"]}` }}>
            {tabs.map((tab, i) => (
              <div
                key={tab}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  color: i === activeIdx ? blue["600"] : neutral["600"],
                  fontWeight: i === activeIdx ? 600 : 400,
                  position: "relative",
                }}
              >
                {tab}
                {i === activeIdx && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: activeRail.thickness,
                      background: activeRail.color,
                      borderRadius: activeRail.radius,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: neutral["600"], marginBottom: 8 }}>Vertical (nav)</div>
          <div style={{ borderLeft: `1px solid ${neutral["200"]}`, paddingLeft: 0 }}>
            {tabs.map((tab, i) => (
              <div
                key={tab}
                style={{
                  padding: "6px 16px",
                  fontSize: 13,
                  color: i === activeIdx ? blue["600"] : neutral["600"],
                  fontWeight: i === activeIdx ? 600 : 400,
                  position: "relative",
                }}
              >
                {i === activeIdx && (
                  <div
                    style={{
                      position: "absolute",
                      left: -1,
                      top: 4,
                      bottom: 4,
                      width: activeRail.thickness,
                      background: activeRail.color,
                      borderRadius: activeRail.radius,
                    }}
                  />
                )}
                {tab}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, fontSize: 12, fontFamily: "monospace", color: "#6b7588" }}>
        thickness: {activeRail.thickness} | color: {activeRail.color} | radius: {activeRail.radius}
      </div>
    </div>
  );
}

function SelectedSurfaceDemo() {
  const items = ["Design tokens", "Components", "Patterns", "Utilities"];
  const selectedIdx = 1;
  const light = lightTheme.interaction.selected;
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Kairo Selected Surface</h2>
      <p style={{ fontSize: 13, color: "#6b7588", maxWidth: 600 }}>
        Subtle accent-tinted background + stronger border marks selection without excessive color.
      </p>
      <div style={{ display: "flex", gap: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: neutral["600"], marginBottom: 8 }}>List selection</div>
          <div
            style={{
              border: `1px solid ${neutral["200"]}`,
              borderRadius: radius.lg,
              overflow: "hidden",
              width: 220,
            }}
          >
            {items.map((item, i) => (
              <div
                key={item}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  background: i === selectedIdx ? light.background : "transparent",
                  borderLeft:
                    i === selectedIdx ? `2px solid ${light.border}` : "2px solid transparent",
                  color: i === selectedIdx ? light.text : neutral["700"],
                  fontWeight: i === selectedIdx ? 500 : 400,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: neutral["600"], marginBottom: 8 }}>Token values</div>
          <table style={{ fontSize: 12, fontFamily: "monospace", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 8px", color: "#6b7588" }}>background</td>
                <td style={{ padding: "3px 8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      background: light.background,
                      border: "1px solid #e4e7ec",
                      borderRadius: 2,
                      verticalAlign: "middle",
                      marginRight: 6,
                    }}
                  />
                  {light.background}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 8px", color: "#6b7588" }}>border</td>
                <td style={{ padding: "3px 8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      background: light.border,
                      borderRadius: 2,
                      verticalAlign: "middle",
                      marginRight: 6,
                    }}
                  />
                  {light.border}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 8px", color: "#6b7588" }}>text</td>
                <td style={{ padding: "3px 8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      background: light.text,
                      borderRadius: 2,
                      verticalAlign: "middle",
                      marginRight: 6,
                    }}
                  />
                  {light.text}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 8px", color: "#6b7588" }}>icon</td>
                <td style={{ padding: "3px 8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      background: light.icon,
                      borderRadius: 2,
                      verticalAlign: "middle",
                      marginRight: 6,
                    }}
                  />
                  {light.icon}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusMarkerDemo() {
  const statuses = [
    { key: "success", label: "Success", icon: "✓", tokens: lightTheme.color.status.success },
    { key: "warning", label: "Warning", icon: "⚠", tokens: lightTheme.color.status.warning },
    { key: "error", label: "Error", icon: "✕", tokens: lightTheme.color.status.error },
    { key: "info", label: "Info", icon: "ℹ", tokens: lightTheme.color.status.info },
  ];
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Kairo Status Marker</h2>
      <p style={{ fontSize: 13, color: "#6b7588", maxWidth: 600 }}>
        Color + redundant signal (icon, border, shape, or text). Never color-only.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
        {statuses.map((s) => (
          <div
            key={s.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: s.tokens.subtle,
              border: `1px solid ${s.tokens.border}`,
              borderRadius: radius.md,
            }}
          >
            <span style={{ fontSize: 14, color: s.tokens.icon, flexShrink: 0 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: s.tokens.text, fontWeight: 500 }}>{s.label}:</span>
            <span style={{ fontSize: 13, color: s.tokens.text }}>Operation completed.</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: "#6b7588", fontStyle: "italic" }}>
        Each marker uses: icon (shape) + color + text label — three redundant channels.
      </div>
    </div>
  );
}

function SurfaceHierarchyDemo() {
  const layers = [
    { label: "Page", bg: lightTheme.color.background.page, shadow: "none", border: "none" },
    {
      label: "Surface",
      bg: lightTheme.color.background.surface,
      shadow: "none",
      border: `1px solid ${neutral["200"]}`,
    },
    {
      label: "Raised",
      bg: lightTheme.color.background.raised,
      shadow: lightTheme.elevation.raised,
      border: `1px solid ${neutral["200"]}`,
    },
    {
      label: "Overlay",
      bg: lightTheme.color.background.surface,
      shadow: lightTheme.elevation.overlay,
      border: `1px solid ${neutral["200"]}`,
    },
    {
      label: "Modal",
      bg: lightTheme.color.background.surface,
      shadow: lightTheme.elevation.modal,
      border: "none",
    },
  ];
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Kairo Surface Hierarchy</h2>
      <p style={{ fontSize: 13, color: "#6b7588", maxWidth: 600 }}>
        Predictable depth: page → surface → raised → overlay → modal. Borders separate; shadows
        elevate.
      </p>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
        {layers.map((l, i) => (
          <div key={l.label} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 100,
                height: 60 + i * 8,
                background: l.bg,
                boxShadow: l.shadow,
                border: l.border,
                borderRadius: radius.lg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontFamily: "monospace",
                color: neutral["600"],
              }}
            >
              {l.label}
            </div>
            <div style={{ fontSize: 10, color: neutral["500"], marginTop: 6 }}>Level {i}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, color: neutral["600"], marginBottom: 8 }}>
          Dark theme equivalent
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
          {[
            { label: "Page", bg: darkTheme.color.background.page },
            { label: "Surface", bg: darkTheme.color.background.surface },
            { label: "Raised", bg: darkTheme.color.background.raised },
            { label: "Overlay", bg: darkTheme.color.background.surface },
            { label: "Modal", bg: darkTheme.color.background.surface },
          ].map((l, i) => (
            <div key={l.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 100,
                  height: 60 + i * 8,
                  background: l.bg,
                  boxShadow: i >= 2 ? shadow.sm : "none",
                  border: i < 4 ? `1px solid ${neutral["700"]}` : "none",
                  borderRadius: radius.lg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: neutral["400"],
                }}
              >
                {l.label}
              </div>
              <div style={{ fontSize: 10, color: neutral["500"], marginTop: 6 }}>Level {i}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Tokens/Visual Signatures",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const FocusFrame: Story = { render: () => <FocusFrameDemo /> };
export const ActiveRail: Story = { render: () => <ActiveRailDemo /> };
export const SelectedSurface: Story = { render: () => <SelectedSurfaceDemo /> };
export const StatusMarker: Story = { render: () => <StatusMarkerDemo /> };
export const SurfaceHierarchy: Story = { render: () => <SurfaceHierarchyDemo /> };
