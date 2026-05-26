# SeatMap V2 — Phase 0 analysis checklist

## Phase mode

Phase 0 is planning only.

Codex reviews the repository and returns a Phase 1 plan. Product implementation starts only after user approval.

## Objective

Prepare a safe Phase 1 implementation plan for SeatMap V2 foundation.

Phase 1 should cover:

- dependency decision;
- V2 model skeleton;
- V1-to-V2 adapter outline;
- validation plan;
- no visible UI switch yet.

## Repository areas to review

Codex should review:

- `SKILLS.md`
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

## Questions for Phase 0

Codex should answer:

1. Where should V2 types live?
2. Should V2 types be in `store.ts` or in a separate seatmap V2 helper file?
3. What is the safest adapter shape from V1 layouts to V2 layouts?
4. Does current `useStorageSync` support cross-tab realtime demo behavior?
5. What minimal dependency change is needed for canvas rendering?
6. Which files should Phase 1 touch?
7. Which files should Phase 1 leave unchanged?
8. What checks should run after Phase 1?

## Phase 1 boundaries

Phase 1 is foundation-only.

It should not switch the visible UI to V2 yet.
It should not replace purchase flow yet.
It should not replace organizer compliance flow yet.
It should not replace the admin registry flow yet.
It should not remove V1 seat map data.

## Required Phase 0 response

Codex should return:

1. concise understanding of expected result;
2. reviewed files list;
3. proposed Phase 1 changed files list;
4. proposed Phase 1 implementation steps;
5. files that will stay unchanged in Phase 1;
6. validation plan;
7. risks and mitigation;
8. recommendation on `react-konva` / `konva` for Phase 1.

Phase 1 starts only after explicit user approval.
