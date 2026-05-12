# CODEX_TASK_01_UI_AND_MOCK_FIXES.md

## Stage 1

Fix organizer poster upload UI, broken Admin Event Applications layout, Admin Dashboard new-application counting, and mock-data today event.

## Autonomous execution rule

Do not ask the user questions. If a preferred verification method is unavailable, use fallback verification from `CODEX_AUTONOMOUS_UI_UX_SKILL.md` and continue.

## Scope

This stage covers only:

1. Organizer event application poster UI.
2. Admin Center → Event Applications layout.
3. Admin Dashboard counters/list logic for submitted applications.
4. Demo/mock-data seed for one event occurring today and almost sold out.

Do not implement ticket refunds, organizer finance, B2C branding, or settlement reports in this stage.

## Stage-plan required before code changes

Codex must do this autonomously and must not ask the user questions.

Before changing code, identify and report:

1. exact component/file for organizer compliance poster section;
2. exact component/file for Admin Event Applications;
3. exact component/file for Admin Dashboard KPI/list logic;
4. exact file/function for mock-data loading;
5. exact state fields used for application status and event date/tickets.

Then change only files needed for this stage.

## Functional requirements

### 1. Organizer application poster UI

Current problem: organizer event application form shows a gallery/library of unrelated demo posters.

Required behavior:

- Remove the ready-made poster gallery/library from organizer event application form.
- Keep only uploading/selecting the organizer’s own event poster.
- Keep a preview area.
- If no poster is selected, preview should clearly say that the poster is not selected.
- Keep existing mock/demo upload behavior if upload is not real.
- Do not add backend upload.
- Do not add storage outside existing app state/localStorage approach.
- Do not leave hidden/demo poster selection logic connected to this organizer form.

Expected UI copy in Russian:

- Section title: `Постер мероприятия`
- Primary action: `Загрузить свой постер`
- Empty preview: `Постер не выбран`
- File hint: `JPG, PNG, WEBP или SVG, до 5 МБ. Рекомендуемый размер — 1200×750 px.`

Acceptance:

- Organizer cannot choose from unrelated demo posters.
- Only own poster upload/select action remains.
- Preview still works if previous implementation supported preview.
- Screenshot of `#/organizer/compliance` confirms no demo poster gallery.

### 2. Admin Center → Event Applications layout

Current problem: `Заявки на проведение мероприятий` layout is severely broken. Row content and action controls are visually misaligned and spread across the screen.

Required behavior:

- Fix layout so each application row/card is readable and aligned.
- Action area must remain visually attached to the corresponding application row.
- Table/card must not create huge vertical empty gaps inside rows.
- Row must not be split into unrelated visual layers.
- User must understand which actions belong to which application.
- Keep approve/return/reject controls functional.
- Keep existing fields unless they are duplicated by mistake.

Do not change business logic of approve/return/reject.
Do not hide required controls.

Acceptance:

- In Admin Center → `Заявки на проведение мероприятий`, application rows are visually compact and aligned.
- Row with status `Отправлена` is visible as a normal row/card.
- Action buttons are not floating detached from their row.
- Screenshot confirms layout is not broken.

### 3. Admin Dashboard new applications

Current problem: event application with status `Отправлена` is not counted as new application on Dashboard.

Required behavior:

- Treat event applications with status `Отправлена` as new/unprocessed applications.
- KPI `Новые заявки` must include those applications.
- Block `Последние заявки` must show submitted applications, not only approved applications.
- Keep approved applications visible where existing logic expects recent application history.
- Do not rename statuses in storage unless existing app already has status mapping.

Acceptance:

- After creating/submitting an event application, Dashboard `Новые заявки` becomes greater than 0.
- Submitted application appears in `Последние заявки` with status `Отправлена`.
- Existing approved demo applications still display correctly.

### 4. Mock data: event today

Current problem: Dashboard block `События сегодня` can be empty after loading mock data.

Required behavior:

- `Загрузить mock-данные` must always add or update one demo event with date equal to current local calendar date.
- Event must have small capacity.
- Event must be almost sold out.
- Event must appear in Dashboard block `События сегодня`.
- Event must affect issued tickets/sold tickets/revenue consistently with existing demo state.
- Seed must be idempotent: repeated loading updates/upserts the same today event, not unlimited duplicates.
- Use deterministic ID for this event, for example `demo_event_today`, unless project already has a better deterministic ID convention.

Suggested demo event content:

- Title: `Камерный концерт «Песня роднай зямлі»`
- Venue/city: Minsk or regional cultural venue.
- Capacity: 40–80 tickets.
- Sold: 90–98% of capacity.
- Status: published/active, compatible with existing Dashboard logic.
- Date: current local calendar date.

Acceptance:

- After `Загрузить mock-данные`, Dashboard block `События сегодня` is not empty.
- It shows at least one event dated today.
- Event has near sold-out ticket statistics.
- Re-running mock load does not create duplicate today events.

## Required checks

Run all required checks from `CODEX_AUTONOMOUS_UI_UX_SKILL.md`.

Additionally verify through browser/screenshot:

1. `#/organizer/compliance`: poster section has no unrelated demo poster gallery.
2. `#/admin`: Event Applications layout is readable.
3. `#/admin`: Dashboard `Новые заявки` reacts to submitted applications.
4. `#/admin`: Dashboard `События сегодня` is populated after mock data load.

## Commit

Commit message:

```text
stage 1: fix organizer posters, admin applications and today mock event
```
