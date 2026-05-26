# SeatMap V2 — testing and validation protocol

## Purpose

The user should not perform deep testing after each phase.

Codex must perform the main validation and provide a short visual review point so the user can quickly inspect the result.

## Mandatory validation after every implementation phase

Codex must run:

1. `npm run build`
2. `git diff --name-only`
3. check that only allowed files changed
4. inspect the diff for duplicated JSX, duplicated arrays, duplicated buttons and dead code
5. verify that existing seat map v1 fallback is not broken unless the phase explicitly replaces it
6. verify that capacity-only events still work
7. verify that routes compile:
   - `/main`
   - `/demo`
   - `/organizer`
   - `/admin`
   - `/channel`

If automated route testing is not available, Codex must state that route validation is build-level only and list what was not manually verified.

## Mandatory visual safety checks for viewer/editor phases

For phases that render the V2 map, Codex must verify and report:

- the scheme is visible in full at initial open;
- fit-to-view works or auto-fit is applied;
- zoom in works;
- zoom out works;
- pan works;
- no major clipping by container, modal, card, border or overflow;
- tooltip appears on hover;
- selected state is visually clear;
- sold / blocked / available states are visually distinct;
- layout remains readable at normal desktop width.

Mobile-specific validation is not required for this epic.

## Realtime demo validation

For buyer/realtime phases, Codex must validate or provide exact steps:

1. Open B2C/demo route in tab A.
2. Open the same route in tab B.
3. In tab A, buy/select a seat.
4. Confirm state persists to localStorage.
5. Confirm tab B updates through storage synchronization.
6. Confirm sold seat cannot be selected again.

If Codex cannot perform browser-level validation, it must clearly state this and provide a deterministic code-level validation of the storage/update path.

## 500-seat cap validation

For complex seat maps:

- rendered individual seats must be <= 500;
- open-air/capacity-only events may exceed 500 capacity but must not render individual seats;
- demo complex layout should preferably be 150-350 seats for performance and visual clarity.

## User visual review format

After each visual phase, Codex must provide:

- route to open;
- what to click;
- what the user should see;
- no more than 5 visual checks.

Example:

1. Open `/admin`.
2. Go to venue registry.
3. Open demo complex hall.
4. Check that parterre, balcony, side sectors and lodges are visible.
5. Check that zoom/pan does not clip the map.

## Final report format for each phase

Codex final report must include:

- phase name;
- changed files;
- build result;
- self-check result;
- smoke result;
- visual review route;
- known limitations;
- whether it is safe to proceed to the next phase.

Do not use vague statuses like `partly works`.
Use clear statuses:

- pass;
- fail;
- not executed with reason.
