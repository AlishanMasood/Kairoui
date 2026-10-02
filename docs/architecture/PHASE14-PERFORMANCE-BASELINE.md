# Phase 14 Enterprise Performance Baseline

Measured: 2026-10-03

## Method

- Consumer bundles are one named root export per build, bundled by esbuild as browser ESM with tree shaking; React, React DOM, and JSX runtime are external peers.
- Raw JS is the unminified bundle output. Minified JS is esbuild `--minify`; gzip uses level 9 and Brotli uses quality 11 on the minified output.
- CSS is measured separately from each package's shipped `dist/styles.css`, both raw and esbuild-minified; gzip and Brotli apply to minified CSS.
- Render and update timings use React Testing Library in happy-dom. They are smoke baselines, not browser frame-rate claims. DataGrid scroll timing measures one scroll event plus its scheduled animation frame.

## Consumer Bundle Sizes

| Import scenario                   | Raw JS (B) | Minified JS (B) | Gzip (B) | Brotli (B) |
| --------------------------------- | ---------: | --------------: | -------: | ---------: |
| DataGrid                          |     78,163 |          33,944 |   11,178 |     10,042 |
| Command Palette                   |     38,149 |          16,473 |    6,014 |      5,374 |
| Scheduler                         |     66,744 |          32,294 |    9,940 |      8,981 |
| Kanban                            |     46,822 |          22,943 |    7,106 |      6,373 |
| Permission Matrix                 |     42,085 |          21,314 |    6,450 |      5,786 |
| Workflow Stepper                  |     27,241 |          13,200 |    4,590 |      4,157 |
| Shared enterprise infrastructure* |     17,486 |           7,683 |    3,075 |      2,688 |

*The shared scenario imports Command overlay primitives, DataGrid's shared data-table utilities, shared controllable/event hooks, and the virtual-range utility. It is an independent measurement, not an additional cost to sum into each component bundle.

The original broad `@kairoui/core/components` imports caused DataGrid to bundle 414,470 B raw and Command 373,700 B raw; a broad shared-foundation import measured 352,230 B raw. Narrow, tree-shakeable interop subpaths reduced the same scenarios to the measurements above. Core's shipped component surface remains available at its original entrypoint.

## Stylesheets

| Package           | Raw CSS (B) | Minified CSS (B) | Gzip (B) | Brotli (B) |
| ----------------- | ----------: | ---------------: | -------: | ---------: |
| Scheduler         |       8,374 |            7,254 |    1,364 |      1,164 |
| Kanban            |       4,243 |            3,546 |    1,012 |        829 |
| Permission Matrix |       6,132 |            5,408 |    1,166 |        973 |
| Workflow          |       5,514 |            4,597 |    1,140 |        947 |

DataGrid and Command do not ship package-specific CSS.

## Runtime Workloads

| Component         | Dataset/configuration                                                    | Initial render (ms) | Update (ms) |     Scroll (ms) | Rendered DOM                             |
| ----------------- | ------------------------------------------------------------------------ | ------------------: | ----------: | --------------: | ---------------------------------------- |
| DataGrid          | 1,000 rows, non-virtualized                                              |              599.50 |      245.72 |               — | 1,000 rows                               |
| DataGrid          | 1,000 rows, non-virtualized                                              |              646.53 |      241.49 |               — | 1,000 rows                               |
| DataGrid          | 10,000 rows, virtualized, 320 px viewport / 32 px rows                   |               24.50 |        7.54 |           22.66 | Fewer than 50 rows after scroll          |
| Command           | 500 registered items; filter to one result                               |              268.89 |       85.76 |               — | 500 registered options                   |
| Scheduler         | 2,000 events, week view                                                  |              304.84 |       97.17 | Not virtualized | 402 event nodes after overlap cap/layout |
| Kanban            | 2,000 cards / 20 columns; both virtualization flags enabled              |              730.93 |      435.20 |    Not windowed | All 2,000 cards                          |
| Permission Matrix | 100 subjects × 50 actions (5,000 cells); row virtualization flag enabled |              743.20 |      524.04 |    Not windowed | All 5,000 cells                          |
| Workflow          | 500 steps                                                                |              229.48 |      104.97 |  Not applicable | All 500 steps                            |

These timings are single-run happy-dom baselines. CI checks use generous ceilings to detect large regressions, not to promise user-device latency. The Kanban and Permission Matrix sizing/virtualization props currently do not window rendered DOM; Scheduler has no virtualization. Those limitations are deliberately visible in both this report and the benchmark output. No accessibility behavior was removed or bypassed for performance.

## CI Budgets

Hard ceilings are 50% above the measured consumer baselines (rounded to practical byte limits). They live in `tooling/test/enterprise-bundle-budgets.test.ts`; runtime workloads and ceilings are in `tooling/test/enterprise-performance.test.tsx`.

| Scenario              | Raw JS (B) | Minified JS (B) | Gzip (B) | Brotli (B) |
| --------------------- | ---------: | --------------: | -------: | ---------: |
| DataGrid              |    120,000 |          52,000 |   17,000 |     15,500 |
| Command Palette       |     60,000 |          26,000 |    9,300 |      8,300 |
| Scheduler             |    102,000 |          50,000 |   15,500 |     14,000 |
| Kanban                |     72,000 |          36,000 |   11,000 |     10,000 |
| Permission Matrix     |     65,000 |          33,000 |   10,000 |      9,000 |
| Workflow Stepper      |     42,000 |          20,500 |    7,200 |      6,500 |
| Shared infrastructure |     28,000 |          12,500 |    4,800 |      4,200 |

CSS budgets are 13,000 / 11,500 / 2,200 / 1,900 B for Scheduler; 6,500 / 5,500 / 1,600 / 1,300 B for Kanban; 9,500 / 8,500 / 1,800 / 1,500 B for Permission Matrix; and 8,500 / 7,200 / 1,800 / 1,500 B for Workflow (raw / minified / gzip / Brotli).

The existing `@kairoui/core` unpacked-package budget remains 1,900 KB. Local sourcemaps remain available in build output but are excluded from the published core package; `npm pack --dry-run` measured 695,789 B unpacked after exclusion. The budget itself was not raised.
