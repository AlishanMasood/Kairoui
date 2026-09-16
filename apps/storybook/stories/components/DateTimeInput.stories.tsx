import type { Meta, StoryObj } from "@storybook/react";
import { DateTimeInput } from "../../../../packages/core/src/components/date-time-input/index";
import { Field } from "../../../../packages/core/src/components/field/field";
import { Label } from "../../../../packages/core/src/components/field/label";
import { FieldDescription } from "../../../../packages/core/src/components/field/field-description";

const meta = {
  title: "Components/DateTimeInput",
  component: DateTimeInput,
  tags: ["autodocs"],
} satisfies Meta<typeof DateTimeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <DateTimeInput locale="en-US" />
    </div>
  ),
};

export const DefaultValue: Story = {
  name: "Default value",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <DateTimeInput
        defaultValue={{
          date: { year: 2026, month: 3, day: 5 },
          time: { hour: 14, minute: 30, second: 0, millisecond: 0 },
        }}
        locale="en-US"
      />
    </div>
  ),
};

export const TwentyFourHourWithSeconds: Story = {
  name: "24h with seconds",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <DateTimeInput locale="en-US" hour12={false} step={1} />
    </div>
  ),
};

export const Locales: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380 }}>
      <DateTimeInput locale="en-US" />
      <DateTimeInput locale="en-GB" />
      <DateTimeInput locale="ja-JP" hour12={false} />
    </div>
  ),
};

export const MinMax: Story = {
  name: "Min / Max",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <DateTimeInput
        min={{
          date: { year: 2026, month: 1, day: 1 },
          time: { hour: 9, minute: 0, second: 0, millisecond: 0 },
        }}
        max={{
          date: { year: 2026, month: 12, day: 31 },
          time: { hour: 17, minute: 0, second: 0, millisecond: 0 },
        }}
        locale="en-US"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <DateTimeInput
        disabled
        defaultValue={{
          date: { year: 2026, month: 6, day: 15 },
          time: { hour: 10, minute: 0, second: 0, millisecond: 0 },
        }}
      />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <DateTimeInput
        readOnly
        defaultValue={{
          date: { year: 2026, month: 6, day: 15 },
          time: { hour: 10, minute: 0, second: 0, millisecond: 0 },
        }}
      />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <DateTimeInput invalid locale="en-US" />
    </div>
  ),
};

export const InField: Story = {
  name: "In Field",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <Field>
        <Label>Meeting time</Label>
        <FieldDescription>Pick date and time.</FieldDescription>
        <DateTimeInput locale="en-US" name="meeting" />
      </Field>
    </div>
  ),
};
