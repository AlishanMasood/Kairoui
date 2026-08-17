import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../../../packages/core/src/components/select/select";

const meta = {
  title: "Components/Select",
  component: Select as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="apple">
      <SelectTrigger placeholder="Pick a fruit" />
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithPlaceholder: Story = {
  name: "Placeholder",
  render: () => (
    <Select>
      <SelectTrigger placeholder="Select an option…" />
      <SelectContent>
        <SelectItem value="a">Option A</SelectItem>
        <SelectItem value="b">Option B</SelectItem>
        <SelectItem value="c">Option C</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDisabledItems: Story = {
  name: "Disabled items",
  render: () => (
    <Select>
      <SelectTrigger placeholder="Choose…" />
      <SelectContent>
        <SelectItem value="a">Enabled</SelectItem>
        <SelectItem value="b" disabled>
          Disabled
        </SelectItem>
        <SelectItem value="c">Also enabled</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  name: "Groups",
  render: () => (
    <Select>
      <SelectTrigger placeholder="Pick…" />
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="potato">Potato</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled defaultValue="apple">
      <SelectTrigger placeholder="Disabled" />
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
      </SelectContent>
    </Select>
  ),
};

function ControlledDemo() {
  const [value, setValue] = useState("banana");
  return (
    <div>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger placeholder="Pick…" />
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <p style={{ marginTop: 8, fontSize: "0.85em" }}>Selected: {value}</p>
    </div>
  );
}
ControlledDemo.displayName = "ControlledDemo";

export const Controlled: Story = {
  render: () => <ControlledDemo />,
};
