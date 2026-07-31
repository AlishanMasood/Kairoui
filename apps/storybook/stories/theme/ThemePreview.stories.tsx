import type { Meta, StoryObj } from "@storybook/react";
import {
  KairoProvider,
  KairoScopeProvider,
  useTheme,
  useThemeMode,
  useDensity,
} from "@kairoui/core";
import { createTheme } from "@kairoui/theme";

// ─── Demo Components ─────────────────────────────────────────────────

function ThemeInfo() {
  const { mode, resolvedMode, density, themeName, isNested } = useTheme();
  return (
    <div
      style={{
        padding: "var(--kui-space-content-card-padding)",
        border: "1px solid var(--kui-color-border-default)",
        borderRadius: "8px",
        background: "var(--kui-color-bg-surface)",
        color: "var(--kui-color-text-primary)",
        fontFamily: "var(--kui-typography-body-font-family)",
        fontSize: "var(--kui-typography-body-font-size)",
      }}
    >
      <h3
        style={{
          margin: "0 0 0.5rem",
          fontFamily: "var(--kui-typography-section-title-font-family)",
          fontSize: "var(--kui-typography-section-title-font-size)",
          fontWeight: "var(--kui-typography-section-title-font-weight)" as unknown as number,
        }}
      >
        Theme State
      </h3>
      <table
        style={{ fontSize: "var(--kui-typography-caption-font-size)", borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "2px 8px", color: "var(--kui-color-text-muted)" }}>Mode:</td>
            <td style={{ padding: "2px 8px", fontFamily: "monospace" }}>{mode}</td>
          </tr>
          <tr>
            <td style={{ padding: "2px 8px", color: "var(--kui-color-text-muted)" }}>Resolved:</td>
            <td style={{ padding: "2px 8px", fontFamily: "monospace" }}>{resolvedMode}</td>
          </tr>
          <tr>
            <td style={{ padding: "2px 8px", color: "var(--kui-color-text-muted)" }}>Density:</td>
            <td style={{ padding: "2px 8px", fontFamily: "monospace" }}>{density}</td>
          </tr>
          <tr>
            <td style={{ padding: "2px 8px", color: "var(--kui-color-text-muted)" }}>Theme:</td>
            <td style={{ padding: "2px 8px", fontFamily: "monospace" }}>
              {themeName || "(default)"}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "2px 8px", color: "var(--kui-color-text-muted)" }}>Nested:</td>
            <td style={{ padding: "2px 8px", fontFamily: "monospace" }}>{String(isNested)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ModeControls() {
  const { mode, toggleMode, setMode } = useThemeMode();
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button onClick={toggleMode} style={btnStyle}>
        Toggle ({mode})
      </button>
      <button
        onClick={() => {
          setMode("light");
        }}
        style={btnStyle}
      >
        Light
      </button>
      <button
        onClick={() => {
          setMode("dark");
        }}
        style={btnStyle}
      >
        Dark
      </button>
      <button
        onClick={() => {
          setMode("system");
        }}
        style={btnStyle}
      >
        System
      </button>
    </div>
  );
}

function DensityControls() {
  const { density, setDensity } = useDensity();
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "var(--kui-color-text-muted)" }}>Density:</span>
      <button
        onClick={() => {
          setDensity("comfortable");
        }}
        style={btnStyle}
      >
        {density === "comfortable" ? "● " : ""}Comfortable
      </button>
      <button
        onClick={() => {
          setDensity("standard");
        }}
        style={btnStyle}
      >
        {density === "standard" ? "● " : ""}Standard
      </button>
      <button
        onClick={() => {
          setDensity("compact");
        }}
        style={btnStyle}
      >
        {density === "compact" ? "● " : ""}Compact
      </button>
    </div>
  );
}

function SampleContent() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--kui-space-form-field-gap)" }}
    >
      <div
        style={{
          padding: "var(--kui-space-content-card-padding)",
          background: "var(--kui-color-bg-surface)",
          border: "1px solid var(--kui-color-border-default)",
          borderRadius: "8px",
          color: "var(--kui-color-text-primary)",
        }}
      >
        <h4 style={{ margin: "0 0 8px", color: "var(--kui-color-text-primary)" }}>Sample Card</h4>
        <p style={{ margin: 0, color: "var(--kui-color-text-secondary)" }}>
          This content uses CSS custom properties from the active theme.
        </p>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          style={{
            height: "var(--kui-control-height-md)",
            padding: "0 var(--kui-space-inline-md)",
            border: "1px solid var(--kui-color-border-default)",
            borderRadius: "4px",
            background: "var(--kui-color-bg-surface)",
            color: "var(--kui-color-text-primary)",
            fontSize: "var(--kui-typography-body-font-size)",
          }}
          placeholder="Input field"
        />
        <button
          style={{
            height: "var(--kui-control-height-md)",
            padding: "0 var(--kui-space-inline-md)",
            background: "var(--kui-color-interactive-default)",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "var(--kui-typography-body-font-size)",
            cursor: "pointer",
          }}
        >
          Action
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: "12px",
  border: "1px solid var(--kui-color-border-default)",
  borderRadius: "4px",
  background: "var(--kui-color-bg-surface)",
  color: "var(--kui-color-text-primary)",
  cursor: "pointer",
};

// ─── Stories ─────────────────────────────────────────────────────────

function ThemePreview() {
  return (
    <KairoProvider>
      <div style={{ padding: "1rem", background: "var(--kui-color-bg-page)", minHeight: "100vh" }}>
        <h2 style={{ marginTop: 0, color: "var(--kui-color-text-primary)" }}>Theme Preview</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ModeControls />
          <DensityControls />
          <ThemeInfo />
          <SampleContent />
        </div>
      </div>
    </KairoProvider>
  );
}

function ScopedDarkRegion() {
  return (
    <KairoProvider defaultMode="light">
      <div style={{ padding: "1rem", background: "var(--kui-color-bg-page)" }}>
        <h2 style={{ marginTop: 0, color: "var(--kui-color-text-primary)" }}>
          Scoped Theme Regions
        </h2>
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <ThemeInfo />
          </div>
          <KairoScopeProvider mode="dark">
            <div style={{ flex: 1 }}>
              <ThemeInfo />
            </div>
          </KairoScopeProvider>
        </div>
      </div>
    </KairoProvider>
  );
}

function NestedThemeRegion() {
  return (
    <KairoProvider defaultMode="light" defaultDensity="comfortable">
      <div style={{ padding: "1rem", background: "var(--kui-color-bg-page)" }}>
        <h2 style={{ marginTop: 0, color: "var(--kui-color-text-primary)" }}>Nested Themes</h2>
        <ThemeInfo />
        <div style={{ marginTop: "16px" }}>
          <KairoScopeProvider mode="dark" density="compact">
            <ThemeInfo />
            <div style={{ marginTop: "12px" }}>
              <KairoScopeProvider mode="light" density="standard">
                <ThemeInfo />
              </KairoScopeProvider>
            </div>
          </KairoScopeProvider>
        </div>
      </div>
    </KairoProvider>
  );
}

function CustomThemePreview() {
  const customTheme = createTheme({
    name: "brand",
    base: "light",
    description: "Custom brand theme",
    overrides: {
      color: { interactive: { default: "#0066cc" } },
    },
    metadata: { author: "Demo" },
  });

  return (
    <KairoProvider theme={customTheme} defaultMode="light">
      <div style={{ padding: "1rem", background: "var(--kui-color-bg-page)" }}>
        <h2 style={{ marginTop: 0, color: "var(--kui-color-text-primary)" }}>Custom Theme</h2>
        <ThemeInfo />
        <div style={{ marginTop: "16px" }}>
          <SampleContent />
        </div>
      </div>
    </KairoProvider>
  );
}

const meta = {
  title: "Theme/Preview",
  parameters: { layout: "fullscreen", kairoTheme: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Interactive: Story = { render: () => <ThemePreview /> };
export const ScopedRegions: Story = { render: () => <ScopedDarkRegion /> };
export const NestedProviders: Story = { render: () => <NestedThemeRegion /> };
export const CustomTheme: Story = { render: () => <CustomThemePreview /> };
