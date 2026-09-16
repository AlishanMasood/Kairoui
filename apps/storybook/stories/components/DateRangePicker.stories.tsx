import type { Meta, StoryObj } from "@storybook/react";
import {
  DateRangePicker,
  DateRangePickerCalendars,
  DateRangePickerClear,
  DateRangePickerContent,
  DateRangePickerEndInput,
  DateRangePickerStartInput,
  DateRangePickerTrigger,
} from "../../../../packages/core/src/components/date-range-picker/index";
import { Field } from "../../../../packages/core/src/components/field/field";
import { Label } from "../../../../packages/core/src/components/field/label";
import { FieldDescription } from "../../../../packages/core/src/components/field/field-description";

const meta = {
  title: "Components/DateRangePicker",
  component: DateRangePicker as React.ComponentType,
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Skeleton = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: 380 }}>{children}</div>
);

export const Default: Story = {
  render: () => (
    <Skeleton>
      <DateRangePicker locale="en-US">
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerClear />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const DefaultValue: Story = {
  name: "Default value",
  render: () => (
    <Skeleton>
      <DateRangePicker
        defaultValue={{ start: new Date(2026, 2, 5), end: new Date(2026, 2, 12) }}
        locale="en-US"
      >
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerClear />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const MinMax: Story = {
  name: "Min / Max",
  render: () => (
    <Skeleton>
      <DateRangePicker min={new Date(2026, 0, 1)} max={new Date(2026, 11, 31)} locale="en-US">
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const DisabledDates: Story = {
  name: "Disabled dates (weekends)",
  render: () => (
    <Skeleton>
      <DateRangePicker locale="en-US" disabledDate={(d) => d.getDay() === 0 || d.getDay() === 6}>
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const LengthConstraints: Story = {
  name: "Length constraints (2–14 days)",
  render: () => (
    <Skeleton>
      <DateRangePicker locale="en-US" minLength={2} maxLength={14}>
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const RequireComplete: Story = {
  name: "Require complete range",
  render: () => (
    <Skeleton>
      <DateRangePicker locale="en-US" requireComplete>
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const SingleMonth: Story = {
  name: "Single month",
  render: () => (
    <Skeleton>
      <DateRangePicker locale="en-US">
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars months={1} />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Skeleton>
      <DateRangePicker
        disabled
        defaultValue={{ start: new Date(2026, 5, 15), end: new Date(2026, 5, 20) }}
      >
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <Skeleton>
      <DateRangePicker
        readOnly
        defaultValue={{ start: new Date(2026, 5, 15), end: new Date(2026, 5, 20) }}
      >
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const RTL: Story = {
  render: () => (
    <Skeleton>
      <DateRangePicker locale="ar-EG" dir="rtl">
        <DateRangePickerStartInput />
        <DateRangePickerEndInput />
        <DateRangePickerTrigger />
        <DateRangePickerContent>
          <DateRangePickerCalendars />
        </DateRangePickerContent>
      </DateRangePicker>
    </Skeleton>
  ),
};

export const InField: Story = {
  name: "In Field",
  render: () => (
    <Skeleton>
      <Field>
        <Label>Trip dates</Label>
        <FieldDescription>Select departure and return dates.</FieldDescription>
        <DateRangePicker locale="en-US" name="trip">
          <DateRangePickerStartInput />
          <DateRangePickerEndInput />
          <DateRangePickerClear />
          <DateRangePickerTrigger />
          <DateRangePickerContent>
            <DateRangePickerCalendars />
          </DateRangePickerContent>
        </DateRangePicker>
      </Field>
    </Skeleton>
  ),
};
