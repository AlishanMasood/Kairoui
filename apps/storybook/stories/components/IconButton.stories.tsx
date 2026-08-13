import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "../../../../packages/core/src/components/icon-button/index";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

const meta = {
  title: "Components/IconButton",
  component: IconButton as React.ComponentType,
  parameters: {
    docs: {
      description: {
        component:
          "Compact icon-only action trigger. Requires an accessible label via aria-label or aria-labelledby.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <IconButton aria-label="Close">
      <CloseIcon />
    </IconButton>
  ),
};

export const Appearances: Story = {
  name: "Appearances",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <IconButton aria-label="Solid" appearance="solid">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Outline" appearance="outline">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Subtle" appearance="subtle">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Ghost" appearance="ghost">
        <CloseIcon />
      </IconButton>
    </div>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <IconButton aria-label="Small" size="sm">
        <SearchIcon />
      </IconButton>
      <IconButton aria-label="Medium" size="md">
        <SearchIcon />
      </IconButton>
      <IconButton aria-label="Large" size="lg">
        <SearchIcon />
      </IconButton>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <IconButton aria-label="Close" disabled appearance="solid">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Close" disabled appearance="outline">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Close" disabled>
        <CloseIcon />
      </IconButton>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <IconButton aria-label="Loading action" loading>
      <SettingsIcon />
    </IconButton>
  ),
};

export const AsAnchor: Story = {
  name: "as='a'",
  render: () => (
    <IconButton as="a" href="https://example.com" aria-label="External link">
      <SearchIcon />
    </IconButton>
  ),
};

export const AllCombinations: Story = {
  name: "All combinations",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {(["solid", "outline", "subtle", "ghost"] as const).map((appearance) => (
        <div key={appearance} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <IconButton
              key={size}
              aria-label={`${appearance} ${size}`}
              appearance={appearance}
              size={size}
            >
              <SettingsIcon />
            </IconButton>
          ))}
        </div>
      ))}
    </div>
  ),
};
