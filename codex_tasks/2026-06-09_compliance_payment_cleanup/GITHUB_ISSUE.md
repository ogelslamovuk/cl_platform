Title:
Cleanup compliance payment step and event applications table

Goal:
Make the 9-step event compliance flow cleaner and more credible for demo by removing duplicated application lists, making fee calculation the main focus of step 8, and fixing the admin event applications table controls.

Why:
The current UI distracts from the active application: the bottom "Мои заявки" list repeats inside every step, step 8 is overloaded with low-value summary cards, and the admin table has a broken status badge plus an overlong action label. This weakens demo credibility.

Scope:
- Remove the repeated bottom "Мои заявки" block from all steps inside the event compliance application detail flow.
- Rework step 8 "Пошлинные платежи" so the fee calculation details are always visible and placed first.
- Remove the useless summary card grid and show only compact payment status and charged amount after the calculation details.
- In Центр Управления → Заявки мероприятий, rename the action button from "Открыть 9 этапов" to "Открыть".
- Fix the layout of the "На проверке" status badge.

Out of scope:
- Routes, auth, roles, sidebar/header/menu.
- Store/localStorage/data model changes.
- Fee calculation business logic.
- Payment gateway or real payment flow.
- New entities, new stages, new application flows.
- Global redesign.

Acceptance:
- The repeated "Мои заявки" block is gone from every 9-step application detail screen.
- Step 8 opens with the fee calculation details directly under the step title/description.
- Step 8 no longer shows the marked summary cards and no longer has a show/hide calculation button.
- Step 8 still displays payment status and charged amount, but only as compact secondary info below the calculation details and above balance/payment controls.
- The admin event applications action button says "Открыть".
- The "На проверке" badge renders cleanly as a compact chip without broken wrapping/cropping.
- npm run build passes.
