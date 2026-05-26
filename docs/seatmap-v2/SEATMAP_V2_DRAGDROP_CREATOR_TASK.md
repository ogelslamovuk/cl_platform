# SeatMap V2 Drag-and-Drop Constructor Task

## 1. Purpose

The current SeatMap V2 implementation provides a polished complex demo layout and viewer, but it does not yet provide a real visual constructor for creating complex layouts from the admin UI.

This task adds a demo-grade drag-and-drop constructor so an admin can build a complex venue layout without editing code.

The expected result is not an enterprise seats.io replacement. The expected result is a strong demo-grade visual builder that can create convincing theatre/arena-style layouts from reusable blocks.

## 2. Current problem

In `Admin -> Площадки -> Создать площадку`, the current UI still offers only:

- generated simple rectangular seating;
- rows;
- seats per row.

That is not enough. The user needs to create a complex venue layout visually, not only open the pre-seeded Grand Theatre demo layout.

## 3. Required user-facing result

The admin user must be able to:

1. Open the venue creation flow.
2. Choose layout mode:
   - `Простая схема`;
   - `Сложная схема / конструктор`;
   - `Open-air / без мест`.
3. For `Сложная схема / конструктор`, open a full-screen or large modal visual builder.
4. Add reusable seating blocks by clicking toolbar buttons.
5. Drag blocks around the canvas.
6. Rotate blocks.
7. Resize or adjust block parameters where practical.
8. Select a block and edit basic parameters in a side panel.
9. Delete selected blocks.
10. See seats generated inside blocks.
11. Keep the total rendered seats within the demo limit of 500.
12. Save the resulting layout as a venue/hall seat map.
13. Open the saved venue layout later in admin, organizer compliance, B2C, and channel viewer.

## 4. Required builder blocks

The first demo-grade version must support these block types:

### 4.1 Straight seating block

Use for parter / central seating.

Configurable fields:

- block name;
- rows;
- seats per row;
- row spacing;
- seat spacing;
- tariff/category default.

### 4.2 Diagonal seating block

Use for side sectors.

Configurable fields:

- block name;
- rows;
- seats per row;
- angle / rotation;
- row spacing;
- seat spacing;
- tariff/category default.

### 4.3 Balcony block

Use for elevated back seating.

Configurable fields:

- block name;
- rows;
- seats per row;
- visual label `Балкон`;
- tariff/category default.

The first version may represent the balcony as a straight or lightly curved block if that is safer for the demo.

### 4.4 Lodge / box block

Use for theatre boxes.

Configurable fields:

- block name;
- number of seats;
- label, for example `Ложа 1`;
- visual box boundary;
- tariff/category default.

### 4.5 Stage / arena object

Non-seat visual object.

Configurable fields:

- label;
- shape type: `stage`, `orchestra pit`, `arena`;
- position;
- size.

This object must not count as seats.

## 5. Builder UI requirements

Add a clear visual constructor UI.

Recommended layout:

- top header: layout name, seat count, save/cancel;
- left toolbar: add block buttons;
- center canvas: drag/drop editor;
- right properties panel: selected object settings.

Toolbar buttons should include:

- `+ Партер / прямой блок`;
- `+ Боковой сектор / диагональный блок`;
- `+ Балкон`;
- `+ Ложа`;
- `+ Сцена / объект`;
- `Удалить выбранное`;
- `Вписать`;
- `+` zoom;
- `-` zoom.

The builder must visually distinguish:

- seats;
- selected block;
- block boundary;
- sector/block labels;
- tariff colors;
- stage/arena objects.

## 6. Drag-and-drop requirements

The builder must allow drag-and-drop editing of blocks, not only seats.

Required:

- block dragging;
- selected block highlight;
- rotation control or rotation input;
- position persisted after save;
- saved layout opens with the same block positions.

Nice to have, only if safe:

- resize handles;
- snap-to-grid;
- multi-select.

Do not spend time on nice-to-have if it risks breaking the demo.

## 7. Data model and compatibility

Preserve existing SeatMap V1 and V2 compatibility.

Do not remove:

- `SeatMapSeat`;
- `SeatMapLayout.seats`;
- `EventSeat`;
- `event.eventSeats`;
- `layoutId`;
- capacity-only flows.

The drag-and-drop builder may store a V2 layout structure in the existing layout record or in an attached V2 field, but it must still produce a flattened seat list compatible with existing purchase and tariff flows.

Required rule:

- The saved complex layout must be consumable by existing B2C purchase, organizer tariff assignment, admin viewer, and channel viewer.

## 8. Realtime demo requirement

Realtime demo behavior remains mandatory.

A sold seat must become unavailable in another open tab through the existing localStorage/storage-event sync or a compatible MVP mechanism.

No server-side locking is required for this demo task.

## 9. Limits

- Desktop-first only.
- No mobile optimization required.
- Maximum rendered seats for complex seated layouts: 500.
- Open-air/capacity-only venue may have larger capacity but must not render thousands of seats.
- If the builder would exceed 500 seats, block save or show a clear warning.

## 10. Visual quality bar

The result must not look like a rough debug canvas.

Minimum visual quality:

- clean dark admin-compatible UI;
- strong contrast;
- readable block labels;
- polished block borders;
- visible seat dots/circles;
- stage/arena visually clear;
- no clipping inside modal/container;
- fit-to-view works;
- zoom/pan works;
- saved complex layout looks convincing in B2C viewer.

The canvas must not be hidden, clipped, shifted, or trapped by container overflow/borders.

## 11. Where to integrate

Primary integration point:

- `Admin -> Площадки -> Создать площадку`.

Existing simple mode should remain available.

Add complex constructor path in the same flow or as an adjacent button from the create venue modal.

The saved venue must appear in the venue registry as a normal venue with a scheme.

Visual review routes:

- `#/admin` -> `Площадки` -> create a new complex venue -> open its scheme;
- `#/organizer/compliance` -> select the newly created complex venue -> assign tariffs;
- `#/demo` -> use a published demo event with complex layout or create/update demo seed if needed;
- `#/channel` -> verify viewer does not break;
- capacity-only venue remains without seat rendering.

## 12. Implementation approach

Recommended approach:

1. Inspect current SeatMap V2 files and current admin venue creation flow.
2. Add a dedicated constructor component, for example:
   - `src/components/seatmap/SeatMapConstructorCanvas.tsx`
   - optional helpers in `src/lib/seatMapV2.ts`
3. Implement block-level drag/rotate/save.
4. Generate flattened compatible seats from blocks.
5. Wire the constructor into `AdminVenueRegistry` create flow.
6. Preserve existing simple rectangular creation.
7. Add/update tests for:
   - block generation;
   - seat count limit;
   - flattening into compatible seats;
   - capacity-only no-render behavior if practical.

## 13. Validation required

Codex must run:

- `npm run build`;
- `npm run test -- --run` if available and practical;
- `git diff --check`.

Codex must also perform smoke validation on live or local routes depending on its environment:

1. Admin create complex venue.
2. Drag a block.
3. Rotate a block.
4. Save layout.
5. Reopen saved layout and verify positions persisted.
6. Open saved layout from organizer compliance.
7. Verify capacity-only venue still shows no rendered seats.
8. Verify V1 fallback still opens.
9. Verify no console errors on the checked path.
10. Verify complex layout does not exceed 500 rendered seats.

## 14. Final report required

Final report must include:

1. What was implemented.
2. Changed files.
3. How to visually check the constructor.
4. Build result.
5. Test result.
6. Smoke validation result.
7. Known limitations.
8. Remaining risks.
9. Confirmation that V1 and capacity-only flows remain compatible.

## 15. Acceptance

Accept only if all are true:

- Admin can create a complex layout through UI, not by hardcoded seed only.
- Blocks can be dragged.
- Blocks can be rotated.
- Lodges/boxes can be added.
- Balcony can be added.
- Diagonal side blocks can be added.
- Stage/arena object can be added.
- Layout can be saved.
- Saved layout can be reopened.
- Saved layout is visible in B2C/admin/organizer paths.
- Rendered seats stay within 500-seat demo limit.
- V1 fallback remains compatible.
- Capacity-only venue remains compatible.
- `npm run build` passes.
- The UI does not look broken, clipped, or like an unstyled debug tool.
