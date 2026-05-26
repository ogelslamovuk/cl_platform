# SeatMap V2 — phased task queue

## Rollback point

Known successful baseline before SeatMap V2 work:

- branch: `backup/seatmap-v1-success-2026-05-21`
- commit: `8e3991c34d17d1d252c24273587c17dbc99757a2`

## Global rule

Each phase must be approved separately.

Codex must not continue from one phase to the next without explicit approval.

Each implementation phase must include:

- exact changed files;
- build result;
- self-check result;
- smoke test result;
- visual review route for the user.

## Phase 0 — Analysis and implementation plan

Mode: analysis only.

Goal:

- read task package;
- inspect relevant files;
- produce exact Phase 1 plan;
- do not change app code.

Relevant areas to inspect:

- `package.json`
- `src/lib/store.ts`
- `src/hooks/useStorageSync.ts`
- `src/components/seatmap/SeatMapModal.tsx`
- `src/components/seatmap/SeatMapPreview.tsx`
- `src/components/B2CView.tsx`
- `src/pages/OrganizerEventCompliancePage.tsx`
- `src/components/admin/AdminRegistries.tsx`
- `src/components/admin/AdminEvents.tsx`
- `src/lib/demoEngine.ts`

Output required:

1. understanding;
2. proposed Phase 1 files;
3. implementation plan;
4. risks;
5. validation plan;
6. visual review point.

## Phase 1 — Dependency and V2 skeleton

Goal:

- add canvas dependency if accepted after analysis;
- add V2 type skeleton and adapter stubs;
- do not switch UI to V2 yet.

Expected implementation:

- add `konva` and `react-konva` if not present;
- add V2 types in a controlled place;
- add pure adapter function from V1 layout to V2 layout;
- add unit-like test or deterministic assertion if current test setup allows it;
- no visual UI change yet.

Acceptance:

- build passes;
- existing routes still compile;
- old SeatMapModal and SeatMapPreview remain untouched or only import-compatible;
- no visible behavior change for user yet.

Visual review:

- no required user visual review, because this phase is foundation-only.

## Phase 2 — Read-only Canvas Viewer with sample complex layout

Goal:

- create V2 read-only viewer;
- render one complex demo layout;
- do not replace buyer flow yet.

Expected implementation:

- `SeatMapViewerCanvas.tsx` or equivalent;
- stage/arena visual object;
- sectors and blocks;
- hover tooltip;
- zoom/pan/fit-to-view;
- demo complex layout capped under 500 seats.

Acceptance:

- complex demo layout renders fully inside container;
- no clipping by modal/borders/overflow;
- zoom/pan works;
- hover shows seat/row/tariff/price;
- build passes.

Visual review route:

- one exact route/page must be provided by Codex after implementation.

## Phase 3 — Admin integration for visual review

Goal:

- expose the complex V2 viewer in a safe admin/demo place;
- user can visually inspect without going through full purchase flow.

Expected implementation:

- add a demo venue or demo button in existing allowed admin/demo area;
- do not create a second venue registry;
- use current venue registry source of truth.

Acceptance:

- user can open complex hall viewer from a known route;
- old simple schemes still work;
- capacity-only events still work.

Visual review:

- user opens exact route and confirms layout quality.

## Phase 4 — Canvas editor MVP for blocks

Goal:

- allow block-level editing for demo layouts.

Expected implementation:

- select block;
- move block;
- rotate block;
- save block transform;
- keep seats inside block coherent.

Not required:

- full manual editing of every individual seat;
- mobile UX;
- CAD/SVG import.

Acceptance:

- block can be moved and rotated;
- layout persists after reload;
- scheme still fits into viewer.

Visual review:

- user opens editor route, rotates/moves a block, saves, reloads.

## Phase 5 — Generators for demo-grade layouts

Goal:

- provide enough geometry tools to build impressive demo halls.

Generators:

- straight block;
- rotated/diagonal block;
- balcony block;
- box/lodge block;
- arc sector block;
- arena side sector block.

Acceptance:

- complex theater sample can be generated;
- complex arena sample can be generated;
- each sample stays under 500 rendered seats;
- labels are readable.

Visual review:

- user compares generated samples visually.

## Phase 6 — Tariff assignment on V2 viewer/editor

Goal:

- assign tariffs by block/row/seat in V2.

Expected implementation:

- select block/row/seat;
- assign tariff;
- block seats;
- update eventSeats / derived tickets consistently;
- preserve existing organizer compliance flow.

Acceptance:

- tariff counts update correctly;
- blocked seats are not for sale;
- tooltip shows assigned tariff and price.

## Phase 7 — Buyer mode and realtime demo

Goal:

- buyer selects and buys seats on V2 viewer;
- realtime demo works across tabs.

Acceptance:

- tab A buys a seat;
- tab B sees sold status without manual state editing;
- sold/blocked seats cannot be selected;
- capacity-only event purchase still works;
- existing simple event purchase still works.

Visual review:

- two-tab demo scenario.

## Phase 8 — Cleanup and fallback policy

Goal:

- decide what remains as fallback;
- remove only dead code that is safe to remove.

Acceptance:

- no duplicated visible flows;
- no broken old events;
- no broad refactor beyond approved cleanup.
