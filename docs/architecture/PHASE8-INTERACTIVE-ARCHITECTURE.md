# Phase 8 — Core Interactive Component Architecture

## Component Set

| Component        | Category    | Role                                      |
| ---------------- | ----------- | ----------------------------------------- |
| Button           | Action      | Primary user action trigger               |
| IconButton       | Action      | Compact icon-only action trigger          |
| Input            | Form        | Single-line text entry                    |
| Textarea         | Form        | Multi-line text entry                     |
| Checkbox         | Form        | Boolean toggle with indeterminate         |
| Radio            | Form        | Single option within a group              |
| RadioGroup       | Form        | Mutually exclusive option container       |
| Switch           | Form        | Immediate on/off toggle                   |
| Field            | Form layout | Wraps input + label + description + error |
| Label            | Form layout | Accessible label text                     |
| FieldDescription | Form layout | Helper text below a field                 |
| FieldError       | Form layout | Validation error message                  |

---

## Shared Prop Conventions

### Base Interactive Props

Every interactive component extends this contract:

```ts
interface InteractiveBaseProps {
  disabled?: boolean;
  /** Component is processing — disables interaction, shows loading indicator. */
  loading?: boolean;
}
```

### Form Control Props

Form components (Input, Textarea, Checkbox, Radio, Switch) extend:

```ts
interface FormControlBaseProps<T> extends InteractiveBaseProps {
  /** Controlled value. When defined the component is controlled. */
  value?: T;
  /** Initial value for uncontrolled mode. */
  defaultValue?: T;
  /** Change callback. Receives the new value. */
  onChange?: (value: T) => void;
  /** Prevents editing but allows focus and form submission. */
  readOnly?: boolean;
  /** Component name for form submission. */
  name?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Validation state driven by the parent Field. */
  validationState?: "valid" | "invalid";
}
```

### Naming Rules

- Boolean props: `disabled`, `loading`, `readOnly`, `required`, `checked`, `indeterminate` — never prefixed with `is`.
- Callbacks: `onChange`, `onBlur`, `onFocus`, `onPress` — always prefixed with `on`.
- Controlled pairs: `value`/`defaultValue`, `checked`/`defaultChecked`, `open`/`defaultOpen`.
- Slots: `slots`, `slotProps` — always via `SlotConsumerProps<Names>`.

---

## Controlled / Uncontrolled State

All form components use `useControllableState` from `@kairoui/hooks`:

```
value defined    → controlled (parent owns state)
value undefined  → uncontrolled (component owns state, initialized to defaultValue)
```

Invariant: a component must not switch between controlled and uncontrolled during its lifetime. `useControllableState` emits a dev warning if this occurs.

---

## Disabled State

| Rendered element                                | Behavior                    |
| ----------------------------------------------- | --------------------------- |
| `<button>`, `<input>`, `<select>`, `<textarea>` | Native `disabled` attribute |
| Any other element                               | `aria-disabled="true"`      |

Disabled components:

- Are not focusable (native elements)
- Receive `data-disabled=""` for CSS
- Have `cursor: not-allowed` + reduced opacity
- Suppress click/key handlers internally

Implementation: `resolveDisabledProps()` from `authoring-helpers.ts`.

---

## Read-Only State

Only form inputs (Input, Textarea). Not applicable to Button/Switch/Checkbox.

- Native `readOnly` attribute on input/textarea
- `aria-readonly="true"` on custom elements
- `data-readonly=""` for CSS targeting
- Element remains focusable and tabbable
- Value is submitted with the form
- Text is selectable

---

## Loading State

- Sets `aria-busy="true"`
- Sets `data-loading=""` + `data-state="loading"`
- Disables interaction (pointer-events: none)
- Cursor changes to `wait`
- Component renders a loading indicator in its `loadingIndicator` slot (where applicable)

Implementation: `computeComponentState({ disabled, loading })`.

---

## Focus-Visible Behavior

All interactive components use `useFocusVisible()` from `@kairoui/hooks`:

- Keyboard navigation → focus ring shown (`data-focus-visible=""`)
- Pointer interaction → focus ring hidden
- Focus ring style: `2px solid var(--kui-focus-ring-color)`, `2px` offset
- Never suppress native `:focus-visible` — layer on `data-focus-visible` for cross-browser consistency

---

## Keyboard Interaction

| Component           | Key                             | Action                          |
| ------------------- | ------------------------------- | ------------------------------- |
| Button / IconButton | Enter, Space                    | Activate                        |
| Input / Textarea    | Standard text input             | —                               |
| Checkbox            | Space                           | Toggle                          |
| Switch              | Space, Enter                    | Toggle                          |
| Radio               | Arrow Up/Down, Arrow Left/Right | Move selection                  |
| RadioGroup          | Tab                             | Enter/exit group; arrows within |

All keyboard handlers fire only when the component is not disabled.

---

## Native Semantics & Element Choice

| Component        | Default element                         | Required role          |
| ---------------- | --------------------------------------- | ---------------------- |
| Button           | `<button>`                              | implicit button        |
| IconButton       | `<button>`                              | implicit button        |
| Input            | `<input>`                               | implicit textbox       |
| Textarea         | `<textarea>`                            | implicit textbox       |
| Checkbox         | `<input type="checkbox">` or `<button>` | checkbox               |
| Radio            | `<input type="radio">` or `<button>`    | radio                  |
| RadioGroup       | `<div>`                                 | radiogroup             |
| Switch           | `<button>`                              | switch                 |
| Field            | `<div>`                                 | group (when has error) |
| Label            | `<label>`                               | —                      |
| FieldDescription | `<span>`                                | —                      |
| FieldError       | `<span>`                                | alert (live region)    |

Components prefer native elements over ARIA roles when both are equivalent.

---

## ARIA Ownership

### Field → Input relationship

Field generates IDs and distributes them to children via React context:

```
<Field>                          → provides { labelId, descriptionId, errorId, inputId }
  <Label htmlFor={inputId}>      → id={labelId}
  <FieldDescription>             → id={descriptionId}
  <FieldError>                   → id={errorId}, role="alert"
  <Input>                        → id={inputId}
                                    aria-labelledby={labelId}
                                    aria-describedby={descriptionId + errorId}
                                    aria-invalid={hasError}
                                    aria-required={required}
```

ID generation uses `useId()` from `@kairoui/hooks` (SSR-safe).

### RadioGroup → Radio relationship

RadioGroup provides context with `name`, `value`, `onChange`, `disabled`. Each Radio consumes context to determine its checked state.

---

## Form Integration

Components work with native `<form>` submission:

- `name` prop maps to native `name` attribute
- Checkbox/Radio/Switch render a hidden `<input>` for form data when using custom elements
- `required` prop adds native `required` + `aria-required`
- No custom form state manager — components are form-library agnostic
- Works with React Hook Form, Formik, or plain forms via controlled props

---

## Refs

All components forward refs to their root DOM element:

```ts
const ref = useRef<HTMLButtonElement>(null);
<Button ref={ref} />  // ref.current → <button>
```

Multi-ref composition via `useMergedRefs()` when internal + consumer refs both exist.

---

## Events

### Synthetic event props

Components expose native React event props (`onClick`, `onFocus`, `onBlur`, `onKeyDown`, etc.) and pass them through to the root element.

### Custom callbacks

- `onChange(value: T)` — normalized value (not the raw event)
- `onCheckedChange(checked: boolean)` — for Checkbox, Switch
- `onValueChange(value: string)` — for RadioGroup

### Event suppression

When `disabled` or `loading`, internal handlers prevent propagation. Consumer `onClick` etc. are not called.

---

## Slots

Each component defines its slot structure via `defineSlots()`:

```ts
// Button example
const buttonSlots = defineSlots({
  root: { defaultElement: "button", required: true, public: true },
  startIcon: { defaultElement: "span", required: false, public: true },
  content: { defaultElement: "span", required: true, public: true },
  endIcon: { defaultElement: "span", required: false, public: true },
  loadingIndicator: { defaultElement: "span", required: false, public: false },
});
```

Consumers override slots via `slots` and `slotProps` props.

---

## Variants & Sizes

### Button / IconButton

| Variant axis | Values                                | Default |
| ------------ | ------------------------------------- | ------- |
| `appearance` | `solid`, `outline`, `subtle`, `ghost` | `solid` |
| `size`       | `sm`, `md`, `lg`                      | `md`    |

### Input / Textarea

| Variant axis | Values                           | Default   |
| ------------ | -------------------------------- | --------- |
| `appearance` | `outline`, `filled`, `underline` | `outline` |
| `size`       | `sm`, `md`, `lg`                 | `md`      |

### Checkbox / Radio / Switch

| Variant axis | Values           | Default |
| ------------ | ---------------- | ------- |
| `size`       | `sm`, `md`, `lg` | `md`    |

CSS class pattern: `kui-{component}--{variant-value}` (e.g., `kui-button--ghost`, `kui-input--sm`).

---

## Density

Not a per-component prop. Density is a theme-level concern:

- Theme provides density-aware spacing tokens
- Components consume `--kui-control-height-{size}`, `--kui-spacing-inline-{size}`
- Switching density updates token values, not component code

---

## Validation States

Driven by the `Field` wrapper, not by individual inputs:

```ts
type ValidationState = "valid" | "invalid";
```

- `invalid` → sets `aria-invalid="true"` + `data-invalid=""` on the input
- `valid` → sets `data-valid=""` (no ARIA attribute needed)
- Error message renders in `FieldError` as a live region (`role="alert"`)
- Styling: border color changes via `--kui-field-border-color` token override

---

## Documentation Requirements

Every Phase 8 component must have:

1. **MDX page** in `apps/docs/docs/components/core/{name}.mdx`
2. **ComponentHeader** with status `"beta"`
3. **ImportStatement** showing canonical import
4. **Demo** for each variant axis
5. **Demo** for controlled and uncontrolled usage
6. **Demo** for disabled/loading/readOnly states
7. **Callout** for accessibility notes
8. **Props table** (manual until tooling in Phase 12.5)

---

## Shared Infrastructure vs Individual Components

### Shared (composition layer, already exists)

| Utility                                       | Location                                    |
| --------------------------------------------- | ------------------------------------------- |
| `createComponent`                             | `core/src/composition/create-component.ts`  |
| `defineSlots`, `renderSlot`                   | `core/src/composition/slot-*`               |
| `resolveDisabledProps`                        | `core/src/composition/authoring-helpers.ts` |
| `resolveButtonType`                           | `core/src/composition/authoring-helpers.ts` |
| `computeComponentState`                       | `core/src/composition/authoring-helpers.ts` |
| `componentClass`, `slotClass`, `variantClass` | `core/src/composition/class-generation.ts`  |
| `mergeProps`                                  | `core/src/composition/merge-props.ts`       |
| `useControllableState`                        | `hooks/src/use-controllable-state.ts`       |
| `useFocusVisible`                             | `hooks/src/use-focus-visible.ts`            |
| `useId`                                       | `hooks/src/use-id.ts`                       |
| `useMergedRefs`                               | `hooks/src/use-merged-refs.ts`              |

### New shared infrastructure (to add in Phase 8)

| Utility                                      | Purpose                                    |
| -------------------------------------------- | ------------------------------------------ |
| `FieldContext` + `useFieldContext`           | Pass label/description/error IDs to inputs |
| `resolveReadOnlyProps`                       | Apply readOnly semantics per element type  |
| `resolveRequiredProps`                       | Apply required + aria-required             |
| `resolveValidationProps`                     | Apply aria-invalid, data-invalid/valid     |
| `RadioGroupContext` + `useRadioGroupContext` | Pass name/value/onChange to Radio children |

### Individual component responsibility

- Slot definitions specific to the component
- Style contract specific to the component
- Component-specific keyboard handlers
- Component-specific ARIA (e.g., Switch role)
- Variant class generation

---

## File Structure Convention

```
packages/core/src/components/{name}/
├── {name}.tsx              # Component implementation
├── {name}.styles.ts        # ComponentStyleContract
├── {name}.test.tsx         # Unit tests
└── index.ts                # Barrel export
```

Shared contexts:

```
packages/core/src/components/field/
├── field-context.ts        # FieldContext + useFieldContext + FieldProvider
├── field.tsx
├── label.tsx
├── field-description.tsx
├── field-error.tsx
├── field.styles.ts
├── field.test.tsx
└── index.ts
```

---

## Component Dependency Graph

```
Field ─┬─ Label
       ├─ FieldDescription
       ├─ FieldError
       └─ Input | Textarea | Checkbox | Radio | Switch

RadioGroup ── Radio

Button (standalone)
IconButton (standalone, composes Button internally or shares contract)
```

---

## Export Strategy

New subpath export from `@kairoui/core`:

```json
{
  "./components": {
    "types": "./dist/components/index.d.ts",
    "import": "./dist/components/index.js"
  }
}
```

All Phase 8 components exported from `@kairoui/core/components`.

---

## Non-Goals (deferred)

| Feature                      | Phase             |
| ---------------------------- | ----------------- |
| Select / Combobox            | Phase 9           |
| DatePicker / TimePicker      | Phase 10          |
| Custom form state manager    | Never             |
| Application validation rules | Never             |
| Complex multi-step forms     | Application layer |
| Drag & drop                  | Phase 11          |
| Virtualized lists            | Phase 11          |
