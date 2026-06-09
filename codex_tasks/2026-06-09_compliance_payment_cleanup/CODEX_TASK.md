# Task

## Goal

Clean up the event compliance application UX in two areas:

1. Remove duplicated application-list noise from the 9-step application detail flow.
2. Rework step 8 "Пошлинные платежи" into a clear, always-visible fee receipt.
3. Polish the admin event applications table action button and status badge.

## Product context

This is a demo-first government platform prototype. The goal is a convincing end-to-end demo, not production backend depth.

The 9-step event compliance interface must stay intact. This task only removes distracting duplicated UI and improves readability.

Step 8 is not a payment gateway. It is a visible demonstration of fee calculation and payment status. The calculation must be understandable before submission/payment.

## Approved scope

### 1. Event compliance application detail flow: remove repeated "Мои заявки"

Find the block/list titled or labelled "Мои заявки" that appears at the bottom of every step inside the 9-step event compliance application detail flow.

Remove this repeated bottom block from all application detail steps.

The user is already inside one specific application, so this bottom list must not appear inside the stages.

Keep normal standalone application list pages intact. Do not delete the actual application list screens where listing applications is the primary purpose.

### 2. Step 8 "Пошлинные платежи": remove noisy summary cards

On step 8, remove the whole upper summary card grid above "Детализация расчёта".

The removed cards include these visible labels:

- "Статус"
- "Ставка"
- "Начислено"
- "Расчёт"
- "Основание"
- "Следующее действие"
- "Площадка"
- "Формат"
- "Проектная вместимость"
- "Категория мероприятия"

Remove the show/hide calculation button:

- "Скрыть расчёт"
- "Показать расчёт"

The calculation details must always be visible.

### 3. Step 8 "Пошлинные платежи": make calculation details the main block

Move/keep "Детализация расчёта" directly below the step title and explanatory text.

The desired visual logic is a restaurant receipt:

- line item / position;
- parameter;
- rate;
- amount;
- total at the bottom.

Keep the existing calculation data and formulas. Do not change fee business logic.

This must work for both existing modes, if present in current code:

- extended demo calculation;
- current-law/basic calculation.

Do not invent a new calculation mode.

### 4. Step 8 "Пошлинные платежи": keep only compact payment summary after the receipt

Below the calculation details, but above the current balance/payment controls, show only two compact secondary info cards/chips:

1. "Статус" with value such as "Ожидает оплаты".
2. "Начислено" with the charged amount, such as "714.00 BYN".

These two cards must be visually secondary and must not dominate the calculation table.

Do not show the removed cards elsewhere on the step.

### 5. Admin Center → "Заявки мероприятий" table

In the event applications table in Центр Управления:

- Replace the action button text "Открыть 9 этапов" with "Открыть".
- Fix the layout of the "На проверке" status badge.

The badge must render as a clean compact chip:

- no broken/cropped background;
- no ugly two-line split unless the table width makes it unavoidable;
- no cramped blue rectangle inside another broken shape;
- readable text;
- consistent with existing chip/badge styling.

Do not change status meanings or filters.

## Out of scope

- Routes.
- Auth.
- Roles.
- Header/sidebar/menu.
- Branding.
- Store/localStorage.
- Business logic of fee calculation.
- Payment gateway.
- Real payments.
- New entities.
- New stages.
- New application flows.
- New design system.
- Global redesign.

## Files / areas to inspect first

Do not guess owning files. Search current source for these visible strings and inspect the owning components before editing:

- "Пошлинные платежи"
- "Скрыть расчёт"
- "Показать расчёт"
- "Детализация расчёта"
- "Мои заявки"
- "Открыть 9 этапов"
- "На проверке"

Also inspect components/styles used for existing badges/chips/buttons before changing the broken status badge.

## Implementation requirements

- Use the current components and styling patterns where possible.
- Make minimal targeted changes.
- Keep the current dark visual style.
- Keep the current 9-step structure.
- Do not change data shape unless a purely display-only field already exists and is necessary. Prefer avoiding data changes.
- Do not change calculation functions, constants, or formulas.
- Do not introduce hidden toggles for the calculation details.
- Do not leave dead show/hide state if it becomes unused.
- Remove unused imports/state only when they are directly made unused by this task.

## UX/content requirements

- Inside the 9-step application detail flow, the page must feel focused on the active application.
- Step 8 must visually read as a fee receipt/check, not as a dashboard of cards.
- The calculation details must be visible without user interaction.
- Payment status and charged amount are supporting information after the receipt.
- The admin table action must be short: "Открыть".
- The admin table status badge must be clean, compact, and aligned.

## Data/demo requirements

- Preserve all existing demo application records.
- Preserve existing fee amounts and calculation outputs.
- Preserve existing statuses.
- Preserve existing payment/balance demo behavior.

## Forbidden changes

- Do not rename routes.
- Do not add routes.
- Do not change store/localStorage behavior.
- Do not change fee calculation business logic.
- Do not change the number/order/meaning of the 9 stages.
- Do not change auth, roles, permissions.
- Do not change sidebar/header/menu/branding.
- Do not create new entities.
- Do not create a new payment flow.
- Do not add DTCM/Dubai/NEN terms.
- Do not create PR or commit.

## Self-check

After implementation, verify:

- [ ] Search for "Мои заявки" and confirm it no longer appears inside the 9-step event compliance application detail stages.
- [ ] Standalone application list pages still exist and still show application lists where appropriate.
- [ ] Step 8 shows "Детализация расчёта" directly under the title/description.
- [ ] Step 8 calculation details are always visible.
- [ ] Step 8 no longer has "Скрыть расчёт" or "Показать расчёт".
- [ ] Step 8 no longer shows the removed top summary cards.
- [ ] Step 8 still shows compact "Статус" and "Начислено" below the calculation details and above balance/payment controls.
- [ ] Existing calculated amounts are unchanged.
- [ ] Admin event applications table button says "Открыть".
- [ ] "На проверке" badge renders cleanly and consistently.
- [ ] No visible new English UI text was added.
- [ ] npm run build passes.

## Acceptance

The task is complete only when all points below are true:

- Repeated bottom "Мои заявки" is removed from all 9-step application detail screens.
- Step 8 is simplified: calculation details are the first and main content block.
- Step 8 has no calculation show/hide button.
- Step 8 has no noisy summary card grid above the receipt.
- Step 8 keeps only compact status and charged amount summary below the receipt.
- Admin table button text is "Открыть".
- Admin table "На проверке" badge is visually fixed.
- npm run build passes.

## Final report

Return:

1. Changed files list.
2. Confirmation of self-check results.
3. npm run build result.
4. Unified diff/patch.
