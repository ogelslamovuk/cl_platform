# SeatMap V2 — Autonomous Demo Mode

This document defines the working mode for Codex when the user wants a ready demo result with minimal manual checkpoints.

## Goal

Build a demo-grade SeatMap V2 experience for `cl_platform` with a visually strong complex venue layout editor/viewer. The result must be suitable for a serious product demo, not a production enterprise replacement for seats.io.

## User involvement model

The user does not want to approve every small phase.

Codex should work autonomously through the implementation package and return one complete result for visual review.

Codex should stop and ask for guidance only when one of these conditions happens:

- the app cannot build;
- the existing organizer/admin/B2C flow would need a risky architectural rewrite;
- the implementation requires removing existing v1 seatmap compatibility;
- realtime demo behavior cannot be implemented within the localStorage/prototype architecture;
- a dependency choice creates a clear incompatibility with Vite/React/TypeScript.

Otherwise Codex should proceed and document decisions in the final report.

## Demo scope

SeatMap V2 is desktop-first only.

Mobile layout is not a priority for this epic.

Complex rendered seat maps are capped at 500 seats.

Open-air/capacity-only events may keep larger capacities, but they must not render thousands of individual seats.

Realtime booking is required for the demo. In this prototype it may be implemented through shared localStorage state and cross-tab storage events. The expected demo behavior is:

- open buyer view in two browser tabs;
- buy/select a seat in one tab;
- the other tab updates seat availability without manual data reset;
- sold/blocked seats cannot be selected again.

## Visual target

The visual target is a polished demo-level experience inspired by modern seating tools such as seats.io:

- clean canvas area;
- theatre/arena-like layout, not a simple grid;
- sectors and block labels;
- diagonal blocks;
- balcony blocks;
- box/lodge blocks;
- clear stage/arena area;
- zoom and pan;
- hover tooltip for seat details;
- visible selected seat state;
- status colors for available/sold/blocked/selected;
- tariff color coding;
- no clipped canvas, no broken modal viewport, no layout hidden behind borders or side panels.

## Must keep compatible

Existing v1 flows must keep working:

- existing venue registry;
- existing seatMapLayouts;
- existing eventSeats;
- organizer event compliance form;
- admin event viewer;
- B2C purchase flow;
- capacity-only events;
- localStorage state persistence.

## Implementation preference

Use the existing core as the source of truth. Do not replace the business flow with an external seatmap product.

A visual engine based on `react-konva` / `konva` is acceptable for SeatMap V2 if build compatibility is confirmed.

## Recommended implementation strategy

Codex may collapse the earlier phase plan into one demo implementation branch/patch, but must keep internal checkpoints:

1. Read all SeatMap V2 docs.
2. Inspect existing seatmap/store/B2C/admin/organizer files.
3. Add V2 data helpers and adapters while preserving v1 compatibility.
4. Add a polished canvas viewer.
5. Add a demo complex layout generator with sectors, balcony, lodges, and diagonal blocks.
6. Add editor/demo controls needed for the visual demo.
7. Add/keep tariff assignment behavior.
8. Add/keep buyer selection behavior.
9. Add realtime demo behavior through prototype-safe state synchronization.
10. Run validation and return a clear final report.

## Required validation

Codex must run at least:

- `npm run build`
- existing tests if available and practical;
- self-check for changed files;
- check that capacity-only events still work;
- check that complex seat maps do not exceed 500 rendered seats;
- check that no canvas/modal is clipped by parent containers;
- check that the demo can be visually reviewed in admin/organizer/B2C flows.

## Final report required from Codex

The final response must include:

1. What was implemented.
2. Changed files.
3. How to visually check the result.
4. What validation was run.
5. Build result.
6. Known limitations.
7. Any risks left.
8. Confirmation that v1 flows remain compatible.
