# @kairoui-pro/scheduler

Enterprise Scheduler for KairoUI. Ships day, week, and resource-timeline views with drag-to-reschedule, edge-resize, and overlap-aware event layout.

See [`docs/architecture/PHASE14-SCHEDULER-ARCHITECTURE.md`](../../docs/architecture/PHASE14-SCHEDULER-ARCHITECTURE.md) for the contract.

## Status

- KUI-ENT-010 (this task): pure layout foundation — time-slot generation, overlap column packing, all-day lane assignment, visible-range math, resource grouping. No React, no DOM, no persistence.
- KUI-ENT-011: React views + interaction wiring.
