# SeatMap V2 — architecture

## Current state

The current project already has a seat map MVP:

- `src/components/seatmap/SeatMapModal.tsx`
- `src/components/seatmap/SeatMapPreview.tsx`
- seat map types and helpers in `src/lib/store.ts`
- venue registry in admin console
- organizer event compliance flow
- B2C purchase flow

The current visual implementation is grid-based and is good for rectangular halls only. It must remain working while V2 is introduced.

## Architecture direction

SeatMap V2 should keep the existing business core and gradually replace the visual layer.

Keep:

- venue registry as the source of truth for venues;
- existing organizer compliance flow;
- existing event and ticket model;
- existing B2C purchase flow;
- existing localStorage state model for MVP;
- existing SeatMap v1 as fallback during migration.

Add:

- V2 layout data model;
- old-to-v2 adapter;
- canvas-based read-only viewer;
- later canvas-based editor;
- demo complex layout seed;
- demo realtime behavior through existing storage sync model.

## Preferred visual engine

Use `react-konva` / `konva` unless implementation analysis finds a blocking reason.

Reason:

- React-friendly canvas layer;
- shapes and groups;
- pointer events;
- drag support;
- transform support;
- good fit for sectors, rotated blocks and zoom/pan.

Do not build complex geometry on CSS grid.

## Proposed V2 model

Add V2 types without deleting V1 types.

Suggested hierarchy:

- `SeatMapLayoutV2`
  - `sectors[]`
  - `objects[]` for stage / ice / labels / visual shapes if needed
- `SeatMapSectorV2`
  - id
  - name
  - type
  - x, y
  - rotation
  - blocks[]
- `SeatMapBlockV2`
  - id
  - sectorId
  - name
  - type: `straight`, `diagonal`, `arc`, `balcony`, `box`, `openArea`
  - x, y
  - rotation
  - rows[]
- `SeatMapRowV2`
  - id
  - blockId
  - label
  - seats[]
- `SeatMapSeatV2`
  - seatId
  - label
  - row
  - number
  - x, y
  - radius or size
  - tariffId / tariffName / price / color
  - status

The exact shape may be adjusted during implementation, but the hierarchy must support sector/block/row/seat and block transforms.

## Compatibility

Do not remove V1 fields:

- `SeatMapSeat`
- `SeatMapLayout`
- `EventSeat`
- `event.eventSeats`
- `event.layoutId`

Add V2 fields in a backward-compatible way, for example:

- `SeatMapLayout.layoutV2?`
- or `SeatMapLayoutV2[]` in state, if migration is clearly controlled.

Prefer the smallest safe change.

## Adapter

Old rectangular layouts must be converted to V2 on the fly or through migration:

`SeatMapLayout.seats[]` -> one sector -> one block -> rows -> seats.

Existing simple layouts must not disappear from UI.

## Realtime demo model

For demo, realtime means cross-tab synchronization of sold seat status.

Expected mechanism:

- purchase updates ticket / event seat status in state;
- state is saved to localStorage;
- other tab receives storage event through existing storage sync hook;
- viewer re-renders sold state.

No production backend lock is required in this epic.

## Visual layout safety

Canvas/viewer must have:

- fit-to-view button or automatic fit on open;
- zoom controls;
- pan support;
- full container sizing;
- no clipped scheme due to modal overflow;
- clear stage / arena / balcony labels;
- readable tooltips.

## Phasing principle

Every implementation phase must be small enough to review.

Do not implement model, viewer, editor, tariff assign and buyer mode in one PR.
