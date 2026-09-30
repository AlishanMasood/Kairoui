# @kairoui-pro/kanban

Enterprise Kanban board for KairoUI. Board → Columns → Cards with
pointer drag/drop, first-class keyboard movement, custom card
renderers, empty-column drop targets, virtualization, and RTL
support.

See [`docs/architecture/PHASE14-KANBAN-ARCHITECTURE.md`](../../docs/architecture/PHASE14-KANBAN-ARCHITECTURE.md)
for the contract.

## Usage

```ts
import "@kairoui-pro/kanban/styles.css";
```

```tsx
<Kanban
  columns={cols}
  cards={cards}
  onCardMove={({ card, toColumnId, toIndex, order }) => persist(card.id, toColumnId, order)}
  onColumnMove={({ column, toIndex, order }) => persistColumn(column.id, order)}
/>
```
