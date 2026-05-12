# CODEX_TASK_03_ORGANIZER_FINANCE.md

## Stage 3

Add organizer finance model: open-event revenue, platform/Ministry commission settings, and organizer dashboard finance KPIs.

## Autonomous execution rule

Do not ask the user questions. If a preferred verification method is unavailable, use fallback verification from `CODEX_AUTONOMOUS_UI_UX_SKILL.md` and continue.

## Scope

This stage covers only:

1. Shared finance calculations needed for organizer dashboard.
2. Platform/Ministry commission percentage setting in demo tools / proto page.
3. Organizer dashboard financial KPIs.
4. Removing VAT/NDS from organizer dashboard finance cards only.

Do not change B2C branding.
Do not change ticket refund lifecycle.
Do not change Admin Event Applications layout.
Do not add organizer reporting/settlement sections in this stage; those belong to Stage 4.

## Stage-plan required before code changes

Codex must do this autonomously and must not ask the user questions.

Before changing code, identify and report:

1. exact file/component for demo tools/proto page;
2. exact state/localStorage place where new commission percent will be persisted;
3. exact organizer dashboard component;
4. exact source of ticket sales/revenue;
5. exact way refunded tickets are represented after Stage 2;
6. exact helper/calculation files to add/change.

Do not create duplicate finance state if existing app state can store this setting.

## Definitions

Open event:

- event is published/active/selling according to existing app state;
- event date/time is today or in the future;
- event has not finished/passed.

Closed event:

- event date/time is in the past or event is completed/closed according to existing app state.

Current revenue:

- sum of active/non-refunded sold tickets for open events.

Amount due:

- `current revenue × platform/ministry commission percent / 100`.

Default commission percent:

- Use existing value if already present.
- If absent, default to `5`.

Persist this setting in the same localStorage/app-state model used by demo tools.

## Functional requirements

### 1. Demo tools / proto page commission settings

Add small settings block near existing demo tools such as `Загрузить mock-данные`, `Очистить mock-данные`, `Запустить демо-сценарий`.

Required UI:

- Block title: `Настройки финансовой модели`
- Field label: `Процент платформы / Минкульта`
- Value: numeric percent, default `5`
- Hint: `Используется для расчёта начислений организатора по проданным билетам.`

Behavior:

- Changing percent updates calculations in organizer dashboard.
- Value persists in localStorage/app state.
- Must not reset mock data.
- Must not require backend.
- Must not break existing demo tools.
- Percent must be clamped or validated to a sensible numeric range using existing UI patterns; do not allow NaN.

### 2. Organizer dashboard KPIs

Replace weak/useless organizer dashboard metrics with finance-focused metrics.

Required KPIs for organizer dashboard:

1. `Текущая выручка`
   - revenue from open events only;
   - count only non-refunded sold tickets.

2. `Продано билетов`
   - sold tickets from open events only;
   - count only non-refunded tickets.

3. `К уплате платформе`
   - amount due using configured percent;
   - visible wording: `К уплате платформе`.

4. `Открытые мероприятия`
   - count of open events.

Do not show VAT/NDS on organizer dashboard finance cards.

### 3. Calculation consistency

Calculations must use same ticket/sale state that ticket refunds update.

Required behavior:

- refunded tickets are excluded from revenue;
- refunded tickets are excluded from sold count;
- commission amount recalculates after refund;
- changing percent recalculates amount due immediately or on next render.

## Acceptance

1. Demo tools/proto page has `Настройки финансовой модели` block.
2. Commission percent defaults to 5 if no value exists.
3. Changing percent persists in localStorage/app state.
4. Organizer dashboard shows current revenue for open events.
5. Organizer dashboard shows sold tickets for open events.
6. Organizer dashboard shows amount due calculated from revenue × percent.
7. Organizer dashboard finance cards do not show VAT/NDS.
8. Refunded tickets are excluded from organizer dashboard revenue.
9. Closed/past events are excluded from open-event current revenue.
10. `npm run build` passes.

## Required checks

Run all required checks from `CODEX_AUTONOMOUS_UI_UX_SKILL.md`.

Additionally verify scenario:

1. Load mock data.
2. Confirm organizer dashboard has open-event revenue.
3. Change commission percent from 5 to another value.
4. Confirm amount due changes accordingly.
5. Refund a ticket from an open future event if Stage 2 exists.
6. Confirm organizer dashboard revenue and amount due decrease.

## Commit

Commit message:

```text
stage 3: add organizer finance and platform commission settings
```
