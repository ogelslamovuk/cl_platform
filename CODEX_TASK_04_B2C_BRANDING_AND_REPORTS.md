# CODEX_TASK_04_B2C_BRANDING_AND_REPORTS.md

## Stage 4

Update B2C demo portal branding and organizer settlement reporting.

## Autonomous execution rule

Do not ask the user questions. If a preferred verification method is unavailable, use fallback verification from `CODEX_AUTONOMOUS_UI_UX_SKILL.md` and continue.

## Scope

This stage covers only:

1. B2C demo portal top branding/copy.
2. Organizer reporting replacement of VAT/NDS with settlement-style reporting.
3. Basic open/closed event financial report sections.

Do not change ticket refund lifecycle.
Do not change mock-data seeding.
Do not change Admin Center application layout.
Do not rewrite finance calculations from Stage 3; reuse them.

## Stage-plan required before code changes

Codex must do this autonomously and must not ask the user questions.

Before changing code, identify and report:

1. exact component/file for B2C demo portal header/title;
2. exact organizer reporting component/file;
3. exact helper/calculation from Stage 3 that will be reused;
4. exact visible strings that will be removed/replaced;
5. exact route screenshots that will prove the changes.

## Functional requirements

### 1. B2C demo portal branding/copy

Current problem: B2C demo portal has unclear/prototype-heavy labels such as:

- `CL Platform`
- `B2C афиша`
- `Покупка демо-билета`
- `demo purchase flow`

Required behavior:

- Replace these labels only in B2C demo portal/header/purchase area.
- Do not globally replace `CL Platform` outside B2C route unless that exact text appears in B2C shared component.
- Keep bottom/remaining content unchanged unless it directly repeats unwanted labels.
- It should be clear this is a retail ticket storefront prototype, but without noisy English demo labels.

Required visible branding:

- Main brand: `CinemaLab`
- Subline: `прототип билетной платформы`
- Page title: `Афиша мероприятий`
- Purchase section title: `Покупка билета`

Remove visible `demo purchase flow` text.
Remove visible `CL Platform` from top-left B2C header.

Acceptance:

- Top-left B2C header no longer says `CL Platform`.
- Page no longer shows `B2C афиша` as main identity.
- Page no longer shows `Покупка демо-билета`.
- Page no longer shows `demo purchase flow`.
- CinemaLab prototype branding is visible.

### 2. Organizer reporting: remove VAT/NDS

Organizer reporting must not show VAT/NDS as a financial metric.

Required behavior:

- Remove visible `НДС` / `VAT` from organizer reporting screens.
- Replace with platform/Ministry settlement fields.
- Keep ticket sales/revenue/count reporting intact.
- Do not remove unrelated legal/static text if it is not organizer finance/reporting UI.

Suggested labels:

- `Выручка`
- `Продано билетов`
- `Комиссия платформы`
- `К уплате платформе`
- `Процент платформы / Минкульта`

### 3. Organizer settlement report sections

Add or update organizer report sections to show:

1. `Открытые мероприятия`
   - events that are published/selling and not yet passed;
   - revenue;
   - sold tickets;
   - amount due by configured percent.

2. `Закрытые мероприятия`
   - events that already passed/closed;
   - revenue;
   - sold tickets;
   - amount due by configured percent.

3. `Оплачено`
   - can remain demo/mock value at this stage if no real invoice/payment lifecycle exists;
   - do not create fake complex invoice system.

4. `Остаток к оплате`
   - calculated as amount due minus paid demo/mock value, if paid value exists;
   - otherwise show amount due and make it clear payments are not modeled yet using short UI hint.

Do not implement real invoice issuing/payment if it does not already exist.

### 4. Consistency with Stage 3

Use commission percent from Stage 3 settings.

Required behavior:

- reporting amount due changes when commission percent changes;
- refunded tickets are excluded from revenue if Stage 2 refund state exists;
- open/closed classification is consistent with Stage 3.

## Acceptance

1. B2C top-left branding shows CinemaLab prototype identity.
2. `CL Platform` is not visible in B2C header.
3. `Покупка демо-билета` is not visible.
4. `demo purchase flow` is not visible.
5. Organizer reporting has no visible VAT/NDS metric.
6. Organizer reporting shows open event settlement section.
7. Organizer reporting shows closed event settlement section.
8. Organizer reporting uses configured commission percent.
9. Refunded tickets are excluded from settlement revenue.
10. `npm run build` passes.

## Required checks

Run all required checks from `CODEX_AUTONOMOUS_UI_UX_SKILL.md`.

Additionally verify through browser/screenshot:

1. `#/demo` branding/copy after changes.
2. `#/organizer` reporting/dashboard after changes.
3. Commission percent from demo tools affects reporting.
4. No `НДС`/`VAT` appears in organizer-facing finance/report screens, except unrelated static legal text.

## Commit

Commit message:

```text
stage 4: update b2c branding and organizer settlement reports
```
