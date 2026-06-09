# Context

`cl_platform` is a demo-first prototype of a state platform for managing the cultural and public events market.

The core demo chain must stay intact:

```text
Кандидат в организаторы -> Организатор -> Заявка на мероприятие -> Центр Управления -> Одобренное событие -> Реселлеры / розница / билеты
```

The DTCM/Dubai materials are product references only. Do not create Dubai/DTCM/NEN entities, terms, routes, or UI language.

Use existing project concepts/entities only, including:
- OrganizerAccount
- OrganizerApplicationRecord
- EventComplianceApplicationRecord
- EventComplianceData
- EventRecord
- Ticket
- Reseller
- OpRecord
- VenueRegistryRecord
- AppState

Visible UI text must remain Russian.

Design style must remain the current dark premium admin/demo style. This task is cleanup and polish, not redesign.

# Product decision for this task

Inside a specific event compliance application, the user must focus on the active application and its current step. A repeated bottom list of "Мои заявки" inside every stage is not useful and must be removed from the application detail flow.

Step 8 "Пошлинные платежи" must behave like a clear fee receipt: the fee calculation details are the main content. Summary cards above the calculation create noise and duplicate information. The calculation must always be visible.

The admin event applications table must look clean and operational: action label should be short, and status badges must not break visually.

# Screenshots included

- screenshots/01_step8_current_top_cards.png — current step 8 with noisy top summary cards.
- screenshots/02_step8_remove_marked_blocks.png — marked blocks to remove from step 8.
- screenshots/03_admin_event_applications_status_button.png — admin table where "На проверке" badge and "Открыть 9 этапов" button need correction.
