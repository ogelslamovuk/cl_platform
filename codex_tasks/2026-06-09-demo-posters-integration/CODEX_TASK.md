# Task

## Goal
Integrate the final 17 generated PNG posters into the existing `cl_platform` demo data and B2C афиша, then deploy and verify the updated pages.

## Product context
`cl_platform` is a demo-first ministry-level prototype. The visible demo flow matters more than hidden technical depth. The current B2C poster set looks like minimal placeholder/mocked SVG artwork. The approved target is a realistic, professional, diverse poster pack wired into existing demo events and public B2C cards.

The main chain must remain intact:

```text
Кандидат в организаторы → Организатор → Заявка на мероприятие → Центр Управления → Одобренное событие → Операторы / розница / билеты
```

## Approved scope
- Validate 17 provided PNG poster files.
- Copy 17 PNG files into `public/demo/posters/`.
- Update poster references and demo event content in existing demo data.
- Ensure B2C афиша and event details use the new poster paths everywhere they render these public demo events.
- Ensure Михаил Стасов appears first/top-priority in B2C афиша.
- Ensure stale renamed demo events do not remain as duplicate cards from localStorage demo data.
- Preserve existing purchase flow and seatmap behavior.
- Run local build and smoke checks.
- Deploy through the existing repository deployment mechanism.
- Verify deployed live pages.

## Out of scope
- No image generation.
- No image editing.
- No UI redesign.
- No new routes.
- No production backend.
- No real integrations.
- No new seatmap implementation.
- No admin/operator logic redesign.
- No broad refactor.
- No pull request.
- No patch-only final result.

## Files / areas to inspect first
- `SKILLS.md`
- `CL_PLATFORM_CONTEXT.md` if present
- `src/lib/demoEngine.ts`
- `src/components/B2CView.tsx`
- existing `public/demo/posters/`
- `package.json`
- existing deployment config: `.github/workflows/`, Vite/base config, GitHub Pages configuration if visible in repo

Expected edit areas:
- `src/lib/demoEngine.ts`
- `src/components/B2CView.tsx` only if required for top-priority B2C ordering / poster fitting
- `public/demo/posters/*.png` new asset files

## Implementation requirements

### 1. Validate input assets
Before changing code:
- locate generated PNGs in the task package `poster_assets_here/` or `images_task/generated_posters/`;
- accept either a zip archive or extracted PNG files;
- validate exact filenames against `POSTER_ASSET_MANIFEST.md`;
- stop with blocker report if any required file is missing.

### 2. Copy assets
Copy exactly 17 PNG files into:

```text
public/demo/posters/
```

Use paths in code as:

```text
/demo/posters/<filename>.png
```

Do not delete old SVG files.

### 3. Update `DEMO_POSTERS`
In `src/lib/demoEngine.ts`, update the poster registry so target events use PNG paths from `POSTER_ASSET_MANIFEST.md`.

Preferred safe approach:
- add new explicit poster keys where event meaning changed, e.g. `mikhailStasov`, `andreBoticelli`, `jimmyThornton`, `gorodGovorit`, `simfoniyaKino`, `slyozyNaAsfalte`;
- update existing keys that still represent the same event, e.g. `vasilkovyKraj`, `kazkiPalessya`, etc.;
- avoid keeping misleading old keys for newly renamed events if that makes the code confusing.

### 4. Update `DEMO_APPS` seeds
Update titles, categories, descriptions and posters according to `DEMO_CONTENT_TARGET_MATRIX.md`.

Important changed seeds:
- `Театральный форум «Сцэна Беларусі»` → `Премьера спектакля «Слёзы на асфальте»`.
- `Музыкальный вечер «Звоны Нясвіжа»` → `Андре Ботичелли — «Виолончель при свечах»`.
- `Камерный концерт «Дняпроўскія галасы»` → `Джимми Торнтон — «Only Hits Live»`.
- `Концерт мастеров искусств «Беларусь у сэрцы»` → `Гала-концерт «Беларусь у сэрцы»`.
- `Концерт «Песня роднай зямлі»` → `Национальный концерт «Песня роднай зямлі»`.
- `Хореографическая программа «Кола традыцый»` → `Танцевальная программа «Кола традыцый»`.
- `Выставочная программа «Спадчына і сучаснасць»` → `Музейная программа «Спадчына і сучаснасць»`.
- `Областной праздник «Купальскі вянок»` → `Праздник «Купальскі вянок»`.

Keep venue/city/layout/capacity mechanics stable unless the matrix explicitly states otherwise.

### 5. Update special demo events
Update these functions in `src/lib/demoEngine.ts`:

#### `ensureSoldOutEvent`
Replace old theatre sold-out event with:
- title: `Михаил Стасов — «Вернусь к тебе»`
- category: `Концерты`
- venue: `Дворец Республики`
- city: `Минск`
- poster: `/demo/posters/poster-mikhail-stasov-vernus-k-tebe.png`
- description: professional sold-out star concert description
- role: sold-out demo case

Keep event id `demo_event_sold_out` unless there is a hard technical reason not to. This helps existing demo links and tickets stay stable.

#### `ensureTodayNearSoldOutEvent`
Replace old near-sold-out chamber concert with:
- title: `Стендап-вечер «Город говорит»`
- category: `Шоу`
- venue: `Клубная площадка`
- city: `Минск`
- poster: `/demo/posters/poster-gorod-govorit.png`
- role: near sold-out today demo case

Keep event id `demo_event_today` unless there is a hard technical reason not to.

#### `ensureApprovedUnpublishedEvent`
Update old `Вечер симфонической музыки` to:
- title: `Большой концерт «Симфония кино»`
- category: `Концерты`
- venue: `Большая концертная сцена`
- city: `Минск`
- poster: `/demo/posters/poster-simfoniya-kino.png`
- role: approved but unpublished event

#### `ensureSeatMapDemoEvent`
Update the seatmap demo event to:
- title: `Большой концерт «Симфония кино»`
- poster: `/demo/posters/poster-simfoniya-kino.png`
- description consistent with orchestra / film music / reserved seating

Keep its seatmap/layout behavior intact.

### 6. Prevent stale duplicate events
Because demo data is persisted in localStorage and some seed titles are renamed, update cleanup logic so old renamed demo titles are removed before the new seeds are created.

Required old titles/phrases to clean from demo state:
- `Театральный форум «Сцэна Беларусі»`
- `Музыкальный вечер «Звоны Нясвіжа»`
- `Камерный концерт «Дняпроўскія галасы»`
- `Концерт мастеров искусств «Беларусь у сэрцы»`
- `Концерт «Песня роднай зямлі»`
- `Хореографическая программа «Кола традыцый»`
- `Выставочная программа «Спадчына і сучаснасць»`
- `Областной праздник «Купальскі вянок»`
- `Спектакль «Тёплый вечер у ратуши»`
- `Камерный концерт «Песня роднай зямлі»`
- `Вечер симфонической музыки`
- `Гала-концерт в Большой концертной сцене`

Implement this safely inside existing demo cleanup/enrichment flow. Remove matching stale demo records across relevant arrays where currently cleaned: events, applications, tickets, operations, demoPurchases, eventComplianceApplications. Do not wipe user-created non-demo data broadly.

### 7. Ensure B2C poster rendering works
Inspect `src/components/B2CView.tsx`:
- Keep the existing poster frame/card layout unless a minimal fix is necessary.
- Ensure PNG poster paths resolve through the existing public asset resolver.
- Ensure poster images remain vertical 2:3 and fill the card frame without distortion.
- Do not create a new gallery/card component.

### 8. Put Михаил Стасов at the top of афиша
Current sorting may prioritize seatmap events before date. Implement a minimal explicit showcase priority in B2C sorting so `demo_event_sold_out` / `Михаил Стасов — «Вернусь к тебе»` appears first.

Allowed minimal approach:
- add a local priority helper in `B2CView.tsx`, e.g. by eventId and/or title;
- sort first by priority, then preserve existing seatmap/date logic.

Do not redesign filters/cards or change purchase behavior.

### 9. Deploy and verify
After implementation and local validation:
- inspect the existing repo deployment setup;
- do not add a new deployment workflow unless the repository explicitly already requires an update for this task;
- do not create a PR;
- commit only the approved files changed for this task;
- push to the branch used by the existing deployment setup;
- wait for existing GitHub Actions / GitHub Pages / deployment workflow to complete;
- if deployment cannot be triggered or checked because of permissions/config, stop and return a blocker report with exact reason;
- after deployment, smoke-check live deployed routes `/main`, `/demo`, `/admin`, `/channel`.

## UX/content requirements
- Poster frame must look clean and professional.
- No broken images.
- No placeholder SVGs for the 17 target events.
- No duplicate old renamed events in B2C.
- B2C card metadata must remain readable.
- All visible text remains Russian, except approved fictional English concert subtitle `Only Hits Live` for Джимми Торнтон.

## Data/demo requirements
- 17 target posters must be wired into 17 target demo event meanings.
- Михаил Стасов is top-priority and sold-out.
- Андре Ботичелли and Джимми Торнтон are personal solo concerts with distinct event content.
- `Большой концерт «Симфония кино»` must be consistent in both approved-unpublished and seatmap demo contexts if both remain.
- Open-air/capacity-only events must not open detailed seatmap.
- Seatmap event must continue to support B2C seat selection.

## Forbidden changes
- No image generation.
- No UI redesign.
- No route changes.
- No store architecture changes.
- No new localStorage schema migration framework.
- No production backend.
- No real integrations.
- No new seatmap implementation.
- No deletion of working demo flows.
- No broad refactor.
- No new DTCM/Dubai/NEN terminology.
- No pull request.
- No patch-only final result.

## Self-check
Before final report:
- Confirm 17 required PNG files exist in `public/demo/posters/`.
- Confirm no target event points to old `.svg` poster path.
- Confirm B2C published events display poster paths with `.png` for the 17 target events.
- Confirm old renamed event titles are cleaned or no longer visible after demo regeneration/enrichment.
- Confirm Михаил Стасов sorts first in B2C афиша.
- Confirm seatmap demo still opens and seat selection still works.
- Confirm open-air events do not open detailed seatmap.
- Run `npm run build`.
- Local smoke-check `/main`, `/demo`, `/admin`, `/channel`.
- Check deployment workflow status after push.
- Post-deploy smoke-check live `/main`, `/demo`, `/admin`, `/channel`.

## Acceptance
Use `ACCEPTANCE_CHECKLIST.md`.

## Final report
Return:
- changed files list;
- where the 17 PNGs were copied;
- demo content changes summary;
- B2C sorting change summary;
- cleanup/stale duplicate handling summary;
- `npm run build` result;
- local smoke-check result;
- commit SHA;
- deployment workflow / GitHub Pages result;
- live deployed URL(s);
- post-deploy smoke-check result;
- any blockers.
