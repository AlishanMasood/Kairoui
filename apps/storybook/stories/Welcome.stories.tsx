import type { Meta, StoryObj } from "@storybook/react";

/**
 * Infrastructure welcome story — validates Storybook setup is working.
 * This is NOT a KairoUI component. Remove once real component stories exist.
 */
function Welcome() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>KairoUI Storybook</h1>
      <p>Component development and documentation environment.</p>
      <h2>Organization</h2>
      <ul>
        <li>
          <strong>Packages/Core</strong> — Foundation primitives and base components
        </li>
        <li>
          <strong>Packages/Hooks</strong> — Shared React hooks
        </li>
        <li>
          <strong>Packages/Icons</strong> — Icon components
        </li>
        <li>
          <strong>Packages/Tokens</strong> — Design tokens
        </li>
        <li>
          <strong>Packages/Theme</strong> — Theming system
        </li>
        <li>
          <strong>Packages/Utils</strong> — Utility functions
        </li>
      </ul>
      <h2>Story conventions</h2>
      <ul>
        <li>Stories are co-located with components or placed in this app</li>
        <li>
          Use <code>autodocs</code> tag for automatic documentation
        </li>
        <li>Prefer interaction tests over visual snapshots</li>
        <li>Test accessibility with the a11y addon panel</li>
      </ul>
    </div>
  );
}

const meta: Meta<typeof Welcome> = {
  title: "Introduction/Welcome",
  component: Welcome,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Welcome>;

export const Default: Story = {};
