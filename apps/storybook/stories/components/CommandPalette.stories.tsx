import type { Meta, StoryObj } from "@storybook/react";
import { Command, useCommandShortcut } from "@kairoui-pro/command";
import { useState } from "react";

function CommandDemo() {
  const [open, setOpen] = useState(false);
  const [pageStack, setPageStack] = useState<readonly string[]>([]);
  useCommandShortcut({
    key: "k",
    onTrigger: (event) => {
      event.preventDefault();
      setOpen(true);
    },
  });
  return (
    <div style={{ padding: 24 }}>
      <p>
        Press <kbd>Ctrl</kbd>+<kbd>K</kbd> or click below to open the palette.
      </p>
      <Command.Root
        open={open}
        onOpenChange={setOpen}
        pageStack={pageStack}
        onPageStackChange={setPageStack}
        onItemSelect={() => {
          setOpen(false);
        }}
      >
        <Command.Trigger>Open command palette</Command.Trigger>
        <Command.Dialog
          aria-label="Command palette"
          style={
            {
              position: "fixed",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "white",
              border: "1px solid #ccc",
              padding: 16,
              borderRadius: 8,
              minWidth: 400,
              zIndex: 1000,
            } as React.CSSProperties
          }
        >
          <Command.Input placeholder="Type a command…" />
          <Command.List>
            <Command.Empty>No results.</Command.Empty>
            <Command.Group id="general" heading="General">
              <Command.Item
                id="new-file"
                onSelect={() => {
                  console.log("new-file");
                }}
                keywords={["create"]}
              >
                New file
              </Command.Item>
              <Command.Item
                id="open"
                onSelect={() => {
                  console.log("open");
                }}
              >
                Open project
              </Command.Item>
              <Command.Item
                id="save"
                onSelect={() => {
                  console.log("save");
                }}
                keywords={["persist"]}
              >
                Save file
              </Command.Item>
            </Command.Group>
            <Command.Separator />
            <Command.Group id="theme-page" heading="Theme">
              <Command.Item
                id="theme-menu"
                onSelect={() => {
                  setPageStack(["theme"]);
                }}
              >
                Change theme…
              </Command.Item>
            </Command.Group>
            <Command.Group id="theme-child" heading="Theme" pageId="theme">
              <Command.Item
                id="light"
                onSelect={() => {
                  console.log("light");
                }}
              >
                Light
              </Command.Item>
              <Command.Item
                id="dark"
                onSelect={() => {
                  console.log("dark");
                }}
              >
                Dark
              </Command.Item>
              <Command.Item
                id="system"
                onSelect={() => {
                  console.log("system");
                }}
              >
                System
              </Command.Item>
            </Command.Group>
            <Command.Group id="disabled-example" heading="Disabled">
              <Command.Item
                id="disabled"
                disabled
                onSelect={() => {
                  console.log("disabled");
                }}
              >
                This command is disabled
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command.Dialog>
      </Command.Root>
    </div>
  );
}

const meta: Meta<typeof CommandDemo> = {
  title: "Enterprise/Command Palette",
  component: CommandDemo,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CommandDemo>;

export const Basic: Story = {};
