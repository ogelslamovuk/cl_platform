Title:
Iteration 2 — Финансовый счёт и баланс организатора

Body:
Implement Iteration 2 according to repository files:

- SKILLS.md
- CL_PLATFORM_CONTEXT.md
- CODEX_TASK_ITERATION_02.md
- CODEX_ACCEPTANCE_CHECKLIST_ITERATION_02.md
- CODEX_DELIVERY.md

Main objective:

Build a cross-module mock financial account flow for the organizer:

Organizer dashboard -> Баланс -> Финансовый счёт -> Пошлины и платежи in event application -> payment status in Control Center -> approval available only after required fees are paid.

Hard requirements:

- replace organizer dashboard “К оплате платформе” or equivalent with “Баланс”;
- balance card must open “Финансовый счёт”;
- mock top-up must work;
- fees must be payable from balance;
- submitted application may be unpaid;
- unpaid application is visible in Control Center as “Ожидает оплаты”;
- unpaid application cannot be approved;
- paid application can be approved;
- no debt/overdue concept in UI or new model;
- no real payment gateway;
- no bank integration;
- no post-event settlement;
- preserve Iteration 1 wizard and existing module links;
- all new UI text Russian;
- all new non-obvious fields/actions have tooltips/help;
- final result must be merged and deployed to GitHub Pages.
