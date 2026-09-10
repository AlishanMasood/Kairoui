import type { Meta, StoryObj } from "@storybook/react";
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerClear,
  DatePickerContent,
  DatePickerInput,
  DatePickerTrigger,
} from "../../../../packages/core/src/components/date-picker/index";
import { Field } from "../../../../packages/core/src/components/field/field";
import { Label } from "../../../../packages/core/src/components/field/label";
import { FieldDescription } from "../../../../packages/core/src/components/field/field-description";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 260 }}>
      <DatePicker locale="en-US">
        <DatePickerInput />
        <DatePickerClear />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>
    </div>
  ),
};

export const DefaultValue: Story = {
  name: "Default value",
  render: () => (
    <div style={{ maxWidth: 260 }}>
      <DatePicker defaultValue={new Date(2026, 2, 5)} locale="en-US">
        <DatePickerInput />
        <DatePickerClear />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>
    </div>
  ),
};

export const Locales: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 260 }}>
      <DatePicker locale="en-US">
        <DatePickerInput />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>
      <DatePicker locale="en-GB">
        <DatePickerInput />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>
      <DatePicker locale="ja-JP">
        <DatePickerInput />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>
    </div>
  ),
};

export const MinMax: Story = {
  name: "Min / Max",
  render: () => (
    <div style={{ maxWidth: 260 }}>
      <DatePicker min={new Date(2026, 0, 1)} max={new Date(2026, 11, 31)} locale="en-US">
        <DatePickerInput />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>
    </div>
  ),
};

export const DisabledDates: Story = {
  name: "Disabled dates (weekends)",
  render: () => (
    <div style={{ maxWidth: 260 }}>
      <DatePicker locale="en-US" disabledDate={(d) => d.getDay() === 0 || d.getDay() === 6}>
        <DatePickerInput />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ maxWidth: 260 }}>
      <DatePicker disabled defaultValue={new Date(2026, 5, 15)}>
        <DatePickerInput />
        <DatePickerTrigger />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePicker>
    </div>
  ),
};

export const WithField: Story = {
  name: "With Field",
  render: () => (
    <Field required>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 260 }}>
        <Label>Birthdate</Label>
        <DatePicker name="dob" locale="en-US">
          <DatePickerInput />
          <DatePickerClear />
          <DatePickerTrigger />
          <DatePickerContent>
            <DatePickerCalendar />
          </DatePickerContent>
        </DatePicker>
        <FieldDescription style={{ fontSize: "0.85em", color: "#666" }}>
          Format: MM/DD/YYYY
        </FieldDescription>
      </div>
    </Field>
  ),
};
