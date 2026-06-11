# Context

`cl_platform` is a demo-first prototype of a Belarus-oriented state-level platform for cultural and mass events.

The current B2C афиша has demo posters that look like repeated minimal mock SVGs. The approved direction is to integrate a final set of 17 generated PNG posters that look like realistic cultural/commercial event posters.

## Product intent
Make the public B2C event listing credible and presentation-ready:
- realistic event posters;
- believable variety of event genres;
- human-centered poster visuals;
- no mock/minimal/placeholder feel;
- no repeated poster template;
- no broken images;
- no stale duplicate demo events.

## Important approved product decisions
- There must remain 17 demo posters / 17 poster assets.
- Михаил Стасов is a fictional famous chanson/estrada star and must appear at the top of the public афиша.
- Андре Ботичелли is a fictional talented cellist. He must not resemble Andrea Bocelli.
- Джимми Торнтон is a fictional aging rock legend. He must not resemble a real rock celebrity.
- All poster assets are PNG, vertical 2:3.
- Codex should only integrate assets and update demo data; Codex must not generate or redraw posters.

## Current source observations
Current poster references are centralized in `src/lib/demoEngine.ts` in `DEMO_POSTERS` and demo seeds.
Current B2C poster rendering is in `src/components/B2CView.tsx` through `PosterArtwork` and `event.poster`.
Current B2C event sorting may prioritize seatmap/date. This must be minimally adjusted so Михаил Стасов is top-priority without redesigning the page.

## Deployment acceptance
This task is not accepted as a PR or a patch-only result. It is accepted only when the updated pages are deployed via the existing repository deployment flow and live routes are smoke-checked.

## Persisted demo-data concern
Some event titles are being renamed. Existing localStorage demo data may still contain old titles. The implementation must clean old renamed demo records before reseeding/enriching, otherwise B2C may show stale duplicates.

## Main no-break requirement
Do not break:
- organizer registration/application flow;
- organizer event application flow;
- admin approval flow;
- published events reaching B2C;
- B2C purchase flow;
- seatmap selection for seatmap events;
- channel/operator flows.
